"""Mentions Tracker — uses Gemini to analyze coin mentions from Reddit + Twitter (6h).

Parses all active sources (6h window), sends raw text to Gemini 2.5 Flash,
asks it to count and rank coin mentions with context understanding.
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta

import httpx

logger = logging.getLogger(__name__)

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


async def _fetch_reddit_6h(token: str) -> list[str]:
    """Fetch Reddit posts from last 6 hours."""
    cutoff = datetime.utcnow() - timedelta(hours=6)
    cutoff_ts = cutoff.timestamp()
    texts = []
    
    active_subs = [
        "phinvest", "investing", "IndianStreetBets", "Trading", "Bitcoin", "coins", "Daytrading",
        "TheTowerGame", "coincollecting", "conspiracy", "geometrydash", "hardwareswap", "CallOfDutyMobile",
        "FUTMobile", "Pmsforsale", "PokemonGoTrade", "AdoptMeTrading", "AdoptMeRBX", "btc", "CryptoCurrency",
        "Anarcho_Capitalism", "TradingViewSignals", "options", "BloxFruitsTradingHub", "trading212",
        "giftcardexchange", "Forexstrategy", "pennystocks", "CryptoMarkets", "algotrading", "pokemontrades",
        "ASX_Bets", "coinerrors", "RoyaleHigh_Roblox", "Cryptozoology", "RatchetAndClank", "PiNetwork",
        "defi", "AncientCoins", "ethtrader", "binance", "toshicoin", "RobloxGAGTrading", "BitcoinBeginners",
        "XRP", "CoinBase", "solana", "northcounty", "Forex", "CryptoIndia", "CryptoScams", "memecoins",
        "StocksAndTrading", "FuturesTrading", "cardano", "RoyaleHigh_Trading", "MaddenMobileForums",
        "RobloxTrading", "ethereum", "MarioKartTour", "AirdropCryptoAlpha", "litecoin", "dogecoin",
        "BitcoinMining", "TradingView", "thewallstreet", "SHIBArmy", "Slothana", "MaddenUltimateTeam",
        "AvakinOfficial", "Buttcoin", "Tradingcards", "Hedera", "swingtrading", "ledgerwallet",
        "AnimalCrossingTrading", "solanadev", "Monero", "lastofuspart2", "CryptoMoonShots", "Memecoinhub",
        "GlobalOffensiveTrade", "SolanaMemeCoins", "tradingcardcommunity", "CryptoCurrencyTrading",
        "BitcoinMarkets", "GoldandBlack", "cryptomining", "Malaysia_Crypto", "ethmemecoins",
        "CryptoTechnology", "CrossTrading_inRoblox", "Tronix", "Yield_Farming", "gpumining",
        "CoinMarketCap", "daytrade", "CryptoNewsandTalk", "Polkadot", "CoinMasterGame", "CryptoExchange",
        "RoyaleHighTrading", "TradingEdge", "Trading_es", "UKcoins", "RocketLeagueExchange", "AMPToken",
        "TsumTsum", "NFT", "Stellar", "nanocurrency", "Avax", "ExodusWallet", "cro", "BitcoinBrasil",
        "Chainlink", "cryptography", "CryptoInvesting", "BlockchainStartups", "Jobs4Bitcoins",
        "BinanceCrypto", "Solana_Memes", "StockTradingIdeas", "TokenFinders", "TransformersTrading"
    ]
    
    async with httpx.AsyncClient(timeout=15) as client:
        for sub in active_subs:
            try:
                resp = await client.get(
                    f"https://oauth.reddit.com/r/{sub}/new.json?limit=100",
                    headers={"Authorization": f"Bearer {token}", "User-Agent": "CryptoPulseAI/1.0"}
                )
                if resp.status_code == 200:
                    children = resp.json().get("data", {}).get("children", [])
                    for child in children:
                        p = child.get("data", {})
                        if p.get("created_utc", 0) >= cutoff_ts:
                            title = p.get("title", "")
                            texts.append(f"[r/{sub}] {title}")
            except Exception:
                continue
            await asyncio.sleep(0.12)
    
    return texts


async def _fetch_twitter_6h(rapidapi_key: str) -> list[str]:
    """Fetch Twitter tweets from last 6 hours."""
    cutoff = datetime.utcnow() - timedelta(hours=6)
    texts = []
    
    active_twitter_ids = [
        "782946231551131648", "1203496290589405185", "18469669", "893111826254356481",
        "1323762343302615040", "2207129125", "906230721513181184", "3109476390",
        "1297503202464718850", "398148139", "982719351244472320", "51073409",
        "4473212565", "972970759416111104", "618539620", "2260491445",
        "1384549926080860166", "731402158512476161", "2650025562", "1448939883423207452",
        "978732571738755072", "935742315389444096", "1223056821037957120", "911716127365042177",
        "146345384", "34097500", "37794688", "1360636645989441539", "993962483332329472",
        "1301215504686694400", "33149981", "1453592537567006720", "949685739935158272",
        "1433401849349132292", "634075747"
    ]
    
    async with httpx.AsyncClient(timeout=15) as client:
        for acc_id in active_twitter_ids:
            try:
                resp = await client.get(
                    f"https://twitter241.p.rapidapi.com/user-tweets?user={acc_id}&count=20",
                    headers={
                        "X-RapidAPI-Key": rapidapi_key,
                        "X-RapidAPI-Host": "twitter241.p.rapidapi.com"
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    instructions = data.get("result", {}).get("timeline", {}).get("instructions", [])
                    for instr in instructions:
                        if instr.get("type") == "TimelineAddEntries":
                            for entry in instr.get("entries", []):
                                tweet = entry.get("content", {}).get("itemContent", {}).get("tweet_results", {}).get("result", {}).get("legacy", {})
                                if tweet.get("created_at"):
                                    try:
                                        tweet_date = datetime.strptime(tweet["created_at"], "%a %b %d %H:%M:%S %z %Y").replace(tzinfo=None)
                                        if tweet_date >= cutoff:
                                            user = entry.get("content", {}).get("itemContent", {}).get("tweet_results", {}).get("result", {}).get("core", {}).get("user_results", {}).get("result", {}).get("legacy", {}).get("screen_name", "")
                                            texts.append(f"[@{user}] {tweet.get('full_text', '')[:300]}")
                                    except:
                                        pass
            except Exception:
                continue
            await asyncio.sleep(0.15)
    
    return texts


async def _analyze_with_gemini(reddit_texts: list[str], twitter_texts: list[str], gemini_key: str) -> dict:
    """Send all texts to Gemini and ask it to rank coin mentions."""
    
    # Combine texts (titles only, compact)
    reddit_block = "\n".join(reddit_texts[:1500])
    twitter_block = "\n".join(twitter_texts[:500])
    
    prompt = f"""Проанализируй следующие посты из Reddit и Twitter за последние 6 часов.
Задача: определи какие криптовалюты упоминаются и обсуждаются.

ПРАВИЛА:
- Считай упоминания каждой монеты (тикер, полное название, сленг — всё считается)
- Например: "биток", "битка", "BTC", "Bitcoin" — всё это BTC
- "эфир", "ETH", "Ethereum" — всё это ETH  
- "$PEPE", "пепе", "PEPE" — всё это PEPE
- Учитывай контекст: если пост про "Solana ecosystem" — это SOL
- НЕ считай упоминания в контексте "я не покупаю X" или "X — скам" как отдельную категорию, просто считай общее упоминание

Раздели результат на:
1. ОСНОВНЫЕ (BTC, ETH, SOL, XRP, DOGE, BNB)
2. АЛЬТКОИНЫ (все остальные криптовалюты)

Отвечай ТОЛЬКО JSON:
{{
  "main_coins": [
    {{"symbol": "BTC", "mentions": 45, "sentiment": "neutral|bullish|bearish", "context": "краткое описание что обсуждают"}}
  ],
  "altcoins": [
    {{"symbol": "PEPE", "mentions": 12, "sentiment": "bullish", "context": "что обсуждают"}}
  ]
}}

Сортируй по количеству упоминаний (больше → выше).
Для альткоинов показывай только те что упоминаются 2+ раз.

=== REDDIT ({len(reddit_texts)} постов) ===
{reddit_block}

=== TWITTER ({len(twitter_texts)} твитов) ===
{twitter_block}"""

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            f"{GEMINI_API_URL}?key={gemini_key}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1},
            }
        )
        
        if resp.status_code != 200:
            raise RuntimeError(f"Gemini API error: {resp.status_code} - {resp.text[:300]}")
        
        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned no candidates")
        
        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        text = text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(text)


async def run_mentions_scan() -> dict:
    """Scan Reddit + Twitter (6h) and analyze with Gemini."""
    logger.info("=== MENTIONS SCAN: Starting ===")
    
    reddit_id = os.environ.get("REDDIT_CLIENT_ID", "")
    reddit_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    rapidapi_key = os.environ.get("RAPIDAPI_KEY", "3fa1808794msh4889848f150da1ep1e822ejsnd21a6ca25058")
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    
    if not gemini_key:
        raise RuntimeError("GEMINI_API_KEY not configured")
    
    # 1. Fetch Reddit
    reddit_texts = []
    if reddit_id and reddit_secret:
        logger.info("[MENTIONS] Fetching Reddit (6h)...")
        from auto_analysis import _get_reddit_token
        token = await _get_reddit_token(reddit_id, reddit_secret)
        reddit_texts = await _fetch_reddit_6h(token)
        logger.info(f"[MENTIONS] Reddit: {len(reddit_texts)} posts")
    
    # 2. Fetch Twitter
    twitter_texts = []
    if rapidapi_key:
        logger.info("[MENTIONS] Fetching Twitter (6h)...")
        twitter_texts = await _fetch_twitter_6h(rapidapi_key)
        logger.info(f"[MENTIONS] Twitter: {len(twitter_texts)} tweets")
    
    if not reddit_texts and not twitter_texts:
        raise RuntimeError("No data collected from any source")
    
    # 3. Analyze with Gemini
    logger.info("[MENTIONS] Sending to Gemini 2.5 Flash for analysis...")
    analysis = await _analyze_with_gemini(reddit_texts, twitter_texts, gemini_key)
    
    result = {
        "scanned_at": datetime.utcnow().isoformat() + "Z",
        "reddit_posts": len(reddit_texts),
        "twitter_tweets": len(twitter_texts),
        "main_coins": analysis.get("main_coins", []),
        "altcoins": analysis.get("altcoins", []),
    }
    
    logger.info(f"=== MENTIONS SCAN complete ===")
    return result
