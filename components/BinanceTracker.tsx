import React, { useState, useEffect } from 'react';
import { ForecastTracking } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

// Helper: get predicted direction for a given hour index
function getPredDir(t: ForecastTracking, hourIdx: number): string {
    const forecast = t.hourly_forecast || [];
    if (hourIdx >= forecast.length) return '';
    const curPrice = forecast[hourIdx]?.price;
    const prevPrice = hourIdx > 0 ? forecast[hourIdx - 1]?.price : t.start_price;
    if (curPrice == null || prevPrice == null) return '';
    if (curPrice === prevPrice) return '=';
    return curPrice > prevPrice ? '\u2191' : '\u2193';
}

// Helper: get binance direction for a given hour index
function getBinDir(t: ForecastTracking, hourIdx: number): string {
    const bp = t.binance_prices || [];
    if (hourIdx >= bp.length) return '';
    const curPrice = bp[hourIdx]?.close_price;
    const prevPrice = hourIdx > 0 ? bp[hourIdx - 1]?.close_price : t.start_price;
    if (curPrice == null || prevPrice == null) return '';
    if (curPrice === prevPrice) return '=';
    return curPrice > prevPrice ? '\u2191' : '\u2193';
}

const BinanceTracker: React.FC = () => {
    const [trackings, setTrackings] = useState<ForecastTracking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchTrackings = async () => {
        setIsLoading(true);
        setError('');
        try {
            const resp = await fetch(`${BACKEND_URL}/api/forecast/active`);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            if (data.success) setTrackings(data.items);
        } catch (e: any) { setError(e.message); }
        finally { setIsLoading(false); }
    };

    const forceUpdate = async () => {
        try {
            await fetch(`${BACKEND_URL}/api/forecast/force_update`, { method: 'POST' });
            setTimeout(fetchTrackings, 3000);
        } catch (e: any) { alert('Error: ' + e.message); }
    };

    useEffect(() => { fetchTrackings(); }, []);

    const getColor = (pred: string) => {
        if (pred === 'Bullish') return { text: 'text-emerald-400', bg: 'bg-emerald-500' };
        if (pred === 'Bearish') return { text: 'text-red-400', bg: 'bg-red-500' };
        return { text: 'text-yellow-400', bg: 'bg-yellow-500' };
    };

    const accuracy = (bp: ForecastTracking['binance_prices']) => {
        if (!bp || bp.length === 0) return 0;
        const hits = bp.filter(p => p.matched === true).length;
        return Math.round((hits / bp.length) * 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{'\u041F\u0440\u043E\u0433\u043D\u043E\u0437 vs Binance'}</h2>
                    <p className="text-gray-400 text-sm">
                        {'\u041F\u043E\u0447\u0430\u0441\u043E\u0432\u043E\u0435 \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435 AI-\u043F\u0440\u043E\u0433\u043D\u043E\u0437\u0430 \u0441 \u0446\u0435\u043D\u0430\u043C\u0438 \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u044F Binance'}
                    </p>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                    <button onClick={() => {
                        // CSV export with direction columns
                        const header = '\u0414\u0430\u0442\u0430,\u041C\u043E\u043D\u0435\u0442\u0430,\u041F\u0440\u043E\u0433\u043D\u043E\u0437,\u0423\u0432\u0435\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u044C%,\u0421\u0442\u0430\u0440\u0442$,\u0427\u0430\u0441,Binance$,\u041F\u0440\u043E\u0433\u043D\u043E\u0437$,\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u0430,\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 Binance,\u0421\u043E\u0432\u043F\u0430\u043B\u043E';
                        const rows = [header];
                        trackings.forEach(t => {
                            const date = new Date(t.created_at).toLocaleDateString('ru-RU');
                            (t.binance_prices || []).forEach((bp, idx) => {
                                const pDir = getPredDir(t, idx);
                                const bDir = getBinDir(t, idx);
                                rows.push(`${date},${t.symbol},${t.prediction},${t.confidence},${t.start_price},${bp.hour},${bp.close_price},${bp.predicted_price || ''},${pDir === '\u2191' ? '\u2191 \u0420\u043E\u0441\u0442' : pDir === '=' ? '= \u0424\u043B\u044D\u0442' : '\u2193 \u041F\u0430\u0434\u0435\u043D\u0438\u0435'},${bDir === '\u2191' ? '\u2191 \u0420\u043E\u0441\u0442' : bDir === '=' ? '= \u0424\u043B\u044D\u0442' : '\u2193 \u041F\u0430\u0434\u0435\u043D\u0438\u0435'},${bp.matched === true ? '\u0414\u0410' : bp.matched === false ? '\u041D\u0415\u0422' : ''}`);
                            });
                        });
                        const csv = '\uFEFF' + rows.join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `binance_forecast_${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                        className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-medium transition">
                        {'\uD83D\uDCE5 CSV'}
                    </button>
                    <button onClick={forceUpdate}
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-medium transition">
                        {'\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0446\u0435\u043D\u044B'}
                    </button>
                    <button onClick={fetchTrackings} disabled={isLoading}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition disabled:opacity-50">
                        {'\uD83D\uDD04'}
                    </button>
                </div>
            </div>

            {isLoading && !trackings.length ? (
                <div className="flex justify-center py-20 text-gray-500">{'\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...'}</div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl">{error}</div>
            ) : !trackings.length ? (
                <div className="text-center p-10 bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                    {'\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445. \u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0430\u043D\u0430\u043B\u0438\u0437 \u2014 \u0442\u0440\u0435\u043A\u0438\u043D\u0433 Binance \u043D\u0430\u0447\u043D\u0451\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438.'}
                </div>
            ) : (
                <div className="space-y-6">
                    {(() => {
                        const groups: Record<string, ForecastTracking[]> = {};
                        trackings.forEach(t => {
                            const dateKey = t.status === 'active'
                                ? '\u23F3 \u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435'
                                : new Date(t.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                            if (!groups[dateKey]) groups[dateKey] = [];
                            groups[dateKey].push(t);
                        });
                        const sortedKeys = Object.keys(groups).sort((a, b) => {
                            if (a === '\u23F3 \u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435') return -1;
                            if (b === '\u23F3 \u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435') return 1;
                            const dateA = new Date(groups[a][0]?.created_at || 0).getTime();
                            const dateB = new Date(groups[b][0]?.created_at || 0).getTime();
                            return dateB - dateA;
                        });
                        return sortedKeys.map(dateKey => (
                            <div key={dateKey}>
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dateKey}</h3>
                                    <div className="flex-1 h-px bg-gray-800"></div>
                                </div>
                                <div className="space-y-3">
                    {groups[dateKey].map(t => {
                        const color = getColor(t.prediction);
                        const bp = t.binance_prices || [];
                        const hits = bp.filter(p => p.matched === true).length;
                        const misses = bp.filter(p => p.matched === false).length;
                        const acc = accuracy(bp);
                        const isExpanded = expandedId === t.id;
                        const lastBinance = bp.length > 0 ? bp[bp.length - 1] : null;
                        const changeFromStart = lastBinance ? ((lastBinance.close_price - t.start_price) / t.start_price * 100) : 0;

                        const chartData = t.hourly_forecast.map((fp) => {
                            const binance = bp.find(b => b.hour === fp.hourOffset);
                            return {
                                hour: `${fp.hourOffset}\u0447`,
                                predicted: fp.price,
                                binance: binance?.close_price ?? null,
                                matched: binance?.matched ?? null,
                            };
                        });

                        return (
                            <div key={t.id} className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden hover:border-yellow-500/30 transition-colors">
                                <div className="p-4 flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="text-xl font-bold text-white">{t.symbol}</div>
                                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${color.text} ${color.bg}/20`}>
                                            {t.prediction} ({t.confidence}%)
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            t.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                            {t.status === 'active' ? `\u23F3 ${bp.length}/24\u0447` : '\u2705 \u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043D'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">{'\u0422\u043E\u0447\u043D\u043E\u0441\u0442\u044C'}</div>
                                            <div className={`text-lg font-bold ${acc >= 60 ? 'text-emerald-400' : acc >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {acc}%
                                            </div>
                                        </div>
                                        {lastBinance && (
                                            <div className="text-right">
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">Binance</div>
                                                <div className="text-sm font-mono text-white">${lastBinance.close_price.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</div>
                                                <div className={`text-xs ${changeFromStart >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {changeFromStart > 0 ? '+' : ''}{changeFromStart.toFixed(2)}%
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex gap-0.5">
                                            {bp.slice(-12).map((p, i) => {
                                                const idx = bp.length > 12 ? bp.length - 12 + i : i;
                                                const pD = getPredDir(t, idx);
                                                return (
                                                    <div key={i}
                                                        title={`${p.hour}\u0447: ${pD} pred=$${p.predicted_price || '?'} | Binance=$${p.close_price} ${p.matched ? '\u2705' : '\u274C'}`}
                                                        className={`w-2.5 h-2.5 rounded-sm ${
                                                            p.matched === true ? 'bg-emerald-500' :
                                                            p.matched === false ? 'bg-red-500' : 'bg-gray-700'
                                                        }`} />
                                                );
                                            })}
                                        </div>
                                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-gray-800/50">
                                        <div className="flex justify-between items-center mt-3 mb-2">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span>{'\u0421\u0442\u0430\u0440\u0442'}: <span className="text-white font-mono">${t.start_price.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</span></span>
                                            </div>
                                            <div className="flex gap-4 text-[10px] text-gray-500 uppercase font-bold">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block"></span> {'\u041F\u0440\u043E\u0433\u043D\u043E\u0437'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-sm bg-yellow-400 inline-block"></span> Binance
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id={`bpred-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id={`breal-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#FBBF24" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="hour" stroke="#4B5563" fontSize={11} tickMargin={8} />
                                                    <YAxis stroke="#4B5563" fontSize={11} width={70} domain={['auto', 'auto']}
                                                        tickFormatter={(v) => `${Number(v).toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                                                        labelStyle={{ color: '#9CA3AF' }}
                                                        formatter={(value: any, name: string) => {
                                                            if (value === null) return ['\u2014', name === 'predicted' ? '\u041F\u0440\u043E\u0433\u043D\u043E\u0437' : 'Binance'];
                                                            return [`${Number(value).toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 5 })}`, name === 'predicted' ? '\u041F\u0440\u043E\u0433\u043D\u043E\u0437' : 'Binance'];
                                                        }}
                                                    />
                                                    <ReferenceLine y={t.start_price} stroke="#4B5563" strokeDasharray="3 3" />
                                                    <Area type="monotone" dataKey="predicted" stroke="#6366F1" strokeWidth={2}
                                                        fill={`url(#bpred-${t.id})`} connectNulls />
                                                    <Area type="monotone" dataKey="binance" stroke="#FBBF24" strokeWidth={2}
                                                        fill={`url(#breal-${t.id})`} connectNulls />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Direction table */}
                                        <div className="mt-3 overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="text-gray-500 border-b border-gray-800">
                                                        <th className="py-1 px-1 text-left">{'\u0427\u0430\u0441'}</th>
                                                        <th className="py-1 px-1 text-right">{'\u041F\u0440\u043E\u0433\u043D\u043E\u0437$'}</th>
                                                        <th className="py-1 px-1 text-center">{'\u041D\u0430\u043F\u0440. \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u0430'}</th>
                                                        <th className="py-1 px-1 text-right">Binance$</th>
                                                        <th className="py-1 px-1 text-center">{'\u041D\u0430\u043F\u0440. Binance'}</th>
                                                        <th className="py-1 px-1 text-center">{'\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {bp.map((p, idx) => {
                                                        const pDir = getPredDir(t, idx);
                                                        const bDir = getBinDir(t, idx);
                                                        const pDirClass = pDir === '\u2191' ? 'bg-emerald-500/20 text-emerald-400' : pDir === '=' ? 'bg-gray-500/20 text-gray-400' : 'bg-red-500/20 text-red-400';
                                                        const pDirLabel = pDir === '\u2191' ? '\u2191 \u0420\u043E\u0441\u0442' : pDir === '=' ? '= \u0424\u043B\u044D\u0442' : '\u2193 \u041F\u0430\u0434\u0435\u043D\u0438\u0435';
                                                        const bDirClass = bDir === '\u2191' ? 'bg-emerald-500/20 text-emerald-400' : bDir === '=' ? 'bg-gray-500/20 text-gray-400' : 'bg-red-500/20 text-red-400';
                                                        const bDirLabel = bDir === '\u2191' ? '\u2191 \u0420\u043E\u0441\u0442' : bDir === '=' ? '= \u0424\u043B\u044D\u0442' : '\u2193 \u041F\u0430\u0434\u0435\u043D\u0438\u0435';
                                                        return (
                                                            <tr key={idx} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                                                <td className="py-1 px-1 text-gray-400 font-mono">{p.hour}{'\u0447'}</td>
                                                                <td className="py-1 px-1 text-right text-gray-300 font-mono">{p.predicted_price ? (p.predicted_price < 1 ? p.predicted_price.toFixed(7) : p.predicted_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 5})) : '\u2014'}</td>
                                                                <td className="py-1 px-1 text-center">
                                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${pDirClass}`}>
                                                                        {pDirLabel}
                                                                    </span>
                                                                </td>
                                                                <td className="py-1 px-1 text-right text-gray-300 font-mono">{p.close_price < 1 ? p.close_price.toFixed(7) : p.close_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 5})}</td>
                                                                <td className="py-1 px-1 text-center">
                                                                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${bDirClass}`}>
                                                                        {bDirLabel}
                                                                    </span>
                                                                </td>
                                                                <td className="py-1 px-1 text-center text-lg">
                                                                    {p.matched === true ? '\u2705' : p.matched === false ? '\u274C' : '\u2796'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="mt-2">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 text-center tracking-wider">
                                                {'\u0421\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u043E \u0447\u0430\u0441\u0430\u043C'} ({hits}{'\u2705'} / {misses}{'\u274C'})
                                            </div>
                                            <div className="flex gap-[2px] justify-center">
                                                {bp.map((p, i) => {
                                                    const pD = getPredDir(t, i);
                                                    const bD = getBinDir(t, i);
                                                    return (
                                                        <div key={i}
                                                            title={`${p.hour}\u0447: \u041F\u0440\u043E\u0433\u043D\u043E\u0437${pD} Binance${bD} ${p.matched ? '\u2705' : '\u274C'}`}
                                                            className={`w-3 h-3 rounded-sm transition-all ${
                                                                p.matched === true ? 'bg-emerald-500' :
                                                                p.matched === false ? 'bg-red-500' : 'bg-gray-700'
                                                            }`} />
                                                    );
                                                })}
                                                {Array.from({ length: Math.max(0, 24 - bp.length) }).map((_, i) => (
                                                    <div key={`e-${i}`} className="w-3 h-3 rounded-sm bg-gray-800 border border-gray-700/50" />
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
                        ));
                    })()}
                </div>
            )}
        </div>
    );
};

export default BinanceTracker;
