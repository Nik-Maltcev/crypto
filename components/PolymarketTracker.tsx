import React, { useState, useEffect } from 'react';
import { ForecastTracking } from '../types';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

const PolymarketTracker: React.FC = () => {
    const [trackings, setTrackings] = useState<ForecastTracking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [modeFilter, setModeFilter] = useState<'reddit_only' | 'reddit_twitter'>('reddit_only');

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

    useEffect(() => { fetchTrackings(); }, []);

    const getColor = (pred: string) => {
        if (pred === 'Bullish') return { text: 'text-emerald-400', bg: 'bg-emerald-500' };
        if (pred === 'Bearish') return { text: 'text-red-400', bg: 'bg-red-500' };
        return { text: 'text-yellow-400', bg: 'bg-yellow-500' };
    };

    const accuracy = (pp: ForecastTracking['polymarket_prices']) => {
        if (!pp || pp.length === 0) return 0;
        const hits = pp.filter(p => p.matched === true).length;
        return Math.round((hits / pp.length) * 100);
    };

    const exportCSV = () => {
        const rows = ['Дата,Монета,Прогноз,Уверенность%,Час,Open,Close,Направление свечи,Прогноз направления,Совпало'];
        const filtered = trackings.filter(t => {
            const m = t.mode || 'reddit_only';
            if (modeFilter === 'reddit_only') return m !== 'reddit_twitter';
            return m === 'reddit_twitter';
        });
        filtered.forEach(t => {
            const date = new Date(t.created_at).toLocaleDateString('ru-RU');
            (t.polymarket_prices || []).forEach(pp => {
                rows.push(`${date},${t.symbol},${t.prediction},${t.confidence},${pp.hour},${pp.open},${pp.close},${pp.candle_direction},${pp.predicted_direction || ''},${pp.matched === true ? 'ДА' : pp.matched === false ? 'НЕТ' : ''}`);
            });
        });
        const csv = '\uFEFF' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `polymarket_forecast_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportDailyCSV = () => {
        const rows = ['Дата,День недели,Монета,Цена старт (07:00 МСК),Прогноз цена (22ч),Реальная цена (22ч),Прогноз направление,Реальное направление,Совпало'];
        const filtered = trackings.filter(t => {
            const m = t.mode || 'reddit_only';
            if (modeFilter === 'reddit_only') return m !== 'reddit_twitter';
            return m === 'reddit_twitter';
        });
        
        // Group by symbol and sort by date
        const bySymbol: Record<string, typeof filtered> = {};
        filtered.forEach(t => {
            if (!bySymbol[t.symbol]) bySymbol[t.symbol] = [];
            bySymbol[t.symbol].push(t);
        });

        Object.entries(bySymbol).forEach(([symbol, items]) => {
            const sorted = items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            
            for (let i = 0; i < sorted.length; i++) {
                const today = sorted[i];
                const pp = today.polymarket_prices || [];
                const forecast = today.hourly_forecast || [];
                if (pp.length < 22 || forecast.length < 22) continue;
                
                const mskDate = new Date(new Date(today.created_at).getTime() + 3 * 60 * 60 * 1000);
                const date = mskDate.toISOString().slice(0, 10);
                const dayName = mskDate.toLocaleDateString('ru-RU', { weekday: 'short', timeZone: 'UTC' });
                
                // Start price = yesterday's hour 23 open (07:00 MSK) or fallback to hour 1 open
                let startPrice = pp[0]?.open || 0;
                if (i > 0) {
                    const yesterday = sorted[i - 1];
                    const yesterdayPP = yesterday.polymarket_prices || [];
                    const h23 = yesterdayPP.find(p => p.hour === 23);
                    if (h23) startPrice = h23.open;
                }
                
                // Predicted price at hour 22
                const forecastH22 = forecast.find(f => f.hourOffset === 22);
                const predictedPrice = forecastH22?.price || 0;
                
                // Real price at hour 22
                const realH22 = pp.find(p => p.hour === 22);
                const realPrice = realH22?.close || 0;
                
                if (startPrice === 0 || predictedPrice === 0 || realPrice === 0) continue;
                
                const predictedDir = predictedPrice >= startPrice ? 'Up' : 'Down';
                const realDir = realPrice >= startPrice ? 'Up' : 'Down';
                const matched = predictedDir === realDir ? 'ДА' : 'НЕТ';
                
                rows.push(`${date},${dayName},${symbol},${startPrice},${predictedPrice},${realPrice},${predictedDir},${realDir},${matched}`);
            }
        });
        const csv = '\uFEFF' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `polymarket_daily_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportWeeklyCSV = () => {
        const rows = ['Неделя,Монета,Прогнозов,Цена старт (Пн),Цена финиш (Вс),Изменение %,Ср. винрейт часов %,Bullish дней,Bearish дней'];
        const filtered = trackings.filter(t => {
            const m = t.mode || 'reddit_only';
            if (modeFilter === 'reddit_only') return m !== 'reddit_twitter';
            return m === 'reddit_twitter';
        });
        // Group by week + symbol
        const weeks: Record<string, typeof filtered> = {};
        filtered.forEach(t => {
            const weekNum = Math.floor((new Date(t.created_at).getTime() - new Date('2026-04-15').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
            const key = `W${weekNum}_${t.symbol}`;
            if (!weeks[key]) weeks[key] = [];
            weeks[key].push(t);
        });
        Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b)).forEach(([key, items]) => {
            const [wk, sym] = [key.split('_')[0], key.split('_')[1]];
            const sorted = items.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            const firstPP = sorted[0]?.polymarket_prices || [];
            const lastPP = sorted[sorted.length - 1]?.polymarket_prices || [];
            const startPrice = firstPP[0]?.open || 0;
            const endPrice = lastPP.length > 0 ? lastPP[lastPP.length - 1]?.close || 0 : 0;
            const change = startPrice > 0 ? (((endPrice - startPrice) / startPrice) * 100).toFixed(2) : '0';
            const allPP = sorted.flatMap(t => t.polymarket_prices || []);
            const hits = allPP.filter(p => p.matched === true).length;
            const avgWinrate = allPP.length > 0 ? Math.round((hits / allPP.length) * 100) : 0;
            const bullishDays = sorted.filter(t => t.prediction === 'Bullish').length;
            const bearishDays = sorted.filter(t => t.prediction === 'Bearish').length;
            rows.push(`${wk},${sym},${sorted.length},${startPrice},${endPrice},${change},${avgWinrate},${bullishDays},${bearishDays}`);
        });
        const csv = '\uFEFF' + rows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `polymarket_weekly_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Прогноз vs Polymarket</h2>
                    <p className="text-gray-400 text-sm">
                        Сравнение AI-прогноза с направлением 1ч свечи Binance (open/close). Логика Polymarket: close &ge; open = Up.
                    </p>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                    <button onClick={exportCSV}
                        className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium transition">
                        📥 Hourly
                    </button>
                    <button onClick={exportDailyCSV}
                        className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition">
                        📥 Daily
                    </button>
                    <button onClick={exportWeeklyCSV}
                        className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg text-sm font-medium transition">
                        📥 Weekly
                    </button>
                    <button onClick={fetchTrackings} disabled={isLoading}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition disabled:opacity-50">
                        🔄
                    </button>
                </div>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700/50 rounded-lg p-1 w-fit">
                <button
                    onClick={() => setModeFilter('reddit_only')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${modeFilter === 'reddit_only' ? 'bg-orange-600/30 text-orange-400 shadow border border-orange-500/30' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    Reddit Only
                </button>
                <button
                    onClick={() => setModeFilter('reddit_twitter')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${modeFilter === 'reddit_twitter' ? 'bg-blue-600/30 text-blue-400 shadow border border-blue-500/30' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    Reddit + Twitter
                </button>
            </div>

            {isLoading && !trackings.length ? (
                <div className="flex justify-center py-20 text-gray-500">Загрузка...</div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl">{error}</div>
            ) : !trackings.length ? (
                <div className="text-center p-10 bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                    Нет данных. Запустите анализ — трекинг начнётся автоматически.
                </div>
            ) : (
                <div className="space-y-6">
                    {(() => {
                        const filtered = trackings.filter(t => {
                            const m = t.mode || 'reddit_only';
                            if (modeFilter === 'reddit_only') return m !== 'reddit_twitter';
                            return m === 'reddit_twitter';
                        });
                        const groups: Record<string, ForecastTracking[]> = {};
                        filtered.forEach(t => {
                            const pp = t.polymarket_prices || [];
                            if (pp.length === 0 && t.status !== 'active') return;
                            const dateKey = t.status === 'active'
                                ? '\u23F3 Активные'
                                : new Date(t.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
                            if (!groups[dateKey]) groups[dateKey] = [];
                            groups[dateKey].push(t);
                        });
                        const sortedKeys = Object.keys(groups).sort((a, b) => {
                            if (a === '\u23F3 Активные') return -1;
                            if (b === '\u23F3 Активные') return 1;
                            const dateA = new Date(groups[a][0]?.created_at || 0).getTime();
                            const dateB = new Date(groups[b][0]?.created_at || 0).getTime();
                            return dateB - dateA;
                        });
                        return sortedKeys.map(dateKey => (
                            <div key={dateKey}>
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{dateKey}</h3>
                                    <div className="flex-1 h-px bg-gray-800"></div>
                                    {dateKey !== '\u23F3 Активные' && (
                                        <span className="text-xs text-gray-600">{groups[dateKey].length} монет</span>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {groups[dateKey].map(t => {
                                        const color = getColor(t.prediction);
                                        const pp = t.polymarket_prices || [];
                                        const hits = pp.filter(p => p.matched === true).length;
                                        const misses = pp.filter(p => p.matched === false).length;
                                        const acc = accuracy(pp);
                                        const isExpanded = expandedId === t.id;

                                        return (
                                            <div key={t.id} className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500/30 transition-colors">
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
                                                            {t.status === 'active' ? `\u23F3 ${pp.length}/24ч` : '\u2705 Завершён'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-gray-500 uppercase font-bold">Точность</div>
                                                            <div className={`text-lg font-bold ${acc >= 60 ? 'text-emerald-400' : acc >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                                                {acc}%
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[10px] text-gray-500 uppercase font-bold">Счёт</div>
                                                            <div className="text-sm font-mono text-white">{hits}✅ / {misses}❌</div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {pp.slice(-12).map((p, i) => (
                                                                <div key={i}
                                                                    title={`${p.hour}ч: ${p.candle_direction === 'up' ? '↑' : '↓'} (open=${p.open} close=${p.close}) ${p.matched ? '✅' : '❌'}`}
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
                                                        <div className="mt-3 mb-2 flex justify-between items-center">
                                                            <div className="text-xs text-gray-500">
                                                                Старт: <span className="text-white font-mono">${t.start_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 uppercase font-bold">
                                                                Логика: close &ge; open = UP | close &lt; open = DOWN
                                                            </div>
                                                        </div>
                                                        {/* Hourly detail table */}
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="text-gray-500 border-b border-gray-800">
                                                                        <th className="py-2 px-2 text-left">Час</th>
                                                                        <th className="py-2 px-2 text-left">Polymarket (ET)</th>
                                                                        <th className="py-2 px-2 text-right">Open</th>
                                                                        <th className="py-2 px-2 text-right">Close</th>
                                                                        <th className="py-2 px-2 text-center">Свеча</th>
                                                                        <th className="py-2 px-2 text-center">Прогноз</th>
                                                                        <th className="py-2 px-2 text-center">Результат</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {pp.map((p, i) => {
                                                                        // Analysis starts at 05:00 UTC = 08:00 MSK = 1:00 AM ET
                                                                        // Hour 1 candle = 05:00-06:00 UTC
                                                                        const startUtcHour = 5; // analysis at 05:00 UTC
                                                                        const candleStartUtc = startUtcHour + p.hour - 1;
                                                                        const candleEndUtc = candleStartUtc + 1;
                                                                        const etStart = (candleStartUtc - 4 + 24) % 24;
                                                                        const etEnd = (candleEndUtc - 4 + 24) % 24;
                                                                        const fmtHour = (h: number) => { const h12 = h % 12 || 12; return `${h12}${h < 12 ? 'AM' : 'PM'}`; };
                                                                        const etLabel = `${fmtHour(etStart)}-${fmtHour(etEnd)} ET`;
                                                                        return (
                                                                        <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                                                            <td className="py-1.5 px-2 text-gray-400 font-mono">{p.hour}ч</td>
                                                                            <td className="py-1.5 px-2 text-blue-400 font-mono text-xs">{etLabel}</td>
                                                                            <td className="py-1.5 px-2 text-right text-gray-300 font-mono">
                                                                                {p.open.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                                            </td>
                                                                            <td className="py-1.5 px-2 text-right text-gray-300 font-mono">
                                                                                {p.close.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                                                                            </td>
                                                                            <td className="py-1.5 px-2 text-center">
                                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                                                    p.candle_direction === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                                                                }`}>
                                                                                    {p.candle_direction === 'up' ? '↑ UP' : '↓ DOWN'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-1.5 px-2 text-center">
                                                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                                                    p.predicted_direction === 'up' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                                    p.predicted_direction === 'down' ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'
                                                                                }`}>
                                                                                    {p.predicted_direction === 'up' ? '↑ UP' : p.predicted_direction === 'down' ? '↓ DOWN' : '—'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-1.5 px-2 text-center text-lg">
                                                                                {p.matched === true ? '✅' : p.matched === false ? '❌' : '➖'}
                                                                            </td>
                                                                        </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        {/* Summary bar */}
                                                        <div className="mt-3">
                                                            <div className="text-[10px] text-gray-500 uppercase font-bold mb-1 text-center tracking-wider">
                                                                Совпадение по часам ({hits}✅ / {misses}❌)
                                                            </div>
                                                            <div className="flex gap-[2px] justify-center">
                                                                {pp.map((p, i) => (
                                                                    <div key={i}
                                                                        title={`${p.hour}ч: свеча=${p.candle_direction} прогноз=${p.predicted_direction} ${p.matched ? '✅' : '❌'}`}
                                                                        className={`w-3 h-3 rounded-sm transition-all ${
                                                                            p.matched === true ? 'bg-emerald-500' :
                                                                            p.matched === false ? 'bg-red-500' : 'bg-gray-700'
                                                                        }`} />
                                                                ))}
                                                                {Array.from({ length: Math.max(0, 24 - pp.length) }).map((_, i) => (
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
                                {/* Per-day summary */}
                                {dateKey !== '\u23F3 Активные' && (() => {
                                    const dayItems = groups[dateKey].filter(t => (t.polymarket_prices || []).length >= 5);
                                    if (dayItems.length < 2) return null;

                                    const totalHits = dayItems.reduce((sum, t) => sum + (t.polymarket_prices || []).filter(p => p.matched === true).length, 0);
                                    const totalPoints = dayItems.reduce((sum, t) => sum + (t.polymarket_prices || []).length, 0);
                                    const overallAcc = totalPoints > 0 ? Math.round((totalHits / totalPoints) * 100) : 0;

                                    const coinStats = dayItems.map(t => {
                                        const pp = t.polymarket_prices || [];
                                        const hits = pp.filter(p => p.matched === true).length;
                                        return { symbol: t.symbol, acc: pp.length > 0 ? Math.round((hits / pp.length) * 100) : 0 };
                                    }).sort((a, b) => b.acc - a.acc);

                                    return (
                                        <div className="bg-brand-card border border-purple-500/20 rounded-xl p-4 mt-3">
                                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">📊 Итоги (Polymarket): {dateKey}</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

export default PolymarketTracker;
