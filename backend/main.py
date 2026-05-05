"""Combined service: API + Background Parser + Scheduled Analysis."""

import asyncio
import logging
import os
import sys
from contextlib import asynccontextmanager
from datetime import datetime
import json

from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from core.config import get_settings, load_chats_config
from core.database import get_async_session, init_db
from core.models import ParseLog, AnalysisLog, ForecastTracking
# Telethon disabled — lazy import only when telegram endpoints are called
# from worker.jobs.parser import ChatParser
# from worker.telethon_client import get_telethon_client, close_telethon_client
from reddit_parser import fetch_multiple_subreddits
from cmc_parser import fetch_cmc_data
from auto_analysis import run_scheduled_analysis
from forecast_tracker import update_forecast_tracking_job, save_forecast_from_analysis, update_binance_tracking, update_polymarket_tracking

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
            scheduler.add_job(
                run_scheduled_analysis,
                trigger=CronTrigger(hour=5, minute=0),  # 05:00 UTC = 08:00 MSK
                id="daily_analysis",
                name="Daily 08:00 MSK Analysis",
                kwargs={"trigger": "scheduled"},
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
            scheduler.start()
            logger.info("APScheduler started — daily analysis at 08:00 MSK (05:00 UTC)")
        except Exception as e:
            logger.error(f"Failed to start APScheduler: {e}")
    else:
        logger.warning("CLAUDE_API_KEY or GEMINI_API_KEY not set. Scheduled analysis DISABLED.")
    
    logger.info("Ready. Call POST /api/telegram/parse to start parsing.")
    
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
    allow_methods=["GET", "POST", "OPTIONS"],
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
async def trigger_analysis():
    """Manually trigger an analysis (for testing)."""
    settings = get_settings()
    if not settings.CLAUDE_API_KEY:
        raise HTTPException(400, "CLAUDE_API_KEY not configured on server")
    if not settings.GEMINI_API_KEY:
        raise HTTPException(400, "GEMINI_API_KEY not configured on server")
    
    asyncio.create_task(run_scheduled_analysis(trigger="manual"))
    return {"status": "started", "message": "Analysis triggered. Check /api/analysis/history for results."}

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
        return {
            "success": True,
            "items": [
                {
                    "id": t.id,
                    "analysis_id": t.analysis_id,
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


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
