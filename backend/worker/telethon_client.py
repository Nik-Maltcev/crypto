"""Telethon client singleton for Telegram chat parsing."""

import os
from telethon import TelegramClient
from telethon.sessions import StringSession

from core.config import get_settings

# Global singleton client
_telethon_client: TelegramClient | None = None


async def get_telethon_client() -> TelegramClient:
    """Get or create the singleton Telethon client.
    
    Uses StringSession from environment variable for Railway compatibility.
    Falls back to file session for local development.
    """
    global _telethon_client
    
    if _telethon_client is None:
        settings = get_settings()
        
        # Check for StringSession in env (for Railway)
        session_string = os.getenv("TELETHON_SESSION")
        
        if session_string:
            # Use StringSession for cloud deployment
            _telethon_client = TelegramClient(
                StringSession(session_string),
                settings.TELEGRAM_API_ID,
                settings.TELEGRAM_API_HASH,
            )
        else:
            # Fall back to file session for local dev
            _telethon_client = TelegramClient(
                "crypto_parser",
                settings.TELEGRAM_API_ID,
                settings.TELEGRAM_API_HASH,
            )
    
    if not _telethon_client.is_connected():
        await _telethon_client.connect()
        
        if not await _telethon_client.is_user_authorized():
            raise RuntimeError(
                "Telethon not authorized. Run auth_telethon.py locally first, "
                "then set TELETHON_SESSION env variable."
            )
    
    return _telethon_client


async def close_telethon_client() -> None:
    """Close and disconnect the Telethon client."""
    global _telethon_client
    
    if _telethon_client is not None:
        await _telethon_client.disconnect()
        _telethon_client = None
