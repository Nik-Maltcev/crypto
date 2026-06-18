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
    const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);

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
                    {tokens.length > 0 && (
                        <button onClick={() => {
                            // Find max price history length for dynamic columns
                            const maxHistory = Math.max(...tokens.map(t => t.price_history.length), 0);
                            const histHeaders = Array.from({length: maxHistory}, (_, i) => `Snap ${i+1} %`);
                            const headers = ['Symbol','Name','Caller','Detected','Safety','Price at Call','MCap at Call','Current Change %','Peak Change %','Liquidity','LP Locked %','Creator %','Contract','Dexscreener', ...histHeaders];
                            const rows = tokens.map(t => {
                                const base = [
                                    getSymbol(t),
                                    getName(t),
                                    t.caller,
                                    t.detected_at ? new Date(t.detected_at).toLocaleString('ru-RU') : '',
                                    t.safety,
                                    t.price_at_call,
                                    getMcap(t),
                                    getCurrentChange(t).toFixed(1),
                                    (t.peak_change || 0).toFixed(1),
                                    getLiquidity(t),
                                    getLpPct(t).toFixed(0),
                                    getCreatorPct(t).toFixed(1),
                                    t.contract,
                                    getDexUrl(t),
                                ];
                                // Add price history snapshots (change_from_call for each 5min tick)
                                const snaps = t.price_history.map(ph => ph.change_from_call.toFixed(1));
                                // Pad to maxHistory
                                while (snaps.length < maxHistory) snaps.push('');
                                return [...base, ...snaps].map(v => `"${v}"`).join(',');
                            });
                            const csv = [headers.join(','), ...rows].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `shitcoins_${new Date().toISOString().slice(0,10)}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }} className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition">
                            CSV
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
                    {(() => {
                        // Group tokens by date
                        const getDateKey = (isoDate: string) => {
                            const d = new Date(isoDate);
                            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        };
                        const formatDateLabel = (dateKey: string) => {
                            const today = getDateKey(new Date().toISOString());
                            const yesterday = getDateKey(new Date(Date.now() - 86400000).toISOString());
                            if (dateKey === today) return 'Сегодня';
                            if (dateKey === yesterday) return 'Вчера';
                            const [y, m, d] = dateKey.split('-');
                            const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
                            return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
                        };

                        let lastDateKey = '';
                        const elements: React.ReactNode[] = [];

                        // Count tokens per day
                        const dayCounts = new Map<string, number>();
                        tokens.forEach(t => {
                            const dk = getDateKey(t.detected_at);
                            dayCounts.set(dk, (dayCounts.get(dk) || 0) + 1);
                        });

                        tokens.forEach((token, idx) => {
                            const dateKey = getDateKey(token.detected_at);
                            if (dateKey !== lastDateKey) {
                                lastDateKey = dateKey;
                                const count = dayCounts.get(dateKey) || 0;
                                elements.push(
                                    <div key={`date-${dateKey}`} className="flex items-center gap-3 pt-2 pb-1">
                                        <div className="h-px flex-grow bg-gray-700"></div>
                                        <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">
                                            📅 {formatDateLabel(dateKey)} — {count} {count === 1 ? 'монета' : count < 5 ? 'монеты' : 'монет'}
                                        </span>
                                        <div className="h-px flex-grow bg-gray-700"></div>
                                    </div>
                                );
                            }

                            const change = getCurrentChange(token);
                            elements.push(
                            <div key={token.contract} className="bg-brand-card border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition cursor-pointer" onClick={() => setSelectedToken(token)}>
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
                                        {token.price_history.slice(-12).map((ph, i, arr) => {
                                            const prev = i > 0 ? arr[i - 1].change_from_call : 0;
                                            const direction = ph.change_from_call - prev;
                                            return (
                                                <div key={i} className={`w-3 h-3 rounded-sm ${direction >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    title={`От колла: ${ph.change_from_call >= 0 ? '+' : ''}${ph.change_from_call.toFixed(1)}% | ${direction >= 0 ? '↑' : '↓'}${Math.abs(direction).toFixed(1)}%`}></div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            );
                        });

                        return elements;
                    })()}
                </div>
            )}

            {/* Token detail modal */}
            {selectedToken && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedToken(null)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <span className="text-xl font-bold text-white">{getSymbol(selectedToken)}</span>
                                <span className="text-gray-400 ml-2">{getName(selectedToken)}</span>
                            </div>
                            <button onClick={() => setSelectedToken(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
                        </div>

                        {/* Chart */}
                        {selectedToken.price_history.length > 1 && (() => {
                            const history = selectedToken.price_history;
                            const values = history.map(h => h.change_from_call);
                            const min = Math.min(...values, 0);
                            const max = Math.max(...values, 0);
                            const range = max - min || 1;
                            const W = 600, H = 150;
                            const points = values.map((v, i) => {
                                const x = (i / (values.length - 1)) * W;
                                const y = H - ((v - min) / range) * H;
                                return `${x.toFixed(1)},${y.toFixed(1)}`;
                            }).join(' ');
                            const zeroY = H - ((0 - min) / range) * H;

                            return (
                                <div className="mb-4">
                                    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="rounded bg-gray-800/50">
                                        <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="#4b5563" strokeWidth="1" strokeDasharray="4,4" />
                                        <polyline points={points} fill="none" stroke={values[values.length-1] >= 0 ? '#10b981' : '#ef4444'} strokeWidth="2" />
                                    </svg>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>{new Date(history[0].time).toLocaleString('ru-RU', {hour:'2-digit',minute:'2-digit'})}</span>
                                        <span>{new Date(history[history.length-1].time).toLocaleString('ru-RU', {hour:'2-digit',minute:'2-digit'})}</span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Snapshot table */}
                        <div className="overflow-x-auto max-h-[40vh]">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-gray-900">
                                    <tr className="text-gray-500 border-b border-gray-700">
                                        <th className="text-left py-2">Время</th>
                                        <th className="text-right py-2">Цена</th>
                                        <th className="text-right py-2">От колла</th>
                                        <th className="text-right py-2">От пред.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedToken.price_history.map((ph, i, arr) => {
                                        const prevChange = i > 0 ? ph.change_from_call - arr[i-1].change_from_call : 0;
                                        return (
                                            <tr key={i} className="border-b border-gray-800/40">
                                                <td className="py-1 text-gray-400">{new Date(ph.time).toLocaleString('ru-RU', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</td>
                                                <td className="py-1 text-right font-mono text-gray-300">{ph.price < 0.001 ? ph.price.toExponential(2) : ph.price.toFixed(6)}</td>
                                                <td className={`py-1 text-right font-mono font-bold ${ph.change_from_call >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {ph.change_from_call >= 0 ? '+' : ''}{ph.change_from_call.toFixed(1)}%
                                                </td>
                                                <td className={`py-1 text-right font-mono ${prevChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {prevChange >= 0 ? '+' : ''}{prevChange.toFixed(1)}%
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                            <span>{selectedToken.price_history.length} снэпшотов</span>
                            <span>Пик: +{(selectedToken.peak_change || 0).toFixed(1)}% | Сейчас: {getCurrentChange(selectedToken) >= 0 ? '+' : ''}{getCurrentChange(selectedToken).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShitcoinTracker;
