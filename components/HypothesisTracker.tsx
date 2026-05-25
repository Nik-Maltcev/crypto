import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface Prediction {
    symbol: string;
    direction: string;
    confidence: number;
    reasoning: string;
    actual_direction?: string;
    actual_open?: number;
    actual_close?: number;
    matched?: boolean;
}

interface HypothesisEntry {
    id: number;
    created_at: string;
    finished_at: string | null;
    status: string;
    trigger: string;
    reddit_posts_count: number;
    twitter_tweets_count: number;
    error_message: string | null;
    result: {
        predictions: Prediction[];
        market_summary: string;
        verified?: boolean;
        hits?: number;
        total?: number;
        winrate?: number;
    } | null;
}

const HypothesisTracker: React.FC = () => {
    const [entries, setEntries] = useState<HypothesisEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);

    const fetchHistory = async () => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/hypothesis/history?limit=50`);
            if (resp.ok) {
                const data = await resp.json();
                if (data.success) setEntries(data.items);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const runManual = async () => {
        setIsRunning(true);
        try {
            await fetch(`${BACKEND_URL}/api/hypothesis/run`, { method: 'POST' });
            // Poll for result
            setTimeout(async () => {
                await fetchHistory();
                setIsRunning(false);
            }, 30000); // Wait 30s then refresh
        } catch (e) {
            console.error(e);
            setIsRunning(false);
        }
    };

    const exportCSV = () => {
        const rows = ['Дата МСК,Час прогноза,Монета,Направление,Уверенность%,Обоснование,Reddit,Twitter'];
        entries.forEach(e => {
            if (!e.result?.predictions) return;
            const mskDate = new Date(new Date(e.created_at).getTime() + 3 * 60 * 60 * 1000);
            const dateStr = mskDate.toISOString().slice(0, 16).replace('T', ' ');
            const nextHour = new Date(mskDate.getTime() + 60 * 60 * 1000).getHours();
            e.result.predictions.forEach(p => {
                rows.push(`${dateStr},${nextHour}:00,${p.symbol},${p.direction},${p.confidence},"${(p.reasoning || '').replace(/"/g, "'")}",${e.reddit_posts_count},${e.twitter_tweets_count}`);
            });
        });
        const csv = '\ufeff' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hypothesis_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) return <div className="flex justify-center py-20 text-gray-500">Загрузка...</div>;

    // Calculate overall winrate
    const verifiedEntries = entries.filter(e => e.result?.verified);
    const totalHits = verifiedEntries.reduce((s, e) => s + (e.result?.hits || 0), 0);
    const totalChecked = verifiedEntries.reduce((s, e) => s + (e.result?.total || 0), 0);
    const overallWinrate = totalChecked > 0 ? Math.round((totalHits / totalChecked) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">🧪 Тест гипотезы</h2>
                    <p className="text-gray-400 text-sm">Прогноз на СЛЕДУЮЩИЙ час. Binance (momentum) + Reddit/Twitter (1ч) → Claude Opus</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    {entries.length > 0 && (
                        <button onClick={exportCSV}
                            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium transition">
                            📥 CSV
                        </button>
                    )}
                    <button onClick={fetchHistory}
                        className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50 rounded-lg text-sm font-medium transition">
                        🔄
                    </button>
                    <button onClick={runManual} disabled={isRunning}
                        className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
                        {isRunning ? '⏳ Анализ...' : '🚀 Запустить'}
                    </button>
                </div>
            </div>

            {/* Winrate Summary */}
            {totalChecked > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className={`text-3xl font-bold ${overallWinrate >= 55 ? 'text-emerald-400' : overallWinrate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{overallWinrate}%</div>
                        <div className="text-[10px] text-gray-500 uppercase">Винрейт</div>
                    </div>
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-white">{totalHits}/{totalChecked}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Совпало</div>
                    </div>
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-3xl font-bold text-white">{verifiedEntries.length}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Проверено часов</div>
                    </div>
                </div>
            )}

            {isRunning && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 text-sm animate-pulse">
                    ⏳ Сбор данных и анализ... (~20-30 сек). Обновится автоматически.
                </div>
            )}

            {entries.length === 0 ? (
                <div className="text-center p-10 bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                    Нет данных. Нажмите «Запустить» или дождитесь автоматического запуска (каждый час в XX:50).
                </div>
            ) : (
                <div className="space-y-4">
                    {entries.map(entry => {
                        const mskDate = new Date(new Date(entry.created_at).getTime() + 3 * 60 * 60 * 1000);
                        const dateStr = mskDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                        const timeStr = mskDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                        const nextHour = new Date(mskDate.getTime() + 60 * 60 * 1000);
                        const nextHourStr = `${nextHour.getHours().toString().padStart(2, '0')}:00-${((nextHour.getHours() + 1) % 24).toString().padStart(2, '0')}:00`;

                        return (
                            <div key={entry.id} className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-800/50 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 font-mono">{dateStr} {timeStr}</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                                            → {nextHourStr} МСК
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${entry.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : entry.status === 'running' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {entry.status === 'success' ? '✅' : entry.status === 'running' ? '⏳' : '❌'} {entry.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <span>Reddit: {entry.reddit_posts_count}</span>
                                        <span>Twitter: {entry.twitter_tweets_count}</span>
                                    </div>
                                </div>

                                {/* Predictions */}
                                {entry.result?.predictions && (
                                    <div className="p-4">
                                        {entry.result.market_summary && (
                                            <p className="text-xs text-gray-400 mb-3 italic">{entry.result.market_summary}</p>
                                        )}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                            {entry.result.predictions.map((p, i) => (
                                                <div key={i} className={`rounded-lg p-3 text-center border ${
                                                    p.matched === true ? 'bg-emerald-500/15 border-emerald-500/40' :
                                                    p.matched === false ? 'bg-red-500/15 border-red-500/40' :
                                                    p.direction === 'Up' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                                                }`}>
                                                    <div className="text-xs font-bold text-white mb-1">{p.symbol}</div>
                                                    <div className={`text-lg font-bold ${p.direction === 'Up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {p.direction === 'Up' ? '↑' : '↓'} {p.direction}
                                                    </div>
                                                    <div className={`text-sm font-bold ${p.confidence >= 70 ? 'text-white' : p.confidence >= 60 ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        {p.confidence}%
                                                    </div>
                                                    {p.matched !== undefined && (
                                                        <div className={`text-xs mt-1 font-bold ${p.matched ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {p.matched ? '✅' : '❌'} Факт: {p.actual_direction}
                                                        </div>
                                                    )}
                                                    <div className="text-[9px] text-gray-500 mt-1 leading-tight">{p.reasoning?.slice(0, 60)}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {entry.result.verified && (
                                            <div className={`mt-3 text-xs font-bold text-center px-3 py-1.5 rounded ${
                                                (entry.result.winrate || 0) >= 60 ? 'bg-emerald-500/10 text-emerald-400' :
                                                (entry.result.winrate || 0) >= 50 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                                            }`}>
                                                Результат: {entry.result.hits}/{entry.result.total} ({entry.result.winrate}%)
                                            </div>
                                        )}
                                    </div>
                                )}

                                {entry.error_message && (
                                    <div className="p-4 text-red-400 text-xs">❌ {entry.error_message}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default HypothesisTracker;
