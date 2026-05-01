"""Forecast Tracker: compares AI hourly predictions with real CoinMarketCap prices.

Flow:
1. When an analysis completes, save_forecast_from_analysis() extracts hourlyForecast
   for BTC/ETH/SOL/XRP and creates ForecastTracking rows.
2. Every hour, update_forecast_tracking_job() fetches real prices from CMC
   and records actual vs predicted, marking hits/misses.
3. After 24 hours, the tracking is marked as completed.
"""

import json
import logging
from datetime import datetime

import httpx
from sqlalchemy import select

from core.config import get_settings
from core.database import get_async_session
from core.models import ForecastTracking, AnalysisLog

logger = logging.getLogger(__name__)

TRACKED_SYMBOLS = ["BTC", "ETH", "SOL", "XRP", "DOGE", "BNB"]
CMC_QUOTES_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"

# Binance symbol mapping (our symbol -> Binance pair)
BINANCE_PAIRS = {
    "BTC": "BTCUSDT",
    "ETH": "ETHUSDT",
    "SOL": "SOLUSDT",
    "XRP": "XRPUSDT",
    "DOGE": "DOGEUSDT",
    "BNB": "BNBUSDT",
}


async def fetch_binance_prices(symbols: list[str]) -> dict[str, float]:
    """Fetch current close prices from Binance for specific symbols."""
    prices = {}
    async with httpx.AsyncClient(timeout=15) as client:
        for sym in symbols:
            pair = BINANCE_PAIRS.get(sym)
            if not pair:
                continue
            try:
                resp = await client.get(
                    f"https://api.binance.com/api/v3/ticker/price?symbol={pair}"
                )
                if resp.status_code == 200:
                    data = resp.json()
                    prices[sym] = float(data.get("price", 0))
            except Exception as e:
                logger.warning(f"[Binance] Failed to fetch {sym}: {e}")
    return prices


async def fetch_cmc_prices(symbols: list[str]) -> dict[str, float]:
    """Fetch current prices for specific symbols from CoinMarketCap."""
    settings = get_settings()
    api_key = settings.CMC_API_KEY
    if not api_key:
        logger.warning("[ForecastTracker] CMC_API_KEY not set")
        return {}

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.get(
                CMC_QUOTES_URL,
                headers={"X-CMC_PRO_API_KEY": api_key, "Accept": "application/json"},
                params={"symbol": ",".join(symbols), "convert": "USD"},
            )
            if resp.status_code != 200:
                logger.error(f"[ForecastTracker] CMC API error: {resp.status_code}")
                return {}
            data = resp.json().get("data", {})
            prices = {}
            for sym in symbols:
                coin = data.get(sym)
                if coin:
                    prices[sym] = coin.get("quote", {}).get("USD", {}).get("price", 0)
            return prices
        except Exception as e:
            logger.error(f"[ForecastTracker] CMC fetch failed: {e}")
            return {}


async def save_forecast_from_analysis(analysis_id: int) -> int:
    """Extract hourly forecasts from a completed analysis and create tracking rows.
    
    Returns number of trackings created.
    """
    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(AnalysisLog).where(AnalysisLog.id == analysis_id)
        )
        log = result.scalar_one_or_none()
        if not log or not log.result_json:
            logger.warning(f"[ForecastTracker] Analysis {analysis_id} not found or no result")
            return 0

        try:
            analysis = json.loads(log.result_json)
        except json.JSONDecodeError:
            logger.error(f"[ForecastTracker] Failed to parse analysis JSON for id={analysis_id}")
            return 0

        coins = analysis.get("coins", [])
        if not coins:
            logger.info("[ForecastTracker] No coins in analysis result")
            return 0

        created = 0
        for coin in coins:
            symbol = coin.get("symbol", "").upper()
            if symbol not in TRACKED_SYMBOLS:
                continue

            hourly = coin.get("hourlyForecast", [])
            if not hourly or len(hourly) < 6:
                logger.info(f"[ForecastTracker] {symbol}: insufficient hourly data ({len(hourly)} points)")
                continue

            current_price = coin.get("currentPrice", 0)
            if not current_price:
                logger.warning(f"[ForecastTracker] {symbol}: no currentPrice, skipping")
                continue

            # Check if tracking already exists for this analysis+symbol
            existing = await session.execute(
                select(ForecastTracking).where(
                    ForecastTracking.analysis_id == analysis_id,
                    ForecastTracking.symbol == symbol,
                )
            )
            if existing.scalar_one_or_none():
                continue

            tracking = ForecastTracking(
                analysis_id=analysis_id,
                symbol=symbol,
                prediction=coin.get("prediction", "Neutral"),
                confidence=coin.get("confidence", 0),
                start_price=current_price,
                target_price_24h=coin.get("targetPrice24h"),
                target_change_24h=coin.get("targetChange24h"),
                hourly_forecast_json=json.dumps(hourly, ensure_ascii=False),
                actual_prices_json="[]",
                binance_prices_json="[]",
                status="active",
            )
            session.add(tracking)
            created += 1
            logger.info(f"[ForecastTracker] Created tracking: {symbol} {coin.get('prediction')} "
                        f"(conf={coin.get('confidence')}%, start=${current_price:.2f})")

        await session.commit()
        return created


async def update_forecast_tracking_job():
    """Hourly job: fetch real CMC prices and compare with AI forecasts."""
    logger.info("=== Starting hourly Forecast Tracking update ===")

    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(ForecastTracking).where(ForecastTracking.status == "active")
        )
        active = result.scalars().all()

        if not active:
            logger.info("[ForecastTracker] No active trackings.")
            return

        # Collect all symbols we need
        symbols = list({t.symbol for t in active})
        prices = await fetch_cmc_prices(symbols)

        if not prices:
            logger.warning("[ForecastTracker] Could not fetch CMC prices, skipping update")
            return

        now = datetime.utcnow()

        for tracking in active:
            real_price = prices.get(tracking.symbol)
            if not real_price:
                logger.warning(f"[ForecastTracker] No price for {tracking.symbol}")
                continue

            hour_index = tracking.hours_tracked  # 0-based
            
            # Load forecast and actual history
            forecast = []
            if tracking.hourly_forecast_json:
                try:
                    forecast = json.loads(tracking.hourly_forecast_json)
                except:
                    forecast = []

            actual = []
            if tracking.actual_prices_json:
                try:
                    actual = json.loads(tracking.actual_prices_json)
                except:
                    actual = []

            # Find predicted price for this hour and previous hour
            predicted_price = None
            predicted_change = None
            prev_predicted_price = None
            if hour_index < len(forecast):
                point = forecast[hour_index]
                predicted_price = point.get("price")
                predicted_change = point.get("change")
            if hour_index > 0 and (hour_index - 1) < len(forecast):
                prev_predicted_price = forecast[hour_index - 1].get("price")

            # Get previous real price (from last actual entry, or start_price for hour 0)
            prev_real_price = tracking.start_price
            if actual:
                prev_real_price = actual[-1].get("real_price", tracking.start_price)

            # Direction matching: compare predicted direction vs actual direction
            # Predicted direction: did AI think price goes up or down from previous hour?
            # Actual direction: did price actually go up or down from previous hour?
            actual_change_from_start = ((real_price - tracking.start_price) / tracking.start_price) * 100

            matched = None
            if predicted_price is not None and prev_real_price is not None:
                # For hour 0: compare with start_price
                # For hour N: compare with previous hour's predicted and real prices
                ref_predicted = prev_predicted_price if prev_predicted_price is not None else tracking.start_price
                
                predicted_direction = predicted_price - ref_predicted  # AI thought: up or down?
                actual_direction = real_price - prev_real_price  # Reality: up or down?

                if predicted_direction > 0 and actual_direction > 0:
                    matched = True   # Both up
                elif predicted_direction < 0 and actual_direction < 0:
                    matched = True   # Both down
                elif predicted_direction == 0 and actual_direction == 0:
                    matched = True   # Both flat
                else:
                    matched = False  # Directions disagree

            actual.append({
                "timestamp": now.isoformat(),
                "hour": hour_index + 1,
                "real_price": round(real_price, 2),
                "predicted_price": round(predicted_price, 2) if predicted_price else None,
                "predicted_change": round(predicted_change, 2) if predicted_change else None,
                "actual_change": round(actual_change_from_start, 2),
                "matched": matched,
            })

            tracking.actual_prices_json = json.dumps(actual)
            tracking.hours_tracked = hour_index + 1
            if matched is True:
                tracking.hits += 1
            elif matched is False:
                tracking.misses += 1

            status_icon = "✅" if matched else "❌" if matched is False else "➖"
            pred_dir = "↑" if (predicted_price or 0) > (ref_predicted if 'ref_predicted' in dir() else tracking.start_price) else "↓"
            real_dir = "↑" if real_price > prev_real_price else "↓"
            logger.info(
                f"[ForecastTracker] {tracking.symbol} h{hour_index+1}: "
                f"real=${real_price:.2f} pred=${predicted_price or 0:.2f} "
                f"pred_dir={pred_dir} real_dir={real_dir} "
                f"{status_icon} ({tracking.hits}/{tracking.hours_tracked})"
            )

            # Complete after 24 hours
            if tracking.hours_tracked >= 24:
                tracking.status = "completed"
                tracking.completed_at = now
                logger.info(
                    f"[ForecastTracker] {tracking.symbol} COMPLETED: "
                    f"{tracking.hits}/24 hits ({tracking.hits/24*100:.0f}% accuracy)"
                )

        await session.commit()
    logger.info("=== Finished Forecast Tracking update ===")


async def update_binance_tracking():
    """Fetch Binance close prices and save alongside CMC data for active trackings."""
    logger.info("[Binance] Fetching prices for active trackings...")

    async_session = get_async_session()
    async with async_session() as session:
        result = await session.execute(
            select(ForecastTracking).where(ForecastTracking.status == "active")
        )
        active = result.scalars().all()

        if not active:
            return

        symbols = list({t.symbol for t in active})
        binance_prices = await fetch_binance_prices(symbols)

        if not binance_prices:
            logger.warning("[Binance] Could not fetch prices")
            return

        now = datetime.utcnow()

        for tracking in active:
            b_price = binance_prices.get(tracking.symbol)
            if not b_price:
                continue

            hour_index = tracking.hours_tracked  # same hour as CMC

            forecast = []
            if tracking.hourly_forecast_json:
                try:
                    forecast = json.loads(tracking.hourly_forecast_json)
                except:
                    forecast = []

            binance_data = []
            if tracking.binance_prices_json:
                try:
                    binance_data = json.loads(tracking.binance_prices_json)
                except:
                    binance_data = []

            predicted_price = None
            if hour_index > 0 and (hour_index - 1) < len(forecast):
                predicted_price = forecast[hour_index - 1].get("price")

            # Direction matching (same logic as CMC)
            prev_b_price = tracking.start_price
            if binance_data:
                prev_b_price = binance_data[-1].get("close_price", tracking.start_price)

            prev_predicted = tracking.start_price
            if hour_index > 1 and (hour_index - 2) < len(forecast):
                prev_predicted = forecast[hour_index - 2].get("price", tracking.start_price)

            matched = None
            if predicted_price is not None:
                pred_dir = predicted_price - prev_predicted
                real_dir = b_price - prev_b_price
                if pred_dir > 0 and real_dir > 0:
                    matched = True
                elif pred_dir < 0 and real_dir < 0:
                    matched = True
                elif pred_dir == 0 and real_dir == 0:
                    matched = True
                else:
                    matched = False

            binance_data.append({
                "timestamp": now.isoformat(),
                "hour": hour_index,
                "close_price": round(b_price, 3),
                "predicted_price": round(predicted_price, 3) if predicted_price else None,
                "matched": matched,
            })

            tracking.binance_prices_json = json.dumps(binance_data)
            logger.info(f"[Binance] {tracking.symbol} h{hour_index}: close=${b_price:.3f}")

        await session.commit()
    logger.info("[Binance] Done.")
