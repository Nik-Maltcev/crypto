"""Hourly Hypothesis Mode — TEST.

Every hour (at XX:50), collects fresh data and predicts the NEXT hour only:
1. Binance: current price + last 6 candles (1h) for momentum/trend
2. Reddit: fresh posts from last 1h (breaking news only)
3. Twitter: fresh tweets from last 1h
4. Sends to Claude with price action context → single prediction Up/Down for next hour

Results stored in DB for tracking accuracy.
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta, timezone

import httpx

from core.database import get_async_session
from core.models import AnalysisLog

logger = logging.getLogger(__name__)

BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines"
CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"

SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT", "BNBUSDT"]
SYMBOL_MAP = {"BTCUSDT": "BTC", "ETHUSDT": "ETH", "SOLUSDT": "SOL", "XRPUSDT": "XRP", "DOGEUSDT": "DOGE", "BNBUSDT": "BNB"}


async def _fetch_binance_candles(symbol: str, interval: str = "1h", limit: int = 6) -> list[dict]:
    """Fetch recent candles from Binance."""
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(BINANCE_KLINES_URL, params={
                "symbol": symbol, "interval": interval, "limit": limit
            })
            if resp.status_code == 200:
                data = resp.json()
                candles = []
                for c in data:
                    candles.append({
                        "open": float(c[1]),
                        "high": float(c[2]),
                        "low": float(c[3]),
                        "close": float(c[4]),
                        "volume": float(c[5]),
                        "close_time": int(c[6]),
                    })
                return candles
        except Exception as e:
            logger.warning(f"Binance candles error for {symbol}: {e}")
    return []


async def _fetch_reddit_recent(subreddits: list[str], token: str) -> list[dict]:
    """Fetch ALL Reddit posts from last 1 hour."""
    cutoff = datetime.utcnow() - timedelta(hours=1)
    cutoff_ts = cutoff.timestamp()
    posts = []
    
    async with httpx.AsyncClient(timeout=15) as client:
        for sub in subreddits:
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
                            posts.append({
                                "title": p.get("title", ""),
                                "text": (p.get("selftext", "") or "")[:200],
                                "sub": p.get("subreddit", ""),
                                "score": p.get("score", 0),
                            })
            except Exception:
                continue
            await asyncio.sleep(0.15)
    
    return sorted(posts, key=lambda x: x.get("score", 0), reverse=True)


async def _fetch_twitter_recent(accounts: list[str], api_key: str) -> list[dict]:
    """Fetch ALL tweets from last 1 hour."""
    cutoff = datetime.utcnow() - timedelta(hours=1)
    tweets = []
    
    async with httpx.AsyncClient(timeout=15) as client:
        for acc_id in accounts:
            try:
                resp = await client.get(
                    f"https://twitter241.p.rapidapi.com/user-tweets?user={acc_id}&count=20",
                    headers={
                        "X-RapidAPI-Key": api_key,
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
                                        user = entry.get("content", {}).get("itemContent", {}).get("tweet_results", {}).get("result", {}).get("core", {}).get("user_results", {}).get("result", {}).get("legacy", {}).get("screen_name", "")
                                        tweets.append({
                                            "text": tweet.get("full_text", "")[:200],
                                            "user": user,
                                        })
            except Exception:
                continue
            await asyncio.sleep(0.2)
    
    return tweets


async def _predict_next_hour(candles_data: dict, reddit_posts: list, twitter_posts: list, claude_key: str) -> dict:
    """Send price action + social data to Claude for next-hour prediction."""
    
    # Build price context
    price_lines = []
    for symbol, candles in candles_data.items():
        coin = SYMBOL_MAP.get(symbol, symbol)
        if not candles:
            continue
        current = candles[-1]["close"]
        # Calculate momentum
        changes = []
        for i in range(1, len(candles)):
            ch = ((candles[i]["close"] - candles[i-1]["close"]) / candles[i-1]["close"]) * 100
            changes.append(f"{ch:+.2f}%")
        
        vol_avg = sum(c["volume"] for c in candles) / len(candles)
        vol_last = candles[-1]["volume"]
        vol_ratio = vol_last / vol_avg if vol_avg > 0 else 1
        
        price_lines.append(
            f"{coin}: ${current:,.2f} | Последние {len(changes)} свечей (1ч): [{', '.join(changes)}] | "
            f"Объём: {'↑' if vol_ratio > 1.2 else '↓' if vol_ratio < 0.8 else '→'} ({vol_ratio:.1f}x от среднего)"
        )
    
    price_context = "\n".join(price_lines)
    
    # Social context
    reddit_text = json.dumps(reddit_posts[:20], ensure_ascii=False) if reddit_posts else "Нет свежих постов за последний час."
    twitter_text = json.dumps(twitter_posts[:15], ensure_ascii=False) if twitter_posts else "Нет свежих твитов за последний час."
    
    now_msk = datetime.utcnow() + timedelta(hours=3)
    next_hour_start = now_msk.replace(minute=0, second=0) + timedelta(hours=1)
    
    system_prompt = """Ты трейдер-аналитик. Тебе дают текущие цены, momentum последних свечей, объём, и свежие новости.
Задача: для каждой монеты предсказать направление СЛЕДУЮЩЕЙ 1-часовой свечи (Up или Down).

Отвечай ТОЛЬКО JSON:
{
  "predictions": [
    {"symbol": "BTC", "direction": "Up"|"Down", "confidence": 50-95, "reasoning": "краткое обоснование на русском"}
  ],
  "market_summary": "1-2 предложения общая картина на русском"
}

ПРАВИЛА:
- Используй momentum: 3+ свечи в одном направлении = вероятно продолжение ИЛИ разворот (смотри на объём)
- Высокий объём + тренд = продолжение. Падающий объём + тренд = возможный разворот.
- Новости (хаки, листинги, SEC) перевешивают технику
- Если нет чёткого сигнала — ставь confidence 50-55 и честно скажи "нет сигнала"
- НЕ УГАДЫВАЙ. Лучше низкий confidence чем неправильный прогноз с высоким."""

    user_prompt = f"""ВРЕМЯ: {now_msk.strftime('%H:%M')} МСК
ПРОГНОЗ НА: {next_hour_start.strftime('%H:00')}-{(next_hour_start + timedelta(hours=1)).strftime('%H:00')} МСК

ЦЕНЫ И MOMENTUM (последние 6 часовых свечей):
{price_context}

REDDIT (посты за последний час, отсортированы по score):
{reddit_text}

TWITTER (твиты за последний час):
{twitter_text}

Дай прогноз на следующий час для каждой монеты."""

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            CLAUDE_API_URL,
            headers={
                "x-api-key": claude_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-opus-4-20250514",
                "max_tokens": 2048,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
        )
        
        if resp.status_code != 200:
            raise RuntimeError(f"Claude API error: {resp.status_code} - {resp.text[:300]}")
        
        data = resp.json()
        text = ""
        for block in data.get("content", []):
            if block.get("type") == "text":
                text = block.get("text", "")
                break
        
        # Parse JSON from response
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)


async def run_hourly_hypothesis(trigger: str = "scheduled") -> None:
    """Main entry: collect data and predict next hour."""
    logger.info(f"=== HOURLY HYPOTHESIS: Starting (trigger: {trigger}) ===")
    
    claude_key = os.environ.get("CLAUDE_API_KEY", "")
    reddit_id = os.environ.get("REDDIT_CLIENT_ID", "")
    reddit_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    rapidapi_key = os.environ.get("RAPIDAPI_KEY", "3fa1808794msh4889848f150da1ep1e822ejsnd21a6ca25058")
    
    if not claude_key:
        logger.error("CLAUDE_API_KEY missing. Skipping.")
        return
    
    async_session = get_async_session()
    async with async_session() as session:
        # Guard: don't run if there's already a hypothesis from the last 50 minutes
        from sqlalchemy import select
        recent_cutoff = datetime.utcnow() - timedelta(minutes=50)
        existing = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hourly_hypothesis")
            .where(AnalysisLog.created_at >= recent_cutoff)
        )
        if existing.scalars().first():
            logger.info("[HYPOTHESIS] Skipping — already ran within last 50 min")
            return

        log = AnalysisLog(mode="hourly_hypothesis", status="running", trigger=trigger)
        session.add(log)
        await session.commit()
        await session.refresh(log)
        
        try:
            # 1. Binance candles (last 6 hours for each symbol)
            logger.info("[HYPOTHESIS] Fetching Binance candles...")
            candles_data = {}
            for symbol in SYMBOLS:
                candles_data[symbol] = await _fetch_binance_candles(symbol, "1h", 6)
            logger.info(f"[HYPOTHESIS] Got candles for {len(candles_data)} symbols")
            
            # 2. Reddit (last 1h) — ALL active subreddits
            reddit_posts = []
            if reddit_id and reddit_secret:
                logger.info("[HYPOTHESIS] Fetching Reddit (1h, all active subs)...")
                from auto_analysis import _get_reddit_token
                token = await _get_reddit_token(reddit_id, reddit_secret)
                # All active subreddits from constants
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
                reddit_posts = await _fetch_reddit_recent(active_subs, token)
            logger.info(f"[HYPOTHESIS] Reddit: {len(reddit_posts)} posts")
            
            # 3. Twitter (last 1h) — ALL active accounts
            logger.info("[HYPOTHESIS] Fetching Twitter (1h, all active)...")
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
            twitter_posts = await _fetch_twitter_recent(active_twitter_ids, rapidapi_key)
            logger.info(f"[HYPOTHESIS] Twitter: {len(twitter_posts)} tweets")
            
            # 4. Claude prediction
            logger.info("[HYPOTHESIS] Sending to Claude Opus...")
            result = await _predict_next_hour(candles_data, reddit_posts, twitter_posts, claude_key)
            
            # Save
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.result_json = json.dumps(result, ensure_ascii=False)
            log.reddit_posts_count = len(reddit_posts)
            log.twitter_tweets_count = len(twitter_posts)
            log.telegram_msgs_count = 0
            await session.commit()
            
            logger.info(f"=== HOURLY HYPOTHESIS complete (ID: {log.id}) ===")
            if result.get("predictions"):
                for p in result["predictions"]:
                    logger.info(f"  {p['symbol']}: {p['direction']} ({p['confidence']}%) — {p.get('reasoning', '')[:60]}")
        
        except Exception as e:
            import traceback
            logger.error(f"[HYPOTHESIS] Failed: {type(e).__name__}: {e}")
            logger.error(traceback.format_exc())
            log.finished_at = datetime.utcnow()
            log.status = "failed"
            log.error_message = str(e)
            await session.commit()


async def verify_hypothesis_results() -> None:
    """Check previous hour's hypothesis predictions against actual Binance candles."""
    logger.info("[HYPOTHESIS] Verifying previous predictions...")
    
    try:
        async_session = get_async_session()
        async with async_session() as session:
            # Find recent hypothesis entries (last 24h) that haven't been verified yet
            from sqlalchemy import select
            cutoff = datetime.utcnow() - timedelta(hours=25)
            result = await session.execute(
                select(AnalysisLog)
                .where(AnalysisLog.mode == "hourly_hypothesis")
                .where(AnalysisLog.status == "success")
                .where(AnalysisLog.created_at >= cutoff)
                .order_by(AnalysisLog.created_at.desc())
                .limit(50)
            )
            entries = result.scalars().all()
            
            if not entries:
                logger.info("[HYPOTHESIS] No entries to verify")
                return
            
            for entry in entries:
                if not entry.result_json:
                    continue
                
                try:
                    data = json.loads(entry.result_json)
                except:
                    continue
                
                # Skip if already verified
                if data.get("verified"):
                    continue
                
                # Check if enough time has passed (prediction at XX:50 for next hour, 
                # so need to wait until that hour ENDS + 10 min = ~130 min after prediction)
                entry_time = entry.created_at
                if (datetime.utcnow() - entry_time).total_seconds() < 130 * 60:
                    continue
                
                predictions = data.get("predictions", [])
                if not predictions:
                    continue
                
                verified_predictions = []
                hits = 0
                total = 0
                
                for pred in predictions:
                    symbol_map_rev = {"BTC": "BTCUSDT", "ETH": "ETHUSDT", "SOL": "SOLUSDT", 
                                      "XRP": "XRPUSDT", "DOGE": "DOGEUSDT", "BNB": "BNBUSDT"}
                    binance_symbol = symbol_map_rev.get(pred["symbol"])
                    if not binance_symbol:
                        continue
                    
                    try:
                        candles = await _fetch_binance_candles(binance_symbol, "1h", 3)
                        if len(candles) < 3:
                            continue
                        
                        candle = candles[-2]
                        actual_direction = "Up" if candle["close"] >= candle["open"] else "Down"
                        matched = pred["direction"] == actual_direction
                        
                        if matched:
                            hits += 1
                        total += 1
                        
                        verified_predictions.append({
                            "symbol": pred["symbol"],
                            "direction": pred["direction"],
                            "confidence": pred.get("confidence", 0),
                            "reasoning": pred.get("reasoning", ""),
                            "actual_direction": actual_direction,
                            "actual_open": candle["open"],
                            "actual_close": candle["close"],
                            "matched": matched,
                        })
                    except Exception as e:
                        logger.warning(f"[HYPOTHESIS] Failed to verify {pred['symbol']}: {e}")
                        continue
                
                if total > 0:
                    data["verified"] = True
                    data["verified_at"] = datetime.utcnow().isoformat()
                    data["predictions"] = verified_predictions
                    data["hits"] = hits
                    data["total"] = total
                    data["winrate"] = round((hits / total) * 100)
                    
                    entry.result_json = json.dumps(data, ensure_ascii=False)
                    logger.info(f"[HYPOTHESIS] Verified ID={entry.id}: {hits}/{total} ({data['winrate']}%)")
            
            await session.commit()
    except Exception as e:
        import traceback
        logger.error(f"[HYPOTHESIS] Verification error: {type(e).__name__}: {e}")
        logger.error(traceback.format_exc())
    logger.info("[HYPOTHESIS] Verification complete")
