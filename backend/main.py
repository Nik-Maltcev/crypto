"""Combined service: API + Background Parser."""

import asyncio
import logging
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
from core.models import ParseLog
from worker.jobs.parser import ChatParser
from worker.telethon_client import get_telethon_client, close_telethon_client
from reddit_parser import fetch_multiple_subreddits
from cmc_parser import fetch_cmc_data

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


async def parse_chats_job():
    """Background job to parse all chats."""
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
    
    # Init database
    await init_db()
    logger.info("Database ready")
    
    logger.info("Ready. Call POST /api/telegram/parse to start parsing.")
    
    yield
    
    # Shutdown
    await close_telethon_client()
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


if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
