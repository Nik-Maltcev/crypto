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
    result: {
        predictions: Prediction[];
        market_summary: string;
        verified?: boolean;
        hits?: number;
        total?: number;
        winrate?: number;
    } | null;
}

const HypothesisResults: React.FC = () => {
    const [entries, setEntries] = useState<HypothesisEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchHistory = async () => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/hypothesis/history?limit=200`);
            if (resp.ok) {
                const data = await resp.json();
                if (data.success) setEntries(data.items.filter((e: HypothesisEntry) => e.result?.verified));
            }
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchHistory(); }, []);

    const exportCSV = () => {
        const rows = ['Дата,Час МСК,Монета,Прогноз,Уверенность%,Факт,Open,Close,Совпало'];
        entries.forEach(e => {
            if (!e.result?.predictions) return;
            const utcDate = new Date(e.created_at);
            const dateStr = `${utcDate.getUTCDate().toString().padStart(2,'0')}.${(utcDate.getUTCMonth()+1).toString().padStart(2,'0')}`;
            const h = utcDate.getUTCHours();
            const nextH = (h + 1) % 24;
            const hourStr = `${nextH.toString().padStart(2,'0')}:00`;
            e.result.predictions.forEach(p => {
                if (p.matched === undefined) return;
                rows.push(`${dateStr},${hourStr},${p.symbol},${p.direction},${p.confidence},${p.actual_direction || ''},${p.actual_open || ''},${p.actual_close || ''},${p.matched ? 'ДА' : 'НЕТ'}`);
            });
        });
        const csv = '\ufeff' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hypothesis_results_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) return <div className="flex justify-center py-20 text-gray-500">Загрузка...</div>;

    // Stats
    const allPredictions = entries.flatMap(e => e.result?.predictions?.filter(p => p.matched !== undefined) || []);
    const totalHits = allPredictions.filter(p => p.matched).length;
    const totalCount = allPredictions.length;
    const overallWR = totalCount > 0 ? Math.round((totalHits / totalCount) * 100) : 0;

    // Per coin stats
    const coins = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'BNB'];
    const coinStats = coins.map(coin => {
        const preds = allPredictions.filter(p => p.symbol === coin);
        const hits = preds.filter(p => p.matched).length;
        return { coin, hits, total: preds.length, wr: preds.length > 0 ? Math.round((hits / preds.length) * 100) : 0 };
    });

    // Group by date of PREDICTED hour (not creation time)
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const byDate: Record<string, HypothesisEntry[]> = {};
    entries.forEach(e => {
        const utcDate = new Date(e.created_at);
        // Predicted hour = creation hour + 1
        const predictedHour = new Date(utcDate.getTime() + 60 * 60 * 1000);
        const dateKey = `${predictedHour.getUTCFullYear()}-${(predictedHour.getUTCMonth()+1).toString().padStart(2,'0')}-${predictedHour.getUTCDate().toString().padStart(2,'0')}`;
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(e);
    });
    const sortedDays = Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a));

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">📊 Прогноз vs Гипотеза</h2>
                    <p className="text-gray-400 text-sm">Совпало ли направление прогноза с реальной 1ч свечой Binance. Логика: close ≥ open = Up.</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <button onClick={exportCSV}
                        className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium transition">
                        📥 CSV
                    </button>
                    <button onClick={() => { setIsLoading(true); fetchHistory(); }}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition">
                        🔄
                    </button>
                </div>
            </div>

            {totalCount === 0 ? (
                <div className="text-center p-10 bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                    Нет проверенных результатов. Прогнозы проверяются через ~2 часа после создания.
                </div>
            ) : (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className={`text-3xl font-bold ${overallWR >= 55 ? 'text-emerald-400' : overallWR >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{overallWR}%</div>
                            <div className="text-[10px] text-gray-500 uppercase">Общий винрейт</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-white">{totalHits}/{totalCount}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Совпало / Всего</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-white">{entries.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Часов проверено</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-white">{sortedDays.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Дней</div>
                        </div>
                    </div>

                    {/* Per coin */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {coinStats.map(c => (
                            <div key={c.coin} className={`bg-brand-card border rounded-xl p-3 text-center ${c.wr >= 55 ? 'border-emerald-500/30' : c.wr >= 50 ? 'border-yellow-500/30' : 'border-red-500/30'}`}>
                                <div className="text-sm font-bold text-white">{c.coin}</div>
                                <div className={`text-xl font-bold ${c.wr >= 55 ? 'text-emerald-400' : c.wr >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{c.wr}%</div>
                                <div className="text-[9px] text-gray-500">{c.hits}/{c.total}</div>
                            </div>
                        ))}
                    </div>

                    {/* Day-grouped entries (like Polymarket) */}
                    <div className="space-y-6">
                        {sortedDays.map(([dateKey, dayEntries]) => {
                            const dParts = dateKey.split('-');
                            const refDate = new Date(Date.UTC(+dParts[0], +dParts[1]-1, +dParts[2]));
                            const dateLabel = `${refDate.getUTCDate()} ${['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'][refDate.getUTCMonth()]} ${refDate.getUTCFullYear()}`;
                            const dayName = dayNames[refDate.getUTCDay()];
                            const dayPreds = dayEntries.flatMap(e => e.result?.predictions?.filter(p => p.matched !== undefined) || []);
                            const dayHits = dayPreds.filter(p => p.matched).length;
                            const dayTotal = dayPreds.length;
                            const dayWR = dayTotal > 0 ? Math.round((dayHits / dayTotal) * 100) : 0;

                            return (
                                <div key={dateKey}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dateLabel} ({dayName})</h3>
                                        <div className="flex-1 h-px bg-gray-800"></div>
                                        <span className={`text-xs font-bold ${dayWR >= 55 ? 'text-emerald-400' : dayWR >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{dayWR}% ({dayHits}/{dayTotal})</span>
                                        <span className="text-xs text-gray-600">{dayEntries.length} часов</span>
                                    </div>
                                    <div className="space-y-3">
                                        {dayEntries.map(entry => {
                                            const preds = entry.result?.predictions?.filter(p => p.matched !== undefined) || [];
                                            const hits = preds.filter(p => p.matched).length;
                                            const misses = preds.filter(p => !p.matched).length;
                                            const acc = preds.length > 0 ? Math.round((hits / preds.length) * 100) : 0;
                                            const isExpanded = expandedId === entry.id;
                                            const eDate = new Date(entry.created_at);
                                            const h = eDate.getUTCHours();
                                            const nextH = (h + 1) % 24;
                                            const endH = (nextH + 1) % 24;
                                            const hourLabel = `${nextH.toString().padStart(2,'0')}:00-${endH.toString().padStart(2,'0')}:00 МСК`;
                                            // ET = MSK - 7
                                            const etStart = (nextH - 7 + 24) % 24;
                                            const etEnd = (etStart + 1) % 24;
                                            const fmtET = (hr: number) => { const h12 = hr % 12 || 12; return `${h12}${hr < 12 ? 'AM' : 'PM'}`; };
                                            const etLabel = `${fmtET(etStart)}-${fmtET(etEnd)} ET`;

                                            return (
                                                <div key={entry.id} className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500/30 transition-colors">
                                                    <div className="p-4 flex items-center justify-between cursor-pointer"
                                                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-sm font-bold text-white">{hourLabel}</div>
                                                            <div className="text-xs text-blue-400 font-mono">{etLabel}</div>
                                                            <span className={`text-xs px-2 py-0.5 rounded ${acc >= 60 ? 'bg-emerald-500/20 text-emerald-400' : acc >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {acc}%
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="text-right">
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold">Счёт</div>
                                                                <div className="text-sm font-mono text-white">{hits}✅ / {misses}❌</div>
                                                            </div>
                                                            <div className="flex gap-0.5">
                                                                {preds.map((p, i) => (
                                                                    <div key={i}
                                                                        title={`${p.symbol}: ${p.direction} → ${p.actual_direction}`}
                                                                        className={`w-2.5 h-2.5 rounded-sm ${p.matched ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                                ))}
                                                            </div>
                                                            <svg className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>

                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 border-t border-gray-800/50">
                                                            <div className="mt-3 mb-2 text-[10px] text-gray-500 uppercase font-bold">
                                                                Логика: close ≥ open = UP | close &lt; open = DOWN
                                                            </div>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="text-gray-500 border-b border-gray-800">
                                                                            <th className="py-2 px-2 text-left">Монета</th>
                                                                            <th className="py-2 px-2 text-center">Прогноз</th>
                                                                            <th className="py-2 px-2 text-center">Conf</th>
                                                                            <th className="py-2 px-2 text-right">Open</th>
                                                                            <th className="py-2 px-2 text-right">Close</th>
                                                                            <th className="py-2 px-2 text-center">Факт</th>
                                                                            <th className="py-2 px-2 text-center">Результат</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {preds.map((p, i) => (
                                                                            <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                                                                <td className="py-1.5 px-2 font-bold text-white">{p.symbol}</td>
                                                                                <td className={`py-1.5 px-2 text-center font-bold ${p.direction === 'Up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                                    {p.direction === 'Up' ? '↑ UP' : '↓ DOWN'}
                                                                                </td>
                                                                                <td className="py-1.5 px-2 text-center text-gray-300">{p.confidence}%</td>
                                                                                <td className="py-1.5 px-2 text-right text-gray-300 font-mono">
                                                                                    {p.actual_open ? (p.actual_open < 1 ? p.actual_open.toFixed(4) : p.actual_open.toLocaleString('en-US', {maximumFractionDigits: 2})) : '—'}
                                                                                </td>
                                                                                <td className="py-1.5 px-2 text-right text-gray-300 font-mono">
                                                                                    {p.actual_close ? (p.actual_close < 1 ? p.actual_close.toFixed(4) : p.actual_close.toLocaleString('en-US', {maximumFractionDigits: 2})) : '—'}
                                                                                </td>
                                                                                <td className={`py-1.5 px-2 text-center font-bold ${p.actual_direction === 'Up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.actual_direction === 'Up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                                        {p.actual_direction === 'Up' ? '↑ UP' : '↓ DOWN'}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="py-1.5 px-2 text-center text-lg">
                                                                                    {p.matched ? '✅' : '❌'}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            {/* Summary bar */}
                                                            <div className="mt-3">
                                                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 text-center tracking-wider">
                                                                    Совпадение ({hits}✅ / {misses}❌)
                                                                </div>
                                                                <div className="flex gap-[2px] justify-center">
                                                                    {preds.map((p, i) => (
                                                                        <div key={i}
                                                                            title={`${p.symbol}: ${p.direction} → ${p.actual_direction} ${p.matched ? '✅' : '❌'}`}
                                                                            className={`w-3 h-3 rounded-sm ${p.matched ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default HypothesisResults;
