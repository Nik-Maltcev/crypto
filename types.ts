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

export interface CryptoAnalysis {
  symbol: string;
  name: string;
  sentimentScore: number; // 0 to 100
  prediction: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number; // 0 to 100
  reasoning: string;
  sources: string[]; // URLs of reddit threads used
  pricePrediction24h: string; // Text description of expected movement (Changed from 7Days)
  targetPriceRange: string; // Estimated price range for next 24h (Standard)
  precisePriceRange: string; // New field: Minimal/Sniper price range for next 24h
  
  // Real-time Market Data (Optional, merged from CMC)
  currentPrice?: number;
  change24h?: number;
  change7d?: number;
  volume24h?: number;
  marketCap?: number;
}

export interface AnalysisResponse {
  coins: CryptoAnalysis[];
  marketSummary: string;
}

export interface DeepAnalysisResult {
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
  }
}

// Telegram types
export interface TelegramMessage {
  chat: string;
  chat_title: string;
  message_id: number;
  date: string;
  text: string;
  sender_name: string | null;
  sender_username: string | null;
}

export interface TelegramExportResponse {
  success: boolean;
  parsed_at: string;
  chats_count: number;
  messages_count: number;
  data: {
    parsed_at: string;
    parse_days: number;
    chats_count: number;
    messages_count: number;
    messages: TelegramMessage[];
  };
}