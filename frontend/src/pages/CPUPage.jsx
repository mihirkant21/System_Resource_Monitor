import React, { useMemo } from 'react';
import { Cpu, Zap, Activity, Server, Gauge } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import GaugeCircle from '../components/GaugeCircle';
import CoreProgressBar from '../components/CoreProgressBar';
import RealTimeAreaChart from '../charts/RealTimeAreaChart';
import { useMetrics } from '../context/MetricsContext';
import { formatFrequency } from '../utils/formatters';

export default function CPUPage() {
  const { latestMetrics, recentHistory, systemInfo } = useMetrics();
  const cpu = latestMetrics?.cpu;

  // Calculate live average and peak from historical buffer
  const { avgCpu, peakCpu } = useMemo(() => {
    if (!recentHistory || recentHistory.length === 0) return { avgCpu: 0, peakCpu: 0 };
    const values = recentHistory.map(h => h.cpu);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const peak = Math.max(...values);
    return { avgCpu: avg.toFixed(1), peakCpu: peak.toFixed(1) };
  }, [recentHistory]);

  const perCore = cpu?.per_core_percent || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text tracking-tight">
          CPU Performance & Core Analytics
        </h2>
        <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
          Multi-core task distribution, hardware frequency scaling, and scheduler context switches.
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Overall Load"
          value={`${cpu?.overall_percent ?? 0}%`}
          subvalue={`Peak: ${peakCpu}% • Avg: ${avgCpu}%`}
          icon={Gauge}
          color="sky"
          progress={cpu?.overall_percent}
        />

        <MetricCard
          title="Frequency"
          value={formatFrequency(cpu?.frequency_mhz?.current)}
          subvalue={`Max: ${formatFrequency(cpu?.frequency_mhz?.max)}`}
          icon={Zap}
          color="amber"
        />

        <MetricCard
          title="Hardware Cores"
          value={`${cpu?.logical_cores ?? 0} Cores`}
          subvalue={`${cpu?.physical_cores ?? 0} Physical Processors`}
          icon={Server}
          color="emerald"
        />

        <MetricCard
          title="Context Switches"
          value={cpu?.context_switches ? cpu.context_switches.toLocaleString() : 'N/A'}
          subvalue={`Interrupts: ${cpu?.interrupts ? cpu.interrupts.toLocaleString() : 'N/A'}`}
          icon={Activity}
          color="indigo"
        />
      </div>

      {/* Main Section: Gauge & Live Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Circular Utilization Gauge & Stats */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text self-start mb-4">
            Utilization Gauge
          </h3>

          <div className="py-4">
            <GaugeCircle
              percent={cpu?.overall_percent || 0}
              size={170}
              strokeWidth={12}
              label="CPU Usage"
            />
          </div>

          {/* Load Averages if supported */}
          <div className="w-full pt-4 border-t border-slate-100 dark:border-dark-border">
            <div className="text-xs font-semibold uppercase text-slate-400 mb-2">
              System Load Average
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 dark:bg-dark-card p-2 rounded-lg border border-slate-200 dark:border-dark-border">
                <span className="text-[10px] text-slate-400">1 Min</span>
                <p className="font-mono font-bold text-sm text-slate-800 dark:text-dark-text">
                  {cpu?.load_average?.['1min'] ?? 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-dark-card p-2 rounded-lg border border-slate-200 dark:border-dark-border">
                <span className="text-[10px] text-slate-400">5 Min</span>
                <p className="font-mono font-bold text-sm text-slate-800 dark:text-dark-text">
                  {cpu?.load_average?.['5min'] ?? 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-dark-card p-2 rounded-lg border border-slate-200 dark:border-dark-border">
                <span className="text-[10px] text-slate-400">15 Min</span>
                <p className="font-mono font-bold text-sm text-slate-800 dark:text-dark-text">
                  {cpu?.load_average?.['15min'] ?? 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Line/Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-sky-500" />
              <span>Real-Time Processor Utilization (60s Window)</span>
            </h3>
            <span className="text-xs font-mono font-bold text-sky-500">
              {cpu?.overall_percent ?? 0}%
            </span>
          </div>

          <RealTimeAreaChart
            data={recentHistory}
            dataKey="cpu"
            color="#0ea5e9"
            gradientId="gradCpuPage"
            unit="%"
            height={280}
          />
        </div>
      </div>

      {/* Per-Core Breakdown Grid */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text">
            Per-Core Hardware Allocation ({perCore.length} Cores)
          </h3>
          <span className="text-xs text-slate-400 dark:text-dark-muted font-mono">
            Model: {systemInfo?.processor || 'Standard Processor'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {perCore.map((usage, idx) => (
            <CoreProgressBar key={idx} coreIndex={idx} percent={usage} />
          ))}
        </div>
      </div>
    </div>
  );
}

