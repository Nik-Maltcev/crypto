"""Automated analysis pipeline.

Runs the full data collection + AI analysis server-side:
1. Reddit (OAuth) — top subreddits (16h)
2. Twitter (RapidAPI) — top accounts (16h)
3. Telegram (Telethon) — crypto chats (16h)
4. CoinMarketCap — market prices
5. Gemini 2.5 Pro — data filtering
6. Claude Opus 4.6 — final analysis

Results are stored in the AnalysisLog database table.
"""

import asyncio
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone

import httpx

from core.config import get_settings, load_chats_config
from core.database import get_async_session
from core.models import AnalysisLog
from worker.telethon_client import get_telethon_client
from forecast_tracker import save_forecast_from_analysis
from worker.jobs.parser import ChatParser

logger = logging.getLogger(__name__)

# All 404 subreddits (same as frontend constants.ts)
DEFAULT_SUBREDDITS = [
    # Filtered active subreddits (from reddit_active.csv — 125 subs)
    "phinvest", "investing", "IndianStreetBets", "Trading", "Bitcoin", "coins", "Daytrading",
    "TheTowerGame", "coincollecting", "conspiracy", "geometrydash", "hardwareswap",
    "CallOfDutyMobile", "FUTMobile", "Pmsforsale", "PokemonGoTrade", "AdoptMeTrading",
    "AdoptMeRBX", "btc", "CryptoCurrency", "Anarcho_Capitalism", "TradingViewSignals",
    "options", "BloxFruitsTradingHub", "trading212", "giftcardexchange", "Forexstrategy",
    "pennystocks", "CryptoMarkets", "algotrading", "pokemontrades", "ASX_Bets", "coinerrors",
    "RoyaleHigh_Roblox", "Cryptozoology", "RatchetAndClank", "PiNetwork", "defi", "AncientCoins",
    "ethtrader", "binance", "toshicoin", "RobloxGAGTrading", "BitcoinBeginners", "XRP",
    "CoinBase", "solana", "northcounty", "Forex", "CryptoIndia", "CryptoScams", "memecoins",
    "StocksAndTrading", "FuturesTrading", "cardano", "RoyaleHigh_Trading", "MaddenMobileForums",
    "RobloxTrading", "ethereum", "MarioKartTour", "AirdropCryptoAlpha", "litecoin", "dogecoin",
    "BitcoinMining", "TradingView", "thewallstreet", "SHIBArmy", "Slothana", "MaddenUltimateTeam",
    "AvakinOfficial", "Buttcoin", "Tradingcards", "Hedera", "swingtrading", "ledgerwallet",
    "AnimalCrossingTrading", "solanadev", "Monero", "lastofuspart2", "CryptoMoonShots",
    "Memecoinhub", "GlobalOffensiveTrade", "SolanaMemeCoins", "tradingcardcommunity",
    "CryptoCurrencyTrading", "BitcoinMarkets", "GoldandBlack", "cryptomining", "Malaysia_Crypto",
    "ethmemecoins", "CryptoTechnology", "CrossTrading_inRoblox", "Tronix", "Yield_Farming",
    "gpumining", "CoinMarketCap", "daytrade", "CryptoNewsandTalk", "Polkadot", "CoinMasterGame",
    "CryptoExchange", "RoyaleHighTrading", "TradingEdge", "Trading_es", "UKcoins",
    "RocketLeagueExchange", "AMPToken", "TsumTsum", "NFT", "Stellar", "nanocurrency", "Avax",
    "ExodusWallet", "cro", "BitcoinBrasil", "Chainlink", "cryptography", "CryptoInvesting",
    "BlockchainStartups", "Jobs4Bitcoins", "BinanceCrypto", "Solana_Memes", "StockTradingIdeas",
    "TokenFinders", "TransformersTrading",
]

# All Twitter accounts — named usernames + raw IDs (same as frontend constants.ts)
DEFAULT_TWITTER_ACCOUNTS = [
    # Filtered active accounts only (from twitter_active_new.csv)
    "782946231551131648", "1203496290589405185", "18469669", "893111826254356481",
    "1323762343302615040", "2207129125", "906230721513181184", "3109476390",
    "1297503202464718850", "398148139", "982719351244472320", "51073409",
    "4473212565", "972970759416111104", "618539620", "2260491445",
    "1384549926080860166", "731402158512476161", "2650025562", "1448939883423207452",
    "978732571738755072", "935742315389444096", "1223056821037957120", "911716127365042177",
    "146345384", "34097500", "37794688", "1360636645989441539",
    "993962483332329472", "1301215504686694400", "33149981", "1453592537567006720",
    "949685739935158272", "1433401849349132292", "634075747",
]

CMC_API_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


async def _fetch_reddit_posts(subreddits: list[str], reddit_token: str, lookback_hours: int = 16) -> list[dict]:
    """Fetch recent posts + comments from Reddit using OAuth token."""
    all_posts = []
    cutoff_time = time.time() - (lookback_hours * 3600)

    async with httpx.AsyncClient(timeout=30) as client:
        for sub in subreddits:
            try:
                # Posts
                resp = await client.get(
                    f"https://oauth.reddit.com/r/{sub}/new.json?limit=100",
                    headers={
                        "Authorization": f"Bearer {reddit_token}",
                        "User-Agent": "CryptoPulseAI/1.0",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    children = data.get("data", {}).get("children", [])
                    for child in children:
                        p = child.get("data", {})
                        created = p.get("created_utc", 0)
                        if created < cutoff_time:
                            continue
                        if "Daily Discussion" in (p.get("title") or ""):
                            continue
                        all_posts.append({
                            "title": p.get("title", ""),
                            "selftext": (p.get("selftext") or "")[:500],
                            "subreddit": p.get("subreddit", sub),
                            "score": p.get("score", 0),
                            "source": "Reddit"
                        })
                else:
                    logger.warning(f"Reddit r/{sub}: {resp.status_code}")
                
                # Comments
                resp2 = await client.get(
                    f"https://oauth.reddit.com/r/{sub}/comments.json?limit=100",
                    headers={
                        "Authorization": f"Bearer {reddit_token}",
                        "User-Agent": "CryptoPulseAI/1.0",
                    },
                )
                if resp2.status_code == 200:
                    data2 = resp2.json()
                    children2 = data2.get("data", {}).get("children", [])
                    for child in children2:
                        c = child.get("data", {})
                        created = c.get("created_utc", 0)
                        if created < cutoff_time:
                            continue
                        body = (c.get("body", "") or "")[:300].replace("\n", " ").strip()
                        if body and len(body) > 10:
                            all_posts.append({
                                "title": body,
                                "selftext": "",
                                "subreddit": c.get("subreddit", sub),
                                "score": c.get("score", 0),
                                "source": "Reddit_comment"
                            })
            except Exception as e:
                logger.warning(f"Reddit r/{sub} error: {e}")

    return all_posts


async def _fetch_twitter_posts(accounts: list[str], lookback_hours: int = 16) -> list[dict]:
    """Fetch recent tweets from Twitter List using twitter-api45 listtimeline endpoint."""
    settings = get_settings()
    api_key = settings.TWITTER_RAPID_API_KEY or "3fa1808794msh4889848f150da1ep1e822ejsnd21a6ca25058"
    twitter_host = settings.TWITTER_HOST or "twitter-api45.p.rapidapi.com"
    list_id = settings.TWITTER_LIST_ID or "1343798673386434560"

    if not api_key:
        logger.warning("TWITTER_RAPID_API_KEY not set, skipping Twitter fetch")
        return []

    all_tweets = []
    cutoff_date = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            url = f"https://{twitter_host}/listtimeline.php?list_id={list_id}"
            headers = {
                "X-RapidAPI-Key": api_key,
                "X-RapidAPI-Host": twitter_host
            }

            # Retry with backoff
            resp = None
            for attempt in range(4):
                resp = await client.get(url, headers=headers)
                if resp.status_code == 429:
                    backoff = min(5 * (2 ** attempt), 30)
                    logger.warning(f"Twitter list timeline: 429 rate limited, retry {attempt+1}/3 in {backoff}s...")
                    await asyncio.sleep(backoff)
                    continue
                break

            if resp is None or resp.status_code == 403:
                logger.warning("Twitter list timeline: 403 Forbidden")
                return []
            if resp.status_code != 200:
                logger.warning(f"Twitter list timeline: {resp.status_code}")
                return []

            data = resp.json()
            timeline = data.get("timeline", [])

            for tweet in timeline:
                created_at_str = tweet.get("created_at")
                if not created_at_str:
                    continue

                created_at = datetime.strptime(created_at_str, "%a %b %d %H:%M:%S %z %Y")
                if created_at < cutoff_date:
                    continue

                all_tweets.append({
                    "text": tweet.get("text", ""),
                    "user": tweet.get("screen_name", "unknown"),
                    "created_at": created_at.isoformat(),
                    "source": "Twitter"
                })

        except Exception as e:
            logger.warning(f"Twitter list timeline error: {e}")

    return all_tweets


async def _fetch_telegram_posts(lookback_hours: int = 16) -> list[dict]:
    """Fetch recent messages from configured Telegram chats."""
    try:
        client = await get_telethon_client()
        parser = ChatParser(client)
        
        # Load chats from config
        config = load_chats_config()
        chat_ids = config.get("chats", [])
        
        if not chat_ids:
            logger.warning("No Telegram chats configured")
            return []

        # Convert hours to days for parser (approximation)
        days = (lookback_hours / 24.0) + 0.1 # Add a bit of buffer
        
        logger.info(f"Starting Telegram parsing for {len(chat_ids)} chats...")
        messages = await parser.parse_all_chats(
            chat_ids, 
            days=days, 
            max_messages_per_chat=15
        )
        
        # Exact 16h filtering
        cutoff_date = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)
        filtered_msgs = []
        for msg in messages:
            msg_date = datetime.fromisoformat(msg["date"])
            if msg_date.tzinfo is None:
                msg_date = msg_date.replace(tzinfo=timezone.utc)
            
            if msg_date >= cutoff_date:
                filtered_msgs.append({
                    "text": msg["text"],
                    "chat": msg["chat_title"],
                    "date": msg["date"],
                    "source": "Telegram"
                })
        
        return filtered_msgs
    except Exception as e:
        logger.error(f"Telegram fetch failed: {e}")
        return []


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


async def _filter_with_gemini(all_data: list[dict], gemini_api_key: str) -> str:
    """Use Gemini 2.5 Flash to filter and compress multi-source social data."""
    sources = {"Reddit": [], "Twitter": [], "Telegram": []}
    for item in all_data:
        sources[item["source"]].append(item)

    payload_summary = []
    for src, items in sources.items():
        if items:
            payload_summary.append(f"--- {src.upper()} ({len(items)} items) ---")
            payload_summary.append(json.dumps(items, ensure_ascii=False))

    prompt = f"""INPUT RAW DATA (Last 16 Hours):
{chr(10).join(payload_summary)}

TASK:
You are the FIRST STAGE of a two-stage AI pipeline. Read all the above raw social media data from the last 16 hours, and compress it into a dense, highly informative analysis context that will be passed to Claude for final processing.
Filter out all spam, useless hype, unrelated chatter, and noise.
Extract only the FACTUAL sentiment, warnings, news, and genuine community feelings about: BTC, ETH, XRP, SOL, DOGE, BNB (и любые крупные Altcoins).

CRITICAL RULES FOR TWITTER DATA:
- Twitter is ONLY used for BREAKING NEWS detection: hacks, exploits, SEC actions, exchange listings, major partnerships, protocol upgrades, whale movements.
- IGNORE all Twitter opinions, predictions, shilling, FOMO, price targets, and sentiment.
- If a Twitter post is just someone's opinion or prediction — DISCARD IT.
- Only include Twitter data if it reports a VERIFIABLE FACT or EVENT.
- Reddit is the PRIMARY source for sentiment analysis.

OUTPUT RULES:
- Output ONLY pure dense Markdown text. No JSON.
- Group the summary logically by coin.
- Cite specific trends and mentions from specific platforms.
- Clearly mark any breaking news from Twitter with [BREAKING NEWS] tag.
- Do NOT make your own price predictions. You are just a summarizer for Claude.
- Language: Russian.
- Keep the final output under 3,000 words."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"

    gemini_body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": "You are an elite data extraction engine. You filter noise from social media and keep pure signal."}]},
        "generationConfig": {"temperature": 0.1},
    }

    MAX_RETRIES = 3
    async with httpx.AsyncClient(timeout=3600) as client:
        for attempt in range(MAX_RETRIES + 1):
            resp = await client.post(url, json=gemini_body)
            
            if resp.status_code == 200:
                break
            
            if resp.status_code in (503, 429, 500) and attempt < MAX_RETRIES:
                wait = 180 * (attempt + 1)  # 3min, 6min, 9min
                logger.warning(f"Gemini API error {resp.status_code}, retry {attempt+1}/{MAX_RETRIES} in {wait}s...")
                await asyncio.sleep(wait)
                continue
            
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

SOCIAL SENTIMENT & NEWS DATA (LAST 16 HOURS):
--- FILTERED CONTEXT FROM GEMINI ---
{filtered_context}

TASK: Analyze sentiment for BTC, ETH, XRP, SOL, DOGE, BNB. CURRENT UTC TIME: {now_utc}.
OUTPUT: JSON matching schema.

FORECAST TASK: Generate a detailed hourly forecast for the next 24 hours.
MSK CONTEXT: Current time is UTC+3 (Moscow). 
The FIRST point (hourOffset: 1) MUST be the price at the NEXT full hour from now in Moscow time.
FIELDS: "targetPrice24h" (final point price), "targetChange24h" (final point %), "hourlyForecast" (array of exactly 24 objects). 

CRITICAL INSTRUCTION: Your predicted target prices MUST be realistically anchored to the Real-Time Prices listed above.
ZERO GAPS POLICY: For EACH of the 24 objects in "hourlyForecast", you MUST provide valid numeric values for ALL fields: "price", "change", and "confidence". 
- "confidence" MUST be an integer from 0 to 100.
- "change" MUST be the percentage deviation from the current price.
- "price" MUST be the absolute predicted price.
DO NOT use null. DO NOT skip any hour. DO NOT provide "undefined". Every single point in the 24-hour sequence must be complete and mathematically consistent. If you provide less than 24 points or any missing fields, the analysis is a FAILURE.

RULES: Russian language for text. Extremely concise. "forecastLabel": "Авто-анализ (24ч)"""

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            CLAUDE_API_URL,
            headers={
                "x-api-key": claude_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-opus-4-6",
                "max_tokens": 16384,
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

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Claude JSON parse error at pos {e.pos}: {text[max(0,e.pos-50):e.pos+50] if e.pos else text[:100]}")
            # Try aggressive recovery: find the last valid closing brace
            for i in range(len(text) - 1, -1, -1):
                if text[i] == '}':
                    try:
                        return json.loads(text[:i+1])
                    except json.JSONDecodeError:
                        continue
            raise RuntimeError(f"Failed to parse Claude response as JSON: {str(e)}")


async def run_scheduled_analysis(trigger: str = "scheduled", mode: str = "reddit_only") -> None:
    """Execute the full auto-analysis pipeline and save results to DB.
    
    mode: 'reddit_only' or 'reddit_twitter'
    """
    logger.info(f"=== Starting auto-analysis (trigger: {trigger}, mode: {mode}) ===")
    settings = get_settings()
    lookback = settings.ANALYSIS_LOOKBACK_HOURS

    # Validate keys
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    claude_key = os.environ.get("CLAUDE_API_KEY", "") or settings.CLAUDE_API_KEY
    reddit_id = os.environ.get("REDDIT_CLIENT_ID", "") or settings.REDDIT_CLIENT_ID
    reddit_secret = os.environ.get("REDDIT_CLIENT_SECRET", "") or settings.REDDIT_CLIENT_SECRET
    cmc_key = os.environ.get("CMC_API_KEY", "") or settings.CMC_API_KEY
    
    if not claude_key or not gemini_key:
        logger.error(f"CLAUDE_API_KEY ({bool(claude_key)}) or GEMINI_API_KEY ({bool(gemini_key)}) missing. Skipping analysis.")
        return

    async_session = get_async_session()
    async with async_session() as session:
        log = AnalysisLog(mode=mode, status="running", trigger=trigger)
        session.add(log)
        await session.commit()
        await session.refresh(log)

        try:
            # 1. Reddit
            logger.info(f"Step 1/4: Fetching Reddit (Window: {lookback}h)...")
            
            reddit_posts = []
            if reddit_id and reddit_secret:
                reddit_token = await _get_reddit_token(reddit_id, reddit_secret)
                reddit_posts = await _fetch_reddit_posts(DEFAULT_SUBREDDITS, reddit_token, lookback)
            else:
                logger.warning("REDDIT_CLIENT_ID/SECRET not set, skipping Reddit")
            
            # 2. Twitter (only if mode includes it)
            twitter_posts = []
            if mode == "reddit_twitter":
                logger.info(f"Step 2/4: Fetching Twitter (Window: {lookback}h)...")
                twitter_posts = await _fetch_twitter_posts(DEFAULT_TWITTER_ACCOUNTS, lookback)
            else:
                logger.info("Step 2/4: Twitter SKIPPED (reddit_only mode)")
            
            logger.info(f"Fetched: Reddit={len(reddit_posts)}, Twitter={len(twitter_posts)}")
            
            # 3. Telegram — DISABLED
            logger.info("Telegram SKIPPED (disabled)")
            telegram_posts = []
            
            # 4. Market context
            logger.info("Market Context...")
            market_context = "MARKET CONTEXT: Data unavailable."
            if cmc_key:
                market_context = await _fetch_market_data(cmc_key)

            combined_data = reddit_posts + twitter_posts + telegram_posts
            if not combined_data:
                raise RuntimeError("No social data collected. Cannot analyze.")

            # 5. Filters & AI
            logger.info(f"Step 3/4: Gemini 2.5 Flash Filtration ({len(combined_data)} items)...")
            filtered_context = await _filter_with_gemini(combined_data, gemini_key)
            logger.info(f"Gemini filter done, output length: {len(filtered_context)} chars")
            
            logger.info("Step 4/4: Claude Analysis...")
            result = await _analyze_with_claude(filtered_context, market_context, claude_key)

            # Save
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.result_json = json.dumps(result, ensure_ascii=False)
            log.reddit_posts_count = len(reddit_posts)
            log.twitter_tweets_count = len(twitter_posts)
            log.telegram_msgs_count = len(telegram_posts)
            await session.commit()

            logger.info(f"=== Auto-analysis complete (ID: {log.id}, mode: {mode}) ===")

            # Auto-start forecast tracking from this analysis
            try:
                count = await save_forecast_from_analysis(log.id)
                logger.info(f"[ForecastTracker] Created {count} trackings from auto-analysis ID={log.id}")
            except Exception as track_err:
                logger.error(f"[ForecastTracker] Failed to create trackings: {track_err}")

        except Exception as e:
            import traceback
            logger.error(f"Auto-analysis failed: {type(e).__name__}: {e}")
            logger.error(traceback.format_exc())
            log.finished_at = datetime.utcnow()
            log.status = "failed"
            log.error_message = str(e)
            await session.commit()


async def run_dual_analysis(trigger: str = "scheduled") -> None:
    """Run analysis: Reddit (sentiment) + Twitter (breaking news only).
    
    Twitter is used ONLY for factual breaking news detection (hacks, SEC, listings).
    Reddit provides the core sentiment signal.
    """
    logger.info("=== Starting auto-analysis (Reddit + Twitter breaking news) ===")
    settings = get_settings()
    lookback = settings.ANALYSIS_LOOKBACK_HOURS

    # Validate keys
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    claude_key = os.environ.get("CLAUDE_API_KEY", "") or settings.CLAUDE_API_KEY
    reddit_id = os.environ.get("REDDIT_CLIENT_ID", "") or settings.REDDIT_CLIENT_ID
    reddit_secret = os.environ.get("REDDIT_CLIENT_SECRET", "") or settings.REDDIT_CLIENT_SECRET
    cmc_key = os.environ.get("CMC_API_KEY", "") or settings.CMC_API_KEY

    if not claude_key or not gemini_key:
        logger.error("CLAUDE_API_KEY or GEMINI_API_KEY missing. Skipping analysis.")
        return

    # === PHASE 1: Data collection (Reddit + Twitter) ===
    logger.info(f"[AUTO] Phase 1: Fetching Reddit + Twitter data (window: {lookback}h)...")

    reddit_posts = []
    if reddit_id and reddit_secret:
        reddit_token = await _get_reddit_token(reddit_id, reddit_secret)
        reddit_posts = await _fetch_reddit_posts(DEFAULT_SUBREDDITS, reddit_token, lookback)
    else:
        logger.warning("[AUTO] REDDIT_CLIENT_ID/SECRET not set")

    twitter_posts = await _fetch_twitter_posts(DEFAULT_TWITTER_ACCOUNTS, lookback)

    logger.info(f"[AUTO] Data collected: Reddit={len(reddit_posts)}, Twitter={len(twitter_posts)}")

    # Market context
    market_context = "MARKET CONTEXT: Data unavailable."
    if cmc_key:
        market_context = await _fetch_market_data(cmc_key)

    # === PHASE 2: Combined analysis (Reddit sentiment + Twitter breaking news) ===
    combined = reddit_posts + twitter_posts
    if combined:
        logger.info("[AUTO] Phase 2: Reddit + Twitter (breaking news) — Gemini filter + Claude...")
        await _run_single_analysis(
            mode="reddit_only",
            trigger=trigger,
            data=combined,
            market_context=market_context,
            gemini_key=gemini_key,
            claude_key=claude_key,
            reddit_count=len(reddit_posts),
            twitter_count=len(twitter_posts),
        )
    else:
        logger.warning("[AUTO] No data collected, skipping analysis")

    logger.info("=== Auto-analysis complete ===")


async def _run_single_analysis(
    mode: str,
    trigger: str,
    data: list[dict],
    market_context: str,
    gemini_key: str,
    claude_key: str,
    reddit_count: int,
    twitter_count: int,
) -> None:
    """Run a single analysis pipeline (Gemini filter + Claude) and save to DB."""
    async_session = get_async_session()
    async with async_session() as session:
        log = AnalysisLog(mode=mode, status="running", trigger=trigger)
        session.add(log)
        await session.commit()
        await session.refresh(log)

        try:
            # Gemini filter
            filtered_context = await _filter_with_gemini(data, gemini_key)
            logger.info(f"[{mode}] Gemini done, {len(filtered_context)} chars")

            # Claude analysis
            result = await _analyze_with_claude(filtered_context, market_context, claude_key)

            # Save
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.result_json = json.dumps(result, ensure_ascii=False)
            log.reddit_posts_count = reddit_count
            log.twitter_tweets_count = twitter_count
            log.telegram_msgs_count = 0
            await session.commit()

            logger.info(f"[{mode}] Analysis complete (ID: {log.id})")

            # Auto-start forecast tracking
            try:
                count = await save_forecast_from_analysis(log.id)
                logger.info(f"[{mode}] Created {count} forecast trackings")
            except Exception as track_err:
                logger.error(f"[{mode}] Failed to create trackings: {track_err}")

        except Exception as e:
            import traceback
            logger.error(f"[{mode}] Analysis failed: {type(e).__name__}: {e}")
            logger.error(traceback.format_exc())
            log.finished_at = datetime.utcnow()
            log.status = "failed"
            log.error_message = str(e)
            await session.commit()
