import React, { useState, useEffect } from 'react';
import { ForecastTracking } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

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
        } catch (e: any) { alert('Ошибка: ' + e.message); }
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
                    <h2 className="text-2xl font-bold text-white mb-2">Прогноз vs Binance</h2>
                    <p className="text-gray-400 text-sm">
                        Почасовое сравнение AI-прогноза с ценами закрытия Binance
                    </p>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                    <button onClick={() => {
                        // CSV export
                        const rows = ['Дата,Монета,Прогноз,Уверенность%,Старт$,Цель24ч$,Час,Binance$,Прогноз$,Совпало,CMC$,CMC_Совпало'];
                        trackings.forEach(t => {
                            const date = new Date(t.created_at).toLocaleDateString('ru-RU');
                            (t.binance_prices || []).forEach(bp => {
                                const cmc = (t.actual_prices || []).find(a => a.hour === bp.hour);
                                rows.push(`${date},${t.symbol},${t.prediction},${t.confidence},${t.start_price},${t.target_price_24h || ''},${bp.hour},${bp.close_price},${bp.predicted_price || ''},${bp.matched === true ? 'ДА' : bp.matched === false ? 'НЕТ' : ''},${cmc?.real_price || ''},${cmc?.matched === true ? 'ДА' : cmc?.matched === false ? 'НЕТ' : ''}`);
                            });
                            // If no binance data, still export CMC
                            if (!(t.binance_prices || []).length) {
                                (t.actual_prices || []).forEach(a => {
                                    rows.push(`${date},${t.symbol},${t.prediction},${t.confidence},${t.start_price},${t.target_price_24h || ''},${a.hour},,,,${a.real_price},${a.matched === true ? 'ДА' : a.matched === false ? 'НЕТ' : ''}`);
                                });
                            }
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
                        📥 CSV
                    </button>
                    <button onClick={forceUpdate}
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-medium transition">
                        Обновить цены
                    </button>
                    <button onClick={fetchTrackings} disabled={isLoading}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition disabled:opacity-50">
                        🔄
                    </button>
                </div>
            </div>

            {isLoading && !trackings.length ? (
                <div className="flex justify-center py-20 text-gray-500">Загрузка...</div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl">{error}</div>
            ) : !trackings.length ? (
                <div className="text-center p-10 bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                    Нет данных. Запустите анализ — трекинг Binance начнётся автоматически.
                </div>
            ) : (
                <div className="space-y-6">
                    {(() => {
                        const groups: Record<string, ForecastTracking[]> = {};
                        trackings.forEach(t => {
                            const bp = t.binance_prices || [];
                            if (bp.length === 0 && t.status !== 'active') return;
                            const dateKey = t.status === 'active'
                                ? '⏳ Активные'
                                : new Date(t.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                            if (!groups[dateKey]) groups[dateKey] = [];
                            groups[dateKey].push(t);
                        });
                        const sortedKeys = Object.keys(groups).sort((a, b) => {
                            if (a === '⏳ Активные') return -1;
                            if (b === '⏳ Активные') return 1;
                            return b.localeCompare(a);
                        });
                        return sortedKeys.map(dateKey => (
                            <div key={dateKey}>
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dateKey}</h3>
                                    <div className="flex-1 h-px bg-gray-800"></div>
                                    {dateKey !== '⏳ Активные' && (
                                        <span className="text-xs text-gray-600">{groups[dateKey].length} монет</span>
                                    )}
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

                        const chartData = t.hourly_forecast.map((fp, i) => {
                            const binance = bp.find(b => b.hour === fp.hourOffset || b.hour === i);
                            return {
                                hour: `${fp.hourOffset}ч`,
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
                                            {t.status === 'active' ? `⏳ ${bp.length}/24ч` : `✅ Завершён`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold">Точность</div>
                                            <div className={`text-lg font-bold ${acc >= 60 ? 'text-emerald-400' : acc >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                {acc}%
                                            </div>
                                        </div>
                                        {lastBinance && (
                                            <div className="text-right">
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">Binance</div>
                                                <div className="text-sm font-mono text-white">${lastBinance.close_price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</div>
                                                <div className={`text-xs ${changeFromStart >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {changeFromStart > 0 ? '+' : ''}{changeFromStart.toFixed(2)}%
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex gap-0.5">
                                            {bp.slice(-12).map((p, i) => (
                                                <div key={i}
                                                    title={`${p.hour}ч: $${p.close_price} ${p.matched ? '✅' : '❌'}`}
                                                    className={`w-2.5 h-2.5 rounded-sm ${
                                                        p.matched === true ? 'bg-emerald-500' :
                                                        p.matched === false ? 'bg-red-500' : 'bg-gray-700'
                                                    }`} />
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
                                        <div className="flex justify-between items-center mt-3 mb-2">
                                            <div className="flex gap-4 text-xs text-gray-500">
                                                <span>Старт: <span className="text-white font-mono">${t.start_price.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span></span>
                                                {t.target_price_24h && (
                                                    <span>Цель 24ч: <span className="text-white font-mono">${t.target_price_24h.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
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
                                                        tickFormatter={(v) => `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                                                        labelStyle={{ color: '#9CA3AF' }}
                                                        formatter={(value: any, name: string) => {
                                                            if (value === null) return ['—', name === 'predicted' ? 'Прогноз' : 'Binance'];
                                                            return [`$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`, name === 'predicted' ? 'Прогноз' : 'Binance'];
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
                                        <div className="mt-2">
                                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 text-center tracking-wider">
                                                Совпадение направления по часам ({hits}✅ / {misses}❌)
                                            </div>
                                            <div className="flex gap-[2px] justify-center">
                                                {bp.map((p, i) => (
                                                    <div key={i}
                                                        title={`${p.hour}ч: Binance=$${p.close_price} pred=$${p.predicted_price || '?'} ${p.matched ? '✅' : '❌'}`}
                                                        className={`w-3 h-3 rounded-sm transition-all ${
                                                            p.matched === true ? 'bg-emerald-500' :
                                                            p.matched === false ? 'bg-red-500' : 'bg-gray-700'
                                                        }`} />
                                                ))}
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
                                {/* Per-day summary for completed trackings */}
                                {dateKey !== '⏳ Активные' && (() => {
                                    const dayCompleted = groups[dateKey].filter(t => t.binance_prices && t.binance_prices.length >= 20);
                                    if (dayCompleted.length < 2) return null;

                                    const hourStats: Record<number, { wins: number; total: number }> = {};
                                    dayCompleted.forEach(t => {
                                        (t.binance_prices || []).forEach(bp => {
                                            if (!hourStats[bp.hour]) hourStats[bp.hour] = { wins: 0, total: 0 };
                                            hourStats[bp.hour].total++;
                                            if (bp.matched) hourStats[bp.hour].wins++;
                                        });
                                    });

                                    const hourEntries = Object.entries(hourStats)
                                        .map(([h, s]) => ({ hour: Number(h), pct: Math.round((s.wins / s.total) * 100) }))
                                        .sort((a, b) => b.pct - a.pct);

                                    const bestHours = hourEntries.filter(h => h.pct >= 60).slice(0, 5);
                                    const worstHours = [...hourEntries].sort((a, b) => a.pct - b.pct).filter(h => h.pct < 40).slice(0, 5);

                                    const coinStats = dayCompleted.map(t => {
                                        const bp = t.binance_prices || [];
                                        const hits = bp.filter(p => p.matched === true).length;
                                        return { symbol: t.symbol, acc: bp.length > 0 ? Math.round((hits / bp.length) * 100) : 0 };
                                    }).sort((a, b) => b.acc - a.acc);

                                    const totalHits = dayCompleted.reduce((sum, t) => sum + (t.binance_prices || []).filter(p => p.matched === true).length, 0);
                                    const totalPoints = dayCompleted.reduce((sum, t) => sum + (t.binance_prices || []).length, 0);
                                    const overallAcc = totalPoints > 0 ? Math.round((totalHits / totalPoints) * 100) : 0;

                                    return (
                                        <div className="bg-brand-card border border-yellow-500/20 rounded-xl p-4 mt-3">
                                            <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-3">📊 Итоги: {dateKey}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Точность</div>
                                                    <div className={`text-xl font-bold ${overallAcc >= 60 ? 'text-emerald-400' : overallAcc >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{overallAcc}%</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Лучшая</div>
                                                    <div className="text-sm font-bold text-white">{coinStats[0]?.symbol} <span className="text-emerald-400">{coinStats[0]?.acc}%</span></div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Худшая</div>
                                                    <div className="text-sm font-bold text-white">{coinStats[coinStats.length - 1]?.symbol} <span className="text-red-400">{coinStats[coinStats.length - 1]?.acc}%</span></div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold">Итого</div>
                                                    <div className="text-sm font-bold text-white">{totalHits}✅ / {totalPoints - totalHits}❌</div>
                                                </div>
                                            </div>
                                            {bestHours.length > 0 && (
                                                <div className="text-xs mb-1"><span className="text-gray-400">🎯 Лучшие часы: </span><span className="text-emerald-400 font-mono">{bestHours.map(h => `${h.hour}ч (${h.pct}%)`).join(', ')}</span></div>
                                            )}
                                            {worstHours.length > 0 && (
                                                <div className="text-xs"><span className="text-gray-400">💀 Худшие часы: </span><span className="text-red-400 font-mono">{worstHours.map(h => `${h.hour}ч (${h.pct}%)`).join(', ')}</span></div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        ));
                    })()}

                </div>
            )}
        </div>
    );
};

export default BinanceTracker;
