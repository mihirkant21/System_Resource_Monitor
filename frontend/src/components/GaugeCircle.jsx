import React from 'react';

export default function GaugeCircle({
  percent = 0,
  size = 140,
  strokeWidth = 10,
  label = "Utilization",
  color = null // auto-calculates if null: green < 70, amber 70-85, rose > 85
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  let strokeColor = '#0ea5e9'; // default sky
  if (color) {
    strokeColor = color;
  } else {
    if (percent >= 85) strokeColor = '#f43f5e'; // rose-500
    else if (percent >= 70) strokeColor = '#f59e0b'; // amber-500
    else strokeColor = '#10b981'; // emerald-500
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          {/* Progress Indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold font-mono text-slate-800 dark:text-dark-text tracking-tight">
            {percent.toFixed(1)}%
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-dark-muted">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

