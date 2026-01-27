import React from 'react';
import { CryptoAnalysis } from '../types';

interface CryptoCardProps {
  coin: CryptoAnalysis;
}

const CryptoCard: React.FC<CryptoCardProps> = ({ coin }) => {
  const isBullish = coin.prediction === 'Bullish';
  const isBearish = coin.prediction === 'Bearish';
  
  const scoreColor = isBullish 
    ? 'text-emerald-400' 
    : isBearish 
      ? 'text-red-400' 
      : 'text-yellow-400';

  const borderColor = isBullish 
    ? 'border-emerald-500/20' 
    : isBearish 
      ? 'border-red-500/20' 
      : 'border-yellow-500/20';

  // Map English enums to Russian display text
  const predictionText = {
    'Bullish': 'Бычий',
    'Bearish': 'Медвежий',
    'Neutral': 'Нейтральный'
  }[coin.prediction] || coin.prediction;

  // Formatting helpers for market data
  const formatPrice = (price?: number) => {
    if (price === undefined) return "Н/Д";
    return price < 1 
      ? `$${price.toFixed(6)}` 
      : `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (vol?: number) => {
    if (!vol) return "Н/Д";
    if (vol > 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
    if (vol > 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    return `$${vol.toLocaleString()}`;
  };

  return (
    <div className={`bg-brand-card border ${borderColor} p-6 rounded-xl hover:shadow-lg transition-all duration-300 flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">{coin.symbol}</h3>
          <p className="text-sm text-gray-400">{coin.name}</p>
        </div>
        <div className={`flex flex-col items-end ${scoreColor}`}>
          <span className="text-3xl font-mono font-bold">{coin.sentimentScore}</span>
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Настроение</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
          isBullish ? 'bg-emerald-500/10 text-emerald-400' : 
          isBearish ? 'bg-red-500/10 text-red-400' : 
          'bg-yellow-500/10 text-yellow-400'
        }`}>
          {predictionText}
        </span>
        <span className="text-xs text-gray-500">Уверенность: {coin.confidence}%</span>
      </div>

      {/* Real-time Market Data Section */}
      {coin.currentPrice !== undefined && (
        <div className="mb-5 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
           <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Рыночные данные (Real-time)</p>
           <div className="flex justify-between items-center mb-1">
              <span className="text-lg font-mono font-bold text-white">{formatPrice(coin.currentPrice)}</span>
              {coin.change24h !== undefined && (
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${coin.change24h >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {coin.change24h >= 0 ? '↑' : '↓'} {Math.abs(coin.change24h).toFixed(2)}%
                </span>
              )}
           </div>
           <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>Vol 24h: {formatVolume(coin.volume24h)}</span>
              {coin.change7d !== undefined && (
                <span>7d: <span className={coin.change7d >= 0 ? "text-emerald-500" : "text-red-500"}>{coin.change7d.toFixed(1)}%</span></span>
              )}
           </div>
        </div>
      )}

      <div className="space-y-3 flex-grow">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Анализ</p>
          <p className="text-sm text-gray-300 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">{coin.reasoning}</p>
        </div>
        
        {/* Standard Range */}
        <div className="pt-2 border-t border-gray-800">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Общий прогноз (24 часа)</p>
          <div className="flex justify-between items-baseline">
            <p className="text-base font-mono font-medium text-gray-300">
              {coin.targetPriceRange || "Н/Д"}
            </p>
          </div>
        </div>

        {/* Precise Sniper Range */}
        <div className="pt-3 border-t border-gray-700/50 mt-1">
          <div className="flex items-center gap-2 mb-1">
             <span className="text-lg">🎯</span>
             <p className="text-xs text-brand-accent uppercase font-bold tracking-wider">Точный прогноз (Sniper)</p>
          </div>
          <div className="bg-brand-accent/5 border border-brand-accent/20 rounded p-2">
            <p className="text-lg font-mono font-bold text-white tracking-wide text-brand-accent text-center">
              {coin.precisePriceRange || "Н/Д"}
            </p>
          </div>
          <p className="text-xs text-gray-400 italic mt-2 leading-tight text-center">"{coin.pricePrediction24h}"</p>
        </div>
      </div>
      
      {coin.sources && coin.sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
           <p className="text-xs text-gray-500 mb-1">Источник:</p>
           <a 
            href={coin.sources[0]} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-brand-accent hover:underline truncate block"
           >
             Читать тред на Reddit &rarr;
           </a>
        </div>
      )}
    </div>
  );
};

export default CryptoCard;