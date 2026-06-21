import React from 'react';

const PAIRS_DATA = [
    { a: 'VTI', b: 'ARKK', corr: 0.81, trades: 22, wr: 86, avg: 1.09, year: 24.1, desc: 'Total Market vs ARK Innovation' },
    { a: 'DIA', b: 'IWM', corr: 0.82, trades: 22, wr: 77, avg: 0.61, year: 13.5, desc: 'Dow Jones vs Russell 2000' },
    { a: 'QQQ', b: 'EEM', corr: 0.80, trades: 21, wr: 76, avg: 0.50, year: 10.4, desc: 'Nasdaq vs Emerging Markets' },
    { a: 'EEM', b: 'EFA', corr: 0.81, trades: 22, wr: 77, avg: 0.36, year: 7.9, desc: 'Emerging vs Developed Markets' },
    { a: 'SPY', b: 'IWM', corr: 0.83, trades: 20, wr: 75, avg: 0.36, year: 7.1, desc: 'S&P 500 vs Russell 2000' },
];

const FOREX_DATA = [
    { a: 'AUDUSD', b: 'USDZAR', corr: -0.78, trades: 23, wr: 70, avg: 0.66, year: 15.3, desc: 'AUD vs ZAR (inverse)' },
    { a: 'USDMXN', b: 'USDZAR', corr: 0.79, trades: 26, wr: 92, avg: 0.53, year: 13.8, desc: 'Мексика vs ЮАР' },
    { a: 'EURUSD', b: 'USDCHF', corr: -0.86, trades: 16, wr: 69, avg: 0.31, year: 5.0, desc: 'Euro vs Franc (inverse)' },
    { a: 'EURUSD', b: 'GBPUSD', corr: 0.83, trades: 21, wr: 71, avg: 0.16, year: 3.3, desc: 'Euro vs Pound' },
    { a: 'EURJPY', b: 'GBPJPY', corr: 0.82, trades: 21, wr: 71, avg: 0.15, year: 3.2, desc: 'Euro/Yen vs Pound/Yen' },
];

const MOEX_DATA = [
    { a: 'ROSN', b: 'TATN', corr: 0.73, trades: 26, wr: 69, avg: 0.81, year: 21.0, desc: 'Роснефть vs Татнефть' },
    { a: 'GAZP', b: 'SNGS', corr: 0.72, trades: 21, wr: 76, avg: 0.52, year: 10.8, desc: 'Газпром vs Сургутнефтегаз' },
    { a: 'CHMF', b: 'NLMK', corr: 0.86, trades: 25, wr: 72, avg: 0.41, year: 10.3, desc: 'Северсталь vs НЛМК' },
    { a: 'LKOH', b: 'ROSN', corr: 0.74, trades: 24, wr: 67, avg: 0.11, year: 2.7, desc: 'Лукойл vs Роснефть' },
];

const PairsStocks: React.FC = () => {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-white">Pairs Trading: Акции, ETF, Forex</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    Те же принципы mean reversion — на традиционных рынках. Более стабильный winrate, меньшая волатильность.
                </p>
            </div>

            {/* Comparison */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-brand-card border border-blue-500/30 rounded-xl p-5 text-center">
                    <div className="text-xs text-blue-400 uppercase mb-2">Крипта</div>
                    <div className="text-2xl font-bold text-white">+75%</div>
                    <div className="text-xs text-gray-500 mt-1">WR 83% | 30 трейдов</div>
                </div>
                <div className="bg-brand-card border border-emerald-500/30 rounded-xl p-5 text-center">
                    <div className="text-xs text-emerald-400 uppercase mb-2">Акции/ETF</div>
                    <div className="text-2xl font-bold text-white">+24%</div>
                    <div className="text-xs text-gray-500 mt-1">WR 86% | 22 трейда</div>
                </div>
                <div className="bg-brand-card border border-yellow-500/30 rounded-xl p-5 text-center">
                    <div className="text-xs text-yellow-400 uppercase mb-2">Forex</div>
                    <div className="text-2xl font-bold text-white">+15%</div>
                    <div className="text-xs text-gray-500 mt-1">WR 92% | 26 трейдов</div>
                </div>
            </div>

            {/* Stocks/ETF Table */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-1">Акции / ETF</h3>
                <p className="text-xs text-gray-500 mb-4">Торгуется на Interactive Brokers, MEXC (для COIN/MSTR), или любом брокере с доступом к US акциям</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-700">
                                <th className="text-left py-2">Пара</th>
                                <th className="text-left py-2">Описание</th>
                                <th className="text-center py-2">Корр.</th>
                                <th className="text-center py-2">Трейды</th>
                                <th className="text-center py-2">WR</th>
                                <th className="text-right py-2">Год PNL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PAIRS_DATA.map((p, i) => (
                                <tr key={i} className="border-b border-gray-800/40">
                                    <td className="py-3 font-bold text-white">{p.a}/{p.b}</td>
                                    <td className="py-3 text-gray-400 text-xs">{p.desc}</td>
                                    <td className="py-3 text-center text-gray-400">{p.corr}</td>
                                    <td className="py-3 text-center text-gray-300">{p.trades}</td>
                                    <td className="py-3 text-center">
                                        <span className={`font-bold ${p.wr >= 80 ? 'text-emerald-400' : p.wr >= 70 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            {p.wr}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-bold text-emerald-400">+{p.year}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Forex Table */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-1">Forex</h3>
                <p className="text-xs text-gray-500 mb-4">Торгуется на MetaTrader, OANDA, Interactive Brokers. Плечо до x100 (осторожно!)</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-700">
                                <th className="text-left py-2">Пара</th>
                                <th className="text-left py-2">Описание</th>
                                <th className="text-center py-2">Корр.</th>
                                <th className="text-center py-2">Трейды</th>
                                <th className="text-center py-2">WR</th>
                                <th className="text-right py-2">Год PNL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {FOREX_DATA.map((p, i) => (
                                <tr key={i} className="border-b border-gray-800/40">
                                    <td className="py-3 font-bold text-white">{p.a}/{p.b}</td>
                                    <td className="py-3 text-gray-400 text-xs">{p.desc}</td>
                                    <td className="py-3 text-center text-gray-400">{p.corr}</td>
                                    <td className="py-3 text-center text-gray-300">{p.trades}</td>
                                    <td className="py-3 text-center">
                                        <span className={`font-bold ${p.wr >= 80 ? 'text-emerald-400' : p.wr >= 70 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            {p.wr}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-bold text-emerald-400">+{p.year}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Key Insight */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Ключевые наблюдения</h3>
                <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400">1.</span>
                        <span><strong>VTI/ARKK</strong> — лучшая пара на акциях. Когда ARKK (инновации) отстаёт от рынка (VTI) — она догоняет. 86% winrate.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400">2.</span>
                        <span><strong>USD/MXN vs USD/ZAR</strong> — 92% winrate на форексе. Песо и рэнд — обе EM валюты, двигаются вместе vs доллара.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400">3.</span>
                        <span><strong>Плечо</strong> — на форексе нужно x10-x30 чтобы заработать нормально (спреды крошечные). На акциях x2-x3 достаточно.</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="text-emerald-400">4.</span>
                        <span><strong>Диверсификация</strong> — торгуй пары на разных рынках одновременно. Крипта + акции + форекс = больше сделок, меньше корреляция между стратегиями.</span>
                    </div>
                </div>
            </div>

            {/* Detailed Instructions */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Пошаговая инструкция</h3>
                
                <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="border-l-2 border-blue-500 pl-4">
                        <div className="text-sm font-bold text-blue-400 mb-1">Шаг 1. Получаешь алерт</div>
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>Бот ежедневно в 09:00 MSK проверяет z-score всех пар. Если z-score {'>'} 1.0 или {'<'} -1.0 — приходит email:</p>
                            <div className="bg-gray-900 rounded p-2 font-mono text-[10px] mt-2">
                                <p className="text-emerald-400">📊 PAIRS ENTRY: Long DOGE / Short ETC</p>
                                <p className="text-gray-500">Z-score: -1.62</p>
                                <p className="text-gray-500">🟢 LONG DOGE: entry $0.0834 | SL $0.0767 (-8%)</p>
                                <p className="text-gray-500">🔴 SHORT ETC: entry $7.338 | SL $7.925 (+8%)</p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="border-l-2 border-emerald-500 pl-4">
                        <div className="text-sm font-bold text-emerald-400 mb-1">Шаг 2. Открываешь позиции</div>
                        <div className="text-xs text-gray-400 space-y-1">
                            <p><strong>Для крипты</strong> — MEXC Futures:</p>
                            <ul className="list-disc ml-4 space-y-0.5">
                                <li>Открываешь DOGEUSDT → Long (купить) на $50</li>
                                <li>Открываешь ETCUSDT → Short (продать) на $50</li>
                                <li>Плечо x2-x3 (не выше!)</li>
                                <li>Ставишь SL из алерта на каждую ногу</li>
                            </ul>
                            <p className="mt-2"><strong>Для акций US</strong> — Interactive Brokers / Trading212:</p>
                            <ul className="list-disc ml-4 space-y-0.5">
                                <li>Buy VTI на $500 (или CFD)</li>
                                <li>Sell Short ARKK на $500</li>
                                <li>SL 8% на каждую ногу</li>
                            </ul>
                            <p className="mt-2"><strong>Для MOEX</strong> — Тинькофф / БКС:</p>
                            <ul className="list-disc ml-4 space-y-0.5">
                                <li>Купить ROSN на 50,000₽</li>
                                <li>Продать (шорт) TATN на 50,000₽</li>
                                <li>SL 8% на каждую ногу</li>
                            </ul>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="border-l-2 border-yellow-500 pl-4">
                        <div className="text-sm font-bold text-yellow-400 mb-1">Шаг 3. Ждёшь (1-14 дней)</div>
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>Ничего не делаешь. Спред возвращается к среднему сам по себе. Не трогай позиции.</p>
                            <p>Проверяешь раз в день — бот сам пришлёт алерт на выход.</p>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="border-l-2 border-purple-500 pl-4">
                        <div className="text-sm font-bold text-purple-400 mb-1">Шаг 4. Получаешь алерт на выход</div>
                        <div className="text-xs text-gray-400 space-y-1">
                            <div className="bg-gray-900 rounded p-2 font-mono text-[10px]">
                                <p className="text-yellow-400">📊 PAIRS EXIT: Close DOGE/ETC</p>
                                <p className="text-gray-500">Z-score вернулся к 0. Закрывай обе позиции.</p>
                            </div>
                            <p className="mt-1">Закрываешь обе ноги. Фиксируешь профит +2-3%.</p>
                        </div>
                    </div>

                    {/* Step 5 */}
                    <div className="border-l-2 border-red-500 pl-4">
                        <div className="text-sm font-bold text-red-400 mb-1">Шаг 5. Если сработал SL</div>
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>Если одна из ног пробила -8% — SL закрывает её автоматически на бирже.</p>
                            <p>Вторую ногу закрываешь вручную сразу. Убыток: ~3-5% от позиции.</p>
                            <p className="text-yellow-400">Это нормально — случается в 17-25% случаев. На дистанции стратегия прибыльная.</p>
                        </div>
                    </div>
                </div>

                {/* Rules */}
                <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                    <div className="text-sm font-bold text-white mb-2">Правила (не нарушай):</div>
                    <div className="text-xs text-gray-400 space-y-1">
                        <p>1. Равные суммы на обе ноги (Long $50 = Short $50)</p>
                        <p>2. Плечо не выше x3 (для крипты) / x2 (для акций)</p>
                        <p>3. Не более 20% депозита на одну пару</p>
                        <p>4. Если SL сработал — не переоткрывай ту же пару сразу. Жди новый сигнал.</p>
                        <p>5. Таймаут 14 дней — если z-score не вернулся, закрывай по рынку.</p>
                        <p>6. Не удаляй SL. Никогда. Это твоя страховка от поломки корреляции.</p>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-xs text-red-400/80">
                    Бэктест на 365 дней не гарантирует будущих результатов. Высокое плечо увеличивает как прибыль так и убытки. Используйте только средства, потерю которых можете себе позволить.
                </p>
            </div>


            {/* MOEX Table */}
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-1">МосБиржа (MOEX)</h3>
                <p className="text-xs text-gray-500 mb-4">Торгуется через Тинькофф, БКС, Финам. Шорт доступен. Без VPN.</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-700">
                                <th className="text-left py-2">Пара</th>
                                <th className="text-left py-2">Описание</th>
                                <th className="text-center py-2">Корр.</th>
                                <th className="text-center py-2">Трейды</th>
                                <th className="text-center py-2">WR</th>
                                <th className="text-right py-2">Год PNL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOEX_DATA.map((p, i) => (
                                <tr key={i} className="border-b border-gray-800/40">
                                    <td className="py-3 font-bold text-white">{p.a}/{p.b}</td>
                                    <td className="py-3 text-gray-400 text-xs">{p.desc}</td>
                                    <td className="py-3 text-center text-gray-400">{p.corr}</td>
                                    <td className="py-3 text-center text-gray-300">{p.trades}</td>
                                    <td className="py-3 text-center">
                                        <span className={`font-bold ${p.wr >= 75 ? 'text-emerald-400' : p.wr >= 65 ? 'text-yellow-400' : 'text-gray-300'}`}>
                                            {p.wr}%
                                        </span>
                                    </td>
                                    <td className="py-3 text-right font-bold text-emerald-400">+{p.year}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
                    <span className="text-white font-semibold">Преимущество MOEX:</span> торгуешь в рублях, без VPN, шорт через любого РФ брокера, данные с iss.moex.com бесплатно. Пары нефтянки (ROSN/TATN) и металлургии (CHMF/NLMK) — классика парного трейдинга на российском рынке.
                </div>
            </div>
        </div>
    );
};

export default PairsStocks;
