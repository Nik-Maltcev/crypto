import React, { useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface TokenData {
    contract: string;
    caller: string;
    message?: string;
    detected_at: string;
    safety: string;
    price_at_call: number;
    mcap_at_call: number;
    current_price?: number;
    current_change?: number;
    peak_price?: number;
    peak_change?: number;
    status?: string;
    // Flat fields from new DB format
    symbol?: string;
    name?: string;
    rug_score?: number;
    lp_locked_pct?: number;
    creator_pct?: number;
    liquidity_usd?: number;
    dexscreener_url?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    // Legacy nested format (backward compat)
    rug_check?: {
        score?: number;
        lp_locked_pct?: number;
        creator_pct?: number;
        top_holders_pct?: number;
        is_safe?: boolean;
    };
    dex_data?: {
        name?: string;
        symbol?: string;
        price_usd?: number;
        market_cap?: number;
        liquidity_usd?: number;
        volume_24h?: number;
        price_change_5m?: number;
        price_change_1h?: number;
        dexscreener_url?: string;
        website?: string;
        twitter?: string;
        telegram?: string;
    };
    price_history: { time: string; price: number; change_from_call: number; mcap: number }[];
}

const ShitcoinTracker: React.FC = () => {
    const [tokens, setTokens] = useState<TokenData[]>([]);
    const [monitorRunning, setMonitorRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

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
        if (safety === 'PUMPING') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        if (safety === 'DANGER') return 'bg-red-500/20 text-red-400 border-red-500/30';
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    };

    const getSafetyIcon = (safety: string) => {
        if (safety === 'SAFE') return '✅';
        if (safety === 'PUMPING') return '⚠️';
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
        // New format: direct field
        if (token.current_change !== undefined && token.current_change !== 0) {
            return token.current_change;
        }
        if (token.price_history && token.price_history.length > 0) {
            return token.price_history[token.price_history.length - 1].change_from_call;
        }
        return 0;
    };

    const getSymbol = (t: TokenData) => t.symbol || t.dex_data?.symbol || '???';
    const getName = (t: TokenData) => t.name || t.dex_data?.name || 'Unknown';
    const getMcap = (t: TokenData) => t.mcap_at_call || t.dex_data?.market_cap || 0;
    const getLpPct = (t: TokenData) => t.lp_locked_pct ?? t.rug_check?.lp_locked_pct ?? 0;
    const getCreatorPct = (t: TokenData) => t.creator_pct ?? t.rug_check?.creator_pct ?? 0;
    const getLiquidity = (t: TokenData) => t.liquidity_usd || t.dex_data?.liquidity_usd || 0;
    const getDexUrl = (t: TokenData) => t.dexscreener_url || t.dex_data?.dexscreener_url || '';
    const getWebsite = (t: TokenData) => t.website || t.dex_data?.website || '';
    const getTwitter = (t: TokenData) => t.twitter || t.dex_data?.twitter || '';
    const getTelegram = (t: TokenData) => t.telegram || t.dex_data?.telegram || '';

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
                    {localStorage.getItem('cryptopulse_admin') === '1' && (
                        <button onClick={async () => {
                            const resp = await fetch(`${BACKEND_URL}/api/shitcoins/logs`);
                            if (resp.ok) { const data = await resp.json(); setLogs(data.logs || []); setShowLogs(!showLogs); }
                        }} className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition">
                            📋 Логи
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{tokens.length}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Найдено</div>
                </div>
                <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{tokens.filter(t => getCurrentChange(t) > 0).length}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Выросли 📈</div>
                </div>
                <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{tokens.filter(t => getCurrentChange(t) < 0).length}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Упали 📉</div>
                </div>
                <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">
                        {tokens.length > 0 ? Math.round(tokens.filter(t => getCurrentChange(t) > 0).length / tokens.length * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase">Винрейт</div>
                </div>
            </div>

            {/* Live Logs (admin only) */}
            {showLogs && (
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 max-h-[400px] overflow-y-auto font-mono text-xs">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 font-bold uppercase text-[10px]">Логи монитора (последние {logs.length})</span>
                        <button onClick={() => setShowLogs(false)} className="text-gray-500 hover:text-white text-sm">✕</button>
                    </div>
                    {logs.length === 0 ? (
                        <p className="text-gray-500">Пусто — монитор ещё не писал логи с последнего деплоя</p>
                    ) : (
                        <div className="space-y-0.5">
                            {logs.slice().reverse().map((line, i) => (
                                <div key={i} className={`py-0.5 ${line.includes('ERROR') ? 'text-red-400' : line.includes('WARN') ? 'text-yellow-400' : line.includes('New token') ? 'text-emerald-400' : 'text-gray-400'}`}>
                                    {line}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Top performers & Worst */}
            {tokens.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Best */}
                    <div className="bg-brand-card border border-emerald-800/30 rounded-xl p-4">
                        <div className="text-xs font-bold text-emerald-400 uppercase mb-3">🏆 Лучшие выстрелы</div>
                        <div className="space-y-2">
                            {[...tokens].sort((a, b) => (b.peak_change || getCurrentChange(b)) - (a.peak_change || getCurrentChange(a))).slice(0, 5).map(t => (
                                <div key={t.contract} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="data-secret text-sm font-bold text-white">{getSymbol(t)}</span>
                                        <span className="text-xs text-gray-500">{getTimeSince(t.detected_at)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-emerald-400">+{(t.peak_change || getCurrentChange(t)).toFixed(0)}%</span>
                                        {getCurrentChange(t) < (t.peak_change || 0) && (
                                            <span className="text-xs text-gray-500 ml-1">(сейчас {getCurrentChange(t) >= 0 ? '+' : ''}{getCurrentChange(t).toFixed(0)}%)</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Worst */}
                    <div className="bg-brand-card border border-red-800/30 rounded-xl p-4">
                        <div className="text-xs font-bold text-red-400 uppercase mb-3">💀 Слились</div>
                        <div className="space-y-2">
                            {[...tokens].sort((a, b) => getCurrentChange(a) - getCurrentChange(b)).slice(0, 5).map(t => (
                                <div key={t.contract} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="data-secret text-sm font-bold text-white">{getSymbol(t)}</span>
                                        <span className="text-xs text-gray-500">{getTimeSince(t.detected_at)}</span>
                                    </div>
                                    <span className="text-sm font-bold text-red-400">{getCurrentChange(t).toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Buy Signals — tokens with +50%+ */}
            {tokens.filter(t => getCurrentChange(t) >= 50).length > 0 && (
                <div className="bg-gradient-to-r from-emerald-900/20 to-green-900/20 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-bold text-emerald-400 uppercase">🚀 Покупать (+50%+)</span>
                        <span className="text-xs text-gray-500">{tokens.filter(t => getCurrentChange(t) >= 50).length} токенов</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tokens.filter(t => getCurrentChange(t) >= 50).map(token => {
                            const change = getCurrentChange(token);
                            return (
                                <div key={token.contract} className="bg-gray-900/50 border border-emerald-700/30 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="data-secret text-base font-bold text-white">{getSymbol(token)}</span>
                                        <span className="text-lg font-bold text-emerald-400">+{change.toFixed(0)}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                                        <span>MCap: {formatMcap(getMcap(token))}</span>
                                        <span>Liq: {formatMcap(getLiquidity(token))}</span>
                                    </div>
                                    <a href={`https://app.telemetry.io/@lx0aw_ru?action=buy&token=${token.contract}`}
                                        target="_blank" rel="noopener"
                                        className="block w-full text-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition">
                                        🚀 Купить
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
                                            <span className="data-secret text-lg font-bold text-white">{getSymbol(token)}</span>
                                            <span className="text-xs text-gray-500 ml-2">{getName(token)}</span>
                                        </div>
                                        <span className="data-secret text-[10px] text-gray-600 font-mono cursor-pointer hover:text-gray-400 transition"
                                            onClick={() => {navigator.clipboard.writeText(token.contract); }}
                                            title="Нажми чтобы скопировать адрес">
                                            📋 {token.contract.slice(0, 6)}...{token.contract.slice(-4)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500">MCap</div>
                                            <div className="text-sm font-bold text-white">{formatMcap(getMcap(token))}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-gray-500">С момента колла</div>
                                            <div className={`text-lg font-bold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                            </div>
                                        </div>
                                        {change >= 50 && (
                                            <a href={`https://app.telemetry.io/@lx0aw_ru?action=buy&token=${token.contract}`}
                                                target="_blank" rel="noopener"
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition animate-pulse">
                                                🚀 Купить
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500 flex-wrap">
                                    <span>📡 @{token.caller}</span>
                                    <span>⏰ {getTimeSince(token.detected_at)}</span>
                                    <span>💧 LP: {getLpPct(token).toFixed(0)}%</span>
                                    <span>👤 Creator: {getCreatorPct(token).toFixed(1)}%</span>
                                    <span>💰 Liq: {formatMcap(getLiquidity(token))}</span>
                                    {getWebsite(token) && (
                                        <a href={getWebsite(token)} target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">🌐 Сайт</a>
                                    )}
                                    {getTwitter(token) && (
                                        <a href={getTwitter(token)} target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">🐦 Twitter</a>
                                    )}
                                    {getTelegram(token) && (
                                        <a href={getTelegram(token)} target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">✈️ TG</a>
                                    )}
                                    {getDexUrl(token) && (
                                        <a href={getDexUrl(token)} target="_blank" rel="noopener" className="text-blue-400 hover:text-blue-300">
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
