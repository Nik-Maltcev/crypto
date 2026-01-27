import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RedditPost, AnalysisResponse, DeepAnalysisResult } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    marketSummary: {
      type: Type.STRING,
      description: "Краткое саммари общего настроения рынка на основе постов, 2-3 предложения на русском языке."
    },
    coins: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          symbol: { type: Type.STRING, description: "Ticker symbol e.g., BTC" },
          name: { type: Type.STRING, description: "Full name e.g., Bitcoin" },
          sentimentScore: { type: Type.NUMBER, description: "0-100 score" },
          prediction: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
          confidence: { type: Type.NUMBER, description: "0-100 confidence level in the prediction" },
          reasoning: { type: Type.STRING, description: "Объяснение прогноза на основе постов с Reddit на русском языке." },
          sources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of relevant Reddit URLs from the input." },
          pricePrediction24h: { type: Type.STRING, description: "Качественный текстовый прогноз цены на 24 часа на русском языке." },
          targetPriceRange: { type: Type.STRING, description: "Standard estimated price range for next 24h (e.g. 95k-98k)." },
          precisePriceRange: { type: Type.STRING, description: "Highly specific, minimal spread 'SNIPER' price target for 24h (e.g. 96.5k-96.8k)." }
        },
        required: ["symbol", "name", "sentimentScore", "prediction", "confidence", "reasoning", "pricePrediction24h", "targetPriceRange", "precisePriceRange"]
      }
    }
  },
  required: ["marketSummary", "coins"]
};

const DEEP_ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    strategy: { type: Type.STRING, description: "Detailed trading strategy and analysis (Markdown supported) in Russian." },
    topPick: { type: Type.STRING, description: "The single best asset symbol to watch." },
    riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Extreme"] },
    technicalVerdict: { type: Type.STRING, description: "Technical analysis summary based on price/volume data in Russian." }
  },
  required: ["strategy", "topPick", "riskLevel", "technicalVerdict"]
};

// Initial Flash Analysis
export const analyzeSentiment = async (posts: RedditPost[], marketContext: string): Promise<AnalysisResponse> => {
  if (!posts || posts.length === 0) {
    throw new Error("Нет постов для анализа");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const jsonPayload = JSON.stringify(posts, [
    'subreddit', 'title', 'selftext', 'score', 'url', 'created_utc'
  ]);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
      1. ANALYZE REDDIT POSTS:
      ${jsonPayload}

      2. USE THIS REAL-TIME MARKET DATA FOR CONTEXT/VALIDATION:
      ${marketContext}

      Сделай прогноз по криптовалютам на следующие 24 часа. ОТВЕЧАЙ НА РУССКОМ ЯЗЫКЕ.
      `,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        thinkingConfig: { thinkingBudget: 1024 }, // Enable thinking for better calculations
        temperature: 0.1, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("Пустой ответ от Gemini");

    return JSON.parse(text) as AnalysisResponse;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

// Deep Pro Analysis
export const performDeepAnalysis = async (currentAnalysis: AnalysisResponse): Promise<DeepAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Filter relevant data to send to Pro model
  const marketDataForAi = currentAnalysis.coins.map(c => ({
    symbol: c.symbol,
    price: c.currentPrice,
    change24h: c.change24h,
    change7d: c.change7d,
    volume: c.volume24h,
    sentiment: c.sentimentScore,
    ai_prediction: c.prediction,
    reddit_reasoning: c.reasoning
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using the more powerful model
      contents: `
      PERFORM A DEEP DIVE "HEDGE FUND MANAGER" STYLE ANALYSIS.
      
      INPUT DATA (Sentiment + Market Data):
      ${JSON.stringify(marketDataForAi, null, 2)}

      MARKET SUMMARY:
      ${currentAnalysis.marketSummary}

      TASK:
      1. Synthesize the Reddit sentiment with the hard numbers (Price, Volume, % Change).
      2. Identify discrepancies. (e.g. Is Reddit bullish but price is crashing? Warning sign.)
      3. Look for "High Conviction" plays where Sentiment AND Technicals align.
      4. Provide a professional strategy for the next 24 hours.
      
      Respond in Russian.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: DEEP_ANALYSIS_SCHEMA,
        temperature: 0.2, // Low temperature for analytical precision
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini Pro");

    return JSON.parse(text) as DeepAnalysisResult;

  } catch (error) {
    console.error("Gemini Deep Analysis Error:", error);
    throw error;
  }
};