import { RedditPost, Tweet, TelegramMessage, CombinedAnalysisResponse } from '../types';

export const performClaudeAnalysis = async (
  posts: RedditPost[],
  tweets: Tweet[],
  telegramMsgs: TelegramMessage[],
  marketContext: string,
  mode: 'simple' | 'hourly' | 'altcoins' | 'today_20msk' | 'today_24msk' | 'single_coin' | 'trading' = 'simple',
  targetCoinSymbol?: string,
  apiKey?: string,
  userBalance?: number,
  filteredContext?: string
): Promise<CombinedAnalysisResponse> => {
  if ((!posts || posts.length === 0) && (!tweets || tweets.length === 0) && (!telegramMsgs || telegramMsgs.length === 0)) {
    throw new Error("Нет данных для анализа ни из одного источника (Reddit, Twitter, Telegram пустые).");
  }

  if (!apiKey) {
    throw new Error("Отсутствует API ключ Claude.");
  }

  // Input Data - User explicitly requested NO limits for Reddit posts
  // If filteredContext is passed, we use THAT instead of building these giant raw strings
  let rawDataText = "";

  if (filteredContext) {
    rawDataText = `
--- FILTERED CONTEXT FROM GEMINI ---
${filteredContext}
    `;
  } else {
    // Fallback to old behavior if no filter is provided
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

    rawDataText = `
--- RAW DATA ---
Reddit: ${redditPayload}
Twitter: ${twitterPayload}
Telegram: ${telegramPayload}
    `;
  }

  // Mode-specific prompts
  let modeInstructions = "";
  let task = "";

  if (mode === 'simple') {
    task = "Analyze sentiment for BTC, ETH, XRP, SOL.";
    modeInstructions = `
      FORECAST TASK: Provide ONLY ONE target price for exactly 24 hours from now.
      FIELDS: "targetPrice24h" (number), "targetChange24h" (number).
      "forecastLabel": "Прогноз (24ч)"
    `;
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
  } else if (mode === 'single_coin') {
    task = `ANALYZE SPECIFIC COIN: ${targetCoinSymbol || 'UNKNOWN'}. Read the Reddit and Twitter data strictly looking for this coin. Check the Market Context for its current price.`;
    modeInstructions = `
      TASK: Provide a HIGHLY CONFIDENT, OBJECTIVE, and ANALYTICAL opinion on ONE specific coin: ${targetCoinSymbol}.
      - Base your verdict STRICTLY AND EXCLUSIVELY on the provided data (CMC market data + Reddit/Twitter sentiment).
      - BE DECISIVE. Avoid weak words like "possibly", "maybe", "mixed", or "unclear". Give a sharp, professional market assessment in Russian.
      - If there are fewer than 3 mentions in the social data, you MUST set hasEnoughData to false, and the 'detail' field must explicitly begin by stating that the coin is rarely discussed.
      - OUTPUT FIELD: "singleCoin" (object).
      "forecastLabel": "Анализ: ${targetCoinSymbol}"
    `;
  } else if (mode === 'trading') {
    const nowUtc = new Date();
    task = `SMART MONEY ANALYSIS for Bybit Futures. CURRENT UTC TIME: ${nowUtc.toISOString()}. Analyze the pre-filtered top coins from social velocity data.`;
    modeInstructions = `
      SMART MONEY PIPELINE — BYBIT FUTURES ANALYSIS

      The input data has been PRE-FILTERED by Gemini AI. It contains the top-15 coins by Social Velocity Delta (mention growth in last 4h vs previous 14h), split into 3 time windows with weights:
      - last_4h (weight 50%): Most important — detect fresh catalysts
      - 4h_to_12h (weight 30%): Trend confirmation
      - 12h_to_18h (weight 20%): Historical context

      FOR EACH COIN, score 4 PILLARS (0-25 each):
      1. **Narrative Strength** (0-25): Is there a CONCRETE story (listing, upgrade, partnership, whale buy) or just generic hype? Score 20+ only if specific catalyst exists.
      2. **Information Asymmetry** (0-25): Is the information NOT YET reflected in the current price? Early signal = high score. Already pumped = low score.
      3. **Social Velocity Delta** (0-25): Growth of mentions in last_4h vs previous 14h. Explosive growth = 25, steady = 15, declining = 5.
      4. **Risk/Reward** (0-25): Liquidity (volume24h), market cap size, distance to resistance. High liquidity + clear path = high score.

      AI Score = sum of 4 pillars (0-100). ONLY return coins with aiScore >= 75.

      SIGNAL TYPES (based on velocity pattern):
      - "scalp" (explosive, 0.5-2h): Sudden spike in last 4h. Leverage: 10-20x.
      - "intraday" (steady, 2-8h): Growing trend across windows. Leverage: 5-7x.
      - "swing" (accumulation, 8-24h): Quiet buildup. Leverage: 2-3x.

      CRITICAL RULE: Longer hold time = LOWER leverage. This is Bybit Futures, not spot.

      FOR EACH COIN OUTPUT:
      - symbol, name
      - aiScore (0-100), narrativeStrength (0-25), informationAsymmetry (0-25), socialVelocityDelta (0-25), riskReward (0-25)
      - signalType: "scalp" | "intraday" | "swing"
      - direction: "LONG" | "SHORT"
      - confidence: "high" (only if pillars 1 and 2 >= 20 each) | "medium" | "low"
      - entryZoneMin, entryZoneMax: realistic entry price range from market context
      - targetPrice: realistic target based on historical analogs (NOT "to the moon")
      - targetPercent: % gain from entry to target
      - stopLoss: protective stop
      - timeToTargetMinH, timeToTargetMaxH: expected time range in hours
      - maxHoldTimeH: time-based SL (close if target not reached)
      - invalidAfter: ISO datetime after which signal expires
      - leverage: recommended (must match signalType rules above)
      - fundingSensitive: true if holding through 00:00/08:00/16:00 UTC funding time
      - fundingImpact: "low" / "medium" / "high"
      - catalyst: one-sentence catalyst description (Russian)
      - reasoning: 1-2 sentence reasoning (Russian)
      - currentPrice, volume24h, marketCap, priceChange24h: from market context

      OUTPUT FIELD: "smartTrades" (array of objects).
      "forecastLabel": "Smart Money (Bybit)"

      ABSOLUTE RULES:
      - Return 3-5 coins MAXIMUM. Quality over quantity.
      - If NO coin scores >= 75, return empty array and set marketSummary to explain why.
      - If priceChange24h > 30%, set confidence to "medium" regardless (overheated).
      - All text fields in Russian.
    `;
  }

  const systemPrompt = `
You are CryptoPulse AI, a professional cryptocurrency market analyst algorithm.
Your task is to analyze social sentiment and market data, and output a strict JSON array or object based on the requested mode.
    
Output pure JSON only, without any markdown formatting wrappers such as \`\`\`json. DO NOT add any explanatory text before or after the JSON.
Your entire response must be parseable by JSON.parse().
    
Response Format per Mode:
For modes 'simple', 'hourly', 'today_20msk', 'today_24msk', output a JSON object:
{
  "marketSummary": "String (Russian) - Overarching market overview, max 3 sentences",
  "coins": [
    {
       "symbol": "BTC",
       "name": "Bitcoin",
       "sentimentScore": 85, // 0-100 indicating hype/positivity
       "prediction": "Bullish" | "Bearish" | "Neutral",
       "confidence": 90, // 0-100 indicating your confidence
       "reasoning": "String (Russian) - Why this prediction?",
       // Mode-dependent fields: targetPrice24h, targetChange24h, hourlyForecast, targetPrice, targetChange
    }
  ]
}

For 'altcoins' mode, output a JSON object:
{
  "marketSummary": "...",
  "altcoins": [
    {
      "symbol": "DOGE",
      "name": "Dogecoin",
      "sentimentScore": 92,
      "prediction": "Bullish",
      "confidence": 85,
      "reasoning": "...",
      "potential7d": "+50%",
      "risk": "High"
    }
  ]
}

For 'single_coin' mode, output a JSON object:
{
  "singleCoin": {
     "hasEnoughData": true/false,
     "verdict": "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL" | "INSUFFICIENT DATA",
     "confidence": 80, // Number
     "targetPrice": 0.55, // Expected price, if possible
     "targetChange": +15.5, // Expected % change, if possible
     "detail": "String (Russian). Sharp, objective, professional assessment based strictly on provided data."
  }
}

For 'trading' mode, output a JSON object:
{
  "marketSummary": "...",
  "forecastLabel": "Smart Money (Bybit)",
  "smartTrades": [
    {
      "symbol": "SOL", "name": "Solana",
      "aiScore": 87, "narrativeStrength": 22, "informationAsymmetry": 20, "socialVelocityDelta": 25, "riskReward": 20,
      "signalType": "intraday", "direction": "LONG", "confidence": "high",
      "entryZoneMin": 142.0, "entryZoneMax": 143.5, "targetPrice": 155.0, "targetPercent": 8.5, "stopLoss": 138.0,
      "timeToTargetMinH": 3, "timeToTargetMaxH": 6, "maxHoldTimeH": 8, "invalidAfter": "2025-02-28T14:00:00Z",
      "leverage": 5, "fundingSensitive": true, "fundingImpact": "medium",
      "catalyst": "Листинг на новой бирже + рост TVL", "reasoning": "Сильный катализатор...",
      "currentPrice": 142.5, "volume24h": 5000000, "marketCap": 60000000000, "priceChange24h": 3.5
    }
  ]
}
  `;

  const userPrompt = `
CURRENT REAL-TIME MARKET PRICES (USE THESE AS YOUR BASELINE):
${marketContext}

SOCIAL SENTIMENT & NEWS DATA:
${rawDataText}

TASK: ${task}
OUTPUT: JSON matching schema.

${modeInstructions}
CRITICAL INSTRUCTION: Your predicted target prices MUST be realistically anchored to the Real-Time Prices listed above. Calculate your targetChange based strictly on these current prices, not on social media hype numbers.

RULES: Russian language for text. Extremely concise.
  `;

  const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

  try {
    const response = await fetch(`${BACKEND_URL}/api/proxy/post?url=https://api.anthropic.com/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      let errMsg = `Claude API Error: ${response.status} ${response.statusText}`;
      try {
        const errJson = JSON.parse(errBody);
        if (errJson.error?.message) {
          errMsg = `Claude API Error: ${errJson.error.message}`;
        }
      } catch (e) { }
      throw new Error(errMsg);
    }

    const data = await response.json();
    let text = data.content?.[0]?.text || "";

    // Clean markdown if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Basic protection against truncated JSON
    if (!text.endsWith('}')) {
      console.warn("JSON response may have been truncated. Attempting to recover...");
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace !== -1) {
        text = text.substring(0, lastBrace + 1);
      } else {
        const lastBracket = text.lastIndexOf(']');
        if (lastBracket !== -1) text = text.substring(0, lastBracket + 1) + '}';
      }
    }

    if (!text) throw new Error("Empty response from Claude AI");

    return JSON.parse(text) as CombinedAnalysisResponse;
  } catch (error: any) {
    console.error("Claude Analysis Error:", error);
    throw error;
  }
};
