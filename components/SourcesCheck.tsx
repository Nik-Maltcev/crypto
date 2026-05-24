import React, { useState } from 'react';
import { TARGET_SUBREDDITS, TWITTER_ACCOUNTS } from '../constants';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface SourceResult {
    name: string;
    type: 'reddit' | 'twitter';
    posts1h: number;
    comments1h: number;
    total1h: number;
    posts6h: number;
    comments6h: number;
    total6h: number;
    status: 'ok' | 'error';
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
        const now = Math.floor(Date.now() / 1000);
        const cutoff1h = now - 3600;
        const cutoff6h = now - 6 * 3600;

        const topSubreddits = TARGET_SUBREDDITS.map(s => s.name);
        const twitterAccounts = TWITTER_ACCOUNTS.map(a => ({ username: a.username, id: a.id }));

        const total = topSubreddits.length + twitterAccounts.length;
        setProgress({ current: 0, total });

        // Reddit
        for (let i = 0; i < topSubreddits.length; i++) {
            const sub = topSubreddits[i];
            let posts1h = 0, posts6h = 0, comments1h = 0, comments6h = 0;
            let status: 'ok' | 'error' = 'ok';
            let error = '';

            try {
                const resp = await fetch(`${BACKEND_URL}/api/reddit/posts?subreddit=${encodeURIComponent(sub)}&limit=100`);
                if (resp.ok) {
                    const data = await resp.json();
                    const posts = data?.data?.children || [];
                    posts.forEach((p: any) => {
                        const t = p.data?.created_utc || 0;
                        if (t >= cutoff1h) posts1h++;
                        if (t >= cutoff6h) posts6h++;
                    });
                } else {
                    status = 'error';
                    error = `HTTP ${resp.status}`;
                }
            } catch (e: any) {
                status = 'error';
                error = e.message;
            }

            if (status === 'ok') {
                try {
                    const resp = await fetch(`${BACKEND_URL}/api/reddit/comments?subreddit=${encodeURIComponent(sub)}&limit=100`);
                    if (resp.ok) {
                        const data = await resp.json();
                        const comments = data?.data?.children || [];
                        comments.forEach((c: any) => {
                            const t = c.data?.created_utc || 0;
                            if (t >= cutoff1h) comments1h++;
                            if (t >= cutoff6h) comments6h++;
                        });
                    }
                } catch {
                    // silent
                }
            }

            allResults.push({
                name: `r/${sub}`, type: 'reddit',
                posts1h, comments1h, total1h: posts1h + comments1h,
                posts6h, comments6h, total6h: posts6h + comments6h,
                status, error,
            });
            setProgress({ current: i + 1, total });
            setResults([...allResults]);
            await new Promise(r => setTimeout(r, 350));
        }

        // Twitter
        for (let i = 0; i < twitterAccounts.length; i++) {
            const acc = twitterAccounts[i];
            let tweets1h = 0, tweets6h = 0;
            let status: 'ok' | 'error' = 'ok';
            let error = '';

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
                    const entries = data?.result?.timeline?.instructions?.[0]?.entries || [];
                    const oneHourAgo = new Date(Date.now() - 3600000);
                    const sixHoursAgo = new Date(Date.now() - 6 * 3600000);
                    entries.forEach((entry: any) => {
                        const tweet = entry?.content?.itemContent?.tweet_results?.result?.legacy;
                        if (tweet?.created_at) {
                            const tweetDate = new Date(tweet.created_at);
                            if (tweetDate >= oneHourAgo) tweets1h++;
                            if (tweetDate >= sixHoursAgo) tweets6h++;
                        }
                    });
                } else {
                    status = 'error';
                    error = `HTTP ${resp.status}`;
                }
            } catch (e: any) {
                status = 'error';
                error = e.message;
            }

            allResults.push({
                name: `@${acc.username}`, type: 'twitter',
                posts1h: tweets1h, comments1h: 0, total1h: tweets1h,
                posts6h: tweets6h, comments6h: 0, total6h: tweets6h,
                status, error,
            });
            setProgress({ current: topSubreddits.length + i + 1, total });
            setResults([...allResults]);
            await new Promise(r => setTimeout(r, 500));
        }

        setIsLoading(false);
    };

    const exportCSV = () => {
        const header = 'Тип,Источник,Посты 1ч,Комменты 1ч,Всего 1ч,Посты 6ч,Комменты 6ч,Всего 6ч,Статус\n';
        const rows = results.map(r =>
            `${r.type === 'reddit' ? 'Reddit' : 'Twitter'},${r.name},${r.posts1h},${r.comments1h},${r.total1h},${r.posts6h},${r.comments6h},${r.total6h},${r.status === 'ok' ? 'OK' : r.error || 'Ошибка'}`
        ).join('\n');
        const csv = '\ufeff' + header + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sources_check_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const redditResults = results.filter(r => r.type === 'reddit').sort((a, b) => b.total6h - a.total6h);
    const twitterResults = results.filter(r => r.type === 'twitter').sort((a, b) => b.total6h - a.total6h);
    const totalReddit1h = redditResults.reduce((s, r) => s + r.total1h, 0);
    const totalReddit6h = redditResults.reduce((s, r) => s + r.total6h, 0);
    const totalTwitter1h = twitterResults.reduce((s, r) => s + r.total1h, 0);
    const totalTwitter6h = twitterResults.reduce((s, r) => s + r.total6h, 0);
    const activeReddit = redditResults.filter(r => r.total6h > 0).length;
    const activeTwitter = twitterResults.filter(r => r.total6h > 0).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Проверка Reddit и Twitter</h2>
                    <p className="text-gray-400 text-sm">Активность источников: посты и комментарии за 1 час и 6 часов</p>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-orange-400">{totalReddit1h}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Reddit за 1ч</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-orange-300">{totalReddit6h}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Reddit за 6ч</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{totalTwitter1h}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Twitter за 1ч</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-300">{totalTwitter6h}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Twitter за 6ч</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-400">{activeReddit}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Активных сабов</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-400">{activeTwitter}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Активных акк.</div>
                        </div>
                    </div>

                    {/* Reddit Table */}
                    <div className="bg-brand-card border border-orange-500/20 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-3">Reddit ({redditResults.length} сабреддитов)</h3>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-900">
                                    <tr className="text-gray-500 border-b border-gray-800">
                                        <th className="py-2 px-2 text-left">Сабреддит</th>
                                        <th className="py-2 px-2 text-right">Посты 1ч</th>
                                        <th className="py-2 px-2 text-right">Комм. 1ч</th>
                                        <th className="py-2 px-2 text-right font-bold">Всего 1ч</th>
                                        <th className="py-2 px-2 text-right">Посты 6ч</th>
                                        <th className="py-2 px-2 text-right">Комм. 6ч</th>
                                        <th className="py-2 px-2 text-right font-bold">Всего 6ч</th>
                                        <th className="py-2 px-2 text-center">Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {redditResults.map((r, i) => (
                                        <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                            <td className="py-1.5 px-2 text-orange-400 font-mono">{r.name}</td>
                                            <td className={`py-1.5 px-2 text-right ${r.posts1h > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{r.posts1h}</td>
                                            <td className={`py-1.5 px-2 text-right ${r.comments1h > 0 ? 'text-cyan-400' : 'text-gray-600'}`}>{r.comments1h}</td>
                                            <td className={`py-1.5 px-2 text-right font-bold ${r.total1h > 5 ? 'text-emerald-400' : r.total1h > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{r.total1h}</td>
                                            <td className={`py-1.5 px-2 text-right ${r.posts6h > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{r.posts6h}</td>
                                            <td className={`py-1.5 px-2 text-right ${r.comments6h > 0 ? 'text-cyan-400' : 'text-gray-600'}`}>{r.comments6h}</td>
                                            <td className={`py-1.5 px-2 text-right font-bold ${r.total6h > 20 ? 'text-emerald-400' : r.total6h > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{r.total6h}</td>
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
                                        <th className="py-2 px-2 text-right">Твиты 1ч</th>
                                        <th className="py-2 px-2 text-right font-bold">Твиты 6ч</th>
                                        <th className="py-2 px-2 text-center">Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {twitterResults.map((r, i) => (
                                        <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                            <td className="py-1.5 px-2 text-blue-400 font-mono">{r.name}</td>
                                            <td className={`py-1.5 px-2 text-right ${r.posts1h > 0 ? 'text-emerald-400' : 'text-gray-600'}`}>{r.posts1h}</td>
                                            <td className={`py-1.5 px-2 text-right font-bold ${r.posts6h > 2 ? 'text-emerald-400' : r.posts6h > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{r.posts6h}</td>
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
                    Нажмите «Проверить» чтобы получить активность всех источников за 1ч и 6ч.
                </div>
            )}
        </div>
    );
};

export default SourcesCheck;
