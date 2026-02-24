import React, { useState } from 'react';
import HourlyChartModal from './HourlyChartModal';
import { CryptoAnalysis } from '../types';

interface CryptoCardProps {
  coin: CryptoAnalysis;
  forecastLabel?: string;
}

const CryptoCard: React.FC<CryptoCardProps> = ({ coin, forecastLabel }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isBullish = coin.prediction === 'Bullish';
  const isBearish = coin.prediction === 'Bearish';

  const scoreColor = isBullish
    ? 'text-emerald-400'
    : isBearish
      ? 'text-red-400'
      : 'text-yellow-400';

  const borderColor = isBullish
    ? 'border-emerald-500/30'
    : isBearish
      ? 'border-red-500/30'
      : 'border-yellow-500/30';

  const chartColor = isBullish ? '#10B981' : isBearish ? '#EF4444' : '#F59E0B';

  const formatPrice = (price?: number) => {
    if (price === undefined) return "Н/Д";
    return price < 1
      ? `$${price.toFixed(6)}`
      : `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Determine forecast values
  // Prefer generic targetPrice if available (for specific time mode), fallback to 24h field
  const displayTargetPrice = coin.targetPrice !== undefined ? coin.targetPrice : coin.targetPrice24h;
  const displayTargetChange = coin.targetChange !== undefined ? coin.targetChange : coin.targetChange24h;
  // Default label updated to be more explicit about "Next 24h" vs "Past 24h"
  const displayLabel = forecastLabel || "Цель (След. 24ч)";

  // Determine if we have detailed hourly data
  const hasHourlyData = coin.hourlyForecast && coin.hourlyForecast.length >= 6;

  return (
    <div className={`bg-brand-card border ${borderColor} rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full relative group`}>
      {/* Header */}
      <div className="p-5 pb-0 flex justify-between items-start">
        <div>
          <h3 className="text-3xl font-bold text-white tracking-tight">{coin.symbol}</h3>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{coin.name}</p>
        </div>
        <div className="text-right">
          <div className={`text-4xl font-mono font-bold ${scoreColor}`}>
            {coin.sentimentScore}
          </div>
          <p className="text-[10px] text-gray-500 uppercase font-bold">AI Score</p>
        </div>
      </div>

      {/* Current Price Strip */}
      <div className="px-5 py-3 mt-4 flex items-center justify-between border-y border-gray-800 bg-gray-900/30">
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold">Текущая цена</p>
          <p className="text-xl font-mono text-white">{formatPrice(coin.currentPrice)}</p>
        </div>
        {coin.change24h !== undefined && (
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase font-bold text-gray-400">Прошлые 24ч</p>
            <span className={`text-sm font-bold ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {coin.change24h > 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-grow flex flex-col">

        {/* === CONTENT AREA: Either Single Target OR Chart === */}
        <div className="mb-4">

          {hasHourlyData ? (
            /* CHART VIEW (Hourly Mode) Mini Button */
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">{displayLabel}</span>
              </div>
              <div
                onClick={() => setIsModalOpen(true)}
                className="h-32 w-full bg-gray-900/40 hover:bg-gray-800/60 rounded-lg border border-gray-800 hover:border-blue-500/50 cursor-pointer overflow-hidden relative flex flex-col items-center justify-center transition-all group"
              >
                <div className="absolute inset-0 opacity-10 bg-blue-500 group-hover:opacity-20 transition-opacity"></div>
                <svg className="w-8 h-8 text-blue-400 mb-2 opacity-80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Почасовая детализация 📊</span>
                <span className="text-[10px] text-gray-500 mt-1">Нажмите для просмотра графика</span>
              </div>
            </>
          ) : (
            /* SIMPLE VIEW (Single Target - either 24h or specific time) */
            <div className="flex flex-col items-center justify-center h-40 bg-gray-900/20 rounded-lg border border-gray-800 relative overflow-hidden">
              <div className={`absolute inset-0 opacity-5 ${isBullish ? 'bg-emerald-500' : isBearish ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1 z-10">{displayLabel}</p>
              <div className="text-3xl font-mono font-bold text-white mb-1 z-10">
                {formatPrice(displayTargetPrice)}
              </div>
              {displayTargetChange !== undefined && (
                <span className={`text-sm px-2 py-0.5 rounded font-bold z-10 ${displayTargetChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {displayTargetChange > 0 ? '▲' : '▼'} {Math.abs(displayTargetChange).toFixed(2)}%
                </span>
              )}
              <div className={`mt-3 text-[10px] px-2 py-0.5 rounded border uppercase font-bold tracking-wider z-10 ${isBullish ? 'border-emerald-500/30 text-emerald-400' : isBearish ? 'border-red-500/30 text-red-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                {coin.prediction}
              </div>
            </div>
          )}
        </div>

        {/* AI Reasoning */}
        <div className="pt-4 border-t border-gray-800/50 mt-auto">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Обоснование прогноза</p>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
            {coin.reasoning || "Анализ отсутствует."}
          </p>
        </div>
      </div>

      {hasHourlyData && (
        <HourlyChartModal
          coin={coin}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CryptoCard;