import { RedditPost, Tweet, TelegramMessage, CombinedAnalysisResponse } from '../types';

export const performClaudeAnalysis = async (
  posts: RedditPost[],
  tweets: Tweet[],
  telegramMsgs: TelegramMessage[],
  marketContext: string,
  mode: 'simple' | 'hourly' | 'altcoins' | 'today_20msk' | 'single_coin' = 'simple',
  targetCoinSymbol?: string,
  apiKey?: string
): Promise<CombinedAnalysisResponse> => {
  if ((!posts || posts.length === 0) && (!tweets || tweets.length === 0) && (!telegramMsgs || telegramMsgs.length === 0)) {
    throw new Error("Нет данных для анализа ни из одного источника (Reddit, Twitter, Telegram пустые).");
  }

  if (!apiKey) {
    throw new Error("Отсутствует API ключ Claude.");
  }

  // Input Data - limited similarly to Gemini
  const redditPayload = JSON.stringify(posts.slice(0, 300).map(p => ({
    title: p.title,
    text: p.selftext ? p.selftext.substring(0, 200) : "",
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
  }

  const systemPrompt = `
You are CryptoPulse AI, a professional cryptocurrency market analyst algorithm.
Your task is to analyze social sentiment and market data, and output a strict JSON array or object based on the requested mode.
    
Output pure JSON only, without any markdown formatting wrappers such as \`\`\`json. DO NOT add any explanatory text before or after the JSON.
Your entire response must be parseable by JSON.parse().
    
Response Format per Mode:
For modes 'simple', 'hourly', 'today_20msk', output a JSON object:
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
  `;

  const userPrompt = `
CONTEXT: ${marketContext}
REDDIT DATA: ${redditPayload}
TWITTER DATA: ${twitterPayload}
TELEGRAM DATA: ${telegramPayload}

TASK: ${task}
OUTPUT: JSON matching schema.

${modeInstructions}

RULES: Russian language for text. Extremely concise.
  `;

  // Proxy the request through our backend to avoid CORS issues with Anthropic API
  let backendUrl = (import.meta as any).env?.VITE_BACKEND_URL;
  if (!backendUrl) {
    backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8080'
      : window.location.origin;
  }

  // Ensure JSON structure by pre-filling the assistant response
  const assistantPrefill = "{\n";

  try {
    const response = await fetch(`${backendUrl}/api/proxy/post?url=https://api.anthropic.com/v1/messages`, {
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
          { role: "user", content: userPrompt },
          { role: "assistant", content: assistantPrefill }
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

    // Prepend the prefill since Claude continues from it
    text = assistantPrefill + text;

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
