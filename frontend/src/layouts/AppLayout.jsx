import React from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import AlertBanner from '../components/AlertBanner';
import { useMetrics } from '../context/MetricsContext';

export default function AppLayout({ activeTab, onSelectTab, children }) {
  const { activeAlerts, resolveAlert } = useMetrics();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-dark-text overflow-hidden font-sans">
      <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <AlertBanner alerts={activeAlerts} onResolve={resolveAlert} />
          {children}
        </main>
      </div>
    </div>
  );
}

