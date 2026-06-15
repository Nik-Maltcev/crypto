import React, { useState, useEffect } from 'react';

const AVAILABLE_SYMBOLS = [
    { symbol: 'BTCUSDT', label: 'BTC' },
    { symbol: 'ETHUSDT', label: 'ETH' },
    { symbol: 'BNBUSDT', label: 'BNB' },
    { symbol: 'SOLUSDT', label: 'SOL' },
    { symbol: 'XRPUSDT', label: 'XRP' },
    { symbol: 'DOGEUSDT', label: 'DOGE' },
];

interface Candle {
    time: number; // unix ms
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
}

interface TimeSlot {
    hour: number;
    minute: number;
    label: string;
    avgChange: number;
    upCount: number;
    downCount: number;
    total: number;
    winrate: number; // % times it went UP
}

const BitcoinPatterns: React.FC = () => {
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [days, setDays] = useState(7);
    const [error, setError] = useState('');
    const [bestUp, setBestUp] = useState<TimeSlot | null>(null);
    const [bestDown, setBestDown] = useState<TimeSlot | null>(null);
    const [timezone, setTimezone] = useState<'msk' | 'et'>('msk');
    const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');

    // MSK = UTC+3, ET summer (EDT) = UTC-4, ET winter (EST) = UTC-5
    // Currently June = summer = EDT = UTC-4
    const tzOffset = timezone === 'msk' ? 3 : -4; // hours from UTC
    const tzLabel = timezone === 'msk' ? 'МСК' : 'ET';

    const formatTime = (utcHour: number, utcMin: number): string => {
        let h = (utcHour + tzOffset + 24) % 24;
        return `${h.toString().padStart(2, '0')}:${utcMin.toString().padStart(2, '0')}`;
    };

    const fetchAndAnalyze = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Fetch 5m candles from Binance (free, no key)
            const endTime = Date.now();
            const startTime = endTime - (days * 24 * 60 * 60 * 1000);
            const allCandles: Candle[] = [];
            let cursor = startTime;

            while (cursor < endTime) {
                const url = `https://api.binance.com/api/v3/klines?symbol=${activeSymbol}&interval=5m&startTime=${cursor}&limit=1000`;
                const resp = await fetch(url);
                if (!resp.ok) break;
                const data = await resp.json();
                if (data.length === 0) break;

                data.forEach((c: any) => {
                    allCandles.push({
                        time: c[0],
                        open: parseFloat(c[1]),
                        high: parseFloat(c[2]),
                        low: parseFloat(c[3]),
                        close: parseFloat(c[4]),
                        volume: parseFloat(c[5]),
                    });
                });

                cursor = data[data.length - 1][6] + 1;
                await new Promise(r => setTimeout(r, 100));
            }

            // Group by time-of-day (5min slots in UTC)
            const slotMap = new Map<string, { changes: number[] }>();

            allCandles.forEach(candle => {
                const date = new Date(candle.time);
                const h = date.getUTCHours();
                const m = Math.floor(date.getUTCMinutes() / 5) * 5;
                const key = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

                const change = ((candle.close - candle.open) / candle.open) * 100;
                if (!slotMap.has(key)) slotMap.set(key, { changes: [] });
                slotMap.get(key)!.changes.push(change);
            });

            // Convert to sorted array
            const results: TimeSlot[] = [];
            slotMap.forEach((data, key) => {
                const [hStr, mStr] = key.split(':');
                const h = parseInt(hStr);
                const m = parseInt(mStr);
                const changes = data.changes;
                const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
                const upCount = changes.filter(c => c > 0).length;
                const downCount = changes.filter(c => c < 0).length;

                // MSK label (stored for backward compat, but we use formatTime for display)
                const mskH = (h + 3) % 24;
                const mskLabel = `${mskH.toString().padStart(2, '0')}:${mStr}`;

                results.push({
                    hour: h,
                    minute: m,
                    label: mskLabel,
                    avgChange: avg,
                    upCount,
                    downCount,
                    total: changes.length,
                    winrate: Math.round((upCount / changes.length) * 100),
                });
            });

            results.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
            setSlots(results);

            // Best slots
            const sorted = [...results].sort((a, b) => b.winrate - a.winrate);
            setBestUp(sorted[0] || null);
            setBestDown(sorted[sorted.length - 1] || null);

        } catch (e: any) {
            setError(e.message || 'Failed to fetch');
        }
        setIsLoading(false);
    };

    useEffect(() => { fetchAndAnalyze(); }, [days, activeSymbol]);

    if (isLoading) return <div className="flex justify-center py-20 text-gray-500">Загрузка BTC свечей с Binance...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{AVAILABLE_SYMBOLS.find(s => s.symbol === activeSymbol)?.label} 5-минутные паттерны</h2>
                    <p className="text-gray-400 text-sm">Когда {AVAILABLE_SYMBOLS.find(s => s.symbol === activeSymbol)?.label} чаще растёт/падает за последние {days} дней (Binance, {tzLabel})</p>
                </div>
                <div className="flex flex-col items-end gap-2 mt-4 sm:mt-0">
                    <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700/50 rounded-lg p-0.5">
                        {AVAILABLE_SYMBOLS.map(s => (
                            <button key={s.symbol} onClick={() => setActiveSymbol(s.symbol)}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${activeSymbol === s.symbol ? 'bg-orange-600/30 text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-800/50 border border-gray-700/50 rounded-lg p-0.5 mr-2">
                            <button onClick={() => setTimezone('msk')}
                                className={`px-2 py-1 rounded text-xs font-semibold transition ${timezone === 'msk' ? 'bg-indigo-600/30 text-indigo-400' : 'text-gray-500'}`}>
                                МСК
                            </button>
                            <button onClick={() => setTimezone('et')}
                                className={`px-2 py-1 rounded text-xs font-semibold transition ${timezone === 'et' ? 'bg-indigo-600/30 text-indigo-400' : 'text-gray-500'}`}>
                                ET
                            </button>
                        </div>
                        {[7, 14, 30, 90, 180, 365].map(d => (
                        <button key={d} onClick={() => setDays(d)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${days === d ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'bg-gray-800/50 text-gray-400 border border-gray-700'}`}>
                            {d}д
                        </button>
                    ))}
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

            {/* Best/worst highlights */}
            {bestUp && bestDown && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-brand-card border border-emerald-800/30 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 uppercase mb-1">Чаще растёт</div>
                        <div className="text-2xl font-bold text-emerald-400">{formatTime(bestUp.hour, bestUp.minute)} {tzLabel}</div>
                        <div className="text-sm text-gray-400">UP {bestUp.winrate}% ({bestUp.upCount}/{bestUp.total})</div>
                        <div className="text-xs text-gray-500">avg {bestUp.avgChange >= 0 ? '+' : ''}{bestUp.avgChange.toFixed(3)}%</div>
                    </div>
                    <div className="bg-brand-card border border-red-800/30 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 uppercase mb-1">Чаще падает</div>
                        <div className="text-2xl font-bold text-red-400">{formatTime(bestDown.hour, bestDown.minute)} {tzLabel}</div>
                        <div className="text-sm text-gray-400">DOWN {100 - bestDown.winrate}% ({bestDown.downCount}/{bestDown.total})</div>
                        <div className="text-xs text-gray-500">avg {bestDown.avgChange >= 0 ? '+' : ''}{bestDown.avgChange.toFixed(3)}%</div>
                    </div>
                </div>
            )}

            {/* Heatmap table */}
            <div className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800">
                    <span className="text-sm font-bold text-gray-400">Все 5-минутные слоты ({tzLabel}) — {slots.length} интервалов</span>
                </div>
                <div className="p-4 overflow-x-auto">
                    <div className="grid grid-cols-12 gap-1" style={{ minWidth: '900px' }}>
                        {slots.map(slot => {
                            const intensity = Math.min(Math.abs(slot.winrate - 50) / 20, 1);
                            const isUp = slot.winrate > 55;
                            const isDown = slot.winrate < 45;
                            return (
                                <div key={`${slot.hour}-${slot.minute}`}
                                    className={`rounded p-1 text-center cursor-default ${
                                        isUp ? `bg-emerald-500/${Math.round(intensity * 30 + 5)}` :
                                        isDown ? `bg-red-500/${Math.round(intensity * 30 + 5)}` :
                                        'bg-gray-800/30'
                                    }`}
                                    title={`${formatTime(slot.hour, slot.minute)} ${tzLabel} | UP ${slot.winrate}% | avg ${slot.avgChange.toFixed(3)}% | n=${slot.total}`}
                                >
                                    <div className="text-[8px] text-gray-500">{formatTime(slot.hour, slot.minute)}</div>
                                    <div className={`text-[10px] font-bold ${isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-gray-500'}`}>
                                        {slot.winrate}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Table for top patterns */}
            {/* Top UP patterns */}
            <div className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800">
                    <span className="text-sm font-bold text-emerald-400">Топ-20 — чаще растёт (UP)</span>
                </div>
                <div className="p-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-700">
                                <th className="text-left py-2">Время {tzLabel}</th>
                                <th className="text-center py-2">UP %</th>
                                <th className="text-center py-2">Avg %</th>
                                <th className="text-center py-2">UP/DOWN</th>
                                <th className="text-center py-2">Дней</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...slots].sort((a, b) => b.winrate - a.winrate).slice(0, 20).map(slot => (
                                <tr key={`up-${slot.hour}-${slot.minute}`} className="border-b border-gray-800/40">
                                    <td className="py-1.5 font-bold text-white">{formatTime(slot.hour, slot.minute)}</td>
                                    <td className="text-center py-1.5 font-mono font-bold text-emerald-400">{slot.winrate}%</td>
                                    <td className={`text-center py-1.5 font-mono ${slot.avgChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {slot.avgChange >= 0 ? '+' : ''}{slot.avgChange.toFixed(3)}%
                                    </td>
                                    <td className="text-center py-1.5 text-gray-400">{slot.upCount}/{slot.downCount}</td>
                                    <td className="text-center py-1.5 text-gray-500">{slot.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top DOWN patterns */}
            <div className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-800">
                    <span className="text-sm font-bold text-red-400">Топ-20 — чаще падает (DOWN)</span>
                </div>
                <div className="p-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-500 border-b border-gray-700">
                                <th className="text-left py-2">Время {tzLabel}</th>
                                <th className="text-center py-2">DOWN %</th>
                                <th className="text-center py-2">Avg %</th>
                                <th className="text-center py-2">UP/DOWN</th>
                                <th className="text-center py-2">Дней</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...slots].sort((a, b) => a.winrate - b.winrate).slice(0, 20).map(slot => (
                                <tr key={`down-${slot.hour}-${slot.minute}`} className="border-b border-gray-800/40">
                                    <td className="py-1.5 font-bold text-white">{formatTime(slot.hour, slot.minute)}</td>
                                    <td className="text-center py-1.5 font-mono font-bold text-red-400">{100 - slot.winrate}%</td>
                                    <td className={`text-center py-1.5 font-mono ${slot.avgChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {slot.avgChange >= 0 ? '+' : ''}{slot.avgChange.toFixed(3)}%
                                    </td>
                                    <td className="text-center py-1.5 text-gray-400">{slot.upCount}/{slot.downCount}</td>
                                    <td className="text-center py-1.5 text-gray-500">{slot.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BitcoinPatterns;
