import React, { useState, useEffect, useCallback } from 'react';
import { CombinedAnalysisResponse } from '../types';
import CryptoCard from './CryptoCard';
import SmartMoneyCard from './SmartMoneyCard';
import AltcoinGemCard from './AltcoinGemCard';

// @ts-ignore
const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface HistoryItem {
    id: number;
    created_at: string;
    finished_at: string | null;
    mode: string;
    status: string;
    trigger: string;
    reddit_posts_count: number;
    twitter_tweets_count: number;
    telegram_msgs_count: number;
    error_message: string | null;
    has_result: boolean;
}

interface HistoryDetail {
    id: number;
    created_at: string;
    finished_at: string | null;
    mode: string;
    status: string;
    trigger: string;
    reddit_posts_count: number;
    twitter_tweets_count: number;
    telegram_msgs_count: number;
    error_message: string | null;
    result: CombinedAnalysisResponse | null;
}

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

const formatMSKDate = (isoStr: string): string => {
    try {
        const date = new Date(isoStr);
        // Shift to MSK (UTC+3)
        const msk = new Date(date.getTime() + 3 * 60 * 60 * 1000);
        const day = msk.getUTCDate().toString().padStart(2, '0');
        const month = (msk.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = msk.getUTCFullYear();
        const hours = msk.getUTCHours().toString().padStart(2, '0');
        const mins = msk.getUTCMinutes().toString().padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${mins} МСК`;
    } catch {
        return isoStr;
    }
};

const AnalysisHistory: React.FC = () => {
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [expandedData, setExpandedData] = useState<HistoryDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [triggeringManual, setTriggeringManual] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const resp = await fetch(`${BACKEND_URL}/api/analysis/history?limit=30`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            setItems(data.items || []);
        } catch (e: any) {
            setError(e.message || 'Ошибка загрузки истории');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleExpand = async (id: number) => {
        if (expandedId === id) {
            setExpandedId(null);
            setExpandedData(null);
            return;
        }
        setExpandedId(id);
        setLoadingDetail(true);
        try {
            const resp = await fetch(`${BACKEND_URL}/api/analysis/${id}`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data: HistoryDetail = await resp.json();
            setExpandedData(data);
        } catch (e: any) {
            setExpandedData(null);
        } finally {
            setLoadingDetail(false);
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'success') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✅ Успешно</span>;
        if (status === 'failed') return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">❌ Ошибка</span>;
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse">⏳ В процессе</span>;
    };

    const getTriggerBadge = (trigger: string) => {
        if (trigger === 'scheduled') return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">⏰ Авто (08:00)</span>;
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">🖐 Ручной</span>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                        <HistoryIcon />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">История анализов</h2>
                        <p className="text-xs text-gray-500">Автоматические и ручные анализы • Claude Opus 4.6</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                        Обновить
                    </button>
                </div>
            </div>

            {/* Schedule Info */}
            <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                    ⏰
                </div>
                <div>
                    <p className="text-sm text-indigo-300 font-semibold">Автозапуск: каждый день в 08:00 МСК</p>
                    <p className="text-xs text-gray-400 mt-0.5">Pipeline: Reddit → Gemini Filter → Claude Opus 4.6 • Ключи: CLAUDE_API_KEY + GEMINI_API_KEY в Railway</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Empty State */}
            {!loading && items.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-xl">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">📊</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Нет анализов</h3>
                    <p className="text-gray-400 max-w-md">
                        Автоматический анализ запустится в 08:00 МСК, или нажмите «Сбор + Анализ (24ч)» на главной вкладке, чтобы ручной анализ сохранился здесь.
                    </p>
                </div>
            )}

            {/* History Items */}
            {!loading && items.length > 0 && (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden transition-all hover:border-gray-700">
                            {/* Card Header — always visible */}
                            <button
                                onClick={() => item.has_result && handleExpand(item.id)}
                                className="w-full p-5 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Date block */}
                                    <div className="flex-shrink-0 text-center">
                                        <div className="text-lg font-bold text-white leading-tight">
                                            {item.created_at ? formatMSKDate(item.created_at).split(' ')[0] : '—'}
                                        </div>
                                        <div className="text-sm font-mono text-indigo-400">
                                            {item.created_at ? formatMSKDate(item.created_at).split(' ').slice(1).join(' ') : ''}
                                        </div>
                                    </div>

                                    <div className="w-px h-10 bg-gray-700 flex-shrink-0" />

                                    {/* Info */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getStatusBadge(item.status)}
                                            {getTriggerBadge(item.trigger)}
                                            <span className="text-[10px] text-gray-500 uppercase font-bold">{item.mode}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                            {item.reddit_posts_count > 0 && (
                                                <span className="flex items-center gap-1"><span className="text-orange-500">●</span> Reddit: {item.reddit_posts_count}</span>
                                            )}
                                            {item.twitter_tweets_count > 0 && (
                                                <span className="flex items-center gap-1"><span className="text-blue-500">●</span> Twitter: {item.twitter_tweets_count}</span>
                                            )}
                                            {item.telegram_msgs_count > 0 && (
                                                <span className="flex items-center gap-1"><span className="text-emerald-500">●</span> Telegram: {item.telegram_msgs_count}</span>
                                            )}
                                        </div>
                                        {item.error_message && (
                                            <p className="text-xs text-red-400 truncate max-w-md">{item.error_message}</p>
                                        )}
                                    </div>
                                </div>

                                {item.has_result && (
                                    <div className={`text-gray-500 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                    </div>
                                )}
                            </button>

                            {/* Expanded Detail */}
                            {expandedId === item.id && (
                                <div className="border-t border-gray-800 p-6 space-y-6 animate-fade-in">
                                    {loadingDetail ? (
                                        <div className="flex items-center justify-center py-10">
                                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : expandedData?.result ? (
                                        <>
                                            {/* Market Summary */}
                                            {expandedData.result.marketSummary && (
                                                <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-5">
                                                    <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Обзор рынка</h3>
                                                    <p className="text-gray-300 text-sm">{expandedData.result.marketSummary}</p>
                                                </div>
                                            )}

                                            {/* Strategy */}
                                            {(expandedData.result.strategy || expandedData.result.technicalVerdict) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {expandedData.result.technicalVerdict && (
                                                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 border-l-2 border-indigo-500 pl-2">Технический вердикт</h4>
                                                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{expandedData.result.technicalVerdict}</p>
                                                        </div>
                                                    )}
                                                    {expandedData.result.strategy && (
                                                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 border-l-2 border-emerald-500 pl-2">Стратегия</h4>
                                                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{expandedData.result.strategy}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Top Pick & Risk */}
                                            {(expandedData.result.topPick || expandedData.result.riskLevel) && (
                                                <div className="flex items-center gap-4">
                                                    {expandedData.result.topPick && (
                                                        <div className="bg-gray-800 rounded-lg px-4 py-2">
                                                            <span className="text-[10px] text-gray-500 uppercase block">Top Pick</span>
                                                            <span className="text-lg font-bold text-emerald-400">{expandedData.result.topPick}</span>
                                                        </div>
                                                    )}
                                                    {expandedData.result.riskLevel && (
                                                        <div className="bg-gray-800 rounded-lg px-4 py-2">
                                                            <span className="text-[10px] text-gray-500 uppercase block">Risk Level</span>
                                                            <span className={`text-sm font-bold ${expandedData.result.riskLevel === 'Low' ? 'text-emerald-400' : expandedData.result.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                {expandedData.result.riskLevel}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {expandedData.result.forecastLabel && (
                                                        <div className="bg-gray-800 rounded-lg px-4 py-2">
                                                            <span className="text-[10px] text-gray-500 uppercase block">Mode</span>
                                                            <span className="text-sm font-semibold text-indigo-400">{expandedData.result.forecastLabel}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Coins */}
                                            {expandedData.result.coins && expandedData.result.coins.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Монеты</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {expandedData.result.coins.map((coin, idx) => (
                                                            <CryptoCard key={`${coin.symbol}-${idx}`} coin={coin} forecastLabel={expandedData.result?.forecastLabel} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Altcoins */}
                                            {expandedData.result.altcoins && expandedData.result.altcoins.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Альткоины</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {expandedData.result.altcoins.map((gem, idx) => (
                                                            <AltcoinGemCard key={`${gem.symbol}-${idx}`} gem={gem} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Smart Trades */}
                                            {expandedData.result.smartTrades && expandedData.result.smartTrades.length > 0 && (
                                                <div>
                                                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Smart Money Сигналы</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {expandedData.result.smartTrades.map((trade, idx) => (
                                                            <SmartMoneyCard key={`${trade.symbol}-${idx}`} trade={trade} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500">
                                            Не удалось загрузить данные анализа.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnalysisHistory;
