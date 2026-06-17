import React, { useState, useEffect } from 'react';

// Tracked slots (ET time = UTC-4)
const TRACKED_SLOTS: any[] = [];  // BTC slots removed

interface DayResult {
    date: string;
    open: number;
    close: number;
    high: number;
    low: number;
    change: number;
    direction: 'UP' | 'DOWN';
}

interface SlotHistory {
    label: string;
    days: DayResult[];
    upCount: number;
    downCount: number;
    winrateUp: number;
    avgChange: number;
}

const TopHours: React.FC = () => {
    const [data, setData] = useState<SlotHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState(30);
    const [prediction, setPrediction] = useState('');
    const [isPredicting, setIsPredicting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        const results: SlotHistory[] = [];

        for (const slot of TRACKED_SLOTS) {
            const days: DayResult[] = [];

            // Fetch candles for each day
            for (let d = 0; d < period; d++) {
                // Calculate the UTC timestamp for this slot on day (today - d)
                const now = new Date();
                const targetDate = new Date(now);
                targetDate.setUTCDate(targetDate.getUTCDate() - d);

                let candleUtcHour = slot.utcHour;
                let candleDate = new Date(targetDate);

                // For 21:40 ET = 01:40 UTC next day, we need to adjust
                if (slot.utcHour < slot.etHour) {
                    // This means UTC crosses midnight — the UTC time is actually for the next calendar day
                    // So if ET is June 14 21:40, UTC is June 15 01:40
                    // When we go back d days in ET, we need the corresponding UTC day
                    candleDate.setUTCDate(candleDate.getUTCDate() + 1);
                }

                candleDate.setUTCHours(candleUtcHour, slot.utcMin, 0, 0);
                const startMs = candleDate.getTime();

                // Skip future
                if (startMs > Date.now()) continue;

                try {
                    const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&startTime=${startMs}&limit=1`;
                    const resp = await fetch(url);
                    if (!resp.ok) continue;
                    const candles = await resp.json();
                    if (candles.length === 0) continue;

                    const c = candles[0];
                    const open = parseFloat(c[1]);
                    const high = parseFloat(c[2]);
                    const low = parseFloat(c[3]);
                    const close = parseFloat(c[4]);
                    const change = ((close - open) / open) * 100;

                    const dateLabel = candleDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

                    days.push({
                        date: dateLabel,
                        open, close, high, low,
                        change,
                        direction: close >= open ? 'UP' : 'DOWN',
                    });
                } catch {
                    continue;
                }

                await new Promise(r => setTimeout(r, 50));
            }

            days.reverse(); // oldest first

            const upCount = days.filter(d => d.direction === 'UP').length;
            const downCount = days.filter(d => d.direction === 'DOWN').length;
            const avgChange = days.length > 0 ? days.reduce((s, d) => s + d.change, 0) / days.length : 0;

            results.push({
                label: slot.label,
                days,
                upCount,
                downCount,
                winrateUp: days.length > 0 ? Math.round((upCount / days.length) * 100) : 0,
                avgChange,
            });
        }

        setData(results);

        // USD/JPY daily (17:00 ET → 17:00 ET next day) via Twelve Data
        try {
            const url = `https://api.twelvedata.com/time_series?symbol=USD/JPY&interval=1day&outputsize=${period}&apikey=c9618dc13fed4d90904fc63307d3a44e`;
            const resp = await fetch(url);
            if (resp.ok) {
                const json = await resp.json();
                if (json.status === 'ok' && json.values) {
                    const days: DayResult[] = json.values.map((v: any) => {
                        const open = parseFloat(v.open);
                        const close = parseFloat(v.close);
                        const change = ((close - open) / open) * 100;
                        return {
                            date: new Date(v.datetime).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                            open, close,
                            high: parseFloat(v.high),
                            low: parseFloat(v.low),
                            change,
                            direction: close >= open ? 'UP' : 'DOWN' as 'UP' | 'DOWN',
                        };
                    }).reverse();

                    const upCount = days.filter((d: DayResult) => d.direction === 'UP').length;
                    const downCount = days.filter((d: DayResult) => d.direction === 'DOWN').length;
                    const avgChange = days.length > 0 ? days.reduce((s: number, d: DayResult) => s + d.change, 0) / days.length : 0;

                    results.push({
                        label: 'USD/JPY (daily, Kalshi 10AM ET)',
                        days,
                        upCount,
                        downCount,
                        winrateUp: days.length > 0 ? Math.round((upCount / days.length) * 100) : 0,
                        avgChange,
                    });
                    setData([...results]);
                }
            }
        } catch {}

        setIsLoading(false);
    };

    useEffect(() => { fetchData(); }, [period]);

    if (isLoading) return <div className="flex justify-center py-20 text-gray-500">Загрузка исторических свечей...</div>;

    const downloadCsv = () => {
        const slot = data.find(s => s.label.includes('USD/JPY'));
        if (!slot) return;
        const headers = ['Date', 'Open', 'Close', 'Move', 'Change %', 'Direction'];
        const rows = slot.days.map(d => [
            d.date, d.open.toFixed(3), d.close.toFixed(3),
            (d.close - d.open).toFixed(3), d.change.toFixed(3), d.direction
        ].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usdjpy_${period}d_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const runPrediction = async () => {
        const slot = data.find(s => s.label.includes('USD/JPY'));
        if (!slot || slot.days.length === 0) return;

        setIsPredicting(true);
        setPrediction('');

        const last30 = slot.days.slice(-30).map(d =>
            `${d.date}: ${d.open.toFixed(3)}→${d.close.toFixed(3)} (${d.change >= 0 ? '+' : ''}${d.change.toFixed(3)}%) ${d.direction}`
        ).join('\n');

        const prompt = `You are a forex analyst. Based on the last ${slot.days.length} days of USD/JPY daily candles (forex market, 5pm ET to 5pm ET), predict whether today's candle will close UP or DOWN.

Recent ${Math.min(30, slot.days.length)} days:
${last30}

Stats: UP ${slot.winrateUp}% of days (${slot.upCount}/${slot.days.length}), avg change: ${slot.avgChange >= 0 ? '+' : ''}${slot.avgChange.toFixed(4)}%

Current price context: last close was ${slot.days[slot.days.length - 1]?.close.toFixed(3)}

Give your prediction: UP or DOWN, confidence %, and brief reasoning (2-3 sentences). Response in Russian.`;

        try {
            const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';
            const resp = await fetch(`${BACKEND_URL}/api/proxy/openrouter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 300,
                }),
            });
            if (resp.ok) {
                const json = await resp.json();
                const text = json.choices?.[0]?.message?.content || 'No response';
                setPrediction(text);
            } else {
                setPrediction(`Error: ${resp.status}`);
            }
        } catch (e: any) {
            setPrediction(`Error: ${e.message}`);
        }
        setIsPredicting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Топ часы (Polymarket)</h2>
                    <p className="text-gray-400 text-sm">История 5-минутных свечей BTC по отслеживаемым слотам</p>
                </div>
                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                    {[7, 14, 30, 60, 90, 180, 365].map(d => (
                        <button key={d} onClick={() => setPeriod(d)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${period === d ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'bg-gray-800/50 text-gray-400 border border-gray-700'}`}>
                            {d}д
                        </button>
                    ))}
                    <button onClick={downloadCsv}
                        className="px-3 py-1.5 bg-gray-800/50 text-gray-400 border border-gray-700 hover:border-gray-600 rounded-lg text-sm transition">
                        CSV
                    </button>
                    <button onClick={runPrediction} disabled={isPredicting}
                        className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                        {isPredicting ? '...' : 'AI Прогноз'}
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                {data.map(slot => (
                    <div key={slot.label} className="bg-brand-card border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 uppercase mb-1">{slot.label}</div>
                        <div className={`text-2xl font-bold ${slot.winrateUp >= 55 ? 'text-emerald-400' : slot.winrateUp <= 45 ? 'text-red-400' : 'text-gray-300'}`}>
                            UP {slot.winrateUp}%
                        </div>
                        <div className="text-sm text-gray-400">{slot.upCount}/{slot.days.length} дней</div>
                        <div className="text-xs text-gray-500">avg {slot.avgChange >= 0 ? '+' : ''}{slot.avgChange.toFixed(3)}%</div>
                    </div>
                ))}
            </div>

            {/* AI Prediction */}
            {prediction && (
                <div className="bg-brand-card border border-indigo-500/30 rounded-xl p-4">
                    <div className="text-xs text-indigo-400 font-bold uppercase mb-2">AI Прогноз (DeepSeek)</div>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{prediction}</p>
                </div>
            )}

            {/* Per-slot history tables */}
            {data.map(slot => (
                <div key={`table-${slot.label}`} className="bg-brand-card border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{slot.label}</span>
                        <span className={`text-sm font-bold ${slot.winrateUp >= 55 ? 'text-emerald-400' : slot.winrateUp <= 45 ? 'text-red-400' : 'text-gray-400'}`}>
                            UP {slot.winrateUp}% ({slot.upCount}/{slot.days.length})
                        </span>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 border-b border-gray-700">
                                    <th className="text-left py-2">Дата</th>
                                    <th className="text-center py-2">Open</th>
                                    <th className="text-center py-2">Close</th>
                                    <th className="text-center py-2">Движение</th>
                                    <th className="text-center py-2">Change %</th>
                                    <th className="text-center py-2">Result</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slot.days.map((day, i) => (
                                    <tr key={i} className="border-b border-gray-800/40">
                                        <td className="py-1.5 text-gray-300">{day.date}</td>
                                        <td className="text-center py-1.5 font-mono text-gray-400">{day.open.toFixed(3)}</td>
                                        <td className="text-center py-1.5 font-mono text-gray-400">{day.close.toFixed(3)}</td>
                                        <td className={`text-center py-1.5 font-mono font-bold ${day.close - day.open >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {day.close - day.open >= 0 ? '+' : ''}{(day.close - day.open).toFixed(3)}
                                        </td>
                                        <td className={`text-center py-1.5 font-mono ${day.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {day.change >= 0 ? '+' : ''}{day.change.toFixed(3)}%
                                        </td>
                                        <td className="text-center py-1.5">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${day.direction === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {day.direction}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TopHours;
