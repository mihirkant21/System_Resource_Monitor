import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function HistoricalChart({
  data = [],
  series = [
    { key: 'cpu_percent', name: 'CPU (%)', color: '#0ea5e9' },
    { key: 'ram_percent', name: 'RAM (%)', color: '#8b5cf6' }
  ],
  height = 320,
  unit = '%'
}) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-sm text-slate-400 dark:text-dark-muted border border-dashed border-slate-200 dark:border-dark-border rounded-xl p-8"
        style={{ height }}
      >
        <p className="font-medium">No historical metrics logged for this timeframe.</p>
        <p className="text-xs text-slate-400 mt-1">Data will accumulate as the background collector records samples.</p>
      </div>
    );
  }

  // Format timestamp for display
  const formattedData = data.map(item => {
    const d = new Date(item.timestamp);
    return {
      ...item,
      displayTime: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      fullDate: d.toLocaleString(),
    };
  });

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
          <XAxis
            dataKey="displayTime"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            unit={unit ? ` ${unit}` : ''}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#374151',
              borderRadius: '0.75rem',
              color: '#F9FAFB',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
            labelFormatter={(_, arr) => arr[0]?.payload?.fullDate || ''}
            formatter={(val, name) => [`${val} ${unit}`, name]}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            iconType="circle"
          />
          {series.map(s => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

