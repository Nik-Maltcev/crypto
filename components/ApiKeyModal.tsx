import React, { useState } from 'react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
  isOpen: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave, isOpen }) => {
  const [inputKey, setInputKey] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-brand-card border border-gray-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-2">Enter Gemini API Key</h2>
        <p className="text-gray-400 text-sm mb-4">
          To analyze Reddit data, we need a Google Gemini API Key. 
          Your key is stored only in your browser's memory.
        </p>
        
        <input
          type="password"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="AIzaSy..."
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-accent mb-4 font-mono text-sm"
        />

        <div className="flex justify-end space-x-3">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noreferrer"
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Get Key
          </a>
          <button
            onClick={() => {
              if (inputKey.trim()) onSave(inputKey.trim());
            }}
            className="px-6 py-2 bg-brand-accent hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
          >
            Start Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
