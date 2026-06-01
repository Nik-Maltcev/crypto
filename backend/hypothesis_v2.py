"""Hypothesis V2 — Short-term Altcoin Drop Predictor.

Collects 16 hours of data (Reddit + Twitter + CMC) and predicts which altcoins
will DROP in the next 24 hours (for short positions).

Two models run in parallel on the SAME data:
1. Claude Opus 4.6 (Anthropic)
2. DeepSeek v4 Pro

Results are compared side-by-side.

Schedule: Once per day at 08:00 MSK (05:00 UTC).
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

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
CMC_BASE = "https://pro-api.coinmarketcap.com"

EXCLUDED_SYMBOLS = {"BTC", "ETH", "BNB", "USDT", "USDC", "STETH", "WBTC", "WETH", "DAI", "BUSD"}


def _repair_json(text: str) -> dict | None:
    """Try to repair truncated JSON by closing brackets/braces."""
    text = text.strip()
    if not text:
        return None
    
    # Try parsing as-is first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # Find the last complete object in shortCandidates/longCandidates arrays
    # Strategy: progressively close open brackets
    for attempt in range(10):
        # Count open/close brackets
        opens = text.count("{") - text.count("}")
        open_arrays = text.count("[") - text.count("]")
        
        # Try closing arrays then objects
        fixed = text
        if open_arrays > 0:
            # Find last complete item in array (last "},")
            last_complete = fixed.rfind("},")
            if last_complete > 0:
                fixed = fixed[:last_complete + 1]
            fixed += "]" * open_arrays
        
        opens = fixed.count("{") - fixed.count("}")
        if opens > 0:
            fixed += "}" * opens
        
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            # Try more aggressive: cut to last complete top-level field
            last_brace = text.rfind("}")
            if last_brace > 0:
                text = text[:last_brace + 1]
            else:
                break
    
    return None


async def _retry_deepseek_json(broken_text: str, system_prompt: str, api_key: str) -> dict | None:
    """Ask DeepSeek to complete/fix truncated JSON."""
    # Take first 500 and last 500 chars to show what was generated
    preview = broken_text[:500] + "\n...[ОБРЕЗАНО]...\n" + broken_text[-500:] if len(broken_text) > 1200 else broken_text
    
    retry_prompt = f"""Твой предыдущий ответ был обрезан и JSON невалидный. Вот что ты начал генерировать:

{preview}

Пожалуйста, сгенерируй ПОЛНЫЙ валидный JSON ответ заново в том же формате. Ответ должен быть parseable через JSON.parse()."""

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            DEEPSEEK_API_URL,
            headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
            json={
                "model": "deepseek-v4-pro",
                "max_tokens": 8192,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": retry_prompt},
                ],
            },
        )
        if resp.status_code != 200:
            logger.warning(f"[HYP_V2] JSON retry failed: {resp.status_code}")
            return None
        
        data = resp.json()
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        text = text.replace("```json", "").replace("```", "").strip()
        if not text.endswith("}"):
            last_brace = text.rfind("}")
            if last_brace != -1:
                text = text[:last_brace + 1]
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return None


async def _fetch_exchanges_for_symbols(symbols: list[str], cmc_key: str = "") -> dict[str, list[str]]:
    """Fetch exchange listings for each symbol using CoinGecko (free, no key needed)."""
    exchanges_map = {}
    
    async with httpx.AsyncClient(timeout=30) as client:
        # First get coin list to map symbol -> coingecko id
        coin_list = []
        try:
            resp = await client.get("https://api.coingecko.com/api/v3/coins/list")
            if resp.status_code == 200:
                coin_list = resp.json()
        except Exception as e:
            logger.warning(f"[HYP_V2] CoinGecko coin list error: {e}")
            return {s: [] for s in symbols}
        
        # Build symbol -> id map (take first match)
        symbol_to_id = {}
        for coin in coin_list:
            sym = coin.get("symbol", "").upper()
            if sym in [s.upper() for s in symbols] and sym not in symbol_to_id:
                symbol_to_id[sym] = coin.get("id", "")
        
        # Fetch tickers for each symbol
        for symbol in symbols:
            sym_upper = symbol.upper()
            coin_id = symbol_to_id.get(sym_upper)
            if not coin_id:
                logger.warning(f"[HYP_V2] CoinGecko: no id for {symbol}")
                exchanges_map[symbol] = []
                continue
            
            try:
                resp = await client.get(
                    f"https://api.coingecko.com/api/v3/coins/{coin_id}/tickers",
                    params={"include_exchange_logo": "false"}
                )
                if resp.status_code == 200:
                    tickers = resp.json().get("tickers", [])
                    found_exchanges = set()
                    for ticker in tickers:
                        market_name = ticker.get("market", {}).get("name", "")
                        if market_name:
                            found_exchanges.add(market_name)
                    exchanges_map[symbol] = sorted(found_exchanges)
                    logger.info(f"[HYP_V2] {symbol}: {len(found_exchanges)} exchanges")
                elif resp.status_code == 429:
                    logger.warning(f"[HYP_V2] CoinGecko rate limited, waiting 60s...")
                    await asyncio.sleep(60)
                    # Retry this symbol
                    resp = await client.get(
                        f"https://api.coingecko.com/api/v3/coins/{coin_id}/tickers",
                        params={"include_exchange_logo": "false"}
                    )
                    if resp.status_code == 200:
                        tickers = resp.json().get("tickers", [])
                        found_exchanges = set()
                        for ticker in tickers:
                            market_name = ticker.get("market", {}).get("name", "")
                            if market_name:
                                found_exchanges.add(market_name)
                        exchanges_map[symbol] = sorted(found_exchanges)
                        logger.info(f"[HYP_V2] {symbol} (retry): {len(found_exchanges)} exchanges")
                    else:
                        exchanges_map[symbol] = []
                else:
                    exchanges_map[symbol] = []
                
                # CoinGecko free: 10-30 req/min, be gentle
                await asyncio.sleep(1.5)
                
            except Exception as e:
                logger.warning(f"[HYP_V2] CoinGecko error for {symbol}: {e}")
                exchanges_map[symbol] = []
    
    return exchanges_map


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


def _build_prompt(cmc_coins: list[dict], reddit_posts: list, twitter_posts: list) -> tuple[str, str]:
    """Build system + user prompts for both models."""
    
    # Market data — all CMC coins
    market_lines = []
    for coin in cmc_coins:
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

    all_symbols_list = sorted([c["symbol"] for c in cmc_coins])

    system_prompt = """You are CryptoPulse AI — a professional short-term crypto analyst specializing in SHORT positions.

Your task: Analyze 16 hours of social + market data and predict which altcoins will DROP significantly in the NEXT 24 HOURS.

Output pure JSON only. No markdown wrappers. Response must be parseable by JSON.parse().

Response Format:
{
  "summary": "String (Russian) - Overall market sentiment, 2-3 sentences",
  "analysisTime": "ISO datetime string",
  "shortCandidates": [
    {
      "symbol": "COIN",
      "name": "Full Name",
      "currentPrice": 1.23,
      "targetPrice24h": 1.05,
      "expectedChange": -14.6,
      "confidence": 75,
      "timeframe": "6-12h" | "12-18h" | "18-24h",
      "catalyst": "String (Russian) - What will trigger the move",
      "reasoning": "String (Russian) - Detailed analysis",
      "riskLevel": "Low" | "Medium" | "High",
      "entryZone": "String - price range for entry",
      "stopLoss": 1.35
    }
  ],
  "marketRiskNote": "String (Russian) - General risk warning for the next 24h"
}

RULES:
- You MUST ALWAYS provide exactly 5-10 shortCandidates. NEVER return an empty list.
- shortCandidates: altcoins most likely to DROP 5-20%+ in the next 24 hours
- Sort by confidence (highest first)
- ONLY pick coins from the PROVIDED MARKET DATA list
- Look for: exhausted pumps, negative news, broken support, token unlocks, whale dumps, declining volume after spike
- Be REALISTIC — don't predict extreme moves, focus on achievable targets
- Include stop-loss levels (where the thesis is invalidated)
- All text in Russian
- EXCLUDE: BTC, ETH, BNB, USDT, USDC, DOGE, SOL, XRP
- If market conditions are uncertain, still provide picks but set confidence lower (30-50%) and note the risk"""

    user_prompt = f"""CURRENT TIME (UTC): {datetime.utcnow().isoformat()}Z

MARKET DATA (altcoins from CMC):
{market_context}

AVAILABLE SYMBOLS: {json.dumps(all_symbols_list)}

REDDIT (last 16 hours, {len(reddit_posts)} posts, top 400 by score):
{reddit_payload}

TWITTER (last 16 hours, {len(twitter_posts)} tweets):
{twitter_payload}

TASK: Identify 5-10 altcoins that will DROP in the next 24 hours.
Focus on: exhausted pumps, negative sentiment, broken technicals, upcoming bad events.
Pick from the provided market data list."""

    return system_prompt, user_prompt


async def _call_deepseek_v4(system_prompt: str, user_prompt: str, api_key: str) -> dict:
    """Call DeepSeek v4 Pro API. Dynamic multi-stage batching for large data."""
    
    MAX_TOKENS_PER_REQUEST = 100000  # safe limit for 128K context
    
    total_chars = len(system_prompt) + len(user_prompt)
    estimated_tokens = total_chars // 4
    
    if estimated_tokens <= MAX_TOKENS_PER_REQUEST:
        # Fits in one request — send directly
        logger.info(f"[HYP_V2] DeepSeek: {estimated_tokens} est. tokens, sending directly...")
    else:
        # Dynamic batching: split data into chunks, process sequentially
        logger.info(f"[HYP_V2] DeepSeek: {estimated_tokens} est. tokens, using dynamic batching...")
        
        # Split user_prompt into sections by markers
        sections = []
        markers = ["MARKET DATA", "AVAILABLE SYMBOLS", "REDDIT (last 16 hours", "TWITTER (last 16 hours", "TASK:"]
        
        remaining = user_prompt
        for i, marker in enumerate(markers):
            pos = remaining.find(marker)
            if pos > 0:
                sections.append(remaining[:pos])
                remaining = remaining[pos:]
        if remaining:
            sections.append(remaining)
        
        # Merge small sections, split large ones into chunks that fit
        chunks = []
        current_chunk = ""
        for section in sections:
            section_tokens = len(section) // 4
            if section_tokens > MAX_TOKENS_PER_REQUEST * 0.8:
                # Section too large — split by lines
                if current_chunk:
                    chunks.append(current_chunk)
                    current_chunk = ""
                lines = section.split("\n")
                sub_chunk = ""
                for line in lines:
                    if len(sub_chunk + line) // 4 > MAX_TOKENS_PER_REQUEST * 0.7:
                        chunks.append(sub_chunk)
                        sub_chunk = line + "\n"
                    else:
                        sub_chunk += line + "\n"
                if sub_chunk:
                    chunks.append(sub_chunk)
            elif len(current_chunk + section) // 4 > MAX_TOKENS_PER_REQUEST * 0.8:
                chunks.append(current_chunk)
                current_chunk = section
            else:
                current_chunk += section
        if current_chunk:
            chunks.append(current_chunk)
        
        num_batches = len(chunks)
        logger.info(f"[HYP_V2] DeepSeek: split into {num_batches} batches")
        
        # Process batches sequentially, accumulating intermediate results
        accumulated_analysis = ""
        
        for i, chunk in enumerate(chunks):
            is_last = (i == num_batches - 1)
            
            if is_last:
                # Final batch — request JSON output
                batch_prompt = f"""ПРЕДВАРИТЕЛЬНЫЙ АНАЛИЗ (из предыдущих этапов):
{accumulated_analysis}

ДОПОЛНИТЕЛЬНЫЕ ДАННЫЕ:
{chunk}

Теперь на основе всего анализа дай финальный ответ в формате JSON."""
                logger.info(f"[HYP_V2] DeepSeek Batch {i+1}/{num_batches} (final): sending...")
            else:
                # Intermediate batch — request summary analysis
                batch_prompt = f"""{f'ПРЕДВАРИТЕЛЬНЫЙ АНАЛИЗ (из предыдущих этапов):{chr(10)}{accumulated_analysis}{chr(10)}{chr(10)}' if accumulated_analysis else ''}ДАННЫЕ (часть {i+1}/{num_batches}):
{chunk}

ЗАДАЧА ЭТАП {i+1}: Проанализируй эти данные. Выдели ключевые сигналы:
- Какие альткоины упоминаются негативно (кандидаты на шорт)
- Какие альткоины упоминаются позитивно (кандидаты на лонг)  
- Ключевые события и катализаторы
Ответь кратким списком на русском (до 2000 слов)."""
                logger.info(f"[HYP_V2] DeepSeek Batch {i+1}/{num_batches}: sending...")
            
            async with httpx.AsyncClient(timeout=180 if not is_last else 300) as client:
                resp = await client.post(
                    DEEPSEEK_API_URL,
                    headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
                    json={
                        "model": "deepseek-v4-pro",
                        "max_tokens": 4096 if not is_last else 8192,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": batch_prompt},
                        ],
                    },
                )
                if resp.status_code != 200:
                    raise RuntimeError(f"DeepSeek API error batch {i+1}: {resp.status_code} - {resp.text[:500]}")
                
                data = resp.json()
                result_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                logger.info(f"[HYP_V2] DeepSeek Batch {i+1}/{num_batches} complete: {len(result_text)} chars")
                
                if is_last:
                    # Parse final JSON with repair+retry
                    result_text = result_text.replace("```json", "").replace("```", "").strip()
                    if not result_text.endswith("}"):
                        last_brace = result_text.rfind("}")
                        if last_brace != -1:
                            result_text = result_text[:last_brace + 1]
                    if not result_text:
                        raise RuntimeError("Empty response from DeepSeek v4 Pro (final batch)")
                    
                    try:
                        return json.loads(result_text)
                    except json.JSONDecodeError:
                        logger.warning("[HYP_V2] Final batch JSON invalid, attempting repair...")
                        repaired = _repair_json(result_text)
                        if repaired:
                            logger.info("[HYP_V2] JSON repaired successfully")
                            return repaired
                        logger.warning("[HYP_V2] Repair failed, retrying with DeepSeek...")
                        retried = await _retry_deepseek_json(result_text, system_prompt, api_key)
                        if retried:
                            logger.info("[HYP_V2] JSON retry successful")
                            return retried
                        raise RuntimeError("DeepSeek returned invalid JSON, repair and retry both failed")
                else:
                    accumulated_analysis += f"\n--- Этап {i+1} ---\n{result_text}\n"
    
    # Single request path (no batching needed)
    async with httpx.AsyncClient(timeout=300) as client:
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

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.warning("[HYP_V2] JSON invalid, attempting repair...")
            repaired = _repair_json(text)
            if repaired:
                logger.info("[HYP_V2] JSON repaired successfully")
                return repaired
            logger.warning("[HYP_V2] Repair failed, retrying with DeepSeek...")
            retried = await _retry_deepseek_json(text, system_prompt, api_key)
            if retried:
                logger.info("[HYP_V2] JSON retry successful")
                return retried
            raise RuntimeError("DeepSeek returned invalid JSON, repair and retry both failed")


async def run_hypothesis_v2(trigger: str = "scheduled") -> None:
    """Main entry: collect 16h data, predict 24h drops via two models."""
    logger.info(f"=== HYPOTHESIS V2: Starting (trigger: {trigger}) ===")

    claude_key = os.environ.get("CLAUDE_API_KEY", "")
    deepseek_key = os.environ.get("DEEPSEEK_API_KEY", "")
    reddit_id = os.environ.get("REDDIT_CLIENT_ID", "")
    reddit_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    cmc_key = os.environ.get("CMC_API_KEY", "")

    if not deepseek_key:
        logger.error("[HYP_V2] DEEPSEEK_API_KEY missing. Skipping.")
        return

    async_session = get_async_session()
    async with async_session() as session:
        # Guard: don't run if already ran within last 1 hour
        recent_cutoff = datetime.utcnow() - timedelta(hours=1)
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
            # 1. CMC data
            logger.info("[HYP_V2] Step 1/4: Fetching CMC data...")
            cmc_coins = []
            if cmc_key:
                cmc_coins = await _fetch_cmc_losers_and_volatile(cmc_key)
            logger.info(f"[HYP_V2] CMC: {len(cmc_coins)} coins")

            # 2. Reddit (16h)
            logger.info("[HYP_V2] Step 2/4: Fetching Reddit (16h)...")
            reddit_posts = []
            if reddit_id and reddit_secret:
                reddit_posts = await _fetch_reddit_16h(reddit_id, reddit_secret)
            logger.info(f"[HYP_V2] Reddit: {len(reddit_posts)} posts")

            # 3. Twitter (16h)
            logger.info("[HYP_V2] Step 3/4: Fetching Twitter (16h)...")
            twitter_posts = await _fetch_twitter_16h()
            logger.info(f"[HYP_V2] Twitter: {len(twitter_posts)} tweets")

            if not cmc_coins and not reddit_posts:
                raise RuntimeError("No data collected (CMC + Reddit both empty)")

            # 4. Build prompts (same for both models)
            system_prompt, user_prompt = _build_prompt(cmc_coins, reddit_posts, twitter_posts)

            # 5. Call DeepSeek v4 Pro
            logger.info("[HYP_V2] Step 4/4: Calling DeepSeek v4 Pro...")
            
            deepseek_result = await _call_deepseek_v4(system_prompt, user_prompt, deepseek_key)

            if not deepseek_result:
                raise RuntimeError("DeepSeek returned empty result")

            # Fetch exchanges for all picked symbols
            all_picks = []
            for c in deepseek_result.get("shortCandidates", []):
                all_picks.append(c.get("symbol", "").upper())
            
            if all_picks and cmc_key:
                logger.info(f"[HYP_V2] Fetching exchanges for {len(all_picks)} symbols...")
                exchanges_map = await _fetch_exchanges_for_symbols(all_picks, cmc_key)
                
                # Add exchanges to each candidate
                for c in deepseek_result.get("shortCandidates", []):
                    c["exchanges"] = exchanges_map.get(c.get("symbol", "").upper(), [])

            # Combine results
            combined = {
                "deepseek_v4": deepseek_result,
                "metadata": {
                    "reddit_posts": len(reddit_posts),
                    "twitter_tweets": len(twitter_posts),
                    "cmc_coins_analyzed": len(cmc_coins),
                    "lookback_hours": 16,
                    "prediction_horizon": "24h",
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
    """Verify hypothesis v2 predictions by taking price snapshots every 6 hours.
    
    Runs every 6 hours. For each active analysis (0-48h old):
    - Fetches current prices for all picks (shorts + longs)
    - Adds a snapshot with timestamp and change from start
    - After 24h marks as fully verified with final stats
    """
    logger.info("[HYP_V2] Verifying predictions (6h snapshot)...")

    cmc_key = os.environ.get("CMC_API_KEY", "")
    if not cmc_key:
        logger.warning("[HYP_V2] CMC_API_KEY not set, skipping verification")
        return

    async_session = get_async_session()
    async with async_session() as session:
        # Find all successful entries from last 48 hours
        cutoff = datetime.utcnow() - timedelta(hours=48)

        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hypothesis_v2")
            .where(AnalysisLog.status == "success")
            .where(AnalysisLog.created_at >= cutoff)
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

            # Skip if already fully verified (24h+ passed and marked done)
            if data.get("verification_complete"):
                continue

            model_data = data.get("deepseek_v4")
            if not model_data:
                continue

            # Collect all symbols from shorts
            all_symbols = set()
            for c in model_data.get("shortCandidates", []):
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

            if not prices:
                continue

            # Calculate hours since analysis
            hours_elapsed = (datetime.utcnow() - entry.created_at).total_seconds() / 3600
            snapshot_label = f"{int(hours_elapsed)}h"
            now_iso = datetime.utcnow().isoformat()

            # Process shorts
            for candidate in model_data.get("shortCandidates", []):
                sym = candidate.get("symbol", "").upper()
                current_price = prices.get(sym)
                start_price = candidate.get("currentPrice", 0)

                if not current_price or start_price <= 0:
                    continue

                actual_change = ((current_price - start_price) / start_price) * 100

                # Initialize snapshots array
                if "snapshots" not in candidate:
                    candidate["snapshots"] = []

                # Add snapshot (avoid duplicates for same hour range)
                existing_labels = [s.get("label") for s in candidate["snapshots"]]
                if snapshot_label not in existing_labels:
                    candidate["snapshots"].append({
                        "label": snapshot_label,
                        "time": now_iso,
                        "price": current_price,
                        "change": round(actual_change, 2),
                    })

                # Update latest values
                candidate["actualPrice24h"] = current_price
                candidate["actualChange24h"] = round(actual_change, 2)
                candidate["hit"] = actual_change < 0
                candidate["strongHit"] = actual_change <= -5

            # After 24h — mark as fully verified with final stats
            if hours_elapsed >= 24:
                shorts = model_data.get("shortCandidates", [])

                short_hits = len([c for c in shorts if c.get("hit")])
                short_total = len([c for c in shorts if c.get("actualChange24h") is not None])

                model_data["verification"] = {
                    "hits": short_hits,
                    "total": short_total,
                    "winrate": round((short_hits / short_total) * 100) if short_total > 0 else 0,
                    "strong_hits": len([c for c in shorts if c.get("strongHit")]),
                }

                data["verification_complete"] = True
                data["verified"] = True
                data["verified_at"] = now_iso

                logger.info(f"[HYP_V2] ID {entry.id} FINAL: shorts {short_hits}/{short_total}")
            else:
                logger.info(f"[HYP_V2] ID {entry.id} snapshot at {snapshot_label}")

            entry.result_json = json.dumps(data, ensure_ascii=False)

        await session.commit()
    logger.info("[HYP_V2] Verification complete")
