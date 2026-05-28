import React, { useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface MentionEntry {
    symbol: string;
    mentions: number;
    sentiment?: string;
    context?: string;
    total?: number;
    reddit?: number;
    twitter?: number;
}

interface ScanResult {
    scanned_at: string;
    reddit_posts: number;
    twitter_tweets: number;
    main_coins: MentionEntry[];
    altcoins: MentionEntry[];
}

const MentionsTracker: React.FC = () => {
    const [result, setResult] = useState<ScanResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const runScan = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Start scan
            const startResp = await fetch(`${BACKEND_URL}/api/mentions/scan`, { method: 'POST' });
            if (!startResp.ok) {
                const err = await startResp.json();
                throw new Error(err.error || err.detail || 'Scan failed to start');
            }
            
            // Poll for result
            const startTime = Date.now();
            const TIMEOUT = 5 * 60 * 1000; // 5 min max
            
            while (Date.now() - startTime < TIMEOUT) {
                await new Promise(r => setTimeout(r, 3000)); // poll every 3s
                
                const pollResp = await fetch(`${BACKEND_URL}/api/mentions/result`);
                if (!pollResp.ok) continue;
                
                const data = await pollResp.json();
                if (data.status === 'running') continue;
                if (data.status === 'done' && data.success) {
                    setResult(data);
                    break;
                }
                if (!data.success && data.error) {
                    throw new Error(data.error);
                }
            }
            
            if (Date.now() - startTime >= TIMEOUT) {
                throw new Error('Таймаут — сканирование заняло больше 5 минут');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const maxMentions = result ? Math.max(
        ...result.main_coins.map(c => c.mentions || c.total || 0),
        ...result.altcoins.slice(0, 20).map(c => c.mentions || c.total || 0),
        1
    ) : 1;

    const getSentimentColor = (s?: string) => {
        if (s === 'bullish') return 'text-emerald-400';
        if (s === 'bearish') return 'text-red-400';
        return 'text-gray-400';
    };
    const getSentimentLabel = (s?: string) => {
        if (s === 'bullish') return '🟢';
        if (s === 'bearish') return '🔴';
        return '⚪';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">📡 Упоминания монет</h2>
                    <p className="text-gray-400 text-sm">Reddit + Twitter за 24 часа. Какие монеты обсуждают чаще всего.</p>
                </div>
                <button
                    onClick={runScan}
                    disabled={isLoading}
                    className="mt-4 sm:mt-0 px-5 py-2.5 bg-brand-accent hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                    {isLoading ? '⏳ Сканирование (~1-2 мин)...' : '🔍 Сканировать'}
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">❌ {error}</div>
            )}

            {isLoading && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 text-sm animate-pulse">
                    ⏳ Парсинг Reddit и Twitter... Это может занять 1-2 минуты.
                </div>
            )}

            {result && (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-orange-400">{result.reddit_posts}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Reddit постов</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{result.twitter_tweets}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Twitter твитов</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-white">{result.main_coins.length + result.altcoins.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Монет найдено</div>
                        </div>
                    </div>

                    {/* Main coins */}
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Основные монеты</h3>
                        <div className="space-y-3">
                            {result.main_coins.map(coin => {
                                const count = coin.mentions || coin.total || 0;
                                return (
                                    <div key={coin.symbol} className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-white w-12">{coin.symbol}</span>
                                        <span className="text-sm">{getSentimentLabel(coin.sentiment)}</span>
                                        <div className="flex-1">
                                            <div className="bg-gray-800 rounded-full h-5 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full flex items-center justify-end pr-2"
                                                    style={{ width: `${(count / maxMentions) * 100}%`, minWidth: '30px' }}
                                                >
                                                    <span className="text-[10px] font-bold text-white">{count}</span>
                                                </div>
                                            </div>
                                            {coin.context && <p className="text-[10px] text-gray-500 mt-1 truncate">{coin.context}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Altcoins */}
                    {result.altcoins.length > 0 && (
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4">
                                Альткоины ({result.altcoins.length} найдено)
                            </h3>
                            <div className="space-y-2">
                                {result.altcoins.map((coin, idx) => {
                                    const count = coin.mentions || coin.total || 0;
                                    return (
                                        <div key={coin.symbol} className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 w-5">{idx + 1}</span>
                                            <span className="text-sm font-bold text-white w-14">{coin.symbol}</span>
                                            <span className="text-sm">{getSentimentLabel(coin.sentiment)}</span>
                                            <div className="flex-1">
                                                <div className="bg-gray-800 rounded-full h-4 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full flex items-center justify-end pr-2"
                                                        style={{ width: `${(count / maxMentions) * 100}%`, minWidth: '24px' }}
                                                    >
                                                        <span className="text-[9px] font-bold text-white">{count}</span>
                                                    </div>
                                                </div>
                                                {coin.context && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{coin.context}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="text-xs text-gray-600 text-center">
                        Сканирование: {new Date(result.scanned_at).toLocaleString('ru-RU')}
                    </div>
                </>
            )}

            {!result && !isLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-xl">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">📡</span>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Нажмите «Сканировать»</h3>
                    <p className="text-gray-400 max-w-md">
                        Парсит Reddit и Twitter за последние 24 часа и считает упоминания каждой монеты.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MentionsTracker;
