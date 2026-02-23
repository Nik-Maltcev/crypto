import { CMCCoinData } from '../types';
import { CMC_API_KEY } from '../constants';

const PROXY_URL = 'https://api.allorigins.win/raw?url=';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';

const TARGET_SYMBOLS = ['BTC', 'ETH', 'XRP', 'SOL', 'BNB', 'DOGE', 'ADA', 'AVAX'];

export const fetchCryptoMarketData = async (): Promise<{ summary: string; coinMap: Map<string, CMCCoinData> }> => {
  try {
    // IMPORTANT: We pass the API Key as a query parameter (CMC_PRO_API_KEY) instead of a header.
    // Public CORS proxies often strip custom headers like X-CMC_PRO_API_KEY, causing 401/403 errors or fetch failures.
    const targetUrl = `${CMC_BASE_URL}?start=1&limit=100&convert=USD&CMC_PRO_API_KEY=${CMC_API_KEY}`;

    // We encode the target URL to ensure it's passed correctly through the proxy
    const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
        // Header removed: Key is now in URL
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      throw new Error(`CMC API Error: ${response.status} - ${errorText}`);
    }

    const json = await response.json();

    if (!json || !json.data) {
      throw new Error("Invalid Data Structure from CMC");
    }

    const data: CMCCoinData[] = json.data;

    const coinMap = new Map<string, CMCCoinData>();
    let summaryText = "MARKET CONTEXT (Key Assets):\n";

    data.forEach((coin) => {
      // Store ALL in map for lookup
      coinMap.set(coin.symbol.toUpperCase(), coin);

      // But only add relevant ones to the context string sent to AI
      if (TARGET_SYMBOLS.includes(coin.symbol.toUpperCase()) || coin.quote.USD.market_cap > 50000000000) {
        const price = coin.quote.USD.price < 1 ? coin.quote.USD.price.toFixed(4) : coin.quote.USD.price.toFixed(2);
        const change24h = coin.quote.USD.percent_change_24h.toFixed(1);
        const change7d = coin.quote.USD.percent_change_7d.toFixed(1);
        summaryText += `${coin.symbol}: $${price} (24h: ${change24h}%, 7d: ${change7d}%)\n`;
      }
    });

    return { summary: summaryText, coinMap };

  } catch (error) {
    console.error("Failed to fetch CoinMarketCap data:", error);
    // Return empty data instead of throwing, so the app can continue with just Reddit data
    return { summary: "MARKET CONTEXT: Real-time data unavailable (API Error).", coinMap: new Map() };
  }
};

/**
 * Fetch detailed, real-time data for a specific single coin.
 * Uses the /v1/cryptocurrency/quotes/latest endpoint, which works for any valid symbol
 * rather than just relying on the top 100 listings.
 */
export const fetchSpecificCoinData = async (symbol: string): Promise<CMCCoinData | null> => {
  try {
    const cleanSymbol = symbol.trim().toUpperCase();
    const targetUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cleanSymbol}&convert=USD&CMC_PRO_API_KEY=${CMC_API_KEY}`;
    const url = `${PROXY_URL}${encodeURIComponent(targetUrl)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();

    if (json?.data && json.data[cleanSymbol]) {
      const coinData: CMCCoinData = json.data[cleanSymbol];
      return coinData;
    }

    // Try array format if different
    if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
      return json.data[0] as CMCCoinData;
    }

    return null;
  } catch (error) {
    console.warn(`Failed to fetch specific CMC data for ${symbol}:`, error);
    return null;
  }
};