import { CMCCoinData } from '../types';
import { CMC_API_KEY } from '../constants';

const PROXY_URL = 'https://corsproxy.io/?';
const CMC_BASE_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';

export const fetchCryptoMarketData = async (): Promise<{ summary: string; coinMap: Map<string, CMCCoinData> }> => {
  try {
    const url = `${PROXY_URL}${encodeURIComponent(`${CMC_BASE_URL}?start=1&limit=100&convert=USD`)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-CMC_PRO_API_KEY': CMC_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CMC API Error: ${response.status}`);
    }

    const json = await response.json();
    const data: CMCCoinData[] = json.data;

    const coinMap = new Map<string, CMCCoinData>();
    let summaryText = "MARKET CONTEXT (Top 100 Coins):\n";

    data.forEach((coin) => {
      // Store in map for easy lookup by Symbol (e.g., BTC, ETH)
      coinMap.set(coin.symbol.toUpperCase(), coin);
      
      // Build a concise summary string for Gemini
      const price = coin.quote.USD.price.toFixed(2);
      const change24h = coin.quote.USD.percent_change_24h.toFixed(1);
      const change7d = coin.quote.USD.percent_change_7d.toFixed(1);
      summaryText += `${coin.symbol}: $${price} (24h: ${change24h}%, 7d: ${change7d}%)\n`;
    });

    return { summary: summaryText, coinMap };

  } catch (error) {
    console.error("Failed to fetch CoinMarketCap data:", error);
    // Return empty data on failure so app doesn't crash, just lacks market info
    return { summary: "MARKET CONTEXT: Data Unavailable.", coinMap: new Map() };
  }
};