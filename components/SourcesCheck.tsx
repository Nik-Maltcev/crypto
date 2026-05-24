import React, { useState } from 'react';
import { TARGET_SUBREDDITS, TWITTER_ACCOUNTS } from '../constants';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface SourceResult {
    name: string;
    type: 'reddit' | 'twitter';
    count: number;
    status: 'ok' | 'error' | 'pending';
    error?: string;
}

const SourcesCheck: React.FC = () => {
    const [results, setResults] = useState<SourceResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const checkSources = async () => {
        setIsLoading(true);
        setResults([]);

        const allResults: SourceResult[] = [];
        const cutoffTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

        // Select top subreddits (most relevant crypto ones)
        const topSubreddits = TARGET_SUBREDDITS.slice(0, 50).map(s => s.name);
        const twitterAccounts = TWITTER_ACCOUNTS.map(a => ({ username: a.username, id: a.id }));

        const total = topSubreddits.length + twitterAccounts.length;
        setProgress({ current: 0, total });

        // Check Reddit subreddits
        for (let i = 0; i < topSubreddits.length; i++) {
            const sub = topSubreddits[i];
            try {
                const resp = await fetch(`${BACKEND_URL}/api/reddit/posts?subreddit=${encodeURIComponent(sub)}&limit=100`);
                if (resp.ok) {
                    const data = await resp.json();
                    const posts = data?.data?.children || [];
                    const recentCount = posts.filter((p: any) => p.data?.created_utc >= cutoffTime).length;
                    allResults.push({ name: `r/${sub}`, type: 'reddit', count: recentCount, status: 'ok' });
                } else {
                    allResults.push({ name: `r/${sub}`, type: 'reddit', count: 0, status: 'error', error: `HTTP ${resp.status}` });
                }
            } catch (e: any) {
                allResults.push({ name: `r/${sub}`, type: 'reddit', count: 0, status: 'error', error: e.message });
            }
            setProgress({ current: i + 1, total });
            setResults([...allResults]);
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 300));
        }

        // Check Twitter accounts
        for (let i = 0; i < twitterAccounts.length; i++) {
            const acc = twitterAccounts[i];
            try {
                const targetUrl = `https://twitter241.p.rapidapi.com/user-tweets?user=${acc.id}&count=20`;
                const headersParam = encodeURIComponent(JSON.stringify({
                    'X-RapidAPI-Key': '3fa1808794msh4889848f150da1ep1e822ejsnd21a6ca25058',
                    'X-RapidAPI-Host': 'twitter241.p.rapidapi.com'
                }));
                const proxyUrl = `${BACKEND_URL}/api/proxy?url=${encodeURIComponent(targetUrl)}&headers=${headersParam}`;
                const resp = await fetch(proxyUrl);
                if (resp.ok) {
                    const data = await resp.json();
                    // Count tweets from last hour
                    const entries = data?.result?.timeline?.instructions?.[0]?.entries || [];
                    let recentCount = 0;
                    const oneHourAgo = new Date(Date.now() - 3600000);
                    entries.forEach((entry: any) => {
                        const tweet = entry?.content?.itemContent?.tweet_results?.result?.legacy;
                        if (tweet?.created_at) {
                            const tweetDate = new Date(tweet.created_at);
                            if (tweetDate >= oneHourAgo) recentCount++;
                        }
                    });
                    allResults.push({ name: `@${acc.username}`, type: 'twitter', count: recentCount, status: 'ok' });
                } else {
                    allResults.push({ name: `@${acc.username}`, type: 'twitter', count: 0, status: 'error', error: `HTTP ${resp.status}` });
                }
            } catch (e: any) {
                allResults.push({ name: `@${acc.username}`, type: 'twitter', count: 0, status: 'error', error: e.message });
            }
            setProgress({ current: topSubreddits.length + i + 1, total });
            setResults([...allResults]);
            await new Promise(r => setTimeout(r, 500));
        }

        setIsLoading(false);
    };

    const exportCSV = () => {
        const header = 'Тип,Источник,Сообщений за 1ч,Статус\n';
        const rows = results.map(r => `${r.type === 'reddit' ? 'Reddit' : 'Twitter'},${r.name},${r.count},${r.status === 'ok' ? 'OK' : r.error || 'Ошибка'}`).join('\n');
        const csv = '\ufeff' + header + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sources_check_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const redditResults = results.filter(r => r.type === 'reddit').sort((a, b) => b.count - a.count);
    const twitterResults = results.filter(r => r.type === 'twitter').sort((a, b) => b.count - a.count);
    const totalReddit = redditResults.reduce((s, r) => s + r.count, 0);
    const totalTwitter = twitterResults.reduce((s, r) => s + r.count, 0);
    const activeReddit = redditResults.filter(r => r.count > 0).length;
    const activeTwitter = twitterResults.filter(r => r.count > 0).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Проверка Reddit и Twitter</h2>
                    <p className="text-gray-400 text-sm">Количество сообщений за последний час (60 минут) по каждому источнику</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                    {results.length > 0 && (
                        <button onClick={exportCSV}
                            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-medium transition">
                            📥 CSV
                        </button>
                    )}
                    <button onClick={checkSources} disabled={isLoading}
                        className="px-5 py-2 bg-brand-accent hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
                        {isLoading ? `⏳ ${progress.current}/${progress.total}` : '🔍 Проверить'}
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="bg-brand-card border border-gray-800 rounded-xl p-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                        <span>Проверка источников...</span>
                        <span>{progress.current}/{progress.total}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-brand-accent h-2 rounded-full transition-all" style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}></div>
                    </div>
                </div>
            )}

            {results.length > 0 && (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-orange-400">{totalReddit}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Постов Reddit</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{totalTwitter}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Твитов</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-400">{activeReddit}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Активных сабов</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-400">{activeTwitter}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Активных аккаунтов</div>
                        </div>
                    </div>

                    {/* Reddit Table */}
                    <div className="bg-brand-card border border-orange-500/20 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-3">Reddit ({redditResults.length} сабреддитов)</h3>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-900">
                                    <tr className="text-gray-500 border-b border-gray-800">
                                        <th className="py-2 px-2 text-left">Сабреддит</th>
                                        <th className="py-2 px-2 text-right">Постов за 1ч</th>
                                        <th className="py-2 px-2 text-center">Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {redditResults.map((r, i) => (
                                        <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                            <td className="py-1.5 px-2 text-orange-400 font-mono">{r.name}</td>
                                            <td className={`py-1.5 px-2 text-right font-bold ${r.count > 5 ? 'text-emerald-400' : r.count > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{r.count}</td>
                                            <td className="py-1.5 px-2 text-center">{r.status === 'ok' ? '✅' : '❌'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Twitter Table */}
                    <div className="bg-brand-card border border-blue-500/20 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3">Twitter ({twitterResults.length} аккаунтов)</h3>
                        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-900">
                                    <tr className="text-gray-500 border-b border-gray-800">
                                        <th className="py-2 px-2 text-left">Аккаунт</th>
                                        <th className="py-2 px-2 text-right">Твитов за 1ч</th>
                                        <th className="py-2 px-2 text-center">Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {twitterResults.map((r, i) => (
                                        <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                            <td className="py-1.5 px-2 text-blue-400 font-mono">{r.name}</td>
                                            <td className={`py-1.5 px-2 text-right font-bold ${r.count > 2 ? 'text-emerald-400' : r.count > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{r.count}</td>
                                            <td className="py-1.5 px-2 text-center">{r.status === 'ok' ? '✅' : '❌'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {!isLoading && results.length === 0 && (
                <div className="text-center p-10 bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                    Нажмите «Проверить» чтобы получить количество сообщений за последний час по всем источникам.
                </div>
            )}
        </div>
    );
};

export default SourcesCheck;
