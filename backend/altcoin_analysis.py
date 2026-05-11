"""Weekly Altcoin Analysis Pipeline.

Collects data from CMC (trending, gainers, new listings, high volume) + Reddit (all subs) + Twitter (all accounts)
focused on altcoins, then sends directly to Claude Opus 4.7 for analysis.

Scheduled: Every Monday at 08:00 MSK (05:00 UTC).
Lookback: 24 hours for Reddit/Twitter.
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone

import httpx

from sqlalchemy import select

from core.config import get_settings
from core.database import get_async_session
from core.models import AnalysisLog, AltcoinTracking
from auto_analysis import (
    DEFAULT_SUBREDDITS,
    DEFAULT_TWITTER_ACCOUNTS,
    _fetch_reddit_posts,
    _fetch_twitter_posts,
    _get_reddit_token,
)

logger = logging.getLogger(__name__)

CMC_BASE = "https://pro-api.coinmarketcap.com"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"

# Exclude major coins — we only want altcoins
EXCLUDED_SYMBOLS = {"BTC", "ETH", "BNB", "SOL", "XRP", "USDT", "USDC", "DOGE", "STETH", "WBTC", "WETH"}


async def _fetch_cmc_altcoins(cmc_key: str) -> dict:
    """Fetch altcoin candidates from multiple CMC endpoints."""
    results = {
        "trending": [],
        "gainers": [],
        "new_listings": [],
        "high_volume": [],
    }

    async with httpx.AsyncClient(timeout=30) as client:
        headers = {"X-CMC_PRO_API_KEY": cmc_key, "Accept": "application/json"}

        # 1. Trending
        try:
            resp = await client.get(f"{CMC_BASE}/v1/cryptocurrency/trending/latest", headers=headers, params={"limit": 30})
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for coin in data:
                    sym = coin.get("symbol", "").upper()
                    if sym not in EXCLUDED_SYMBOLS:
                        q = coin.get("quote", {}).get("USD", {})
                        results["trending"].append({
                            "symbol": sym,
                            "name": coin.get("name", ""),
                            "price": q.get("price", 0),
                            "change_24h": q.get("percent_change_24h", 0),
                            "change_7d": q.get("percent_change_7d", 0),
                            "volume_24h": q.get("volume_24h", 0),
                            "market_cap": q.get("market_cap", 0),
                        })
        except Exception as e:
            logger.warning(f"CMC trending error: {e}")

        # 2. Gainers (top by 24h change, volume > $1M)
        try:
            resp = await client.get(
                f"{CMC_BASE}/v1/cryptocurrency/trending/gainers-losers",
                headers=headers,
                params={"limit": 30, "time_period": "24h"}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for coin in data:
                    sym = coin.get("symbol", "").upper()
                    q = coin.get("quote", {}).get("USD", {})
                    vol = q.get("volume_24h", 0)
                    if sym not in EXCLUDED_SYMBOLS and vol > 1_000_000:
                        results["gainers"].append({
                            "symbol": sym,
                            "name": coin.get("name", ""),
                            "price": q.get("price", 0),
                            "change_24h": q.get("percent_change_24h", 0),
                            "change_7d": q.get("percent_change_7d", 0),
                            "volume_24h": vol,
                            "market_cap": q.get("market_cap", 0),
                        })
        except Exception as e:
            logger.warning(f"CMC gainers error: {e}")

        # 3. New listings
        try:
            resp = await client.get(f"{CMC_BASE}/v1/cryptocurrency/listings/new", headers=headers, params={"limit": 30})
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for coin in data:
                    sym = coin.get("symbol", "").upper()
                    q = coin.get("quote", {}).get("USD", {})
                    vol = q.get("volume_24h", 0)
                    if sym not in EXCLUDED_SYMBOLS and vol > 100_000:
                        results["new_listings"].append({
                            "symbol": sym,
                            "name": coin.get("name", ""),
                            "price": q.get("price", 0),
                            "change_24h": q.get("percent_change_24h", 0),
                            "change_7d": q.get("percent_change_7d", 0),
                            "volume_24h": vol,
                            "market_cap": q.get("market_cap", 0),
                        })
        except Exception as e:
            logger.warning(f"CMC new listings error: {e}")

        # 4. High volume altcoins (sorted by volume, skip top 20 by market cap)
        try:
            resp = await client.get(
                f"{CMC_BASE}/v1/cryptocurrency/listings/latest",
                headers=headers,
                params={"start": 21, "limit": 80, "sort": "volume_24h", "convert": "USD"}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for coin in data:
                    sym = coin.get("symbol", "").upper()
                    q = coin.get("quote", {}).get("USD", {})
                    if sym not in EXCLUDED_SYMBOLS:
                        results["high_volume"].append({
                            "symbol": sym,
                            "name": coin.get("name", ""),
                            "price": q.get("price", 0),
                            "change_24h": q.get("percent_change_24h", 0),
                            "change_7d": q.get("percent_change_7d", 0),
                            "volume_24h": q.get("volume_24h", 0),
                            "market_cap": q.get("market_cap", 0),
                        })
        except Exception as e:
            logger.warning(f"CMC high volume error: {e}")

    return results


async def _analyze_altcoins_claude(cmc_data: dict, reddit_posts: list, twitter_posts: list, claude_key: str) -> dict:
    """Send all data directly to Claude Opus 4.7 for altcoin analysis."""
    # Build market context from CMC
    all_coins = {}
    for category in ["trending", "gainers", "new_listings", "high_volume"]:
        for coin in cmc_data.get(category, []):
            sym = coin["symbol"]
            if sym not in all_coins:
                all_coins[sym] = coin

    market_lines = ["ALTCOIN MARKET DATA (from CoinMarketCap):"]
    for sym, coin in list(all_coins.items())[:50]:
        market_lines.append(
            f"{sym} ({coin['name']}): ${coin['price']:.6f} | 24h: {coin['change_24h']:.1f}% | 7d: {coin['change_7d']:.1f}% | Vol: ${coin['volume_24h']:,.0f} | MCap: ${coin['market_cap']:,.0f}"
        )
    market_context = "\n".join(market_lines)

    # Build social data (top posts by score, compressed)
    top_reddit = sorted(reddit_posts, key=lambda x: x.get("score", 0), reverse=True)[:300]
    reddit_payload = json.dumps([{
        "title": p["title"],
        "text": p.get("selftext", "")[:150],
        "sub": p.get("subreddit", ""),
        "score": p.get("score", 0),
    } for p in top_reddit], ensure_ascii=False)

    twitter_payload = json.dumps([{
        "text": t.get("text", "")[:200],
        "user": t.get("user", ""),
    } for t in twitter_posts[:150]], ensure_ascii=False) if twitter_posts else "No Twitter data."

    system_prompt = """You are CryptoPulse AI Altcoin Analyst. Your task: identify altcoins with 10%+ growth potential this week.

Output pure JSON only. No markdown wrappers. Response must be parseable by JSON.parse().

Response Format:
{
  "weeklyOutlook": "String (Russian) - Overall altcoin market outlook for the week, 2-3 sentences",
  "analysisDate": "ISO date string",
  "picks": [
    {
      "symbol": "COIN",
      "name": "Full Name",
      "currentPrice": 0.123,
      "targetPrice7d": 0.145,
      "targetChange7d": 17.8,
      "confidence": 75,
      "risk": "Medium" | "High" | "Degen",
      "catalyst": "String (Russian) - What will drive growth",
      "reasoning": "String (Russian) - Detailed analysis why this coin",
      "volume24h": 5000000,
      "marketCap": 50000000,
      "socialBuzz": "High" | "Medium" | "Low",
      "timeframe": "3-5 days" | "5-7 days" | "1-3 days"
    }
  ],
  "avoid": [
    {
      "symbol": "SCAM",
      "reason": "String (Russian) - Why to avoid"
    }
  ]
}

RULES:
- Pick 5-10 altcoins with HIGHEST probability of 10%+ growth this week
- Sort by confidence (highest first)
- Be REALISTIC — not every coin will moon. Only pick coins with clear catalysts or momentum
- Include risk assessment honestly
- "avoid" section: list 2-3 coins that look tempting but are likely traps
- All text in Russian
- Prices must match the market data provided
- EXCLUDE: BTC, ETH, BNB, SOL, XRP, USDT, USDC, DOGE"""

    user_prompt = f"""{market_context}

CMC CATEGORIES:
- Trending: {json.dumps([c['symbol'] for c in cmc_data.get('trending', [])[:15]])}
- Top Gainers (24h, vol>$1M): {json.dumps([c['symbol'] for c in cmc_data.get('gainers', [])[:15]])}
- New Listings (vol>$100K): {json.dumps([c['symbol'] for c in cmc_data.get('new_listings', [])[:15]])}

REDDIT (last 24h, {len(reddit_posts)} posts, top 300 by score):
{reddit_payload}

TWITTER (last 24h, {len(twitter_posts)} tweets):
{twitter_payload}

TASK: Select 5-10 altcoins most likely to grow 10%+ this week.
Consider: momentum, volume trends, social buzz, upcoming catalysts, technical setup.
Be selective — quality over quantity. Only pick coins where you see a clear edge.
Current date: {datetime.utcnow().isoformat()}Z"""

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            CLAUDE_API_URL,
            headers={
                "x-api-key": claude_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-opus-4-20250514",
                "max_tokens": 8192,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
        )

        if resp.status_code != 200:
            raise RuntimeError(f"Claude API error: {resp.status_code} - {resp.text[:500]}")

        data = resp.json()
        text = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                text = block.get("text", "")
                break

        text = text.replace("```json", "").replace("```", "").strip()
        if not text.endswith("}"):
            last_brace = text.rfind("}")
            if last_brace != -1:
                text = text[:last_brace + 1]

        if not text:
            raise RuntimeError("Empty response from Claude")

        return json.loads(text)


async def run_altcoin_analysis(trigger: str = "scheduled") -> None:
    """Execute the full altcoin analysis pipeline: CMC + Reddit + Twitter -> Claude."""
    logger.info(f"=== Starting ALTCOIN analysis (trigger: {trigger}) ===")

    claude_key = os.environ.get("CLAUDE_API_KEY", "")
    reddit_id = os.environ.get("REDDIT_CLIENT_ID", "")
    reddit_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    cmc_key = os.environ.get("CMC_API_KEY", "")

    if not claude_key:
        logger.error("CLAUDE_API_KEY missing. Skipping altcoin analysis.")
        return

    async_session = get_async_session()
    async with async_session() as session:
        log = AnalysisLog(mode="altcoin_weekly", status="running", trigger=trigger)
        session.add(log)
        await session.commit()
        await session.refresh(log)

        try:
            # 1. CMC data
            logger.info("[ALTCOIN] Step 1/3: Fetching CMC altcoin data...")
            cmc_data = {"trending": [], "gainers": [], "new_listings": [], "high_volume": []}
            if cmc_key:
                cmc_data = await _fetch_cmc_altcoins(cmc_key)
            total_cmc = sum(len(v) for v in cmc_data.values())
            logger.info(f"[ALTCOIN] CMC: {total_cmc} altcoins found")

            # 2. Reddit (all subs, 24h)
            logger.info("[ALTCOIN] Step 2/3: Fetching Reddit (24h, all subs)...")
            reddit_posts = []
            if reddit_id and reddit_secret:
                reddit_token = await _get_reddit_token(reddit_id, reddit_secret)
                reddit_posts = await _fetch_reddit_posts(DEFAULT_SUBREDDITS, reddit_token, lookback_hours=24)
            logger.info(f"[ALTCOIN] Reddit: {len(reddit_posts)} posts")

            # 3. Twitter (all accounts, 24h)
            logger.info("[ALTCOIN] Step 3/3: Fetching Twitter (24h, all accounts)...")
            twitter_posts = await _fetch_twitter_posts(DEFAULT_TWITTER_ACCOUNTS, lookback_hours=24)
            logger.info(f"[ALTCOIN] Twitter: {len(twitter_posts)} tweets")

            if not cmc_data["trending"] and not cmc_data["gainers"] and not reddit_posts:
                raise RuntimeError("No altcoin data collected")

            # 4. Claude analysis (direct, no Gemini)
            logger.info("[ALTCOIN] Sending to Claude Opus 4.7 (direct)...")
            result = await _analyze_altcoins_claude(cmc_data, reddit_posts, twitter_posts, claude_key)

            # Save
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.result_json = json.dumps(result, ensure_ascii=False)
            log.reddit_posts_count = len(reddit_posts)
            log.twitter_tweets_count = len(twitter_posts)
            log.telegram_msgs_count = 0
            await session.commit()

            # 5. Save picks to AltcoinTracking for weekly performance tracking
            logger.info("[ALTCOIN] Saving picks to tracking table...")
            picks = result.get("picks", [])
            for pick in picks:
                tracking = AltcoinTracking(
                    analysis_id=log.id,
                    symbol=pick.get("symbol", ""),
                    name=pick.get("name", ""),
                    confidence=pick.get("confidence", 0),
                    risk=pick.get("risk", ""),
                    target_change_7d=pick.get("targetChange7d", 0),
                    catalyst=pick.get("catalyst", ""),
                    reasoning=pick.get("reasoning", ""),
                    start_price=pick.get("currentPrice", 0),
                    target_price_7d=pick.get("targetPrice7d", 0),
                    status="active",
                )
                session.add(tracking)
            await session.commit()
            logger.info(f"[ALTCOIN] Saved {len(picks)} picks to tracking")

            logger.info(f"=== ALTCOIN analysis complete (ID: {log.id}) ===")

        except Exception as e:
            import traceback
            logger.error(f"[ALTCOIN] Analysis failed: {type(e).__name__}: {e}")
            logger.error(traceback.format_exc())
            log.finished_at = datetime.utcnow()
            log.status = "failed"
            log.error_message = str(e)
            await session.commit()



async def _fetch_cmc_prices(symbols: list[str], cmc_key: str) -> dict[str, float]:
    """Fetch current prices for specific symbols from CMC."""
    if not symbols or not cmc_key:
        return {}
    
    prices = {}
    async with httpx.AsyncClient(timeout=30) as client:
        headers = {"X-CMC_PRO_API_KEY": cmc_key, "Accept": "application/json"}
        
        # CMC allows up to 100 symbols per request
        symbols_str = ",".join(symbols[:100])
        try:
            resp = await client.get(
                f"{CMC_BASE}/v1/cryptocurrency/quotes/latest",
                headers=headers,
                params={"symbol": symbols_str, "convert": "USD"}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                for sym, coin_data in data.items():
                    price = coin_data.get("quote", {}).get("USD", {}).get("price", 0)
                    prices[sym.upper()] = price
        except Exception as e:
            logger.warning(f"CMC price fetch error: {e}")
    
    return prices


async def update_altcoin_tracking() -> None:
    """Update active altcoin trackings with current prices from CMC.
    
    Called every Monday before new analysis to check last week's picks.
    """
    logger.info("=== Updating altcoin tracking results ===")
    
    cmc_key = os.environ.get("CMC_API_KEY", "")
    if not cmc_key:
        logger.warning("CMC_API_KEY not set, skipping altcoin tracking update")
        return
    
    async_session = get_async_session()
    async with async_session() as session:
        # Get all active trackings (created more than 6 days ago)
        cutoff = datetime.utcnow() - timedelta(days=6)
        result = await session.execute(
            select(AltcoinTracking)
            .where(AltcoinTracking.status == "active")
            .where(AltcoinTracking.created_at < cutoff)
        )
        active_trackings = result.scalars().all()
        
        if not active_trackings:
            logger.info("No active altcoin trackings to update")
            return
        
        # Get unique symbols
        symbols = list(set(t.symbol for t in active_trackings))
        logger.info(f"Fetching prices for {len(symbols)} symbols: {symbols}")
        
        # Fetch current prices
        prices = await _fetch_cmc_prices(symbols, cmc_key)
        logger.info(f"Got prices for {len(prices)} symbols")
        
        # Update trackings
        updated = 0
        for tracking in active_trackings:
            current_price = prices.get(tracking.symbol.upper())
            if current_price and tracking.start_price > 0:
                tracking.end_price = current_price
                tracking.actual_change_7d = ((current_price - tracking.start_price) / tracking.start_price) * 100
                tracking.status = "completed"
                tracking.completed_at = datetime.utcnow()
                updated += 1
                logger.info(f"  {tracking.symbol}: ${tracking.start_price:.6f} -> ${current_price:.6f} ({tracking.actual_change_7d:+.1f}%)")
            else:
                # Mark as completed even if price not found
                tracking.status = "completed"
                tracking.completed_at = datetime.utcnow()
                logger.warning(f"  {tracking.symbol}: price not found, marking as completed")
        
        await session.commit()
        logger.info(f"=== Updated {updated} altcoin trackings ===")
