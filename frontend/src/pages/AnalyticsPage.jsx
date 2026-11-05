import React, { useState, useEffect } from 'react';
import { Download, Calendar, RefreshCw, Cpu, Layers, HardDrive, Network, TrendingUp } from 'lucide-react';
import HistoricalChart from '../charts/HistoricalChart';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';
import { formatSpeed, formatDateTime } from '../utils/formatters';

const PRESETS = [
  { label: 'Last 5m', minutes: 5 },
  { label: 'Last 15m', minutes: 15 },
  { label: 'Last 30m', minutes: 30 },
  { label: 'Last 1h', minutes: 60 },
  { label: 'Last 6h', minutes: 360 },
  { label: 'Last 24h', minutes: 1440 },
];

export default function AnalyticsPage() {
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [useCustom, setUseCustom] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    let startIso = null;
    let endIso = null;

    if (useCustom && customRange.start && customRange.end) {
      startIso = new Date(customRange.start).toISOString();
      endIso = new Date(customRange.end).toISOString();
    } else {
      const now = new Date();
      const past = new Date(now.getTime() - selectedMinutes * 60 * 1000);
      startIso = past.toISOString();
      endIso = now.toISOString();
    }

    try {
      const [historyRes, summaryRes] = await Promise.all([
        api.getHistory({ start_time: startIso, end_time: endIso, limit: 1000 }),
        api.getHistorySummary({ start_time: startIso, end_time: endIso }),
      ]);
      setHistoryData(historyRes.data || []);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load historical analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMinutes, useCustom]);

  const handleExportCsv = () => {
    let startIso = null;
    let endIso = null;
    if (useCustom && customRange.start && customRange.end) {
      startIso = new Date(customRange.start).toISOString();
      endIso = new Date(customRange.end).toISOString();
    } else {
      const now = new Date();
      const past = new Date(now.getTime() - selectedMinutes * 60 * 1000);
      startIso = past.toISOString();
      endIso = now.toISOString();
    }
    const exportUrl = api.getExportCsvUrl({ start_time: startIso, end_time: endIso });
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Title & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text tracking-tight">
            Historical Performance Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
            Query long-term telemetry from SQLite database, compute statistical peaks, and export CSV logs.
          </p>
        </div>

        {/* Timeframe Presets & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-1 shadow-sm">
            {PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => {
                  setUseCustom(false);
                  setSelectedMinutes(preset.minutes);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !useCustom && selectedMinutes === preset.minutes
                    ? 'bg-sky-500 text-white font-bold shadow-sm'
                    : 'text-slate-600 dark:text-dark-muted hover:text-slate-900 dark:hover:text-dark-text'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 text-slate-600 dark:text-dark-muted hover:text-slate-800 dark:hover:text-dark-text bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-sm transition-all"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Statistical Metric Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="CPU Usage (Avg / Max)"
            value={`${summary.cpu.avg}%`}
            subvalue={`Max: ${summary.cpu.max}% • Min: ${summary.cpu.min}%`}
            icon={Cpu}
            color="sky"
            progress={summary.cpu.avg}
          />

          <MetricCard
            title="Peak CPU Timestamp"
            value={summary.cpu.peak_timestamp ? formatDateTime(summary.cpu.peak_timestamp).split(' ')[1] : 'N/A'}
            subvalue={summary.cpu.peak_timestamp ? formatDateTime(summary.cpu.peak_timestamp).split(' ')[0] : 'No breaches'}
            icon={TrendingUp}
            color="amber"
          />

          <MetricCard
            title="RAM Footprint (Avg / Max)"
            value={`${summary.ram.avg}%`}
            subvalue={`Max: ${summary.ram.max}% • Min: ${summary.ram.min}%`}
            icon={Layers}
            color="indigo"
            progress={summary.ram.avg}
          />

          <MetricCard
            title="Peak Network Download"
            value={formatSpeed(summary.net_download.max)}
            subvalue={`Avg Rate: ${formatSpeed(summary.net_download.avg)}`}
            icon={Network}
            color="emerald"
          />
        </div>
      )}

      {/* Charts Section */}
      <div className="space-y-6">
        {/* CPU & Memory Historical Graph */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-sky-500" />
              <span>CPU & RAM Utilization Over Time</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {historyData.length} Persisted Records Loaded
            </span>
          </div>

          <HistoricalChart
            data={historyData}
            series={[
              { key: 'cpu_percent', name: 'CPU Usage (%)', color: '#0ea5e9' },
              { key: 'ram_percent', name: 'RAM Usage (%)', color: '#8b5cf6' },
            ]}
            height={280}
            unit="%"
          />
        </div>

        {/* Disk I/O & Network Historical Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Disk Read/Write Throughput */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-emerald-500" />
                <span>Historical Disk I/O Speeds</span>
              </h3>
            </div>

            <HistoricalChart
              data={historyData.map(h => ({
                ...h,
                read_mb: (h.disk_read_bytes_per_sec / (1024 * 1024)).toFixed(2),
                write_mb: (h.disk_write_bytes_per_sec / (1024 * 1024)).toFixed(2),
              }))}
              series={[
                { key: 'read_mb', name: 'Read (MB/s)', color: '#10b981' },
                { key: 'write_mb', name: 'Write (MB/s)', color: '#0ea5e9' },
              ]}
              height={240}
              unit="MB/s"
            />
          </div>

          {/* Network Download/Upload Bandwidth */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
                <Network className="w-4 h-4 text-amber-500" />
                <span>Historical Network Bandwidth</span>
              </h3>
            </div>

            <HistoricalChart
              data={historyData.map(h => ({
                ...h,
                down_mb: (h.net_download_bytes_per_sec / (1024 * 1024)).toFixed(2),
                up_mb: (h.net_upload_bytes_per_sec / (1024 * 1024)).toFixed(2),
              }))}
              series={[
                { key: 'down_mb', name: 'Download (MB/s)', color: '#f59e0b' },
                { key: 'up_mb', name: 'Upload (MB/s)', color: '#a855f7' },
              ]}
              height={240}
              unit="MB/s"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

