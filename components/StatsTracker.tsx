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

    valid.filter(t => t.symbol === 'BTC').forEach(t => {
        const dayOfWeek = new Date(t.created_at).getDay();
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

            // Build structured data for Claude
            const dataForAnalysis = validData.map(t => ({
                symbol: t.symbol,
                prediction: t.prediction,
                confidence: t.confidence,
                created_at: t.created_at,
                day_of_week: new Date(t.created_at).toLocaleDateString('en-US', { weekday: 'long' }),
                polymarket_prices: (t.polymarket_prices || []).map(pp => ({
                    hour: pp.hour,
                    candle_direction: pp.candle_direction,
                    predicted_direction: pp.predicted_direction,
                    matched: pp.matched,
                })),
            }));

            const systemPrompt = `Ты аналитик данных со специализацией в статистической устойчивости. Тебе дают статистику прогнозов направления часовых свечей (polymarket_prices) по криптовалютам. Каждая запись — один анализ (один день), содержащий 24 часовых свечи с полями: hour (1-24), candle_direction (реальное направление), predicted_direction (прогноз AI), matched (совпало ли).

КРИТИЧЕСКИ ВАЖНО: Ты ищешь ТОЛЬКО НЕИЗМЕНЧИВЫЕ, СТРУКТУРНЫЕ паттерны — те, которые объясняются фундаментальной логикой (ликвидность монеты, природа сентимент-анализа, структура рынка), а НЕ случайным шумом выборки.

Правила оценки устойчивости:
- Паттерн считается устойчивым если он: (а) имеет логическое объяснение ПОЧЕМУ он работает, (б) наблюдается на большой выборке (>30 наблюдений), (в) не зависит от конкретной недели/периода
- Паттерн считается ИЗМЕНЧИВЫМ (отбросить!) если он: привязан к конкретному часу без объяснения, привязан к конкретному дню недели, основан на малой выборке (<20), или не имеет логического обоснования

Ответь на русском языке.`;

            const userPrompt = `Вот данные polymarket_prices (Reddit Only, с 15 апреля 2026):

${JSON.stringify(dataForAnalysis, null, 0)}

ЗАДАЧА: Найди НЕИЗМЕНЧИВЫЕ паттерны, которые будут работать и через месяц.

Анализируй по осям:
1. МОНЕТЫ — какие монеты структурно лучше прогнозируются сентимент-анализом Reddit и ПОЧЕМУ (ликвидность, корреляция с сентиментом, волатильность)
2. НАПРАВЛЕНИЕ — Bullish vs Bearish: что точнее и ПОЧЕМУ (bias Reddit, природа крипторынка)
3. CONFIDENCE — есть ли порог confidence после которого точность стабильно выше
4. КОМБИНАЦИИ — какие пары (монета + направление), (монета + confidence диапазон) дают устойчивый edge
5. ВРЕМЯ — есть ли СТРУКТУРНЫЕ временные паттерны (начало свечного цикла vs конец, первые часы vs последние) с логическим объяснением

ДЛЯ КАЖДОГО НАЙДЕННОГО ПАТТЕРНА ОБЯЗАТЕЛЬНО УКАЖИ:
- Точность (%) и количество наблюдений
- ПОЧЕМУ этот паттерн устойчив (логическое обоснование)
- Оценка риска что паттерн сломается (низкий/средний/высокий)

В КОНЦЕ — составь стратегию ТОЛЬКО из устойчивых паттернов:
- Какие фильтры применять к каждой ставке (монета, направление, confidence)
- Что НИКОГДА не делать (антипаттерны)
- Ожидаемый винрейт и при каких условиях он может упасть`;

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
                        <>🔍 Найти паттерн</>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strategy block */}
                <div className="bg-gradient-to-br from-emerald-900/30 to-cyan-900/30 border border-emerald-500/30 rounded-xl p-5 md:col-span-2">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4">🎯 Стратегия Polymarket: BTC (с 15 апреля)</h3>
                    
                    {/* Main strategy - highlighted */}
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">⭐</span>
                            <span className="text-sm font-bold text-emerald-400 uppercase">Основная: Час 3 + Час 5 (Пн/Вт/Чт/Сб)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{h3h5Pct}%</div>
                                <div className="text-[10px] text-gray-500 uppercase">Винрейт</div>
                                <div className="text-[10px] text-gray-600">{strategyStats.h3h5_primary.wins}/{strategyStats.h3h5_primary.total}</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-cyan-400">{weeklyMin}-{weeklyMax}%</div>
                                <div className="text-[10px] text-gray-500 uppercase">По неделям</div>
                                <div className="text-[10px] text-gray-600">Мин. {weeklyMin}%</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-white">8</div>
                                <div className="text-[10px] text-gray-500 uppercase">Ставок/нед</div>
                                <div className="text-[10px] text-gray-600">2 × 4 дня</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-yellow-400">⚡</div>
                                <div className="text-[10px] text-gray-500 uppercase">Стабильность</div>
                                <div className="text-[10px] text-gray-600">{weeklyMin >= 60 ? 'Высокая' : weeklyMin >= 50 ? 'Средняя' : 'Низкая'}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="text-sm text-gray-300">
                                <span className="text-emerald-400 font-bold">Час 3</span> (10:00-11:00 МСК) — ловит тренд, азиатская сессия
                            </div>
                            <div className="text-sm text-gray-300">
                                <span className="text-emerald-400 font-bold">Час 5</span> (12:00-13:00 МСК) — ловит боковик, европейская сессия
                            </div>
                        </div>
                    </div>

                    {/* Additional - hour 2 */}
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">➕</span>
                            <span className="text-sm font-bold text-gray-300 uppercase">Дополнительная: Час 2 (все дни)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-blue-400">{h2Pct}%</div>
                                <div className="text-[10px] text-gray-500 uppercase">Винрейт</div>
                                <div className="text-[10px] text-gray-600">{strategyStats.h2_all.wins}/{strategyStats.h2_all.total}</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-blue-400">—</div>
                                <div className="text-[10px] text-gray-500 uppercase">По неделям</div>
                                <div className="text-[10px] text-gray-600">Мин. 50%</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-white">7</div>
                                <div className="text-[10px] text-gray-500 uppercase">Ставок/нед</div>
                                <div className="text-[10px] text-gray-600">Каждый день</div>
                            </div>
                            <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                                <div className="text-2xl font-bold text-yellow-400">⚡</div>
                                <div className="text-[10px] text-gray-500 uppercase">Стабильность</div>
                                <div className="text-[10px] text-gray-600">Средняя</div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-400">
                            <span className="text-blue-400 font-bold">Час 2</span> (09:00-10:00 МСК) — работает каждый день, Пн/Вт/Чт/Сб: 67%, Ср/Пт/Вс: 71%. Низкая волатильность, но для Polymarket это не важно.
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="mt-4 p-3 bg-gray-900/30 rounded-lg">
                        <div className="text-xs text-gray-400">
                            <span className="text-yellow-400">⚠️</span> Данные: 15 апр — 21 мая 2026 (5 недель). Направление ставки = прогноз AI. Час 3+5 компенсируют друг друга при смене рыночного режима (тренд ↔ боковик).
                        </div>
                    </div>
                </div>
            </div>

            {/* Full hour table */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{'\u0422\u043E\u0447\u043D\u043E\u0441\u0442\u044C \u043F\u043E \u0432\u0441\u0435\u043C \u0447\u0430\u0441\u0430\u043C'}</h3>
                <div className="flex items-center gap-4 mb-4 text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500/15 border border-yellow-400/40 inline-block"></span> ⚡ Opus 4.7 — первые 1-3ч, BTC/ETH Bullish conf≥65 (56-60%)</span>
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
                                            if (isRedditOnly && cs) {
                                                const isOpus = opusCoins.includes(c.symbol) && opusHours.includes(hour);
                                                if (isOpus) {
                                                    bgHighlight = 'bg-yellow-500/15 border border-yellow-400/40 rounded';
                                                }
                                            }

                                            return <td key={c.symbol} className={`py-1.5 px-2 text-center font-mono ${color} ${bgHighlight}`}>{cs ? `${pct}%` : '—'}</td>;
                                        })}
                                        <td className={`py-1.5 px-2 text-center font-bold ${allPct >= 55 ? 'text-emerald-400' : allPct >= 48 ? 'text-white' : 'text-red-400'}`}>{allPct}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </div>
    );
};

export default StatsTracker;
