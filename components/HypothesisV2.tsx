import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface ShortCandidate {
    symbol: string;
    name: string;
    currentPrice: number;
    targetPrice24h: number;
    expectedDrop: number;
    confidence: number;
    timeframe: string;
    catalyst: string;
    reasoning: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    entryZone: string;
    stopLoss: number;
    bybitAvailable: boolean;
    // Verification fields
    actualPrice24h?: number;
    actualChange24h?: number;
    hit?: boolean;
    strongHit?: boolean;
}

interface AvoidEntry {
    symbol: string;
    reason: string;
}

interface ModelResult {
    summary: string;
    analysisTime?: string;
    shortCandidates: ShortCandidate[];
    avoidShorting?: AvoidEntry[];
    marketRiskNote?: string;
    verification?: {
        hits: number;
        total: number;
        winrate: number;
        strong_hits: number;
    };
}

interface HypV2Result {
    claude_opus: ModelResult | null;
    deepseek_v4: ModelResult | null;
    metadata: {
        reddit_posts: number;
        twitter_tweets: number;
        cmc_coins_analyzed: number;
        bybit_symbols_available: number;
        lookback_hours: number;
        prediction_horizon: string;
        errors?: string[] | null;
    };
    verified?: boolean;
    verified_at?: string;
}

interface HistoryItem {
    id: number;
    created_at: string;
    finished_at: string | null;
    status: string;
    trigger: string;
    reddit_posts_count: number;
    twitter_tweets_count: number;
    error_message: string | null;
    result: HypV2Result | null;
}

const HypothesisV2: React.FC = () => {
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState('');

    const fetchHistory = async () => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/hypothesis_v2/history?limit=20`);
            if (resp.ok) {
                const data = await resp.json();
                if (data.success) setItems(data.items);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const triggerRun = async () => {
        setIsRunning(true);
        setError('');
        try {
            const resp = await fetch(`${BACKEND_URL}/api/hypothesis_v2/run`, { method: 'POST' });
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.detail || 'Failed');
            }
            setTimeout(fetchHistory, 10000);
            setTimeout(fetchHistory, 30000);
            setTimeout(fetchHistory, 60000);
            setTimeout(fetchHistory, 120000);
            setTimeout(fetchHistory, 180000);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsRunning(false);
        }
    };

    const triggerVerify = async () => {
        try {
            await fetch(`${BACKEND_URL}/api/hypothesis_v2/verify`, { method: 'POST' });
            setTimeout(fetchHistory, 5000);
        } catch (e: any) {
            setError(e.message);
        }
    };

    useEffect(() => { fetchHistory(); }, []);

    const getRiskColor = (risk: string) => {
        if (risk === 'Low') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        if (risk === 'Medium') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    };

    const formatPrice = (price: number) => {
        if (!price) return '$0';
        if (price < 0.001) return `$${price.toFixed(8)}`;
        if (price < 1) return `$${price.toFixed(5)}`;
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const latestSuccess = items.find(i => i.status === 'success' && i.result);
    const runningItem = items.find(i => i.status === 'running');

    // Calculate overall stats
    const verifiedItems = items.filter(i => i.result?.verified);
    const getModelStats = (modelKey: 'claude_opus' | 'deepseek_v4') => {
        let totalHits = 0, totalPicks = 0, strongHits = 0;
        verifiedItems.forEach(item => {
            const v = item.result?.[modelKey]?.verification;
            if (v) {
                totalHits += v.hits;
                totalPicks += v.total;
                strongHits += v.strong_hits;
            }
        });
        return { totalHits, totalPicks, strongHits, winrate: totalPicks > 0 ? Math.round((totalHits / totalPicks) * 100) : 0 };
    };

    const claudeStats = getModelStats('claude_opus');
    const deepseekStats = getModelStats('deepseek_v4');

    const renderModelCard = (modelData: ModelResult | null, modelName: string, color: string) => {
        if (!modelData) return (
            <div className="bg-brand-card border border-gray-800 rounded-xl p-5 flex items-center justify-center">
                <span className="text-gray-500 text-sm">❌ {modelName} — ошибка</span>
            </div>
        );

        return (
            <div className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden">
                {/* Model header */}
                <div className={`px-5 py-3 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r ${color}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{modelName}</span>
                        {modelData.verification && (
                            <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                modelData.verification.winrate >= 60 ? 'bg-emerald-500/20 text-emerald-400' :
                                modelData.verification.winrate >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                                {modelData.verification.hits}/{modelData.verification.total} ({modelData.verification.winrate}%)
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-400">{modelData.shortCandidates?.length || 0} picks</span>
                </div>

                {/* Summary */}
                {modelData.summary && (
                    <div className="px-5 py-3 border-b border-gray-800/50">
                        <p className="text-xs text-gray-400 italic">{modelData.summary}</p>
                    </div>
                )}

                {/* Short candidates */}
                <div className="p-4 space-y-3">
                    {modelData.shortCandidates?.map((c, idx) => (
                        <div key={c.symbol} className={`rounded-lg p-4 border ${
                            c.strongHit ? 'bg-emerald-500/10 border-emerald-500/30' :
                            c.hit === true ? 'bg-emerald-500/5 border-emerald-500/20' :
                            c.hit === false ? 'bg-red-500/5 border-red-500/20' :
                            'bg-gray-900/50 border-gray-700/50'
                        }`}>
                            {/* Row 1: Symbol + confidence + risk */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">#{idx + 1}</span>
                                    <span className="text-lg font-bold text-white">{c.symbol}</span>
                                    <span className="text-xs text-gray-500">{c.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${getRiskColor(c.riskLevel)}`}>
                                        {c.riskLevel}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">
                                        {c.confidence}%
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                        Bybit ✓
                                    </span>
                                </div>
                            </div>

                            {/* Row 2: Prices */}
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase">Сейчас</div>
                                    <div className="text-xs font-mono text-white">{formatPrice(c.currentPrice)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase">Цель 24ч</div>
                                    <div className="text-xs font-mono text-red-400">{formatPrice(c.targetPrice24h)}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase">Падение</div>
                                    <div className="text-sm font-bold text-red-400">{c.expectedDrop?.toFixed(1)}%</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-gray-500 uppercase">Stop-Loss</div>
                                    <div className="text-xs font-mono text-yellow-400">{formatPrice(c.stopLoss)}</div>
                                </div>
                            </div>

                            {/* Verification result */}
                            {c.actualChange24h !== undefined && (
                                <div className={`rounded px-3 py-1.5 mb-2 flex items-center justify-between ${
                                    c.strongHit ? 'bg-emerald-500/15' : c.hit ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                }`}>
                                    <span className="text-xs font-bold">
                                        {c.strongHit ? '🎯 Сильное попадание' : c.hit ? '✅ Упало' : '❌ Не упало'}
                                    </span>
                                    <span className={`text-sm font-bold font-mono ${c.actualChange24h < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {c.actualChange24h >= 0 ? '+' : ''}{c.actualChange24h.toFixed(2)}%
                                        <span className="text-gray-500 text-xs ml-1">({formatPrice(c.actualPrice24h || 0)})</span>
                                    </span>
                                </div>
                            )}

                            {/* Row 3: Catalyst + timeframe */}
                            <div className="flex items-start gap-4 mb-1">
                                <div className="flex-1">
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">Катализатор: </span>
                                    <span className="text-xs text-orange-400">{c.catalyst}</span>
                                </div>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">⏱ {c.timeframe}</span>
                            </div>

                            {/* Row 4: Reasoning */}
                            <p className="text-[11px] text-gray-400 line-clamp-2 hover:line-clamp-none transition-all cursor-pointer">
                                {c.reasoning}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Avoid shorting */}
                {modelData.avoidShorting && modelData.avoidShorting.length > 0 && (
                    <div className="px-5 pb-4">
                        <div className="text-[10px] text-yellow-400 uppercase font-bold mb-2">⚠️ Не шортить:</div>
                        <div className="space-y-1">
                            {modelData.avoidShorting.map((a, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                    <span className="text-yellow-400 font-bold">{a.symbol}</span>
                                    <span className="text-gray-500">{a.reason}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Risk note */}
                {modelData.marketRiskNote && (
                    <div className="px-5 pb-4">
                        <p className="text-[10px] text-gray-500 italic">⚠️ {modelData.marketRiskNote}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">📉 Гипотеза №2 — Шорт 24ч</h2>
                    <p className="text-gray-400 text-sm">
                        16ч данных → Claude Opus 4.6 vs DeepSeek v4 Pro • Альткоины на падение • Только Bybit
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    <button
                        onClick={triggerVerify}
                        className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50 rounded-lg text-sm font-medium transition"
                    >
                        ✅ Проверить
                    </button>
                    <button onClick={fetchHistory} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition">
                        🔄
                    </button>
                    <button
                        onClick={triggerRun}
                        disabled={isRunning || !!runningItem}
                        className="px-5 py-2.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                            <>📉 Запустить анализ</>
                        )}
                    </button>
                </div>
            </div>

            {/* Schedule info */}
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">⏰</div>
                <div>
                    <p className="text-sm text-red-300 font-semibold">Авто-запуск: 3 раза в день (08:00, 16:00, 00:00 МСК)</p>
                    <p className="text-xs text-gray-400 mt-0.5">Pipeline: CMC (losers+pumped+volatile) + Reddit (16ч) + Twitter (16ч) → Claude Opus 4.6 + DeepSeek v4 Pro параллельно</p>
                </div>
            </div>

            {/* Overall stats */}
            {verifiedItems.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 uppercase mb-1">Claude Opus 4.6</div>
                        <div className={`text-2xl font-bold ${claudeStats.winrate >= 60 ? 'text-emerald-400' : claudeStats.winrate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {claudeStats.winrate}%
                        </div>
                        <div className="text-[10px] text-gray-500">{claudeStats.totalHits}/{claudeStats.totalPicks} drops, {claudeStats.strongHits} strong</div>
                    </div>
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 uppercase mb-1">DeepSeek v4 Pro</div>
                        <div className={`text-2xl font-bold ${deepseekStats.winrate >= 60 ? 'text-emerald-400' : deepseekStats.winrate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {deepseekStats.winrate}%
                        </div>
                        <div className="text-[10px] text-gray-500">{deepseekStats.totalHits}/{deepseekStats.totalPicks} drops, {deepseekStats.strongHits} strong</div>
                    </div>
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 uppercase mb-1">Проверено</div>
                        <div className="text-2xl font-bold text-white">{verifiedItems.length}</div>
                        <div className="text-[10px] text-gray-500">анализов</div>
                    </div>
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 uppercase mb-1">Всего</div>
                        <div className="text-2xl font-bold text-white">{items.filter(i => i.status === 'success').length}</div>
                        <div className="text-[10px] text-gray-500">запусков</div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">❌ {error}</div>
            )}

            {/* Running */}
            {runningItem && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                    <svg className="animate-spin w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="text-yellow-400 text-sm font-semibold">Анализ выполняется... Обычно 2-5 минут (два AI параллельно).</span>
                </div>
            )}

            {/* Latest result — side by side */}
            {latestSuccess?.result && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                            Последний анализ — {latestSuccess.created_at ? new Date(latestSuccess.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                            <span>Reddit: {latestSuccess.reddit_posts_count}</span>
                            <span>Twitter: {latestSuccess.twitter_tweets_count}</span>
                            <span>CMC: {latestSuccess.result.metadata?.cmc_coins_analyzed}</span>
                            <span>Bybit: {latestSuccess.result.metadata?.bybit_symbols_available}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {renderModelCard(latestSuccess.result.claude_opus, '🧠 Claude Opus 4.6', 'from-purple-900/30 to-indigo-900/30')}
                        {renderModelCard(latestSuccess.result.deepseek_v4, '🔮 DeepSeek v4 Pro', 'from-blue-900/30 to-cyan-900/30')}
                    </div>

                    {/* Consensus picks (appear in both models) */}
                    {latestSuccess.result.claude_opus && latestSuccess.result.deepseek_v4 && (() => {
                        const claudeSymbols = new Set(latestSuccess.result.claude_opus?.shortCandidates?.map(c => c.symbol) || []);
                        const deepseekSymbols = latestSuccess.result.deepseek_v4?.shortCandidates?.map(c => c.symbol) || [];
                        const consensus = deepseekSymbols.filter(s => claudeSymbols.has(s));

                        if (consensus.length === 0) return null;

                        return (
                            <div className="mt-4 bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-bold text-emerald-400">🤝 Консенсус (оба AI согласны):</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {consensus.map(sym => (
                                        <span key={sym} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
                                            {sym} ↓
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">Монеты, которые оба AI предсказали к падению — наиболее надёжные шорт-кандидаты</p>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* History */}
            {items.filter(i => i.status === 'success' && i !== latestSuccess).length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">📊 История</h3>
                    {items.filter(i => i.status === 'success' && i !== latestSuccess).map(item => (
                        <details key={item.id} className="group">
                            <summary className="bg-brand-card border border-gray-800 rounded-xl p-4 cursor-pointer list-none hover:border-gray-700 transition">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500 font-mono">
                                            {item.created_at ? new Date(item.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            R:{item.reddit_posts_count} T:{item.twitter_tweets_count}
                                        </span>
                                        {item.result?.verified && (
                                            <>
                                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                    (item.result.claude_opus?.verification?.winrate || 0) >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    Claude: {item.result.claude_opus?.verification?.winrate || 0}%
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                                    (item.result.deepseek_v4?.verification?.winrate || 0) >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    DeepSeek: {item.result.deepseek_v4?.verification?.winrate || 0}%
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    <span className="text-gray-500 text-xs group-open:rotate-180 transition-transform">▼</span>
                                </div>
                            </summary>
                            <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {renderModelCard(item.result?.claude_opus || null, '🧠 Claude Opus 4.6', 'from-purple-900/30 to-indigo-900/30')}
                                {renderModelCard(item.result?.deepseek_v4 || null, '🔮 DeepSeek v4 Pro', 'from-blue-900/30 to-cyan-900/30')}
                            </div>
                        </details>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && items.length === 0 && !runningItem && (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-xl">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">📉</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Нет анализов</h3>
                    <p className="text-gray-400 max-w-md">
                        Нажмите «Запустить анализ» или дождитесь автозапуска (3 раза в день).
                    </p>
                </div>
            )}

            {/* Errors */}
            {items.filter(i => i.status === 'failed').length > 0 && (
                <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Ошибки</h3>
                    <div className="space-y-2">
                        {items.filter(i => i.status === 'failed').slice(0, 5).map(item => (
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

export default HypothesisV2;
