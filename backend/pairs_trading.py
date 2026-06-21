"""
Pairs Trading Alert Bot.
Monitors z-score divergences for top correlated crypto pairs.
Sends email alert when entry/exit signals fire.
"""
import os
import httpx
import asyncio
from datetime import datetime, timezone
from core.config import get_settings

# Top 5 pairs by backtest PNL (correlation > 0.80, winrate > 65%)
PAIRS = [
    {"a": "ripple", "b": "dogecoin", "sym_a": "XRP", "sym_b": "DOGE", "corr": 0.81},
    {"a": "dogecoin", "b": "ethereum-classic", "sym_a": "DOGE", "sym_b": "ETC", "corr": 0.86},
    {"a": "litecoin", "b": "ethereum-classic", "sym_a": "LTC", "sym_b": "ETC", "corr": 0.82},
    {"a": "shiba-inu", "b": "polkadot", "sym_a": "SHIB", "sym_b": "DOT", "corr": 0.83},
    {"a": "dogecoin", "b": "avalanche-2", "sym_a": "DOGE", "sym_b": "AVAX", "corr": 0.82},
]

# Strategy parameters (from backtest: z=1.0, window=20, timeout=14)
ZSCORE_ENTRY = 1.0
ZSCORE_EXIT = 0.0
WINDOW = 20  # days for rolling mean/std
ALERT_EMAIL = "nikmaltcev98@gmail.com"

# In-memory state
_active_positions: dict = {}  # pair_key -> {direction, entry_date, entry_zscore}


async def fetch_prices(coin_id: str, days: int = 25) -> list[float]:
    """Fetch daily prices from CoinGecko."""
    url = f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart"
    params = {"vs_currency": "usd", "days": days, "interval": "daily"}
    
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            return []
        data = resp.json()
        return [p[1] for p in data.get("prices", [])]


def calculate_zscore(prices_a: list[float], prices_b: list[float]) -> float | None:
    """Calculate current z-score of the spread."""
    n = min(len(prices_a), len(prices_b))
    if n < WINDOW + 1:
        return None
    
    # Normalize to start at 1.0
    norm_a = [p / prices_a[0] for p in prices_a[:n]]
    norm_b = [p / prices_b[0] for p in prices_b[:n]]
    
    # Spread = ratio
    spread = [norm_a[i] / norm_b[i] for i in range(n)]
    
    # Rolling stats from last WINDOW points (excluding current)
    window_data = spread[-(WINDOW+1):-1]
    mean = sum(window_data) / len(window_data)
    std = (sum((x - mean)**2 for x in window_data) / len(window_data)) ** 0.5
    
    if std == 0:
        return None
    
    current = spread[-1]
    return (current - mean) / std


async def send_pairs_alert(subject: str, body: str):
    """Send email alert for pairs trading signal."""
    settings = get_settings()
    resend_key = settings.RESEND_API_KEY
    from_email = settings.RESEND_FROM_EMAIL or "alerts@dexflow.xyz"
    
    if not resend_key:
        print(f"[PAIRS] No RESEND_API_KEY, skipping alert: {subject}")
        return
    
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {resend_key}", "Content-Type": "application/json"},
            json={
                "from": from_email,
                "to": [ALERT_EMAIL],
                "subject": subject,
                "text": body,
            },
        )
        if resp.status_code in (200, 201):
            print(f"[PAIRS] Alert sent: {subject}")
        else:
            print(f"[PAIRS] Email failed: {resp.status_code}")


async def check_pairs():
    """Main function: check all pairs for signals."""
    global _active_positions
    
    print(f"[PAIRS] Checking {len(PAIRS)} pairs at {datetime.now(timezone.utc).isoformat()}")
    
    for pair in PAIRS:
        pair_key = f"{pair['sym_a']}/{pair['sym_b']}"
        
        try:
            prices_a = await fetch_prices(pair["a"], days=25)
            prices_b = await fetch_prices(pair["b"], days=25)
            
            if not prices_a or not prices_b:
                print(f"[PAIRS] {pair_key}: failed to fetch prices")
                continue
            
            zscore = calculate_zscore(prices_a, prices_b)
            if zscore is None:
                continue
            
            print(f"[PAIRS] {pair_key}: z-score = {zscore:.2f}")
            
            # Check for ENTRY signal
            if pair_key not in _active_positions:
                if zscore > ZSCORE_ENTRY:
                    # A outperformed B -> Short A, Long B
                    _active_positions[pair_key] = {
                        "direction": "short_a_long_b",
                        "entry_date": datetime.now(timezone.utc).isoformat(),
                        "entry_zscore": zscore,
                    }
                    
                    subject = f"📊 PAIRS ENTRY: Short {pair['sym_a']} / Long {pair['sym_b']}"
                    body = (
                        f"📊 PAIRS TRADING SIGNAL\n\n"
                        f"Pair: {pair_key} (corr: {pair['corr']})\n"
                        f"Z-score: {zscore:.2f} (threshold: {ZSCORE_ENTRY})\n\n"
                        f"ACTION:\n"
                        f"  🔴 SHORT {pair['sym_a']} (overbought vs pair)\n"
                        f"  🟢 LONG {pair['sym_b']} (undervalued vs pair)\n\n"
                        f"Exit when z-score returns to 0\n"
                        f"Timeout: 14 days max\n"
                        f"Backtest winrate: {75}%\n"
                    )
                    await send_pairs_alert(subject, body)
                
                elif zscore < -ZSCORE_ENTRY:
                    # B outperformed A -> Long A, Short B
                    _active_positions[pair_key] = {
                        "direction": "long_a_short_b",
                        "entry_date": datetime.now(timezone.utc).isoformat(),
                        "entry_zscore": zscore,
                    }
                    
                    subject = f"📊 PAIRS ENTRY: Long {pair['sym_a']} / Short {pair['sym_b']}"
                    body = (
                        f"📊 PAIRS TRADING SIGNAL\n\n"
                        f"Pair: {pair_key} (corr: {pair['corr']})\n"
                        f"Z-score: {zscore:.2f} (threshold: -{ZSCORE_ENTRY})\n\n"
                        f"ACTION:\n"
                        f"  🟢 LONG {pair['sym_a']} (undervalued vs pair)\n"
                        f"  🔴 SHORT {pair['sym_b']} (overbought vs pair)\n\n"
                        f"Exit when z-score returns to 0\n"
                        f"Timeout: 14 days max\n"
                        f"Backtest winrate: {75}%\n"
                    )
                    await send_pairs_alert(subject, body)
            
            # Check for EXIT signal
            else:
                pos = _active_positions[pair_key]
                should_exit = False
                reason = ""
                
                if pos["direction"] == "short_a_long_b" and zscore <= ZSCORE_EXIT:
                    should_exit = True
                    reason = "Z-score returned to 0 (mean reversion complete)"
                elif pos["direction"] == "long_a_short_b" and zscore >= -ZSCORE_EXIT:
                    should_exit = True
                    reason = "Z-score returned to 0 (mean reversion complete)"
                
                # Timeout check
                entry_dt = datetime.fromisoformat(pos["entry_date"])
                days_held = (datetime.now(timezone.utc) - entry_dt).days
                if days_held >= 14:
                    should_exit = True
                    reason = f"Timeout (held {days_held} days)"
                
                if should_exit:
                    subject = f"📊 PAIRS EXIT: Close {pair_key}"
                    body = (
                        f"📊 PAIRS TRADING — CLOSE POSITION\n\n"
                        f"Pair: {pair_key}\n"
                        f"Direction was: {pos['direction']}\n"
                        f"Entry z-score: {pos['entry_zscore']:.2f}\n"
                        f"Current z-score: {zscore:.2f}\n"
                        f"Days held: {days_held}\n"
                        f"Reason: {reason}\n\n"
                        f"ACTION: Close both legs on MEXC\n"
                    )
                    await send_pairs_alert(subject, body)
                    del _active_positions[pair_key]
        
        except Exception as e:
            print(f"[PAIRS] Error checking {pair_key}: {e}")
        
        # Rate limit CoinGecko
        await asyncio.sleep(7)
    
    print(f"[PAIRS] Done. Active positions: {list(_active_positions.keys())}")


def get_active_positions() -> dict:
    """Return current active positions (for API/dashboard)."""
    return _active_positions
