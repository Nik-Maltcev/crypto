import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

const PAIRS_DATA = [
    { a: 'XRP', b: 'DOGE', corr: 0.81, trades: 30, wr: 83, avg: 2.51, year: 75.2 },
    { a: 'DOGE', b: 'ETC', corr: 0.86, trades: 33, wr: 82, avg: 2.27, year: 74.8 },
    { a: 'LTC', b: 'ETC', corr: 0.82, trades: 27, wr: 70, avg: 1.97, year: 53.2 },
    { a: 'SHIB', b: 'DOT', corr: 0.83, trades: 30, wr: 73, avg: 1.59, year: 47.6 },
    { a: 'DOGE', b: 'AVAX', corr: 0.82, trades: 26, wr: 69, avg: 1.49, year: 38.8 },
];

const PairsTrading: React.FC = () => {
    const [positions, setPositions] = useState<Record<string, any>>({});
    const [checking, setChecking] = useState(false);

    const fetchPositions = async () => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/pairs/status`);
            if (resp.ok) {
                const data = await resp.json();
                setPositions(data.positions || {});
            }
        } catch (e) { console.error(e); }
    };

    const runCheck = async () => {
        setChecking(true);
        try {
            await fetch(`${BACKEND_URL}/api/pairs/check`, { method: 'POST' });
            setTimeout(fetchPositions, 5000);
        } catch (e) { console.error(e); }
        finally { setChecking(false); }
    };

    useEffect(() => { fetchPositions(); }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-white">Pairs Trading</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Маркет-нейтральная стратегия. Зарабатываем на расхождении коррелированных монет, независимо от направления рынка.
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-brand-card border border-gray-800 rounded-xl p-5 text-center">
                    <div className="text-3xl font-bold text-emerald-400">+289%</div>
                    <div className="text-xs text-gray-500 uppercase mt-1">Годовой PNL (5 пар)</div>
                </div>
                <div className="bg-brand-card border border-gray-800 rounded-xl p-5 text-center">
                    <div className="text-3xl font-bold text-white">75%</div>
                    <div className="text-xs text-gray-500 uppercase mt-1">Средний Winrate</div>
                </div>
                <div className="bg-brand-card border border-gray-800 rounded-xl p-5 text-center">
                    <div className="text-3xl font-bold text-blue-400">146</div>
                    <div className="text-xs text-gray-500 uppercase mt-1">Трейдов / год</div>
                </div>
                <div className="bg-brand-card border border-gray-800 rounded-xl p-5 text-center">
                    <div className="text-3xl font-bold text-yellow-400">+2.3%</div>
                    <div className="text-xs text-gray-500 uppercase mt-1">Ср. профит на трейд</div>
                </div>
            </div>

            {/* How it works */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Как работает</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-2xl mb-2">1.</div>
                        <div className="text-sm text-gray-300 font-semibold">Расхождение</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Две монеты обычно ходят вместе. Вдруг одна убежала вверх, другая отстала. Z-score {'>'} 1.0
                        </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-2xl mb-2">2.</div>
                        <div className="text-sm text-gray-300 font-semibold">Вход</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Long отстающую + Short убежавшую. Равные суммы на обе ноги. Плечо x2-x3.
                        </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <div className="text-2xl mb-2">3.</div>
                        <div className="text-sm text-gray-300 font-semibold">Выход</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Z-score возвращается к 0 (спред закрылся). Профит +2-3%. Таймаут: 14 дней.
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Strategy */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Стратегия подробно</h3>
                
                <div className="space-y-6">
                    {/* What is pairs trading */}
                    <div>
                        <h4 className="text-sm font-bold text-blue-400 uppercase mb-2">Что такое Pairs Trading</h4>
                        <p className="text-sm text-gray-300">
                            Pairs Trading — маркет-нейтральная стратегия, основанная на статистическом арбитраже. 
                            Мы находим пары монет с высокой исторической корреляцией (0.80+) и торгуем моменты, 
                            когда они временно расходятся, в расчёте на возврат к среднему (mean reversion).
                        </p>
                    </div>

                    {/* Parameters */}
                    <div>
                        <h4 className="text-sm font-bold text-blue-400 uppercase mb-2">Параметры системы</h4>
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Окно расчёта</div>
                                <div className="text-sm text-white font-semibold">20 дней (скользящее среднее)</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Порог входа</div>
                                <div className="text-sm text-white font-semibold">Z-score {'>'} 1.0 или {'<'} -1.0</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Take Profit</div>
                                <div className="text-sm text-emerald-400 font-semibold">Z-score возвращается к 0</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Stop Loss</div>
                                <div className="text-sm text-red-400 font-semibold">Z-score {'>'} 2.5 (расхождение усиливается)</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Таймаут</div>
                                <div className="text-sm text-yellow-400 font-semibold">14 дней максимум в позиции</div>
                            </div>
                            <div className="bg-gray-800/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500">Плечо</div>
                                <div className="text-sm text-white font-semibold">x2-x3 (не выше)</div>
                            </div>
                        </div>
                    </div>

                    {/* Example */}
                    <div>
                        <h4 className="text-sm font-bold text-blue-400 uppercase mb-2">Пример сделки (XRP/DOGE)</h4>
                        <div className="bg-gray-900/80 border border-gray-700 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center">1</span>
                                <span className="text-gray-300">XRP вырос на 8% за 3 дня, DOGE вырос только на 2%. Z-score = 1.3</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center">2</span>
                                <span className="text-gray-300">Сигнал: Short XRP ($50) + Long DOGE ($50) на MEXC Futures</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs flex items-center justify-center">3</span>
                                <span className="text-gray-300">Через 6 дней: DOGE догнал XRP, z-score = 0.1</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center">4</span>
                                <span className="text-gray-300">Закрываем обе ноги. Профит: +$2.50 (2.5%)</span>
                            </div>
                        </div>
                    </div>

                    {/* Risk Management */}
                    <div>
                        <h4 className="text-sm font-bold text-blue-400 uppercase mb-2">Управление рисками</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <span className="text-red-400 font-bold">SL:</span>
                                <span className="text-gray-300">Если z-score уходит дальше 2.5 — корреляция сломалась, выходим с убытком ~3-5%</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-yellow-400 font-bold">Timeout:</span>
                                <span className="text-gray-300">Если за 14 дней спред не закрылся — выходим по рынку (может быть плюс или минус)</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-blue-400 font-bold">Хедж:</span>
                                <span className="text-gray-300">Long + Short одновременно = защита от обвала рынка. Если BTC -20%, обе ноги падают, но спред сохраняется</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-purple-400 font-bold">Размер:</span>
                                <span className="text-gray-300">Равные суммы на обе ноги. Не более 20% депозита на одну пару</span>
                            </div>
                        </div>
                    </div>

                    {/* Where to trade */}
                    <div>
                        <h4 className="text-sm font-bold text-blue-400 uppercase mb-2">Где торговать</h4>
                        <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-300">
                            <p className="font-semibold text-white mb-2">MEXC Futures</p>
                            <ul className="space-y-1 text-xs text-gray-400">
                                <li>+ Все нужные пары есть (XRP, DOGE, ETC, LTC, SHIB, DOT, AVAX)</li>
                                <li>+ Комиссия 0.02% maker / 0.04% taker</li>
                                <li>+ Плечо до x200 (мы используем x2-x3)</li>
                                <li>+ Нет KYC до $10K вывода</li>
                                <li>+ Работает в РФ</li>
                            </ul>
                        </div>
                    </div>

                    {/* Automation */}
                    <div>
                        <h4 className="text-sm font-bold text-blue-400 uppercase mb-2">Автоматизация</h4>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                                <div className="text-emerald-400 font-semibold text-xs mb-1">Что делает бот</div>
                                <ul className="text-xs text-gray-400 space-y-0.5">
                                    <li>Берёт цены с CoinGecko ежедневно</li>
                                    <li>Считает z-score для 5 пар</li>
                                    <li>Отправляет email при входе/выходе</li>
                                    <li>Отслеживает TP/SL/Timeout</li>
                                </ul>
                            </div>
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                                <div className="text-blue-400 font-semibold text-xs mb-1">Что делаешь ты</div>
                                <ul className="text-xs text-gray-400 space-y-0.5">
                                    <li>Получаешь алерт на email</li>
                                    <li>Открываешь MEXC Futures</li>
                                    <li>Открываешь/закрываешь позиции</li>
                                    <li>~5 минут в день максимум</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Positions */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Активные позиции</h3>
                    <button
                        onClick={runCheck}
                        disabled={checking}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg text-sm font-semibold transition"
                    >
                        {checking ? 'Проверяю...' : 'Проверить сейчас'}
                    </button>
                </div>
                {Object.keys(positions).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Нет активных позиций. Бот проверяет каждый день в 09:00 MSK.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(positions).map(([pair, pos]: [string, any]) => (
                            <div key={pair} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <span className="text-lg font-bold text-emerald-400">{pair}</span>
                                    <span className="text-sm text-gray-400 ml-3">{pos.direction === 'long_a_short_b' ? `Long ${pair.split('/')[0]} / Short ${pair.split('/')[1]}` : `Short ${pair.split('/')[0]} / Long ${pair.split('/')[1]}`}</span>
                                </div>
                                <div className="text-xs text-gray-500">Z: {pos.entry_zscore?.toFixed(2)} | {pos.entry_date?.slice(0, 10)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pairs Table */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Бэктест (365 дней)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-700">
                                <th className="text-left py-2">Пара</th>
                                <th className="text-center py-2">Корр.</th>
                                <th className="text-center py-2">Трейды</th>
                                <th className="text-center py-2">Winrate</th>
                                <th className="text-center py-2">Ср. профит</th>
                                <th className="text-right py-2">Год PNL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PAIRS_DATA.map((p, i) => (
                                <tr key={i} className="border-b border-gray-800/40">
                                    <td className="py-3 font-bold text-white">{p.a}/{p.b}</td>
                                    <td className="py-3 text-center text-gray-400">{p.corr}</td>
                                    <td className="py-3 text-center text-gray-300">{p.trades}</td>
                                    <td className="py-3 text-center">
                                        <span className={`font-bold ${p.wr >= 75 ? 'text-emerald-400' : p.wr >= 65 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            {p.wr}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-center text-emerald-400">+{p.avg}%</td>
                                    <td className="py-3 text-right font-bold text-emerald-400">+{p.year}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Economics */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Экономика</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-500 uppercase">Депозит $100</div>
                        <div className="text-xl font-bold text-white mt-2">~$28/мес</div>
                        <div className="text-xs text-gray-500 mt-1">~$290/год</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-blue-500/30">
                        <div className="text-xs text-blue-400 uppercase">Депозит $1,000</div>
                        <div className="text-xl font-bold text-white mt-2">~$280/мес</div>
                        <div className="text-xs text-gray-500 mt-1">~$2,900/год</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                        <div className="text-xs text-gray-500 uppercase">Депозит $5,000</div>
                        <div className="text-xl font-bold text-white mt-2">~$1,400/мес</div>
                        <div className="text-xs text-gray-500 mt-1">~$14,500/год</div>
                    </div>
                </div>
            </div>

            {/* Advantages */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Преимущества</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">+</span>
                        <span className="text-gray-300">Не зависит от направления рынка (маркет-нейтральная)</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">+</span>
                        <span className="text-gray-300">75% winrate подтверждён на 365 днях данных</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">+</span>
                        <span className="text-gray-300">Не нужно сидеть у экрана 24/7 (1 проверка/день)</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">+</span>
                        <span className="text-gray-300">Минимальные комиссии (0.16% round trip на MEXC)</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">+</span>
                        <span className="text-gray-300">Полная автоматизация сигналов (бот + email)</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">+</span>
                        <span className="text-gray-300">Математическая модель, не интуиция</span>
                    </div>
                </div>
            </div>

            {/* Risk Disclaimer */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-red-400/80">
                    Бэктест не гарантирует будущих результатов. Торговля криптовалютами сопряжена с высоким риском. Используйте только те средства, потерю которых можете себе позволить.
                </p>
            </div>
        </div>
    );
};

export default PairsTrading;
