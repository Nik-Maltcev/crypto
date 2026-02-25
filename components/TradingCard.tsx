import React from 'react';
import { TradingRecommendation } from '../types';

interface Props {
    trade: TradingRecommendation;
}

const TradingCard: React.FC<Props> = ({ trade }) => {
    const isLong = trade.direction === 'LONG';

    return (
        <div className={`bg-brand-card border rounded-xl p-5 relative overflow-hidden transition-all hover:shadow-lg ${isLong ? 'border-emerald-500/40 hover:shadow-emerald-500/10' : 'border-red-500/40 hover:shadow-red-500/10'
            }`}>
            {/* Direction Badge */}
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-xs font-black tracking-wider ${isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                {trade.direction}
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${isLong ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                    {isLong ? '↑' : '↓'}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">{trade.symbol}</h3>
                    <p className="text-xs text-gray-400">{trade.name}</p>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-xs text-gray-500">Уверенность</p>
                    <p className={`text-lg font-bold ${trade.confidence >= 80 ? 'text-emerald-400' : trade.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {trade.confidence}%
                    </p>
                </div>
            </div>

            {/* Confidence Bar */}
            <div className="w-full bg-gray-700 rounded-full h-1.5 mb-4">
                <div
                    className={`h-1.5 rounded-full transition-all ${isLong ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${trade.confidence}%` }}
                />
            </div>

            {/* Price Levels */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Вход</p>
                    <p className="text-sm font-mono text-white">${trade.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                </div>
                <div className={`rounded-lg p-2 text-center ${isLong ? 'bg-emerald-500/10' : 'bg-emerald-500/10'}`}>
                    <p className="text-[10px] text-emerald-400 uppercase font-bold">TP</p>
                    <p className="text-sm font-mono text-emerald-400">${trade.takeProfit.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-red-400 uppercase font-bold">SL</p>
                    <p className="text-sm font-mono text-red-400">${trade.stopLoss.toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
                </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                    <span className="text-gray-500">Плечо:</span>
                    <span className="text-yellow-400 font-bold">{trade.leverage}x</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Позиция:</span>
                    <span className="text-white font-mono">${trade.positionSizeUSDT.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">R:R:</span>
                    <span className="text-white">{trade.riskRewardRatio}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Ликвидация:</span>
                    <span className="text-red-400 font-mono">${trade.liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Профит:</span>
                    <span className="text-emerald-400 font-bold">{trade.potentialProfit}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Убыток:</span>
                    <span className="text-red-400 font-bold">{trade.potentialLoss}</span>
                </div>
            </div>

            {/* Reasoning */}
            <div className="text-xs text-gray-300 leading-relaxed mb-3 border-l-2 border-gray-700 pl-3">
                {trade.reasoning}
            </div>

            {/* Warning */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2.5 text-xs text-yellow-400/90">
                <span className="font-bold">⚠️ </span>{trade.warning}
            </div>
        </div>
    );
};

export default TradingCard;
