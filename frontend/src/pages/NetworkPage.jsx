import React from 'react';
import { Network, ArrowDown, ArrowUp, Wifi, ShieldAlert, Activity, Globe } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import MultiLineChart from '../charts/MultiLineChart';
import { useMetrics } from '../context/MetricsContext';
import { formatBytes, formatSpeed } from '../utils/formatters';

export default function NetworkPage() {
  const { latestMetrics, recentHistory } = useMetrics();
  const net = latestMetrics?.network;
  const agg = net?.aggregated;
  const interfaces = net?.interfaces || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text tracking-tight">
          Network Interfaces & Bandwidth Telemetry
        </h2>
        <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
          Socket stream throughput, physical/virtual adapters, packet drop rates, and packet error diagnostics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Download Speed"
          value={formatSpeed(agg?.download_bytes_per_sec)}
          subvalue={`Recv: ${formatBytes(agg?.total_bytes_recv)}`}
          icon={ArrowDown}
          color="amber"
        />

        <MetricCard
          title="Upload Speed"
          value={formatSpeed(agg?.upload_bytes_per_sec)}
          subvalue={`Sent: ${formatBytes(agg?.total_bytes_sent)}`}
          icon={ArrowUp}
          color="indigo"
        />

        <MetricCard
          title="Total Packets"
          value={((agg?.packets_recv || 0) + (agg?.packets_sent || 0)).toLocaleString()}
          subvalue={`In: ${agg?.packets_recv?.toLocaleString() ?? 0} • Out: ${agg?.packets_sent?.toLocaleString() ?? 0}`}
          icon={Globe}
          color="sky"
        />

        <MetricCard
          title="Errors & Drops"
          value={`${(agg?.errin || 0) + (agg?.errout || 0)} Errs`}
          subvalue={`${(agg?.dropin || 0) + (agg?.dropout || 0)} Packets Dropped`}
          icon={ShieldAlert}
          color="emerald"
        />
      </div>

      {/* Live Bandwidth Chart */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
            <Activity className="w-4 h-4 text-amber-500" />
            <span>Instantaneous Network Transfer Rate (MB/s)</span>
          </h3>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="text-amber-500">▼ Down: {agg?.download_mb_per_sec ?? 0} MB/s</span>
            <span className="text-purple-500">▲ Up: {agg?.upload_mb_per_sec ?? 0} MB/s</span>
          </div>
        </div>

        <MultiLineChart
          data={recentHistory}
          series={[
            { key: 'netDownMB', name: 'Download Speed', color: '#f59e0b' },
            { key: 'netUpMB', name: 'Upload Speed', color: '#a855f7' }
          ]}
          unit="MB/s"
          height={240}
        />
      </div>

      {/* Network Interface Adapters Grid */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-sky-500" />
            <span>Active Network Adapters & Interfaces</span>
          </h3>
          <span className="text-xs text-slate-400 dark:text-dark-muted font-mono">
            {interfaces.length} Detected Interfaces
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interfaces.map((iface, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-50 dark:bg-dark-card/50 rounded-xl border border-slate-200 dark:border-dark-border space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-dark-text truncate">
                  {iface.interface}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    iface.is_up
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {iface.is_up ? 'Connected' : 'Offline'}
                </span>
              </div>

              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-500 dark:text-dark-muted">
                  <span>IPv4 Address:</span>
                  <span className="text-slate-800 dark:text-dark-text font-semibold">
                    {iface.ip_address || 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-dark-muted">
                  <span>MAC Address:</span>
                  <span className="text-slate-800 dark:text-dark-text">
                    {iface.mac_address || 'N/A'}
                  </span>
                </div>
                {iface.speed_mbps > 0 && (
                  <div className="flex justify-between text-slate-500 dark:text-dark-muted">
                    <span>Link Speed:</span>
                    <span className="text-slate-800 dark:text-dark-text font-semibold">
                      {iface.speed_mbps} Mbps
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-dark-border/60 flex justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Current Download</span>
                  <span className="font-bold text-amber-500">
                    {formatSpeed(iface.download_bytes_per_sec)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Current Upload</span>
                  <span className="font-bold text-purple-500">
                    {formatSpeed(iface.upload_bytes_per_sec)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

