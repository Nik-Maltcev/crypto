"""Automated analysis pipeline.

Runs the full data collection + AI analysis server-side:
1. Reddit (OAuth) — top subreddits
2. CoinMarketCap — market prices
3. Gemini 2.5 Pro — data filtering
4. Claude Opus 4.6 — final analysis

Results are stored in the AnalysisLog database table.
"""

import asyncio
import json
import logging
from datetime import datetime

import httpx

from core.config import get_settings
from core.database import get_async_session
from core.models import AnalysisLog

logger = logging.getLogger(__name__)

# Default subreddits for scheduled analysis
DEFAULT_SUBREDDITS = [
    "CryptoCurrency", "Bitcoin", "ethereum", "solana",
    "CryptoMarkets", "altcoin", "defi", "ethtrader",
    "binance", "cardano", "dogecoin", "SatoshiStreetBets",
    "CryptoMoonShots", "Ripple", "litecoin", "Polkadot",
]

CMC_API_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


async def _fetch_reddit_posts(subreddits: list[str], reddit_token: str) -> list[dict]:
    """Fetch recent posts from Reddit using OAuth token."""
    import time
    all_posts = []
    one_day_ago = time.time() - (24 * 3600)

    async with httpx.AsyncClient(timeout=30) as client:
        for sub in subreddits:
            try:
                resp = await client.get(
                    f"https://oauth.reddit.com/r/{sub}/new.json?limit=50",
                    headers={
                        "Authorization": f"Bearer {reddit_token}",
                        "User-Agent": "CryptoPulseAI/1.0",
                    },
                )
                if resp.status_code != 200:
                    logger.warning(f"Reddit r/{sub}: {resp.status_code}")
                    continue

                data = resp.json()
                children = data.get("data", {}).get("children", [])
                for child in children:
                    p = child.get("data", {})
                    created = p.get("created_utc", 0)
                    if created < one_day_ago:
                        continue
                    if "Daily Discussion" in (p.get("title") or ""):
                        continue
                    all_posts.append({
                        "title": p.get("title", ""),
                        "selftext": (p.get("selftext") or "")[:500],
                        "subreddit": p.get("subreddit", sub),
                        "score": p.get("score", 0),
                    })
            except Exception as e:
                logger.warning(f"Reddit r/{sub} error: {e}")

    # Sort by score
    all_posts.sort(key=lambda x: x.get("score", 0), reverse=True)
    return all_posts


async def _get_reddit_token(client_id: str, client_secret: str) -> str:
    """Get Reddit OAuth token."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.reddit.com/api/v1/access_token",
            auth=(client_id, client_secret),
            data={"grant_type": "client_credentials"},
            headers={"User-Agent": "CryptoPulseAI/1.0"},
        )
        data = resp.json()
        if "access_token" not in data:
            raise RuntimeError(f"Reddit OAuth failed: {data}")
        return data["access_token"]


async def _fetch_market_data(cmc_api_key: str) -> str:
    """Fetch CoinMarketCap market context string."""
    target_symbols = {"BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "AVAX"}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{CMC_API_URL}?start=1&limit=100&convert=USD&CMC_PRO_API_KEY={cmc_api_key}",
            headers={"Accept": "application/json"},
        )
        if resp.status_code != 200:
            return "MARKET CONTEXT: Data unavailable."

        data = resp.json().get("data", [])
        lines = ["MARKET CONTEXT (Key Assets):"]
        for coin in data:
            symbol = coin.get("symbol", "").upper()
            q = coin.get("quote", {}).get("USD", {})
            mc = q.get("market_cap", 0)
            if symbol in target_symbols or mc > 50_000_000_000:
                price = q.get("price", 0)
                p_str = f"{price:.4f}" if price < 1 else f"{price:.2f}"
                c24 = q.get("percent_change_24h", 0)
                c7d = q.get("percent_change_7d", 0)
                lines.append(f"{symbol}: ${p_str} (24h: {c24:.1f}%, 7d: {c7d:.1f}%)")

        return "\n".join(lines)


async def _filter_with_gemini(posts: list[dict], gemini_api_key: str) -> str:
    """Use Gemini to filter and compress Reddit data."""
    reddit_payload = json.dumps(posts[:300], ensure_ascii=False)  # Cap at 300 posts

    prompt = f"""INPUT RAW DATA:
--- REDDIT ---
{reddit_payload}

TASK:
You are the FIRST STAGE of a two-stage AI pipeline. Read all the above raw social media data from the last 24 hours, and compress it into a dense, highly informative analysis context that will be passed to Claude for final processing.
Filter out all spam, useless hype, unrelated chatter, and noise.
Extract only the FACTUAL sentiment, warnings, news, and genuine community feelings about: BTC, ETH, XRP, SOL (и любые крупные Altcoins).

OUTPUT RULES:
- Output ONLY pure dense Markdown text. No JSON.
- Group the summary logically by coin.
- Cite specific metrics if they appear.
- Do NOT make your own price predictions. You are just a summarizer for Claude.
- Language: Russian.
- Keep the final output under 3,000 words."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            url,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "systemInstruction": {"parts": [{"text": "You are an elite data extraction engine. You filter noise and keep pure signal."}]},
                "generationConfig": {"temperature": 0.1},
            },
        )
        if resp.status_code != 200:
            logger.error(f"Gemini API error: {resp.status_code} - {resp.text[:500]}")
            raise RuntimeError(f"Gemini API error: {resp.status_code}")

        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Empty Gemini response")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = parts[0].get("text", "") if parts else ""
        if not text:
            raise RuntimeError("Empty text in Gemini response")
        return text.strip()


async def _analyze_with_claude(
    filtered_context: str,
    market_context: str,
    claude_api_key: str,
    mode: str = "simple",
) -> dict:
    """Run Claude Opus 4.6 analysis."""
    now_utc = datetime.utcnow().isoformat()

    system_prompt = """You are CryptoPulse AI, a professional cryptocurrency market analyst algorithm.
Your task is to analyze social sentiment and market data, and output a strict JSON object.

Output pure JSON only, without any markdown formatting wrappers such as ```json. DO NOT add any explanatory text before or after the JSON.
Your entire response must be parseable by JSON.parse().

Response Format:
{
  "marketSummary": "String (Russian) - Overarching market overview, max 3 sentences",
  "forecastLabel": "Прогноз (24ч)",
  "strategy": "String (Russian) - Trading strategy advice",
  "topPick": "BTC",
  "riskLevel": "Low" | "Medium" | "High" | "Extreme",
  "technicalVerdict": "String (Russian) - Assessment",
  "coins": [
    {
       "symbol": "BTC",
       "name": "Bitcoin",
       "sentimentScore": 85,
       "prediction": "Bullish" | "Bearish" | "Neutral",
       "confidence": 90,
       "reasoning": "String (Russian) - Why this prediction?",
       "currentPrice": 96500,
       "targetPrice24h": 100000,
       "targetChange24h": 2.5,
       "hourlyForecast": [
         {
           "hourOffset": 1,
           "price": 98000,
           "change": 0.5,
           "confidence": 80
         }
       ]
    }
  ]
}"""

    user_prompt = f"""CURRENT REAL-TIME MARKET PRICES (USE THESE AS YOUR BASELINE):
{market_context}

SOCIAL SENTIMENT & NEWS DATA:
--- FILTERED CONTEXT FROM GEMINI ---
{filtered_context}

TASK: Analyze sentiment for BTC, ETH, XRP, SOL. CURRENT UTC TIME: {now_utc}.
OUTPUT: JSON matching schema.

FORECAST TASK: Generate a detailed hourly forecast for the next 24 hours.
MSK CONTEXT: Current time is UTC+3 (Moscow). 
The FIRST point (hourOffset: 1) MUST be the price at the NEXT full hour from now in Moscow time.
Example: If now is 20:15 MSK, hourOffset 1 is 21:00 MSK.
FIELDS: "targetPrice24h" (final point price), "targetChange24h" (final point %), "hourlyForecast" (array of exactly 24 objects). 

CRITICAL INSTRUCTION: Your predicted target prices MUST be realistically anchored to the Real-Time Prices listed above.

RULES: Russian language for text. Extremely concise. "forecastLabel": "Авто-анализ (24ч)"""

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            CLAUDE_API_URL,
            headers={
                "x-api-key": claude_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-opus-4-6",
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
        )

        if resp.status_code != 200:
            err_text = resp.text[:500]
            logger.error(f"Claude API error: {resp.status_code} - {err_text}")
            raise RuntimeError(f"Claude API error: {resp.status_code} - {err_text}")

        data = resp.json()
        text = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                text = block.get("text", "")
                break

        # Clean markdown if present
        text = text.replace("```json", "").replace("```", "").strip()

        # Recovery for truncated JSON
        if not text.endswith("}"):
            last_brace = text.rfind("}")
            if last_brace != -1:
                text = text[: last_brace + 1]

        if not text:
            raise RuntimeError("Empty response from Claude")

        return json.loads(text)


async def run_scheduled_analysis(trigger: str = "scheduled") -> None:
    """Execute the full auto-analysis pipeline and save results to DB."""
    logger.info(f"=== Starting auto-analysis (trigger: {trigger}) ===")
    settings = get_settings()

    # Validate keys
    if not settings.CLAUDE_API_KEY:
        logger.error("CLAUDE_API_KEY not configured. Skipping analysis.")
        return
    if not settings.GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not configured. Skipping analysis.")
        return

    async_session = get_async_session()
    async with async_session() as session:
        # Create log entry
        log = AnalysisLog(
            mode="simple",
            status="running",
            trigger=trigger,
        )
        session.add(log)
        await session.commit()
        await session.refresh(log)

        try:
            # 1. Reddit data
            logger.info("Step 1/4: Fetching Reddit data...")
            reddit_token = None
            posts = []
            if settings.REDDIT_CLIENT_ID and settings.REDDIT_CLIENT_SECRET:
                try:
                    reddit_token = await _get_reddit_token(
                        settings.REDDIT_CLIENT_ID, settings.REDDIT_CLIENT_SECRET
                    )
                    posts = await _fetch_reddit_posts(DEFAULT_SUBREDDITS, reddit_token)
                    logger.info(f"Reddit: {len(posts)} posts fetched")
                except Exception as e:
                    logger.warning(f"Reddit fetch failed: {e}")
            else:
                logger.warning("Reddit credentials not configured, skipping Reddit")

            # 2. Market data
            logger.info("Step 2/4: Fetching market data...")
            market_context = "MARKET CONTEXT: Data unavailable."
            if settings.CMC_API_KEY:
                try:
                    market_context = await _fetch_market_data(settings.CMC_API_KEY)
                except Exception as e:
                    logger.warning(f"CMC fetch failed: {e}")

            if len(posts) == 0:
                raise RuntimeError("No data collected from any source. Cannot analyze.")

            # 3. Gemini filtering
            logger.info("Step 3/4: Filtering with Gemini...")
            filtered_context = await _filter_with_gemini(posts, settings.GEMINI_API_KEY)
            logger.info(f"Gemini filter done ({len(filtered_context)} chars)")

            # 4. Claude analysis
            logger.info("Step 4/4: Claude Opus 4.6 analysis...")
            result = await _analyze_with_claude(
                filtered_context, market_context, settings.CLAUDE_API_KEY, mode="simple"
            )
            logger.info("Claude analysis complete!")

            # Save
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.result_json = json.dumps(result, ensure_ascii=False)
            log.reddit_posts_count = len(posts)
            await session.commit()

            logger.info(f"=== Auto-analysis complete (ID: {log.id}) ===")

        except Exception as e:
            logger.error(f"Auto-analysis failed: {e}")
            log.finished_at = datetime.utcnow()
            log.status = "failed"
            log.error_message = str(e)
            await session.commit()
