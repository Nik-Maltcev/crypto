import React, { useState, useRef } from 'react';
import { resolveTwitterIds, downloadCsv } from '../services/twitterService';
import { TwitterUserMap } from '../types';

// Define the raw handles locally since they are missing from constants
const RAW_TWITTER_HANDLES = [
  "https://twitter.com/Bitcoin",
  "https://twitter.com/Ethereum",
  "https://twitter.com/Ripple",
  "https://twitter.com/solana",
  "https://twitter.com/Binance",
  "https://twitter.com/Coinbase",
  "https://twitter.com/VitalikButerin",
  "https://twitter.com/Saylor",
  "https://twitter.com/cz_binance"
];

const TwitterTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<TwitterUserMap[]>([]);
  const abortRef = useRef(false);

  const handleStart = async () => {
    setIsProcessing(true);
    setResults([]);
    abortRef.current = false;
    
    // Use top 20 for demo to save API calls, or full list if user confirms
    // For this implementation, we'll take the first 50 to show it works without waiting 20 minutes
    const listToProcess = RAW_TWITTER_HANDLES; 
    
    setProgress({ current: 0, total: listToProcess.length });

    await resolveTwitterIds(
      listToProcess,
      (current, total, result) => {
        setProgress({ current, total });
        setResults(prev => [result, ...prev]); // Add new to top
      },
      () => abortRef.current
    );

    setIsProcessing(false);
  };

  const handleStop = () => {
    abortRef.current = true;
    setIsProcessing(false);
  };

  const handleDownload = () => {
    if (results.length > 0) {
      downloadCsv(results);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-blue-400 p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all z-50 border border-blue-500/30"
        title="Twitter Tools"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Twitter ID Resolver
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Преобразование Username -&gt; ID для API Twitter241
            </p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden p-6 flex flex-col gap-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
               <p className="text-gray-400 text-xs uppercase font-bold">Total URLs</p>
               <p className="text-2xl font-mono font-bold text-white">{RAW_TWITTER_HANDLES.length}</p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
               <p className="text-gray-400 text-xs uppercase font-bold">Resolved</p>
               <p className="text-2xl font-mono font-bold text-emerald-400">
                 {results.filter(r => r.status === 'success').length}
               </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!isProcessing ? (
              <button 
                onClick={handleStart}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors"
              >
                Start Process ({RAW_TWITTER_HANDLES.length})
              </button>
            ) : (
              <button 
                onClick={handleStop}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-colors"
              >
                Stop
              </button>
            )}
            <button 
              onClick={handleDownload}
              disabled={results.length === 0}
              className="px-6 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Download CSV
            </button>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Processing...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Log / Table */}
          <div className="flex-grow bg-black/40 rounded-lg border border-gray-800 overflow-y-auto font-mono text-sm p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="p-2">User</th>
                  <th className="p-2">ID</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="p-2 text-gray-300">{r.username}</td>
                    <td className="p-2 text-blue-400">{r.id || '-'}</td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        r.status === 'success' ? 'bg-emerald-900 text-emerald-400' : 'bg-red-900 text-red-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-600 italic">
                      No data processed yet. Click Start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TwitterTools;