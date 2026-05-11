"""Weekly Altcoin Analysis Pipeline.

Collects data from CMC (trending, gainers, new listings) + Reddit + Twitter
focused on altcoins, then runs Gemini filter + Claude Opus analysis
to find coins likely to grow 10%+ within the week.

Scheduled: Every Monday at 08:00 MSK (05:00 UTC).
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone

import httpx

from core.config import get_settings
from core.database import get_async_session
from core.models import AnalysisLog

logger = logging.getLogger(__name__)

# CMC endpoints
CMC_BASE = "https://pro-api.coinmarketcap.com"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

# Exclude major coins — we only want altcoins
EXCLUDED_SYMBOLS = {"BTC", "ETH", "BNB", "SOL", "XRP", "USDT", "USDC", "DOGE", "STETH", "WBTC", "WETH"}

# Altcoin-focused subreddits
ALTCOIN_SUBREDDITS = [
    "CryptoMoonShots", "SatoshiStreetBets", "altcoin", "CryptoMarkets",
    "memecoins", "defi", "Chainlink", "Polkadot", "cardano", "Avax",
    "algorand", "Hedera", "Stellar", "litecoin", "0xPolygon",
    "AltStreetBets", "CryptoCurrency", "CryptoMarsShots", "CryptoMoon",
    "WallStreetBetsCrypto", "SolanaMemeCoins", "MemeCoinJunkies",
    "ethtrader", "UniSwap", "SushiSwap", "Tronix", "tezos",
    "cosmosnetwork", "thegraph", "rocketpool", "Raydium",
]

# Altcoin-focused Twitter accounts
ALTCOIN_TWITTER_ACCOUNTS = [
    "AltcoinDailyio", "CryptoKaleo", "Pentosh1", "CryptoGodJohn",
    "IncomeSharks", "ali_charts", "DaanCrypto", "CryptoCapo_",
    "MessariCrypto", "santimentfeed", "whale_alert", "CoinMarketCap",
    "Cointelegraph", "CoinDesk", "decryptmedia", "TheBlock__",
]


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


async def _fetch_altcoin_reddit(reddit_token: str, lookback_hours: int = 48) -> list[dict]:
    """Fetch Reddit posts from altcoin-focused subreddits."""
    all_posts = []
    cutoff_time = time.time() - (lookback_hours * 3600)

    async with httpx.AsyncClient(timeout=30) as client:
        for sub in ALTCOIN_SUBREDDITS:
            try:
                resp = await client.get(
                    f"https://oauth.reddit.com/r/{sub}/hot.json?limit=50",
                    headers={
                        "Authorization": f"Bearer {reddit_token}",
                        "User-Agent": "CryptoPulseAI/1.0",
                    },
                )
                if resp.status_code != 200:
                    continue

                data = resp.json()
                children = data.get("data", {}).get("children", [])
                for child in children:
                    p = child.get("data", {})
                    created = p.get("created_utc", 0)
                    if created < cutoff_time:
                        continue
                    title = p.get("title", "")
                    if "Daily Discussion" in title:
                        continue
                    all_posts.append({
                        "title": title,
                        "selftext": (p.get("selftext") or "")[:400],
                        "subreddit": p.get("subreddit", sub),
                        "score": p.get("score", 0),
                        "source": "Reddit",
                    })
            except Exception as e:
                logger.warning(f"Altcoin Reddit r/{sub} error: {e}")

    return all_posts


async def _fetch_altcoin_twitter(lookback_hours: int = 48) -> list[dict]:
    """Fetch tweets from altcoin-focused accounts."""
    settings = get_settings()
    api_key = settings.TWITTER_RAPID_API_KEY or "3fa1808794msh4889848f150da1ep1e822ejsnd21a6ca25058"
    twitter_host = settings.TWITTER_HOST or "twitter241.p.rapidapi.com"
    if not api_key:
        return []

    all_tweets = []
    cutoff_date = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)

    async with httpx.AsyncClient(timeout=60) as client:
        for username in ALTCOIN_TWITTER_ACCOUNTS:
            try:
                url = f"https://{twitter_host}/user-tweets?user={username}&count=30"
                headers = {"X-RapidAPI-Key": api_key, "X-RapidAPI-Host": twitter_host}

                resp = await client.get(url, headers=headers)
                if resp.status_code == 429:
                    await asyncio.sleep(10)
                    resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    continue

                data = resp.json()
                instructions = data.get("result", {}).get("timeline", {}).get("instructions", [])
                if not instructions:
                    instructions = data.get("data", {}).get("user", {}).get("result", {}).get("timeline_v2", {}).get("timeline", {}).get("instructions", [])

                for instr in instructions:
                    if instr.get("type") == "TimelineAddEntries":
                        for entry in instr.get("entries", []):
                            tweet_data = entry.get("content", {}).get("itemContent", {}).get("tweet_results", {}).get("result", {}).get("legacy", {})
                            if not tweet_data:
                                continue
                            created_at_str = tweet_data.get("created_at")
                            if created_at_str:
                                created_at = datetime.strptime(created_at_str, "%a %b %d %H:%M:%S %z %Y")
                                if created_at < cutoff_date:
                                    continue
                                all_tweets.append({
                                    "text": tweet_data.get("full_text") or tweet_data.get("text", ""),
                                    "user": username,
                                    "source": "Twitter",
                                })

                await asyncio.sleep(2)
            except Exception as e:
                logger.warning(f"Altcoin Twitter @{username} error: {e}")

    return all_tweets


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


async def _filter_altcoins_gemini(cmc_data: dict, reddit_posts: list, twitter_posts: list, gemini_key: str) -> str:
    """Use Gemini to filter and compress altcoin data."""
    prompt = f"""INPUT DATA FOR ALTCOIN WEEKLY ANALYSIS:

=== CMC MARKET DATA ===
Trending coins: {json.dumps(cmc_data['trending'][:15], ensure_ascii=False)}
Top gainers (24h, vol>$1M): {json.dumps(cmc_data['gainers'][:15], ensure_ascii=False)}
New listings (vol>$100K): {json.dumps(cmc_data['new_listings'][:15], ensure_ascii=False)}
High volume altcoins (rank 21-100): {json.dumps(cmc_data['high_volume'][:20], ensure_ascii=False)}

=== REDDIT ({len(reddit_posts)} posts from altcoin subreddits, last 48h) ===
{json.dumps(reddit_posts[:200], ensure_ascii=False)}

=== TWITTER ({len(twitter_posts)} tweets from crypto influencers, last 48h) ===
{json.dumps(twitter_posts[:100], ensure_ascii=False)}

TASK:
You are the FIRST STAGE of a two-stage AI pipeline for WEEKLY ALTCOIN ANALYSIS.
Goal: Find altcoins that are likely to grow 10%+ within the next 7 days.

Extract and summarize:
1. Which altcoins are being discussed most actively and WHY
2. Which coins have unusual volume spikes or price momentum
3. Any upcoming catalysts (listings, partnerships, upgrades, airdrops)
4. Community sentiment — genuine excitement vs pump-and-dump
5. New listings that show strong early traction

FILTER OUT: obvious scams, dead projects, coins with <$500K volume, pure meme hype without substance.

OUTPUT: Dense Russian-language summary organized by coin. Include price data, volume, social buzz level, and potential catalysts.
Keep under 4000 words."""

    url = f"{GEMINI_API_URL}?key={gemini_key}"
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": "You are an elite altcoin research analyst. Extract signal from noise. Focus on coins with real growth potential this week."}]},
        "generationConfig": {"temperature": 0.1},
    }

    async with httpx.AsyncClient(timeout=3600) as client:
        for attempt in range(3):
            resp = await client.post(url, json=body)
            if resp.status_code == 200:
                break
            if resp.status_code in (503, 429, 500) and attempt < 2:
                await asyncio.sleep(180 * (attempt + 1))
                continue
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


async def _analyze_altcoins_claude(filtered_context: str, cmc_data: dict, claude_key: str) -> dict:
    """Claude Opus analysis for weekly altcoin picks."""
    # Build market summary from CMC data
    all_coins = {}
    for category in ["trending", "gainers", "new_listings", "high_volume"]:
        for coin in cmc_data.get(category, []):
            sym = coin["symbol"]
            if sym not in all_coins:
                all_coins[sym] = coin

    market_lines = ["ALTCOIN MARKET DATA:"]
    for sym, coin in list(all_coins.items())[:40]:
        market_lines.append(
            f"{sym} ({coin['name']}): ${coin['price']:.6f} | 24h: {coin['change_24h']:.1f}% | 7d: {coin['change_7d']:.1f}% | Vol: ${coin['volume_24h']:,.0f} | MCap: ${coin['market_cap']:,.0f}"
        )
    market_context = "\n".join(market_lines)

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
- Prices must match the market data provided"""

    user_prompt = f"""{market_context}

SOCIAL SENTIMENT & NEWS (filtered by Gemini):
{filtered_context}

TASK: Select 5-10 altcoins most likely to grow 10%+ this week.
Consider: momentum, volume trends, social buzz, upcoming catalysts, technical setup.
Be selective — quality over quantity. Only pick coins where you see a clear edge."""

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            CLAUDE_API_URL,
            headers={
                "x-api-key": claude_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-opus-4-7",
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
    """Execute the full altcoin analysis pipeline."""
    logger.info(f"=== Starting ALTCOIN analysis (trigger: {trigger}) ===")

    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    claude_key = os.environ.get("CLAUDE_API_KEY", "")
    reddit_id = os.environ.get("REDDIT_CLIENT_ID", "")
    reddit_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    cmc_key = os.environ.get("CMC_API_KEY", "")

    if not claude_key or not gemini_key:
        logger.error("CLAUDE_API_KEY or GEMINI_API_KEY missing. Skipping altcoin analysis.")
        return

    async_session = get_async_session()
    async with async_session() as session:
        log = AnalysisLog(mode="altcoin_weekly", status="running", trigger=trigger)
        session.add(log)
        await session.commit()
        await session.refresh(log)

        try:
            # 1. CMC data
            logger.info("[ALTCOIN] Step 1/4: Fetching CMC altcoin data...")
            cmc_data = {"trending": [], "gainers": [], "new_listings": [], "high_volume": []}
            if cmc_key:
                cmc_data = await _fetch_cmc_altcoins(cmc_key)
            total_cmc = sum(len(v) for v in cmc_data.values())
            logger.info(f"[ALTCOIN] CMC: {total_cmc} altcoins found")

            # 2. Reddit
            logger.info("[ALTCOIN] Step 2/4: Fetching Reddit (48h, altcoin subs)...")
            reddit_posts = []
            if reddit_id and reddit_secret:
                reddit_token = await _get_reddit_token(reddit_id, reddit_secret)
                reddit_posts = await _fetch_altcoin_reddit(reddit_token, lookback_hours=48)
            logger.info(f"[ALTCOIN] Reddit: {len(reddit_posts)} posts")

            # 3. Twitter
            logger.info("[ALTCOIN] Step 3/4: Fetching Twitter (48h, altcoin accounts)...")
            twitter_posts = await _fetch_altcoin_twitter(lookback_hours=48)
            logger.info(f"[ALTCOIN] Twitter: {len(twitter_posts)} tweets")

            if not cmc_data["trending"] and not cmc_data["gainers"] and not reddit_posts:
                raise RuntimeError("No altcoin data collected")

            # 4. Gemini filter
            logger.info("[ALTCOIN] Step 3.5/4: Gemini filtration...")
            filtered = await _filter_altcoins_gemini(cmc_data, reddit_posts, twitter_posts, gemini_key)
            logger.info(f"[ALTCOIN] Gemini done: {len(filtered)} chars")

            # 5. Claude analysis
            logger.info("[ALTCOIN] Step 4/4: Claude Opus analysis...")
            result = await _analyze_altcoins_claude(filtered, cmc_data, claude_key)

            # Save
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.result_json = json.dumps(result, ensure_ascii=False)
            log.reddit_posts_count = len(reddit_posts)
            log.twitter_tweets_count = len(twitter_posts)
            log.telegram_msgs_count = 0
            await session.commit()

            logger.info(f"=== ALTCOIN analysis complete (ID: {log.id}) ===")

        except Exception as e:
            import traceback
            logger.error(f"[ALTCOIN] Analysis failed: {type(e).__name__}: {e}")
            logger.error(traceback.format_exc())
            log.finished_at = datetime.utcnow()
            log.status = "failed"
            log.error_message = str(e)
            await session.commit()
