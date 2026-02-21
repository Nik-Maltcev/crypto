import React from 'react';
import { AltcoinGem } from '../types';

interface AltcoinGemCardProps {
  gem: AltcoinGem;
}

const AltcoinGemCard: React.FC<AltcoinGemCardProps> = ({ gem }) => {
  const isDegen = gem.risk === 'Degen';
  const riskColor = isDegen ? 'text-purple-400' : gem.risk === 'High' ? 'text-red-400' : 'text-yellow-400';
  const borderColor = isDegen ? 'border-purple-500/40' : gem.risk === 'High' ? 'border-red-500/40' : 'border-yellow-500/40';
  const bgGradient = isDegen 
    ? 'bg-gradient-to-br from-purple-900/20 to-gray-900' 
    : 'bg-gradient-to-br from-gray-800 to-gray-900';

  return (
    <div className={`relative ${bgGradient} border ${borderColor} rounded-xl overflow-hidden shadow-lg hover:shadow-purple-500/20 transition-all duration-300 flex flex-col h-full group`}>
      
      {/* Badge */}
      <div className="absolute top-0 right-0 p-3">
         <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
           isDegen ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-gray-700 border-gray-600 text-gray-300'
         }`}>
           {gem.risk} Risk
         </span>
      </div>

      <div className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {gem.symbol}
            {isDegen && <span title="High Risk / Meme" className="text-lg">🎲</span>}
          </h3>
          <p className="text-xs text-gray-400 font-medium truncate">{gem.name}</p>
        </div>

        {/* Potential Stat */}
        <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700/50">
           <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Потенциал (7 дней)</p>
           <p className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
             {gem.potential7d}
           </p>
        </div>

        {/* Hype Score */}
        <div className="mb-4">
           <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] text-gray-500 uppercase font-bold">Hype Score</span>
             <span className="text-sm font-bold text-white">{gem.score}/100</span>
           </div>
           <div className="w-full bg-gray-700 rounded-full h-1.5">
             <div 
               className={`h-1.5 rounded-full ${isDegen ? 'bg-purple-500' : 'bg-blue-500'}`} 
               style={{ width: `${gem.score}%` }}
             ></div>
           </div>
        </div>

        {/* Reasoning */}
        <div className="mt-auto">
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Почему вырастет?</p>
          <p className="text-sm text-gray-300 leading-snug">
            {gem.why}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AltcoinGemCard;