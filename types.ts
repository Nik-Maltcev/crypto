
export interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  score: number;
  num_comments: number;
  subreddit: string;
  created_utc: number;
}

export interface Tweet {
  text: string;
  created_at: string;
  likes: number;
  retweets?: number;
  views?: number;
  user: string;
}

export interface TwitterUserMap {
  username: string;
  url: string;
  id: string;
  status: 'success' | 'error';
}

export interface HourlyForecastPoint {
  hourOffset: number; // 1 to 24
  price: number;
  change: number; // percentage change relative to current price
}

export interface CryptoAnalysis {
  symbol: string;
  name: string;
  sentimentScore: number; // 0 to 100
  prediction: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number; // 0 to 100
  reasoning: string;
  sources: string[]; // URLs of reddit threads used

  // Single Target Forecast (Simple Mode 24h)
  targetPrice24h?: number;
  targetChange24h?: number;

  // Generic Target Forecast (Specific Time Mode)
  targetPrice?: number;
  targetChange?: number;

  // Detailed Forecast (Hourly Mode)
  hourlyForecast?: HourlyForecastPoint[];

  // Real-time Market Data (Optional, merged from CMC)
  currentPrice?: number;
  change24h?: number;
  change7d?: number;
  volume24h?: number;
  marketCap?: number;
}

// New Interface for Altcoin Mode
export interface AltcoinGem {
  symbol: string;
  name: string;
  potential7d: string; // e.g. "+15%", "2x"
  risk: 'Medium' | 'High' | 'Degen';
  score: number; // 0-100 hype score
  why: string; // Reasoning extracted from text
}

// Combined Interface: Contains both per-coin stats AND global strategy
export interface CombinedAnalysisResponse {
  marketSummary: string;
  forecastLabel?: string; // e.g. "Прогноз (24ч)" or "Прогноз (20:00 МСК)"

  // Standard Modes
  coins?: CryptoAnalysis[];

  // Altcoin Mode
  altcoins?: AltcoinGem[];

  // Deep Analysis Fields
  strategy: string; // Detailed text strategy
  topPick: string; // Best asset symbol
  riskLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
  technicalVerdict: string; // Assessment of price action vs sentiment
}

export interface SubredditOption {
  name: string;
  url: string;
  category: 'General' | 'Trading' | 'Meme' | 'Tech' | 'Specific';
}

export interface TwitterAccountOption {
  username: string;
  id: string;
  url: string;
}

export interface CMCCoinData {
  id: number;
  name: string;
  symbol: string;
  quote: {
    USD: {
      price: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      volume_24h: number;
      market_cap: number;
    }
  };
}

export interface TelegramMessage {
  chat: string;
  chat_title: string;
  message_id: number;
  date: string;
  text: string;
  sender_name?: string;
  sender_username?: string;
}

export interface TelegramExportResponse {
  success: boolean;
  parsed_at: string;
  chats_count: number;
  messages_count: number;
  data: {
    messages: TelegramMessage[];
  };
}

export interface ChatFilterResult {
  chatTitle: string;
  isSpam: boolean;
  category: 'Spam' | 'Scam' | 'Flood' | 'Useful' | 'News' | 'Signals';
  reason: string;
}

