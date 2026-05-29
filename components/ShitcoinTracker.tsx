import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface TokenData {
    contract: string;
    caller: string;
    message: string;
    detected_at: string;
    safety: string;
    price_at_call: number;
    mcap_at_call: number;
    rug_check: {
        score?: number;
        lp_locked_pct?: number;
        creator_pct?: number;
        top_holders_pct?: number;
        is_safe?: boolean;
    };
    dex_data: {
        name?: string;
        symbol?: string;
        price_usd?: number;
        market_cap?: number;
        liquidity_usd?: number;
        volume_24h?: number;
        price_change_5m?: number;
        price_change_1h?: number;
        dexscreener_url?: string;
    };
    price_history: { time: string; price: number; change_from_call: number; mcap: number }[];
}

const ShitcoinTracker: React.FC = () => {
    const [tokens, setTokens] = useState<TokenData[]>([]);
    const [monitorRunning, setMonitorRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTokens = async () => {
        try {
            const resp = await fetch(`${BACKEND_URL}/api/shitcoins/list`);
            if (resp.ok) {
                const data = await resp.json();
                if (data.success) {
                    setTokens(data.tokens);
                    setMonitorRunning(data.monitor_running);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const startMonitor = async () => {
        await fetch(`${BACKEND_URL}/api/shitcoins/start`, { method: 'POST' });
        setTimeout(fetchTokens, 3000);
    };

    useEffect(() => { fetchTokens(); const i = setInterval(fetchTokens, 30000); return () => clearInterval(i); }, []);

    const getSafetyColor = (safety: string) => {
        if (safety === 'SAFE') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (safety === 'DANGER') return 'bg-red-500/20 text-red-400 border-red-500/30';
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    };

    const getSafetyIcon = (safety: string) => {
        if (safety === 'SAFE') return '✅';
        if (safety === 'DANGER') return '❌';
        return '⚠️';
    };

    const formatPrice = (price: number) => {
        if (!price) return '$0';
        if (price < 0.000001) return `$${price.toExponential(2)}`;
        if (price < 0.001) return `$${price.toFixed(8)}`;
        if (price < 1) return `$${price.toFixed(6)}`;
        return `$${price.toFixed(4)}`;
    };

    const formatMcap = (mcap: number) => {
        if (!mcap) return '$0';
        if (mcap >= 1e6) return `$${(mcap / 1e6).toFixed(1)}M`;
        if (mcap >= 1e3) return `$${(mcap / 1e3).toFixed(0)}K`;
        return `$${mcap.toFixed(0)}`;
    };

    const getTimeSince = (isoDate: string) => {
        const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
        if (diff < 60) return `${Math.floor(diff)}с назад`;
        if (diff < 3600) return `${Math.floor(diff / 60)}м назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}ч назад`;
        return `${Math.floor(diff / 86400)}д назад`;
    };

    const getCurrentChange = (token: TokenData) => {
        if (token.price_history.length > 0) {
            return token.price_history[token.price_history.length - 1].change_from_call;
        }
        const currentPrice = token.dex_data?.price_usd || 0;
        const callPrice = token.price_at_call || 0;
        if (callPrice > 0 && currentPrice > 0) {
            return ((currentPrice - callPrice) / callPrice) * 100;
        }
        return 0;
    };

    if (isLoading) return <div className="flex justify-center py-20 text-gray-500">Загрузка...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">🎯 Щитки</h2>
                    <p className="text-gray-400 text-sm">Реалтайм мониторинг коллеров. RugCheck + Dexscreener.</p>
                </div>
                <div className="flex items-center gap-3 mt-4 sm:mt-0">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${monitorRunning ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${monitorRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
                        {monitorRunning ? 'Мониторинг активен' : 'Мониторинг выключен'}
                    </div>
                    {!monitorRunning && (
                        <button onClick={startMonitor} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition">
                            ▶ Запустить
                        </button>
                    )}
                    <button onClick={fetchTokens} className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition">
                        🔄
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{tokens.length}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Найдено токенов</div>
                </div>
                <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{tokens.filter(t => t.safety === 'SAFE').length}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Безопасных</div>
                </div>
                <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{tokens.filter(t => t.safety === 'DANGER').length}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Опасных</div>
                </div>
            </div>

            {/* Token list */}
            {tokens.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-xl">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">🎯</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Ожидание сигналов</h3>
                    <p className="text-gray-400 max-w-md">
                        Монитор слушает {monitorRunning ? '48' : '0'} каналов коллеров. Когда появится новый токен — он отобразится здесь.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {tokens.map((token, idx) => {
                        const change = getCurrentChange(token);
                        return (
                            <div key={token.contract} className="bg-brand-card border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-1 rounded border font-bold ${getSafetyColor(token.safety)}`}>
                                            {getSafetyIcon(token.safety)} {token.safety}
                                        </span>
                                        <div>
                                            <span className="text-lg font-bold text-white">{token.dex_data?.symbol || '???'}</span>
                                            <span className="text-xs text-gray-500 ml-2">{token.dex_data?.name || 'Unknown'}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-600 font-mono">{token.contract.slice(0, 6)}...{token.contract.slice(-4)}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500">MCap</div>
                                            <div className="text-sm font-bold text-white">{formatMcap(token.dex_data?.market_cap || token.mcap_at_call)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500">С момента колла</div>
                                            <div className={`text-lg font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500">
                                    <span>📡 @{token.caller}</span>
                                    <span>⏰ {getTimeSince(token.detected_at)}</span>
                                    <span>💧 LP: {(token.rug_check?.lp_locked_pct || 0).toFixed(0)}%</span>
                                    <span>👤 Creator: {(token.rug_check?.creator_pct || 0).toFixed(1)}%</span>
                                    <span>💰 Liq: {formatMcap(token.dex_data?.liquidity_usd || 0)}</span>
                                    {token.dex_data?.dexscreener_url && (
                                        <a href={token.dex_data.dexscreener_url} target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">
                                            📊 Dexscreener
                                        </a>
                                    )}
                                </div>
                                {token.price_history.length > 0 && (
                                    <div className="mt-2 flex items-center gap-1">
                                        {token.price_history.slice(-12).map((ph, i) => (
                                            <div key={i} className={`w-3 h-3 rounded-sm ${ph.change_from_call >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                title={`${ph.change_from_call >= 0 ? '+' : ''}${ph.change_from_call.toFixed(1)}%`}></div>
                                        ))}
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

export default ShitcoinTracker;
