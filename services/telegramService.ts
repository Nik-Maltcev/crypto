import { TelegramMessage, TelegramExportResponse } from '../types';

// URL твоего Python API (замени на реальный после деплоя)
const TELEGRAM_API_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

export const triggerTelegramParse = async (): Promise<void> => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/api/telegram/parse`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start Telegram parse: ${response.status}`);
    }
    
    console.log('Telegram parsing started');
  } catch (error) {
    console.error("Failed to trigger Telegram parse:", error);
    throw error;
  }
};

export const waitForTelegramData = async (maxWaitMs: number = 120000): Promise<TelegramExportResponse> => {
  const startTime = Date.now();
  const pollInterval = 3000; // Check every 3 seconds
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const status = await getTelegramStatus();
      
      if (status.status === 'success') {
        return await fetchTelegramData();
      }
      
      if (status.status === 'failed') {
        throw new Error('Telegram parsing failed');
      }
      
      // Still running, wait and retry
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      // If 404, parsing not done yet
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  throw new Error('Telegram parsing timeout');
};

export const fetchTelegramData = async (): Promise<TelegramExportResponse> => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/api/telegram/export`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Нет данных Telegram. Запусти /parse в боте.');
      }
      throw new Error(`Telegram API Error: ${response.status}`);
    }
    
    const json = await response.json();
    return json;
    
  } catch (error) {
    console.error("Failed to fetch Telegram data:", error);
    throw error;
  }
};

export const getTelegramStatus = async (): Promise<{
  status: string;
  started_at?: string;
  messages_found?: number;
}> => {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/api/telegram/status`);
    return await response.json();
  } catch (error) {
    console.error("Failed to get Telegram status:", error);
    return { status: 'unavailable' };
  }
};

// Преобразуем Telegram сообщения в формат похожий на Reddit для Gemini
export const formatTelegramForAnalysis = (messages: TelegramMessage[]): string => {
  let summary = "TELEGRAM CRYPTO CHATS CONTEXT:\n";
  
  // Группируем по чатам
  const byChat = new Map<string, TelegramMessage[]>();
  messages.forEach(msg => {
    const existing = byChat.get(msg.chat_title) || [];
    existing.push(msg);
    byChat.set(msg.chat_title, existing);
  });
  
  // Берём топ сообщения из каждого чата
  byChat.forEach((msgs, chatTitle) => {
    summary += `\n[${chatTitle}]:\n`;
    msgs.slice(0, 5).forEach(msg => {
      const text = msg.text.substring(0, 300);
      summary += `- ${text}\n`;
    });
  });
  
  return summary;
};
