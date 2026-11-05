import React from 'react';
import { Cpu, Layers, HardDrive, Network, Activity, ShieldCheck, Clock, Terminal } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import RealTimeAreaChart from '../charts/RealTimeAreaChart';
import MultiLineChart from '../charts/MultiLineChart';
import { useMetrics } from '../context/MetricsContext';
import { formatBytes, formatSpeed, formatFrequency } from '../utils/formatters';

export default function OverviewPage({ onInspectProcess }) {
  const { latestMetrics, recentHistory, systemInfo } = useMetrics();

  const cpu = latestMetrics?.cpu;
  const memory = latestMetrics?.memory;
  const disk = latestMetrics?.disk;
  const network = latestMetrics?.network;
  const topProcs = latestMetrics?.top_processes;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text tracking-tight">
            System Overview
          </h2>
          <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
            Real-time telemetry and sub-second hardware performance analytics.
          </p>
        </div>
        {systemInfo && (
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-muted flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span>Uptime: {systemInfo.uptime_formatted}</span>
          </div>
        )}
      </div>

      {/* 4 Primary Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Processor (CPU)"
          value={`${cpu?.overall_percent ?? 0}%`}
          subvalue={`${formatFrequency(cpu?.frequency_mhz?.current)} • ${cpu?.physical_cores ?? 0}P / ${cpu?.logical_cores ?? 0}L Cores`}
          icon={Cpu}
          color="sky"
          progress={cpu?.overall_percent}
        />

        <MetricCard
          title="Memory (RAM)"
          value={`${memory?.virtual_memory?.percent ?? 0}%`}
          subvalue={`${formatBytes(memory?.virtual_memory?.used_bytes)} used of ${formatBytes(memory?.virtual_memory?.total_bytes)}`}
          icon={Layers}
          color="indigo"
          progress={memory?.virtual_memory?.percent}
        />

        <MetricCard
          title="Disk Storage & I/O"
          value={`${disk?.aggregated?.percent ?? 0}%`}
          subvalue={`R: ${formatSpeed(disk?.io?.read_bytes_per_sec)} • W: ${formatSpeed(disk?.io?.write_bytes_per_sec)}`}
          icon={HardDrive}
          color="emerald"
          progress={disk?.aggregated?.percent}
        />

        <MetricCard
          title="Network Bandwidth"
          value={formatSpeed(network?.aggregated?.download_bytes_per_sec)}
          subvalue={`▲ ${formatSpeed(network?.aggregated?.upload_bytes_per_sec)} • Recv: ${formatBytes(network?.aggregated?.total_bytes_recv)}`}
          icon={Network}
          color="amber"
        />
      </div>

      {/* Real-Time Live Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-sky-500" />
              <span>CPU Utilization History</span>
            </h3>
            <span className="text-xs font-mono font-bold text-sky-500">
              {cpu?.overall_percent ?? 0}%
            </span>
          </div>
          <RealTimeAreaChart
            data={recentHistory}
            dataKey="cpu"
            color="#0ea5e9"
            gradientId="gradCpuOverview"
            unit="%"
            height={190}
          />
        </div>

        {/* Memory Chart */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>RAM Consumption History</span>
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-500">
              {memory?.virtual_memory?.percent ?? 0}%
            </span>
          </div>
          <RealTimeAreaChart
            data={recentHistory}
            dataKey="ram"
            color="#6366f1"
            gradientId="gradRamOverview"
            unit="%"
            height={190}
          />
        </div>

        {/* Disk I/O Chart */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <span>Disk I/O Throughput (MB/s)</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-dark-muted">
              R: {disk?.io?.read_mb_per_sec ?? 0} MB/s | W: {disk?.io?.write_mb_per_sec ?? 0} MB/s
            </span>
          </div>
          <MultiLineChart
            data={recentHistory}
            series={[
              { key: 'diskReadMB', name: 'Read Speed', color: '#10b981' },
              { key: 'diskWriteMB', name: 'Write Speed', color: '#0ea5e9' }
            ]}
            unit="MB/s"
            height={190}
          />
        </div>

        {/* Network Chart */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
              <Network className="w-4 h-4 text-amber-500" />
              <span>Network Bandwidth (MB/s)</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-dark-muted">
              ▼ {network?.aggregated?.download_mb_per_sec ?? 0} MB/s | ▲ {network?.aggregated?.upload_mb_per_sec ?? 0} MB/s
            </span>
          </div>
          <MultiLineChart
            data={recentHistory}
            series={[
              { key: 'netDownMB', name: 'Download', color: '#f59e0b' },
              { key: 'netUpMB', name: 'Upload', color: '#8b5cf6' }
            ]}
            unit="MB/s"
            height={190}
          />
        </div>
      </div>

      {/* Bottom Section: Top Resource Consuming Processes */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text">
              Top Active Processes
            </h3>
          </div>
          <span className="text-xs text-slate-400 dark:text-dark-muted font-mono">
            {systemInfo?.process_count ?? 0} Total Active Tasks
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top CPU */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-dark-muted mb-2.5">
              Top 5 by CPU Consumption
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-dark-border">
              {topProcs?.top_cpu?.map((proc) => (
                <div
                  key={`cpu_${proc.pid}`}
                  onClick={() => onInspectProcess && onInspectProcess(proc.pid)}
                  className="py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-card/50 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-xs font-mono text-slate-400 w-12 truncate">{proc.pid}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-dark-text truncate">
                      {proc.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 font-mono text-xs">
                    <span className="font-bold text-sky-500">{proc.cpu_percent}%</span>
                    <span className="text-slate-400">{formatBytes(proc.memory_bytes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Memory */}
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-500 dark:text-dark-muted mb-2.5">
              Top 5 by Memory Footprint
            </h4>
            <div className="divide-y divide-slate-100 dark:divide-dark-border">
              {topProcs?.top_memory?.map((proc) => (
                <div
                  key={`mem_${proc.pid}`}
                  onClick={() => onInspectProcess && onInspectProcess(proc.pid)}
                  className="py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-dark-card/50 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="text-xs font-mono text-slate-400 w-12 truncate">{proc.pid}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-dark-text truncate">
                      {proc.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 font-mono text-xs">
                    <span className="font-bold text-indigo-500">{formatBytes(proc.memory_bytes)}</span>
                    <span className="text-slate-400">{proc.memory_percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

