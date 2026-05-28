"""Mentions Tracker — counts coin mentions across Reddit + Twitter (24h).

Parses all active sources and counts how many times each coin ticker is mentioned.
Separates main coins (BTC, ETH, SOL, XRP, DOGE, BNB) from altcoins.
"""

import asyncio
import json
import logging
import os
import re
from datetime import datetime, timedelta

import httpx

from core.database import get_async_session
from core.models import AnalysisLog

logger = logging.getLogger(__name__)

# Main coins we always track
MAIN_COINS = {"BTC", "ETH", "SOL", "XRP", "DOGE", "BNB"}

# Known altcoin tickers (common ones to detect)
KNOWN_ALTS = {
    "ADA", "DOT", "AVAX", "MATIC", "LINK", "UNI", "ATOM", "FIL", "APT", "ARB",
    "OP", "SUI", "SEI", "TIA", "INJ", "FET", "RNDR", "WLD", "JUP", "PYTH",
    "PEPE", "WIF", "BONK", "FLOKI", "SHIB", "MEME", "TURBO", "BRETT", "NEIRO",
    "TON", "TRX", "NEAR", "ICP", "HBAR", "VET", "ALGO", "FTM", "SAND", "MANA",
    "AXS", "GALA", "IMX", "BLUR", "LDO", "RPL", "SSV", "EIGEN", "PENDLE",
    "AAVE", "MKR", "CRV", "COMP", "SNX", "DYDX", "GMX", "GRT", "ENS",
    "STX", "ORDI", "RUNE", "KAS", "TAO", "RENDER", "AR", "THETA", "HNT",
    "JASMY", "CHZ", "PENGU", "ME", "ERA", "BSB", "ZK", "STRK", "MANTA",
    "DYM", "ALT", "PIXEL", "PORTAL", "AEVO", "ENA", "W", "ONDO", "ETHFI",
    "REZ", "BB", "IO", "ZRO", "LISTA", "BANANA", "NOT", "DOGS", "HMSTR",
    "CATI", "SCR", "MOVE", "USUAL", "VANA", "PENGU", "ME", "HYPE",
}

# Words to exclude (common English words that look like tickers)
EXCLUDE_WORDS = {
    "THE", "FOR", "AND", "NOT", "ARE", "BUT", "ALL", "CAN", "HAS", "HER",
    "WAS", "ONE", "OUR", "OUT", "YOU", "HAD", "HOT", "OLD", "RED", "RUN",
    "TOP", "USE", "WAY", "WIN", "NOW", "NEW", "BIG", "GET", "LET", "SAY",
    "SHE", "TOO", "ITS", "MAY", "DAY", "GOT", "HIM", "HIS", "HOW", "MAN",
    "DID", "SET", "PUT", "END", "WHY", "TRY", "ASK", "MEN", "RAN", "OWN",
    "SAT", "MET", "FEW", "SEE", "AGO", "USD", "API", "CEO", "SEC", "ETF",
    "NFT", "DCA", "ATH", "ATL", "ROI", "APY", "APR", "TVL", "DEX", "CEX",
    "ICO", "IDO", "IEO", "DAO", "AI", "US", "UK", "EU", "FED", "GDP",
    "CPI", "IMF", "IPO", "LLC", "INC", "LTD", "FAQ", "TBA", "TBD",
}

ALL_TICKERS = MAIN_COINS | KNOWN_ALTS


def _count_mentions(texts: list[str]) -> dict[str, int]:
    """Count ticker mentions in a list of texts."""
    counts = {}
    
    for text in texts:
        text_upper = text.upper()
        # Find all word-boundary tickers
        words = set(re.findall(r'\b[A-Z]{2,6}\b', text_upper))
        
        for word in words:
            if word in EXCLUDE_WORDS:
                continue
            if word in ALL_TICKERS:
                counts[word] = counts.get(word, 0) + 1
            # Also check $TICKER format
        
        # Check $TICKER patterns (more reliable for altcoins)
        dollar_tickers = re.findall(r'\$([A-Z]{2,6})\b', text_upper)
        for ticker in dollar_tickers:
            if ticker in EXCLUDE_WORDS:
                continue
            counts[ticker] = counts.get(ticker, 0) + 1
    
    return counts


async def run_mentions_scan() -> dict:
    """Scan Reddit + Twitter for coin mentions in last 24h."""
    logger.info("=== MENTIONS SCAN: Starting ===")
    
    reddit_id = os.environ.get("REDDIT_CLIENT_ID", "")
    reddit_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    rapidapi_key = os.environ.get("RAPIDAPI_KEY", "")
    
    reddit_texts = []
    twitter_texts = []
    
    # 1. Reddit (24h)
    if reddit_id and reddit_secret:
        logger.info("[MENTIONS] Fetching Reddit (24h)...")
        from auto_analysis import _get_reddit_token
        token = await _get_reddit_token(reddit_id, reddit_secret)
        
        cutoff = datetime.utcnow() - timedelta(hours=24)
        cutoff_ts = cutoff.timestamp()
        
        # Same subreddits as hypothesis
        active_subs = [
            "CryptoCurrency", "Bitcoin", "ethereum", "solana", "dogecoin",
            "CryptoMarkets", "altcoin", "defi", "binance", "XRP",
            "CoinBase", "ethtrader", "BitcoinMarkets", "CryptoMoonShots",
            "SolanaMemeCoins", "memecoins", "Daytrading", "Trading",
            "pennystocks", "investing", "SHIBArmy", "cardano",
            "Monero", "Polkadot", "Chainlink", "Avax", "Hedera",
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
                                body = (p.get("selftext", "") or "")[:500]
                                reddit_texts.append(f"{title} {body}")
                except Exception:
                    continue
                await asyncio.sleep(0.15)
        
        logger.info(f"[MENTIONS] Reddit: {len(reddit_texts)} posts")
    
    # 2. Twitter (24h)
    if rapidapi_key:
        logger.info("[MENTIONS] Fetching Twitter (24h)...")
        cutoff = datetime.utcnow() - timedelta(hours=24)
        
        active_twitter_ids = [
            "782946231551131648", "1203496290589405185", "18469669", "893111826254356481",
            "1323762343302615040", "2207129125", "906230721513181184", "3109476390",
            "1297503202464718850", "398148139", "982719351244472320", "51073409",
            "4473212565", "972970759416111104", "618539620", "2260491445",
            "1384549926080860166", "731402158512476161", "2650025562", "1448939883423207452",
            "978732571738755072", "935742315389444096", "1223056821037957120", "911716127365042177",
            "146345384", "34097500", "37794688", "1360636645989441539", "993962483332329472",
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
                                        tweet_date = datetime.strptime(tweet["created_at"], "%a %b %d %H:%M:%S %z %Y").replace(tzinfo=None)
                                        if tweet_date >= cutoff:
                                            twitter_texts.append(tweet.get("full_text", "")[:300])
                except Exception:
                    continue
                await asyncio.sleep(0.2)
        
        logger.info(f"[MENTIONS] Twitter: {len(twitter_texts)} tweets")
    
    # 3. Count mentions
    all_texts = reddit_texts + twitter_texts
    reddit_counts = _count_mentions(reddit_texts)
    twitter_counts = _count_mentions(twitter_texts)
    total_counts = _count_mentions(all_texts)
    
    # Separate main coins and altcoins
    main_results = []
    alt_results = []
    
    for ticker, count in sorted(total_counts.items(), key=lambda x: x[1], reverse=True):
        entry = {
            "symbol": ticker,
            "total": count,
            "reddit": reddit_counts.get(ticker, 0),
            "twitter": twitter_counts.get(ticker, 0),
        }
        if ticker in MAIN_COINS:
            main_results.append(entry)
        else:
            alt_results.append(entry)
    
    result = {
        "scanned_at": datetime.utcnow().isoformat() + "Z",
        "reddit_posts": len(reddit_texts),
        "twitter_tweets": len(twitter_texts),
        "main_coins": main_results,
        "altcoins": alt_results[:50],  # Top 50 altcoins by mentions
    }
    
    logger.info(f"=== MENTIONS SCAN complete: {len(main_results)} main, {len(alt_results)} alts ===")
    return result
