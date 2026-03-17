import React, { useState, useEffect } from 'react';
import { ForecastTracking } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

const ForecastTracker: React.FC = () => {
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
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const forceUpdate = async () => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/forecast/force_update`, { method: 'POST' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            setTimeout(fetchTrackings, 3000);
        } catch (e: any) {
            alert('Ошибка: ' + e.message);
        }
    };

    useEffect(() => { fetchTrackings(); }, []);

    const getColor = (pred: string) => {
        if (pred === 'Bullish') return { text: 'text-emerald-400', bg: 'bg-emerald-500', hex: '#10B981' };
        if (pred === 'Bearish') return { text: 'text-red-400', bg: 'bg-red-500', hex: '#EF4444' };
        return { text: 'text-yellow-400', bg: 'bg-yellow-500', hex: '#F59E0B' };
    };

    const accuracy = (t: ForecastTracking) =>
        t.hours_tracked > 0 ? Math.round((t.hits / t.hours_tracked) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Прогноз vs Реальность</h2>
                    <p className="text-gray-400 text-sm">
                        Почасовое сравнение AI-прогноза с реальными ценами CoinMarketCap
                    </p>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                    <button onClick={forceUpdate}
                        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium transition">
                        Обновить цены
                    </button>
                    <button onClick={fetchTrackings} disabled={isLoading}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                            <path d="M16 21h5v-5" />
                        </svg>
                    </button>
                </div>
            </div>

            {isLoading && !trackings.length ? (
                <div className="flex justify-center py-20 text-gray-500">Загрузка...</div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl">{error}</div>
            ) : !trackings.length ? (
                <div className="text-center p-10 bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                    Нет активных трекингов. Запустите анализ (24ч) — трекинг начнётся автоматически.
                </div>
            ) : (
                <div className="space-y-4">
                    {trackings.map(t => {
                        const color = getColor(t.prediction);
                        const acc = accuracy(t);
                        const isExpanded = expandedId === t.id;
                        const lastActual = t.actual_prices.length > 0 ? t.actual_prices[t.actual_prices.length - 1] : null;

                        // Build chart data: merge forecast + actual
                        const chartData = t.hourly_forecast.map((fp, i) => {
                            const actual = t.actual_prices.find(a => a.hour === fp.hourOffset);
                            return {
                                hour: `${fp.hourOffset}ч`,
                                predicted: fp.price,
                                real: actual?.real_price ?? null,
                                matched: actual?.matched ?? null,
                            };
                        });

                        return (
                            <div key={t.id} className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-colors">
                                {/* Header row */}
                                <div className="p-4 flex items-center justify-between cursor-pointer"
                                    onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                                    <div className="flex items-center gap-4">
                                        <div className="text-xl font-bold text-white">{t.symbol}</div>
                                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${color.text} ${color.bg}/20`}>
                                            {t.prediction} ({t.confidence}%)
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            t.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                                            t.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {t.status === 'active' ? `⏳ ${t.hours_tracked}/24ч` : `✅ Завершён`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        {/* Accuracy */}
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">Точность</div>
                                            <div className={`text-lg font-bold ${acc >= 60 ? 'text-emerald-400' : acc >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {acc}%
                                            </div>
                                        </div>
                                        {/* Current price */}
                                        {lastActual && (
                                            <div className="text-right">
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">Сейчас</div>
                                                <div className="text-sm font-mono text-white">${lastActual.real_price.toLocaleString()}</div>
                                                <div className={`text-xs ${lastActual.actual_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {lastActual.actual_change > 0 ? '+' : ''}{lastActual.actual_change}%
                                                </div>
                                            </div>
                                        )}
                                        {/* Hit/miss dots */}
                                        <div className="flex gap-0.5">
                                            {t.actual_prices.slice(-12).map((p, i) => (
                                                <div key={i}
                                                    title={`${p.hour}ч: ${p.matched ? 'Совпало' : 'Мимо'} ($${p.real_price})`}
                                                    className={`w-2.5 h-2.5 rounded-sm ${
                                                        p.matched === true ? 'bg-emerald-500' :
                                                        p.matched === false ? 'bg-red-500' : 'bg-gray-700'
                                                    }`} />
                                            ))}
                                        </div>
                                        {/* Expand arrow */}
                                        <svg className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Expanded chart */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 border-t border-gray-800/50">
                                        <div className="flex justify-between items-center mt-3 mb-2">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span>Старт: <span className="text-white font-mono">${t.start_price.toLocaleString()}</span></span>
                                                {t.target_price_24h && (
                                                    <span>Цель 24ч: <span className="text-white font-mono">${t.target_price_24h.toLocaleString()}</span>
                                                        <span className={`ml-1 ${(t.target_change_24h || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            ({(t.target_change_24h || 0) > 0 ? '+' : ''}{t.target_change_24h}%)
                                                        </span>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-4 text-[10px] text-gray-500 uppercase font-bold">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block"></span> Прогноз
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block"></span> Реальность
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id={`pred-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id={`real-${t.id}`} x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="hour" stroke="#4B5563" fontSize={11} tickMargin={8} />
                                                    <YAxis stroke="#4B5563" fontSize={11} width={70} domain={['auto', 'auto']}
                                                        tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                                                        labelStyle={{ color: '#9CA3AF' }}
                                                        formatter={(value: any, name: string) => {
                                                            if (value === null) return ['—', name === 'predicted' ? 'Прогноз' : 'Реальность'];
                                                            return [`$${Number(value).toLocaleString()}`, name === 'predicted' ? 'Прогноз' : 'Реальность'];
                                                        }}
                                                    />
                                                    <ReferenceLine y={t.start_price} stroke="#4B5563" strokeDasharray="3 3" />
                                                    <Area type="monotone" dataKey="predicted" stroke="#6366F1" strokeWidth={2}
                                                        fill={`url(#pred-${t.id})`} connectNulls />
                                                    <Area type="monotone" dataKey="real" stroke="#22D3EE" strokeWidth={2}
                                                        fill={`url(#real-${t.id})`} connectNulls />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        {/* Hourly hit/miss bar */}
                                        <div className="mt-2">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 text-center tracking-wider">
                                                Совпадение направления по часам ({t.hits}✅ / {t.misses}❌)
                                            </div>
                                            <div className="flex gap-[2px] justify-center">
                                                {t.actual_prices.map((p, i) => (
                                                    <div key={i}
                                                        title={`${p.hour}ч: real=$${p.real_price} pred=$${p.predicted_price || '?'} ${p.matched ? '✅' : '❌'}`}
                                                        className={`w-3 h-3 rounded-sm transition-all ${
                                                            p.matched === true ? 'bg-emerald-500' :
                                                            p.matched === false ? 'bg-red-500' : 'bg-gray-700'
                                                        }`} />
                                                ))}
                                                {/* Empty slots for remaining hours */}
                                                {Array.from({ length: Math.max(0, 24 - t.actual_prices.length) }).map((_, i) => (
                                                    <div key={`empty-${i}`} className="w-3 h-3 rounded-sm bg-gray-800 border border-gray-700/50" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ForecastTracker;
