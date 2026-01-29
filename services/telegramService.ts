import { TelegramMessage, TelegramExportResponse } from '../types';

// URL твоего Python API (замени на реальный после деплоя)
const TELEGRAM_API_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

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
