import React, { useState, useEffect } from 'react';
import { PolymarketPrediction } from '../types';

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
);

const PolymarketDashboard: React.FC = () => {
    const [predictions, setPredictions] = useState<PolymarketPrediction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isTriggering, setIsTriggering] = useState(false);

    const fetchPredictions = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Depending on how Vite proxies, standard fetch:
            const response = await fetch('/api/polymarket/predictions');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.success && data.items) {
                setPredictions(data.items);
            } else {
                setError('Не удалось загрузить данные Polymarket.');
            }
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPredictions();
    }, []);

    const forcePredict = async () => {
        setIsTriggering(true);
        try {
            await fetch('/api/polymarket/force_predict', { method: 'POST' });
            // Wait a few seconds for Claude to finish
            setTimeout(fetchPredictions, 30000);
            alert("Запущена генерация новых прогнозов. Они появятся здесь через ~30 секунд.");
        } catch (e: any) {
            alert("Ошибка при запуске: " + e.message);
        } finally {
            setIsTriggering(false);
        }
    };

    const forceUpdate = async () => {
        setIsTriggering(true);
        try {
            const resp = await fetch('/api/polymarket/force_update', { method: 'POST' });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            setTimeout(fetchPredictions, 5000);
            alert("Цены обновляются в фоне. Обновите страницу через 5 секунд.");
        } catch (e: any) {
            alert("Ошибка обновления цен: " + e.message);
        } finally {
            setIsTriggering(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Обзор Polymarket</h2>
                    <p className="text-gray-400 text-sm">Актуальные прогнозы (8:00 МСК) и результаты.</p>
                </div>
                <div className="flex space-x-2 mt-4 sm:mt-0">
                    <button
                        onClick={forcePredict}
                        disabled={isTriggering}
                        className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        Запустить AI прогноз
                    </button>
                    <button
                        onClick={forceUpdate}
                        disabled={isTriggering}
                        className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        Обновить цены
                    </button>
                    <button
                        onClick={fetchPredictions}
                        disabled={isLoading}
                        className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition disabled:opacity-50"
                    >
                        <RefreshIcon />
                    </button>
                </div>
            </div>

            {isLoading && !predictions.length ? (
                <div className="flex justify-center items-center py-20 text-gray-500">
                    Загрузка...
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl">
                    {error}
                </div>
            ) : !predictions.length ? (
                <div className="text-center p-10 bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-gray-500">
                    Нет активных или прошлых прогнозов. Нажмите "Запустить AI прогноз".
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {predictions.map(pred => {
                        const isResolved = pred.status === 'resolved';
                        const won = pred.worked_out === true;
                        const lost = pred.worked_out === false;
                        const pending = pred.worked_out === null;

                        const dateStr = new Date(pred.created_at).toLocaleString('ru-RU', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        });

                        return (
                            <div key={pred.id} className="bg-brand-card border border-gray-800 rounded-xl p-5 relative overflow-hidden flex flex-col hover:border-indigo-500/50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xs text-gray-500 font-mono">{dateStr}</span>
                                    {isResolved ? (
                                        won ? (
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">WIN ✅</span>
                                        ) : lost ? (
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400">LOSS ❌</span>
                                        ) : (
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">RESOLVED</span>
                                        )
                                    ) : (
                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">В ИГРЕ ⏳</span>
                                    )}
                                </div>
                                
                                <h3 className="text-sm font-semibold text-white mb-4 line-clamp-3" title={pred.question}>
                                    {pred.question}
                                </h3>

                                <div className="mt-auto space-y-3">
                                    <div className="flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Прогноз ИИ</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${pred.predicted_outcome === 'Yes' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {pred.predicted_outcome}
                                                </span>
                                                <span className="text-xs text-gray-400">({pred.confidence}%)</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Ставка</p>
                                            <p className="text-sm font-mono text-white">${pred.bet_amount}</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Current Yes: <span className="text-white">${pred.current_yes_price?.toFixed(3) || '0.00'}</span></span>
                                        <span>Current No: <span className="text-white">${pred.current_no_price?.toFixed(3) || '0.00'}</span></span>
                                    </div>

                                    {/* Hourly Hits History */}
                                    {pred.price_history && (
                                        <div className="pt-3 border-t border-gray-800/50">
                                            <p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-wider text-center">Прогноз vs Рынок (за 24ч)</p>
                                            <div className="flex gap-1 justify-center">
                                                {(() => {
                                                    try {
                                                        const history = JSON.parse(pred.price_history) as any[];
                                                        // Show last 12 points
                                                        return history.slice(-12).map((p, i) => (
                                                            <div 
                                                                key={i} 
                                                                title={`${new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}: ${p.matched ? 'СОВПАЛО' : 'НЕ СОВПАЛО'}`}
                                                                className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 transition-opacity ${
                                                                    p.matched === true ? 'bg-emerald-500' : 
                                                                    p.matched === false ? 'bg-red-500' : 
                                                                    'bg-gray-700'
                                                                }`}
                                                            />
                                                        ));
                                                    } catch (e) { return null; }
                                                })()}
                                            </div>
                                            <div className="flex justify-center gap-4 mt-2 text-[8px] text-gray-600 uppercase font-bold">
                                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-px"></span> Совпало</span>
                                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-px"></span> Мимо</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PolymarketDashboard;
