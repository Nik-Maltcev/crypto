"""Server-side CoinMarketCap API client."""

import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

CMC_BASE_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest"


async def fetch_cmc_data(api_key: str, limit: int = 100) -> dict:
    """Fetch top cryptocurrencies from CoinMarketCap API."""
    
    if not api_key:
        logger.warning("CMC_API_KEY not provided")
        return {"data": [], "error": "API key not configured"}
    
    headers = {
        "X-CMC_PRO_API_KEY": api_key,
        "Accept": "application/json"
    }
    
    params = {
        "start": 1,
        "limit": limit,
        "convert": "USD"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(CMC_BASE_URL, headers=headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            coins = data.get("data", [])
            
            # Build summary for AI analysis
            summary_lines = ["MARKET CONTEXT (Top 100 Coins):"]
            coin_list = []
            
            for coin in coins:
                quote = coin.get("quote", {}).get("USD", {})
                price = quote.get("price", 0)
                change_24h = quote.get("percent_change_24h", 0)
                change_7d = quote.get("percent_change_7d", 0)
                
                summary_lines.append(
                    f"{coin['symbol']}: {price:.2f} (24h: {change_24h:.1f}%, 7d: {change_7d:.1f}%)"
                )
                
                coin_list.append({
                    "id": coin.get("id"),
                    "name": coin.get("name"),
                    "symbol": coin.get("symbol"),
                    "quote": {
                        "USD": {
                            "price": price,
                            "percent_change_24h": change_24h,
                            "percent_change_7d": change_7d,
                            "volume_24h": quote.get("volume_24h", 0),
                            "market_cap": quote.get("market_cap", 0)
                        }
                    }
                })
            
            return {
                "success": True,
                "summary": "\n".join(summary_lines),
                "data": coin_list,
                "count": len(coin_list)
            }
            
        except httpx.HTTPStatusError as e:
            logger.error(f"CMC API error: {e.response.status_code}")
            return {"success": False, "error": f"API error: {e.response.status_code}", "data": []}
        except Exception as e:
            logger.error(f"CMC fetch failed: {e}")
            return {"success": False, "error": str(e), "data": []}
