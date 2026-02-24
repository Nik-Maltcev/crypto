import React, { useState, useCallback, useRef } from 'react';
import { TARGET_SUBREDDITS, TWITTER_ACCOUNTS, DEFAULT_TELEGRAM_CHATS } from './constants';
import { fetchSubredditPosts } from './services/redditService';
import { fetchBatchTweets } from './services/twitterService';
import { fetchChatsPreview } from './services/telegramService';
import { performCombinedAnalysis } from './services/geminiService';
import { fetchCryptoMarketData } from './services/coinMarketCapService';
import { CombinedAnalysisResponse, RedditPost, Tweet, CMCCoinData, TelegramMessage } from './types';
import CryptoCard from './components/CryptoCard';
import AltcoinGemCard from './components/AltcoinGemCard';
import SentimentChart from './components/SentimentChart';
import TelegramFilter from './components/TelegramFilter';
import SingleCoinAnalysis from './components/SingleCoinAnalysis';

// Icons
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
);

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></svg>
);

const AnalysisIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'main' | 'chatFilter' | 'singleCoin'>('singleCoin');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');

  // Progress states for different phases
  const [redditProgress, setRedditProgress] = useState({ current: 0, total: 0 });
  const [twitterProgress, setTwitterProgress] = useState({ current: 0, total: 0 });
  const [telegramProgress, setTelegramProgress] = useState({ current: 0, total: 0 });

  // Data
  const [result, setResult] = useState<CombinedAnalysisResponse | null>(null);
  const [sourcePosts, setSourcePosts] = useState<RedditPost[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [telegramMessages, setTelegramMessages] = useState<TelegramMessage[]>([]);

  // Selection
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>(
    TARGET_SUBREDDITS.slice(0, 10).map(s => s.name)
  );
  const [selectedTwitterIds, setSelectedTwitterIds] = useState<string[]>(
    TWITTER_ACCOUNTS.slice(0, 5).map(t => t.id)
  );
  const [selectedTelegramChats, setSelectedTelegramChats] = useState<string[]>(
    DEFAULT_TELEGRAM_CHATS.slice(0, 5)
  );

  const abortRef = useRef<boolean>(false);

  const handleStop = () => {
    abortRef.current = true;
    setStatus('Остановка...');
  };

  const handleDownloadJSON = () => {
    if (!result) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      analysis: result,
      sources: {
        reddit_count: sourcePosts.length,
        twitter_count: tweets.length,
        telegram_chats_count: telegramMessages.length > 0 ? selectedTelegramChats.length : 0,
        telegram_messages_count: telegramMessages.length
      },
      source_posts: sourcePosts.map(post => ({
        ...post,
        created_date_human: new Date(post.created_utc * 1000).toLocaleString('ru-RU', {
          timeZoneName: 'short'
        })
      })),
      tweets: tweets.map(t => ({
        ...t,
        created_date_human: new Date(t.created_at).toLocaleString('ru-RU')
      })),
      telegram_messages: telegramMessages
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `crypto_pulse_report_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Selection Logic
  const toggleSubreddit = (name: string) => {
    setSelectedSubreddits(prev => prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]);
  };
  const toggleTwitter = (id: string) => {
    setSelectedTwitterIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleTelegramChat = (chat: string) => {
    setSelectedTelegramChats(prev => prev.includes(chat) ? prev.filter(c => c !== chat) : [...prev, chat]);
  };

  // Helper to run the AI part and merge market data
  const runAIAnalysis = async (
    posts: RedditPost[],
    tweets: Tweet[],
    telegramMsgs: TelegramMessage[],
    marketContext: string,
    coinMap: Map<string, CMCCoinData>,
    mode: 'simple' | 'hourly' | 'altcoins' | 'today_20msk'
  ) => {
    let modeText = 'Общий прогноз (24ч)';
    if (mode === 'hourly') modeText = 'Почасовая детализация';
    if (mode === 'altcoins') modeText = 'Поиск Альткоинов (7 дней)';
    if (mode === 'today_20msk') modeText = 'Прогноз на 20:00 МСК';

    setStatus(`AI: Генерация (${modeText})...`);

    const analysis = await performCombinedAnalysis(posts, tweets, telegramMsgs, marketContext, mode);

    // Merge Real-time Prices only if coins exist (standard mode)
    if (analysis.coins) {
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
      analysis.coins = enrichedCoins;
    }

    setResult(analysis);
    setStatus('Готово!');
  };

  // Generic function to Fetch Data AND Run Analysis
  const executeAnalysisPipeline = useCallback(async (mode: 'simple' | 'altcoins' | 'today_20msk', forceRefresh = true) => {
    if (selectedSubreddits.length === 0) {
      alert("Выберите хотя бы один сабреддит.");
      return;
    }

    setIsProcessing(true);
    setResult(null);
    abortRef.current = false;

    // Check if we need to fetch new data
    const shouldFetch = forceRefresh || sourcePosts.length === 0;

    try {
      // --- PHASE 1: MARKET DATA ---
      // Always refresh market data as it's fast
      setStatus('1/4 Получение рыночных данных...');
      const { summary: marketContext, coinMap } = await fetchCryptoMarketData();

      let finalPosts = sourcePosts;
      let finalTweets = tweets;
      let finalTelegram = telegramMessages;

      // If fetching required (Force Refresh OR No Data)
      if (shouldFetch) {
        // Clear old data references locally
        finalPosts = [];
        finalTweets = [];
        finalTelegram = [];
        setSourcePosts([]);
        setTweets([]);
        setTelegramMessages([]);

        // --- PHASE 2 & 3: FETCH SOURCES IN PARALLEL ---
        setStatus('2/4 Сканирование источников (Параллельно)...');

        // Create initial states for progress
        setRedditProgress({ current: 0, total: selectedSubreddits.length });
        setTwitterProgress({ current: 0, total: selectedTwitterIds.length });
        setTelegramProgress({ current: 0, total: selectedTelegramChats.length > 0 ? 1 : 0 });

        // Reddit Task
        const redditTask = async () => {
          const allPosts: RedditPost[] = [];
          let processedCount = 0;

          for (const sub of selectedSubreddits) {
            if (abortRef.current) break;

            const posts = await fetchSubredditPosts(sub);
            const significantPosts = posts.filter(p => p.score >= 1);
            allPosts.push(...significantPosts);

            processedCount++;
            setRedditProgress({ current: processedCount, total: selectedSubreddits.length });
          }

          if (allPosts.length === 0) throw new Error("Не найдено подходящих постов Reddit.");

          const topPosts = allPosts.sort((a, b) => b.score - a.score).slice(0, 500);
          return topPosts;
        };

        // Twitter Task
        const twitterTask = async () => {
          if (selectedTwitterIds.length === 0) return [];

          return await fetchBatchTweets(selectedTwitterIds, 5, (curr, total) => {
            setTwitterProgress({ current: curr, total: total });
          });
        };

        // Telegram Task
        const telegramTask = async () => {
          if (selectedTelegramChats.length === 0) return [];
          const response = await fetchChatsPreview(selectedTelegramChats, 1); // Only last 24h
          setTelegramProgress({ current: 1, total: 1 });

          const allMsgs: TelegramMessage[] = [];
          if (response && response.data) {
            Object.values(response.data).forEach(msgs => {
              if (msgs && Array.isArray(msgs)) {
                allMsgs.push(...msgs);
              }
            });
          }
          return allMsgs;
        };

        // Run all simultaneously
        const [redditResult, twitterResult, telegramResult] = await Promise.allSettled([
          redditTask(),
          twitterTask(),
          telegramTask()
        ]);

        if (abortRef.current) throw new Error("Stopped by user");

        // Process Reddit Result
        if (redditResult.status === 'fulfilled') {
          finalPosts = redditResult.value;
          setSourcePosts(finalPosts);
        } else {
          console.error("Reddit fetch failed:", redditResult.reason);
          throw new Error(`Ошибка Reddit: ${redditResult.reason}`);
        }

        // Process Twitter Result
        if (twitterResult.status === 'fulfilled') {
          finalTweets = twitterResult.value;
          setTweets(finalTweets);
        } else {
          console.error("Twitter fetch failed:", twitterResult.reason);
          setStatus('Ошибка Twitter, продолжаем...');
          // Non-fatal
        }

        // Process Telegram Result
        if (telegramResult.status === 'fulfilled') {
          finalTelegram = telegramResult.value;
          setTelegramMessages(finalTelegram);
        } else {
          console.error("Telegram fetch failed:", telegramResult.reason);
          setStatus('Ошибка Telegram, продолжаем...');
          // Non-fatal
        }
      } else {
        setStatus('Используем уже собранные данные...');
      }

      // --- PHASE 4: COMBINED AI ANALYSIS ---
      await runAIAnalysis(finalPosts, finalTweets, finalTelegram, marketContext, coinMap, mode);

    } catch (error) {
      if (abortRef.current) {
        setStatus("Отменено пользователем.");
      } else {
        console.error(error);
        alert(error instanceof Error ? error.message : "Ошибка анализа");
        setStatus("Ошибка.");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [selectedSubreddits, selectedTwitterIds, sourcePosts, tweets]);

  // Hourly Analysis (Uses existing data)
  const handleHourlyAnalysis = async () => {
    if (sourcePosts.length === 0) return;
    setIsProcessing(true);
    abortRef.current = false;
    try {
      setStatus('Обновление рыночных цен...');
      const { summary: marketContext, coinMap } = await fetchCryptoMarketData();
      await runAIAnalysis(sourcePosts, tweets, telegramMessages, marketContext, coinMap, 'hourly');
    } catch (error) {
      console.error(error);
      alert("Ошибка при почасовом анализе");
      setStatus("Ошибка.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-gray-200 font-sans selection:bg-brand-accent selection:text-white pb-20">

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-accent to-blue-600 flex items-center justify-center text-white font-bold">
              CP
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mr-4">CryptoPulse <span className="text-brand-accent">AI</span></h1>

            {/* Navigation Tabs */}
            <div className="hidden md:flex space-x-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('main')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'main' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                Анализ рынка
              </button>
              <button
                onClick={() => setActiveTab('chatFilter')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'chatFilter' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                Анализ чатов (Beta)
              </button>
              <button
                onClick={() => setActiveTab('singleCoin')}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${activeTab === 'singleCoin' ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                Мнение о монете
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {result && !isProcessing && (
              <button
                onClick={handleDownloadJSON}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all"
                title="Скачать JSON"
              >
                <DownloadIcon />
                <span className="hidden sm:inline">JSON</span>
              </button>
            )}

            {isProcessing ? (
              <button
                onClick={handleStop}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 transition-all"
              >
                <StopIcon />
                <span>Стоп</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-center">

                {/* Hourly Trigger */}
                {sourcePosts.length > 0 && result?.coins && !result.coins[0]?.hourlyForecast && (
                  <button
                    onClick={handleHourlyAnalysis}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-blue-400 border border-blue-500/30 transition-all"
                  >
                    <AnalysisIcon />
                    <span className="hidden lg:inline">Почасово</span>
                  </button>
                )}

                {/* Today 20:00 MSK */}
                <button
                  onClick={() => executeAnalysisPipeline('today_20msk', true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all"
                >
                  <ClockIcon />
                  <span>20:00 МСК</span>
                </button>


                {/* Standard Trigger */}
                <button
                  onClick={() => executeAnalysisPipeline('simple', true)}
                  className="flex items-center space-x-2 px-6 py-2 rounded-lg text-sm font-semibold bg-brand-accent hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <RefreshIcon />
                  <span>Сбор + Анализ (24ч)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {activeTab === 'singleCoin' ? (
          <SingleCoinAnalysis />
        ) : activeTab === 'chatFilter' ? (
          <TelegramFilter />
        ) : (
          <>
            {/* Progress Display */}
            {isProcessing && (
              <div className="bg-brand-card border border-gray-800 rounded-xl p-6 animate-pulse">
                <div className="flex justify-between text-sm mb-2 text-gray-400">
                  <span className="font-mono text-brand-accent">{status}</span>
                </div>
                {/* Multi-stage Progress Bars */}
                <div className="space-y-2">
                  {/* Reddit Bar */}
                  <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-orange-500 h-1.5 transition-all duration-300"
                      style={{ width: `${redditProgress.total ? (redditProgress.current / redditProgress.total) * 100 : 0}%` }}
                    ></div>
                  </div>
                  {/* Twitter Bar */}
                  {selectedTwitterIds.length > 0 && (
                    <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-1.5 transition-all duration-300"
                        style={{ width: `${twitterProgress.total ? (twitterProgress.current / twitterProgress.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  )}
                  {/* Telegram Bar */}
                  {selectedTelegramChats.length > 0 && (
                    <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-brand-accent h-1.5 transition-all duration-800"
                        style={{ width: `${telegramProgress.total ? (telegramProgress.current / telegramProgress.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Configuration Area */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reddit Selection */}
              <div className="bg-brand-card border border-gray-800 rounded-xl p-6 max-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-orange-500">●</span> Источники Reddit
                  </h2>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedSubreddits(TARGET_SUBREDDITS.map(s => s.name))} className="text-xs text-blue-400 hover:text-blue-300">Все</button>
                    <button onClick={() => setSelectedSubreddits([])} className="text-xs text-gray-400 hover:text-gray-300">Сброс</button>
                  </div>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                  <div className="flex flex-wrap gap-2 content-start">
                    {TARGET_SUBREDDITS.map((sub) => (
                      <button
                        key={sub.name}
                        onClick={() => toggleSubreddit(sub.name)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${selectedSubreddits.includes(sub.name)
                          ? 'bg-orange-600/20 border-orange-500 text-orange-400'
                          : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'
                          }`}
                      >
                        r/{sub.name}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">Выбрано: {selectedSubreddits.length}</p>
              </div>

              {/* Twitter Selection */}
              <div className="bg-brand-card border border-gray-800 rounded-xl p-6 max-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-blue-500">●</span> Источники Twitter (X)
                  </h2>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedTwitterIds(TWITTER_ACCOUNTS.map(t => t.id))} className="text-xs text-blue-400 hover:text-blue-300">Все</button>
                    <button onClick={() => setSelectedTwitterIds(TWITTER_ACCOUNTS.slice(0, 5).map(t => t.id))} className="text-xs text-blue-400 hover:text-blue-300">Топ 5</button>
                    <button onClick={() => setSelectedTwitterIds([])} className="text-xs text-gray-400 hover:text-gray-300">Сброс</button>
                  </div>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                  <div className="flex flex-wrap gap-2 content-start">
                    {TWITTER_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => toggleTwitter(acc.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${selectedTwitterIds.includes(acc.id)
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                          : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'
                          }`}
                        title={acc.username}
                      >
                        @{acc.username}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">Выбрано: {selectedTwitterIds.length}</p>
              </div>

              {/* Telegram Selection */}
              <div className="bg-brand-card border border-gray-800 rounded-xl p-6 max-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-brand-accent">●</span> Источники Telegram
                  </h2>
                  <div className="flex space-x-2">
                    <button onClick={() => setSelectedTelegramChats(DEFAULT_TELEGRAM_CHATS)} className="text-xs text-brand-accent hover:text-emerald-300">Все</button>
                    <button onClick={() => setSelectedTelegramChats([])} className="text-xs text-gray-400 hover:text-gray-300">Сброс</button>
                  </div>
                </div>
                <div className="flex-grow overflow-y-auto custom-scrollbar">
                  <div className="flex flex-wrap gap-2 content-start">
                    {DEFAULT_TELEGRAM_CHATS.map((chat) => (
                      <button
                        key={chat}
                        onClick={() => toggleTelegramChat(chat)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${selectedTelegramChats.includes(chat)
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                          : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'
                          }`}
                        title={chat}
                      >
                        @{chat}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-right">Выбрано: {selectedTelegramChats.length}</p>
              </div>
            </section>

            {/* Combined Result Display */}
            {result ? (
              <>
                {/* Strategy Card (Always visible) */}
                <div className="bg-brand-card border border-indigo-500/50 rounded-xl p-8 shadow-2xl relative overflow-hidden animate-fade-in">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BrainIcon />
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-800 pb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                        Стратегический отчет
                      </h2>
                      <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                        {result.forecastLabel ? `Mode: ${result.forecastLabel}` : 'Mode: Daily/Hourly Analysis'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase">Top Pick</p>
                        <p className="text-xl font-bold text-emerald-400">{result.topPick}</p>
                      </div>
                      <div className="text-right border-l border-gray-700 pl-4">
                        <p className="text-xs text-gray-500 uppercase">Risk Level</p>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${result.riskLevel === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                          result.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                          {result.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 uppercase mb-3 border-l-2 border-indigo-500 pl-3">Технический Вердикт</h4>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                        {result.technicalVerdict}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 uppercase mb-3 border-l-2 border-brand-accent pl-3">Торговая Стратегия</h4>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                        {result.strategy}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Market Summary */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
                  <h2 className="text-xl font-bold text-white mb-2">Обзор рынка</h2>
                  <p className="text-gray-300">{result.marketSummary}</p>
                </div>

                {/* CONDITIONAL CONTENT: Altcoins VS Standard Coins */}
                {result.altcoins ? (
                  /* ALTCOIN VIEW */
                  <div>
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <span className="text-purple-400">💎</span> Найденные Гемы (7-дневный потенциал)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {result.altcoins.map((gem, idx) => (
                        <AltcoinGemCard key={`${gem.symbol}-${idx}`} gem={gem} />
                      ))}
                    </div>
                    {result.altcoins.length === 0 && (
                      <div className="text-center p-10 text-gray-500 bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
                        ИИ не нашел явных альткоинов с высоким потенциалом в текущем контексте.
                      </div>
                    )}
                  </div>
                ) : (
                  /* STANDARD VIEW (BTC, ETH...) */
                  <>
                    {/* Charts */}
                    {result.coins && (
                      <div className="bg-brand-card border border-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Тепловая карта настроений</h3>
                        <SentimentChart data={result.coins} />
                      </div>
                    )}

                    {/* Detailed Cards */}
                    {result.coins && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-6">Детальный анализ (Топ активы)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {result.coins.map((coin, idx) => (
                            <CryptoCard key={`${coin.symbol}-${idx}`} coin={coin} forecastLabel={result.forecastLabel} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Source Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 opacity-70">
                  <div className="bg-brand-card border border-gray-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-orange-400 mb-1">Reddit</h4>
                    <p className="text-sm text-gray-400">Постов: {sourcePosts.length}</p>
                  </div>
                  {tweets.length > 0 && (
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-blue-400 mb-1">Twitter</h4>
                      <p className="text-sm text-gray-400">Твитов: {tweets.length}</p>
                    </div>
                  )}
                  {telegramMessages.length > 0 && (
                    <div className="bg-brand-card border border-gray-800 rounded-xl p-4">
                      <h4 className="text-xs font-bold text-brand-accent mb-1">Telegram</h4>
                      <p className="text-sm text-gray-400">Сообщений: {telegramMessages.length}</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              !isProcessing && (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-800 rounded-xl">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Готов к анализу</h3>
                  <p className="text-gray-400 max-w-md">
                    Настройте источники выше и выберите режим анализа.
                  </p>
                </div>
              )
            )}
          </>
        )}
      </main>


    </div>
  );
};

export default App;