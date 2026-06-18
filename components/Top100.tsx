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
                                <tr key={coin.id} className="border-b border-gray-800/40 hover:bg-gray-800/20">
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Top100;
