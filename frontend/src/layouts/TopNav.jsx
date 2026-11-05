import React from 'react';
import { Sun, Moon, Laptop, Server, Radio, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useMetrics } from '../context/MetricsContext';
import { formatTime } from '../utils/formatters';

export default function TopNav() {
  const { theme, toggleTheme } = useTheme();
  const { connectionStatus, systemInfo, latestMetrics } = useMetrics();

  const isConnected = connectionStatus === 'connected';

  return (
    <header className="h-16 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border px-6 flex items-center justify-between z-10">
      {/* System Host Information */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-700 dark:text-dark-text font-mono">
          <Server className="w-3.5 h-3.5 text-sky-500" />
          <span className="font-semibold">{systemInfo?.hostname || 'Scanning Host...'}</span>
        </div>

        {systemInfo && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-muted">
            <Laptop className="w-3.5 h-3.5 text-emerald-500" />
            <span>{systemInfo.os_name} {systemInfo.architecture}</span>
          </div>
        )}
      </div>

      {/* Right Controls: Live status, timestamp, theme toggle */}
      <div className="flex items-center space-x-4">
        {/* Live Status Badge */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="relative flex h-2.5 w-2.5">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
          </span>
          <span className="font-medium text-slate-600 dark:text-dark-muted hidden md:inline">
            {isConnected ? 'Live WebSocket Active' : 'Connecting to Engine...'}
          </span>
        </div>

        {/* Last Timestamp */}
        {latestMetrics?.timestamp && (
          <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-400 dark:text-dark-muted font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(latestMetrics.timestamp)}</span>
          </div>
        )}

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-dark-muted dark:hover:text-dark-text bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>
      </div>
    </header>
  );
}

