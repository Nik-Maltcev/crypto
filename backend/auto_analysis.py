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
DEFAULT_SUBREDDITS = list(set([
    "CryptoCurrencies", "Ripple", "Monero", "crypto", "BitcoinMarkets", "RocketLeagueExchange", "NiceHash", "RealDayTrading",
    "cosmosnetwork", "gpumining", "GoldandBlack", "UniSwap", "decentraland", "LitecoinMarkets", "ethstaker", "cryptomining",
    "crypto_currency", "EnoughLibertarianSpam", "dogelon", "CryptoGamersCommunity", "AMPToken", "TsumTsum", "coingecko",
    "CryptoScamReport", "CoinWithUs", "OfficialTrumpCoin", "defisignals", "Sologenic", "XBlockChain", "Defiance", "CryptoHorde",
    "CryptoUnicornFinders", "BitcoinFrance", "BitcoinABC", "EthereumGang", "Malaysia_Crypto", "ethmemecoins", "NFT",
    "BitcoinBeginners", "NFTsMarketplace", "Stellar", "EtherMining", "BitcoinMining", "nanocurrency", "Metamask", "0xPolygon",
    "Avax", "thewallstreet", "ExodusWallet", "CardanoTrading", "CryptoAnarchy", "CryptoMexico", "ethereum", "XRP", "SHIBArmy",
    "litecoin", "FuturesTrading", "ASX_Bets", "Bitcoincash", "Crypto_General", "NFTExchange", "algorand", "AltStreetBets",
    "CoinMarketCap", "cro", "lastofuspart2", "jupiterexchange", "BitcoinBrasil", "MedievalCoin", "AirdropCryptoAlpha", "algotrading",
    "cryptocurrencymemes", "Cryptozoology", "Crypto_com", "CryptoCurrencyTrading", "Chainlink", "cryptography", "MarioKartTour",
    "mindcrack", "daytrade", "CryptoGrab", "Rblxcross_trading_", "CryptoTechnology", "PiNetwork", "CryptoMoon", "rocket_league_trading",
    "binance", "cardano", "CryptoIndia", "StocksAndTrading", "ledgerwallet", "CryptoMars", "CryptoMarsShots", "AlgorandOfficial",
    "RatchetAndClank", "CryptoNewsandTalk", "MemeCoinJunkies", "ethtrader", "altcoin", "swingtrading", "Slothana", "CryptoInvesting",
    "CryptoMoonShots", "Crypto_Currency_News", "dogecoin", "Anarcho_Capitalism", "defi", "kucoin", "MaddenUltimateTeam", "ethdev",
    "Polkadot", "CryptoScams", "BlockchainStartups", "RoyaleHigh_Trading", "Jobs4Bitcoins", "northcounty", "CrossTrading_inRoblox",
    "ARK_Trading", "options", "AllCryptoBets", "toshicoin", "Forex", "AvakinOfficial", "CoinMasterGame", "BinanceCrypto", "coinerrors",
    "GlobalOffensiveTrade", "Buttcoin", "Memecoinhub", "CryptoExchange", "phinvest", "Hedera", "RoyaleHigh_Roblox", "memecoins",
    "RobloxGAGTrading", "CryptoMarkets", "TradingView", "investing", "AnimalCrossingTrading", "CoinBase", "trading212", "pennystocks",
    "RoyaleHighTrading", "pokemontrades", "solana", "SolanaMemeCoins", "ReferralCodesCrypto", "IndianStreetBets", "Trading",
    "AncientCoins", "btc", "BloxFruitsTradingHub", "CryptoCurrency", "giftcardexchange", "MaddenMobileForums", "Bitcoin", "coins",
    "Daytrading", "TheTowerGame", "coincollecting", "conspiracy", "geometrydash", "hardwareswap", "CallOfDutyMobile", "FUTMobile",
    "Forexstrategy", "Pmsforsale", "PokemonGoTrade", "AdoptMeTrading", "AdoptMeRBX", "PubeFinance", "PublishProtocol", "PulseBitcoin",
    "Pulsechain", "PumpCrypto", "PURPEcryptocurrency", "QuantumBlockchain", "QuarkCoin", "QuiddTrading", "R6Marketplace_Trading",
    "RadiantBlockchain", "RadioCacaNFT", "RaiBlocks", "RandomActsOfBTC", "RariCapital", "RavenX", "Raydium", "rBitcoin",
    "rblxcross_trading", "RDAT", "reddCoin", "RedditavatarsNFT", "RedditBlockchain", "ReferenceCodeBinance", "RevalCoin",
    "ReviewTrading", "RevivalDefi", "Ride_Defi", "rigelprotocol", "RiotBlockchain", "RiperDefi", "Rise_Coin", "RoastmyNFT",
    "RobloxTrading", "rocketpool", "RopeSolana", "Rotl_Nft", "RoyalHighTrading", "RoyalProtocol", "RsrCoin", "RugEthereum",
    "RupeeBlockchain", "saadboi", "SaitamaInu_Official", "SaitoCrypto", "SaltBlockchain", "SaltCoin", "SanctumSolana", "SandboxNFT",
    "SantaCoin", "SargeCoin", "SatoshiStreetBets", "scam_coin", "ScientificCoin", "SeatlabNFT", "Securypto", "ShadowSolana",
    "ShakaiNFT", "ShibaDino", "Shibainucoin", "ShibaInuCrypto", "SHIBArmyNFT", "ShibaSikkaToken", "Shieldtoken_official",
    "ShinyTrading", "shitcoin_memecoin", "shouldaethereum", "ShpingCoin", "ShrimpSwap", "SigloCoin", "SimpleDefi", "SkyNetBinance",
    "SmileCoin", "smTrading", "snoofi", "SnowgeCoin", "solanabeach", "solanabitcoin", "SolanaBitcone", "solanaboobs", "SolanaCanada",
    "solanacasinos", "SolanaCBDC", "SolanaCryptoMemeCoin", "solanadev", "solanadoge", "solanaeas", "SolanaIndia", "SolanaInsights",
    "solanamemecoincalls", "SolanaMemeMoonshots", "Solana_Memes", "SolanaMonkeyApes", "SolanaNFT", "solanapepe", "SolanaPresale",
    "SolanaSniper", "SolanaSniperBots", "solanatools", "SolanaUK", "SolanaWalletTracker", "solanium", "SolarCoin", "SolCoins",
    "SoldierOfSolana", "Solible", "SolSeaNFT", "solwork", "sombraNFT", "SorareTrading", "SourceLessBlockchain", "Spacefy_NFT",
    "SpacePortCoin", "SpadesCoin", "SpearMoon", "spot_trading", "StakingAlertBinance", "StarverseNFT", "SteamTradingCards",
    "StellarCannaCoin", "StellarNFT", "StepFinance_", "StepN", "sterwers_Solana", "STICKYtoken", "stockTrading", "StockTradingIdeas",
    "stock_trading_India", "StoneDefi", "StonksTrading", "STOX", "suBitcoin", "SuccessKidSolana", "SushiSwap", "SwftCoin",
    "SwitchBlockchain", "SwoleDogeSolana", "Swop_Defi", "SysCoin", "TacoEnergy", "Tau_coin", "TcgCoin", "Telefy_Defi",
    "TeraWulfMiningBTC", "ternio", "Terra_Luna_crypto", "tezos", "TF2_Trading", "TheBinanceNFT", "TheDao", "thefaircoin", "thegraph",
    "TheosNFT", "ThePepeFamilyASA", "tildethine", "TokenFinders", "TomketAirdropID", "TonicCrypto", "TonysolpranoSolana",
    "TopCryptoSites", "TopNFT", "TosaInuCoin", "ToyotaBlockchain", "ToyotaBlockchainLab", "TradingAdvice", "TradingAI", "TradingAlerts",
    "tradingcardcommunity", "Tradingcards", "Trading_Courses_", "TradingDesk", "TradingEdge", "Trading_es", "Trading_Futures",
    "TradingInterview", "TradingLegends", "TradingPi", "TradingPost76", "TradingPsychologie", "TradingSignals",
    "TradingSiteReviewsCom", "trading_strategy", "TradingTechniques", "TradingViewSignals", "TradingVolatility",
    "TransformersTrading", "TreeDefi", "trenchors", "TriangleBitcoin", "TriasBlockchain", "Tronix", "trustapp", "trustNFT",
    "TycoonTrading", "UKcoins", "ULEI_COIN", "ULIT_COIN_", "UltraBlockchain", "UltraNFT", "UnifiDeFi", "UnitedBTC", "UNIUM_NFT",
    "Universa_Blockchain", "unlimited_defi", "UnturnedTrading", "UpcomingNFT", "UselessCrypto", "ValereumBlockchain", "Valinity_defi",
    "velarBTC", "VerusCoin", "VoxiesNFT", "VoyagerCrypto", "VstTrading", "vyper", "WallStreetBetsCrypto", "Wavesplatform",
    "Web3DeBankDefi", "WenLamboDefi", "Whitelist_Airdrop", "Wizard_bsc", "WoofCoin", "WSB_defi", "XcelDefi", "XendFinance",
    "XMax_Blockchain", "X_Token", "YBAOfficial", "YearnNFT", "YetuSwap", "yGOAT", "Yield_Farming", "zebec", "ZunaCoin",
]))

# Default Twitter accounts if none provided
DEFAULT_TWITTER_ACCOUNTS = [
    "VitalikButerin", "cz_binance", "brian_armstrong", "aantonop",
    "crypto", "CoinDesk", "Cointelegraph", "TheBlock__",
    "MessariCrypto", "glassnode", "santimentfeed", "whale_alert"
]

CMC_API_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


async def _fetch_reddit_posts(subreddits: list[str], reddit_token: str, lookback_hours: int = 16) -> list[dict]:
    """Fetch recent posts from Reddit using OAuth token."""
    all_posts = []
    cutoff_time = time.time() - (lookback_hours * 3600)

    async with httpx.AsyncClient(timeout=30) as client:
        for sub in subreddits:
            try:
                resp = await client.get(
                    f"https://oauth.reddit.com/r/{sub}/new.json?limit=100",
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
            except Exception as e:
                logger.warning(f"Reddit r/{sub} error: {e}")

    return all_posts


async def _fetch_twitter_posts(accounts: list[str], lookback_hours: int = 16) -> list[dict]:
    """Fetch recent tweets using RapidAPI."""
    settings = get_settings()
    api_key = settings.TWITTER_RAPID_API_KEY or "3fa1808794msh4889848f150da1ep1e822ejsnd21a6ca25058"
    twitter_host = settings.TWITTER_HOST or "twitter241.p.rapidapi.com"
    if not api_key:
        logger.warning("TWITTER_RAPID_API_KEY not set, skipping Twitter fetch")
        return []

    all_tweets = []
    # Current limit: parse up to 10 tweets per user to avoid hitting RapidAPI limits too hard
    count_per_user = 50
    cutoff_date = datetime.now(timezone.utc) - timedelta(hours=lookback_hours)

    async with httpx.AsyncClient(timeout=60) as client:
        for username in accounts:
            try:
                # Using twitter241.p.rapidapi.com/user-tweets
                url = f"https://{twitter_host}/user-tweets?user={username}&count={count_per_user}"
                headers = {
                    "X-RapidAPI-Key": api_key,
                    "X-RapidAPI-Host": twitter_host
                }
                
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    logger.warning(f"Twitter @{username}: {resp.status_code}")
                    continue

                data = resp.json()
                # Simplified parsing based on twitter241 structure
                instructions = data.get("result", {}).get("timeline", {}).get("instructions", [])
                if not instructions:
                    instructions = data.get("data", {}).get("user", {}).get("result", {}).get("timeline_v2", {}).get("timeline", {}).get("instructions", [])

                for instr in instructions:
                    if instr.get("type") == "TimelineAddEntries":
                        for entry in instr.get("entries", []):
                            tweet_data = entry.get("content", {}).get("itemContent", {}).get("tweet_results", {}).get("result", {}).get("legacy", {})
                            if not tweet_data: continue
                            
                            created_at_str = tweet_data.get("created_at")
                            if created_at_str:
                                # Twitter date format: "Wed Oct 10 20:19:24 +0000 2018"
                                created_at = datetime.strptime(created_at_str, "%a %b %d %H:%M:%S %z %Y")
                                if created_at < cutoff_date:
                                    continue
                                
                                all_tweets.append({
                                    "text": tweet_data.get("full_text") or tweet_data.get("text"),
                                    "user": username,
                                    "created_at": created_at.isoformat(),
                                    "source": "Twitter"
                                })
                
                # Sleep briefly between users to be polite
                await asyncio.sleep(0.5)
            except Exception as e:
                logger.warning(f"Twitter @{username} error: {e}")

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
    """Use Gemini to filter and compress multi-source social data."""
    # Group by source for better prompt structure
    sources = {"Reddit": [], "Twitter": [], "Telegram": []}
    for item in all_data:
        sources[item["source"]].append(item)

    payload_summary = []
    for src, items in sources.items():
        if items:
            payload_summary.append(f"--- {src.upper()} ({len(items)} items) ---")
            # Cap each source to avoid blowing context limits
            limited_items = items[:150]
            payload_summary.append(json.dumps(limited_items, ensure_ascii=False))

    prompt = f"""INPUT RAW DATA (Last 16 Hours):
{chr(10).join(payload_summary)}

TASK:
You are the FIRST STAGE of a two-stage AI pipeline. Read all the above raw social media data from the last 16 hours, and compress it into a dense, highly informative analysis context that will be passed to Claude for final processing.
Filter out all spam, useless hype, unrelated chatter, and noise.
Extract only the FACTUAL sentiment, warnings, news, and genuine community feelings about: BTC, ETH, XRP, SOL (и любые крупные Altcoins).

OUTPUT RULES:
- Output ONLY pure dense Markdown text. No JSON.
- Group the summary logically by coin.
- Cite specific trends and mentions from specific platforms (e.g. "В Telegram обсуждают...", "В Twitter заметили...").
- Do NOT make your own price predictions. You are just a summarizer for Claude.
- Language: Russian.
- Keep the final output under 3,000 words."""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_api_key}"

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            url,
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "systemInstruction": {"parts": [{"text": "You are an elite data extraction engine. You filter noise from social media and keep pure signal."}]},
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

SOCIAL SENTIMENT & NEWS DATA (LAST 16 HOURS):
--- FILTERED CONTEXT FROM GEMINI ---
{filtered_context}

TASK: Analyze sentiment for BTC, ETH, XRP, SOL. CURRENT UTC TIME: {now_utc}.
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
    lookback = settings.ANALYSIS_LOOKBACK_HOURS

    # Validate keys
    if not settings.CLAUDE_API_KEY or not settings.GEMINI_API_KEY:
        logger.error("AI API keys missing. Skipping analysis.")
        return

    async_session = get_async_session()
    async with async_session() as session:
        log = AnalysisLog(mode="multi-source", status="running", trigger=trigger)
        session.add(log)
        await session.commit()
        await session.refresh(log)

        try:
            # 1. Reddit & Twitter (Parallel)
            logger.info(f"Step 1/4: Fetching Reddit & Twitter (Window: {lookback}h)...")
            
            reddit_task = asyncio.Future()
            reddit_task.set_result([])
            if settings.REDDIT_CLIENT_ID and settings.REDDIT_CLIENT_SECRET:
                reddit_token = await _get_reddit_token(settings.REDDIT_CLIENT_ID, settings.REDDIT_CLIENT_SECRET)
                reddit_task = _fetch_reddit_posts(DEFAULT_SUBREDDITS, reddit_token, lookback)
            
            twitter_task = _fetch_twitter_posts(DEFAULT_TWITTER_ACCOUNTS, lookback)
            
            # Wait for parallel tasks
            reddit_posts, twitter_posts = await asyncio.gather(reddit_task, twitter_task)
            
            # 2. Telegram — TEMPORARILY DISABLED
            logger.info("Step 2/4: Telegram SKIPPED (temporarily disabled)")
            telegram_posts = []
            
            # 3. Market context
            logger.info("Market Context...")
            market_context = "MARKET CONTEXT: Data unavailable."
            if settings.CMC_API_KEY:
                market_context = await _fetch_market_data(settings.CMC_API_KEY)

            combined_data = reddit_posts + twitter_posts + telegram_posts
            if not combined_data:
                raise RuntimeError("No social data collected. Cannot analyze.")

            # 4. Filters & AI
            logger.info("Step 3/4: Gemini Filtration...")
            filtered_context = await _filter_with_gemini(combined_data, settings.GEMINI_API_KEY)
            
            logger.info("Step 4/4: Claude Analysis...")
            result = await _analyze_with_claude(filtered_context, market_context, settings.CLAUDE_API_KEY)

            # Save
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.result_json = json.dumps(result, ensure_ascii=False)
            log.reddit_posts_count = len(reddit_posts)
            log.twitter_tweets_count = len(twitter_posts)
            log.telegram_msgs_count = len(telegram_posts)
            await session.commit()

            logger.info(f"=== Auto-analysis complete (ID: {log.id}) ===")

            # Auto-start forecast tracking from this analysis
            try:
                count = await save_forecast_from_analysis(log.id)
                logger.info(f"[ForecastTracker] Created {count} trackings from auto-analysis ID={log.id}")
            except Exception as track_err:
                logger.error(f"[ForecastTracker] Failed to create trackings: {track_err}")

        except Exception as e:
            logger.error(f"Auto-analysis failed: {e}")
            log.finished_at = datetime.utcnow()
            log.status = "failed"
            log.error_message = str(e)
            await session.commit()
