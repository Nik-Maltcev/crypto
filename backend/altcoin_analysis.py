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

BYBIT_INSTRUMENTS_URL = "https://api.bybit.com/v5/market/instruments-info"


async def _fetch_bybit_spot_symbols() -> set[str]:
    """Fetch all available spot trading symbols from Bybit."""
    symbols = set()
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(BYBIT_INSTRUMENTS_URL, params={"category": "spot", "limit": 1000})
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("result", {}).get("list", [])
                for item in items:
                    # Symbol format: "BTCUSDT" -> extract base coin "BTC"
                    symbol = item.get("baseCoin", "").upper()
                    if symbol:
                        symbols.add(symbol)
                logger.info(f"[BYBIT] Fetched {len(symbols)} spot symbols")
        except Exception as e:
            logger.warning(f"[BYBIT] Failed to fetch symbols: {e}")
    return symbols


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


async def _analyze_altcoins_claude(cmc_data: dict, reddit_posts: list, twitter_posts: list, claude_key: str, bybit_symbols: set[str] = None) -> dict:
    """Send all data directly to Claude Opus 4.6 for altcoin analysis."""
    # Build market context from CMC
    all_coins = {}
    for category in ["trending", "gainers", "new_listings", "high_volume"]:
        for coin in cmc_data.get(category, []):
            sym = coin["symbol"]
            if sym not in all_coins:
                all_coins[sym] = coin

    market_lines = ["ALTCOIN MARKET DATA (from CoinMarketCap):"]
    for sym, coin in list(all_coins.items()):
        market_lines.append(
            f"{sym} ({coin['name']}): ${coin['price']:.6f} | 24h: {coin['change_24h']:.1f}% | 7d: {coin['change_7d']:.1f}% | Vol: ${coin['volume_24h']:,.0f} | MCap: ${coin['market_cap']:,.0f}"
        )
    market_context = "\n".join(market_lines)

    # Build social data (all posts, no truncation — Claude has 200K context)
    top_reddit = sorted(reddit_posts, key=lambda x: x.get("score", 0), reverse=True)
    reddit_payload = json.dumps([{
        "title": p["title"],
        "text": p.get("selftext", ""),
        "sub": p.get("subreddit", ""),
        "score": p.get("score", 0),
    } for p in top_reddit], ensure_ascii=False)

    twitter_payload = json.dumps([{
        "text": t.get("text", ""),
        "user": t.get("user", ""),
    } for t in twitter_posts], ensure_ascii=False) if twitter_posts else "No Twitter data."

    system_prompt = """You are CryptoPulse AI Altcoin Analyst. Your task: identify altcoins likely to DROP 20%+ this week (short candidates).

Output pure JSON only. No markdown wrappers. Response must be parseable by JSON.parse().

Response Format:
{
  "weeklyOutlook": "String (Russian) - Overall altcoin market outlook for the week, 2-3 sentences",
  "analysisDate": "ISO date string",
  "shorts": [
    {
      "symbol": "COIN",
      "name": "Full Name",
      "currentPrice": 1.23,
      "targetPrice7d": 0.95,
      "targetChange7d": -22.5,
      "confidence": 70,
      "risk": "Medium" | "High" | "Degen",
      "catalyst": "String (Russian) - What will cause the drop",
      "reasoning": "String (Russian) - Detailed analysis why this coin will fall",
      "volume24h": 5000000,
      "marketCap": 50000000,
      "timeframe": "3-5 days" | "5-7 days" | "1-3 days"
    }
  ],
  "avoid": [
    {
      "symbol": "COIN",
      "reason": "String (Russian) - Why to avoid shorting this (looks like it will drop but won't)"
    }
  ]
}

RULES:
- "shorts": 4-8 altcoins most likely to DROP 20%+ this week (for short positions)
- Sort by confidence (highest first)
- Be REALISTIC — only pick coins with clear reasons to fall (hype dying, unlock events, broken support, negative news, pump-and-dump aftermath)
- Include risk assessment honestly
- "avoid" section: list 2-3 coins that look like they'll crash but are actually traps (short squeeze risk, strong support, etc)
- All text in Russian
- Prices must match the market data provided
- EXCLUDE: BTC, ETH, BNB, SOL, XRP, USDT, USDC, DOGE
- CRITICAL: ONLY pick coins from the BYBIT AVAILABLE list provided below. Do NOT suggest coins not on Bybit."""

    # Bybit available symbols context
    bybit_context = ""
    if bybit_symbols:
        # Filter CMC coins to only those on Bybit
        bybit_available = [sym for sym in all_coins.keys() if sym in bybit_symbols]
        bybit_context = f"\nBYBIT AVAILABLE SYMBOLS (ONLY pick from these): {json.dumps(sorted(bybit_available))}"
    
    user_prompt = f"""{market_context}
{bybit_context}

CMC CATEGORIES:
- Trending: {json.dumps([c['symbol'] for c in cmc_data.get('trending', [])[:15]])}
- Top Gainers (24h, vol>$1M): {json.dumps([c['symbol'] for c in cmc_data.get('gainers', [])[:15]])}
- New Listings (vol>$100K): {json.dumps([c['symbol'] for c in cmc_data.get('new_listings', [])[:15]])}

REDDIT (last 24h, {len(reddit_posts)} posts, top 300 by score):
{reddit_payload}

TWITTER (last 24h, {len(twitter_posts)} tweets):
{twitter_payload}

TASK: 
Select 4-8 altcoins most likely to DROP 20%+ this week (short candidates).
Look for: dying hype, token unlocks, broken support levels, negative news, pump-and-dump aftermath, overvaluation.
Be selective — only pick coins where you see a clear reason for decline.
IMPORTANT: ALL coins must be available on Bybit exchange.
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
                "model": "claude-opus-4-6",
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
            # 0. Bybit symbols
            logger.info("[ALTCOIN] Step 0: Fetching Bybit spot symbols...")
            bybit_symbols = await _fetch_bybit_spot_symbols()
            logger.info(f"[ALTCOIN] Bybit: {len(bybit_symbols)} symbols available")

            # 1. CMC data
            logger.info("[ALTCOIN] Step 1/4: Fetching CMC altcoin data...")
            cmc_data = {"trending": [], "gainers": [], "new_listings": [], "high_volume": []}
            if cmc_key:
                cmc_data = await _fetch_cmc_altcoins(cmc_key)
            total_cmc = sum(len(v) for v in cmc_data.values())
            logger.info(f"[ALTCOIN] CMC: {total_cmc} altcoins found")

            # 2. Reddit (all subs, 24h)
            logger.info("[ALTCOIN] Step 2/4: Fetching Reddit (24h, all subs)...")
            reddit_posts = []
            if reddit_id and reddit_secret:
                reddit_token = await _get_reddit_token(reddit_id, reddit_secret)
                reddit_posts = await _fetch_reddit_posts(DEFAULT_SUBREDDITS, reddit_token, lookback_hours=24)
            logger.info(f"[ALTCOIN] Reddit: {len(reddit_posts)} posts")

            # 3. Twitter (all accounts, 24h)
            logger.info("[ALTCOIN] Step 3/4: Fetching Twitter (24h, all accounts)...")
            twitter_posts = await _fetch_twitter_posts(DEFAULT_TWITTER_ACCOUNTS, lookback_hours=24)
            logger.info(f"[ALTCOIN] Twitter: {len(twitter_posts)} tweets")

            if not cmc_data["trending"] and not cmc_data["gainers"] and not reddit_posts:
                raise RuntimeError("No altcoin data collected")

            # 4. Claude analysis (direct, no Gemini)
            logger.info("[ALTCOIN] Sending to Claude Opus 4.6 (direct)...")
            result = await _analyze_altcoins_claude(cmc_data, reddit_posts, twitter_posts, claude_key, bybit_symbols)
            
            # Post-process: verify all shorts are on Bybit
            if bybit_symbols:
                result["shorts"] = [s for s in result.get("shorts", []) if s.get("symbol", "").upper() in bybit_symbols]

            # Save
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.result_json = json.dumps(result, ensure_ascii=False)
            log.reddit_posts_count = len(reddit_posts)
            log.twitter_tweets_count = len(twitter_posts)
            log.telegram_msgs_count = 0
            await session.commit()

            # 5. Save shorts to AltcoinTracking for weekly performance tracking
            logger.info("[ALTCOIN] Saving shorts to tracking table...")
            shorts = result.get("shorts", [])
            for pick in shorts:
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
            logger.info(f"[ALTCOIN] Saved {len(shorts)} shorts to tracking")

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


async def update_altcoin_daily_prices() -> None:
    """Daily job: snapshot current prices for all active altcoin trackings.
    
    Runs every day at 05:00 UTC (08:00 MSK). Records price + change from start.
    After 7 days, marks tracking as completed.
    """
    logger.info("=== Altcoin daily price snapshot ===")
    
    cmc_key = os.environ.get("CMC_API_KEY", "")
    if not cmc_key:
        logger.warning("CMC_API_KEY not set, skipping daily altcoin snapshot")
        return
    
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AltcoinTracking)
            .where(AltcoinTracking.status == "active")
        )
        active_trackings = result.scalars().all()
        
        if not active_trackings:
            logger.info("No active altcoin trackings")
            return
        
        # Get unique symbols
        symbols = list(set(t.symbol for t in active_trackings))
        logger.info(f"[ALTCOIN DAILY] Fetching prices for {len(symbols)} symbols")
        
        # Fetch current prices
        prices = await _fetch_cmc_prices(symbols, cmc_key)
        logger.info(f"[ALTCOIN DAILY] Got prices for {len(prices)} symbols")
        
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        updated = 0
        
        for tracking in active_trackings:
            current_price = prices.get(tracking.symbol.upper())
            if not current_price or tracking.start_price <= 0:
                continue
            
            # Load existing daily prices
            daily_prices = []
            if tracking.daily_prices_json:
                try:
                    daily_prices = json.loads(tracking.daily_prices_json)
                except:
                    daily_prices = []
            
            # Ensure day 1 (start price) exists
            analysis_date_str = tracking.created_at.strftime("%Y-%m-%d")
            existing_dates = {d.get("date") for d in daily_prices}
            if analysis_date_str not in existing_dates:
                daily_prices.insert(0, {
                    "day": 1,
                    "date": analysis_date_str,
                    "price": tracking.start_price,
                    "change_from_start": 0.0,
                    "change_from_prev": 0.0,
                })
                existing_dates.add(analysis_date_str)
            
            # Skip if already recorded today
            if today_str in existing_dates:
                continue
            
            day_num = len(daily_prices) + 1
            change_from_start = ((current_price - tracking.start_price) / tracking.start_price) * 100
            
            # Change from previous day (or from start if day 1)
            if daily_prices:
                prev_price = daily_prices[-1]["price"]
            else:
                prev_price = tracking.start_price
            change_from_prev = ((current_price - prev_price) / prev_price) * 100
            
            daily_prices.append({
                "day": day_num,
                "date": today_str,
                "price": current_price,
                "change_from_start": round(change_from_start, 2),
                "change_from_prev": round(change_from_prev, 2),
            })
            
            tracking.daily_prices_json = json.dumps(daily_prices)
            tracking.end_price = current_price
            tracking.actual_change_7d = round(change_from_start, 2)
            
            # After 7 days, mark as completed
            days_active = (datetime.utcnow() - tracking.created_at).days
            if days_active >= 7:
                tracking.status = "completed"
                tracking.completed_at = datetime.utcnow()
                logger.info(f"  {tracking.symbol}: COMPLETED after {day_num} days. Final: {change_from_start:+.1f}%")
            else:
                logger.info(f"  {tracking.symbol}: Day {day_num}, ${current_price:.6f} ({change_from_start:+.1f}%)")
            
            updated += 1
        
        await session.commit()
        logger.info(f"=== Altcoin daily snapshot done: {updated} updated ===")


async def update_altcoin_tracking() -> None:
    """Update active altcoin trackings — now just calls daily prices.
    
    Kept for backward compatibility with scheduler.
    """
    await update_altcoin_daily_prices()
