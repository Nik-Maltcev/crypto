import React, { useState } from 'react';
import { TWITTER_ACCOUNTS } from '../constants';

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';

interface SourceResult {
    name: string;
    id?: string;
    type: 'reddit' | 'twitter';
    posts1h: number;
    comments1h: number;
    total1h: number;
    posts6h: number;
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
        const twitterAccounts = TWITTER_ACCOUNTS.map(a => ({ username: a.username, id: a.id }));

        const total = twitterAccounts.length;
        setProgress({ current: 0, total });

        // Twitter — 6h
        const sixHoursAgo = new Date(Date.now() - 6 * 3600000);
        for (let i = 0; i < twitterAccounts.length; i++) {
            const acc = twitterAccounts[i];
            let tweets6h = 0;
            let status: 'ok' | 'error' = 'ok';
            let error = '';
            let displayName = `@${acc.username}`;

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
                    const instructions = data?.result?.timeline?.instructions || data?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];
                    let resolvedName = acc.username;
                    instructions.forEach((instr: any) => {
                        const entries = instr.type === 'TimelineAddEntries' ? instr.entries : (instr.entries && !instr.type ? instr.entries : []);
                        if (!entries) return;
                        entries.forEach((entry: any) => {
                            const tweetResult = entry?.content?.itemContent?.tweet_results?.result;
                            const tweet = tweetResult?.legacy;
                            const screenName = tweetResult?.core?.user_results?.result?.legacy?.screen_name;
                            if (screenName && resolvedName.startsWith('User_')) resolvedName = screenName;
                            if (tweet?.created_at) {
                                const tweetDate = new Date(tweet.created_at);
                                if (!isNaN(tweetDate.getTime()) && tweetDate >= sixHoursAgo) {
                                    tweets6h++;
                                }
                            }
                        });
                    });
                    // Fallback: top-level entries
                    if (tweets6h === 0) {
                        const entries = data?.result?.timeline?.instructions?.[0]?.entries || [];
                        entries.forEach((entry: any) => {
                            const tweetResult = entry?.content?.itemContent?.tweet_results?.result;
                            const tweet = tweetResult?.legacy;
                            const screenName = tweetResult?.core?.user_results?.result?.legacy?.screen_name;
                            if (screenName && resolvedName.startsWith('User_')) resolvedName = screenName;
                            if (tweet?.created_at) {
                                const tweetDate = new Date(tweet.created_at);
                                if (!isNaN(tweetDate.getTime()) && tweetDate >= sixHoursAgo) {
                                    tweets6h++;
                                }
                            }
                        });
                    }
                    displayName = `@${resolvedName}`;
                } else {
                    status = 'error';
                    error = `HTTP ${resp.status}`;
                }
            } catch (e: any) {
                status = 'error';
                error = e.message;
            }

            allResults.push({
                name: displayName, id: acc.id, type: 'twitter',
                posts1h: 0, comments1h: 0, total1h: 0,
                posts6h: tweets6h, total6h: tweets6h,
                status, error,
            });
            setProgress({ current: i + 1, total });
            setResults([...allResults]);
            await new Promise(r => setTimeout(r, 300));
        }

        setIsLoading(false);
    };

    const exportCSV = () => {
        const header = 'Аккаунт,ID,Твитов за 6ч,Статус\n';
        const rows = results.map(r =>
            `${r.name},${r.id || ''},${r.total6h},${r.status === 'ok' ? 'OK' : r.error || 'Ошибка'}`
        ).join('\n');
        const csv = '\ufeff' + header + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `twitter_check_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const twitterResults = results.filter(r => r.type === 'twitter').sort((a, b) => b.total6h - a.total6h);
    const totalTwitter6h = twitterResults.reduce((s, r) => s + r.total6h, 0);
    const activeTwitter = twitterResults.filter(r => r.total6h > 0).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Проверка Twitter</h2>
                    <p className="text-gray-400 text-sm">Твиты за последние 6 часов по каждому аккаунту</p>
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
                        <span>Проверка Twitter аккаунтов...</span>
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
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{totalTwitter6h}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Твитов за 6ч</div>
                        </div>
                        <div className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-emerald-400">{activeTwitter}/{twitterResults.length}</div>
                            <div className="text-[10px] text-gray-500 uppercase">Активных аккаунтов</div>
                        </div>
                    </div>

                    {/* Twitter Table */}
                    <div className="bg-brand-card border border-blue-500/20 rounded-xl p-5">
                        <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3">Twitter ({twitterResults.length} аккаунтов) — за 6 часов</h3>
                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-gray-900">
                                    <tr className="text-gray-500 border-b border-gray-800">
                                        <th className="py-2 px-2 text-left">Аккаунт</th>
                                        <th className="py-2 px-2 text-right font-bold">Твитов за 6ч</th>
                                        <th className="py-2 px-2 text-center">Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {twitterResults.map((r, i) => (
                                        <tr key={i} className="border-b border-gray-800/30 hover:bg-gray-800/20">
                                            <td className="py-1.5 px-2 text-blue-400 font-mono">{r.name}</td>
                                            <td className={`py-1.5 px-2 text-right font-bold ${r.total6h > 2 ? 'text-emerald-400' : r.total6h > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{r.total6h}</td>
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
                    Нажмите «Проверить» чтобы получить активность Twitter аккаунтов за 6ч.
                </div>
            )}
        </div>
    );
};

export default SourcesCheck;
