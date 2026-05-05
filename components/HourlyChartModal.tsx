import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CryptoAnalysis } from '../types';

interface HourlyChartModalProps {
    coin: CryptoAnalysis;
    isOpen: boolean;
    onClose: () => void;
}

const HourlyChartModal: React.FC<HourlyChartModalProps> = ({ coin, isOpen, onClose }) => {
    if (!isOpen) return null;

    const isBullish = coin.prediction === 'Bullish';
    const isBearish = coin.prediction === 'Bearish';
    const chartColor = isBullish ? '#10B981' : isBearish ? '#EF4444' : '#F59E0B';

    const hasHourlyData = coin.hourlyForecast && coin.hourlyForecast.length >= 6;

    const chartData = hasHourlyData ? coin.hourlyForecast!.map((point, index, arr) => {
        // Use analysisDate if provided, otherwise fallback to now
        const baseDate = coin.analysisDate ? new Date(coin.analysisDate) : new Date();
        
        // Ensure we are working with MSK for label generation
        const mskOffset = 3 * 60; // 3 hours in minutes
        const baseMsk = new Date(baseDate.getTime() + (mskOffset + baseDate.getTimezoneOffset()) * 60000);
        
        const startHourMsk = (baseMsk.getHours() + 1) % 24;
        const targetHour = (startHourMsk + point.hourOffset - 1) % 24;

        const currentPrice = point.price !== undefined && point.price !== null ? point.price : (coin.currentPrice || 0);
        // Calculate hour-to-hour change (not from start)
        let hourChange = 0;
        if (index === 0) {
            // First hour: change from start price
            hourChange = coin.currentPrice ? ((currentPrice - coin.currentPrice) / coin.currentPrice) * 100 : 0;
        } else {
            const prevPrice = arr[index - 1]?.price || currentPrice;
            hourChange = prevPrice ? ((currentPrice - prevPrice) / prevPrice) * 100 : 0;
        }

        return {
            time: `${targetHour.toString().padStart(2, '0')}:00`,
            price: currentPrice,
            change: hourChange,
            confidence: point.confidence !== undefined && point.confidence !== null ? point.confidence : (coin.confidence || 50),
            hourOffset: point.hourOffset
        };
    }) : [];

    let minPrice: number | string = 'auto';
    let maxPrice: number | string = 'auto';
    if (chartData.length > 0) {
        const prices = chartData.map(d => d.price).filter(p => p > 0);
        if (prices.length > 0) {
            const minP = Math.min(...prices);
            const maxP = Math.max(...prices);
            const diff = maxP - minP || maxP * 0.01; // avoid zero diff
            minPrice = minP - diff * 0.1;
            maxPrice = maxP + diff * 0.1;
        }
    }

    const getConfidenceColor = (conf: number) => {
        if (conf >= 75) return 'bg-emerald-500';
        if (conf >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const avgConfidence = chartData.length > 0
        ? Math.round(chartData.reduce((sum, d) => sum + d.confidence, 0) / chartData.length)
        : 0;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={handleOverlayClick}
        >
            <div className="bg-brand-card border border-gray-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/40">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            {coin.symbol}
                            <span className="text-sm font-normal text-gray-400 bg-gray-800 px-2 py-1 rounded-md uppercase">
                                {coin.name}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Почасовой прогноз (Время МСК)</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700 p-2 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-grow flex flex-col min-h-[400px]">
                    {!hasHourlyData ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500">
                            График недоступен для данного актива.
                        </div>
                    ) : (
                        <>
                            {/* Price Chart */}
                            <div className="w-full" style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id={`colorPriceModal`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>

                                        <XAxis
                                            dataKey="time"
                                            stroke="#4B5563"
                                            fontSize={12}
                                            tickMargin={12}
                                            tickFormatter={(value, index) => index % 3 === 0 ? value : ''}
                                        />

                                        <YAxis
                                            domain={[minPrice, maxPrice]}
                                            stroke="#4B5563"
                                            fontSize={12}
                                            width={80}
                                            tickFormatter={(value) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: coin.currentPrice && coin.currentPrice < 1 ? 4 : 3, maximumFractionDigits: coin.currentPrice && coin.currentPrice < 1 ? 4 : 3 })}`}
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#111827',
                                                borderColor: '#374151',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                            }}
                                            labelStyle={{ color: '#9CA3AF', marginBottom: '8px', fontWeight: 'bold' }}
                                            formatter={(value: any, name: any) => {
                                                if (name === 'price') return [`$${value < 1 ? Number(value).toFixed(6) : Number(value).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`, 'Цена'];
                                                if (name === 'change') return [`${value > 0 ? '+' : ''}${Number(value).toFixed(2)}%`, 'Изменение'];
                                                return [value, name];
                                            }}
                                            labelFormatter={(label) => `Время (МСК): ${label}`}
                                        />

                                        <Area
                                            type="monotone"
                                            dataKey="price"
                                            stroke={chartColor}
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill={`url(#colorPriceModal)`}
                                        />
                                        <Area type="monotone" dataKey="change" stroke="none" fill="none" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Confidence Row */}
                            <div className="mt-2 px-2">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1.5 tracking-wider">Уверенность AI по часам</p>
                                <div className="flex gap-[2px]">
                                    {chartData.map((d, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center group relative">
                                            <div
                                                className={`w-full rounded-sm ${getConfidenceColor(d.confidence)} transition-all`}
                                                style={{ height: `${Math.max(4, d.confidence * 0.3)}px`, opacity: 0.7 }}
                                            />
                                            <span className="text-[8px] text-gray-500 mt-0.5">
                                                {i % 3 === 0 ? d.confidence + '%' : ''}
                                            </span>
                                            <span className="text-[7px] text-gray-600 font-mono leading-tight">
                                                {i % 3 === 0 ? (d.price < 1 ? d.price.toFixed(4) : '$' + d.price.toLocaleString('en-US', { maximumFractionDigits: 0 })) : ''}
                                            </span>
                                            {/* Tooltip on hover */}
                                            <div className="absolute bottom-full mb-1 bg-gray-800 text-[10px] text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 flex flex-col items-center">
                                                <span className="font-bold">{d.time}</span>
                                                <span className="text-gray-300">${d.price < 1 ? d.price.toFixed(6) : d.price.toLocaleString()}</span>
                                                <span className={`${d.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {d.change > 0 ? '+' : ''}{d.change.toFixed(2)}%
                                                </span>
                                                <span className="text-gray-400">Уверенность: {d.confidence}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Summary */}
                <div className="p-4 bg-gray-900/60 border-t border-gray-800 flex justify-between text-sm">
                    <div className="flex gap-6">
                        <div>
                            <span className="text-gray-500 block text-xs uppercase font-bold tracking-wider">Прогноз</span>
                            <span className={`font-bold ${isBullish ? 'text-emerald-400' : isBearish ? 'text-red-400' : 'text-yellow-400'}`}>
                                {coin.prediction} ({coin.confidence}%)
                            </span>
                        </div>
                        {coin.change24h !== undefined && (
                            <div>
                                <span className="text-gray-500 block text-xs uppercase font-bold tracking-wider">За 24 часа</span>
                                <span className={`font-bold ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {coin.change24h > 0 ? '+' : ''}{coin.change24h.toFixed(2)}%
                                </span>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-500 block text-xs uppercase font-bold tracking-wider">Ср. уверенность</span>
                            <span className={`font-bold ${avgConfidence >= 75 ? 'text-emerald-400' : avgConfidence >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {avgConfidence}%
                            </span>
                        </div>
                        <div className="flex items-end gap-2 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block"></span>≥75%</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-500 inline-block"></span>50-74%</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block"></span>&lt;50%</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-400 max-w-lg text-xs leading-relaxed">{coin.reasoning}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HourlyChartModal;
