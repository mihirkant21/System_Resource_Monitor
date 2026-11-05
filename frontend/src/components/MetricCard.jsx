import React from 'react';

export default function MetricCard({
  title,
  value,
  subvalue,
  icon: Icon,
  trend,
  color = 'sky', // sky, emerald, amber, rose, indigo
  progress,
}) {
  const colorMap = {
    sky: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  };

  const progressBgMap = {
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-dark-muted">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${colorMap[color] || colorMap.sky}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-dark-text tracking-tight font-mono">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-slate-500 dark:text-dark-muted">
            {trend}
          </span>
        )}
      </div>

      {subvalue && (
        <p className="mt-1 text-xs text-slate-500 dark:text-dark-muted truncate">
          {subvalue}
        </p>
      )}

      {progress !== undefined && (
        <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressBgMap[color] || progressBgMap.sky}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

