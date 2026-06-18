import React, { useState, useEffect } from 'react';

interface CoinData {
    id: string;
    symbol: string;
    name: string;
    market_cap_rank: number;
    current_price: number;
    market_cap: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d_in_currency: number;
    price_change_percentage_14d_in_currency: number;
    price_change_percentage_30d_in_currency: number;
    price_change_percentage_200d_in_currency: number;
    price_change_percentage_1y_in_currency: number;
    sparkline_in_7d?: { price: number[] };
}

const Top100: React.FC = () => {
    const [coins, setCoins] = useState<CoinData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState<string>('market_cap_rank');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [yearlyData, setYearlyData] = useState<{ prices: number[]; weeks: { week: number; open: number; close: number; change: number }[] } | null>(null);
    const [yearlyLoading, setYearlyLoading] = useState(false);

    const fetchCoins = async () => {
        setIsLoading(true);
        try {
            const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d,14d,30d,200d,1y';
            const resp = await fetch(url);
            if (resp.ok) {
                const data = await resp.json();
                setCoins(data);
            }
        } catch (e) {
            console.error(e);
        }
        setIsLoading(false);
    };

    useEffect(() => { fetchCoins(); }, []);

    const handleSort = (col: string) => {
        if (sortBy === col) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(col);
            setSortDir('desc');
        }
    };

    const loadYearly = async (coinId: string) => {
        if (expanded === coinId) {
            setExpanded(null);
            return;
        }
        setExpanded(coinId);
        setYearlyData(null);
        setYearlyLoading(true);
        try {
            const resp = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=365`);
            if (resp.ok) {
                const json = await resp.json();
                const prices: number[] = json.prices.map((p: [number, number]) => p[1]);
                // Group into weeks (7 days each)
                const dailyPrices = json.prices as [number, number][];
                const weeks: { week: number; open: number; close: number; change: number }[] = [];
                // Group by 7-day intervals using timestamps
                if (dailyPrices.length > 0) {
                    const startTime = dailyPrices[0][0];
                    const weekMs = 7 * 24 * 60 * 60 * 1000;
                    for (let w = 0; w < 52; w++) {
                        const wStart = startTime + w * weekMs;
                        const wEnd = wStart + weekMs;
                        const weekPrices = dailyPrices.filter(p => p[0] >= wStart && p[0] < wEnd);
                        if (weekPrices.length === 0) break;
                        const open = weekPrices[0][1];
                        const close = weekPrices[weekPrices.length - 1][1];
                        const change = ((close - open) / open) * 100;
                        weeks.push({ week: w + 1, open, close, change });
                    }
                }
                setYearlyData({ prices, weeks });
            }
        } catch {}
        setYearlyLoading(false);
    };

    const sorted = [...coins].sort((a: any, b: any) => {
        const av = a[sortBy] ?? 0;
        const bv = b[sortBy] ?? 0;
        return sortDir === 'asc' ? av - bv : bv - av;
    });

    const fmt = (val: number | null | undefined) => {
        if (val === null || val === undefined) return '—';
        return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
    };

    const color = (val: number | null | undefined) => {
        if (val === null || val === undefined) return 'text-gray-600';
        return val >= 0 ? 'text-emerald-400' : 'text-red-400';
    };

    const fmtMcap = (n: number) => {
        if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
        if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
        if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
        return `$${n.toFixed(0)}`;
    };

    if (isLoading) return <div className="flex justify-center py-20 text-gray-500">Загрузка топ-100 с CoinGecko...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Топ-100 монет</h2>
                    <p className="text-gray-400 text-sm">Рост/падение по периодам (CoinGecko). Клик по колонке для сортировки.</p>
                </div>
                <button onClick={fetchCoins} className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition mt-4 sm:mt-0">
                    🔄 Обновить
                </button>
            </div>

            <div className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-700 bg-gray-800/30">
                                <th className="text-left py-2 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('market_cap_rank')}>#</th>
                                <th className="text-left py-2 px-3">Монета</th>
                                <th className="text-right py-2 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('current_price')}>Цена</th>
                                <th className="text-right py-2 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('market_cap')}>MCap</th>
                                <th className="text-center py-2 px-3">7д график</th>
                                <th className="text-right py-2 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('price_change_percentage_24h')}>24ч</th>
                                <th className="text-right py-2 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('price_change_percentage_7d_in_currency')}>7д</th>
                                <th className="text-right py-2 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('price_change_percentage_14d_in_currency')}>14д</th>
                                <th className="text-right py-2 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('price_change_percentage_30d_in_currency')}>30д</th>
                                <th className="text-right py-2 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('price_change_percentage_200d_in_currency')}>200д</th>
                                <th className="text-right py-2 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('price_change_percentage_1y_in_currency')}>1г</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map(coin => (
                                <React.Fragment key={coin.id}>
                                <tr className="border-b border-gray-800/40 hover:bg-gray-800/20 cursor-pointer" onClick={() => loadYearly(coin.id)}>
                                    <td className="py-1.5 px-3 text-gray-500">{coin.market_cap_rank}</td>
                                    <td className="py-1.5 px-3">
                                        <span className="font-bold text-white">{coin.symbol.toUpperCase()}</span>
                                        <span className="text-gray-500 text-xs ml-1">{coin.name}</span>
                                    </td>
                                    <td className="py-1.5 px-3 text-right font-mono text-gray-300">
                                        ${coin.current_price < 1 ? coin.current_price.toFixed(6) : coin.current_price.toFixed(2)}
                                    </td>
                                    <td className="py-1.5 px-3 text-right text-gray-400">{fmtMcap(coin.market_cap)}</td>
                                    <td className="py-1.5 px-3">
                                        {coin.sparkline_in_7d?.price && (() => {
                                            const prices = coin.sparkline_in_7d!.price;
                                            const min = Math.min(...prices);
                                            const max = Math.max(...prices);
                                            const range = max - min || 1;
                                            const W = 80, H = 24;
                                            const step = prices.length > 1 ? W / (prices.length - 1) : 0;
                                            const points = prices.map((p, i) => `${(i * step).toFixed(1)},${(H - ((p - min) / range) * H).toFixed(1)}`).join(' ');
                                            const isUp = prices[prices.length - 1] >= prices[0];
                                            return (
                                                <svg width={W} height={H} className="inline-block">
                                                    <polyline points={points} fill="none" stroke={isUp ? '#10b981' : '#ef4444'} strokeWidth="1.5" />
                                                </svg>
                                            );
                                        })()}
                                    </td>
                                    <td className={`py-1.5 px-3 text-right font-mono font-bold ${color(coin.price_change_percentage_24h)}`}>
                                        {fmt(coin.price_change_percentage_24h)}
                                    </td>
                                    <td className={`py-1.5 px-3 text-right font-mono ${color(coin.price_change_percentage_7d_in_currency)}`}>
                                        {fmt(coin.price_change_percentage_7d_in_currency)}
                                    </td>
                                    <td className={`py-1.5 px-3 text-right font-mono ${color(coin.price_change_percentage_14d_in_currency)}`}>
                                        {fmt(coin.price_change_percentage_14d_in_currency)}
                                    </td>
                                    <td className={`py-1.5 px-3 text-right font-mono ${color(coin.price_change_percentage_30d_in_currency)}`}>
                                        {fmt(coin.price_change_percentage_30d_in_currency)}
                                    </td>
                                    <td className={`py-1.5 px-3 text-right font-mono ${color(coin.price_change_percentage_200d_in_currency)}`}>
                                        {fmt(coin.price_change_percentage_200d_in_currency)}
                                    </td>
                                    <td className={`py-1.5 px-3 text-right font-mono ${color(coin.price_change_percentage_1y_in_currency)}`}>
                                        {fmt(coin.price_change_percentage_1y_in_currency)}
                                    </td>
                                </tr>
                                {expanded === coin.id && (
                                    <tr>
                                        <td colSpan={11} className="p-4 bg-gray-900/50">
                                            {yearlyLoading ? (
                                                <div className="text-gray-500 text-center py-4">Загрузка годовых данных...</div>
                                            ) : yearlyData ? (
                                                <div className="space-y-3">
                                                    {/* Yearly sparkline */}
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">График за год (365 дней)</div>
                                                        <svg width="100%" height="60" viewBox={`0 0 ${yearlyData.prices.length} 60`} preserveAspectRatio="none" className="rounded bg-gray-800/30">
                                                            {(() => {
                                                                const p = yearlyData.prices;
                                                                const min = Math.min(...p);
                                                                const max = Math.max(...p);
                                                                const range = max - min || 1;
                                                                const points = p.map((v, i) => `${i},${60 - ((v - min) / range) * 58}`).join(' ');
                                                                const isUp = p[p.length - 1] >= p[0];
                                                                return <polyline points={points} fill="none" stroke={isUp ? '#10b981' : '#ef4444'} strokeWidth="1" />;
                                                            })()}
                                                        </svg>
                                                    </div>
                                                    {/* Weekly breakdown */}
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Понедельный рост/падение (52 недели)</div>
                                                        <div className="flex gap-0.5 flex-wrap">
                                                            {yearlyData.weeks.map(w => (
                                                                <div key={w.week}
                                                                    className={`w-5 h-5 rounded-sm flex items-center justify-center text-[7px] font-bold ${
                                                                        w.change >= 5 ? 'bg-emerald-500/40 text-emerald-300' :
                                                                        w.change >= 0 ? 'bg-emerald-500/15 text-emerald-400' :
                                                                        w.change >= -5 ? 'bg-red-500/15 text-red-400' :
                                                                        'bg-red-500/40 text-red-300'
                                                                    }`}
                                                                    title={`Нед ${w.week}: ${w.change >= 0 ? '+' : ''}${w.change.toFixed(1)}%`}
                                                                >
                                                                    {w.change >= 0 ? '↑' : '↓'}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Top100;
