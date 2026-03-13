"""Polymarket API integration and prediction logic."""

import asyncio
import json
import logging
from datetime import datetime
import httpx

from core.database import get_async_session
from core.models import PolymarketPrediction
from core.config import get_settings
from sqlalchemy import select

logger = logging.getLogger(__name__)

GAMMA_API_URL = "https://gamma-api.polymarket.com"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"


async def get_active_markets(limit: int = 15) -> list[dict]:
    """Fetch top active markets from Polymarket based on volume/liquidity."""
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            # We want crypto/volume heavy markets, but the simplest is just active=true
            resp = await client.get(f"{GAMMA_API_URL}/markets?active=true&closed=false&limit={limit}")
            if resp.status_code == 200:
                markets = resp.json()
                # Ensure they have valid clobTokenIds
                valid_markets = [m for m in markets if m.get("clobTokenIds") and len(m["clobTokenIds"]) >= 2]
                return valid_markets
            else:
                logger.error(f"Failed to fetch polymarket markets: {resp.status_code}")
                return []
        except Exception as e:
            logger.error(f"Error fetching polymarket markets: {e}")
            return []

async def get_market_prices(market_id: str) -> dict:
    """Fetch current prices for a specific condition/market"""
    # gamma API has /markets/{condition_id} or we can just fetch it with active markets
    async with httpx.AsyncClient(timeout=30) as client:
         try:
             # Often condition_id works as the market identifier in Gamma API 
             resp = await client.get(f"{GAMMA_API_URL}/markets/{market_id}")
             if resp.status_code == 200:
                 return resp.json()
             return {}
         except Exception as e:
             logger.error(f"Error fetching price for {market_id}: {e}")
             return {}


async def analyze_polymarket_with_claude(markets: list[dict], claude_api_key: str) -> list[dict]:
    """Use Claude to evaluate markets and provide a prediction."""
    now_utc = datetime.utcnow().isoformat()
    
    # Prep market payload
    market_list = []
    for m in markets:
        market_list.append({
            "id": m.get("condition_id"),
            "question": m.get("question"),
            "description": m.get("description", "")[:200], # Trim to save tokens
            "outcomes": m.get("outcomes", ["Yes", "No"]),
            "outcomePrices": m.get("outcomePrices", []),
            "volume": m.get("volume", 0)
        })
    
    market_payload = json.dumps(market_list, ensure_ascii=False)
    
    system_prompt = """You are CryptoPulse AI Polymarket Predictor.
Your task is to analyze the following Polymarket questions and create quantitative predictions.
You must output a strict JSON list of prediction objects. DO NOT output any markdown wrappers.

Response Format (JSON List of objects):
[
  {
     "market_id": "condition_id-string",
     "question": "The question",
     "predicted_outcome": "Yes", // Must be one of the outcomes provided (usually 'Yes' or 'No')
     "confidence": 85, // Integer 0-100 indicating confidence
     "bet_amount": 50 // Floating point, recommended virtual bet amount in USD based on confidence (e.g. 10 to 100)
  }
]"""

    user_prompt = f"""CURRENT UTC TIME: {now_utc}.
ACTIVE MARKETS:
{market_payload}

CRITICAL INSTRUCTION: Analyze the feasibility of these events. If you have no idea or the event is completely unpredictable random chance, output confidence < 50 and bet_amount 0. If you have a solid thesis, output confidence > 70 and bet_amount > 20. Output ONLY valid JSON array."""

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            CLAUDE_API_URL,
            headers={
                "x-api-key": claude_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-3-5-sonnet-20241022",
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
        )

        if resp.status_code != 200:
            err_text = resp.text[:500]
            logger.error(f"Claude API error Polymarket: {resp.status_code} - {err_text}")
            return []

        data = resp.json()
        text = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                text = block.get("text", "")
                break

        # Clean markdown if present
        text = text.replace("```json", "").replace("```", "").strip()
        
        try:
             predictions = json.loads(text)
             return predictions if isinstance(predictions, list) else []
        except json.JSONDecodeError as e:
             logger.error(f"Failed to parse Claude Polymarket JSON: {e}\n{text}")
             return []


async def run_polymarket_predictions_job():
    """Daily 8 AM job to predict new markets."""
    logger.info("=== Starting daily Polymarket Predictions (8 AM) ===")
    settings = get_settings()
    
    if not settings.CLAUDE_API_KEY:
         logger.warning("CLAUDE_API_KEY not set. Skipping Polymarket Job.")
         return
         
    # 1. Fetch active markets
    markets = await get_active_markets(limit=20)
    if not markets:
        logger.info("No active markets found.")
        return
        
    logger.info(f"Fetched {len(markets)} markets. Running AI analysis...")
    
    # 2. Analyze with AI
    predictions = await analyze_polymarket_with_claude(markets, settings.CLAUDE_API_KEY)
    
    if not list(predictions):
         logger.info("No predictions generated.")
         return
         
    logger.info(f"[Polymarket AI] Generated {len(predictions)} predictions. Saving to DB...")

    # 3. Save to DB
    async_session = get_async_session()
    async with async_session() as session:
        for pred in predictions:
             market_id = pred.get("market_id")
             question = pred.get("question", "Unknown")
             
             if not market_id:
                 logger.warning(f"[Polymarket DB] Prediction missing market_id: {pred}")
                 continue
             
             # Locate original market for initial prices
             original_market = next((m for m in markets if m.get("condition_id") == market_id), None)
             
             yes_price = None
             no_price = None
             
             if original_market:
                 outcomes = original_market.get("outcomes", [])
                 prices = original_market.get("outcomePrices", [])
                 if "Yes" in outcomes and len(prices) == len(outcomes):
                     try: yes_price = float(prices[outcomes.index("Yes")])
                     except: pass
                 if "No" in outcomes and len(prices) == len(outcomes):
                     try: no_price = float(prices[outcomes.index("No")])
                     except: pass
             
             # Check if prediction already exists for this market to avoid duplicates
             from sqlalchemy.sql import text
             result = await session.execute(
                 select(PolymarketPrediction).where(PolymarketPrediction.market_id == market_id)
             )
             existing = result.scalar_one_or_none()
             
             if existing:
                 # Update confidence if higher
                 if pred.get("confidence", 0) > existing.confidence:
                     logger.info(f"[Polymarket DB] Updating EXISTING prediction: {question} (New Conf: {pred.get('confidence')}%)")
                     existing.confidence = pred.get("confidence", 0)
                     existing.bet_amount = pred.get("bet_amount", 0.0)
                     existing.predicted_outcome = pred.get("predicted_outcome", "Yes")
             else:
                 logger.info(f"[Polymarket DB] Saving NEW prediction: {question} -> {pred.get('predicted_outcome')} ({pred.get('confidence')}%)")
                 new_pred = PolymarketPrediction(
                     market_id=market_id,
                     question=pred.get("question", "Unknown Question"),
                     predicted_outcome=pred.get("predicted_outcome", "Yes"),
                     confidence=pred.get("confidence", 0),
                     bet_amount=pred.get("bet_amount", 0.0),
                     current_yes_price=yes_price,
                     current_no_price=no_price,
                     status="active"
                 )
                 session.add(new_pred)
                 
        await session.commit()
    logger.info("=== Finished Polymarket Predictions Job ===")


async def update_polymarket_prices_job():
    """Hourly job to update prices and resolve markets."""
    logger.info("=== Starting hourly Polymarket price update/resolution ===")
    
    async_session = get_async_session()
    async with async_session() as session:
        # Get active predictions
        result = await session.execute(
            select(PolymarketPrediction).where(PolymarketPrediction.status == "active")
        )
        active_preds = result.scalars().all()
        
        if not active_preds:
             logger.info("No active predictions to update.")
             return
             
        logger.info(f"Updating {len(active_preds)} active predictions...")
        
        for pred in active_preds:
             logger.info(f"[Polymarket Update] Fetching latest for: {pred.question[:50]}...")
             market_data = await get_market_prices(pred.market_id)
             if not market_data:
                 logger.warning(f"[Polymarket Update] Failed to get data for ID: {pred.market_id}")
                 continue
                  
             # Update prices
             outcomes = market_data.get("outcomes", [])
             prices = market_data.get("outcomePrices", [])
             
             old_yes = pred.current_yes_price or 0
             old_no = pred.current_no_price or 0
             
             if "Yes" in outcomes and len(prices) == len(outcomes):
                 try: pred.current_yes_price = float(prices[outcomes.index("Yes")])
                 except: pass
             if "No" in outcomes and len(prices) == len(outcomes):
                 try: pred.current_no_price = float(prices[outcomes.index("No")])
                 except: pass
                 
             # Update price history (Snapshots)
             history = []
             if pred.price_history:
                 try: history = json.loads(pred.price_history)
                 except: history = []
             
             # Determine "matched" for this snapshot
             matched = None
             if history:
                 last = history[-1]
                 if pred.predicted_outcome == "Yes":
                     if pred.current_yes_price and last.get("yes_price"):
                         matched = pred.current_yes_price >= last["yes_price"]
                 elif pred.predicted_outcome == "No":
                     if pred.current_no_price and last.get("no_price"):
                         matched = pred.current_no_price >= last["no_price"]
             
             history.append({
                 "timestamp": datetime.utcnow().isoformat(),
                 "yes_price": pred.current_yes_price,
                 "no_price": pred.current_no_price,
                 "matched": matched
             })
             
             # Keep only last 48 hours of history to save DB space
             if len(history) > 48: history = history[-48:]
             pred.price_history = json.dumps(history)
             
             logger.info(f"[Polymarket Update] {pred.question[:30]}: Yes ${old_yes:.3f}->${pred.current_yes_price or 0:.3f}, No ${old_no:.3f}->${pred.current_no_price or 0:.3f} | Matched: {matched}")
                 
             # Check if resolved
             closed = market_data.get("closed", False)
             active = market_data.get("active", True)
             
             if closed or not active:
                 logger.info(f"[Polymarket Resolve] Market CLOSED/INACTIVE: {pred.question}")
                 pred.status = "resolved"
                 pred.resolved_at = datetime.utcnow()
                 
                 yes_p = pred.current_yes_price or 0.0
                 no_p = pred.current_no_price or 0.0
                 
                 # Simple resolution logic based on final price
                 actual_outcome = "Unknown"
                 if yes_p > 0.9: actual_outcome = "Yes"
                 elif no_p > 0.9: actual_outcome = "No"
                 
                 logger.info(f"[Polymarket Resolve] Final Prices: Yes ${yes_p:.3f}, No ${no_p:.3f} | Final Outcome: {actual_outcome}")
                 
                 if pred.predicted_outcome == actual_outcome:
                     logger.info(f"[Polymarket Resolve] SUCCESS! AI predicted {pred.predicted_outcome} correctly.")
                     pred.worked_out = True
                 elif actual_outcome != "Unknown":
                     logger.info(f"[Polymarket Resolve] FAILED. AI predicted {pred.predicted_outcome}, but market resolved {actual_outcome}.")
                     pred.worked_out = False
                 else:
                     logger.warning("[Polymarket Resolve] Resolution status UNKNOWN (prices inconsistent).")
                      
        await session.commit()
    logger.info("=== Finished Polymarket Hourly Update Job ===")
