import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CryptoAnalysis } from '../types';

interface SentimentChartProps {
  data: CryptoAnalysis[];
}

const SentimentChart: React.FC<SentimentChartProps> = ({ data }) => {
  // Sort by sentiment score descending
  const sortedData = [...data].sort((a, b) => b.sentimentScore - a.sentimentScore).slice(0, 10);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="symbol" 
            stroke="#9ca3af" 
            tick={{fill: '#9ca3af'}} 
            axisLine={false}
          />
          <YAxis 
            stroke="#9ca3af" 
            tick={{fill: '#9ca3af'}} 
            axisLine={false} 
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{fill: 'rgba(255,255,255,0.05)'}}
            contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Bar dataKey="sentimentScore" radius={[4, 4, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.sentimentScore >= 60 ? '#10B981' : entry.sentimentScore <= 40 ? '#EF4444' : '#F59E0B'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentChart;
