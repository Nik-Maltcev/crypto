import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface AltcoinPick {
    symbol: string;
    name: string;
    currentPrice: number;
    targetPrice7d: number;
    targetChange7d: number;
    confidence: number;
    risk: 'Medium' | 'High' | 'Degen';
    catalyst: string;
    reasoning: string;
    volume24h: number;
    marketCap: number;
    socialBuzz: 'High' | 'Medium' | 'Low';
    timeframe: string;
}

interface AltcoinAvoid {
    symbol: string;
    reason: string;
}

interface AltcoinResult {
    weeklyOutlook: string;
    analysisDate: string;
    picks: AltcoinPick[];
    avoid: AltcoinAvoid[];
}

interface AltcoinHistoryItem {
    id: number;
    created_at: string;
    finished_at: string | null;
    status: string;
    trigger: string;
    reddit_posts_count: number;
    twitter_tweets_count: number;
    error_message: string | null;
    result: AltcoinResult | null;
}

const AltcoinWeekly: React.FC = () => {
    const [items, setItems] = useState<AltcoinHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState('');

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const resp = await fetch(`${BACKEND_URL}/api/altcoin/history?limit=10`);
            const data = await resp.json();
            if (data.success) setItems(data.items);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const triggerAnalysis = async () => {
        setIsRunning(true);
        try {
            const resp = await fetch(`${BACKEND_URL}/api/altcoin/run`, { method: 'POST' });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.detail || err.error || 'Failed');
            }
            // Poll for results
            setTimeout(fetchHistory, 5000);
            setTimeout(fetchHistory, 30000);
            setTimeout(fetchHistory, 60000);
            setTimeout(fetchHistory, 120000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsRunning(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const getRiskColor = (risk: string) => {
        if (risk === 'Medium') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        if (risk === 'High') return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    };

    const getBuzzColor = (buzz: string) => {
        if (buzz === 'High') return 'text-emerald-400';
        if (buzz === 'Medium') return 'text-yellow-400';
        return 'text-gray-400';
    };

    const formatPrice = (price: number) => {
        if (price < 0.001) return `$${price.toFixed(8)}`;
        if (price < 1) return `$${price.toFixed(5)}`;
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const latestResult = items.find(i => i.status === 'success' && i.result)?.result;
    const latestItem = items.find(i => i.status === 'success' && i.result);
    const runningItem = items.find(i => i.status === 'running');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">🔮 Недельные альткоины</h2>
                    <p className="text-gray-400 text-sm">
                        CMC + Reddit + Twitter → Claude Opus 4.6 • Цель: +10% за неделю
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <button
                        onClick={triggerAnalysis}
                        disabled={isRunning || !!runningItem}
                        className="px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isRunning || runningItem ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Анализ...
                            </>
                        ) : (
                            <>🚀 Запустить анализ</>
                        )}
                    </button>
                    <button onClick={fetchHistory} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Schedule info */}
            <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">📅</div>
                <div>
                    <p className="text-sm text-purple-300 font-semibold">Авто-запуск: каждый понедельник в 08:00 МСК</p>
                    <p className="text-xs text-gray-400 mt-0.5">Pipeline: CMC (trending+gainers+new) + Reddit (24ч) + Twitter (24ч) → Claude Opus 4.6</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">❌ {error}</div>
            )}

            {/* Loading */}
            {isLoading && <div className="flex justify-center py-20 text-gray-500">Загрузка...</div>}

            {/* Running status */}
            {runningItem && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                    <svg className="animate-spin w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="text-yellow-400 text-sm font-semibold">Анализ выполняется... Обычно занимает 2-5 минут.</span>
                </div>
            )}

            {/* Latest result */}
            {latestResult && (
                <div className="space-y-6">
                    {/* Weekly outlook */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Обзор недели</h3>
                            {latestItem && (
                                <span className="text-[10px] text-gray-500">
                                    {new Date(latestItem.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    {' • '}Reddit: {latestItem.reddit_posts_count}, Twitter: {latestItem.twitter_tweets_count}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-300 text-sm">{latestResult.weeklyOutlook}</p>
                    </div>

                    {/* Picks */}
                    <div>
                        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">🎯 Топ пики недели ({latestResult.picks?.length || 0})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(latestResult.picks || []).map((pick, idx) => (
                                <div key={pick.symbol} className="bg-brand-card border border-gray-800 rounded-xl p-5 hover:border-purple-500/30 transition-colors">
                                    {/* Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <span className="text-xl font-bold text-white">{pick.symbol}</span>
                                            <span className="text-xs text-gray-500 ml-2">{pick.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-500 font-mono">#{idx + 1}</span>
                                    </div>

                                    {/* Price target */}
                                    <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="text-[10px] text-gray-500 uppercase">Сейчас</div>
                                                <div className="text-sm font-mono text-white">{formatPrice(pick.currentPrice)}</div>
                                            </div>
                                            <div className="text-emerald-400 text-lg">→</div>
                                            <div className="text-right">
                                                <div className="text-[10px] text-gray-500 uppercase">Цель 7д</div>
                                                <div className="text-sm font-mono text-emerald-400">{formatPrice(pick.targetPrice7d)}</div>
                                            </div>
                                        </div>
                                        <div className="text-center mt-2">
                                            <span className="text-lg font-bold text-emerald-400">+{pick.targetChange7d.toFixed(1)}%</span>
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getRiskColor(pick.risk)}`}>{pick.risk}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">{pick.confidence}%</span>
                                        <span className={`text-[10px] font-bold ${getBuzzColor(pick.socialBuzz)}`}>📢 {pick.socialBuzz}</span>
                                        <span className="text-[10px] text-gray-500">{pick.timeframe}</span>
                                    </div>

                                    {/* Catalyst */}
                                    <div className="mb-2">
                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Катализатор</div>
                                        <p className="text-xs text-yellow-400">{pick.catalyst}</p>
                                    </div>

                                    {/* Reasoning */}
                                    <div>
                                        <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Анализ</div>
                                        <p className="text-xs text-gray-400 line-clamp-3 hover:line-clamp-none transition-all">{pick.reasoning}</p>
                                    </div>

                                    {/* Volume/MCap */}
                                    <div className="flex justify-between mt-3 pt-3 border-t border-gray-800 text-[10px] text-gray-500">
                                        <span>Vol: ${(pick.volume24h / 1e6).toFixed(1)}M</span>
                                        <span>MCap: ${(pick.marketCap / 1e6).toFixed(1)}M</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Avoid */}
                    {latestResult.avoid && latestResult.avoid.length > 0 && (
                        <div className="bg-brand-card border border-red-500/20 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">⚠️ Избегать</h3>
                            <div className="space-y-2">
                                {latestResult.avoid.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <span className="text-red-400 font-bold text-sm">{item.symbol}</span>
                                        <span className="text-gray-400 text-sm">{item.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !latestResult && !runningItem && (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-xl">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">🔮</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Нет анализов</h3>
                    <p className="text-gray-400 max-w-md">
                        Нажмите «Запустить анализ» или дождитесь автозапуска в понедельник 08:00 МСК.
                    </p>
                </div>
            )}

            {/* History of past analyses */}
            {items.filter(i => i.status === 'failed').length > 0 && (
                <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">История ошибок</h3>
                    <div className="space-y-2">
                        {items.filter(i => i.status === 'failed').map(item => (
                            <div key={item.id} className="flex items-center gap-3 text-xs">
                                <span className="text-red-400">❌</span>
                                <span className="text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleString('ru-RU') : '—'}</span>
                                <span className="text-red-400 truncate">{item.error_message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AltcoinWeekly;
