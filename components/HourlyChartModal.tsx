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

    // Determine if we have detailed hourly data
    const hasHourlyData = coin.hourlyForecast && coin.hourlyForecast.length >= 6;

    // Chart Data Preparation
    const chartData = hasHourlyData ? coin.hourlyForecast!.map((point) => {
        // Current time in MSK (UTC+3)
        const now = new Date();
        const mskOffset = 3 * 60; // 3 hours in minutes
        const nowMsk = new Date(now.getTime() + (mskOffset + now.getTimezoneOffset()) * 60000);

        // Calculate the target hour for this point
        // We start from the NEXT full hour (ceil)
        const startHourMsk = (nowMsk.getHours() + 1) % 24;
        const targetHour = (startHourMsk + point.hourOffset - 1) % 24;

        return {
            time: `${targetHour.toString().padStart(2, '0')}:00`,
            price: point.price,
            change: point.change,
            confidence: point.confidence,
            hourOffset: point.hourOffset
        };
    }) : [];

    // Calculate min/max for y-axis to make chart look dynamic
    let minPrice = 'auto';
    let maxPrice = 'auto';
    if (chartData.length > 0) {
        const prices = chartData.map(d => d.price);
        const minP = Math.min(...prices);
        const maxP = Math.max(...prices);
        const diff = maxP - minP;
        minPrice = (minP - diff * 0.1).toFixed(maxP < 1 ? 6 : 2);
        maxPrice = (maxP + diff * 0.1).toFixed(maxP < 1 ? 6 : 2);
    }

    // Handle overlay click to close
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
                        <p className="text-sm text-gray-400 mt-1">
                            Почасовой прогноз (Время МСК)
                        </p>
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
                        <div className="h-full w-full min-h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
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
                                        tickFormatter={(value, index) => {
                                            // Show every 3rd label to avoid clutter
                                            return index % 3 === 0 ? value : '';
                                        }}
                                    />

                                    <YAxis
                                        domain={[minPrice, maxPrice]}
                                        hide={false}
                                        stroke="#4B5563"
                                        fontSize={12}
                                        width={80}
                                        tickFormatter={(value) => `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: coin.currentPrice && coin.currentPrice < 1 ? 4 : 2, maximumFractionDigits: coin.currentPrice && coin.currentPrice < 1 ? 4 : 2 })}`}
                                    />

                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#111827',
                                            borderColor: '#374151',
                                            borderRadius: '12px',
                                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                                        }}
                                        labelStyle={{ color: '#9CA3AF', marginBottom: '8px', fontWeight: 'bold' }}
                                        formatter={(value: any, name: any, props: any) => {
                                            if (name === 'price') return [`$${value < 1 ? Number(value).toFixed(6) : Number(value).toLocaleString()}`, 'Цена'];
                                            if (name === 'change') return [`${value > 0 ? '+' : ''}${Number(value).toFixed(2)}%`, 'Изменение'];
                                            if (name === 'confidence') return [`${value}%`, 'Уверенность AI'];
                                            return [value, name];
                                        }}
                                        labelFormatter={(label) => `Время (МСК): ${label}`}
                                    />

                                    {/* Subtle Grid */}
                                    <div className="chart-grid"></div>

                                    <Area
                                        type="monotone"
                                        dataKey="price"
                                        stroke={chartColor}
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill={`url(#colorPriceModal)`}
                                    />

                                    {/* Invisible lines just for tooltip data */}
                                    <Area type="monotone" dataKey="change" stroke="none" fill="none" />
                                    <Area type="monotone" dataKey="confidence" stroke="none" fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
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
