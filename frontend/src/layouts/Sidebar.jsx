import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Layers,
  HardDrive,
  Network,
  ListFilter,
  LineChart,
  Settings,
  Activity
} from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'cpu', label: 'CPU', icon: Cpu },
  { id: 'memory', label: 'Memory', icon: Layers },
  { id: 'disk', label: 'Disk', icon: HardDrive },
  { id: 'network', label: 'Network', icon: Network },
  { id: 'processes', label: 'Processes', icon: ListFilter },
  { id: 'analytics', label: 'Historical Analytics', icon: LineChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border flex flex-col flex-shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-dark-border space-x-3">
        <div className="p-2 bg-sky-500 rounded-xl text-white shadow-md shadow-sky-500/20">
          <Activity className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-slate-800 dark:text-dark-text leading-tight">
            OS Monitor
          </h1>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-sky-500">
            Real-Time Engine
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30 font-semibold'
                  : 'text-slate-600 dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-card hover:text-slate-900 dark:hover:text-dark-text'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-dark-border text-[11px] text-slate-400 dark:text-dark-muted">
        <p className="font-medium text-slate-600 dark:text-slate-300">OS Systems Project</p>
        <p className="text-[10px] mt-0.5">psutil + FastAPI + React</p>
      </div>
    </aside>
  );
}

