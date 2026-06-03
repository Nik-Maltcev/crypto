import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface ShortCandidate {
    symbol: string;
    name: string;
    currentPrice: number;
    targetPrice24h: number;
    expectedChange: number;
    expectedDrop?: number;
    confidence: number;
    timeframe: string;
    catalyst: string;
    reasoning: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    entryZone: string;
    stopLoss: number;
    exchanges?: string[];
    snapshots?: { label: string; time: string; price: number; change: number; changeFromStart?: number }[];
    // Verification fields
    actualPrice24h?: number;
    actualChange24h?: number;
    hit?: boolean;
    strongHit?: boolean;
}

interface ModelResult {
    summary: string;
    analysisTime?: string;
    shortCandidates: ShortCandidate[];
    longCandidates?: ShortCandidate[];
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
    claude_opus?: ModelResult | null;
    deepseek_v4: ModelResult | null;
    metadata: {
        reddit_posts: number;
        twitter_tweets: number;
        cmc_coins_analyzed: number;
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
    const [nextVerify, setNextVerify] = useState('');
    
    // P&L Calculator settings
    const [betSize, setBetSize] = useState(100);
    const [leverage, setLeverage] = useState(10);
    const [stopLoss, setStopLoss] = useState(3);

    // Exchanges available in Russia (verified May 2026)
    const RU_EXCHANGES = new Set(['Bybit', 'OKX', 'Bitget', 'BingX', 'MEXC', 'KuCoin', 'Gate.io', 'Gate', 'CoinEx', 'LBank', 'XT.COM', 'BitMart', 'Pionex', 'BTCC', 'BYDFi', 'CoinTR', 'DigiFinex', 'Bitrue', 'AscendEX (BitMax)', 'BloFin', 'WEEX']);

    // Timer: next verification countdown
    useEffect(() => {
        const calcNext = () => {
            const now = new Date();
            const utcH = now.getUTCHours();
            const utcM = now.getUTCMinutes();
            // Verification runs every hour at XX:30
            const minutesUntil = utcM < 30 ? 30 - utcM : 90 - utcM;
            const h = Math.floor(minutesUntil / 60);
            const m = minutesUntil % 60;
            setNextVerify(h > 0 ? `${h}ч ${m}м` : `${m}м`);
        };
        calcNext();
        const interval = setInterval(calcNext, 60000);
        return () => clearInterval(interval);
    }, []);

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
    const runningItem = items.find(i => {
        if (i.status !== 'running') return false;
        // Ignore stuck items (running > 30 min)
        if (i.created_at) {
            const elapsed = (Date.now() - new Date(i.created_at).getTime()) / 60000;
            if (elapsed > 30) return false;
        }
        return true;
    });

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
                            <span className={`text-sm px-2 py-0.5 rounded font-bold ${
                                modelData.verification.winrate >= 60 ? 'bg-emerald-500/20 text-emerald-400' :
                                modelData.verification.winrate >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                            }`}>
                                {modelData.verification.hits}/{modelData.verification.total} ({modelData.verification.winrate}%)
                            </span>
                        )}
                    </div>
                    <span className="text-sm text-gray-400">{modelData.shortCandidates?.length || 0} shorts</span>
                </div>

                {/* Summary */}
                {modelData.summary && (
                    <div className="px-5 py-3 border-b border-gray-800/50">
                        <p className="text-sm text-gray-400 italic">{modelData.summary}</p>
                    </div>
                )}

                {/* Short candidates */}
                <div className="p-4">
                    <div className="text-sm text-red-400 uppercase font-bold mb-3">📉 Шорт-кандидаты</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {modelData.shortCandidates?.map((c, idx) => (
                        <div key={c.symbol} className={`rounded-xl p-4 border ${
                            c.strongHit ? 'bg-emerald-500/10 border-emerald-500/30' :
                            c.hit === true ? 'bg-emerald-500/5 border-emerald-500/20' :
                            c.hit === false ? 'bg-red-500/5 border-red-500/20' :
                            'bg-gray-900/50 border-gray-700/50'
                        }`}>
                            {/* Header: Symbol + confidence */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg font-bold text-white">{c.symbol}</span>
                                    <span className={`text-sm px-1.5 py-0.5 rounded border font-bold ${getRiskColor(c.riskLevel)}`}>
                                        {c.riskLevel}
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-indigo-400">{c.confidence}%</span>
                            </div>

                            {/* Prices row */}
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <div className="text-sm text-gray-500">Сейчас</div>
                                    <div className="text-sm font-mono text-white">{formatPrice(c.currentPrice)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500">Цель</div>
                                    <div className="text-sm font-mono text-red-400">{formatPrice(c.targetPrice24h)}</div>
                                </div>
                            </div>

                            {/* Change + SL */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-red-400">{(c.expectedChange || c.expectedDrop)?.toFixed(1)}%</span>
                                <span className="text-sm text-gray-500">SL: {formatPrice(c.stopLoss)}</span>
                            </div>

                            {/* Exchanges */}
                            {c.exchanges && c.exchanges.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {c.exchanges.map(ex => (
                                        <span key={ex} className={`text-sm px-1.5 py-0.5 rounded border ${
                                            RU_EXCHANGES.has(ex) 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                                : 'bg-gray-800 text-gray-500 border-gray-700'
                                        }`}>
                                            {RU_EXCHANGES.has(ex) ? '🇷🇺 ' : ''}{ex}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Verification */}
                            {c.actualChange24h !== undefined && (
                                <div className={`rounded px-2 py-1 mb-2 flex items-center justify-between ${
                                    c.strongHit ? 'bg-emerald-500/15' : c.hit ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                }`}>
                                    <span className="text-sm font-bold">
                                        {c.strongHit ? '🎯' : c.hit ? '✅' : '❌'}
                                    </span>
                                    <span className={`text-sm font-bold font-mono ${c.actualChange24h < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {c.actualChange24h >= 0 ? '+' : ''}{c.actualChange24h.toFixed(1)}%
                                    </span>
                                </div>
                            )}

                            {/* Snapshots (6h price tracking) */}
                            {c.snapshots && c.snapshots.length > 0 && (
                                <div className="flex gap-1 mb-2 overflow-x-auto">
                                    {c.snapshots.map((s, i) => (
                                        <div key={i} className="flex-shrink-0 text-center px-1.5 py-0.5 rounded bg-gray-800/50 border border-gray-700/50">
                                            <div className="text-sm text-gray-500">{s.label}</div>
                                            <div className={`text-sm font-bold ${s.change < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {s.change >= 0 ? '+' : ''}{s.change.toFixed(1)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Catalyst */}
                            <div className="mb-1">
                                <span className="text-sm text-orange-400">{c.catalyst}</span>
                            </div>

                            {/* Reasoning */}
                            <p className="text-sm text-gray-500 line-clamp-2 hover:line-clamp-none cursor-pointer">
                                {c.reasoning}
                            </p>

                            <div className="text-sm text-gray-600 mt-1">⏱ {c.timeframe}</div>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Long candidates */}
                {/* Avoid shorting */}
                {modelData.avoidShorting && modelData.avoidShorting.length > 0 && (
                    <div className="px-5 pb-4">
                        <div className="text-sm text-yellow-400 uppercase font-bold mb-2">⚠️ Не шортить:</div>
                        <div className="space-y-1">
                            {modelData.avoidShorting.map((a, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
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
                        <p className="text-sm text-gray-500 italic">⚠️ {modelData.marketRiskNote}</p>
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
                    <h2 className="text-2xl font-bold text-white mb-2">📉 Гипотеза — Шорт 24ч</h2>
                    <p className="text-gray-400 text-sm">
                        16ч данных → DeepSeek v4 Pro • Альткоины на падение
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
            <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">⏰</div>
                    <div>
                        <p className="text-sm text-red-300 font-semibold">Авто-запуск: 1 раз в день (08:00 МСК)</p>
                        <p className="text-sm text-gray-400 mt-0.5">Pipeline: CMC (losers+pumped+volatile) + Reddit (16ч) + Twitter (16ч) → DeepSeek v4 Pro</p>
                    </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-sm text-gray-500 uppercase">Верификация через</div>
                    <div className="text-sm font-bold text-cyan-400">{nextVerify}</div>
                </div>
            </div>

            {/* Overall stats */}
            {verifiedItems.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-500 uppercase mb-1">DeepSeek v4 Pro</div>
                        <div className={`text-2xl font-bold ${deepseekStats.winrate >= 60 ? 'text-emerald-400' : deepseekStats.winrate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {deepseekStats.winrate}%
                        </div>
                        <div className="text-sm text-gray-500">{deepseekStats.totalHits}/{deepseekStats.totalPicks} drops, {deepseekStats.strongHits} strong</div>
                    </div>
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-500 uppercase mb-1">Проверено</div>
                        <div className="text-2xl font-bold text-white">{verifiedItems.length}</div>
                        <div className="text-sm text-gray-500">анализов</div>
                    </div>
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-500 uppercase mb-1">Всего</div>
                        <div className="text-2xl font-bold text-white">{items.filter(i => i.status === 'success').length}</div>
                        <div className="text-sm text-gray-500">запусков</div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">❌ {error}</div>
            )}

            {/* P&L Calculator */}
            {latestSuccess?.result && (() => {
                const candidates = latestSuccess.result.deepseek_v4?.shortCandidates?.filter((c: ShortCandidate) => c.actualChange24h !== undefined || (c.snapshots && c.snapshots.length > 0)) || [];
                if (candidates.length === 0) return null;

                const BET = betSize;
                const LEVERAGE = leverage;
                const STOP_LOSS_PCT = stopLoss;
                const COMMISSION_PCT = 0.1;

                // Calculate P&L for a single change value (no SL tracking)
                const calcRawPnl = (change: number, stopped: boolean) => {
                    const shortChange = -change;
                    const eff = stopped ? -(STOP_LOSS_PCT) : shortChange;
                    const gross = BET * LEVERAGE * (eff / 100);
                    const commission = BET * LEVERAGE * (COMMISSION_PCT / 100);
                    return gross - commission;
                };

                // Check if stop-loss was hit by scanning snapshots in order
                const findStopPoint = (c: ShortCandidate): { stopped: boolean; stoppedAtLabel: string | null } => {
                    const snaps = c.snapshots || [];
                    for (const snap of snaps) {
                        const changeFromStart = snap.changeFromStart ?? snap.change;
                        // For short: price going UP = bad. If price rose > SL% from start, SL triggered
                        if (changeFromStart > STOP_LOSS_PCT) {
                            return { stopped: true, stoppedAtLabel: snap.label };
                        }
                    }
                    return { stopped: false, stoppedAtLabel: null };
                };

                const allLabels: string[] = [];
                candidates.forEach((c: ShortCandidate) => {
                    c.snapshots?.forEach(s => {
                        if (!allLabels.includes(s.label)) allLabels.push(s.label);
                    });
                });
                allLabels.sort((a, b) => parseInt(a) - parseInt(b));

                // Build trades with proper SL logic
                let totalPnl = 0;
                const trades = candidates.map((c: ShortCandidate) => {
                    const { stopped, stoppedAtLabel } = findStopPoint(c);
                    const finalChange = c.actualChange24h || 0;
                    const pnl = calcRawPnl(finalChange, stopped);
                    totalPnl += pnl;

                    // For each snapshot column: show P&L up to that point (or SL if already stopped)
                    let alreadyStopped = false;
                    const snaps = allLabels.map(label => {
                        const snap = c.snapshots?.find(s => s.label === label);
                        if (!snap) return null;
                        if (alreadyStopped) return calcRawPnl(0, true); // already stopped, show SL loss
                        const changeFromStart = snap.changeFromStart ?? snap.change;
                        if (changeFromStart > STOP_LOSS_PCT) {
                            alreadyStopped = true;
                            return calcRawPnl(0, true); // SL hit at this point
                        }
                        return calcRawPnl(changeFromStart, false);
                    });

                    return { symbol: c.symbol, pnl, stopped, stoppedAtLabel, snaps };
                });

                // Recalculate snapshot totals
                const snapshotTotals = allLabels.map((label, colIdx) => {
                    let total = 0;
                    trades.forEach(t => {
                        if (t.snaps[colIdx] !== null) total += t.snaps[colIdx]!;
                    });
                    return { label, total };
                });

                const totalInvested = candidates.length * BET;

                return (
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-bold text-gray-400 uppercase">💰 Калькулятор P&L</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <label className="text-sm text-gray-500 block mb-1">Ставка ($)</label>
                                <input type="number" value={betSize} onChange={e => setBetSize(Number(e.target.value))} 
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block mb-1">Плечо (x)</label>
                                <input type="number" value={leverage} onChange={e => setLeverage(Number(e.target.value))} 
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-500 block mb-1">Стоп-лосс (%)</label>
                                <input type="number" value={stopLoss} onChange={e => setStopLoss(Number(e.target.value))} 
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 outline-none" />
                            </div>
                        </div>

                        <div className="text-sm text-gray-500 mb-3">
                            Позиция: ${BET * LEVERAGE} на монету • Комиссия: {COMMISSION_PCT}% • {candidates.length} монет
                        </div>

                        {allLabels.length > 0 && (
                            <div className="overflow-x-auto mb-3">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-gray-700">
                                            <th className="text-left py-1 pr-2">Монета</th>
                                            {allLabels.map(l => <th key={l} className="text-center px-1 py-1">{l}</th>)}
                                            <th className="text-right pl-2 py-1">Итого</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trades.map(t => (
                                            <tr key={t.symbol} className="border-b border-gray-800/50">
                                                <td className="py-1 pr-2 font-bold text-white">{t.symbol}</td>
                                                {t.snaps.map((s, i) => (
                                                    <td key={i} className={`text-center px-1 py-1 font-mono ${s === null ? 'text-gray-700' : s >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {s === null ? '—' : `${s >= 0 ? '+' : ''}${s.toFixed(0)}`}
                                                    </td>
                                                ))}
                                                <td className={`text-right pl-2 py-1 font-bold font-mono ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(0)}$
                                                    {t.stopped && <span className="text-yellow-400 ml-1 text-[9px]">SL</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="border-t border-gray-600 font-bold">
                                            <td className="py-1.5 pr-2 text-gray-400">ВСЕГО</td>
                                            {snapshotTotals.map((st, i) => (
                                                <td key={i} className={`text-center px-1 py-1.5 font-mono ${st.total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {st.total >= 0 ? '+' : ''}{st.total.toFixed(0)}
                                                </td>
                                            ))}
                                            <td className={`text-right pl-2 py-1.5 font-mono text-base ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(0)}$
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                            <span className="text-sm text-gray-400">Маржа: ${totalInvested} ({candidates.length} монет)</span>
                            <span className={`text-lg font-bold ${totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(0)}$ ({totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(0) : 0}%)
                            </span>
                        </div>
                    </div>
                );
            })()}

            {/* Running */}
            {runningItem && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                    <svg className="animate-spin w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <span className="text-yellow-400 text-sm font-semibold">Анализ выполняется... Обычно 2-5 минут.</span>
                </div>
            )}

            {/* Latest result — side by side */}
            {latestSuccess?.result && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                            Последний анализ — {latestSuccess.created_at ? new Date(latestSuccess.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : ''}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>Reddit: {latestSuccess.reddit_posts_count}</span>
                            <span>Twitter: {latestSuccess.twitter_tweets_count}</span>
                            <span>CMC: {latestSuccess.result.metadata?.cmc_coins_analyzed}</span>
                        </div>
                    </div>

                    <div>
                        {renderModelCard(latestSuccess.result.deepseek_v4, '🔮 DeepSeek v4 Pro', 'from-blue-900/30 to-cyan-900/30')}
                    </div>
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
                                        <span className="text-sm text-gray-500 font-mono">
                                            {item.created_at ? new Date(item.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                        {item.result?.verified && (
                                            <>
                                                <span className={`text-sm px-2 py-0.5 rounded font-bold ${
                                                    (item.result.deepseek_v4?.verification?.winrate || 0) >= 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                }`}>
                                                    Винрейт: {item.result.deepseek_v4?.verification?.winrate || 0}%
                                                </span>
                                            </>
                                        )}
                                        {/* P&L in history summary */}
                                        {(() => {
                                            const sc = item.result?.deepseek_v4?.shortCandidates?.filter((c: ShortCandidate) => c.actualChange24h !== undefined) || [];
                                            if (sc.length === 0) return null;
                                            let pnl = 0;
                                            const slPct = 3;
                                            sc.forEach((c: ShortCandidate) => {
                                                // Check if SL was hit in snapshots
                                                let stopped = false;
                                                for (const snap of (c.snapshots || [])) {
                                                    const cfs = snap.changeFromStart ?? snap.change;
                                                    if (cfs > slPct) { stopped = true; break; }
                                                }
                                                const shortChange = -(c.actualChange24h || 0);
                                                const eff = stopped ? -slPct : shortChange;
                                                const gross = 100 * 10 * (eff / 100);
                                                const commission = 100 * 10 * (0.1 / 100);
                                                pnl += gross - commission;
                                            });
                                            return (
                                                <span className={`text-sm px-2 py-0.5 rounded font-bold font-mono ${pnl >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)}$
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <span className="text-gray-500 text-sm group-open:rotate-180 transition-transform">▼</span>
                                </div>
                            </summary>
                            <div className="mt-2">
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
                        Нажмите «Запустить анализ» или дождитесь автозапуска (1 раз в день).
                    </p>
                </div>
            )}

            {/* Errors */}
            {items.filter(i => i.status === 'failed').length > 0 && (
                <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Ошибки</h3>
                    <div className="space-y-2">
                        {items.filter(i => i.status === 'failed').slice(0, 5).map(item => (
                            <div key={item.id} className="flex items-center gap-3 text-sm">
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
