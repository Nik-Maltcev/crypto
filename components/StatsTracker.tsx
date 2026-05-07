import React, { useState, useEffect } from 'react';
import { ForecastTracking } from '../types';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

const StatsTracker: React.FC = () => {
    const [trackings, setTrackings] = useState<ForecastTracking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modeFilter, setModeFilter] = useState<'reddit_only' | 'reddit_twitter'>('reddit_only');

    useEffect(() => {
        (async () => {
            try {
                const resp = await fetch(`${BACKEND_URL}/api/forecast/active`);
                const data = await resp.json();
                if (data.success) setTrackings(data.items);
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, []);

    if (isLoading) return <div className="flex justify-center py-20 text-gray-500">Загрузка...</div>;

    // Filter by mode
    const filtered = trackings.filter(t => {
        const m = t.mode || 'reddit_only';
        if (modeFilter === 'reddit_only') return m !== 'reddit_twitter';
        return m === 'reddit_twitter';
    });

    // Only use data from April 15+
    const cutoff = new Date('2026-04-15T00:00:00Z').getTime();
    const valid = filtered.filter(t => new Date(t.created_at).getTime() >= cutoff);

    // Aggregate stats
    const hourStats: Record<number, Record<string, { wins: number; total: number }>> = {};
    const coinStats: Record<string, { wins: number; total: number }> = {};

    valid.forEach(t => {
        if (!coinStats[t.symbol]) coinStats[t.symbol] = { wins: 0, total: 0 };
        (t.polymarket_prices || []).forEach((pp, idx) => {
            if (pp.matched === null) return;
            const hour = pp.hour;
            if (!hourStats[hour]) hourStats[hour] = {};
            if (!hourStats[hour][t.symbol]) hourStats[hour][t.symbol] = { wins: 0, total: 0 };
            if (!hourStats[hour]['ALL']) hourStats[hour]['ALL'] = { wins: 0, total: 0 };

            hourStats[hour][t.symbol].total++;
            hourStats[hour]['ALL'].total++;
            coinStats[t.symbol].total++;

            if (pp.matched) {
                hourStats[hour][t.symbol].wins++;
                hourStats[hour]['ALL'].wins++;
                coinStats[t.symbol].wins++;
            }
        });
    });

    // Format ET time for hour
    const fmtET = (hour: number) => {
        const startUtcHour = 5;
        const candleStartUtc = startUtcHour + hour - 1;
        const etStart = (candleStartUtc - 4 + 24) % 24;
        const etEnd = (etStart + 1) % 24;
        const f = (h: number) => { const h12 = h % 12 || 12; return `${h12}${h < 12 ? 'AM' : 'PM'}`; };
        return `${f(etStart)}-${f(etEnd)} ET`;
    };

    // Sort hours by accuracy
    const hourEntries = Object.entries(hourStats)
        .filter(([_, s]) => s['ALL']?.total >= 5)
        .map(([h, s]) => ({
            hour: Number(h),
            et: fmtET(Number(h)),
            pct: Math.round((s['ALL'].wins / s['ALL'].total) * 100),
            total: s['ALL'].total,
            wins: s['ALL'].wins,
        }))
        .sort((a, b) => b.pct - a.pct);

    const bestHours = hourEntries.slice(0, 5);
    const worstHours = [...hourEntries].sort((a, b) => a.pct - b.pct).slice(0, 5);

    // Coin ranking
    const coinRanking = Object.entries(coinStats)
        .filter(([sym]) => sym !== 'HYPE')
        .map(([sym, s]) => ({ symbol: sym, pct: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0, total: s.total }))
        .sort((a, b) => b.pct - a.pct);

    // Best hour per coin
    const bestPerCoin: Record<string, { et: string; pct: number }> = {};
    coinRanking.forEach(c => {
        let best = { et: '', pct: 0 };
        Object.entries(hourStats).forEach(([h, s]) => {
            const cs = s[c.symbol];
            if (cs && cs.total >= 3) {
                const p = Math.round((cs.wins / cs.total) * 100);
                if (p > best.pct) best = { et: fmtET(Number(h)), pct: p };
            }
        });
        bestPerCoin[c.symbol] = best;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{'\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u043E\u0432'}</h2>
                    <p className="text-gray-400 text-sm">{'\u0410\u043D\u0430\u043B\u0438\u0437 \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u0438 AI \u043F\u043E \u0447\u0430\u0441\u0430\u043C \u0438 \u043C\u043E\u043D\u0435\u0442\u0430\u043C (c 15 \u0430\u043F\u0440\u0435\u043B\u044F)'}</p>
                </div>
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700/50 rounded-lg p-1 w-fit">
                <button onClick={() => setModeFilter('reddit_only')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${modeFilter === 'reddit_only' ? 'bg-orange-600/30 text-orange-400 shadow border border-orange-500/30' : 'text-gray-400 hover:text-gray-200'}`}>
                    Reddit Only
                </button>
                <button onClick={() => setModeFilter('reddit_twitter')}
                    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${modeFilter === 'reddit_twitter' ? 'bg-blue-600/30 text-blue-400 shadow border border-blue-500/30' : 'text-gray-400 hover:text-gray-200'}`}>
                    Reddit + Twitter
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Best hours */}
                <div className="bg-brand-card border border-emerald-500/20 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">{'\uD83C\uDFAF \u041B\u0443\u0447\u0448\u0438\u0435 \u0447\u0430\u0441\u044B \u0434\u043B\u044F \u0441\u0442\u0430\u0432\u043E\u043A'}</h3>
                    <div className="space-y-2">
                        {bestHours.map((h, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-white font-mono text-sm">{h.et}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 bg-gray-800 rounded-full h-2">
                                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${h.pct}%` }}></div>
                                    </div>
                                    <span className="text-emerald-400 font-bold text-sm w-12 text-right">{h.pct}%</span>
                                    <span className="text-gray-500 text-xs">({h.wins}/{h.total})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Worst hours */}
                <div className="bg-brand-card border border-red-500/20 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4">{'\uD83D\uDC80 \u0425\u0443\u0434\u0448\u0438\u0435 \u0447\u0430\u0441\u044B (\u043D\u0435 \u0441\u0442\u0430\u0432\u0438\u0442\u044C)'}</h3>
                    <div className="space-y-2">
                        {worstHours.map((h, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-white font-mono text-sm">{h.et}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 bg-gray-800 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${h.pct}%` }}></div>
                                    </div>
                                    <span className="text-red-400 font-bold text-sm w-12 text-right">{h.pct}%</span>
                                    <span className="text-gray-500 text-xs">({h.wins}/{h.total})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Coin ranking */}
                <div className="bg-brand-card border border-yellow-500/20 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-4">{'\uD83C\uDFC6 \u0420\u0435\u0439\u0442\u0438\u043D\u0433 \u043C\u043E\u043D\u0435\u0442'}</h3>
                    <div className="space-y-2">
                        {coinRanking.map((c, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-white font-bold text-sm">{c.symbol}</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 bg-gray-800 rounded-full h-2">
                                        <div className={`h-2 rounded-full ${c.pct >= 52 ? 'bg-emerald-500' : c.pct >= 48 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${c.pct}%` }}></div>
                                    </div>
                                    <span className={`font-bold text-sm w-12 text-right ${c.pct >= 52 ? 'text-emerald-400' : c.pct >= 48 ? 'text-yellow-400' : 'text-red-400'}`}>{c.pct}%</span>
                                    <span className="text-gray-500 text-xs">({c.total})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Best hour per coin */}
                <div className="bg-brand-card border border-indigo-500/20 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">{'\u2B50 \u041B\u0443\u0447\u0448\u0438\u0439 \u0447\u0430\u0441 \u043F\u043E \u043C\u043E\u043D\u0435\u0442\u0435'}</h3>
                    <div className="space-y-2">
                        {coinRanking.map((c, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <span className="text-white font-bold text-sm">{c.symbol}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-indigo-400 font-mono text-sm">{bestPerCoin[c.symbol]?.et || '—'}</span>
                                    <span className="text-emerald-400 font-bold text-sm">{bestPerCoin[c.symbol]?.pct || 0}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Full hour table */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{'\u0422\u043E\u0447\u043D\u043E\u0441\u0442\u044C \u043F\u043E \u0432\u0441\u0435\u043C \u0447\u0430\u0441\u0430\u043C'}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-800">
                                <th className="py-2 px-2 text-left">ET</th>
                                {coinRanking.map(c => <th key={c.symbol} className="py-2 px-2 text-center">{c.symbol}</th>)}
                                <th className="py-2 px-2 text-center font-bold">{'\u0418\u0422\u041E\u0413\u041E'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => {
                                const hs = hourStats[hour];
                                if (!hs) return null;
                                const allPct = hs['ALL'] ? Math.round((hs['ALL'].wins / hs['ALL'].total) * 100) : 0;
                                return (
                                    <tr key={hour} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                        <td className="py-1.5 px-2 text-blue-400 font-mono">{fmtET(hour)}</td>
                                        {coinRanking.map(c => {
                                            const cs = hs[c.symbol];
                                            const pct = cs ? Math.round((cs.wins / cs.total) * 100) : 0;
                                            const color = pct >= 55 ? 'text-emerald-400' : pct >= 48 ? 'text-gray-300' : 'text-red-400';
                                            return <td key={c.symbol} className={`py-1.5 px-2 text-center font-mono ${color}`}>{cs ? `${pct}%` : '—'}</td>;
                                        })}
                                        <td className={`py-1.5 px-2 text-center font-bold ${allPct >= 55 ? 'text-emerald-400' : allPct >= 48 ? 'text-white' : 'text-red-400'}`}>{allPct}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StatsTracker;
