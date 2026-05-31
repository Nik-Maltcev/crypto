"""Hypothesis V2 — Short-term Altcoin Drop Predictor.

Collects 16 hours of data (Reddit + Twitter + CMC) and predicts which altcoins
will DROP in the next 24 hours (for short positions on Bybit).

Two models run in parallel on the SAME data:
1. Claude Opus 4.6 (Anthropic)
2. DeepSeek v4 Pro

Results are compared side-by-side.
Only coins available on Bybit are included.

Schedule: Every 8 hours (3x per day) — 08:00, 16:00, 00:00 MSK.
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta, timezone

import httpx
from sqlalchemy import select

from core.database import get_async_session
from core.models import AnalysisLog

logger = logging.getLogger(__name__)

CLAUDE_API_URL = "https://api.anthropic.com/v1/messages"
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
BYBIT_INSTRUMENTS_URL = "https://api.bybit.com/v5/market/instruments-info"
CMC_BASE = "https://pro-api.coinmarketcap.com"
BINANCE_PROXY = "http://pkg-private2:iau7vmnt3jt3lkfs@quality.proxywing.com:8888"

EXCLUDED_SYMBOLS = {"BTC", "ETH", "BNB", "USDT", "USDC", "STETH", "WBTC", "WETH", "DAI", "BUSD"}


async def _fetch_bybit_symbols() -> set[str]:
    """Fetch all Bybit spot + linear perpetual symbols."""
    symbols = set()
    async with httpx.AsyncClient(timeout=30) as client:
        for category in ["spot", "linear"]:
            try:
                resp = await client.get(BYBIT_INSTRUMENTS_URL, params={"category": category, "limit": 1000})
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("result", {}).get("list", [])
                    for item in items:
                        base = item.get("baseCoin", "").upper()
                        if base:
                            symbols.add(base)
                else:
                    logger.warning(f"[HYP_V2] Bybit {category} returned {resp.status_code}")
            except Exception as e:
                logger.warning(f"[HYP_V2] Bybit {category} fetch error: {e}")
    
    if not symbols:
        logger.warning("[HYP_V2] Bybit API returned 0 symbols! Skipping Bybit filter.")
    
    logger.info(f"[HYP_V2] Bybit: {len(symbols)} symbols (spot + linear)")
    return symbols


async def _fetch_cmc_losers_and_volatile(cmc_key: str) -> list[dict]:
    """Fetch potential drop candidates from CMC: losers, high-volume alts, recently pumped."""
    coins = []
    async with httpx.AsyncClient(timeout=30) as client:
        headers = {"X-CMC_PRO_API_KEY": cmc_key, "Accept": "application/json"}

        # 1. Top losers (24h)
        try:
            resp = await client.get(
                f"{CMC_BASE}/v1/cryptocurrency/trending/gainers-losers",
                headers=headers,
                params={"limit": 50, "time_period": "24h", "sort_dir": "asc"}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for coin in data:
                    sym = coin.get("symbol", "").upper()
                    q = coin.get("quote", {}).get("USD", {})
                    if sym not in EXCLUDED_SYMBOLS and q.get("volume_24h", 0) > 500_000:
                        coins.append({
                            "symbol": sym,
                            "name": coin.get("name", ""),
                            "price": q.get("price", 0),
                            "change_1h": q.get("percent_change_1h", 0),
                            "change_24h": q.get("percent_change_24h", 0),
                            "change_7d": q.get("percent_change_7d", 0),
                            "volume_24h": q.get("volume_24h", 0),
                            "market_cap": q.get("market_cap", 0),
                            "source": "losers",
                        })
        except Exception as e:
            logger.warning(f"[HYP_V2] CMC losers error: {e}")

        # 2. Recently pumped (gainers that may dump) 
        try:
            resp = await client.get(
                f"{CMC_BASE}/v1/cryptocurrency/trending/gainers-losers",
                headers=headers,
                params={"limit": 50, "time_period": "24h"}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for coin in data:
                    sym = coin.get("symbol", "").upper()
                    q = coin.get("quote", {}).get("USD", {})
                    if sym not in EXCLUDED_SYMBOLS and q.get("volume_24h", 0) > 500_000:
                        coins.append({
                            "symbol": sym,
                            "name": coin.get("name", ""),
                            "price": q.get("price", 0),
                            "change_1h": q.get("percent_change_1h", 0),
                            "change_24h": q.get("percent_change_24h", 0),
                            "change_7d": q.get("percent_change_7d", 0),
                            "volume_24h": q.get("volume_24h", 0),
                            "market_cap": q.get("market_cap", 0),
                            "source": "pumped",
                        })
        except Exception as e:
            logger.warning(f"[HYP_V2] CMC gainers error: {e}")

        # 3. High volume alts (rank 20-100)
        try:
            resp = await client.get(
                f"{CMC_BASE}/v1/cryptocurrency/listings/latest",
                headers=headers,
                params={"start": 20, "limit": 80, "sort": "volume_24h", "convert": "USD"}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                for coin in data:
                    sym = coin.get("symbol", "").upper()
                    q = coin.get("quote", {}).get("USD", {})
                    if sym not in EXCLUDED_SYMBOLS:
                        coins.append({
                            "symbol": sym,
                            "name": coin.get("name", ""),
                            "price": q.get("price", 0),
                            "change_1h": q.get("percent_change_1h", 0),
                            "change_24h": q.get("percent_change_24h", 0),
                            "change_7d": q.get("percent_change_7d", 0),
                            "volume_24h": q.get("volume_24h", 0),
                            "market_cap": q.get("market_cap", 0),
                            "source": "high_volume",
                        })
        except Exception as e:
            logger.warning(f"[HYP_V2] CMC high volume error: {e}")

    # Deduplicate
    seen = set()
    unique = []
    for c in coins:
        if c["symbol"] not in seen:
            seen.add(c["symbol"])
            unique.append(c)
    return unique


async def _fetch_reddit_16h(reddit_id: str, reddit_secret: str) -> list[dict]:
    """Fetch Reddit posts from last 16 hours."""
    from auto_analysis import _get_reddit_token, _fetch_reddit_posts, DEFAULT_SUBREDDITS
    
    token = await _get_reddit_token(reddit_id, reddit_secret)
    posts = await _fetch_reddit_posts(DEFAULT_SUBREDDITS, token, lookback_hours=16)
    return posts


async def _fetch_twitter_16h() -> list[dict]:
    """Fetch Twitter posts from last 16 hours."""
    from auto_analysis import _fetch_twitter_posts, DEFAULT_TWITTER_ACCOUNTS
    
    tweets = await _fetch_twitter_posts(DEFAULT_TWITTER_ACCOUNTS, lookback_hours=16)
    return tweets


def _build_prompt(cmc_coins: list[dict], reddit_posts: list, twitter_posts: list, bybit_symbols: set[str]) -> tuple[str, str]:
    """Build system + user prompts for both models."""
    
    # Filter CMC coins to only Bybit-available (skip filter if Bybit returned 0)
    if bybit_symbols:
        bybit_coins = [c for c in cmc_coins if c["symbol"] in bybit_symbols]
    else:
        bybit_coins = cmc_coins
    
    # Market data — all Bybit coins
    market_lines = []
    for coin in bybit_coins:
        market_lines.append(
            f"{coin['symbol']} ({coin['name']}): ${coin['price']:.6f} | "
            f"1h: {coin['change_1h']:+.1f}% | 24h: {coin['change_24h']:+.1f}% | "
            f"7d: {coin['change_7d']:+.1f}% | Vol: ${coin['volume_24h']:,.0f} | "
            f"MCap: ${coin['market_cap']:,.0f} | src: {coin['source']}"
        )
    market_context = "\n".join(market_lines)

    # Social data — ALL posts, no limits
    top_reddit = sorted(reddit_posts, key=lambda x: x.get("score", 0), reverse=True)
    reddit_payload = json.dumps([{
        "title": p.get("title", ""),
        "text": (p.get("selftext", "") or ""),
        "sub": p.get("subreddit", ""),
        "score": p.get("score", 0),
    } for p in top_reddit], ensure_ascii=False)

    twitter_payload = json.dumps([{
        "text": t.get("text", ""),
        "user": t.get("user", ""),
    } for t in twitter_posts], ensure_ascii=False) if twitter_posts else "No Twitter data."

    bybit_available_list = sorted([c["symbol"] for c in bybit_coins])

    system_prompt = """You are CryptoPulse AI — a professional short-term crypto analyst specializing in SHORT positions.

Your task: Analyze 16 hours of social + market data and predict which altcoins will DROP significantly in the NEXT 24 HOURS.

Output pure JSON only. No markdown wrappers. Response must be parseable by JSON.parse().

Response Format:
{
  "summary": "String (Russian) - Overall market sentiment and why drops are expected, 2-3 sentences",
  "analysisTime": "ISO datetime string",
  "shortCandidates": [
    {
      "symbol": "COIN",
      "name": "Full Name",
      "currentPrice": 1.23,
      "targetPrice24h": 1.05,
      "expectedDrop": -14.6,
      "confidence": 75,
      "timeframe": "6-12h" | "12-18h" | "18-24h",
      "catalyst": "String (Russian) - What will trigger the drop",
      "reasoning": "String (Russian) - Detailed analysis",
      "riskLevel": "Low" | "Medium" | "High",
      "entryZone": "String - price range for entry",
      "stopLoss": 1.35,
      "bybitAvailable": true
    }
  ],
  "avoidShorting": [
    {
      "symbol": "COIN",
      "reason": "String (Russian) - Why NOT to short this despite looking weak"
    }
  ],
  "marketRiskNote": "String (Russian) - General risk warning for the next 24h"
}

RULES:
- You MUST ALWAYS provide exactly 5-10 shortCandidates. NEVER return an empty list. Even if the market looks uncertain, pick the LEAST favorable coins with lower confidence scores.
- Select 5-10 altcoins most likely to DROP 5-20%+ in the next 24 hours
- Sort by confidence (highest first)
- ONLY pick coins from the BYBIT AVAILABLE list
- Look for: exhausted pumps, negative news, broken support, token unlocks, whale dumps, declining volume after spike
- Be REALISTIC — don't predict -50% drops, focus on -5% to -20% range
- Include stop-loss levels (where the short thesis is invalidated)
- "avoidShorting": 2-4 coins that look weak but have short-squeeze risk or strong support
- All text in Russian
- EXCLUDE: BTC, ETH, BNB, USDT, USDC, DOGE, SOL, XRP
- If market conditions make shorting risky, still provide picks but set confidence lower (30-50%) and note the risk in reasoning"""

    user_prompt = f"""CURRENT TIME (UTC): {datetime.utcnow().isoformat()}Z

MARKET DATA (Bybit-available altcoins only):
{market_context}

BYBIT AVAILABLE SYMBOLS: {json.dumps(bybit_available_list)}

REDDIT (last 16 hours, {len(reddit_posts)} posts, top 400 by score):
{reddit_payload}

TWITTER (last 16 hours, {len(twitter_posts)} tweets):
{twitter_payload}

TASK: Identify 5-10 altcoins that will DROP in the next 24 hours.
Focus on: exhausted pumps, negative sentiment, broken technicals, upcoming bad events.
All coins MUST be on Bybit for shorting."""

    return system_prompt, user_prompt


async def _call_claude_opus(system_prompt: str, user_prompt: str, api_key: str) -> dict:
    """Call Claude Opus 4.6 API."""
    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            CLAUDE_API_URL,
            headers={
                "x-api-key": api_key,
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
            raise RuntimeError("Empty response from Claude Opus")

        return json.loads(text)


async def _call_deepseek_v4(system_prompt: str, user_prompt: str, api_key: str) -> dict:
    """Call DeepSeek v4 Pro API. Two-stage batching if data too large for 128K context."""
    
    # Check if we need batching for DeepSeek (128K context limit)
    total_chars = len(system_prompt) + len(user_prompt)
    estimated_tokens = total_chars // 4
    
    if estimated_tokens > 100000:
        logger.info(f"[HYP_V2] DeepSeek: data too large ({estimated_tokens} est. tokens), using 2-stage batch...")
        
        # Stage 1: Send Reddit + CMC to DeepSeek, get preliminary analysis
        reddit_start = user_prompt.find("REDDIT (last 16 hours")
        twitter_start = user_prompt.find("TWITTER (last 16 hours")
        
        if reddit_start > 0 and twitter_start > reddit_start:
            market_and_reddit = user_prompt[:twitter_start]
            twitter_section = user_prompt[twitter_start:]
            
            stage1_prompt = f"""{market_and_reddit}

ЗАДАЧА ЭТАП 1: Проанализируй рыночные данные и Reddit. Выдели 15-20 альткоинов которые с наибольшей вероятностью упадут в ближайшие 24 часа.
Для каждого укажи: symbol, причину ожидаемого падения, текущий sentiment в Reddit.
Ответь списком на русском."""

            stage1_result = ""
            async with httpx.AsyncClient(timeout=600) as client:
                resp = await client.post(
                    DEEPSEEK_API_URL,
                    headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
                    json={
                        "model": "deepseek-v4-pro",
                        "max_tokens": 4096,
                        "messages": [{"role": "user", "content": stage1_prompt}],
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    stage1_result = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    logger.info(f"[HYP_V2] DeepSeek Stage 1 complete: {len(stage1_result)} chars")
            
            if stage1_result:
                # Stage 2: Send Twitter + Stage 1 results → final JSON answer
                user_prompt = f"""ПРЕДВАРИТЕЛЬНЫЙ АНАЛИЗ (Reddit + Market Data):
{stage1_result}

{twitter_section}

Теперь на основе предварительного анализа и Twitter данных, дай финальный ответ в формате JSON."""
                logger.info("[HYP_V2] DeepSeek Stage 2: sending final request...")
    
    async with httpx.AsyncClient(timeout=600) as client:
        resp = await client.post(
            DEEPSEEK_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "content-type": "application/json",
            },
            json={
                "model": "deepseek-v4-pro",
                "max_tokens": 8192,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
        )

        if resp.status_code != 200:
            raise RuntimeError(f"DeepSeek API error: {resp.status_code} - {resp.text[:500]}")

        data = resp.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        text = text.replace("```json", "").replace("```", "").strip()
        
        if not text.endswith("}"):
            last_brace = text.rfind("}")
            if last_brace != -1:
                text = text[:last_brace + 1]

        if not text:
            raise RuntimeError("Empty response from DeepSeek v4 Pro")

        return json.loads(text)


async def run_hypothesis_v2(trigger: str = "scheduled") -> None:
    """Main entry: collect 16h data, predict 24h drops via two models."""
    logger.info(f"=== HYPOTHESIS V2: Starting (trigger: {trigger}) ===")

    claude_key = os.environ.get("CLAUDE_API_KEY", "")
    deepseek_key = os.environ.get("DEEPSEEK_API_KEY", "")
    reddit_id = os.environ.get("REDDIT_CLIENT_ID", "")
    reddit_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    cmc_key = os.environ.get("CMC_API_KEY", "")

    if not claude_key:
        logger.error("[HYP_V2] CLAUDE_API_KEY missing. Skipping.")
        return
    if not deepseek_key:
        logger.error("[HYP_V2] DEEPSEEK_API_KEY missing. Skipping.")
        return

    async_session = get_async_session()
    async with async_session() as session:
        # Guard: don't run if already ran within last 6 hours
        recent_cutoff = datetime.utcnow() - timedelta(hours=6)
        existing = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hypothesis_v2")
            .where(AnalysisLog.created_at >= recent_cutoff)
            .where(AnalysisLog.status.in_(["success", "running"]))
        )
        recent_entry = existing.scalars().first()
        if recent_entry:
            if recent_entry.status == "running":
                elapsed = (datetime.utcnow() - recent_entry.created_at).total_seconds() / 60
                if elapsed > 10:
                    recent_entry.status = "failed"
                    recent_entry.error_message = "Stuck in running state"
                    recent_entry.finished_at = datetime.utcnow()
                    await session.commit()
                else:
                    logger.info("[HYP_V2] Already running, skipping")
                    return
            else:
                logger.info("[HYP_V2] Already ran within last 6h, skipping")
                return

        log = AnalysisLog(mode="hypothesis_v2", status="running", trigger=trigger)
        session.add(log)
        await session.commit()
        await session.refresh(log)

        try:
            # 1. Bybit symbols
            logger.info("[HYP_V2] Step 1/5: Fetching Bybit symbols...")
            bybit_symbols = await _fetch_bybit_symbols()

            # 2. CMC data
            logger.info("[HYP_V2] Step 2/5: Fetching CMC data...")
            cmc_coins = []
            if cmc_key:
                cmc_coins = await _fetch_cmc_losers_and_volatile(cmc_key)
            logger.info(f"[HYP_V2] CMC: {len(cmc_coins)} coins")

            # 3. Reddit (16h)
            logger.info("[HYP_V2] Step 3/5: Fetching Reddit (16h)...")
            reddit_posts = []
            if reddit_id and reddit_secret:
                reddit_posts = await _fetch_reddit_16h(reddit_id, reddit_secret)
            logger.info(f"[HYP_V2] Reddit: {len(reddit_posts)} posts")

            # 4. Twitter (16h)
            logger.info("[HYP_V2] Step 4/5: Fetching Twitter (16h)...")
            twitter_posts = await _fetch_twitter_16h()
            logger.info(f"[HYP_V2] Twitter: {len(twitter_posts)} tweets")

            if not cmc_coins and not reddit_posts:
                raise RuntimeError("No data collected (CMC + Reddit both empty)")

            # 5. Build prompts (same for both models)
            system_prompt, user_prompt = _build_prompt(cmc_coins, reddit_posts, twitter_posts, bybit_symbols)

            # 6. Call both models in parallel
            logger.info("[HYP_V2] Step 5/5: Calling Claude Opus 4.6 + DeepSeek v4 Pro in parallel...")
            
            claude_task = _call_claude_opus(system_prompt, user_prompt, claude_key)
            deepseek_task = _call_deepseek_v4(system_prompt, user_prompt, deepseek_key)

            results = await asyncio.gather(claude_task, deepseek_task, return_exceptions=True)

            claude_result = None
            deepseek_result = None
            errors = []

            if isinstance(results[0], Exception):
                errors.append(f"Claude: {results[0]}")
                logger.error(f"[HYP_V2] Claude failed: {results[0]}")
            else:
                claude_result = results[0]

            if isinstance(results[1], Exception):
                errors.append(f"DeepSeek: {results[1]}")
                logger.error(f"[HYP_V2] DeepSeek failed: {results[1]}")
            else:
                deepseek_result = results[1]

            if not claude_result and not deepseek_result:
                raise RuntimeError(f"Both models failed: {'; '.join(errors)}")

            # Post-process: verify Bybit availability (skip if Bybit returned 0)
            if bybit_symbols:
                for result in [claude_result, deepseek_result]:
                    if result and result.get("shortCandidates"):
                        result["shortCandidates"] = [
                            c for c in result["shortCandidates"]
                            if c.get("symbol", "").upper() in bybit_symbols
                        ]

            # Combine results
            combined = {
                "claude_opus": claude_result,
                "deepseek_v4": deepseek_result,
                "metadata": {
                    "reddit_posts": len(reddit_posts),
                    "twitter_tweets": len(twitter_posts),
                    "cmc_coins_analyzed": len(cmc_coins),
                    "bybit_symbols_available": len(bybit_symbols),
                    "lookback_hours": 16,
                    "prediction_horizon": "24h",
                    "errors": errors if errors else None,
                },
            }

            # Save
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.result_json = json.dumps(combined, ensure_ascii=False)
            log.reddit_posts_count = len(reddit_posts)
            log.twitter_tweets_count = len(twitter_posts)
            log.telegram_msgs_count = 0
            await session.commit()

            logger.info(f"=== HYPOTHESIS V2 complete (ID: {log.id}) ===")
            if claude_result and claude_result.get("shortCandidates"):
                logger.info(f"  Claude picks: {[c['symbol'] for c in claude_result['shortCandidates']]}")
            if deepseek_result and deepseek_result.get("shortCandidates"):
                logger.info(f"  DeepSeek picks: {[c['symbol'] for c in deepseek_result['shortCandidates']]}")

        except Exception as e:
            import traceback
            logger.error(f"[HYP_V2] Failed: {type(e).__name__}: {e}")
            logger.error(traceback.format_exc())
            log.finished_at = datetime.utcnow()
            log.status = "failed"
            log.error_message = str(e)
            await session.commit()


async def verify_hypothesis_v2_results() -> None:
    """Verify hypothesis v2 predictions after 24 hours by checking actual prices."""
    logger.info("[HYP_V2] Verifying predictions...")

    cmc_key = os.environ.get("CMC_API_KEY", "")
    if not cmc_key:
        logger.warning("[HYP_V2] CMC_API_KEY not set, skipping verification")
        return

    async_session = get_async_session()
    async with async_session() as session:
        # Find entries from 24-48h ago that haven't been verified
        cutoff_start = datetime.utcnow() - timedelta(hours=48)
        cutoff_end = datetime.utcnow() - timedelta(hours=24)

        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hypothesis_v2")
            .where(AnalysisLog.status == "success")
            .where(AnalysisLog.created_at >= cutoff_start)
            .where(AnalysisLog.created_at <= cutoff_end)
        )
        entries = result.scalars().all()

        if not entries:
            logger.info("[HYP_V2] No entries to verify")
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

            # Collect all symbols from both models
            all_symbols = set()
            for model_key in ["claude_opus", "deepseek_v4"]:
                model_data = data.get(model_key)
                if model_data and model_data.get("shortCandidates"):
                    for c in model_data["shortCandidates"]:
                        all_symbols.add(c.get("symbol", "").upper())

            if not all_symbols:
                continue

            # Fetch current prices
            prices = {}
            async with httpx.AsyncClient(timeout=30) as client:
                headers = {"X-CMC_PRO_API_KEY": cmc_key, "Accept": "application/json"}
                symbols_str = ",".join(list(all_symbols)[:100])
                try:
                    resp = await client.get(
                        f"{CMC_BASE}/v1/cryptocurrency/quotes/latest",
                        headers=headers,
                        params={"symbol": symbols_str, "convert": "USD"}
                    )
                    if resp.status_code == 200:
                        resp_data = resp.json().get("data", {})
                        for sym, coin_data in resp_data.items():
                            price = coin_data.get("quote", {}).get("USD", {}).get("price", 0)
                            prices[sym.upper()] = price
                except Exception as e:
                    logger.warning(f"[HYP_V2] Price fetch error: {e}")
                    continue

            # Verify each model's predictions
            verification = {"verified": True, "verified_at": datetime.utcnow().isoformat()}

            for model_key in ["claude_opus", "deepseek_v4"]:
                model_data = data.get(model_key)
                if not model_data or not model_data.get("shortCandidates"):
                    continue

                hits = 0
                total = 0
                for candidate in model_data["shortCandidates"]:
                    sym = candidate.get("symbol", "").upper()
                    current_price = prices.get(sym)
                    start_price = candidate.get("currentPrice", 0)

                    if current_price and start_price > 0:
                        actual_change = ((current_price - start_price) / start_price) * 100
                        candidate["actualPrice24h"] = current_price
                        candidate["actualChange24h"] = round(actual_change, 2)
                        candidate["hit"] = actual_change < 0  # Any drop = partial hit
                        candidate["strongHit"] = actual_change <= -5  # 5%+ drop = strong hit

                        total += 1
                        if actual_change < 0:
                            hits += 1

                model_data["verification"] = {
                    "hits": hits,
                    "total": total,
                    "winrate": round((hits / total) * 100) if total > 0 else 0,
                    "strong_hits": len([c for c in model_data["shortCandidates"] if c.get("strongHit")]),
                }

            data["verified"] = True
            data["verified_at"] = datetime.utcnow().isoformat()
            entry.result_json = json.dumps(data, ensure_ascii=False)

            # Log results
            for model_key in ["claude_opus", "deepseek_v4"]:
                v = data.get(model_key, {}).get("verification", {})
                if v:
                    logger.info(f"[HYP_V2] {model_key}: {v.get('hits', 0)}/{v.get('total', 0)} drops ({v.get('winrate', 0)}%), strong: {v.get('strong_hits', 0)}")

        await session.commit()
    logger.info("[HYP_V2] Verification complete")
