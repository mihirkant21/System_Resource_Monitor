import React from 'react';
import { HardDrive, ArrowDownCircle, ArrowUpCircle, Disc, Database, Activity } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import MultiLineChart from '../charts/MultiLineChart';
import { useMetrics } from '../context/MetricsContext';
import { formatBytes, formatSpeed } from '../utils/formatters';

export default function DiskPage() {
  const { latestMetrics, recentHistory } = useMetrics();
  const disk = latestMetrics?.disk;
  const partitions = disk?.partitions || [];
  const io = disk?.io;
  const cumulative = io?.cumulative;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text tracking-tight">
          Disk Storage & I/O Subsystem
        </h2>
        <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
          Filesystem partition usage, non-volatile block device throughput, and cumulative I/O operations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Aggregated Storage"
          value={`${disk?.aggregated?.percent ?? 0}%`}
          subvalue={`${formatBytes(disk?.aggregated?.used_bytes)} used of ${formatBytes(disk?.aggregated?.total_bytes)}`}
          icon={HardDrive}
          color="emerald"
          progress={disk?.aggregated?.percent}
        />

        <MetricCard
          title="Read Throughput"
          value={formatSpeed(io?.read_bytes_per_sec)}
          subvalue={`${io?.read_ops_per_sec ?? 0} IOPS`}
          icon={ArrowDownCircle}
          color="sky"
        />

        <MetricCard
          title="Write Throughput"
          value={formatSpeed(io?.write_bytes_per_sec)}
          subvalue={`${io?.write_ops_per_sec ?? 0} IOPS`}
          icon={ArrowUpCircle}
          color="indigo"
        />

        <MetricCard
          title="Cumulative I/O"
          value={formatBytes((cumulative?.read_bytes || 0) + (cumulative?.write_bytes || 0))}
          subvalue={`Read: ${formatBytes(cumulative?.read_bytes)} • Written: ${formatBytes(cumulative?.write_bytes)}`}
          icon={Database}
          color="amber"
        />
      </div>

      {/* Live Disk I/O Chart */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>Instantaneous Disk I/O Throughput (MB/s)</span>
          </h3>
          <div className="flex items-center space-x-4 text-xs font-mono">
            <span className="text-emerald-500">Read: {io?.read_mb_per_sec ?? 0} MB/s</span>
            <span className="text-sky-500">Write: {io?.write_mb_per_sec ?? 0} MB/s</span>
          </div>
        </div>

        <MultiLineChart
          data={recentHistory}
          series={[
            { key: 'diskReadMB', name: 'Read Throughput', color: '#10b981' },
            { key: 'diskWriteMB', name: 'Write Throughput', color: '#0ea5e9' }
          ]}
          unit="MB/s"
          height={240}
        />
      </div>

      {/* Partition Storage Table */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
            <Disc className="w-4 h-4 text-sky-500" />
            <span>Mounted Filesystem Partitions</span>
          </h3>
          <span className="text-xs text-slate-400 dark:text-dark-muted font-mono">
            {partitions.length} Available Partitions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-dark-card/50 text-[11px] uppercase tracking-wider text-slate-500 dark:text-dark-muted border-y border-slate-200 dark:border-dark-border">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Device</th>
                <th className="py-2.5 px-4 font-semibold">Mount Point</th>
                <th className="py-2.5 px-4 font-semibold">Type</th>
                <th className="py-2.5 px-4 font-semibold">Capacity</th>
                <th className="py-2.5 px-4 font-semibold">Used</th>
                <th className="py-2.5 px-4 font-semibold">Free</th>
                <th className="py-2.5 px-4 font-semibold w-48">Usage %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-mono text-xs">
              {partitions.map((part, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-dark-card/30 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-dark-text">
                    {part.device}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-dark-muted">
                    {part.mountpoint}
                  </td>
                  <td className="py-3 px-4 uppercase text-slate-500">
                    {part.fstype || 'NTFS'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-dark-text">
                    {formatBytes(part.total_bytes)}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-dark-text font-bold">
                    {formatBytes(part.used_bytes)}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {formatBytes(part.free_bytes)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2 font-mono">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            part.percent >= 90 ? 'bg-rose-500' : part.percent >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${part.percent}%` }}
                        />
                      </div>
                      <span className="w-10 text-right">{part.percent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

