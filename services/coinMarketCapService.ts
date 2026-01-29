import { CMCCoinData } from '../types';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'https://skillful-recreation-production.up.railway.app';

export const fetchCryptoMarketData = async (): Promise<{ summary: string; coinMap: Map<string, CMCCoinData> }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/cmc/data`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`CMC API Error: ${response.status}`);
    }

    const json = await response.json();
    
    if (!json.success) {
      console.warn("CMC data unavailable:", json.error);
      return { summary: "MARKET CONTEXT: Data Unavailable.", coinMap: new Map() };
    }

    const data: CMCCoinData[] = json.data;
    const coinMap = new Map<string, CMCCoinData>();

    data.forEach((coin) => {
      coinMap.set(coin.symbol.toUpperCase(), coin);
    });

    return { summary: json.summary, coinMap };

  } catch (error) {
    console.error("Failed to fetch CoinMarketCap data:", error);
    return { summary: "MARKET CONTEXT: Data Unavailable.", coinMap: new Map() };
  }
};
