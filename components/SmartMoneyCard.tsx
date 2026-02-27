import React from 'react';
import { SmartMoneyTrade } from '../types';

interface Props {
    trade: SmartMoneyTrade;
}

const SmartMoneyCard: React.FC<Props> = ({ trade }) => {
    const isLong = trade.direction === 'LONG';
    const isOverheated = trade.priceChange24h > 30;

    const signalColors = {
        scalp: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: '⚡ Scalp (0.5-2ч)' },
        intraday: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '📈 Intraday (2-8ч)' },
        swing: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '🔄 Swing (8-24ч)' },
    };
    const signal = signalColors[trade.signalType];

    const pillarBar = (value: number, max: number, color: string) => (
        <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(value / max) * 100}%` }} />
        </div>
    );

    const scoreColor = trade.aiScore >= 85 ? 'text-emerald-400' : trade.aiScore >= 75 ? 'text-yellow-400' : 'text-red-400';
    const scoreBg = trade.aiScore >= 85 ? 'from-emerald-500/20' : trade.aiScore >= 75 ? 'from-yellow-500/20' : 'from-red-500/20';

    return (
        <div className={`bg-brand-card border rounded-xl p-5 relative overflow-hidden transition-all hover:shadow-lg ${isLong ? 'border-emerald-500/30 hover:shadow-emerald-500/10' : 'border-red-500/30 hover:shadow-red-500/10'
            }`}>

            {/* Top Row: Signal Type + Direction */}
            <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${signal.bg} ${signal.text}`}>
                    {signal.label}
                </span>
                <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider ${isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {trade.direction}
                </span>
            </div>

            {/* Header: Symbol + AI Score */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white">{trade.symbol}</h3>
                    <p className="text-xs text-gray-400">{trade.name}</p>
                </div>
                <div className={`text-right bg-gradient-to-br ${scoreBg} to-transparent rounded-xl px-4 py-2`}>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">AI Score</p>
                    <p className={`text-2xl font-black ${scoreColor}`}>{trade.aiScore}</p>
                </div>
            </div>

            {/* 4 Pillars */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-gray-500">Narrative</span>
                        <span className="text-gray-300 font-mono">{trade.narrativeStrength}/25</span>
                    </div>
                    {pillarBar(trade.narrativeStrength, 25, 'bg-cyan-500')}
                </div>
                <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-gray-500">Asymmetry</span>
                        <span className="text-gray-300 font-mono">{trade.informationAsymmetry}/25</span>
                    </div>
                    {pillarBar(trade.informationAsymmetry, 25, 'bg-violet-500')}
                </div>
                <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-gray-500">Velocity</span>
                        <span className="text-gray-300 font-mono">{trade.socialVelocityDelta}/25</span>
                    </div>
                    {pillarBar(trade.socialVelocityDelta, 25, 'bg-orange-500')}
                </div>
                <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-gray-500">Risk/Reward</span>
                        <span className="text-gray-300 font-mono">{trade.riskReward}/25</span>
                    </div>
                    {pillarBar(trade.riskReward, 25, 'bg-emerald-500')}
                </div>
            </div>

            {/* Entry / Target / SL */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Вход</p>
                    <p className="text-xs font-mono text-white">
                        ${trade.entryZoneMin.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                    <p className="text-[9px] text-gray-500">
                        - ${trade.entryZoneMax.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-emerald-400 uppercase font-bold">Цель</p>
                    <p className="text-xs font-mono text-emerald-400">
                        ${trade.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                    <p className="text-[9px] text-emerald-300">+{trade.targetPercent.toFixed(1)}%</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-red-400 uppercase font-bold">Стоп</p>
                    <p className="text-xs font-mono text-red-400">
                        ${trade.stopLoss.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                </div>
            </div>

            {/* Time & Leverage Info */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                <div className="flex flex-col items-center bg-gray-800/30 rounded-lg p-2">
                    <span className="text-[10px] text-gray-500 uppercase">Время</span>
                    <span className="text-white font-bold">{trade.timeToTargetMinH}-{trade.timeToTargetMaxH}ч</span>
                </div>
                <div className="flex flex-col items-center bg-gray-800/30 rounded-lg p-2">
                    <span className="text-[10px] text-gray-500 uppercase">Плечо</span>
                    <span className="text-yellow-400 font-bold">{trade.leverage}x</span>
                </div>
                <div className="flex flex-col items-center bg-gray-800/30 rounded-lg p-2">
                    <span className="text-[10px] text-gray-500 uppercase">Max Hold</span>
                    <span className="text-orange-400 font-bold">{trade.maxHoldTimeH}ч</span>
                </div>
            </div>

            {/* Catalyst */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2.5 mb-3">
                <p className="text-[10px] text-blue-400 uppercase font-bold mb-1">🎯 Катализатор</p>
                <p className="text-xs text-blue-100">{trade.catalyst}</p>
            </div>

            {/* Reasoning */}
            <div className="text-xs text-gray-300 leading-relaxed mb-3 border-l-2 border-gray-700 pl-3">
                {trade.reasoning}
            </div>

            {/* Warnings */}
            <div className="space-y-2">
                {trade.fundingSensitive && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2 text-xs text-yellow-400/90">
                        <span className="font-bold">⚠️ Funding: </span>
                        Позиция пересекает время начисления ({trade.fundingImpact} impact).
                        {trade.fundingImpact === 'high' && ' Рекомендуется закрыть до начисления.'}
                    </div>
                )}
                {isOverheated && (
                    <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-2 text-xs text-orange-400/90">
                        <span className="font-bold">🔥 Перегрев: </span>
                        Цена уже выросла на {trade.priceChange24h.toFixed(1)}% за 24ч. Повышен риск отката.
                    </div>
                )}
            </div>

            {/* Confidence Badge */}
            <div className={`mt-3 text-center py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${trade.confidence === 'high' ? 'bg-emerald-500/10 text-emerald-400' :
                trade.confidence === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-gray-500/10 text-gray-400'
                }`}>
                Confidence: {trade.confidence}
            </div>
        </div>
    );
};

export default SmartMoneyCard;
