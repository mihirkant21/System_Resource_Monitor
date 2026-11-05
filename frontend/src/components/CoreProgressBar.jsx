import React from 'react';

export default function CoreProgressBar({ coreIndex, percent = 0 }) {
  let barColor = 'bg-emerald-500';
  if (percent >= 85) barColor = 'bg-rose-500';
  else if (percent >= 70) barColor = 'bg-amber-500';

  return (
    <div className="bg-slate-50 dark:bg-dark-card/50 border border-slate-200 dark:border-dark-border/60 rounded-lg p-2.5">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-semibold text-slate-600 dark:text-dark-muted font-mono">
          Core {coreIndex}
        </span>
        <span className="font-bold text-slate-800 dark:text-dark-text font-mono">
          {percent.toFixed(1)}%
        </span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

