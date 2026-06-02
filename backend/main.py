"""Combined service: API + Background Parser + Scheduled Analysis."""

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import json

from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from core.config import get_settings, load_chats_config
from core.database import get_async_session, init_db
from core.models import ParseLog, AnalysisLog, ForecastTracking, AltcoinTracking
# Telethon disabled — lazy import only when telegram endpoints are called
# from worker.jobs.parser import ChatParser
# from worker.telethon_client import get_telethon_client, close_telethon_client
from reddit_parser import fetch_multiple_subreddits
from cmc_parser import fetch_cmc_data
from auto_analysis import run_scheduled_analysis, run_dual_analysis
from altcoin_analysis import run_altcoin_analysis, update_altcoin_tracking, update_altcoin_daily_prices
from mentions_tracker import run_mentions_scan
from shitcoin_monitor import start_monitor, get_detected_tokens, is_monitor_running
from hourly_hypothesis import run_hourly_hypothesis, verify_hypothesis_results
from hypothesis_v2 import run_hypothesis_v2, verify_hypothesis_v2_results
from forecast_tracker import update_forecast_tracking_job, save_forecast_from_analysis, update_binance_tracking, update_polymarket_tracking

BINANCE_PROXY = "http://pkg-private2:iau7vmnt3jt3lkfs@quality.proxywing.com:8888"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


async def parse_chats_job():
    """Background job to parse all chats."""
    from worker.telethon_client import get_telethon_client
    from worker.jobs.parser import ChatParser
    logger.info("Starting scheduled parse job...")
    
    async_session = get_async_session()
    async with async_session() as session:
        log = ParseLog(status="running")
        session.add(log)
        await session.commit()
        await session.refresh(log)
        
        try:
            config = load_chats_config()
            chat_ids = config.get("chats", [])
            parse_days = config.get("settings", {}).get("parse_days", 2)
            
            client = await get_telethon_client()
            parser = ChatParser(client)
            
            messages = await parser.parse_all_chats(chat_ids, days=parse_days)
            
            export_data = {
                "parsed_at": datetime.now().isoformat(),
                "parse_days": parse_days,
                "chats_count": len(chat_ids),
                "messages_count": len(messages),
                "messages": messages,
            }
            
            log.finished_at = datetime.utcnow()
            log.status = "success"
            log.chats_parsed = len(chat_ids)
            log.messages_found = len(messages)
            log.json_data = json.dumps(export_data, ensure_ascii=False)
            await session.commit()
            
            logger.info(f"Parse complete: {len(messages)} messages from {len(chat_ids)} chats")
            
        except Exception as e:
            logger.error(f"Parse failed: {e}")
            log.finished_at = datetime.utcnow()
            log.status = "failed"
            log.error_message = str(e)
            await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown."""
    logger.info("Starting service...")
    
    # Debug: dump all env vars that contain DATABASE or POSTGRES
    import os
    for k, v in os.environ.items():
        if "DATABASE" in k.upper() or "POSTGRES" in k.upper() or "PG" in k.upper():
            logger.info(f"ENV: {k}={v[:60]}...")
    
    # Init database
    settings = get_settings()
    logger.info(f"DATABASE_URL: {settings.DATABASE_URL[:50]}...")
    await init_db()
    
    logger.info("Database ready")
    
    # --- APScheduler: daily analysis at 08:00 MSK (05:00 UTC) ---
    scheduler = None
    settings = get_settings()
    if os.environ.get("CLAUDE_API_KEY", "") and os.environ.get("GEMINI_API_KEY", ""):
        try:
            from apscheduler.schedulers.asyncio import AsyncIOScheduler
            from apscheduler.triggers.cron import CronTrigger
            
            scheduler = AsyncIOScheduler()
            # Daily analysis DISABLED — replaced by hourly hypothesis
            # scheduler.add_job(
            #     run_dual_analysis,
            #     trigger=CronTrigger(hour=5, minute=0),
            #     id="daily_analysis",
            #     name="Daily 08:00 MSK Analysis (Reddit + Reddit+Twitter)",
            #     kwargs={"trigger": "scheduled"},
            #     replace_existing=True,
            # )
            scheduler.add_job(
                run_hourly_hypothesis,
                trigger=CronTrigger(minute=50),  # Every hour at XX:50 (predict next hour)
                id="hourly_hypothesis",
                name="Hourly Hypothesis (predict next hour)",
                kwargs={"trigger": "scheduled"},
                replace_existing=True,
            )
            scheduler.add_job(
                verify_hypothesis_results,
                trigger=CronTrigger(minute=7),  # Same time as Polymarket tracker — right after candle closes
                id="hourly_hypothesis_verify",
                name="Hourly Hypothesis Verification",
                replace_existing=True,
            )
            scheduler.add_job(
                update_forecast_tracking_job,
                trigger=CronTrigger(minute=5),  # Every hour at XX:05 (after CMC data settles)
                id="hourly_forecast_tracking",
                name="Hourly Forecast vs Reality Tracker",
                replace_existing=True,
            )
            scheduler.add_job(
                update_binance_tracking,
                trigger=CronTrigger(minute=6),  # Every hour at XX:06 (right after CMC job)
                id="hourly_binance_tracking",
                name="Hourly Binance Price Tracker",
                replace_existing=True,
            )
            scheduler.add_job(
                update_polymarket_tracking,
                trigger=CronTrigger(minute=7),  # Every hour at XX:07 (after Binance job)
                id="hourly_polymarket_tracking",
                name="Hourly Polymarket-style Tracker",
                replace_existing=True,
            )
            scheduler.add_job(
                run_altcoin_analysis,
                trigger=CronTrigger(day_of_week="mon", hour=5, minute=0),  # Monday 05:00 UTC = 08:00 MSK
                id="weekly_altcoin_analysis",
                name="Weekly Altcoin Analysis (Monday 08:00 MSK)",
                kwargs={"trigger": "scheduled"},
                replace_existing=True,
            )
            scheduler.add_job(
                update_altcoin_daily_prices,
                trigger=CronTrigger(hour=5, minute=0),  # Every day at 05:00 UTC = 08:00 MSK
                id="daily_altcoin_price_snapshot",
                name="Daily Altcoin Price Snapshot (08:00 MSK)",
                replace_existing=True,
            )
            scheduler.add_job(
                run_hypothesis_v2,
                trigger=CronTrigger(hour=5, minute=0),  # 08:00 MSK (05:00 UTC)
                id="hypothesis_v2",
                name="Hypothesis V2: Altcoin Drop Predictor (daily 08:00 MSK)",
                kwargs={"trigger": "scheduled"},
                replace_existing=True,
            )
            scheduler.add_job(
                verify_hypothesis_v2_results,
                trigger=CronTrigger(minute=30),  # Every hour at XX:30
                id="hypothesis_v2_verify",
                name="Hypothesis V2 Verification (every hour)",
                replace_existing=True,
            )
            scheduler.start()
            logger.info("APScheduler started — hourly hypothesis, daily altcoin tracking, hypothesis v2")
        except Exception as e:
            logger.error(f"Failed to start APScheduler: {e}")
    else:
        logger.warning("CLAUDE_API_KEY or GEMINI_API_KEY not set. Scheduled analysis DISABLED.")
    
    logger.info("Ready. Call POST /api/telegram/parse to start parsing.")
    
    # Start shitcoin monitor in background
    try:
        asyncio.create_task(start_monitor())
        logger.info("Shitcoin monitor task started")
    except Exception as e:
        logger.warning(f"Failed to start shitcoin monitor: {e}")
    
    yield
    
    # Shutdown
    if scheduler:
        scheduler.shutdown(wait=False)
    try:
        from worker.telethon_client import close_telethon_client
        await close_telethon_client()
    except Exception:
        pass
    logger.info("Service stopped")


app = FastAPI(title="Telegram Crypto Parser", lifespan=lifespan)

# CORS - allow all origins for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when allow_origins is "*"
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Log all unhandled exceptions."""
    import traceback
    logger.error(f"Unhandled exception: {exc}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"error": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/")
async def health():
    return {"status": "ok", "service": "telegram-parser"}


@app.get("/api/telegram/export")
async def get_export():
    """Get latest parsed messages."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(ParseLog)
            .where(ParseLog.status == "success")
            .where(ParseLog.json_data.isnot(None))
            .order_by(ParseLog.started_at.desc())
            .limit(1)
        )
        log = result.scalar_one_or_none()
        
        if not log:
            raise HTTPException(404, "No data yet. Parsing in progress...")
        
        data = json.loads(log.json_data)
        return JSONResponse({
            "success": True,
            "parsed_at": log.started_at.isoformat(),
            "chats_count": log.chats_parsed,
            "messages_count": log.messages_found,
            "data": data
        })


@app.get("/api/telegram/status")
async def get_status():
    """Get parse status."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(ParseLog).order_by(ParseLog.started_at.desc()).limit(1)
        )
        log = result.scalar_one_or_none()
        
        if not log:
            return {"status": "never_run"}
        
        return {
            "status": log.status,
            "started_at": log.started_at.isoformat(),
            "chats_parsed": log.chats_parsed,
            "messages_found": log.messages_found
        }


@app.post("/api/telegram/parse")
async def trigger_parse():
    """Manually trigger parsing."""
    asyncio.create_task(parse_chats_job())
    return {"status": "started"}


@app.post("/api/reddit/parse")
async def parse_reddit(subreddits: list[str] | None = Body(default=None)):
    """Parse Reddit posts from given subreddits.
    
    Accepts JSON body: ["CryptoCurrency", "Bitcoin", ...]
    """
    logger.info(f"Reddit parse request received. Subreddits: {subreddits}")
    
    if not subreddits:
        # Default subreddits
        subreddits = [
            "CryptoCurrency", "Bitcoin", "ethereum", "solana", 
            "dogecoin", "CryptoMarkets", "altcoin", "defi"
        ]
    
    posts = await fetch_multiple_subreddits(subreddits)
    
    logger.info(f"Reddit parse complete. Returning {len(posts)} posts")
    
    return {
        "success": True,
        "subreddits_count": len(subreddits),
        "posts_count": len(posts),
        "posts": posts
    }


@app.post("/api/telegram/preview_chats")
async def preview_chats(chats: list[str] = Body(...), days: int = Body(default=7)):
    """Fetch messages from a custom list of chats for preview/filtering."""
    from worker.telethon_client import get_telethon_client
    from worker.jobs.parser import ChatParser
    logger.info(f"Preview chats request received. Chats: {chats}, days: {days}")
    
    if not chats:
        raise HTTPException(400, "Chats list cannot be empty")
        
    try:
        client = await get_telethon_client()
        parser = ChatParser(client)
        
        # Parse all requested chats (limit to 50 messages per chat for speed)
        # Use min_length=3 to catch short Chinese messages that would be filtered at default 10
        messages = await parser.parse_all_chats(chats, days=days, max_messages_per_chat=50, min_length_override=3)
        
        # Create a dictionary mapping requested chat -> its resolved title
        # Defaults to the requested chat string if no messages were found
        req_to_title = {c: c for c in chats}
        for msg in messages:
            req_to_title[msg["chat"]] = msg.get("chat_title", msg["chat"])

        grouped_data = {}
        # Initialize an empty array for every resolved chat title
        for c in chats:
            grouped_data[req_to_title[c]] = []
            
        # Group messages by their resolved title
        for msg in messages:
            title = req_to_title[msg["chat"]]
            grouped_data[title].append(msg)
            
        logger.info(f"Successfully fetched {len(messages)} messages from {len(chats)} chats.")
        
        return {
            "success": True,
            "chats_requested": len(chats),
            "messages_found": len(messages),
            "data": grouped_data
        }
    except asyncio.exceptions.CancelledError:
        logger.warning(f"Client disconnected or request timeout during preview_chats.")
        raise HTTPException(408, "Request Timeout: Parsing takes too long for a synchronous request.")
    except Exception as e:
        logger.error(f"Error in preview_chats: {e}")
        raise HTTPException(500, str(e))



@app.get("/api/cmc/data")
async def get_cmc_data():
    """Get CoinMarketCap market data."""
    import os
    api_key = os.environ.get('CMC_API_KEY', '')
    
    if not api_key:
        return {"success": False, "error": "CMC_API_KEY not configured", "data": [], "summary": "MARKET CONTEXT: Data Unavailable."}
    
    result = await fetch_cmc_data(api_key)
    return result


# --- Reddit OAuth ---
_reddit_token: str | None = None
_reddit_token_expires: float = 0


async def get_reddit_token() -> str:
    """Get or refresh Reddit OAuth token (application-only auth)."""
    import time
    global _reddit_token, _reddit_token_expires
    
    if _reddit_token and time.time() < _reddit_token_expires - 60:
        return _reddit_token
    
    settings = get_settings()
    client_id = settings.REDDIT_CLIENT_ID
    client_secret = settings.REDDIT_CLIENT_SECRET
    
    # Fallback to direct env check just in case
    if not client_id:
        import os
        client_id = os.environ.get("REDDIT_CLIENT_ID", "")
    if not client_secret:
        import os
        client_secret = os.environ.get("REDDIT_CLIENT_SECRET", "")
    
    if not client_id or not client_secret:
        logger.warning("REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET not configured. Reddit API will fail.")
        raise HTTPException(500, "Reddit credentials missing on server")
    
    import httpx
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "https://www.reddit.com/api/v1/access_token",
                auth=(client_id, client_secret),
                data={"grant_type": "client_credentials"},
                headers={"User-Agent": "CryptoPulseAI/1.0"}
            )
            data = resp.json()
        except Exception as e:
            logger.error(f"Failed to connect to Reddit for OAuth: {e}")
            raise HTTPException(502, f"Reddit unreachable: {str(e)}")
    
    if "access_token" not in data:
        logger.error(f"Reddit OAuth failed: {data}")
        raise HTTPException(500, f"Reddit OAuth failed: {data}")
    
    _reddit_token = data["access_token"]
    _reddit_token_expires = time.time() + data.get("expires_in", 3600)
    logger.info("Reddit OAuth token acquired")
    return _reddit_token


@app.get("/api/reddit/posts")
async def fetch_reddit_posts(subreddit: str, limit: int = 50, q: str | None = None):
    """Fetch posts from a subreddit using OAuth (60 req/min limit)."""
    import httpx
    
    try:
        token = await get_reddit_token()
    except HTTPException as he:
        # Re-raise known exceptions
        raise he
    except Exception as e:
        logger.error(f"Unexpected Reddit OAuth error: {e}")
        raise HTTPException(500, f"Reddit OAuth error: {str(e)}")
    
    if q:
        url = f"https://oauth.reddit.com/r/{subreddit}/search.json?q={q}&sort=new&t=week&limit={limit}"
    else:
        url = f"https://oauth.reddit.com/r/{subreddit}/new.json?limit={limit}"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "CryptoPulseAI/1.0"
        })
    
    if resp.status_code != 200:
        logger.warning(f"Reddit API error for r/{subreddit}: {resp.status_code} - {resp.text}")
        return {"data": {"children": []}}
    
    return resp.json()


@app.get("/api/reddit/comments")
async def fetch_reddit_comments(subreddit: str, limit: int = 100):
    """Fetch recent comments from a subreddit using OAuth."""
    import httpx
    
    try:
        token = await get_reddit_token()
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected Reddit OAuth error: {e}")
        raise HTTPException(500, f"Reddit OAuth error: {str(e)}")
    
    url = f"https://oauth.reddit.com/r/{subreddit}/comments.json?limit={limit}"
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "CryptoPulseAI/1.0"
        })
    
    if resp.status_code != 200:
        logger.warning(f"Reddit comments API error for r/{subreddit}: {resp.status_code}")
        return {"data": {"children": []}}
    
    return resp.json()


@app.get("/api/proxy")
async def proxy_request(url: str, headers: str | None = None):
    """Generic CORS proxy: forwards GET requests to external APIs server-side."""
    import httpx
    import json as json_module
    
    try:
        extra_headers = {}
        if headers:
            extra_headers = json_module.loads(headers)
        
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(url, headers=extra_headers)
        
        # Try to return JSON if possible
        try:
            data = resp.json()
            return JSONResponse(content=data, status_code=resp.status_code)
        except Exception:
            return JSONResponse(content={"raw": resp.text}, status_code=resp.status_code)
    except Exception as e:
        logger.error(f"Proxy error for {url}: {e}")
        raise HTTPException(500, f"Proxy error: {str(e)}")

@app.post("/api/proxy/post")
async def proxy_post_request(url: str, request: Request):
    """Generic proxy for POST requests to external APIs."""
    import httpx
    
    try:
        body = await request.body()
        headers = dict(request.headers)
        
        # Strip out headers that shouldn't be forwarded
        clean_headers = {}
        for k, v in headers.items():
            k_lower = k.lower()
            if k_lower not in ['host', 'origin', 'referer', 'content-length', 'connection', 'accept-encoding']:
                clean_headers[k] = v
                
        # Ensure correct content-type if JSON
        if b"{" in body[:10]:
            clean_headers['Content-Type'] = 'application/json'

        # Auto-inject Claude API key for Anthropic requests
        if 'anthropic.com' in url:
            import os
            claude_key = os.environ.get('CLAUDE_API_KEY', '')
            if claude_key:
                clean_headers['x-api-key'] = claude_key

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, content=body, headers=clean_headers)
        
        try:
            data = resp.json()
            return JSONResponse(content=data, status_code=resp.status_code)
        except Exception:
            return JSONResponse(content={"raw": resp.text}, status_code=resp.status_code)
    except Exception as e:
        logger.error(f"Proxy POST error for {url}: {e}")
        raise HTTPException(500, f"Proxy POST error: {str(e)}")

@app.post("/api/proxy/gemini/{path:path}")
async def proxy_gemini_request(path: str, request: Request):
    """Specific proxy for Gemini API to bypass location restrictions."""
    import httpx
    import os
    
    # Construct the true Gemini API URL
    url = f"https://generativelanguage.googleapis.com/{path}"
    
    # Append the API key from query params or headers if the frontend passed it
    query_string = request.url.query
    if query_string:
        url = f"{url}?{query_string}"
    
    try:
        body = await request.body()
        headers = dict(request.headers)
        
        clean_headers = {}
        for k, v in headers.items():
            k_lower = k.lower()
            if k_lower not in ['host', 'origin', 'referer', 'content-length', 'connection', 'accept-encoding']:
                clean_headers[k] = v
        
        if b"{" in body[:10]:
            clean_headers['Content-Type'] = 'application/json'

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, content=body, headers=clean_headers)
        
        # Return exact Gemini response including raw text for parsing
        return JSONResponse(content=resp.json() if resp.text else {}, status_code=resp.status_code)
        
    except Exception as e:
        logger.error(f"Gemini Proxy error: {e}")
        raise HTTPException(500, f"Gemini Proxy error: {str(e)}")


@app.post("/api/proxy/openrouter")
async def proxy_gemini_filter_request(request: Request):
    """Proxy for Gemini API (frontend filter requests)."""
    import httpx

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(500, "GEMINI_API_KEY not configured on server")

    try:
        body = await request.json()
        # Convert OpenAI format to Gemini format
        messages = body.get("messages", [])
        system_text = ""
        user_text = ""
        for msg in messages:
            if msg["role"] == "system":
                system_text = msg["content"]
            elif msg["role"] == "user":
                user_text = msg["content"]

        gemini_body = {
            "contents": [{"parts": [{"text": user_text}]}],
            "generationConfig": {"temperature": 0.1},
        }
        if system_text:
            gemini_body["systemInstruction"] = {"parts": [{"text": system_text}]}

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        async with httpx.AsyncClient(timeout=3600) as client:
            resp = await client.post(url, json=gemini_body)

        if resp.status_code != 200:
            return JSONResponse(content={"error": resp.text[:500]}, status_code=resp.status_code)

        data = resp.json()
        candidates = data.get("candidates", [])
        text = ""
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            text = parts[0].get("text", "") if parts else ""

        # Return in OpenAI format for frontend compatibility
        return JSONResponse(content={
            "choices": [{"message": {"content": text, "role": "assistant"}}]
        })
    except Exception as e:
        import traceback
        logger.error(f"Gemini Filter Proxy error: {type(e).__name__}: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(500, f"Gemini Filter Proxy error: {type(e).__name__}: {str(e)}")


# ==================== ANALYSIS HISTORY ENDPOINTS ====================

@app.get("/api/analysis/history")
async def get_analysis_history(limit: int = 30):
    """Get list of past analyses."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .order_by(AnalysisLog.created_at.desc())
            .limit(limit)
        )
        logs = result.scalars().all()
        
        items = []
        for log in logs:
            items.append({
                "id": log.id,
                "created_at": (log.created_at.isoformat() + "Z") if log.created_at else None,
                "finished_at": (log.finished_at.isoformat() + "Z") if log.finished_at else None,
                "mode": log.mode,
                "status": log.status,
                "trigger": log.trigger,
                "reddit_posts_count": log.reddit_posts_count,
                "twitter_tweets_count": log.twitter_tweets_count,
                "telegram_msgs_count": log.telegram_msgs_count,
                "error_message": log.error_message,
                "has_result": log.result_json is not None,
            })
        
        return {"success": True, "items": items}


@app.get("/api/analysis/{analysis_id}")
async def get_analysis_detail(analysis_id: int):
    """Get a specific analysis result by ID."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog).where(AnalysisLog.id == analysis_id)
        )
        log = result.scalar_one_or_none()
        
        if not log:
            raise HTTPException(404, "Analysis not found")
        
        result_data = None
        if log.result_json:
            try:
                result_data = json.loads(log.result_json)
            except json.JSONDecodeError:
                result_data = None
        
        return {
            "success": True,
            "id": log.id,
            "created_at": (log.created_at.isoformat() + "Z") if log.created_at else None,
            "finished_at": (log.finished_at.isoformat() + "Z") if log.finished_at else None,
            "mode": log.mode,
            "status": log.status,
            "trigger": log.trigger,
            "reddit_posts_count": log.reddit_posts_count,
            "twitter_tweets_count": log.twitter_tweets_count,
            "telegram_msgs_count": log.telegram_msgs_count,
            "error_message": log.error_message,
            "result": result_data,
        }


@app.post("/api/analysis/run")
async def trigger_analysis(mode: str = "reddit_only"):
    """Manually trigger an analysis (for testing). mode: reddit_only or reddit_twitter"""
    settings = get_settings()
    if not settings.CLAUDE_API_KEY:
        raise HTTPException(400, "CLAUDE_API_KEY not configured on server")
    if not settings.GEMINI_API_KEY:
        raise HTTPException(400, "GEMINI_API_KEY not configured on server")
    
    if mode not in ("reddit_only", "reddit_twitter"):
        mode = "reddit_only"
    
    asyncio.create_task(run_scheduled_analysis(trigger="manual", mode=mode))
    return {"status": "started", "mode": mode, "message": "Analysis triggered. Check /api/analysis/history for results."}


@app.post("/api/hypothesis/run")
async def trigger_hourly_hypothesis():
    """Manually trigger hourly hypothesis prediction."""
    if not os.environ.get("CLAUDE_API_KEY"):
        raise HTTPException(400, "CLAUDE_API_KEY not configured on server")
    
    asyncio.create_task(run_hourly_hypothesis(trigger="manual"))
    return {"status": "started", "message": "Hourly hypothesis triggered. Check /api/hypothesis/history for results."}


@app.get("/api/hypothesis/history")
async def get_hypothesis_history(limit: int = 50):
    """Get hourly hypothesis prediction history."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hourly_hypothesis")
            .order_by(AnalysisLog.created_at.desc())
            .limit(limit)
        )
        logs = result.scalars().all()
        
        items = []
        for log in logs:
            result_data = None
            if log.result_json:
                try:
                    result_data = json.loads(log.result_json)
                except:
                    pass
            items.append({
                "id": log.id,
                "created_at": (log.created_at.isoformat() + "Z") if log.created_at else None,
                "finished_at": (log.finished_at.isoformat() + "Z") if log.finished_at else None,
                "status": log.status,
                "trigger": log.trigger,
                "reddit_posts_count": log.reddit_posts_count,
                "twitter_tweets_count": log.twitter_tweets_count,
                "error_message": log.error_message,
                "result": result_data,
            })
        
        return {"success": True, "items": items}


@app.post("/api/hypothesis/reset_verification")
async def reset_hypothesis_verification():
    """Reset all verifications (in case they ran too early)."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hourly_hypothesis")
            .where(AnalysisLog.status == "success")
        )
        logs = result.scalars().all()
        reset_count = 0
        for log in logs:
            if log.result_json:
                try:
                    data = json.loads(log.result_json)
                    if data.get("verified"):
                        # Remove verification data, keep predictions
                        data.pop("verified", None)
                        data.pop("verified_at", None)
                        data.pop("hits", None)
                        data.pop("total", None)
                        data.pop("winrate", None)
                        # Remove actual_direction from predictions
                        for p in data.get("predictions", []):
                            p.pop("actual_direction", None)
                            p.pop("actual_open", None)
                            p.pop("actual_close", None)
                            p.pop("matched", None)
                        log.result_json = json.dumps(data, ensure_ascii=False)
                        reset_count += 1
                except:
                    pass
        await session.commit()
        return {"success": True, "reset": reset_count}


@app.post("/api/hypothesis/verify_now")
async def trigger_hypothesis_verification():
    """Manually trigger hypothesis verification."""
    asyncio.create_task(verify_hypothesis_results())
    return {"status": "started", "message": "Verification triggered."}


@app.post("/api/hypothesis/revalidate_all")
async def revalidate_all_hypothesis():
    """Re-fetch correct historical candles for all hypothesis entries and update prices."""
    import httpx
    
    BINANCE_PAIRS_MAP = {"BTC": "BTCUSDT", "ETH": "ETHUSDT", "SOL": "SOLUSDT", 
                         "XRP": "XRPUSDT", "DOGE": "DOGEUSDT", "BNB": "BNBUSDT"}
    
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hourly_hypothesis")
            .where(AnalysisLog.status == "success")
            .order_by(AnalysisLog.created_at.desc())
            .limit(100)
        )
        logs = result.scalars().all()
        fixed = 0
        
        async with httpx.AsyncClient(timeout=15, proxy=BINANCE_PROXY) as client:
            for log in logs:
                if not log.result_json:
                    continue
                try:
                    data = json.loads(log.result_json)
                except:
                    continue
                
                predictions = data.get("predictions", [])
                if not predictions:
                    continue
                
                # Predicted hour: entry created at XX:50 (server time = UTC with Z suffix)
                # The predicted candle is the one that STARTS at the next full hour UTC
                entry_time = log.created_at
                # Next full hour in UTC
                predicted_hour_utc = entry_time.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
                start_ms = int(predicted_hour_utc.timestamp() * 1000)
                
                # Skip if predicted candle hasn't closed yet (need +2h from entry time)
                candle_close_time = predicted_hour_utc + timedelta(hours=1)  # candle closes 1h after start
                now_utc = datetime.utcnow()
                if now_utc < candle_close_time + timedelta(minutes=2):
                    # Candle not closed yet — if it was incorrectly verified, reset it
                    if data.get("verified"):
                        data.pop("verified", None)
                        data.pop("verified_at", None)
                        data.pop("hits", None)
                        data.pop("total", None)
                        data.pop("winrate", None)
                        for p in data.get("predictions", []):
                            p.pop("actual_direction", None)
                            p.pop("actual_open", None)
                            p.pop("actual_close", None)
                            p.pop("matched", None)
                        log.result_json = json.dumps(data, ensure_ascii=False)
                        fixed += 1
                    continue
                
                updated_preds = []
                hits = 0
                total = 0
                
                for pred in predictions:
                    pair = BINANCE_PAIRS_MAP.get(pred.get("symbol"))
                    if not pair:
                        updated_preds.append(pred)
                        continue
                    
                    try:
                        resp = await client.get(
                            "https://api.binance.com/api/v3/klines",
                            params={"symbol": pair, "interval": "1h", "startTime": start_ms, "limit": 1}
                        )
                        if resp.status_code == 200:
                            klines = resp.json()
                            if klines:
                                candle = klines[0]
                                actual_open = float(candle[1])
                                actual_close = float(candle[4])
                                actual_direction = "Up" if actual_close >= actual_open else "Down"
                                matched = pred.get("direction") == actual_direction
                                
                                if matched:
                                    hits += 1
                                total += 1
                                
                                updated_preds.append({
                                    "symbol": pred["symbol"],
                                    "direction": pred.get("direction", ""),
                                    "confidence": pred.get("confidence", 0),
                                    "reasoning": pred.get("reasoning", ""),
                                    "actual_direction": actual_direction,
                                    "actual_open": actual_open,
                                    "actual_close": actual_close,
                                    "matched": matched,
                                })
                            else:
                                updated_preds.append(pred)
                        else:
                            updated_preds.append(pred)
                    except:
                        updated_preds.append(pred)
                
                if total > 0:
                    data["predictions"] = updated_preds
                    data["verified"] = True
                    data["hits"] = hits
                    data["total"] = total
                    data["winrate"] = round((hits / total) * 100)
                    log.result_json = json.dumps(data, ensure_ascii=False)
                    fixed += 1
                
                await asyncio.sleep(0.2)  # Rate limit
        
        await session.commit()
        return {"success": True, "revalidated": fixed}


@app.post("/api/hypothesis/fix_verified")
async def fix_verified_flags():
    """Fix: set verified=true for all entries that have matched predictions but no verified flag."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hourly_hypothesis")
            .where(AnalysisLog.status == "success")
        )
        logs = result.scalars().all()
        fixed = 0
        for log in logs:
            if not log.result_json:
                continue
            try:
                data = json.loads(log.result_json)
                preds = data.get("predictions", [])
                has_matched = any(p.get("matched") is not None for p in preds)
                if has_matched and not data.get("verified"):
                    data["verified"] = True
                    hits = sum(1 for p in preds if p.get("matched") is True)
                    data["hits"] = hits
                    data["total"] = len([p for p in preds if p.get("matched") is not None])
                    data["winrate"] = round((hits / data["total"]) * 100) if data["total"] > 0 else 0
                    log.result_json = json.dumps(data, ensure_ascii=False)
                    fixed += 1
            except:
                continue
        await session.commit()
        return {"success": True, "fixed": fixed}


@app.get("/api/shitcoins/list")
async def get_shitcoins():
    """Get all detected shitcoins from caller channels."""
    tokens = get_detected_tokens()
    return {
        "success": True,
        "monitor_running": is_monitor_running(),
        "total": len(tokens),
        "tokens": tokens[:50],  # Last 50
    }


# ==================== HYPOTHESIS V2 ====================

@app.post("/api/hypothesis_v2/run")
async def trigger_hypothesis_v2():
    """Manually trigger Hypothesis V2 (altcoin drop predictor)."""
    if not os.environ.get("DEEPSEEK_API_KEY"):
        raise HTTPException(400, "DEEPSEEK_API_KEY not configured")

    asyncio.create_task(run_hypothesis_v2(trigger="manual"))
    return {"status": "started", "message": "Hypothesis V2 triggered. Check /api/hypothesis_v2/history for results."}


@app.get("/api/hypothesis_v2/history")
async def get_hypothesis_v2_history(limit: int = 20):
    """Get Hypothesis V2 prediction history."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hypothesis_v2")
            .order_by(AnalysisLog.created_at.desc())
            .limit(limit)
        )
        logs = result.scalars().all()

        items = []
        for log in logs:
            result_data = None
            if log.result_json:
                try:
                    result_data = json.loads(log.result_json)
                except:
                    pass
            items.append({
                "id": log.id,
                "created_at": (log.created_at.isoformat() + "Z") if log.created_at else None,
                "finished_at": (log.finished_at.isoformat() + "Z") if log.finished_at else None,
                "status": log.status,
                "trigger": log.trigger,
                "reddit_posts_count": log.reddit_posts_count,
                "twitter_tweets_count": log.twitter_tweets_count,
                "error_message": log.error_message,
                "result": result_data,
            })

        return {"success": True, "items": items}


@app.post("/api/hypothesis_v2/verify")
async def trigger_hypothesis_v2_verify():
    """Manually trigger Hypothesis V2 verification."""
    asyncio.create_task(verify_hypothesis_v2_results())
    return {"status": "started", "message": "Verification triggered."}


@app.post("/api/hypothesis_v2/enrich_exchanges")
async def enrich_hypothesis_v2_exchanges():
    """Fetch exchanges for picks in the latest hypothesis_v2 result."""
    from hypothesis_v2 import _fetch_exchanges_for_symbols
    
    cmc_key = os.environ.get("CMC_API_KEY", "")
    if not cmc_key:
        raise HTTPException(400, "CMC_API_KEY not configured")
    
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hypothesis_v2")
            .where(AnalysisLog.status == "success")
            .order_by(AnalysisLog.created_at.desc())
            .limit(1)
        )
        entry = result.scalars().first()
        if not entry or not entry.result_json:
            raise HTTPException(404, "No hypothesis_v2 results found")
        
        data = json.loads(entry.result_json)
        model_data = data.get("deepseek_v4")
        if not model_data:
            raise HTTPException(404, "No deepseek_v4 data")
        
        # Collect symbols
        all_symbols = []
        for c in model_data.get("shortCandidates", []):
            all_symbols.append(c.get("symbol", "").upper())
        
        if not all_symbols:
            return {"success": True, "message": "No picks to enrich"}
        
        # Fetch exchanges
        exchanges_map = await _fetch_exchanges_for_symbols(all_symbols, cmc_key)
        
        # Update candidates
        for c in model_data.get("shortCandidates", []):
            c["exchanges"] = exchanges_map.get(c.get("symbol", "").upper(), [])
        
        entry.result_json = json.dumps(data, ensure_ascii=False)
        await session.commit()
        
        return {"success": True, "enriched": len(all_symbols), "exchanges": exchanges_map}


@app.post("/api/hypothesis_v2/fix_prices")
async def fix_hypothesis_v2_prices():
    """Fix hallucinated prices: use first snapshot price as real currentPrice."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hypothesis_v2")
            .where(AnalysisLog.status == "success")
            .order_by(AnalysisLog.created_at.desc())
            .limit(10)
        )
        entries = result.scalars().all()
        
        fixed_count = 0
        fixes = {}
        
        for entry in entries:
            if not entry.result_json:
                continue
            data = json.loads(entry.result_json)
            ds = data.get("deepseek_v4")
            if not ds:
                continue
            
            entry_fixes = []
            for c in ds.get("shortCandidates", []):
                snapshots = c.get("snapshots", [])
                if not snapshots:
                    continue
                # Use first snapshot price as the real price at analysis time
                real_price = snapshots[0].get("price", 0)
                if not real_price or real_price <= 0:
                    continue
                old_price = c.get("currentPrice", 0)
                if old_price > 0 and abs(real_price - old_price) / max(old_price, real_price) > 0.15:
                    entry_fixes.append(f"{c['symbol']}: {old_price:.6f} -> {real_price:.6f}")
                    c["currentPrice"] = real_price
                    # Recalculate all snapshot changes from real start price
                    for snap in snapshots:
                        if snap.get("price") and real_price > 0:
                            snap["change"] = round(((snap["price"] - real_price) / real_price) * 100, 2)
                    # Recalculate actualChange24h
                    if c.get("actualPrice24h") and real_price > 0:
                        c["actualChange24h"] = round(((c["actualPrice24h"] - real_price) / real_price) * 100, 2)
                        c["hit"] = c["actualChange24h"] < 0
                        c["strongHit"] = c["actualChange24h"] <= -5
                    fixed_count += 1
            
            if entry_fixes:
                fixes[str(entry.id)] = entry_fixes
                entry.result_json = json.dumps(data, ensure_ascii=False)
        
        await session.commit()
        return {"success": True, "fixed": fixed_count, "details": fixes}


@app.post("/api/shitcoins/start")
async def start_shitcoin_monitor():
    """Manually start the shitcoin monitor if not running."""
    if is_monitor_running():
        return {"success": True, "message": "Monitor already running"}
    asyncio.create_task(start_monitor())
    return {"success": True, "message": "Monitor starting..."}


@app.post("/api/mentions/scan")
async def trigger_mentions_scan():
    """Start mentions scan in background. Poll /api/mentions/result for results."""
    asyncio.create_task(_run_mentions_scan_bg())
    return {"success": True, "status": "started", "message": "Scanning... Poll /api/mentions/result for results."}


_mentions_result: dict | None = None
_mentions_running: bool = False


async def _run_mentions_scan_bg():
    global _mentions_result, _mentions_running
    _mentions_running = True
    try:
        result = await run_mentions_scan()
        _mentions_result = result
    except Exception as e:
        import traceback
        logger.error(f"Mentions scan error: {e}")
        logger.error(traceback.format_exc())
        _mentions_result = {"error": str(e)}
    finally:
        _mentions_running = False


@app.get("/api/mentions/result")
async def get_mentions_result():
    """Get the latest mentions scan result."""
    if _mentions_running:
        return {"success": True, "status": "running"}
    if _mentions_result is None:
        return {"success": True, "status": "no_data"}
    if "error" in _mentions_result:
        return {"success": False, "error": _mentions_result["error"]}
    return {"success": True, "status": "done", **_mentions_result}


@app.delete("/api/hypothesis/{entry_id}")
async def delete_hypothesis_entry(entry_id: int):
    """Delete a specific hypothesis entry by ID."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog).where(AnalysisLog.id == entry_id).where(AnalysisLog.mode == "hourly_hypothesis")
        )
        log = result.scalar_one_or_none()
        if not log:
            raise HTTPException(404, "Entry not found")
        await session.delete(log)
        await session.commit()
        return {"success": True, "deleted_id": entry_id}


@app.post("/api/hypothesis/cleanup_all")
async def cleanup_all_hypothesis():
    """Delete ALL hypothesis entries. Fresh start."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hourly_hypothesis")
        )
        logs = result.scalars().all()
        count = len(logs)
        for log in logs:
            await session.delete(log)
        await session.commit()
        return {"success": True, "deleted": count}


@app.post("/api/hypothesis/cleanup_old")
async def cleanup_old_hypothesis():
    """Delete all hypothesis entries made with Claude (before DeepSeek switch).
    
    Cutoff: entries created at 20:50 MSK on May 25, 2026 or earlier.
    Server stores created_at in MSK. So we delete where created_at <= '2026-05-25 21:00:00'.
    This removes all 2PM-3PM ET entries and earlier (Claude era).
    """
    async_session = get_async_session()
    async with async_session() as session:
        # Server time is MSK. Cutoff = 21:00 MSK May 25 (includes 2PM-3PM ET = 21:00-22:00 MSK)
        cutoff = datetime(2026, 5, 25, 22, 0, 0)  # 22:00 MSK = 3PM ET end
        
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "hourly_hypothesis")
            .where(AnalysisLog.created_at <= cutoff)
        )
        logs = result.scalars().all()
        count = len(logs)
        
        for log in logs:
            await session.delete(log)
        
        await session.commit()
        return {"success": True, "deleted": count, "cutoff_msk": "2026-05-25 22:00:00"}


@app.post("/api/altcoin/fix_stuck")
async def fix_stuck_altcoin():
    """Mark stuck altcoin analyses as failed (status='running' for more than 1 hour)."""
    async_session = get_async_session()
    async with async_session() as session:
        cutoff = datetime.utcnow() - timedelta(hours=1)
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "altcoin_weekly")
            .where(AnalysisLog.status == "running")
            .where(AnalysisLog.created_at <= cutoff)
        )
        logs = result.scalars().all()
        fixed = 0
        for log in logs:
            log.status = "failed"
            log.error_message = "Marked as failed: stuck in running state after server restart"
            log.finished_at = datetime.utcnow()
            fixed += 1
        await session.commit()
        return {"success": True, "fixed": fixed, "ids": [log.id for log in logs]}


@app.post("/api/altcoin/run")
async def trigger_altcoin_analysis():
    """Manually trigger weekly altcoin analysis."""
    if not os.environ.get("CLAUDE_API_KEY"):
        raise HTTPException(400, "CLAUDE_API_KEY not configured on server")
    
    asyncio.create_task(run_altcoin_analysis(trigger="manual"))
    return {"status": "started", "message": "Altcoin analysis triggered. Check /api/altcoin/history for results."}


@app.get("/api/altcoin/history")
async def get_altcoin_history(limit: int = 20):
    """Get altcoin analysis history."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog)
            .where(AnalysisLog.mode == "altcoin_weekly")
            .order_by(AnalysisLog.created_at.desc())
            .limit(limit)
        )
        logs = result.scalars().all()
        
        items = []
        for log in logs:
            result_data = None
            if log.result_json:
                try:
                    result_data = json.loads(log.result_json)
                except:
                    pass
            items.append({
                "id": log.id,
                "created_at": (log.created_at.isoformat() + "Z") if log.created_at else None,
                "finished_at": (log.finished_at.isoformat() + "Z") if log.finished_at else None,
                "status": log.status,
                "trigger": log.trigger,
                "reddit_posts_count": log.reddit_posts_count,
                "twitter_tweets_count": log.twitter_tweets_count,
                "error_message": log.error_message,
                "result": result_data,
            })
        
        return {"success": True, "items": items}


@app.get("/api/altcoin/tracking")
async def get_altcoin_tracking(limit: int = 50):
    """Get altcoin picks tracking history with actual results."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AltcoinTracking)
            .order_by(AltcoinTracking.created_at.desc())
            .limit(limit)
        )
        trackings = result.scalars().all()
        
        items = []
        for t in trackings:
            items.append({
                "id": t.id,
                "analysis_id": t.analysis_id,
                "symbol": t.symbol,
                "name": t.name,
                "confidence": t.confidence,
                "risk": t.risk,
                "target_change_7d": t.target_change_7d,
                "catalyst": t.catalyst,
                "reasoning": t.reasoning,
                "start_price": t.start_price,
                "target_price_7d": t.target_price_7d,
                "end_price": t.end_price,
                "actual_change_7d": t.actual_change_7d,
                "daily_prices": json.loads(t.daily_prices_json) if t.daily_prices_json else [],
                "status": t.status,
                "created_at": (t.created_at.isoformat() + "Z") if t.created_at else None,
                "completed_at": (t.completed_at.isoformat() + "Z") if t.completed_at else None,
            })
        
        # Calculate stats
        completed = [i for i in items if i["status"] == "completed" and i["actual_change_7d"] is not None]
        total_completed = len(completed)
        winners = len([i for i in completed if i["actual_change_7d"] and i["actual_change_7d"] >= 10])
        positive = len([i for i in completed if i["actual_change_7d"] and i["actual_change_7d"] > 0])
        avg_change = sum(i["actual_change_7d"] for i in completed if i["actual_change_7d"]) / total_completed if total_completed > 0 else 0
        
        return {
            "success": True,
            "items": items,
            "stats": {
                "total_picks": len(items),
                "completed": total_completed,
                "active": len([i for i in items if i["status"] == "active"]),
                "winners_10pct": winners,
                "positive": positive,
                "win_rate_10pct": (winners / total_completed * 100) if total_completed > 0 else 0,
                "positive_rate": (positive / total_completed * 100) if total_completed > 0 else 0,
                "avg_change": avg_change,
            }
        }


@app.post("/api/altcoin/tracking/update")
async def trigger_altcoin_tracking_update():
    """Manually trigger altcoin daily price snapshot."""
    asyncio.create_task(update_altcoin_daily_prices())
    return {"status": "started", "message": "Altcoin daily price snapshot triggered."}


@app.post("/api/altcoin/tracking/backfill")
async def backfill_altcoin_tracking():
    """Backfill missing daily prices from Binance historical klines.
    
    Fetches daily candle close prices at 05:00 UTC (08:00 MSK) for each missed day.
    """
    import httpx
    
    async_session = get_async_session()
    async with async_session() as session:
        from core.models import AltcoinTracking
        result = await session.execute(
            select(AltcoinTracking).where(AltcoinTracking.status == "active")
        )
        active = result.scalars().all()
        
        if not active:
            return {"success": True, "message": "No active trackings"}
        
        filled = 0
        errors = []
        
        async with httpx.AsyncClient(timeout=30, proxy=BINANCE_PROXY) as client:
            for tracking in active:
                symbol = tracking.symbol.upper()
                pair = f"{symbol}USDT"
                
                # Load existing daily prices
                daily_prices = []
                if tracking.daily_prices_json:
                    try:
                        daily_prices = json.loads(tracking.daily_prices_json)
                    except:
                        daily_prices = []
                
                # Calculate which days are missing
                # Day 1 = analysis day (start price)
                # Day 2+ = subsequent days at 05:00 UTC (08:00 MSK)
                analysis_date = tracking.created_at
                analysis_date_str = analysis_date.strftime("%Y-%m-%d")
                
                # Add day 1 (start price) if missing
                existing_dates = {d.get("date") for d in daily_prices}
                if analysis_date_str not in existing_dates:
                    daily_prices.insert(0, {
                        "day": 1,
                        "date": analysis_date_str,
                        "price": tracking.start_price,
                        "change_from_start": 0.0,
                        "change_from_prev": 0.0,
                    })
                    filled += 1
                    existing_dates.add(analysis_date_str)
                
                # Day 2+ snapshots at 05:00 UTC each day after analysis
                first_snapshot = analysis_date.replace(hour=5, minute=0, second=0, microsecond=0) + timedelta(days=1)
                
                now = datetime.utcnow()
                days_since = (now - first_snapshot).days + 1
                
                for day_offset in range(days_since):
                    snapshot_time = first_snapshot + timedelta(days=day_offset)
                    if snapshot_time > now:
                        break
                    
                    date_str = snapshot_time.strftime("%Y-%m-%d")
                    if date_str in existing_dates:
                        continue  # Already have this day
                    
                    # Fetch 1h candle at 05:00 UTC for this day from Binance
                    start_ms = int(snapshot_time.timestamp() * 1000)
                    try:
                        resp = await client.get(
                            "https://api.binance.com/api/v3/klines",
                            params={"symbol": pair, "interval": "1h", "startTime": start_ms, "limit": 1}
                        )
                        if resp.status_code == 200:
                            klines = resp.json()
                            if klines:
                                close_price = float(klines[0][4])
                                change_from_start = ((close_price - tracking.start_price) / tracking.start_price) * 100
                                
                                # Change from previous day
                                if daily_prices:
                                    prev_price = daily_prices[-1]["price"]
                                else:
                                    prev_price = tracking.start_price
                                change_from_prev = ((close_price - prev_price) / prev_price) * 100
                                
                                daily_prices.append({
                                    "day": len(daily_prices) + 1,
                                    "date": date_str,
                                    "price": close_price,
                                    "change_from_start": round(change_from_start, 2),
                                    "change_from_prev": round(change_from_prev, 2),
                                })
                                filled += 1
                            else:
                                errors.append(f"{symbol}: no kline for {date_str}")
                        else:
                            errors.append(f"{symbol}: Binance {resp.status_code} for {date_str}")
                    except Exception as e:
                        errors.append(f"{symbol}: {str(e)}")
                    
                    await asyncio.sleep(0.1)
                
                # Sort by day number and save
                daily_prices.sort(key=lambda x: x.get("date", ""))
                for i, dp in enumerate(daily_prices):
                    dp["day"] = i + 1
                
                tracking.daily_prices_json = json.dumps(daily_prices)
                if daily_prices:
                    tracking.end_price = daily_prices[-1]["price"]
                    tracking.actual_change_7d = daily_prices[-1]["change_from_start"]
        
        await session.commit()
        return {"success": True, "filled": filled, "errors": errors[:10]}


@app.get("/api/forecast/daily-performance")
async def get_daily_performance():
    """Get daily forecast performance: prediction vs actual 24h result.
    
    For each completed forecast, shows:
    - Date, coin, prediction (Bullish/Bearish), confidence
    - Start price, end price (24h later), actual change %
    - Whether direction matched
    """
    async_session = get_async_session()
    async with async_session() as session:
        # Only from April 15, 2026+, reddit_only mode
        cutoff = datetime(2026, 4, 15)
        
        # Get analysis IDs for reddit_only mode (exclude reddit_twitter)
        reddit_only_ids_result = await session.execute(
            select(AnalysisLog.id)
            .where(AnalysisLog.mode != "reddit_twitter")
            .where(AnalysisLog.created_at >= cutoff)
        )
        reddit_only_ids = [r[0] for r in reddit_only_ids_result]
        
        if not reddit_only_ids:
            return {"success": True, "rows": [], "stats": {"total_forecasts": 0, "direction_matched": 0, "win_rate": 0, "bullish_count": 0, "bullish_matched": 0, "bearish_count": 0, "bearish_matched": 0, "avg_actual_change": 0, "by_coin": {}}}
        
        result = await session.execute(
            select(ForecastTracking)
            .where(ForecastTracking.created_at >= cutoff)
            .where(ForecastTracking.analysis_id.in_(reddit_only_ids))
            .order_by(ForecastTracking.created_at.desc())
            .limit(1000)
        )
        trackings = result.scalars().all()
        
        rows = []
        for t in trackings:
            # Get actual price at end of 24h from polymarket data
            poly_data = []
            if t.polymarket_prices_json:
                try:
                    poly_data = json.loads(t.polymarket_prices_json)
                except:
                    pass
            
            # End price = last candle close in polymarket data
            end_price = None
            if poly_data:
                end_price = poly_data[-1].get("close")
            
            # If no polymarket data, try binance
            if end_price is None and t.binance_prices_json:
                try:
                    binance_data = json.loads(t.binance_prices_json)
                    if binance_data:
                        end_price = binance_data[-1].get("close_price")
                except:
                    pass
            
            # If no polymarket/binance, try actual_prices (CMC hourly — older data)
            if end_price is None and t.actual_prices_json:
                try:
                    actual_data = json.loads(t.actual_prices_json)
                    if actual_data:
                        end_price = actual_data[-1].get("price")
                except:
                    pass
            
            if end_price is None or t.start_price <= 0:
                continue
            
            actual_change = ((end_price - t.start_price) / t.start_price) * 100
            
            # Direction match
            predicted_up = t.prediction == "Bullish"
            actual_up = actual_change > 0
            direction_matched = predicted_up == actual_up
            
            rows.append({
                "date": (t.created_at.isoformat() + "Z") if t.created_at else None,
                "symbol": t.symbol,
                "prediction": t.prediction,
                "confidence": t.confidence,
                "start_price": round(t.start_price, 6),
                "end_price": round(end_price, 6),
                "actual_change_pct": round(actual_change, 2),
                "target_change_pct": round(t.target_change_24h, 2) if t.target_change_24h else None,
                "direction_matched": direction_matched,
                "hours_tracked": t.hours_tracked,
                "analysis_id": t.analysis_id,
                "mode": None,  # will fill below
            })
        
        # Fetch analysis modes
        if rows:
            analysis_ids = list(set(r["analysis_id"] for r in rows))
            mode_result = await session.execute(
                select(AnalysisLog.id, AnalysisLog.mode)
                .where(AnalysisLog.id.in_(analysis_ids))
            )
            mode_map = {row[0]: row[1] for row in mode_result}
            for r in rows:
                r["mode"] = mode_map.get(r["analysis_id"], "unknown")
        
        # Stats
        total = len(rows)
        matched = len([r for r in rows if r["direction_matched"]])
        bullish_rows = [r for r in rows if r["prediction"] == "Bullish"]
        bearish_rows = [r for r in rows if r["prediction"] == "Bearish"]
        
        # By coin
        coins_stats = {}
        for r in rows:
            sym = r["symbol"]
            if sym not in coins_stats:
                coins_stats[sym] = {"total": 0, "matched": 0, "avg_change": 0, "changes": []}
            coins_stats[sym]["total"] += 1
            if r["direction_matched"]:
                coins_stats[sym]["matched"] += 1
            coins_stats[sym]["changes"].append(r["actual_change_pct"])
        
        for sym in coins_stats:
            changes = coins_stats[sym]["changes"]
            coins_stats[sym]["avg_change"] = round(sum(changes) / len(changes), 2) if changes else 0
            coins_stats[sym]["win_rate"] = round(coins_stats[sym]["matched"] / coins_stats[sym]["total"] * 100, 1) if coins_stats[sym]["total"] > 0 else 0
            del coins_stats[sym]["changes"]
        
        return {
            "success": True,
            "rows": rows,
            "stats": {
                "total_forecasts": total,
                "direction_matched": matched,
                "win_rate": round(matched / total * 100, 1) if total > 0 else 0,
                "bullish_count": len(bullish_rows),
                "bullish_matched": len([r for r in bullish_rows if r["direction_matched"]]),
                "bearish_count": len(bearish_rows),
                "bearish_matched": len([r for r in bearish_rows if r["direction_matched"]]),
                "avg_actual_change": round(sum(r["actual_change_pct"] for r in rows) / total, 2) if total > 0 else 0,
                "by_coin": coins_stats,
            }
        }


@app.post("/api/analysis/log/start")
async def start_frontend_analysis_log():
    """Create a new running analysis log for frontend tracking."""
    try:
        async_session = get_async_session()
        async with async_session() as session:
            log = AnalysisLog(
                mode="simple",  # default
                status="running",
                trigger="manual",
            )
            session.add(log)
            await session.commit()
            await session.refresh(log)
            return {"success": True, "id": log.id}
    except Exception as e:
        logger.error(f"Failed to start frontend analysis log: {e}")
        raise HTTPException(500, f"Error starting log: {str(e)}")

@app.post("/api/analysis/log/{analysis_id}")
async def complete_frontend_analysis_log(analysis_id: int, request: Request):
    """Save an analysis that was executed on the frontend into the database."""
    try:
        data = await request.json()
        
        async_session = get_async_session()
        async with async_session() as session:
            result = await session.execute(
                select(AnalysisLog).where(AnalysisLog.id == analysis_id)
            )
            log = result.scalar_one_or_none()
            
            if not log:
                raise HTTPException(404, "Analysis log not found")
                
            log.mode = data.get("mode", "simple")
            log.status = data.get("status", "success")
            log.reddit_posts_count = data.get("reddit_count", 0)
            log.twitter_tweets_count = data.get("twitter_count", 0)
            log.telegram_msgs_count = data.get("telegram_count", 0)
            log.result_json = json.dumps(data.get("result", {}), ensure_ascii=False) if data.get("result") else None
            log.error_message = data.get("error_message")
            log.finished_at = datetime.utcnow()
            
            await session.commit()
            
        # Auto-start forecast tracking in background
        try:
            asyncio.create_task(save_forecast_from_analysis(analysis_id))
        except Exception as track_err:
            logger.warning(f"Failed to auto-start forecast tracking: {track_err}")

        return {"success": True, "message": "Analysis saved to history."}
    except Exception as e:
        logger.error(f"Failed to complete frontend analysis log: {e}")
        raise HTTPException(500, f"Error completing log: {str(e)}")



# ==================== FORECAST TRACKING ENDPOINTS ====================

@app.get("/api/forecast/active")
async def get_active_forecasts():
    """Get all active and recent forecast trackings."""
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(ForecastTracking)
            .order_by(ForecastTracking.created_at.desc())
            .limit(500)
        )
        trackings = result.scalars().all()
        
        # Get analysis modes for all trackings
        analysis_ids = list({t.analysis_id for t in trackings})
        mode_map = {}
        if analysis_ids:
            mode_result = await session.execute(
                select(AnalysisLog.id, AnalysisLog.mode).where(AnalysisLog.id.in_(analysis_ids))
            )
            for row in mode_result:
                mode_map[row[0]] = row[1]
        
        return {
            "success": True,
            "items": [
                {
                    "id": t.id,
                    "analysis_id": t.analysis_id,
                    "mode": mode_map.get(t.analysis_id, "reddit_only"),
                    "symbol": t.symbol,
                    "prediction": t.prediction,
                    "confidence": t.confidence,
                    "start_price": t.start_price,
                    "target_price_24h": t.target_price_24h,
                    "target_change_24h": t.target_change_24h,
                    "hourly_forecast": json.loads(t.hourly_forecast_json) if t.hourly_forecast_json else [],
                    "actual_prices": json.loads(t.actual_prices_json) if t.actual_prices_json else [],
                    "binance_prices": json.loads(t.binance_prices_json) if t.binance_prices_json else [],
                    "polymarket_prices": json.loads(t.polymarket_prices_json) if t.polymarket_prices_json else [],
                    "status": t.status,
                    "hours_tracked": t.hours_tracked,
                    "hits": t.hits,
                    "misses": t.misses,
                    "created_at": t.created_at.isoformat() + "Z",
                    "completed_at": (t.completed_at.isoformat() + "Z") if t.completed_at else None,
                } for t in trackings
            ],
        }


@app.post("/api/forecast/start/{analysis_id}")
async def start_forecast_tracking(analysis_id: int):
    """Create forecast trackings from a completed analysis."""
    count = await save_forecast_from_analysis(analysis_id)
    if count == 0:
        raise HTTPException(400, "No trackable forecasts found in this analysis. "
                                 "Ensure it has hourlyForecast data for BTC/ETH/SOL/XRP/DOGE/BNB.")
    return {"success": True, "trackings_created": count}


@app.post("/api/forecast/force_update")
async def force_forecast_update():
    """Manually trigger a forecast tracking update."""
    asyncio.create_task(update_forecast_tracking_job())
    return {"status": "started", "message": "Forecast tracking update triggered."}


@app.post("/api/forecast/force_polymarket")
async def force_polymarket_update():
    """Manually trigger a Polymarket-style tracking update."""
    asyncio.create_task(update_polymarket_tracking())
    return {"status": "started", "message": "Polymarket tracking update triggered."}


@app.post("/api/forecast/recalculate_binance")
async def recalculate_binance_matched():
    """Recalculate all binance_prices matched values using correct hour-to-hour logic."""
    try:
        async_session = get_async_session()
        async with async_session() as session:
            result = await session.execute(select(ForecastTracking))
            all_trackings = result.scalars().all()
            
            fixed = 0
            for tracking in all_trackings:
                if not tracking.binance_prices_json or not tracking.hourly_forecast_json:
                    continue
                
                try:
                    binance_data = json.loads(tracking.binance_prices_json)
                    forecast = json.loads(tracking.hourly_forecast_json)
                except:
                    continue
                
                if not binance_data or not forecast:
                    continue
                
                changed = False
                for i, bp in enumerate(binance_data):
                    # Get predicted price for this index
                    pred_price = forecast[i].get("price") if i < len(forecast) else None
                    # Get previous predicted price
                    prev_pred = tracking.start_price
                    if i > 0 and (i - 1) < len(forecast):
                        prev_pred = forecast[i - 1].get("price", tracking.start_price)
                    # Get previous binance price
                    prev_b = tracking.start_price
                    if i > 0:
                        prev_b = binance_data[i - 1].get("close_price", tracking.start_price)
                    
                    if pred_price is not None:
                        pred_dir = pred_price - prev_pred
                        real_dir = bp["close_price"] - prev_b
                        
                        if pred_dir > 0 and real_dir > 0:
                            new_matched = True
                        elif pred_dir < 0 and real_dir < 0:
                            new_matched = True
                        elif pred_dir == 0 and real_dir == 0:
                            new_matched = True
                        else:
                            new_matched = False
                        
                        if bp.get("matched") != new_matched:
                            bp["matched"] = new_matched
                            bp["predicted_price"] = round(pred_price, 3)
                            changed = True
                
                if changed:
                    tracking.binance_prices_json = json.dumps(binance_data)
                    fixed += 1
            
            await session.commit()
        return {"success": True, "trackings_fixed": fixed}
    except Exception as e:
        import traceback
        logger.error(f"recalculate_binance error: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/forecast/backfill_polymarket")
async def backfill_polymarket():
    """Backfill polymarket_prices_json from historical Binance klines for all trackings that don't have it."""
    import httpx
    
    BINANCE_PAIRS = {
        "BTC": "BTCUSDT", "ETH": "ETHUSDT", "SOL": "SOLUSDT",
        "XRP": "XRPUSDT", "DOGE": "DOGEUSDT", "BNB": "BNBUSDT",
    }
    
    try:
        async_session = get_async_session()
        async with async_session() as session:
            result = await session.execute(select(ForecastTracking))
            all_trackings = result.scalars().all()
            
            filled = 0
            async with httpx.AsyncClient(timeout=30, proxy=BINANCE_PROXY) as client:
                for tracking in all_trackings:
                    # Skip if already has full 24h polymarket data
                    if tracking.polymarket_prices_json:
                        try:
                            existing = json.loads(tracking.polymarket_prices_json)
                            if len(existing) >= 24:
                                continue
                        except:
                            pass
                    
                    if not tracking.hourly_forecast_json:
                        continue
                    
                    try:
                        forecast = json.loads(tracking.hourly_forecast_json)
                    except:
                        continue
                    
                    if not forecast:
                        continue
                    
                    pair = BINANCE_PAIRS.get(tracking.symbol)
                    if not pair:
                        continue
                    
                    # Determine start time from created_at (analysis time)
                    # Round down to the hour
                    start_time = tracking.created_at.replace(minute=0, second=0, microsecond=0)
                    start_ms = int(start_time.timestamp() * 1000)
                    
                    # Fetch 24 hourly klines starting from analysis time
                    try:
                        resp = await client.get(
                            "https://api.binance.com/api/v3/klines",
                            params={
                                "symbol": pair,
                                "interval": "1h",
                                "startTime": start_ms,
                                "limit": 24,
                            }
                        )
                        if resp.status_code != 200:
                            logger.warning(f"[Backfill] Binance API error for {tracking.symbol}: {resp.status_code}")
                            continue
                        
                        klines = resp.json()
                    except Exception as e:
                        logger.warning(f"[Backfill] Failed to fetch klines for {tracking.symbol}: {e}")
                        continue
                    
                    if not klines:
                        continue
                    
                    # Build polymarket data
                    poly_data = []
                    for i, candle in enumerate(klines):
                        candle_open = float(candle[1])
                        candle_close = float(candle[4])
                        candle_direction = "up" if candle_close >= candle_open else "down"
                        
                        # Predicted direction (null if forecast doesn't have this hour)
                        predicted_direction = None
                        matched = None
                        if i < len(forecast):
                            pred_price = forecast[i].get("price")
                            prev_pred = tracking.start_price if i == 0 else forecast[i - 1].get("price", tracking.start_price)
                            
                            if pred_price is not None and prev_pred is not None:
                                predicted_direction = "up" if pred_price >= prev_pred else "down"
                            
                            if predicted_direction is not None:
                                matched = (predicted_direction == candle_direction)
                        
                        candle_time = datetime.utcfromtimestamp(candle[0] / 1000)
                        
                        poly_data.append({
                            "timestamp": candle_time.isoformat(),
                            "hour": i + 1,
                            "open": round(candle_open, 6),
                            "close": round(candle_close, 6),
                            "candle_direction": candle_direction,
                            "predicted_direction": predicted_direction,
                            "matched": matched,
                        })
                    
                    if poly_data:
                        tracking.polymarket_prices_json = json.dumps(poly_data)
                        filled += 1
                        logger.info(f"[Backfill] {tracking.symbol} (ID={tracking.id}): filled {len(poly_data)} hours")
                    
                    # Small delay to avoid rate limits
                    await asyncio.sleep(0.2)
            
            await session.commit()
        return {"success": True, "trackings_filled": filled}
    except Exception as e:
        import traceback
        logger.error(f"backfill_polymarket error: {e}")
        logger.error(traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
