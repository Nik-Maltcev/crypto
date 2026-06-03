"""Shitcoin Monitor — real-time Telegram caller monitoring.

Listens to caller channels via Telethon, detects Solana contract addresses,
checks them via RugCheck API, fetches market data from Dexscreener,
and tracks price changes after the call.
"""

import asyncio
import json
import logging
import os
import re
from datetime import datetime, timedelta

import httpx
from telethon import TelegramClient, events
from telethon.sessions import StringSession

from core.database import get_async_session
from core.models import AnalysisLog

logger = logging.getLogger(__name__)

# Solana address regex (base58, 32-44 chars)
SOLANA_ADDRESS_RE = re.compile(r'\b[1-9A-HJ-NP-Za-km-z]{32,44}\b')

# Caller channels from the PDF guide
CALLER_CHANNELS = [
    "GEMSCALLS_6868", "doctoreclub",
    "mad_apes", "GodsCryptoReviews", "PapasCall", "FullofEth",
    "whalevomitcalls", "Paradoxes1", "ghastlygems", "nocturnalcalls96",
    "duffyscalls", "NagatoGemCalls", "PirateGemsCall",
    "LionCALL", "MarkDegens", "MarkGems", "Zorrogems",
    "ottergamble", "marketingguyycall", "MaybachCalls",
    "CryptoFrogsGems", "TheDonsCalls", "degenalertstg",
    "KnightCall", "TrafalgarLawCalls",
    "waldosalpha", "mackcalls",
    "MrpredatorCall", "Marshmellow100xCalls", "eyecrosschain",
    "yummycalls", "UnicornCryptoX1000", "CryptoDeusGems", "TBGgambLes",
    "TheBlockchainGods", "spacemandifferentchaincallz",
]

RUGCHECK_API = "https://api.rugcheck.xyz/v1/tokens"
DEXSCREENER_API = "https://api.dexscreener.com/latest/dex/tokens"

# In-memory storage for detected tokens (will be replaced with DB later)
_detected_tokens: list[dict] = []
_monitor_running: bool = False


async def check_rugcheck(contract: str) -> dict:
    """Check token safety via RugCheck API."""
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(f"{RUGCHECK_API}/{contract}/report")
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "score": data.get("score", 0),
                    "risks": data.get("risks", []),
                    "mint_authority": data.get("tokenMeta", {}).get("mintAuthority"),
                    "freeze_authority": data.get("tokenMeta", {}).get("freezeAuthority"),
                    "lp_locked_pct": data.get("markets", [{}])[0].get("lp", {}).get("lpLockedPct", 0) if data.get("markets") else 0,
                    "top_holders_pct": sum(h.get("pct", 0) for h in data.get("topHolders", [])[:10]),
                    "creator_pct": data.get("creator", {}).get("pct", 0),
                    "is_safe": data.get("score", 0) >= 700,  # RugCheck score >= 700 = relatively safe
                }
        except Exception as e:
            logger.warning(f"[SHITCOIN] RugCheck error for {contract[:8]}...: {e}")
    return {"is_safe": None, "error": "RugCheck unavailable"}


async def check_dexscreener(contract: str) -> dict:
    """Get token info from Dexscreener."""
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(f"{DEXSCREENER_API}/{contract}")
            if resp.status_code == 200:
                data = resp.json()
                pairs = data.get("pairs", [])
                if pairs:
                    pair = pairs[0]  # Most liquid pair
                    return {
                        "name": pair.get("baseToken", {}).get("name", "Unknown"),
                        "symbol": pair.get("baseToken", {}).get("symbol", "???"),
                        "price_usd": float(pair.get("priceUsd", 0) or 0),
                        "market_cap": pair.get("marketCap", 0),
                        "fdv": pair.get("fdv", 0),
                        "liquidity_usd": pair.get("liquidity", {}).get("usd", 0),
                        "volume_24h": pair.get("volume", {}).get("h24", 0),
                        "price_change_5m": pair.get("priceChange", {}).get("m5", 0),
                        "price_change_1h": pair.get("priceChange", {}).get("h1", 0),
                        "price_change_24h": pair.get("priceChange", {}).get("h24", 0),
                        "pair_created_at": pair.get("pairCreatedAt", 0),
                        "dexscreener_url": pair.get("url", ""),
                        "txns_buys_5m": pair.get("txns", {}).get("m5", {}).get("buys", 0),
                        "txns_sells_5m": pair.get("txns", {}).get("m5", {}).get("sells", 0),
                        "website": (pair.get("info", {}).get("websites", [{}]) or [{}])[0].get("url", ""),
                        "twitter": next((s.get("url", "") for s in (pair.get("info", {}).get("socials", []) or []) if s.get("type") == "twitter"), ""),
                        "telegram": next((s.get("url", "") for s in (pair.get("info", {}).get("socials", []) or []) if s.get("type") == "telegram"), ""),
                    }
        except Exception as e:
            logger.warning(f"[SHITCOIN] Dexscreener error for {contract[:8]}...: {e}")
    return {}


async def process_new_token(contract: str, caller_channel: str, message_text: str) -> dict | None:
    """Process a newly detected token: check rug, get market data."""
    logger.info(f"[SHITCOIN] New token detected from @{caller_channel}: {contract[:12]}...")
    
    # Check if already processed
    if any(t["contract"] == contract for t in _detected_tokens):
        logger.info(f"[SHITCOIN] Already tracked: {contract[:12]}...")
        return None
    
    # Parallel checks
    rug_task = check_rugcheck(contract)
    dex_task = check_dexscreener(contract)
    
    rug_result, dex_result = await asyncio.gather(rug_task, dex_task)
    
    token_data = {
        "contract": contract,
        "caller": caller_channel,
        "message": message_text[:300],
        "detected_at": datetime.utcnow().isoformat() + "Z",
        "rug_check": rug_result,
        "dex_data": dex_result,
        "price_at_call": dex_result.get("price_usd", 0),
        "mcap_at_call": dex_result.get("market_cap", 0),
        "price_history": [],  # Will be updated every 5 min
    }
    
    # Determine safety
    lp_locked = rug_result.get("lp_locked_pct", 0)
    creator_pct = rug_result.get("creator_pct", 0)
    is_safe = rug_result.get("is_safe")
    
    if is_safe is True and lp_locked >= 95 and creator_pct < 5:
        token_data["safety"] = "SAFE"
    elif lp_locked < 50 or creator_pct > 20:
        token_data["safety"] = "DANGER"
    else:
        token_data["safety"] = "CAUTION"
    
    _detected_tokens.insert(0, token_data)
    
    # Keep only last 100 tokens
    if len(_detected_tokens) > 100:
        _detected_tokens.pop()
    
    logger.info(
        f"[SHITCOIN] {dex_result.get('symbol', '???')} | "
        f"Safety: {token_data['safety']} | "
        f"MCap: ${dex_result.get('market_cap', 0):,.0f} | "
        f"LP: {lp_locked:.0f}% | "
        f"Creator: {creator_pct:.1f}%"
    )
    
    return token_data


async def update_price_tracking():
    """Update prices for all tracked tokens (runs every 5 min)."""
    if not _detected_tokens:
        return
    
    now = datetime.utcnow()
    
    for token in _detected_tokens[:20]:  # Only track last 20
        # Skip if older than 24h
        detected_at = datetime.fromisoformat(token["detected_at"].replace("Z", ""))
        if (now - detected_at).total_seconds() > 86400:
            continue
        
        contract = token["contract"]
        dex_data = await check_dexscreener(contract)
        
        if dex_data and dex_data.get("price_usd"):
            current_price = dex_data["price_usd"]
            call_price = token.get("price_at_call", 0)
            
            change_pct = 0
            if call_price > 0:
                change_pct = ((current_price - call_price) / call_price) * 100
            
            token["price_history"].append({
                "time": now.isoformat() + "Z",
                "price": current_price,
                "change_from_call": round(change_pct, 2),
                "mcap": dex_data.get("market_cap", 0),
            })
            
            # Update current data
            token["dex_data"] = dex_data
        
        await asyncio.sleep(0.5)  # Rate limit


async def start_monitor():
    """Start the real-time Telegram monitor for caller channels."""
    global _monitor_running
    
    if _monitor_running:
        logger.info("[SHITCOIN] Monitor already running")
        return
    
    session_string = os.getenv("TELETHON_SESSION")
    api_id = int(os.getenv("TELEGRAM_API_ID", "0"))
    api_hash = os.getenv("TELEGRAM_API_HASH", "")
    
    if not session_string or not api_id:
        logger.warning("[SHITCOIN] TELETHON_SESSION or TELEGRAM_API_ID not set. Monitor disabled.")
        return
    
    _monitor_running = True
    logger.info(f"[SHITCOIN] Starting monitor for {len(CALLER_CHANNELS)} channels...")
    
    client = TelegramClient(
        StringSession(session_string),
        api_id,
        api_hash,
    )
    
    @client.on(events.NewMessage(chats=CALLER_CHANNELS))
    async def handler(event):
        """Handle new messages from caller channels."""
        text = event.message.text or ""
        sender = ""
        try:
            chat = await event.get_chat()
            sender = getattr(chat, 'username', '') or getattr(chat, 'title', '') or str(chat.id)
        except:
            pass
        
        # Find Solana addresses in message
        addresses = SOLANA_ADDRESS_RE.findall(text)
        
        for addr in addresses:
            # Filter out common non-token addresses (too short or known patterns)
            if len(addr) < 32 or len(addr) > 44:
                continue
            
            try:
                await process_new_token(addr, sender, text)
            except Exception as e:
                logger.error(f"[SHITCOIN] Error processing token {addr[:12]}: {e}")
    
    await client.connect()
    if not await client.is_user_authorized():
        logger.error("[SHITCOIN] Telethon not authorized for monitor")
        _monitor_running = False
        return
    
    logger.info("[SHITCOIN] Monitor connected and listening!")
    
    # Start price tracking loop
    async def price_loop():
        while _monitor_running:
            try:
                await update_price_tracking()
            except Exception as e:
                logger.error(f"[SHITCOIN] Price tracking error: {e}")
            await asyncio.sleep(300)  # Every 5 minutes
    
    asyncio.create_task(price_loop())
    
    # Keep running
    await client.run_until_disconnected()


def get_detected_tokens() -> list[dict]:
    """Get all detected tokens (for API endpoint)."""
    return _detected_tokens


def is_monitor_running() -> bool:
    """Check if monitor is running."""
    return _monitor_running
