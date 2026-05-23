import React, { useState, useEffect } from 'react';
import { ForecastTracking } from '../types';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

const StatsTracker: React.FC = () => {
    const [trackings, setTrackings] = useState<ForecastTracking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modeFilter] = useState<'reddit_only' | 'reddit_twitter'>('reddit_only');
    const [patternLoading, setPatternLoading] = useState(false);
    const [patternResult, setPatternResult] = useState<string | null>(null);
    const [patternError, setPatternError] = useState<string | null>(null);
    const [dailyData, setDailyData] = useState<any>(null);
    const [dailyLoading, setDailyLoading] = useState(false);
    const [showStrategyDetail, setShowStrategyDetail] = useState(false);
    const [cellModal, setCellModal] = useState<{ hour: number; symbol: string; predictionFilter?: string } | null>(null);
    const [modalDayFilter, setModalDayFilter] = useState<string | null>(null);

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

    const fetchDailyPerformance = async () => {
        setDailyLoading(true);
        try {
            const resp = await fetch(`${BACKEND_URL}/api/forecast/daily-performance`);
            const data = await resp.json();
            if (data.success) setDailyData(data);
        } catch (e) { console.error(e); }
        finally { setDailyLoading(false); }
    };

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

    // === Dynamic Strategy Calculation: BTC hour 2/3/5 ===
    // Days: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const primaryDays = new Set([1, 2, 4, 6]); // Mon, Tue, Thu, Sat
    
    const strategyStats = { h2_all: { wins: 0, total: 0 }, h3_primary: { wins: 0, total: 0 }, h5_primary: { wins: 0, total: 0 }, h3h5_primary: { wins: 0, total: 0 } };
    const weeklyH3H5: Record<string, { wins: number; total: number }> = {};
    const weeklyH5: Record<string, { wins: number; total: number }> = {};
    const dailyH5Log: { date: string; day: string; matched: boolean }[] = [];

    valid.filter(t => t.symbol === 'BTC').forEach(t => {
        // Use MSK (UTC+3) for day of week calculation
        const mskDate = new Date(new Date(t.created_at).getTime() + 3 * 60 * 60 * 1000);
        const dayOfWeek = mskDate.getUTCDay();
        const isPrimaryDay = primaryDays.has(dayOfWeek);
        const weekKey = new Date(t.created_at).toISOString().slice(0, 10).replace(/-\d{2}$/, ''); // YYYY-MM as week approx
        // Better: use ISO week
        const d = new Date(t.created_at);
        const weekNum = Math.floor((d.getTime() - new Date('2026-04-15').getTime()) / (7 * 24 * 60 * 60 * 1000));
        const wk = `w${weekNum}`;

        (t.polymarket_prices || []).forEach(pp => {
            if (pp.matched === null) return;
            
            // Hour 2 - all days
            if (pp.hour === 2) {
                strategyStats.h2_all.total++;
                if (pp.matched) strategyStats.h2_all.wins++;
            }
            
            // Hour 3 - primary days only
            if (pp.hour === 3 && isPrimaryDay) {
                strategyStats.h3_primary.total++;
                if (pp.matched) strategyStats.h3_primary.wins++;
                if (!weeklyH3H5[wk]) weeklyH3H5[wk] = { wins: 0, total: 0 };
                weeklyH3H5[wk].total++;
                if (pp.matched) weeklyH3H5[wk].wins++;
            }
            
            // Hour 5 - primary days only
            if (pp.hour === 5 && isPrimaryDay) {
                strategyStats.h5_primary.total++;
                if (pp.matched) strategyStats.h5_primary.wins++;
                if (!weeklyH3H5[wk]) weeklyH3H5[wk] = { wins: 0, total: 0 };
                weeklyH3H5[wk].total++;
                if (pp.matched) weeklyH3H5[wk].wins++;
                if (!weeklyH5[wk]) weeklyH5[wk] = { wins: 0, total: 0 };
                weeklyH5[wk].total++;
                if (pp.matched) weeklyH5[wk].wins++;
                const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                dailyH5Log.push({
                    date: mskDate.toISOString().slice(5, 10).replace('-', '.'),
                    day: dayNames[dayOfWeek],
                    matched: pp.matched,
                });
            }
        });
    });

    // Combined h3+h5 primary
    strategyStats.h3h5_primary = {
        wins: strategyStats.h3_primary.wins + strategyStats.h5_primary.wins,
        total: strategyStats.h3_primary.total + strategyStats.h5_primary.total,
    };

    const h3h5Pct = strategyStats.h3h5_primary.total > 0 ? Math.round((strategyStats.h3h5_primary.wins / strategyStats.h3h5_primary.total) * 100) : 0;
    const h2Pct = strategyStats.h2_all.total > 0 ? Math.round((strategyStats.h2_all.wins / strategyStats.h2_all.total) * 100) : 0;
    
    // H2 + H5 combined (active strategy)
    const h2h5Stats = { wins: strategyStats.h2_all.wins + strategyStats.h5_primary.wins, total: strategyStats.h2_all.total + strategyStats.h5_primary.total };
    const h2h5Pct = h2h5Stats.total > 0 ? Math.round((h2h5Stats.wins / h2h5Stats.total) * 100) : 0;
    const h5Pct = strategyStats.h5_primary.total > 0 ? Math.round((strategyStats.h5_primary.wins / strategyStats.h5_primary.total) * 100) : 0;
    const h3Pct = strategyStats.h3_primary.total > 0 ? Math.round((strategyStats.h3_primary.wins / strategyStats.h3_primary.total) * 100) : 0;

    // Recent performance (last 14 days) for alerts
    const recentCutoff = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const recentH2 = { wins: 0, total: 0 };
    const recentH5 = { wins: 0, total: 0 };
    valid.filter(t => t.symbol === 'BTC' && new Date(t.created_at).getTime() >= recentCutoff).forEach(t => {
        const mskDate = new Date(new Date(t.created_at).getTime() + 3 * 60 * 60 * 1000);
        const dayOfWeek = mskDate.getUTCDay();
        const isPrimaryDay = primaryDays.has(dayOfWeek);
        (t.polymarket_prices || []).forEach(pp => {
            if (pp.matched === null) return;
            if (pp.hour === 2) { recentH2.total++; if (pp.matched) recentH2.wins++; }
            if (pp.hour === 5 && isPrimaryDay) { recentH5.total++; if (pp.matched) recentH5.wins++; }
        });
    });
    const recentH2Pct = recentH2.total > 0 ? Math.round((recentH2.wins / recentH2.total) * 100) : 0;
    const recentH5Pct = recentH5.total > 0 ? Math.round((recentH5.wins / recentH5.total) * 100) : 0;
    const h2Alert = recentH2.total >= 5 && recentH2Pct < 55;
    const h5Alert = recentH5.total >= 5 && recentH5Pct < 55;

    // Weekly min/max for h3+h5
    const weeklyPcts = Object.values(weeklyH3H5).filter(w => w.total >= 4).map(w => Math.round((w.wins / w.total) * 100));
    const weeklyMin = weeklyPcts.length > 0 ? Math.min(...weeklyPcts) : 0;
    const weeklyMax = weeklyPcts.length > 0 ? Math.max(...weeklyPcts) : 0;

    const findPattern = async () => {
        setPatternLoading(true);
        setPatternResult(null);
        setPatternError(null);

        try {
            // Collect all polymarket_prices from Reddit Only, April 15+
            const redditOnly = trackings.filter(t => {
                const m = t.mode || 'reddit_only';
                return m !== 'reddit_twitter';
            });
            const cutoffDate = new Date('2026-04-15T00:00:00Z').getTime();
            const validData = redditOnly.filter(t => new Date(t.created_at).getTime() >= cutoffDate);

            // Build structured data for Claude - BTC ONLY with week numbers
            const btcData = validData.filter(t => t.symbol === 'BTC');
            const dataForAnalysis = btcData.map(t => {
                const mskDate = new Date(new Date(t.created_at).getTime() + 3 * 60 * 60 * 1000);
                const weekNum = Math.floor((new Date(t.created_at).getTime() - new Date('2026-04-15').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
                const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                return {
                    date: mskDate.toISOString().slice(0, 10),
                    day_of_week: dayNames[mskDate.getUTCDay()],
                    week_number: weekNum,
                    prediction: t.prediction,
                    confidence: t.confidence,
                    polymarket_prices: (t.polymarket_prices || []).map(pp => ({
                        hour: pp.hour,
                        matched: pp.matched,
                    })).filter(pp => pp.matched !== null),
                };
            });

            const systemPrompt = `Ты аналитик данных. Тебе дают ПОЛНУЮ статистику прогнозов BTC по часам за 5+ недель. Каждая запись — один день с 24 часовыми свечами. Поля: hour (1-24), matched (совпал ли прогноз направления с реальностью), day_of_week, week_number.

ЗАДАЧА: Найди комбинацию (час + день недели) которая СТАБИЛЬНО даёт >60% винрейт КАЖДУЮ неделю.

КРИТЕРИИ СТАБИЛЬНОСТИ:
- Паттерн должен работать в КАЖДОЙ из 5+ недель (не ниже 50% ни в одну неделю)
- Минимум 15+ наблюдений для статистической значимости
- Если паттерн работал в апреле но не в мае — он НЕСТАБИЛЕН, отбросить

ФОРМАТ ОТВЕТА:
1. Таблица: каждый час (1-24) × каждый день (Пн/Вт/Чт/Сб + Ср/Пт/Вс) — винрейт и кол-во наблюдений
2. Таблица: каждый час по неделям — показать тренд (растёт/падает/стабилен)
3. ТОП-5 самых стабильных комбинаций с обоснованием
4. ИТОГОВАЯ РЕКОМЕНДАЦИЯ: на какой час и день ставить СЕЙЧАС (май 2026)

Ответь на русском.`;

            const userPrompt = `ДАННЫЕ BTC (polymarket_prices, Reddit Only, с 15 апреля 2026, только Пн/Вт/Чт/Сб + Ср/Пт/Вс):

${JSON.stringify(dataForAnalysis, null, 0)}

Всего записей: ${dataForAnalysis.length} дней
Период: 15 апреля — 21 мая 2026

ВАЖНО: 
- Анализ запускается в 08:00 МСК, час 1 = 09:00-10:00 МСК, час 5 = 13:00-14:00 МСК
- Мне нужна стратегия для Polymarket (ставка на направление свечи, кэф ~2.0)
- Ищи паттерн который работает СЕЙЧАС (последние 2 недели), а не только в прошлом
- Покажи недельную динамику для каждого кандидата чтобы видеть деградацию`;

            const response = await fetch(`${BACKEND_URL}/api/proxy/post?url=https://api.anthropic.com/v1/messages`, {
                method: "POST",
                headers: {
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    model: "claude-opus-4-7",
                    max_tokens: 4096,
                    system: systemPrompt,
                    messages: [{ role: "user", content: userPrompt }]
                })
            });

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`Claude API Error: ${response.status} — ${errBody.slice(0, 200)}`);
            }

            const data = await response.json();
            const text = data.content?.[0]?.text || "Пустой ответ от Claude";
            setPatternResult(text);
        } catch (e: any) {
            setPatternError(e.message || 'Неизвестная ошибка');
        } finally {
            setPatternLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{'\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u043F\u0440\u043E\u0433\u043D\u043E\u0437\u043E\u0432'}</h2>
                    <p className="text-gray-400 text-sm">{'\u0410\u043D\u0430\u043B\u0438\u0437 \u0442\u043E\u0447\u043D\u043E\u0441\u0442\u0438 AI \u043F\u043E \u0447\u0430\u0441\u0430\u043C \u0438 \u043C\u043E\u043D\u0435\u0442\u0430\u043C (c 15 \u0430\u043F\u0440\u0435\u043B\u044F)'}</p>
                </div>
                <button
                    onClick={findPattern}
                    disabled={patternLoading}
                    className="mt-4 sm:mt-0 px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {patternLoading ? (
                        <>
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Анализ...
                        </>
                    ) : (
                        <>🔍 Анализ BTC (Opus)</>
                    )}
                </button>
            </div>

            {/* Mode: Reddit Only */}

            {/* Pattern Analysis Result */}
            {patternError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
                    ❌ {patternError}
                </div>
            )}
            {patternResult && (
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider">🧠 AI-анализ паттернов</h3>
                        <button onClick={() => setPatternResult(null)} className="text-gray-500 hover:text-gray-300 text-xs">✕ Закрыть</button>
                    </div>
                    <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
                        {patternResult}
                    </div>
                </div>
            )}

            {/* HOT Pattern: Bullish BTC hours 2-3 */}
            {(() => {
                // Calculate Bullish BTC hours 2-3 stats
                const bullishBtc = valid.filter(t => t.symbol === 'BTC' && t.prediction === 'Bullish');
                const hotResults: { date: string; day: string; hour: number; matched: boolean; weekNum: number }[] = [];
                bullishBtc.forEach(t => {
                    const mskDate = new Date(new Date(t.created_at).getTime() + 3 * 60 * 60 * 1000);
                    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                    const weekNum = Math.floor((new Date(t.created_at).getTime() - new Date('2026-04-15').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
                    (t.polymarket_prices || []).forEach(pp => {
                        if ((pp.hour === 2 || pp.hour === 3) && pp.matched !== null) {
                            hotResults.push({
                                date: mskDate.toISOString().slice(5, 10).replace('-', '.'),
                                day: dayNames[mskDate.getUTCDay()],
                                hour: pp.hour,
                                matched: pp.matched,
                                weekNum,
                            });
                        }
                    });
                });
                const hotWins = hotResults.filter(r => r.matched).length;
                const hotPct = hotResults.length > 0 ? Math.round((hotWins / hotResults.length) * 100) : 0;
                const last7 = hotResults.slice(-7);
                const last7Wins = last7.filter(r => r.matched).length;
                const last7Pct = last7.length > 0 ? Math.round((last7Wins / last7.length) * 100) : 0;

                return hotResults.length > 0 ? (
                    <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-2 border-red-500/40 rounded-xl p-5 shadow-lg shadow-red-500/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🔥</span>
                                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">HOT: Bullish BTC • Часы 2-3</h3>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold animate-pulse">HOT</span>
                            </div>
                            <button onClick={() => setCellModal({ hour: 2, symbol: 'BTC', predictionFilter: 'Bullish' })} className="text-[10px] text-red-400 hover:text-red-300 underline">Подробнее →</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className={`text-2xl font-bold ${hotPct >= 60 ? 'text-emerald-400' : hotPct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{hotPct}%</div>
                                <div className="text-[10px] text-gray-500 uppercase">Винрейт</div>
                                <div className="text-[10px] text-gray-600">{hotWins}/{hotResults.length}</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className={`text-2xl font-bold ${last7Pct >= 60 ? 'text-emerald-400' : last7Pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{last7Pct}%</div>
                                <div className="text-[10px] text-gray-500 uppercase">Посл. 7</div>
                                <div className="text-[10px] text-gray-600">{last7Wins}/{last7.length}</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-white">{hotResults.length}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Наблюдений</div>
                                <div className="text-[10px] text-gray-600">Только Bullish</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-white">2-3 AM ET</div>
                                <div className="text-[10px] text-gray-500 uppercase">Часы</div>
                                <div className="text-[10px] text-gray-600">10:00-12:00 МСК</div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400">
                            Фильтр: только дни когда AI прогноз = Bullish для BTC. Часы 2-3 (2AM-4AM ET / 10:00-12:00 МСК).
                        </div>
                    </div>
                ) : null;
            })()}

            {/* Day-of-week pattern tracking */}
            {(() => {
                // Define patterns: day -> [{etHour, symbol}]
                const dayPatterns: Record<number, {et: number, sym: string, label: string}[]> = {
                    1: [{et:3,sym:'BTC',label:'3-4AM BTC'},{et:3,sym:'BNB',label:'3-4AM BNB'},{et:5,sym:'SOL',label:'5-6AM SOL'}],
                    2: [{et:3,sym:'BTC',label:'3-4AM BTC'},{et:7,sym:'DOGE',label:'7-8AM DOGE'},{et:8,sym:'BTC',label:'8-9AM BTC'},{et:8,sym:'SOL',label:'8-9AM SOL'},{et:13,sym:'BNB',label:'1-2PM BNB'},{et:21,sym:'BTC',label:'9-10PM BTC'}],
                    3: [{et:5,sym:'SOL',label:'5-6AM SOL'},{et:7,sym:'BTC',label:'7-8AM BTC'},{et:7,sym:'ETH',label:'7-8AM ETH'}],
                    4: [],
                    5: [{et:2,sym:'BTC',label:'2-3AM BTC'},{et:7,sym:'DOGE',label:'7-8AM DOGE'},{et:8,sym:'BTC',label:'8-9AM BTC'},{et:8,sym:'SOL',label:'8-9AM SOL'},{et:13,sym:'SOL',label:'1-2PM SOL'},{et:21,sym:'BTC',label:'9-10PM BTC'}],
                    6: [{et:3,sym:'BTC',label:'3-4AM BTC'},{et:3,sym:'BNB',label:'3-4AM BNB'},{et:5,sym:'SOL',label:'5-6AM SOL'},{et:8,sym:'SOL',label:'8-9AM SOL'},{et:13,sym:'BNB',label:'1-2PM BNB'},{et:13,sym:'SOL',label:'1-2PM SOL'}],
                    0: [{et:2,sym:'BTC',label:'2-3AM BTC'},{et:7,sym:'BTC',label:'7-8AM BTC'},{et:7,sym:'DOGE',label:'7-8AM DOGE'},{et:21,sym:'BTC',label:'9-10PM BTC'}],
                };

                // Calculate winrate for each pattern entry
                // Need to map ET hour to polymarket hour number
                // Hour 1 in polymarket = first hour after analysis (09:00 MSK = 06:00 UTC = 1AM ET + 1 = 2AM ET?)
                // From StatsTracker fmtET: startUtcHour=5, candleStartUtc = 5 + hour - 1, etStart = (candleStartUtc - 4 + 24) % 24
                // So: etStart = (5 + hour - 1 - 4 + 24) % 24 = (hour + 24) % 24 = hour (for hour < 24)
                // Actually: etStart = (5 + hour - 1 - 4 + 24) % 24 = (hour) % 24
                // So polymarket hour N corresponds to ET hour N (1AM for hour 1, 2AM for hour 2, etc.)
                // Wait: hour=1 -> etStart = (5+1-1-4+24)%24 = 25%24 = 1 -> 1AM-2AM ET ✓

                const patternStats: {label: string, sym: string, wins: number, total: number, day: string, hour: number}[] = [];
                const dayNames: Record<number, string> = {0:'Вс',1:'Пн',2:'Вт',3:'Ср',4:'Чт',5:'Пт',6:'Сб'};

                Object.entries(dayPatterns).forEach(([dayStr, patterns]) => {
                    const dayNum = Number(dayStr);
                    if (patterns.length === 0) return;
                    
                    patterns.forEach(p => {
                        let wins = 0, total = 0;
                        // polymarket hour = ET hour (from the formula above)
                        const polyHour = p.et;
                        
                        valid.filter(t => t.symbol === p.sym).forEach(t => {
                            const mskDate = new Date(new Date(t.created_at).getTime() + 3 * 60 * 60 * 1000);
                            if (mskDate.getUTCDay() !== dayNum) return;
                            (t.polymarket_prices || []).forEach(pp => {
                                if (pp.hour === polyHour && pp.matched !== null) {
                                    total++;
                                    if (pp.matched) wins++;
                                }
                            });
                        });
                        
                        if (total > 0) {
                            patternStats.push({ label: p.label, sym: p.sym, wins, total, day: dayNames[dayNum], hour: polyHour });
                        }
                    });
                });

                // Group by day
                const grouped: Record<string, typeof patternStats> = {};
                patternStats.forEach(p => {
                    if (!grouped[p.day]) grouped[p.day] = [];
                    grouped[p.day].push(p);
                });

                const dayOrder = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

                return (
                    <div className="bg-brand-card border border-indigo-500/20 rounded-xl p-5 md:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">🎯 Отслеживание паттернов по дням (60%+)</h3>
                            <button
                                onClick={() => {
                                    // Collect detailed daily data for each pattern
                                    const detailRows: string[] = [];
                                    Object.entries(dayPatterns).forEach(([dayStr, patterns]) => {
                                        const dayNum = Number(dayStr);
                                        if (patterns.length === 0) return;
                                        const dayNames2: Record<number, string> = {0:'Вс',1:'Пн',2:'Вт',3:'Ср',4:'Чт',5:'Пт',6:'Сб'};
                                        patterns.forEach(p => {
                                            const polyHour = p.et;
                                            valid.filter(t => t.symbol === p.sym).forEach(t => {
                                                const mskDate = new Date(new Date(t.created_at).getTime() + 3 * 60 * 60 * 1000);
                                                if (mskDate.getUTCDay() !== dayNum) return;
                                                (t.polymarket_prices || []).forEach(pp => {
                                                    if (pp.hour === polyHour && pp.matched !== null) {
                                                        const dateStr = mskDate.toISOString().slice(0, 10);
                                                        detailRows.push(`${dayNames2[dayNum]},${p.label.split(' ')[0]},${p.sym},${dateStr},${pp.matched ? 'ДА' : 'НЕТ'}`);
                                                    }
                                                });
                                            });
                                        });
                                    });
                                    const header = 'День,Час (ET),Монета,Дата,Результат\n';
                                    const csv = header + detailRows.join('\n');
                                    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `patterns_detail_${new Date().toISOString().split('T')[0]}.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                            >
                                📥 CSV
                            </button>
                        </div>
                        <div className="space-y-3">
                            {dayOrder.filter(d => grouped[d]).map(day => (
                                <div key={day} className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-white bg-gray-800 px-2 py-1 rounded w-8 text-center">{day}</span>
                                    {grouped[day].map((p, i) => {
                                        const pct = Math.round((p.wins / p.total) * 100);
                                        return (
                                            <span key={i} onClick={() => setCellModal({ hour: p.hour, symbol: p.sym })} className={`text-[10px] px-2 py-1 rounded font-mono cursor-pointer hover:opacity-80 transition ${pct >= 60 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : pct >= 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                                                {p.label} <span className="font-bold">{pct}%</span> <span className="text-gray-500">({p.wins}/{p.total})</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Full hour table */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{'\u0422\u043E\u0447\u043D\u043E\u0441\u0442\u044C \u043F\u043E \u0432\u0441\u0435\u043C \u0447\u0430\u0441\u0430\u043C'}</h3>
                <div className="flex items-center gap-4 mb-4 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500/15 border border-emerald-400/40 inline-block"></span> 60%+ винрейт</span>
                    <span className="text-gray-600">• Кликни на ячейку для детальной статистики</span>
                </div>
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

                                // Pattern highlighting (only for reddit_only mode)
                                // Opus 4.7 pattern: first 1-3 hours for BTC/ETH
                                const opusHours = [1, 2, 3];
                                const opusCoins = ['BTC', 'ETH'];

                                const isRedditOnly = modeFilter === 'reddit_only';

                                return (
                                    <tr key={hour} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                        <td className="py-1.5 px-2 text-blue-400 font-mono">{fmtET(hour)}</td>
                                        {coinRanking.map(c => {
                                            const cs = hs[c.symbol];
                                            const pct = cs ? Math.round((cs.wins / cs.total) * 100) : 0;
                                            const color = pct >= 55 ? 'text-emerald-400' : pct >= 48 ? 'text-gray-300' : 'text-red-400';

                                            // Determine highlight
                                            let bgHighlight = '';
                                            if (cs && pct >= 60) {
                                                bgHighlight = 'bg-emerald-500/15 border border-emerald-400/40 rounded';
                                            }

                                            return <td key={c.symbol} className={`py-1.5 px-2 text-center font-mono cursor-pointer hover:bg-gray-700/50 transition ${color} ${bgHighlight}`} onClick={() => cs && setCellModal({ hour, symbol: c.symbol })}>{cs ? `${pct}%` : '—'}</td>;
                                        })}
                                        <td className={`py-1.5 px-2 text-center font-bold ${allPct >= 55 ? 'text-emerald-400' : allPct >= 48 ? 'text-white' : 'text-red-400'}`}>{allPct}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hour 1 + Confidence Analysis */}
            {(() => {
                // Collect hour 1 results with confidence
                const h1Data: { date: string; day: string; symbol: string; prediction: string; confidence: number; matched: boolean }[] = [];
                valid.forEach(t => {
                    const mskDate = new Date(new Date(t.created_at).getTime() + 3 * 60 * 60 * 1000);
                    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                    (t.polymarket_prices || []).forEach(pp => {
                        if (pp.hour === 1 && pp.matched !== null) {
                            h1Data.push({
                                date: mskDate.toISOString().slice(0, 10),
                                day: dayNames[mskDate.getUTCDay()],
                                symbol: t.symbol,
                                prediction: t.prediction,
                                confidence: t.confidence,
                                matched: pp.matched,
                            });
                        }
                    });
                });

                // Group by confidence ranges
                const ranges = [
                    { label: '75%+', min: 75, max: 100 },
                    { label: '65-74%', min: 65, max: 74 },
                    { label: '55-64%', min: 55, max: 64 },
                    { label: '<55%', min: 0, max: 54 },
                ];
                const rangeStats = ranges.map(r => {
                    const items = h1Data.filter(d => d.confidence >= r.min && d.confidence <= r.max);
                    const wins = items.filter(d => d.matched).length;
                    return { ...r, wins, total: items.length, pct: items.length > 0 ? Math.round((wins / items.length) * 100) : 0 };
                });

                const totalWins = h1Data.filter(d => d.matched).length;
                const totalPct = h1Data.length > 0 ? Math.round((totalWins / h1Data.length) * 100) : 0;

                return (
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">🎯 Час 1 × Уверенность</h3>
                            <button
                                onClick={() => {
                                    const header = 'Дата,День,Монета,Прогноз,Уверенность%,Совпало\n';
                                    const csvRows = h1Data.map(d => `${d.date},${d.day},${d.symbol},${d.prediction},${d.confidence},${d.matched ? 'ДА' : 'НЕТ'}`).join('\n');
                                    const csv = '\ufeff' + header + csvRows;
                                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `hour1_confidence_${new Date().toISOString().split('T')[0]}.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                            >
                                📥 CSV
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 mb-3">Винрейт первого часа в зависимости от уверенности AI. Всего: {totalPct}% ({totalWins}/{h1Data.length})</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {rangeStats.map(r => (
                                <div key={r.label} className={`rounded-lg p-3 text-center ${r.pct >= 60 ? 'bg-emerald-500/10 border border-emerald-500/30' : r.pct >= 50 ? 'bg-gray-800 border border-gray-700' : 'bg-red-500/10 border border-red-500/30'}`}>
                                    <div className="text-[10px] text-gray-500 uppercase mb-1">Conf {r.label}</div>
                                    <div className={`text-xl font-bold ${r.pct >= 60 ? 'text-emerald-400' : r.pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{r.total > 0 ? `${r.pct}%` : '—'}</div>
                                    <div className="text-[9px] text-gray-600">{r.wins}/{r.total}</div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
                            {coinRanking.map(c => {
                                const coinH1 = h1Data.filter(d => d.symbol === c.symbol);
                                const coinWins = coinH1.filter(d => d.matched).length;
                                const coinPct = coinH1.length > 0 ? Math.round((coinWins / coinH1.length) * 100) : 0;
                                const avgConf = coinH1.length > 0 ? Math.round(coinH1.reduce((s, d) => s + d.confidence, 0) / coinH1.length) : 0;
                                return (
                                    <div key={c.symbol} className="bg-gray-900/50 rounded-lg p-2 text-center">
                                        <div className="text-xs font-bold text-white">{c.symbol}</div>
                                        <div className={`text-sm font-bold ${coinPct >= 55 ? 'text-emerald-400' : coinPct >= 48 ? 'text-yellow-400' : 'text-red-400'}`}>{coinPct}%</div>
                                        <div className="text-[9px] text-gray-500">avg conf: {avgConf}%</div>
                                        <div className="text-[9px] text-gray-600">{coinWins}/{coinH1.length}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })()}

            {/* 4-Hour Blocks Section */}
            {(() => {
                const blocks = [
                    { label: '07-11 МСК', hours: [1, 2, 3] },
                    { label: '11-15 МСК', hours: [4, 5, 6, 7] },
                    { label: '15-19 МСК', hours: [8, 9, 10, 11] },
                    { label: '19-23 МСК', hours: [12, 13, 14, 15] },
                    { label: '23-03 МСК', hours: [16, 17, 18, 19] },
                    { label: '03-07 МСК', hours: [20, 21, 22, 23, 24] },
                ];

                // Calculate 4h block stats per coin
                const blockStats: Record<string, Record<string, { wins: number; total: number }>> = {};
                blocks.forEach(b => { blockStats[b.label] = {}; });

                valid.forEach(t => {
                    (t.polymarket_prices || []).forEach(pp => {
                        if (pp.matched === null) return;
                        const block = blocks.find(b => b.hours.includes(pp.hour));
                        if (!block) return;
                        if (!blockStats[block.label][t.symbol]) blockStats[block.label][t.symbol] = { wins: 0, total: 0 };
                        if (!blockStats[block.label]['ALL']) blockStats[block.label]['ALL'] = { wins: 0, total: 0 };
                        blockStats[block.label][t.symbol].total++;
                        blockStats[block.label]['ALL'].total++;
                        if (pp.matched) {
                            blockStats[block.label][t.symbol].wins++;
                            blockStats[block.label]['ALL'].wins++;
                        }
                    });
                });

                // 4h block direction stats (open of first candle vs close of last candle in block)
                const blockDirStats: Record<string, Record<string, { wins: number; total: number }>> = {};
                blocks.forEach(b => { blockDirStats[b.label] = {}; });

                valid.forEach(t => {
                    const pp = t.polymarket_prices || [];
                    if (pp.length < 4) return;

                    blocks.forEach(block => {
                        const blockPrices = pp.filter(p => block.hours.includes(p.hour));
                        if (blockPrices.length < 2) return;

                        const openPrice = blockPrices[0]?.open || 0;
                        const closePrice = blockPrices[blockPrices.length - 1]?.close || 0;
                        if (openPrice === 0 || closePrice === 0) return;

                        const realDir = closePrice >= openPrice ? 'up' : 'down';
                        const predDirs = blockPrices.map(p => p.predicted_direction).filter(Boolean);
                        const upCount = predDirs.filter((d: string) => d === 'up').length;
                        const downCount = predDirs.filter((d: string) => d === 'down').length;
                        const predDir = upCount >= downCount ? 'up' : 'down';

                        if (!blockDirStats[block.label][t.symbol]) blockDirStats[block.label][t.symbol] = { wins: 0, total: 0 };
                        if (!blockDirStats[block.label]['ALL']) blockDirStats[block.label]['ALL'] = { wins: 0, total: 0 };
                        blockDirStats[block.label][t.symbol].total++;
                        blockDirStats[block.label]['ALL'].total++;
                        if (predDir === realDir) {
                            blockDirStats[block.label][t.symbol].wins++;
                            blockDirStats[block.label]['ALL'].wins++;
                        }
                    });
                });

                return (
                    <div className="bg-brand-card border border-orange-500/20 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4">⏱️ 4-часовые блоки (направление за блок)</h3>
                        <p className="text-[10px] text-gray-500 mb-3">Совпало ли направление прогноза с реальным движением за 4-часовой блок (open первой свечи → close последней)</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="text-gray-500 border-b border-gray-800">
                                        <th className="py-2 px-2 text-left">Блок</th>
                                        {coinRanking.map(c => <th key={c.symbol} className="py-2 px-2 text-center">{c.symbol}</th>)}
                                        <th className="py-2 px-2 text-center font-bold">ИТОГО</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blocks.map(block => {
                                        const bs = blockDirStats[block.label] || {};
                                        const allS = bs['ALL'];
                                        const allPct = allS && allS.total > 0 ? Math.round((allS.wins / allS.total) * 100) : 0;
                                        return (
                                            <tr key={block.label} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                                <td className="py-1.5 px-2 text-orange-400 font-mono text-xs">{block.label}</td>
                                                {coinRanking.map(c => {
                                                    const cs = bs[c.symbol];
                                                    const pct = cs && cs.total > 0 ? Math.round((cs.wins / cs.total) * 100) : 0;
                                                    const color = pct >= 60 ? 'text-emerald-400' : pct >= 50 ? 'text-gray-300' : 'text-red-400';
                                                    const bg = cs && pct >= 60 ? 'bg-emerald-500/15 border border-emerald-400/40 rounded' : '';
                                                    return (
                                                        <td key={c.symbol} className={`py-1.5 px-2 text-center font-mono ${color} ${bg}`}>
                                                            {cs && cs.total > 0 ? `${pct}%` : '—'}
                                                            {cs && cs.total > 0 && <span className="text-gray-600 text-[9px] ml-0.5">({cs.wins}/{cs.total})</span>}
                                                        </td>
                                                    );
                                                })}
                                                <td className={`py-1.5 px-2 text-center font-bold ${allPct >= 55 ? 'text-emerald-400' : allPct >= 48 ? 'text-white' : 'text-red-400'}`}>
                                                    {allPct}%
                                                    {allS && <span className="text-gray-600 text-[9px] ml-0.5">({allS.wins}/{allS.total})</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3 text-[10px] text-gray-600">
                            Часовой винрейт внутри блоков (для сравнения):
                            <div className="flex flex-wrap gap-2 mt-1">
                                {blocks.map(block => {
                                    const bs = blockStats[block.label] || {};
                                    const allS = bs['ALL'];
                                    const pct = allS && allS.total > 0 ? Math.round((allS.wins / allS.total) * 100) : 0;
                                    return (
                                        <span key={block.label} className={`px-2 py-0.5 rounded ${pct >= 55 ? 'bg-emerald-500/10 text-emerald-400' : pct >= 48 ? 'bg-gray-800 text-gray-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {block.label}: {pct}% ({allS?.wins || 0}/{allS?.total || 0})
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Daily Performance Section */}
            <div className="bg-brand-card border border-cyan-500/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">📅 Дневная точность (прогноз vs реальность за 24ч)</h3>
                    <div className="flex items-center gap-2">
                        {dailyData && (
                            <button
                                onClick={() => {
                                    const header = 'Дата,Монета,Прогноз,Confidence,Цена старт,Цена финиш (24ч),Изменение %,Направление совпало,Режим\n';
                                    const rows = dailyData.rows.map((r: any) =>
                                        `${new Date(r.date).toLocaleDateString('ru-RU')},${r.symbol},${r.prediction},${r.confidence},${r.start_price},${r.end_price},${r.actual_change_pct},${r.direction_matched ? 'Да' : 'Нет'},${r.mode || ''}`
                                    ).join('\n');
                                    const csv = header + rows;
                                    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `forecast_daily_${new Date().toISOString().split('T')[0]}.csv`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }}
                                className="px-4 py-1.5 bg-gray-700/50 hover:bg-gray-700 text-gray-300 border border-gray-600/50 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                            >
                                📥 CSV
                            </button>
                        )}
                        <button
                            onClick={fetchDailyPerformance}
                            disabled={dailyLoading}
                            className="px-4 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                        >
                            {dailyLoading ? 'Загрузка...' : '📊 Загрузить'}
                        </button>
                    </div>
                </div>

                {dailyData && (
                    <div className="space-y-4">
                        {/* Summary stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-white">{dailyData.stats.total_forecasts}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Всего прогнозов</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className={`text-xl font-bold ${dailyData.stats.win_rate >= 55 ? 'text-emerald-400' : dailyData.stats.win_rate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {dailyData.stats.win_rate}%
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase">Направление совпало</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-xl font-bold text-emerald-400">
                                    {dailyData.stats.bullish_count > 0 ? Math.round(dailyData.stats.bullish_matched / dailyData.stats.bullish_count * 100) : 0}%
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase">Bullish точность</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className={`text-xl font-bold ${dailyData.stats.avg_actual_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {dailyData.stats.avg_actual_change >= 0 ? '+' : ''}{dailyData.stats.avg_actual_change}%
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase">Среднее изменение</div>
                            </div>
                        </div>

                        {/* By coin stats */}
                        {dailyData.stats.by_coin && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                                {Object.entries(dailyData.stats.by_coin).map(([sym, s]: [string, any]) => (
                                    <div key={sym} className="bg-gray-900/50 rounded-lg p-2 text-center">
                                        <div className="text-xs font-bold text-white">{sym}</div>
                                        <div className={`text-sm font-bold ${s.win_rate >= 55 ? 'text-emerald-400' : s.win_rate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                            {s.win_rate}%
                                        </div>
                                        <div className="text-[9px] text-gray-500">{s.matched}/{s.total} • avg {s.avg_change >= 0 ? '+' : ''}{s.avg_change}%</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Table of all forecasts */}
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-900">
                                    <tr className="text-gray-500 border-b border-gray-800 uppercase">
                                        <th className="py-2 px-2 text-left">Дата</th>
                                        <th className="py-2 px-2 text-left">Монета</th>
                                        <th className="py-2 px-2 text-center">Прогноз</th>
                                        <th className="py-2 px-2 text-center">Conf</th>
                                        <th className="py-2 px-2 text-right">Старт</th>
                                        <th className="py-2 px-2 text-right">Финиш (24ч)</th>
                                        <th className="py-2 px-2 text-right">Изменение</th>
                                        <th className="py-2 px-2 text-center">Результат</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyData.rows.map((r: any, i: number) => (
                                        <tr key={i} className={`border-b border-gray-800/30 hover:bg-gray-800/20 ${r.direction_matched ? '' : 'bg-red-500/5'}`}>
                                            <td className="py-1.5 px-2 text-gray-400 font-mono">
                                                {new Date(r.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                                            </td>
                                            <td className="py-1.5 px-2 font-bold text-white">{r.symbol}</td>
                                            <td className={`py-1.5 px-2 text-center font-bold ${r.prediction === 'Bullish' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {r.prediction === 'Bullish' ? '📈' : '📉'} {r.prediction}
                                            </td>
                                            <td className="py-1.5 px-2 text-center text-gray-300">{r.confidence}</td>
                                            <td className="py-1.5 px-2 text-right font-mono text-gray-400">
                                                ${r.start_price < 1 ? r.start_price.toFixed(5) : r.start_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </td>
                                            <td className="py-1.5 px-2 text-right font-mono text-gray-300">
                                                ${r.end_price < 1 ? r.end_price.toFixed(5) : r.end_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                            </td>
                                            <td className={`py-1.5 px-2 text-right font-mono font-bold ${r.actual_change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {r.actual_change_pct >= 0 ? '+' : ''}{r.actual_change_pct}%
                                            </td>
                                            <td className="py-1.5 px-2 text-center text-lg">
                                                {r.direction_matched ? '✅' : '❌'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!dailyData && !dailyLoading && (
                    <p className="text-gray-500 text-sm text-center py-4">Нажмите «Загрузить» чтобы увидеть дневную статистику прогнозов</p>
                )}
            </div>

            {/* Cell Detail Modal */}
            {cellModal && (() => {
                const { hour, symbol, predictionFilter } = cellModal;
                // Collect daily results for this hour+symbol (optionally filtered by prediction)
                const dailyResults: { date: string; day: string; matched: boolean; weekNum: number }[] = [];
                valid.filter(t => t.symbol === symbol && (!predictionFilter || t.prediction === predictionFilter)).forEach(t => {
                    const mskDate = new Date(new Date(t.created_at).getTime() + 3 * 60 * 60 * 1000);
                    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
                    const weekNum = Math.floor((new Date(t.created_at).getTime() - new Date('2026-04-15').getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
                    (t.polymarket_prices || []).forEach(pp => {
                        // For HOT pattern (predictionFilter + hour 2), also include hour 3
                        const matchHour = predictionFilter ? (pp.hour === hour || pp.hour === hour + 1) : pp.hour === hour;
                        if (matchHour && pp.matched !== null) {
                            dailyResults.push({
                                date: mskDate.toISOString().slice(5, 10).replace('-', '.'),
                                day: dayNames[mskDate.getUTCDay()],
                                matched: pp.matched,
                                weekNum,
                            });
                        }
                    });
                });

                // Filter by selected day
                const filteredResults = modalDayFilter ? dailyResults.filter(r => r.day === modalDayFilter) : dailyResults;

                // Calculate running winrate (cumulative) from filtered results
                let cumWins = 0;
                const runningWinrate = filteredResults.map((r, i) => {
                    if (r.matched) cumWins++;
                    return { ...r, cumPct: Math.round((cumWins / (i + 1)) * 100), idx: i + 1 };
                });

                const totalWins = filteredResults.filter(r => r.matched).length;
                const totalPct = filteredResults.length > 0 ? Math.round((totalWins / filteredResults.length) * 100) : 0;

                // Last 7 results
                const last7 = filteredResults.slice(-7);
                const last7Wins = last7.filter(r => r.matched).length;
                const last7Pct = last7.length > 0 ? Math.round((last7Wins / last7.length) * 100) : 0;

                // Weekly breakdown from filtered
                const weeklyBreakdown: Record<number, { wins: number; total: number }> = {};
                filteredResults.forEach(r => {
                    if (!weeklyBreakdown[r.weekNum]) weeklyBreakdown[r.weekNum] = { wins: 0, total: 0 };
                    weeklyBreakdown[r.weekNum].total++;
                    if (r.matched) weeklyBreakdown[r.weekNum].wins++;
                });

                return (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setCellModal(null); setModalDayFilter(null); }}>
                        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-white">{symbol} • {fmtET(hour)} • Час {hour}{predictionFilter ? ` • ${predictionFilter}` : ''}{modalDayFilter ? ` • ${modalDayFilter}` : ''}</h3>
                                <button onClick={() => { setCellModal(null); setModalDayFilter(null); }} className="text-gray-400 hover:text-white text-xl">✕</button>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className={`text-xl font-bold ${totalPct >= 55 ? 'text-emerald-400' : totalPct >= 48 ? 'text-yellow-400' : 'text-red-400'}`}>{totalPct}%</div>
                                    <div className="text-[10px] text-gray-500">Всего ({totalWins}/{dailyResults.length})</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className={`text-xl font-bold ${last7Pct >= 55 ? 'text-emerald-400' : last7Pct >= 48 ? 'text-yellow-400' : 'text-red-400'}`}>{last7Pct}%</div>
                                    <div className="text-[10px] text-gray-500">Посл. 7 дней ({last7Wins}/{last7.length})</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center">
                                    <div className="text-xl font-bold text-white">{dailyResults.length}</div>
                                    <div className="text-[10px] text-gray-500">Наблюдений</div>
                                </div>
                            </div>

                            {/* By day of week */}
                            <div className="bg-gray-800 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="text-xs text-gray-400 uppercase font-bold">📆 По дням недели</div>
                                    {modalDayFilter && <button onClick={() => setModalDayFilter(null)} className="text-[10px] text-blue-400 hover:text-blue-300">Показать все</button>}
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(dayName => {
                                        const dayResults = dailyResults.filter(r => r.day === dayName);
                                        const dayWins = dayResults.filter(r => r.matched).length;
                                        const dayPct = dayResults.length > 0 ? Math.round((dayWins / dayResults.length) * 100) : -1;
                                        const isSelected = modalDayFilter === dayName;
                                        return (
                                            <div key={dayName} onClick={() => setModalDayFilter(isSelected ? null : dayName)} className={`rounded-lg p-2 text-center cursor-pointer transition hover:opacity-80 ${isSelected ? 'ring-2 ring-white' : ''} ${dayPct === -1 ? 'bg-gray-900/50' : dayPct >= 60 ? 'bg-emerald-500/15 border border-emerald-500/30' : dayPct >= 50 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                                                <div className="text-[10px] text-gray-500">{dayName}</div>
                                                <div className={`text-sm font-bold ${dayPct === -1 ? 'text-gray-600' : dayPct >= 60 ? 'text-emerald-400' : dayPct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{dayPct === -1 ? '—' : dayPct + '%'}</div>
                                                <div className="text-[9px] text-gray-600">{dayResults.length > 0 ? `${dayWins}/${dayResults.length}` : ''}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {modalDayFilter && <div className="mt-2 text-[10px] text-blue-400">Фильтр: только {modalDayFilter}</div>}
                            </div>

                            {/* Weekly breakdown */}
                            <div className="bg-gray-800 rounded-lg p-4 mb-4">
                                <div className="text-xs text-gray-400 uppercase font-bold mb-3">📊 По неделям</div>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                    {Object.entries(weeklyBreakdown).sort(([a], [b]) => Number(a) - Number(b)).map(([wk, s]) => {
                                        const pct = s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0;
                                        return (
                                            <div key={wk} className={`rounded-lg p-2 text-center ${pct >= 75 ? 'bg-emerald-500/10 border border-emerald-500/30' : pct >= 50 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                                                <div className="text-[10px] text-gray-500">Нед. {wk}</div>
                                                <div className={`text-lg font-bold ${pct >= 75 ? 'text-emerald-400' : pct >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{pct}%</div>
                                                <div className="text-[10px] text-gray-600">{s.wins}/{s.total}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Running winrate chart */}
                            <div className="bg-gray-800 rounded-lg p-4 mb-4">
                                <div className="text-xs text-gray-400 uppercase font-bold mb-2">📈 Кумулятивный винрейт</div>
                                <div className="flex items-end gap-[2px] h-24">
                                    {runningWinrate.map((r, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                            <div 
                                                className={`w-full rounded-t-sm ${r.cumPct >= 55 ? 'bg-emerald-500' : r.cumPct >= 48 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ height: `${r.cumPct}%` }}
                                                title={`${r.date}: ${r.cumPct}%`}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between mt-1 text-[9px] text-gray-600">
                                    <span>{runningWinrate[0]?.date || ''}</span>
                                    <span className="text-gray-500">50% линия</span>
                                    <span>{runningWinrate[runningWinrate.length - 1]?.date || ''}</span>
                                </div>
                            </div>

                            {/* Daily results grouped by week */}
                            <div className="bg-gray-800 rounded-lg p-4">
                                <div className="text-xs text-gray-400 uppercase font-bold mb-2">📅 По дням (старые → новые)</div>
                                <div className="space-y-2">
                                    {(() => {
                                        // Group by week
                                        const weeks: Record<number, typeof filteredResults> = {};
                                        filteredResults.forEach(r => {
                                            if (!weeks[r.weekNum]) weeks[r.weekNum] = [];
                                            weeks[r.weekNum].push(r);
                                        });
                                        return Object.entries(weeks).sort(([a], [b]) => Number(a) - Number(b)).map(([wk, days]) => {
                                            const wkWins = days.filter(d => d.matched).length;
                                            const wkPct = days.length > 0 ? Math.round((wkWins / days.length) * 100) : 0;
                                            return (
                                                <div key={wk} className="flex items-center gap-2 flex-wrap">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${wkPct >= 60 ? 'bg-emerald-500/20 text-emerald-400' : wkPct >= 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>Н{wk} {wkPct}%</span>
                                                    {days.map((r, i) => (
                                                        <div key={i} className={`px-2 py-1 rounded text-[10px] font-mono ${r.matched ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                                            {r.date} {r.day} {r.matched ? '✅' : '❌'}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default StatsTracker;
