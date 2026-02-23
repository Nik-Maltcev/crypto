"""Chat parser module for parsing Telegram crypto chats."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from telethon import TelegramClient
from telethon.tl.types import User
from telethon.errors import FloodWaitError, AuthKeyUnregisteredError

from core.config import get_settings

logger = logging.getLogger(__name__)


class ChatParser:
    """Parser for retrieving messages from Telegram chats."""
    
    def __init__(self, client: TelegramClient):
        self.client = client
        self.settings = get_settings()
    
    async def ensure_connected(self):
        """Ensure client is connected, reconnect if needed."""
        if not self.client.is_connected():
            logger.info("Reconnecting to Telegram...")
            await self.client.connect()
            if not await self.client.is_user_authorized():
                raise RuntimeError("Telethon not authorized")
    
    async def parse_chat(
        self,
        chat_id: str,
        days: int = 2,
        max_messages: int | None = None,
        min_length_override: int | None = None,
    ) -> list[dict[str, Any]]:
        """Parse messages from a single chat."""
        messages = []
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        min_length = min_length_override if min_length_override is not None else self.settings.MIN_MESSAGE_LENGTH
        
        try:
            # Ensure connected before each chat
            await self.ensure_connected()
            
            entity = await self.client.get_entity(chat_id)
            chat_title = getattr(entity, 'title', chat_id)
            
            async for message in self.client.iter_messages(
                entity,
                offset_date=datetime.now(timezone.utc),
                reverse=False,
            ):
                if message.date < cutoff_date:
                    break
                
                if not message.text or len(message.text) < min_length:
                    continue
                
                sender_name = None
                sender_username = None
                is_bot = False
                
                if message.sender:
                    if isinstance(message.sender, User):
                        is_bot = message.sender.bot or False
                        sender_name = f"{message.sender.first_name or ''} {message.sender.last_name or ''}".strip()
                        sender_username = message.sender.username
                
                if is_bot:
                    continue
                
                messages.append({
                    "chat": chat_id,
                    "chat_title": chat_title,
                    "message_id": message.id,
                    "date": message.date.isoformat(),
                    "text": message.text,
                    "sender_name": sender_name,
                    "sender_username": sender_username,
                })
                
                # Stop early if we have enough messages for this chat
                if max_messages and len(messages) >= max_messages:
                    break
            
            logger.info(f"Parsed {len(messages)} messages from {chat_id}")
            
        except FloodWaitError as e:
            logger.error(f"FloodWait on chat {chat_id}: must wait {e.seconds}s. Aborting further parsing.")
            raise  # Re-raise so parse_all_chats can handle it
        except AuthKeyUnregisteredError:
            logger.error(f"SESSION REVOKED for chat {chat_id}. The session string is no longer valid.")
            raise  # Re-raise so parse_all_chats can stop the whole loop
        except Exception as e:
            logger.error(f"Error parsing chat {chat_id}: {e}")
            # Try to reconnect for next chat
            try:
                await self.client.disconnect()
                await asyncio.sleep(2)
                await self.client.connect()
            except:
                pass
            return []
        
        return messages
    
    async def parse_all_chats(
        self,
        chat_ids: list[str],
        days: int = 2,
        max_messages_per_chat: int | None = None,
        min_length_override: int | None = None,
    ) -> list[dict[str, Any]]:
        """Parse messages from all chats."""
        all_messages = []
        delay = self.settings.REQUEST_DELAY_SEC
        
        for i, chat_id in enumerate(chat_ids):
            if i > 0:
                await asyncio.sleep(delay)
            
            # Reconnect every 100 chats to avoid disconnection
            if i > 0 and i % 100 == 0:
                logger.info(f"Reconnecting after {i} chats...")
                try:
                    await self.client.disconnect()
                    await asyncio.sleep(3)
                    await self.client.connect()
                except Exception as e:
                    logger.error(f"Reconnect failed: {e}")
            
            logger.info(f"Parsing chat {i + 1}/{len(chat_ids)}: {chat_id}")
            try:
                messages = await self.parse_chat(chat_id, days, max_messages=max_messages_per_chat, min_length_override=min_length_override)
                all_messages.extend(messages)
            except FloodWaitError as e:
                logger.error(f"FLOOD WAIT: Telegram requires a {e.seconds}s wait. Stopping. Returning {len(all_messages)} messages collected so far.")
                break  # Stop trying more chats — they'll all fail too
            except AuthKeyUnregisteredError:
                logger.error(f"CRITICAL: Telegram Session is REVOKED. Stopping. Please update TELETHON_SESSION.")
                break  # Session is dead, no point in continuing
        
        all_messages.sort(key=lambda x: x["date"], reverse=True)
        
        logger.info(f"Total: {len(all_messages)} messages from {len(chat_ids)} chats")
        return all_messages
