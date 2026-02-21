import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RedditPost, CombinedAnalysisResponse, Tweet, TelegramMessage, ChatFilterResult } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

// --- SCHEMA 1: SIMPLE (Single Target 24h) ---
const SIMPLE_COIN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    sentimentScore: { type: Type.NUMBER },
    prediction: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
    confidence: { type: Type.NUMBER },
    reasoning: { type: Type.STRING, description: "Анализ (1-2 предложения). На русском." },
    targetPrice24h: { type: Type.NUMBER, description: "Predicted price in exactly 24 hours." },
    targetChange24h: { type: Type.NUMBER, description: "Predicted % change in exactly 24 hours." }
  },
  required: ["symbol", "name", "sentimentScore", "prediction", "confidence", "reasoning", "targetPrice24h", "targetChange24h"]
};

// --- SCHEMA 2: TARGET (Specific Time, e.g. 20:00 MSK) ---
const TARGET_COIN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    sentimentScore: { type: Type.NUMBER },
    prediction: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
    confidence: { type: Type.NUMBER },
    reasoning: { type: Type.STRING, description: "Анализ (1-2 предложения). На русском." },
    targetPrice: { type: Type.NUMBER, description: "Predicted price at the specific target time (e.g. 20:00 MSK)." },
    targetChange: { type: Type.NUMBER, description: "Predicted % change relative to NOW." }
  },
  required: ["symbol", "name", "sentimentScore", "prediction", "confidence", "reasoning", "targetPrice", "targetChange"]
};

// --- SCHEMA 3: DETAILED (Hourly Array) ---
const HOURLY_COIN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    sentimentScore: { type: Type.NUMBER },
    prediction: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
    confidence: { type: Type.NUMBER },
    reasoning: { type: Type.STRING, description: "Анализ (1-2 предложения). На русском." },
    hourlyForecast: {
      type: Type.ARRAY,
      description: "24 data points (hourly) for the next 24h.",
      items: {
        type: Type.OBJECT,
        properties: {
          hourOffset: { type: Type.NUMBER },
          price: { type: Type.NUMBER },
          change: { type: Type.NUMBER }
        }
      }
    }
  },
  required: ["symbol", "name", "sentimentScore", "prediction", "confidence", "reasoning", "hourlyForecast"]
};

// --- SCHEMA 4: ALTCOIN HUNTER ---
const ALTCOIN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    potential7d: { type: Type.STRING, description: "Predicted growth in 7 days (e.g. '+20%', '2x')." },
    risk: { type: Type.STRING, enum: ["Medium", "High", "Degen"] },
    score: { type: Type.NUMBER, description: "Hype score 0-100" },
    why: { type: Type.STRING, description: "Why this coin? Based on reddit discussions." }
  },
  required: ["symbol", "name", "potential7d", "risk", "score", "why"]
};

const createMainSchema = (mode: 'simple' | 'hourly' | 'altcoins' | 'today_20msk'): Schema => {
  const isAltcoin = mode === 'altcoins';

  // Select coin schema based on mode
  let coinItemSchema = SIMPLE_COIN_SCHEMA;
  if (mode === 'hourly') coinItemSchema = HOURLY_COIN_SCHEMA;
  if (mode === 'today_20msk') coinItemSchema = TARGET_COIN_SCHEMA;

  return {
    type: Type.OBJECT,
    properties: {
      marketSummary: {
        type: Type.STRING,
        description: "Краткое саммари рынка (2 предложения на русском)."
      },
      forecastLabel: {
        type: Type.STRING,
        description: "Label for the forecast time (e.g. 'Прогноз (24ч)' or 'Прогноз (20:00 МСК)')."
      },
      strategy: {
        type: Type.STRING,
        description: "Стратегия (markdown, кратко). На русском."
      },
      topPick: {
        type: Type.STRING,
        description: "Тикер лучшего актива."
      },
      riskLevel: {
        type: Type.STRING,
        enum: ["Low", "Medium", "High", "Extreme"]
      },
      technicalVerdict: {
        type: Type.STRING,
        description: "Вердикт (кратко). На русском."
      },
      // Conditionally require coins OR altcoins
      ...(isAltcoin ? {
        altcoins: {
          type: Type.ARRAY,
          items: ALTCOIN_SCHEMA,
          description: "List of 4-6 promising altcoins found in text."
        }
      } : {
        coins: {
          type: Type.ARRAY,
          items: coinItemSchema
        }
      })
    },
    required: ["marketSummary", "forecastLabel", "strategy", "topPick", "riskLevel", "technicalVerdict", isAltcoin ? "altcoins" : "coins"]
  };
};

export const performCombinedAnalysis = async (
  posts: RedditPost[],
  tweets: Tweet[],
  marketContext: string,
  mode: 'simple' | 'hourly' | 'altcoins' | 'today_20msk' = 'simple'
): Promise<CombinedAnalysisResponse> => {
  if (!posts || posts.length === 0) {
    throw new Error("Нет данных для анализа (Reddit пуст).");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Input Data - INCREASED LIMIT from 40 to 300 posts to use Gemini 3 Pro large context
  const redditPayload = JSON.stringify(posts.slice(0, 300).map(p => ({
    title: p.title,
    text: p.selftext ? p.selftext.substring(0, 200) : "", // Slightly more text for altcoin hunting
    subreddit: p.subreddit,
    score: p.score
  })));

  const twitterPayload = tweets.length > 0
    ? JSON.stringify(tweets.slice(0, 50).map(t => ({
      text: t.text.substring(0, 150),
      user: t.user
    })))
    : "No Twitter Data.";

  // Mode-specific prompts
  let modeInstructions = "";
  let task = "";

  // Dynamic Thinking Budget
  // Complex tasks (Hourly, Altcoins) need more reasoning tokens to avoid hallucinations and filter noise
  let thinkingBudget = 2048; // Default for simple tasks

  if (mode === 'simple') {
    task = "Analyze sentiment for BTC, ETH, XRP, SOL.";
    modeInstructions = `
      FORECAST TASK: Provide ONLY ONE target price for exactly 24 hours from now.
      FIELDS: "targetPrice24h" (number), "targetChange24h" (number).
      "forecastLabel": "Прогноз (24ч)"
    `;
    thinkingBudget = 2048;
  } else if (mode === 'hourly') {
    task = "Analyze sentiment for BTC, ETH, XRP, SOL.";
    modeInstructions = `
      FORECAST TASK: Generate a detailed hourly forecast.
      FIELDS: "hourlyForecast" (array of 24 objects).
      "forecastLabel": "Почасовой (24ч)"
    `;
    thinkingBudget = 8192; // Higher budget for complex array generation
  } else if (mode === 'today_20msk') {
    const now = new Date();
    task = `Analyze sentiment for BTC, ETH, XRP, SOL. CURRENT UTC TIME: ${now.toISOString()}.`;
    modeInstructions = `
      FORECAST TASK: Predict price for the UPCOMING 20:00 Moscow Time (UTC+3).
      If current time is before 17:00 UTC, target is TODAY 20:00 MSK (17:00 UTC).
      If current time is past 17:00 UTC, target is TOMORROW 20:00 MSK.
      FIELDS: "targetPrice" (number), "targetChange" (number).
      "forecastLabel": "Прогноз (20:00 МСК)"
    `;
    thinkingBudget = 4096; // Moderate budget for time calculation logic
  } else if (mode === 'altcoins') {
    task = "FIND HIDDEN GEMS / ALTCOINS (Exclude BTC, ETH). Focus on tokens mentioned in r/SatoshiStreetBets, r/CryptoMoonShots, etc.";
    modeInstructions = `
      TASK: Identify 4-6 altcoins/tokens with high potential for the NEXT 7 DAYS.
      IGNORE: BTC, ETH, USDT, USDC.
      LOOK FOR: Coins with high social engagement, upcoming catalysts, or meme hype.
      OUTPUT FIELD: "altcoins" (array).
      "potential7d": Predict growth (e.g. "+30%", "2-3x").
      "risk": Assess risk (Medium/High/Degen).
      "forecastLabel": "Поиск Гемов (7д)"
    `;
    thinkingBudget = 8192; // Higher budget to filter noise from signal in altcoins
  }

  // maxOutputTokens must be sufficient to cover thinking + JSON response
  const maxOutputTokens = thinkingBudget + 4096;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
      CONTEXT: ${marketContext}
      REDDIT DATA: ${redditPayload}
      TWITTER DATA: ${twitterPayload}

      TASK: ${task}
      OUTPUT: JSON matching schema.
      
      ${modeInstructions}
      
      RULES: Russian language for text. Extremely concise.
      `,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: createMainSchema(mode),
        // Enable Reasoning (Thinking)
        thinkingConfig: { thinkingBudget },
        maxOutputTokens: maxOutputTokens,
        temperature: mode === 'altcoins' ? 0.4 : 0.2,
      }
    });

    let text = response.text || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!text) throw new Error("Empty response from AI");

    return JSON.parse(text) as CombinedAnalysisResponse;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Ошибка обработки данных AI. Попробуйте снова.");
    }
    throw error;
  }
};

// --- CHAT FILTER SCHEMA ---
const CHAT_FILTER_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      description: "List of analyzed chats",
      items: {
        type: Type.OBJECT,
        properties: {
          chatTitle: { type: Type.STRING },
          isSpam: { type: Type.BOOLEAN, description: "True if chat is flood, spam, scam, or unhelpful." },
          category: { type: Type.STRING, enum: ["Spam", "Scam", "Flood", "Useful", "News", "Signals"] },
          reason: { type: Type.STRING, description: "One sentence reason in Russian." }
        },
        required: ["chatTitle", "isSpam", "category", "reason"]
      }
    }
  },
  required: ["results"]
};

// Функция для анализа списка Telegram чатов на спам и полезность
export const filterTelegramChats = async (
  chatData: Record<string, TelegramMessage[]>
): Promise<ChatFilterResult[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Format the chat data into a dense context
  let contextText = "TELEGRAM CHATS HISTORY FOR ANALYSIS:\n\n";
  Object.entries(chatData).forEach(([title, messages]) => {
    contextText += `--- CHAT: ${title} ---\n`;
    if (messages.length === 0) {
      contextText += "(No messages found)\n";
      return;
    }
    // Take up to 50 recent messages per chat to give AI enough context without overflowing
    messages.slice(0, 50).forEach(msg => {
      const sender = msg.sender_name || msg.sender_username || "User";
      contextText += `[${msg.date}] ${sender}: ${msg.text.substring(0, 150)}\n`;
    });
    contextText += "\n";
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `
      CONTEXT: ${contextText}

      TASK: You are an expert crypto community moderator. Analyze the provided message histories of several Telegram chats.
      For each chat, determine if it is "Spam", "Scam", "Flood" (unhelpful noise), or "Useful" / "News" / "Signals" (valuable crypto content).
      
      RULES:
      - isSpam must be true if the chat consists mainly of airdrop links, bot commands, meaningless noise, or scams.
      - Reason must be concise and in Russian language.

      OUTPUT: JSON matching the schema containing all given chats.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: CHAT_FILTER_SCHEMA,
        temperature: 0.1,
      }
    });

    let text = response.text || "";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    if (!text) throw new Error("Empty response from AI");

    const parsed = JSON.parse(text) as { results: ChatFilterResult[] };
    return parsed.results || [];
  } catch (error) {
    console.error("Gemini Chat Filter Error:", error);
    throw new Error("Ошибка при оценке чатов AI.");
  }
};