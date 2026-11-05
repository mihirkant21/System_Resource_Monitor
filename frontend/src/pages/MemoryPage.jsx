import React from 'react';
import { Layers, HardDrive, RefreshCw, Database } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import GaugeCircle from '../components/GaugeCircle';
import RealTimeAreaChart from '../charts/RealTimeAreaChart';
import { useMetrics } from '../context/MetricsContext';
import { formatBytes, formatPercent } from '../utils/formatters';

export default function MemoryPage() {
  const { latestMetrics, recentHistory } = useMetrics();
  const vmem = latestMetrics?.memory?.virtual_memory;
  const swap = latestMetrics?.memory?.swap_memory;

  const ramPercent = vmem?.percent || 0;
  const swapPercent = swap?.percent || 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text tracking-tight">
          Memory & Paging Telemetry
        </h2>
        <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
          Physical volatile RAM allocation, virtual memory paging, buffers, and swap partition saturation.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Physical RAM Used"
          value={formatBytes(vmem?.used_bytes)}
          subvalue={`${formatBytes(vmem?.total_bytes)} Total Capacity`}
          icon={Layers}
          color="indigo"
          progress={ramPercent}
        />

        <MetricCard
          title="Available Memory"
          value={formatBytes(vmem?.available_bytes)}
          subvalue={`Free: ${formatBytes(vmem?.free_bytes)}`}
          icon={RefreshCw}
          color="emerald"
        />

        <MetricCard
          title="Swap Memory Used"
          value={formatBytes(swap?.used_bytes)}
          subvalue={`${formatBytes(swap?.total_bytes)} Total Pagefile`}
          icon={Database}
          color="amber"
          progress={swapPercent}
        />

        <MetricCard
          title="Swap Utilization"
          value={formatPercent(swapPercent)}
          subvalue={`Free Swap: ${formatBytes(swap?.free_bytes)}`}
          icon={HardDrive}
          color="rose"
        />
      </div>

      {/* Gauges & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Dual Gauges for RAM and Swap */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text">
            Memory Capacity Ratios
          </h3>

          <div className="grid grid-cols-2 gap-4 py-2">
            <GaugeCircle
              percent={ramPercent}
              size={130}
              strokeWidth={10}
              label="RAM"
            />
            <GaugeCircle
              percent={swapPercent}
              size={130}
              strokeWidth={10}
              label="Swap"
            />
          </div>

          {/* Allocation Breakdown Bar */}
          <div className="pt-4 border-t border-slate-100 dark:border-dark-border space-y-3">
            <span className="text-xs font-semibold uppercase text-slate-400">
              RAM Distribution Breakdown
            </span>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden flex">
              <div
                className="bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${ramPercent}%` }}
                title={`Used: ${ramPercent}%`}
              />
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{ width: `${100 - ramPercent}%` }}
                title={`Available: ${(100 - ramPercent).toFixed(1)}%`}
              />
            </div>

            <div className="flex justify-between text-xs text-slate-500 dark:text-dark-muted font-mono">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                <span>Used ({formatBytes(vmem?.used_bytes)})</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>Available ({formatBytes(vmem?.available_bytes)})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Memory Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Real-Time Memory Utilization Trend</span>
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-500">
              {ramPercent}%
            </span>
          </div>

          <RealTimeAreaChart
            data={recentHistory}
            dataKey="ram"
            color="#6366f1"
            gradientId="gradMemPage"
            unit="%"
            height={280}
          />
        </div>
      </div>

      {/* Advanced Memory Details / Buffers & Caches Table */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text mb-4">
          Detailed Memory Subsystem Counters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-dark-card/50 rounded-xl border border-slate-200 dark:border-dark-border">
            <span className="text-xs text-slate-400 uppercase font-semibold">Cached Memory</span>
            <p className="text-lg font-mono font-bold text-slate-800 dark:text-dark-text mt-1">
              {vmem?.cached_bytes ? formatBytes(vmem.cached_bytes) : 'Not Reported by OS'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">OS filesystem read cache held in RAM.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-dark-card/50 rounded-xl border border-slate-200 dark:border-dark-border">
            <span className="text-xs text-slate-400 uppercase font-semibold">Buffered Memory</span>
            <p className="text-lg font-mono font-bold text-slate-800 dark:text-dark-text mt-1">
              {vmem?.buffers_bytes ? formatBytes(vmem.buffers_bytes) : 'Not Reported by OS'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Temporary block I/O buffers in kernel space.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-dark-card/50 rounded-xl border border-slate-200 dark:border-dark-border">
            <span className="text-xs text-slate-400 uppercase font-semibold">Shared Memory</span>
            <p className="text-lg font-mono font-bold text-slate-800 dark:text-dark-text mt-1">
              {vmem?.shared_bytes ? formatBytes(vmem.shared_bytes) : 'Not Reported by OS'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Inter-process communication (IPC) memory.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

