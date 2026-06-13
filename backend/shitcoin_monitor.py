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

# ========== LIVE LOG BUFFER ==========
from collections import deque
_shitcoin_logs: deque = deque(maxlen=500)

def _log(msg: str):
    """Log to both logger and in-memory buffer."""
    ts = datetime.utcnow().strftime("%H:%M:%S")
    entry = f"[{ts}] {msg}"
    _shitcoin_logs.append(entry)
    logger.info(f"[SHITCOIN] {msg}")

def get_shitcoin_logs() -> list[str]:
    """Return last 500 log entries."""
    return list(_shitcoin_logs)
# ======================================

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
DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

# Email notification settings
ALERT_EMAIL = "nikmaltcev98@gmail.com"


async def _send_pump_alert(token, change_pct: float, dex_data: dict):
    """Send email notification via Resend when token hits +50%."""
    from core.config import get_settings
    settings = get_settings()
    resend_key = settings.RESEND_API_KEY
    from_email = settings.RESEND_FROM_EMAIL or "alerts@dexflow.xyz"

    if not resend_key:
        _log(f"RESEND_API_KEY not set, skipping email alert for {token.symbol}")
        return

    symbol = token.symbol or "???"
    name = token.name or "Unknown"
    contract = token.contract
    caller = token.caller or "unknown"
    mcap = dex_data.get("market_cap", 0)
    liquidity = dex_data.get("liquidity_usd", 0)
    dex_url = token.dexscreener_url or f"https://dexscreener.com/solana/{contract}"

    subject = f"{symbol} +{change_pct:.0f}% — shitcoin pump alert"
    text_body = (
        f"{symbol} ({name}) +{change_pct:.1f}% from call\n\n"
        f"Caller: @{caller}\n"
        f"MCap: ${mcap:,.0f}\n"
        f"Liquidity: ${liquidity:,.0f}\n"
        f"Contract: {contract}\n"
        f"Dexscreener: {dex_url}\n"
    )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
                json={
                    "from": from_email,
                    "to": [ALERT_EMAIL],
                    "subject": subject,
                    "text": text_body,
                },
            )
            if resp.status_code in (200, 201):
                _log(f"📧 Email alert sent for {symbol} +{change_pct:.0f}%")
            else:
                _log(f"Email send failed: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        _log(f"Email send error: {e}")


async def _extract_token_with_ai(text: str) -> str | None:
    """Use DeepSeek to extract Solana contract address from message text."""
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key or len(text.strip()) < 10:
        return None
    
    prompt = f"""Extract the Solana token contract address from this crypto caller message. 
If there's no Solana contract address, respond with just "NONE".
If you find one, respond with ONLY the contract address (32-44 character base58 string), nothing else.

Message:
{text[:500]}"""

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                DEEPSEEK_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
                json={
                    "model": "deepseek-chat",
                    "max_tokens": 60,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            if resp.status_code == 200:
                result = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if result and result != "NONE" and len(result) >= 32 and len(result) <= 44:
                    # Validate it looks like a base58 address
                    if SOLANA_ADDRESS_RE.match(result):
                        return result
    except Exception as e:
        logger.warning(f"[SHITCOIN] AI extraction error: {e}")
    
    return None

# In-memory dedup cache (persists during runtime, resets on deploy)
_processed_contracts: set[str] = set()
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
    """Process a newly detected token: check rug, get market data, save to DB."""
    from core.models import ShitcoinDetection
    from sqlalchemy import select as sa_select
    
    _log(f"New token detected from @{caller_channel}: {contract[:12]}...")
    
    # Check if already processed (in-memory fast check)
    if contract in _processed_contracts:
        return None
    _processed_contracts.add(contract)
    
    # Check DB for existing
    async_session = get_async_session()
    async with async_session() as session:
        existing = await session.execute(
            sa_select(ShitcoinDetection).where(ShitcoinDetection.contract == contract)
        )
        if existing.scalars().first():
            _log(f"Already in DB: {contract[:12]}...")
            return None
    
    # Parallel checks with timeout protection
    try:
        rug_task = check_rugcheck(contract)
        dex_task = check_dexscreener(contract)
        rug_result, dex_result = await asyncio.wait_for(
            asyncio.gather(rug_task, dex_task),
            timeout=20
        )
    except asyncio.TimeoutError:
        _log(f"{contract[:12]}... timeout on RugCheck/Dexscreener, skipping")
        return None
    except Exception as e:
        _log(f"{contract[:12]}... error in checks: {e}")
        return None
    
    # Skip if Dexscreener found nothing
    if not dex_result or not dex_result.get("price_usd"):
        _log(f"{contract[:12]}... not found on Dexscreener, skipping")
        return None
    
    # Determine safety
    lp_locked = rug_result.get("lp_locked_pct", 0)
    creator_pct = rug_result.get("creator_pct", 0)
    is_safe = rug_result.get("is_safe")
    
    if is_safe is True and lp_locked >= 95 and creator_pct < 5:
        safety = "SAFE"
    elif lp_locked < 50 or creator_pct > 20:
        safety = "DANGER"
    else:
        safety = "CAUTION"
    
    price_at_call = dex_result.get("price_usd", 0)
    
    # Save to DB
    async with async_session() as session:
        detection = ShitcoinDetection(
            contract=contract,
            symbol=dex_result.get("symbol", "???"),
            name=dex_result.get("name", "Unknown"),
            caller=caller_channel,
            message=message_text[:300],
            price_at_call=price_at_call,
            mcap_at_call=dex_result.get("market_cap", 0),
            liquidity_usd=dex_result.get("liquidity_usd", 0),
            rug_score=rug_result.get("score", 0),
            lp_locked_pct=lp_locked,
            creator_pct=creator_pct,
            safety=safety,
            dexscreener_url=dex_result.get("dexscreener_url", ""),
            website=dex_result.get("website", ""),
            twitter=dex_result.get("twitter", ""),
            telegram_link=dex_result.get("telegram", ""),
            peak_price=price_at_call,
            peak_change=0,
            current_price=price_at_call,
            current_change=0,
            price_history_json=json.dumps([{
                "time": datetime.utcnow().isoformat() + "Z",
                "price": price_at_call,
                "change_from_call": 0,
                "mcap": dex_result.get("market_cap", 0),
            }]),
        )
        session.add(detection)
        await session.commit()
    
    logger.info(
        f"[SHITCOIN] {dex_result.get('symbol', '???')} | "
        f"Safety: {safety} | MCap: ${dex_result.get('market_cap', 0):,.0f} | "
        f"LP: {lp_locked:.0f}% | Creator: {creator_pct:.1f}%"
    )
    return {"contract": contract, "symbol": dex_result.get("symbol"), "safety": safety}


async def update_price_tracking():
    """Update prices for all active tokens in DB (runs every 5 min)."""
    from core.models import ShitcoinDetection
    from sqlalchemy import select as sa_select
    
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            sa_select(ShitcoinDetection)
            .where(ShitcoinDetection.status == "active")
            .order_by(ShitcoinDetection.detected_at.desc())
        )
        tokens = result.scalars().all()
        
        if not tokens:
            return
        
        for token in tokens:
            dex_data = await check_dexscreener(token.contract)
            
            if dex_data and dex_data.get("price_usd"):
                current_price = dex_data["price_usd"]
                call_price = token.price_at_call or 0
                
                change_pct = 0
                if call_price > 0:
                    change_pct = ((current_price - call_price) / call_price) * 100
                
                # Update price history
                history = json.loads(token.price_history_json or "[]")
                history.append({
                    "time": datetime.utcnow().isoformat() + "Z",
                    "price": current_price,
                    "change_from_call": round(change_pct, 2),
                    "mcap": dex_data.get("market_cap", 0),
                })
                token.price_history_json = json.dumps(history)
                
                # Update current/peak
                token.current_price = current_price
                token.current_change = round(change_pct, 2)
                if current_price > token.peak_price:
                    token.peak_price = current_price
                    token.peak_change = round(change_pct, 2)
                
                # Update safety status based on performance
                if change_pct >= 50:
                    # Send email alert if this is the FIRST time crossing +50%
                    if token.safety != "PUMPING":
                        asyncio.create_task(_send_pump_alert(token, change_pct, dex_data))
                    token.safety = "PUMPING"
                elif change_pct <= -80:
                    token.status = "rugged"
                elif change_pct <= -95:
                    token.status = "dead"
            
            await asyncio.sleep(0.5)
        
        await session.commit()
        _log(f"Updated prices for {len(tokens)} tokens")


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
    _log(f"Starting monitor for {len(CALLER_CHANNELS)} channels...")
    
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
        
        _log(f"MSG from @{sender}: {text[:80]}...")
        
        # Find Solana addresses in message
        addresses = SOLANA_ADDRESS_RE.findall(text)
        # Deduplicate
        addresses = list(dict.fromkeys(addr for addr in addresses if 32 <= len(addr) <= 44))
        
        if addresses:
            _log(f"REGEX found {len(addresses)} addresses from @{sender}: {[a[:8] for a in addresses]}")
            for addr in addresses:
                try:
                    await asyncio.wait_for(process_new_token(addr, sender, text), timeout=30)
                except asyncio.TimeoutError:
                    _log(f"TIMEOUT processing {addr[:12]}... (30s)")
                except Exception as e:
                    _log(f"ERROR processing {addr[:12]}: {e}")
        else:
            _log(f"No regex match from @{sender}, trying AI...")
            # No address found by regex — ask AI to extract
            extracted = await _extract_token_with_ai(text)
            if extracted:
                _log(f"AI extracted: {extracted} from @{sender}")
                try:
                    await asyncio.wait_for(process_new_token(extracted, sender, text), timeout=30)
                except asyncio.TimeoutError:
                    _log(f"TIMEOUT processing AI-extracted {extracted[:12]}... (30s)")
                except Exception as e:
                    _log(f"ERROR processing AI-extracted {extracted[:12]}: {e}")
            else:
                _log(f"No contract found from @{sender} (regex=0, AI=none)")
    
    await client.connect()
    if not await client.is_user_authorized():
        _log("ERROR: Telethon not authorized!")
        _monitor_running = False
        return
    
    _log("Monitor connected! Loading dialogs to cache channels...")
    
    # Load dialogs — this caches all channel entities for event handling
    try:
        dialogs = await client.get_dialogs()
        _log(f"Loaded {len(dialogs)} dialogs. Channels should be cached now.")
    except Exception as e:
        _log(f"WARN: get_dialogs failed: {e}")
    
    _log("Listening for new messages...")
    
    # Start price tracking loop
    async def price_loop():
        while _monitor_running:
            try:
                await update_price_tracking()
            except Exception as e:
                _log(f"ERROR price tracking: {e}")
            await asyncio.sleep(300)  # Every 5 minutes
    
    asyncio.create_task(price_loop())
    
    # Keep running
    await client.run_until_disconnected()


def get_detected_tokens() -> list[dict]:
    """Get all detected tokens from DB (sync wrapper for API endpoint)."""
    # This is called from sync context in main.py — return empty, 
    # actual data served via async endpoint
    return []


async def get_detected_tokens_async() -> list[dict]:
    """Get detected tokens from DB."""
    from core.models import ShitcoinDetection
    from sqlalchemy import select as sa_select
    
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            sa_select(ShitcoinDetection)
            .order_by(ShitcoinDetection.detected_at.desc())
        )
        tokens = result.scalars().all()
        
        return [{
            "contract": t.contract,
            "symbol": t.symbol,
            "name": t.name,
            "caller": t.caller,
            "detected_at": t.detected_at.isoformat() + "Z" if t.detected_at else None,
            "price_at_call": t.price_at_call,
            "mcap_at_call": t.mcap_at_call,
            "liquidity_usd": t.liquidity_usd,
            "safety": t.safety,
            "rug_score": t.rug_score,
            "lp_locked_pct": t.lp_locked_pct,
            "creator_pct": t.creator_pct,
            "current_price": t.current_price,
            "current_change": t.current_change,
            "peak_price": t.peak_price,
            "peak_change": t.peak_change,
            "status": t.status,
            "dexscreener_url": t.dexscreener_url,
            "website": t.website,
            "twitter": t.twitter,
            "telegram": t.telegram_link,
            "price_history": json.loads(t.price_history_json or "[]"),
        } for t in tokens]


def is_monitor_running() -> bool:
    """Check if monitor is running."""
    return _monitor_running
