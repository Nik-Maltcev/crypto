import React, { useState, useCallback, useRef } from 'react';
import { TARGET_SUBREDDITS } from './constants';
import { fetchSubredditPosts, fetchAllRedditPosts } from './services/redditService';
import { analyzeSentiment, performDeepAnalysis } from './services/geminiService';
import { fetchCryptoMarketData } from './services/coinMarketCapService';
import { fetchTelegramData, formatTelegramForAnalysis } from './services/telegramService';
import { AnalysisResponse, RedditPost, DeepAnalysisResult, TelegramMessage } from './types';
import CryptoCard from './components/CryptoCard';
import SentimentChart from './components/SentimentChart';

// Icons
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);

const TelegramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
);

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<AnalysisResponse | null>(null);
  const [deepResults, setDeepResults] = useState<DeepAnalysisResult | null>(null);
  const [sourcePosts, setSourcePosts] = useState<RedditPost[]>([]);
  const [telegramMessages, setTelegramMessages] = useState<TelegramMessage[]>([]);
  const [telegramIncluded, setTelegramIncluded] = useState(false);
  
  // Select top 10 by default
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>(
    TARGET_SUBREDDITS.slice(0, 10).map(s => s.name)
  );
  
  const abortRef = useRef<boolean>(false);

  const handleStop = () => {
    abortRef.current = true;
    setStatus('Остановка...');
  };

  const handleDownloadJSON = () => {
    if (!results) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      analysis: results,
      deepAnalysis: deepResults,
      source_data_count: sourcePosts.length,
      source_posts: sourcePosts.map(post => ({
        ...post,
        created_date_human: new Date(post.created_utc * 1000).toLocaleString('ru-RU', {
          timeZoneName: 'short'
        })
      }))
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `crypto_pulse_full_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleDeepAnalysis = async () => {
    if (!results) return;
    setDeepLoading(true);
    setDeepResults(null);
    try {
      const deepData = await performDeepAnalysis(results);
      setDeepResults(deepData);
    } catch (error) {
      alert("Ошибка глубинного анализа: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setDeepLoading(false);
    }
  };

  // Полный анализ: Reddit + Telegram
  const handleFullAnalysis = useCallback(async () => {
    if (selectedSubreddits.length === 0) {
      alert("Выберите хотя бы один сабреддит.");
      return;
    }

    setFullLoading(true);
    setLoading(true);
    setResults(null);
    setDeepResults(null);
    setSourcePosts([]);
    setTelegramMessages([]);
    setTelegramIncluded(false);
    abortRef.current = false;
    setProgress({ current: 0, total: 3 }); // 3 steps: market+reddit, telegram, analysis
    
    try {
      // Step 1: Market data
      setStatus('Получение рыночных данных с CoinMarketCap...');
      const { summary: marketContext, coinMap } = await fetchCryptoMarketData();
      
      // Step 2: Reddit via backend
      setStatus(`Сканирование ${selectedSubreddits.length} сабреддитов...`);
      setProgress({ current: 1, total: 3 });
      
      const allPosts = await fetchAllRedditPosts(selectedSubreddits);

      if (abortRef.current) {
        setStatus("Сканирование прервано пользователем.");
        setLoading(false);
        setFullLoading(false);
        return;
      }

      setProgress({ current: 2, total: 3 });

      // Step 3: Telegram
      setStatus('Загрузка данных из Telegram чатов...');
      
      let telegramContext = '';
      try {
        const telegramData = await fetchTelegramData();
        setTelegramMessages(telegramData.data.messages);
        setTelegramIncluded(true);
        telegramContext = formatTelegramForAnalysis(telegramData.data.messages);
        setStatus(`Telegram: ${telegramData.data.messages_count} сообщений из ${telegramData.data.chats_count} чатов`);
      } catch (tgError) {
        console.warn('Telegram data unavailable:', tgError);
        setStatus('Telegram недоступен, продолжаем с Reddit...');
      }
      
      setProgress({ current: 3, total: 3 });

      if (allPosts.length === 0 && !telegramContext) {
        throw new Error("Не найдено данных для анализа.");
      }

      setStatus(`Сортировка ${allPosts.length} постов...`);
      const topPosts = allPosts.sort((a, b) => b.score - a.score).slice(0, 150);
      setSourcePosts(topPosts);

      // Combine contexts
      const combinedContext = marketContext + '\n\n' + telegramContext;

      setStatus(`AI (Flash) анализирует данные из Reddit${telegramContext ? ' + Telegram' : ''}...`);
      
      const analysis = await analyzeSentiment(topPosts, combinedContext);

      // Merge Real-time Prices
      const enrichedCoins = analysis.coins.map(coin => {
        let cmcData = coinMap.get(coin.symbol.toUpperCase());
        if (cmcData) {
          return {
            ...coin,
            currentPrice: cmcData.quote.USD.price,
            change24h: cmcData.quote.USD.percent_change_24h,
            change7d: cmcData.quote.USD.percent_change_7d,
            volume24h: cmcData.quote.USD.volume_24h,
            marketCap: cmcData.quote.USD.market_cap
          };
        }
        return coin;
      });
      
      setResults({ ...analysis, coins: enrichedCoins });

    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Ошибка анализа");
    } finally {
      setLoading(false);
      setFullLoading(false);
      setStatus('');
    }
  }, [selectedSubreddits]);
  
  const handleAnalyze = useCallback(async () => {
    if (selectedSubreddits.length === 0) {
      alert("Выберите хотя бы один сабреддит.");
      return;
    }

    setLoading(true);
    setResults(null);
    setDeepResults(null);
    setSourcePosts([]);
    abortRef.current = false;
    setProgress({ current: 0, total: 3 }); // 3 steps: market, reddit, analysis
    
    try {
      setStatus('Получение рыночных данных с CoinMarketCap...');
      setProgress({ current: 1, total: 3 });
      const { summary: marketContext, coinMap } = await fetchCryptoMarketData();
      
      if (abortRef.current) {
        setStatus("Сканирование прервано пользователем.");
        setLoading(false);
        return;
      }

      setStatus(`Сканирование ${selectedSubreddits.length} сабреддитов через бэкенд...`);
      setProgress({ current: 2, total: 3 });
      
      const allPosts = await fetchAllRedditPosts(selectedSubreddits);

      if (allPosts.length === 0) {
        throw new Error("Не найдено подходящих постов.");
      }

      setSourcePosts(allPosts);

      setStatus(`AI (Flash) анализирует ${allPosts.length} тредов...`);
      setProgress({ current: 3, total: 3 });
      
      const analysis = await analyzeSentiment(allPosts, marketContext);

      // Merge Real-time Prices
      const enrichedCoins = analysis.coins.map(coin => {
        let cmcData = coinMap.get(coin.symbol.toUpperCase());
        if (cmcData) {
          return {
            ...coin,
            currentPrice: cmcData.quote.USD.price,
            change24h: cmcData.quote.USD.percent_change_24h,
            change7d: cmcData.quote.USD.percent_change_7d,
            volume24h: cmcData.quote.USD.volume_24h,
            marketCap: cmcData.quote.USD.market_cap
          };
        }
        return coin;
      });
      
      setResults({ ...analysis, coins: enrichedCoins });

    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Ошибка анализа");
    } finally {
      if (!abortRef.current) {
        setLoading(false);
        setStatus('');
      } else {
        setLoading(false);
      }
    }
  }, [selectedSubreddits]);

  const toggleSubreddit = (name: string) => {
    setSelectedSubreddits(prev => 
      prev.includes(name) 
        ? prev.filter(s => s !== name)
        : [...prev, name]
    );
  };

  const selectAll = () => setSelectedSubreddits(TARGET_SUBREDDITS.map(s => s.name));
  const deselectAll = () => setSelectedSubreddits([]);

  return (
    <div className="min-h-screen bg-brand-dark text-gray-200 font-sans selection:bg-brand-accent selection:text-white pb-20">
      
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-accent to-blue-600 flex items-center justify-center text-white font-bold">
               CP
             </div>
             <h1 className="text-xl font-bold text-white tracking-tight">CryptoPulse <span className="text-brand-accent">AI</span></h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {results && !loading && (
              <>
                 <button
                  onClick={handleDownloadJSON}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all"
                  title="Скачать результат в JSON"
                >
                  <DownloadIcon />
                  <span className="hidden sm:inline">JSON</span>
                </button>
              </>
            )}
            
             {loading ? (
                <button 
                  onClick={handleStop}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 transition-all"
                >
                  <StopIcon />
                  <span>Стоп</span>
                </button>
             ) : (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleAnalyze} 
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-accent hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <RefreshIcon />
                    <span>Reddit</span>
                  </button>
                  <button 
                    onClick={handleFullAnalysis} 
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20 transition-all"
                    title="Reddit + Telegram анализ"
                  >
                    <TelegramIcon />
                    <span className="hidden sm:inline">Полный</span>
                  </button>
                </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Progress */}
        {loading && (
          <div className="bg-brand-card border border-gray-800 rounded-xl p-6 animate-pulse">
            <div className="flex justify-between text-sm mb-2 text-gray-400">
              <span>{status}</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-brand-accent h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Sources */}
        <section className="bg-brand-card border border-gray-800 rounded-xl p-6 max-h-[300px] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-brand-card py-2 z-10 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white">Источники ({selectedSubreddits.length})</h2>
            <div className="flex space-x-2">
              <button onClick={selectAll} className="text-xs text-blue-400">Все</button>
              <button onClick={deselectAll} className="text-xs text-gray-400">Сброс</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {TARGET_SUBREDDITS.map((sub) => (
              <button
                key={sub.name}
                onClick={() => toggleSubreddit(sub.name)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  selectedSubreddits.includes(sub.name)
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-gray-800/50 border-gray-700 text-gray-500'
                }`}
              >
                r/{sub.name}
              </button>
            ))}
          </div>
        </section>

        {/* Results */}
        {results ? (
          <>
            {/* Deep Analysis Action Section */}
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BrainIcon />
                  Gemini 3 Pro Deep Dive
                </h3>
                <p className="text-gray-300 text-sm mt-1">
                  Запустить углубленный анализ графиков и сентимента с помощью самой мощной модели Google.
                </p>
              </div>
              <button 
                onClick={handleDeepAnalysis}
                disabled={deepLoading}
                className="whitespace-nowrap px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deepLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Анализ...
                  </>
                ) : (
                  <>
                    <span className="text-lg">✨</span> Анализ от ИИ (Pro)
                  </>
                )}
              </button>
            </div>

            {/* Deep Analysis Result Display */}
            {deepResults && (
              <div className="bg-brand-card border border-indigo-500/50 rounded-xl p-8 shadow-2xl relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <BrainIcon />
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-800 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                      Стратегический отчет
                    </h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Модель: Gemini 3 Pro</p>
                  </div>
                  <div className="flex items-center gap-4 mt-4 md:mt-0">
                     <div className="text-right">
                       <p className="text-xs text-gray-500 uppercase">Top Pick</p>
                       <p className="text-xl font-bold text-emerald-400">{deepResults.topPick}</p>
                     </div>
                     <div className="text-right border-l border-gray-700 pl-4">
                       <p className="text-xs text-gray-500 uppercase">Risk Level</p>
                       <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                         deepResults.riskLevel === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                         deepResults.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                         'bg-red-500/20 text-red-400'
                       }`}>
                         {deepResults.riskLevel}
                       </span>
                     </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 uppercase mb-3 border-l-2 border-indigo-500 pl-3">Технический Вердикт</h4>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                      {deepResults.technicalVerdict}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 uppercase mb-3 border-l-2 border-brand-accent pl-3">Торговая Стратегия</h4>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                      {deepResults.strategy}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Results */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white">Обзор рынка (Flash)</h2>
                {telegramIncluded && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    <TelegramIcon /> +Telegram
                  </span>
                )}
              </div>
              <p className="text-gray-300">{results.marketSummary}</p>
            </div>

            <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Тепловая карта настроений</h3>
              <SentimentChart data={results.coins} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-6">Детальный анализ (Топ активы)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.coins.map((coin, idx) => (
                  <CryptoCard key={`${coin.symbol}-${idx}`} coin={coin} />
                ))}
              </div>
            </div>
          </>
        ) : (
          !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-xl">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Готов к анализу</h3>
              <p className="text-gray-400 max-w-md">
                Выберите сабреддиты и нажмите «Старт».
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default App;