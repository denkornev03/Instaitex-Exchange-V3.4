
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PricePoint } from '../types';

interface PriceChartProps {
  data: PricePoint[];
  color: string;
  height?: number | string;
  detailed?: boolean;
}

const PriceChart: React.FC<PriceChartProps> = ({ data, color, height = 120, detailed = false }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: typeof height === 'number' ? height : '100%' }} className="w-full flex items-center justify-center bg-[#171a1e] rounded border border-gray-800 border-dashed text-gray-600 text-xs font-mono">
        LOADING MARKET DATA...
      </div>
    );
  }

  const prices = data.map(d => d.value);
  
  let min = Math.min(...prices);
  let max = Math.max(...prices);

  // Handle flat lines (min === max) or zero values to avoid render errors
  if (min === max) {
      if (min === 0) {
          // If price is 0 (like GAFR), set a fixed small range so the line is visible at 0
          min = -0.1;
          max = 0.1;
      } else {
          // If price is flat but not zero, add a small buffer so the line isn't stuck at the edge
          min = min * 0.99;
          max = max * 1.01;
      }
  } else {
      // Standard dynamic range with slight padding
      // detailed view has tighter bounds to show micro-movements
      const range = max - min;
      const padding = detailed ? 0.05 : 0.1;
      min = min - range * padding;
      max = max + range * padding;
  }

  const formatTime = (timeStr: string) => {
    return timeStr.split(':').slice(0, 2).join(':');
  };

  // Helper for tick formatting on Y-axis
  const formatYAxis = (val: number) => {
      if (val === 0) return "0.00";
      if (Math.abs(val) < 0.000001) return val.toExponential(2);
      // If it's the detailed view and value is small, show more decimals
      if (detailed && Math.abs(val) < 1) return val.toFixed(6);
      return val.toFixed(2);
  };

  return (
    <div className="w-full select-none" style={{ height: typeof height === 'number' ? height : '100%', minHeight: detailed ? 300 : undefined }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={detailed ? { top: 20, right: 65, left: 10, bottom: 20 } : { top: 5, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={detailed ? 0.15 : 0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          
          {detailed && (
            <CartesianGrid stroke="#2b3139" strokeDasharray="3 3" vertical={false} />
          )}

          <XAxis 
            dataKey="time" 
            hide={!detailed} 
            tickFormatter={formatTime}
            stroke="#4b5563"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={50}
          />
          
          <YAxis 
            domain={[min, max]} 
            hide={!detailed} 
            orientation="right"
            stroke="#4b5563"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
            width={65}
          />

          <Tooltip 
            isAnimationActive={false} 
            cursor={detailed ? { stroke: '#4b5563', strokeDasharray: '3 3' } : false}
            content={detailed ? undefined : <></>} 
            wrapperStyle={{ outline: 'none' }}
            contentStyle={{ 
              backgroundColor: '#1e2329', 
              borderColor: '#2b3139', 
              color: '#EAECEF', 
              fontSize: '12px',
              borderRadius: '4px',
              padding: '8px'
            }}
            itemStyle={{ color: color }}
            labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
            formatter={(value: number) => [
                Math.abs(value) < 0.000001 && value !== 0 ? value.toExponential(4) : value.toFixed(8), 
                'Price'
            ]}
          />

          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            fill={`url(#gradient-${color})`} 
            isAnimationActive={false}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
