import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function AlertBanner({ alerts = [], onResolve }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.map(alert => {
        const isCritical = alert.severity === 'CRITICAL';
        return (
          <div
            key={alert.id}
            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
              isCritical
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}
          >
            <div className="flex items-center space-x-3">
              {isCritical ? (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              )}
              <div className="text-sm font-medium">
                <span className="font-bold uppercase tracking-wider text-xs mr-2 px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                  {alert.metric_name}
                </span>
                {alert.message}
              </div>
            </div>

            {onResolve && (
              <button
                onClick={() => onResolve(alert.id)}
                className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 dark:bg-black/20 dark:hover:bg-black/30 transition-colors"
                title="Acknowledge & Resolve Alert"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Dismiss</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

