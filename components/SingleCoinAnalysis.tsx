import React, { useState } from 'react';
import { fetchSubredditPosts } from '../services/redditService';
import { fetchBatchTweets } from '../services/twitterService';
import { fetchSpecificCoinData } from '../services/coinMarketCapService';
import { performCombinedAnalysis } from '../services/geminiService';
import { CombinedAnalysisResponse, RedditPost, Tweet } from '../types';
import { TARGET_SUBREDDITS, TWITTER_ACCOUNTS } from '../constants';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const SingleCoinAnalysis: React.FC = () => {
    const [coinInput, setCoinInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const [result, setResult] = useState<CombinedAnalysisResponse | null>(null);

    const handleSearch = async () => {
        const symbol = coinInput.trim().toUpperCase();
        if (!symbol) {
            alert("Введите тикер или навзание монеты (например, SOL или Solana)");
            return;
        }

        setIsProcessing(true);
        setResult(null);
        setStatus(`1/4 Получение данных рынка по ${symbol}...`);

        try {
            // 1. Fetch CMC Data specific to this coin
            const cmcData = await fetchSpecificCoinData(symbol);
            let marketContext = `COIN: ${symbol}\n`;
            if (cmcData) {
                const price = cmcData.quote.USD.price < 1 ? cmcData.quote.USD.price.toFixed(4) : cmcData.quote.USD.price.toFixed(2);
                const change24h = cmcData.quote.USD.percent_change_24h.toFixed(1);
                const change7d = cmcData.quote.USD.percent_change_7d.toFixed(1);
                marketContext += `PRICE: $${price} (24h: ${change24h}%, 7d: ${change7d}%)\n`;
            } else {
                marketContext += "CMC Data: Not found. Relying strictly on social sentiment.\n";
            }

            // 2. Fetch Reddit Data
            setStatus(`2/4 Поиск упоминаний ${symbol} на Reddit...`);
            const allPosts: RedditPost[] = [];
            const subredditsToSearch = TARGET_SUBREDDITS.map(s => s.name);

            const redditTask = async () => {
                for (const sub of subredditsToSearch) {
                    const posts = await fetchSubredditPosts(sub, symbol);
                    allPosts.push(...posts);
                }
                return allPosts.sort((a, b) => b.score - a.score).slice(0, 100);
            };

            // 3. Fetch Twitter Data
            setStatus(`3/4 Поиск упоминаний ${symbol} в Twitter (X)...`);
            const twIds = TWITTER_ACCOUNTS.map(t => t.id);

            const twitterTask = async () => {
                const fetchedTweets = await fetchBatchTweets(twIds, 5, () => { });
                // Locally filter tweets that mention the coin
                return fetchedTweets.filter(t =>
                    t.text.toLowerCase().includes(symbol.toLowerCase()) ||
                    t.text.toLowerCase().includes(`#${symbol.toLowerCase()}`)
                );
            };

            // Run Reddit and Twitter in parallel
            const [redditRes, twitterRes] = await Promise.allSettled([
                redditTask(),
                twitterTask()
            ]);

            const finalPosts = redditRes.status === 'fulfilled' ? redditRes.value : [];
            const finalTweets = twitterRes.status === 'fulfilled' ? twitterRes.value : [];

            if (finalPosts.length === 0 && finalTweets.length === 0) {
                // Instead of throwing an error, we let Gemini handle the "no data" case gracefully
                console.warn("No social data found, asking Gemini to generate a response based on missing data.");
            }

            // 4. Send to Gemini
            setStatus(`4/4 AI Анализ мнений ${symbol}...`);
            const analysis = await performCombinedAnalysis(
                finalPosts,
                finalTweets,
                marketContext,
                'single_coin',
                symbol
            );

            setResult(analysis);
            setStatus("Готово!");

        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Ошибка при анализе монеты");
            setStatus("Ошибка");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-brand-card border border-gray-800 rounded-xl p-6 shadow-xl text-center max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-white mb-2 flex justify-center items-center gap-2">
                    Спросить мнение о монете
                </h2>
                <p className="text-sm text-gray-400 mb-6">
                    Введите тикер, и нейросеть соберет актуальные мнения инфлюенсеров и толпы за последние 3 дня.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={coinInput}
                        onChange={(e) => setCoinInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Например: SOL, DOGE, PEPE..."
                        className="flex-grow bg-gray-900 border border-gray-700 rounded-lg p-3 text-white uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                        maxLength={15}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-all disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <SearchIcon />
                        )}
                        Анализировать
                    </button>
                </div>

                {status && isProcessing && (
                    <div className="mt-4 text-sm text-blue-400 font-mono animate-pulse">
                        &gt; {status}
                    </div>
                )}
            </div>

            {result?.singleCoin && (
                <div className="bg-brand-card border border-indigo-500/30 rounded-xl p-8 shadow-2xl max-w-4xl mx-auto animate-fade-in relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-800 pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                                {result.forecastLabel}
                            </h2>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-lg ${result.singleCoin.forecast === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' :
                                result.singleCoin.forecast === 'Bearish' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                    'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                                }`}>
                                Прогноз: {result.singleCoin.forecast}
                            </span>
                        </div>
                    </div>

                    {!result.singleCoin.hasEnoughData && (
                        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-4 rounded-lg text-sm flex gap-3 items-center">
                            <span className="text-xl">⚠️</span>
                            <span>Об этой монете пишут очень мало. Информации в Reddit и Twitter почти нет.</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Рыночная ситуация</h4>
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {result.singleCoin.currentSituation}
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Мнение толпы (Reddit/Twitter)</h4>
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {result.singleCoin.detail}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SingleCoinAnalysis;
