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

    const fetchHistory = async () => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/hypothesis/history?limit=100`);
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">📊 Прогноз vs Гипотеза</h2>
                    <p className="text-gray-400 text-sm">Результаты почасовых прогнозов: совпало ли направление с реальной свечой Binance</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    <button onClick={exportCSV}
                        className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium transition">
                        📥 CSV
                    </button>
                    <button onClick={() => { setIsLoading(true); fetchHistory(); }}
                        className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50 rounded-lg text-sm font-medium transition">
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
                            <div className="text-3xl font-bold text-white">{coins.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Монет</div>
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

                    {/* By day */}
                    {(() => {
                        const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                        const byDate: Record<string, { date: string; day: string; predictions: Prediction[] }> = {};
                        entries.forEach(e => {
                            if (!e.result?.predictions) return;
                            const utcDate = new Date(e.created_at);
                            const dateKey = `${utcDate.getUTCFullYear()}-${(utcDate.getUTCMonth()+1).toString().padStart(2,'0')}-${utcDate.getUTCDate().toString().padStart(2,'0')}`;
                            const dateStr = `${utcDate.getUTCDate().toString().padStart(2,'0')}.${(utcDate.getUTCMonth()+1).toString().padStart(2,'0')}`;
                            const day = dayNames[utcDate.getUTCDay()];
                            if (!byDate[dateKey]) byDate[dateKey] = { date: dateStr, day, predictions: [] };
                            byDate[dateKey].predictions.push(...e.result.predictions.filter(p => p.matched !== undefined));
                        });
                        const days = Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a));

                        return (
                            <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">📅 По дням</h3>
                                <div className="space-y-2">
                                    {days.map(([key, d]) => {
                                        const hits = d.predictions.filter(p => p.matched).length;
                                        const total = d.predictions.length;
                                        const wr = total > 0 ? Math.round((hits / total) * 100) : 0;
                                        return (
                                            <div key={key} className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-gray-400 w-14">{d.date}</span>
                                                <span className="text-xs font-bold text-white bg-gray-800 px-2 py-0.5 rounded w-8 text-center">{d.day}</span>
                                                <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                                                    <div className={`h-full rounded-full ${wr >= 55 ? 'bg-emerald-500' : wr >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${wr}%` }}></div>
                                                </div>
                                                <span className={`text-sm font-bold w-12 text-right ${wr >= 55 ? 'text-emerald-400' : wr >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{wr}%</span>
                                                <span className="text-[10px] text-gray-500 w-10">{hits}/{total}</span>
                                                <div className="flex gap-[2px]">
                                                    {d.predictions.slice(-12).map((p, i) => (
                                                        <div key={i} className={`w-2.5 h-2.5 rounded-sm ${p.matched ? 'bg-emerald-500' : 'bg-red-500'}`} title={`${p.symbol}: ${p.direction} → ${p.actual_direction}`}></div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Table */}
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Детальная таблица</h3>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-900">
                                    <tr className="text-gray-500 border-b border-gray-800">
                                        <th className="py-2 px-2 text-left">Дата</th>
                                        <th className="py-2 px-2 text-left">Час МСК</th>
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
                                    {entries.map(entry => {
                                        const utcDate = new Date(entry.created_at);
                                        const dateStr = `${utcDate.getUTCDate().toString().padStart(2,'0')}.${(utcDate.getUTCMonth()+1).toString().padStart(2,'0')}`;
                                        const h = utcDate.getUTCHours();
                                        const nextH = (h + 1) % 24;
                                        const endH = (nextH + 1) % 24;
                                        const hourStr = `${nextH.toString().padStart(2,'0')}:00-${endH.toString().padStart(2,'0')}:00`;

                                        return (entry.result?.predictions || []).filter(p => p.matched !== undefined).map((p, i) => (
                                            <tr key={`${entry.id}-${i}`} className={`border-b border-gray-800/30 ${p.matched ? 'hover:bg-emerald-500/5' : 'hover:bg-red-500/5'}`}>
                                                <td className="py-1.5 px-2 text-gray-400 font-mono">{dateStr}</td>
                                                <td className="py-1.5 px-2 text-blue-400 font-mono">{hourStr}</td>
                                                <td className="py-1.5 px-2 font-bold text-white">{p.symbol}</td>
                                                <td className={`py-1.5 px-2 text-center font-bold ${p.direction === 'Up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {p.direction === 'Up' ? '↑' : '↓'} {p.direction}
                                                </td>
                                                <td className="py-1.5 px-2 text-center text-gray-300">{p.confidence}%</td>
                                                <td className="py-1.5 px-2 text-right font-mono text-gray-400">
                                                    {p.actual_open ? (p.actual_open < 1 ? p.actual_open.toFixed(4) : p.actual_open.toLocaleString('en-US', {maximumFractionDigits: 2})) : '—'}
                                                </td>
                                                <td className="py-1.5 px-2 text-right font-mono text-gray-300">
                                                    {p.actual_close ? (p.actual_close < 1 ? p.actual_close.toFixed(4) : p.actual_close.toLocaleString('en-US', {maximumFractionDigits: 2})) : '—'}
                                                </td>
                                                <td className={`py-1.5 px-2 text-center font-bold ${p.actual_direction === 'Up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {p.actual_direction === 'Up' ? '↑' : '↓'} {p.actual_direction}
                                                </td>
                                                <td className="py-1.5 px-2 text-center text-lg">
                                                    {p.matched ? '✅' : '❌'}
                                                </td>
                                            </tr>
                                        ));
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default HypothesisResults;
