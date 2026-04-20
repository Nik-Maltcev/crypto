import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RedditPost, CombinedAnalysisResponse, Tweet, TelegramMessage, ChatFilterResult } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

// Route Gemini requests through backend proxy to bypass geo-restrictions
const createGeminiClient = () => new GoogleGenAI({
  apiKey: process.env.API_KEY,
  httpOptions: { baseUrl: `${BACKEND_URL}/api/proxy/gemini` },
});

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
    targetChange24h: { type: Type.NUMBER, description: "Predicted % change in exactly 24 hours." },
    hourlyForecast: {
      type: Type.ARRAY,
      description: "24 data points (hourly) for the next 24h.",
      items: {
        type: Type.OBJECT,
        properties: {
          hourOffset: { type: Type.NUMBER },
          price: { type: Type.NUMBER },
          change: { type: Type.NUMBER },
          confidence: { type: Type.NUMBER }
        }
      }
    }
  },
  required: ["symbol", "name", "sentimentScore", "prediction", "confidence", "reasoning", "targetPrice24h", "targetChange24h", "hourlyForecast"]
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
          change: { type: Type.NUMBER },
          confidence: { type: Type.NUMBER }
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

// --- SCHEMA 5: SINGLE COIN ANALYSIS ---
const SINGLE_COIN_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    currentSituation: { type: Type.STRING, description: "Текущая ситуация по монете (на основе API и соцсетей)." },
    forecast: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
    detail: { type: Type.STRING, description: "Развернутое аналитическое мнение (жестко и по существу). Пиши уверенно и объективно, без воды и слов вроде 'возможно' или 'кажется', опираясь только на переданные цифры и настроения. Если данных в соцсетях за 3 дня нет или мало, явно начать с 'Обсуждают мало/недостаточно данных'." },
    hasEnoughData: { type: Type.BOOLEAN, description: "True если есть хотя бы несколько постов/твитов по монете, False если упоминаний почти нет." }
  },
  required: ["currentSituation", "forecast", "detail", "hasEnoughData"]
};

// --- SCHEMA 6: TRADING RECOMMENDATIONS ---
const TRADING_ITEM_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    direction: { type: Type.STRING, enum: ["LONG", "SHORT"] },
    confidence: { type: Type.NUMBER, description: "0-100 confidence in this trade" },
    reasoning: { type: Type.STRING, description: "Обоснование сделки (Russian)" },
    currentPrice: { type: Type.NUMBER },
    leverage: { type: Type.NUMBER, description: "Recommended leverage (2-10)" },
    entryPrice: { type: Type.NUMBER },
    takeProfit: { type: Type.NUMBER },
    stopLoss: { type: Type.NUMBER },
    positionSizeUSDT: { type: Type.NUMBER },
    riskRewardRatio: { type: Type.STRING, description: "e.g. 1:1.5" },
    potentialProfit: { type: Type.STRING, description: "e.g. +3.6%" },
    potentialLoss: { type: Type.STRING, description: "e.g. -4.5%" },
    liquidationPrice: { type: Type.NUMBER },
    warning: { type: Type.STRING, description: "Предупреждение о риске ликвидации (Russian)" }
  },
  required: ["symbol", "name", "direction", "confidence", "reasoning", "currentPrice", "leverage", "entryPrice", "takeProfit", "stopLoss", "positionSizeUSDT", "riskRewardRatio", "potentialProfit", "potentialLoss", "liquidationPrice", "warning"]
};

const createMainSchema = (mode: 'simple' | 'hourly' | 'altcoins' | 'today_20msk' | 'today_24msk' | 'single_coin' | 'trading'): Schema => {
  const isAltcoin = mode === 'altcoins';
  const isSingleCoin = mode === 'single_coin';
  const isTrading = mode === 'trading';

  // Select coin schema based on mode
  let coinItemSchema = SIMPLE_COIN_SCHEMA;
  if (mode === 'hourly') coinItemSchema = HOURLY_COIN_SCHEMA;
  if (mode === 'today_20msk' || mode === 'today_24msk') coinItemSchema = TARGET_COIN_SCHEMA;

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
      // Conditionally require coins OR altcoins OR singleCoin OR trades
      ...(isTrading ? {
        trades: {
          type: Type.ARRAY,
          items: TRADING_ITEM_SCHEMA,
          description: "List of 3-8 trading recommendations with TP/SL."
        }
      } : isSingleCoin ? {
        singleCoin: SINGLE_COIN_SCHEMA
      } : isAltcoin ? {
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
    required: ["marketSummary", "forecastLabel", "strategy", "topPick", "riskLevel", "technicalVerdict", isTrading ? "trades" : (isSingleCoin ? "singleCoin" : (isAltcoin ? "altcoins" : "coins"))]
  };
};

export const performCombinedAnalysis = async (
  posts: RedditPost[],
  tweets: Tweet[],
  telegramMsgs: TelegramMessage[],
  marketContext: string,
  mode: 'simple' | 'hourly' | 'altcoins' | 'today_20msk' | 'today_24msk' | 'single_coin' | 'trading' = 'simple',
  targetCoinSymbol?: string,
  userBalance?: number
): Promise<CombinedAnalysisResponse> => {
  if ((!posts || posts.length === 0) && (!tweets || tweets.length === 0) && (!telegramMsgs || telegramMsgs.length === 0)) {
    throw new Error("Нет данных для анализа ни из одного источника (Reddit, Twitter, Telegram пустые).");
  }

  const ai = createGeminiClient();

  // Input Data - User explicitly requested NO limits for Reddit posts
  const redditPayload = JSON.stringify(posts.map(p => ({
    title: p.title,
    text: p.selftext ? p.selftext.substring(0, 500) : "",
    subreddit: p.subreddit,
    score: p.score
  })));

  const twitterPayload = tweets.length > 0
    ? JSON.stringify(tweets.slice(0, 50).map(t => ({
      text: t.text.substring(0, 150),
      user: t.user
    })))
    : "No Twitter Data.";

  const telegramPayload = telegramMsgs.length > 0
    ? JSON.stringify(telegramMsgs.slice(0, 200).map(msg => ({
      chat: msg.chat_title,
      text: msg.text.substring(0, 150)
    })))
    : "No Telegram Data.";

  // Mode-specific prompts
  let modeInstructions = "";
  let task = "";

  // Dynamic Thinking Budget
  // Complex tasks (Hourly, Altcoins) need more reasoning tokens to avoid hallucinations and filter noise
  let thinkingBudget = 2048; // Default for simple tasks

  if (mode === 'simple') {
    const nowInput = new Date();
    task = `Analyze sentiment for BTC, ETH, XRP, SOL. CURRENT UTC TIME: ${nowInput.toISOString()}.`;
    modeInstructions = `
      FORECAST TASK: Generate a detailed hourly forecast for the next 24 hours.
      MSK CONTEXT: Current time is UTC+3 (Moscow). 
      The FIRST point (hourOffset: 1) MUST be the price at the NEXT full hour from now in Moscow time.
      Example: If now is 20:15 MSK, hourOffset 1 is 21:00 MSK.
      FIELDS: "targetPrice24h" (final point price), "targetChange24h" (final point %), "hourlyForecast" (array of exactly 24 objects). 
      "forecastLabel": "Прогноз (24ч)"
    `;
    thinkingBudget = 4096; // Increased budget for array generation
  } else if (mode === 'hourly') {
    const nowInput = new Date();
    task = `Analyze sentiment for BTC, ETH, XRP, SOL. CURRENT UTC TIME: ${nowInput.toISOString()}.`;
    modeInstructions = `
      FORECAST TASK: Generate a detailed hourly forecast for the next 24 hours.
      MSK CONTEXT: Current time is UTC+3 (Moscow). 
      The FIRST point (hourOffset: 1) MUST be the price at the NEXT full hour from now in Moscow time.
      Example: If now is 20:15 MSK, hourOffset 1 is 21:00 MSK.
      FIELDS: "hourlyForecast" (array of 24 objects). 
      Each point MUST include "confidence" (0-100) based on signal strength.
      "forecastLabel": "Почасовой (МСК)"
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
  } else if (mode === 'today_24msk') {
    const now = new Date();
    task = `Analyze sentiment for BTC, ETH, XRP, SOL. CURRENT UTC TIME: ${now.toISOString()}.`;
    modeInstructions = `
      FORECAST TASK: Predict price for the UPCOMING 24:00 Moscow Time (UTC+3) / End of current day MSK.
      If current time is before 21:00 UTC, target is TODAY 24:00 MSK (21:00 UTC).
      If current time is past 21:00 UTC, target is TOMORROW 24:00 MSK.
      FIELDS: "targetPrice" (number), "targetChange" (number).
      "forecastLabel": "Прогноз (24:00 МСК)"
    `;
    thinkingBudget = 4096;
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
  } else if (mode === 'single_coin') {
    task = `ANALYZE SPECIFIC COIN: ${targetCoinSymbol || 'UNKNOWN'}. Read the Reddit and Twitter data strictly looking for this coin.Check the Market Context for its current price.`;
    modeInstructions = `
      TASK: Provide a HIGHLY CONFIDENT, OBJECTIVE, and ANALYTICAL opinion on ONE specific coin: ${targetCoinSymbol}.
    - Base your verdict STRICTLY AND EXCLUSIVELY on the provided data(CMC market data + Reddit / Twitter sentiment).
      - BE DECISIVE.Avoid weak words like "possibly", "maybe", "mixed", or "unclear".Give a sharp, professional market assessment in Russian.
      - If there are fewer than 3 mentions in the social data, you MUST set hasEnoughData to false, and the 'detail' field must explicitly begin by stating that the coin is rarely discussed.
      - OUTPUT FIELD: "singleCoin"(object).
      "forecastLabel": "Анализ: ${targetCoinSymbol}"
    `;
    thinkingBudget = 1024;
  } else if (mode === 'trading') {
    task = `GENERATE FUTURES TRADING RECOMMENDATIONS.Analyze ALL coins from social data and market context.USER BALANCE: ${userBalance || 10} USDT.`;
    modeInstructions = `
    TASK: Find 3 - 8 coins where sentiment AND market data give clear directional signal(Bullish or Bearish) for the next 24 hours.
      For EACH coin, provide a FULL Futures trading recommendation:
    - "direction": "LONG"(if bullish) or "SHORT"(if bearish)
      - "leverage": recommended leverage(2 - 5 for safe, up to 10 for high confidence)
        - "entryPrice": current market price from context
          - "takeProfit": realistic TP based on 24h forecast
            - "stopLoss": protective SL(must be tighter than TP for good risk / reward)
      - "positionSizeUSDT": leverage * balance(e.g. 3x * ${userBalance || 10} = ${(userBalance || 10) * 3})
  - "riskRewardRatio": calculated R: R(e.g. "1:1.5")
    - "potentialProfit": % gain on deposit if TP hit
      - "potentialLoss": % loss on deposit if SL hit
        - "liquidationPrice": price at which position gets liquidated(100 % loss)
          - "warning": Russian text warning about liquidation risk at this leverage
      
      CRITICAL RULES:
  - For SHORT: TP < entryPrice, SL > entryPrice
    - For LONG: TP > entryPrice, SL < entryPrice
      - liquidationPrice for LONG = entryPrice * (1 - 1 / leverage)
        - liquidationPrice for SHORT = entryPrice * (1 + 1 / leverage)
          - Only recommend coins with confidence >= 60
          - reasoning must be in Russian, concise
  "forecastLabel": "Торговые рекомендации (24ч)"
    `;
    thinkingBudget = 8192;
  }

  // maxOutputTokens must be sufficient to cover thinking + JSON response
  const maxOutputTokens = 8192; // Maximize up to safe limit, Gemini 3 Pro supports large outputs

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `
CURRENT REAL-TIME MARKET PRICES (USE THESE AS YOUR BASELINE):
${marketContext}

REDDIT DATA: ${redditPayload}
TWITTER DATA: ${twitterPayload}
TELEGRAM DATA: ${telegramPayload}

TASK: ${task}
OUTPUT: JSON matching schema.

${modeInstructions}
CRITICAL INSTRUCTION: Your predicted target prices MUST be realistically anchored to the Real-Time Prices listed above. Calculate your targetChange based strictly on these current prices, not on social media hype numbers.

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

    // Basic protection against truncated JSON
    if (!text.endsWith('}')) {
      console.warn("JSON response may have been truncated. Attempting to recover...");
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace !== -1) {
        text = text.substring(0, lastBrace + 1);
      } else {
        // If it's an array for altcoins?
        const lastBracket = text.lastIndexOf(']');
        if (lastBracket !== -1) text = text.substring(0, lastBracket + 1) + '}';
      }
    }

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
  const ai = createGeminiClient();

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
      model: 'gemini-2.5-flash',
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

    if (!text.endsWith('}')) {
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace !== -1) text = text.substring(0, lastBrace + 1);
    }

    if (!text) throw new Error("Empty response from AI");

    const parsed = JSON.parse(text) as { results: ChatFilterResult[] };
    return parsed.results || [];
  } catch (error) {
    console.error("Gemini Chat Filter Error:", error);
    throw new Error("Ошибка при оценке чатов AI.");
  }
};

// --- PIPELINE STEP 1: COMPRESSION/FILTERING ---
// Uses Claude Opus 4.6 chunked filtering via backend proxy (no Gemini dependency)
export const filterDataWithGemini = async (
  posts: RedditPost[],
  tweets: Tweet[],
  telegramMsgs: TelegramMessage[],
  targetCoinSymbol?: string
): Promise<string> => {
  const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';
  const CHUNK_SIZE = 500;
  const targetCoins = targetCoinSymbol ? targetCoinSymbol : "BTC, ETH, XRP, SOL, HYPE, DOGE, BNB";

  // Prepare compact items
  const items: any[] = [];
  posts.forEach(p => items.push({ src: 'R', t: p.title?.substring(0, 200), b: p.selftext?.substring(0, 300), sub: p.subreddit, s: p.score }));
  tweets.forEach(t => items.push({ src: 'T', b: t.text?.substring(0, 300), u: t.user }));
  telegramMsgs.forEach(m => items.push({ src: 'TG', b: m.text?.substring(0, 300), ch: m.chat_title }));

  const chunks: any[][] = [];
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE));
  }

  const callClaude = async (system: string, prompt: string, maxTokens = 2048): Promise<string> => {
    const resp = await fetch(`${BACKEND_URL}/api/proxy/post?url=${encodeURIComponent('https://api.anthropic.com/v1/messages')}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!resp.ok) throw new Error(`Claude error: ${resp.status}`);
    const data = await resp.json();
    for (const block of data.content || []) {
      if (block.type === 'text') return block.text?.trim() || '';
    }
    return '';
  };

  const systemPrompt = 'You are a crypto market data analyst. Extract key sentiment and news from social media posts. Output dense Russian markdown. No predictions.';

  try {
    // Step 1: Summarize each chunk
    const summaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkJson = JSON.stringify(chunks[i]);
      const prompt = `Chunk ${i + 1}/${chunks.length} of social media data (last 16h). Items: ${chunks[i].length}\n\nDATA:\n${chunkJson}\n\nTASK: Extract key crypto sentiment about ${targetCoins}. Output: dense Markdown in Russian, max 500 words. Group by coin.`;
      const summary = await callClaude(systemPrompt, prompt);
      if (summary) summaries.push(summary);
    }

    if (!summaries.length) throw new Error('All chunk summaries empty');
    if (summaries.length === 1) return summaries[0];

    // Step 2: Merge
    const mergePrompt = `You have ${summaries.length} partial summaries of crypto social media data.\nMerge into ONE dense summary.\n\n${summaries.map((s, i) => `--- Part ${i + 1} ---\n${s}`).join('\n\n')}\n\nOUTPUT: One merged Markdown summary in Russian, max 3000 words. Group by coin (${targetCoins}). Remove duplicates.`;
    return await callClaude(systemPrompt, mergePrompt, 4096);

  } catch (error) {
    console.error("Claude Filter Error:", error);
    throw new Error("Ошибка при фильтрации данных через Claude: " + (error instanceof Error ? error.message : String(error)));
  }
};

// --- PIPELINE: SMART MONEY TRADING PRE-FILTER ---
// Splits data into 3 time windows and asks Gemini to find top-15 coins by mention velocity
export const filterTradingCoinsWithGemini = async (
  posts: RedditPost[],
  tweets: Tweet[],
  telegramMsgs: TelegramMessage[]
): Promise<string> => {
  const ai = createGeminiClient();

  const now = Date.now();
  const HOUR = 3600 * 1000;

  // --- SPLIT BY TIME WINDOWS ---
  const splitByTime = <T extends { created_utc?: number; created_at?: string; date?: string }>(
    items: T[]
  ): { last4h: T[]; h4to12: T[]; h12to18: T[] } => {
    const last4h: T[] = [];
    const h4to12: T[] = [];
    const h12to18: T[] = [];

    items.forEach(item => {
      let ts: number;
      if ('created_utc' in item && item.created_utc) {
        ts = item.created_utc * 1000; // Reddit uses seconds
      } else if ('created_at' in item && item.created_at) {
        ts = new Date(item.created_at).getTime();
      } else if ('date' in item && item.date) {
        ts = new Date(item.date).getTime();
      } else {
        ts = now - 6 * HOUR; // Default to mid-range if no timestamp
      }

      const ageH = (now - ts) / HOUR;
      if (ageH <= 4) last4h.push(item);
      else if (ageH <= 12) h4to12.push(item);
      else if (ageH <= 18) h12to18.push(item);
      // >18h ignored
    });

    return { last4h, h4to12, h12to18 };
  };

  const redditWindows = splitByTime(posts);
  const twitterWindows = splitByTime(tweets);
  const telegramWindows = splitByTime(telegramMsgs);

  const formatReddit = (items: RedditPost[]) => items.map(p => ({
    title: p.title, text: (p.selftext || "").substring(0, 300), sub: p.subreddit, score: p.score
  }));
  const formatTweets = (items: Tweet[]) => items.map(t => ({ text: t.text, user: t.user }));
  const formatTg = (items: TelegramMessage[]) => items.map(m => ({ chat: m.chat_title, text: m.text }));

  const timeWindowsPayload = JSON.stringify({
    last_4h: {
      weight: 0.5,
      reddit: formatReddit(redditWindows.last4h),
      twitter: formatTweets(twitterWindows.last4h),
      telegram: formatTg(telegramWindows.last4h),
      counts: {
        reddit: redditWindows.last4h.length,
        twitter: twitterWindows.last4h.length,
        telegram: telegramWindows.last4h.length
      }
    },
    "4h_to_12h": {
      weight: 0.3,
      reddit: formatReddit(redditWindows.h4to12),
      twitter: formatTweets(twitterWindows.h4to12),
      telegram: formatTg(telegramWindows.h12to18),
      counts: {
        reddit: redditWindows.h4to12.length,
        twitter: twitterWindows.h4to12.length,
        telegram: telegramWindows.h4to12.length
      }
    },
    "12h_to_18h": {
      weight: 0.2,
      reddit: formatReddit(redditWindows.h12to18),
      twitter: formatTweets(twitterWindows.h12to18),
      telegram: formatTg(telegramWindows.h12to18),
      counts: {
        reddit: redditWindows.h12to18.length,
        twitter: twitterWindows.h12to18.length,
        telegram: telegramWindows.h12to18.length
      }
    }
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `
TIME-WINDOWED SOCIAL DATA (18 HOURS):
${timeWindowsPayload}

TASK:
You are the FIRST STAGE of a Smart Money trading pipeline.

1. Count mentions of EVERY crypto coin/token across ALL 3 time windows.
2. Calculate "Social Velocity Delta" for each coin:
   velocity = (mentions_last_4h * 0.5) / max((mentions_4h_12h * 0.3 + mentions_12h_18h * 0.2), 1)
   Higher velocity = coin is gaining traction RIGHT NOW.

3. Select TOP-15 coins by velocity (exclude stablecoins USDT, USDC, DAI, BUSD).

4. For each of the top-15, provide a DENSE summary:
   - Coin symbol and name
   - Mention counts per time window
   - Velocity score
   - Key narratives/catalysts mentioned (listings, partnerships, upgrades, whale activity)
   - Dominant sentiment per time window (bullish/bearish/neutral)
   - Movement type: "explosive" (sudden spike in last 4h), "steady" (growing across all windows), "accumulation" (quiet but increasing)

OUTPUT: Pure Markdown text grouped by coin. Russian language. Under 4000 words.
Do NOT make price predictions. You are a data extractor only.
      `,
      config: {
        systemInstruction: "You are an elite crypto social data analyst. Extract signal from noise. Focus on velocity of mentions, not absolute volume.",
        temperature: 0.1,
      }
    });

    const text = response.text || "";
    if (!text) throw new Error("Empty response from Gemini Trading Filter");
    return text.trim();

  } catch (error) {
    console.error("Gemini Trading Filter Error:", error);
    throw new Error("Ошибка при фильтрации торговых данных через Gemini: " + (error instanceof Error ? error.message : String(error)));
  }
};