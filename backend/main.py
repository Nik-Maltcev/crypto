"""Combined service: API + Background Parser."""

import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from datetime import datetime
import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from core.config import get_settings, load_chats_config
from core.database import get_async_session, init_db
from core.models import ParseLog
from worker.jobs.parser import ChatParser
from worker.telethon_client import get_telethon_client, close_telethon_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


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
    
    # Schedule parsing every 6 hours (but don't run immediately)
    settings = get_settings()
    interval = getattr(settings, 'PARSE_INTERVAL_HOURS', 6)
    scheduler.add_job(parse_chats_job, 'interval', hours=interval, id='parse_job')
    scheduler.start()
    logger.info(f"Scheduler started (every {interval}h)")
    
    # DON'T run initial parse - wait for manual trigger via /api/telegram/parse
    logger.info("Ready. Call POST /api/telegram/parse to start parsing.")
    
    yield
    
    # Shutdown
    scheduler.shutdown(wait=False)
    await close_telethon_client()
    logger.info("Service stopped")


app = FastAPI(title="Telegram Crypto Parser", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
