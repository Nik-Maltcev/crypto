import React, { useState } from 'react';
import { fetchChatsPreview } from '../services/telegramService';
import { filterTelegramChats } from '../services/geminiService';
import { ChatFilterResult } from '../types';

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
);

const TelegramFilter: React.FC = () => {
    const [chatListText, setChatListText] = useState("t.me/CryptoBoom\nt.me/ScamCoinChat\nhttps://t.me/BitcoinNews");
    const [days, setDays] = useState(2);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const [results, setResults] = useState<ChatFilterResult[]>([]);

    const handleStartAnalysis = async () => {
        // 1. Parse list of chats
        const rawChats = chatListText.split('\n')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => s.replace('https://t.me/', '').replace('t.me/', '').replace('@', ''));

        if (rawChats.length === 0) {
            alert("Введите хотя бы один чат.");
            return;
        }

        try {
            setIsProcessing(true);
            setResults([]);

            // Step 1: Fetch messages
            setStatus(`1/2: Парсинг ${rawChats.length} чатов (за ${days} дн.)... Это может занять время.`);
            const fetchedData = await fetchChatsPreview(rawChats, days);

            if (!fetchedData.data || Object.keys(fetchedData.data).length === 0) {
                throw new Error("Не удалось получить сообщения из предоставленных чатов.");
            }

            // Step 2: Filter out abandoned chats
            const activeChats: Record<string, any> = {};
            const deadChats: ChatFilterResult[] = [];

            for (const [title, messages] of Object.entries(fetchedData.data)) {
                if ((messages as any[]).length === 0) {
                    deadChats.push({
                        chatTitle: title,
                        isSpam: true,
                        category: "Flood", // We classify abandoned chats as useless/flood
                        reason: `Чат заброшен. Нет новых сообщений за последние ${days} дн.`
                    });
                } else {
                    activeChats[title] = messages;
                }
            }

            // Step 3: Send to Gemini Flash
            let analysisResults: ChatFilterResult[] = [];
            const activeChatsCount = Object.keys(activeChats).length;

            if (activeChatsCount > 0) {
                setStatus(`2/2: AI Анализ ${activeChatsCount} активных чатов через Gemini...`);
                analysisResults = await filterTelegramChats(activeChats as any);
            } else {
                setStatus(`2/2: Нет активных чатов для AI анализа.`);
            }

            // Combine AI results and locally identified dead chats
            setResults([...analysisResults, ...deadChats]);
            setStatus('Готово!');

        } catch (error) {
            console.error(error);
            setStatus('Ошибка!');
            alert(error instanceof Error ? error.message : "Произошла неизвестная ошибка.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportClean = () => {
        const cleanChats = results.filter(r => !r.isSpam);
        if (cleanChats.length === 0) {
            alert("Нет чистых чатов для экспорта.");
            return;
        }

        // Create CSV content
        let csvContent = "chat_title,category,reason\n";
        cleanChats.forEach(chat => {
            const safeTitle = chat.chatTitle.replace(/"/g, '""');
            const safeReason = chat.reason.replace(/"/g, '""');
            csvContent += `"${safeTitle}","${chat.category}","${safeReason}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", url);
        downloadAnchorNode.setAttribute("download", `clean_telegram_chats_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6 shadow-xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-500">
                        <FilterIcon />
                    </span>
                    Фильтрация Telegram-чатов AI (Beta)
                </h2>
                <p className="text-sm text-gray-400 mb-6 max-w-2xl">
                    Вставьте список ссылок или ников Telegram-чатов (по одному в строке). Нейросеть Gemini 2.5 Flash проанализирует последние сообщения каждого чата и отсеет спам, скам и флуд от полезных сообществ.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Список чатов</label>
                        <textarea
                            value={chatListText}
                            onChange={e => setChatListText(e.target.value)}
                            placeholder="t.me/CryptoChat1&#10;@MemeCoinRussian&#10;..."
                            className="w-full h-48 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y"
                        />
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Глубина парсинга (Дней)</label>
                            <select
                                value={days}
                                onChange={e => setDays(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                <option value={1}>1 день (Быстро)</option>
                                <option value={2}>2 дня (Рекомендуется)</option>
                                <option value={5}>5 дней (Глубоко)</option>
                                <option value={7}>7 дней (Долго)</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleStartAnalysis}
                                disabled={isProcessing}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-white transition-all shadow-lg ${isProcessing ? 'bg-gray-700 cursor-not-allowed text-gray-400 border border-gray-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20'}`}
                            >
                                {isProcessing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Анализ...
                                    </>
                                ) : (
                                    <>
                                        <FilterIcon />
                                        Начать Проверку
                                    </>
                                )}
                            </button>
                        </div>

                        {status && (
                            <div className="mt-4 p-3 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
                                &gt; {status}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {results.length > 0 && (
                <div className="bg-brand-card border border-gray-800 rounded-xl p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            Результаты проверки AI ({results.length} чатов)
                        </h3>

                        <button
                            onClick={handleExportClean}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-sm transition-all"
                        >
                            <DownloadIcon />
                            Экспорт (Чистые)
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-800">
                        <table className="w-full text-sm text-left text-gray-300">
                            <thead className="text-xs uppercase bg-gray-900 text-gray-400 border-b border-gray-800">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-center w-10">Статус</th>
                                    <th scope="col" className="px-4 py-3">Чат</th>
                                    <th scope="col" className="px-6 py-3">Категория</th>
                                    <th scope="col" className="px-6 py-3 w-1/2">Вердикт AI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((res, idx) => (
                                    <tr key={idx} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${res.isSpam ? 'bg-red-500/5' : 'bg-emerald-500/5'}`}>
                                        <td className="px-4 py-4 text-center">
                                            {res.isSpam ?
                                                <span className="text-red-500 font-bold" title="Spam/Trash">❌</span> :
                                                <span className="text-emerald-500 font-bold" title="Useful/Clean">✅</span>
                                            }
                                        </td>
                                        <td className="px-4 py-4 font-medium text-white break-all">
                                            {res.chatTitle}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${res.isSpam
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                                                : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'
                                                }`}>
                                                {res.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 italic">
                                            "{res.reason}"
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TelegramFilter;
