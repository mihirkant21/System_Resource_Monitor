import React, { useState, useEffect } from 'react';
import { Sliders, Bell, Database, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    CPU_ALERT_THRESHOLD: 85,
    RAM_ALERT_THRESHOLD: 85,
    DISK_ALERT_THRESHOLD: 90,
    SWAP_ALERT_THRESHOLD: 80,
    MAX_HISTORY_DAYS: 7,
    DEFAULT_COLLECTION_INTERVAL: 1.0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [confirmClearAlerts, setConfirmClearAlerts] = useState(false);
  const [actionMsg, setActionMsg] = useState(null);

  useEffect(() => {
    api.getSettings()
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load settings:', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: parseFloat(val) || val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    try {
      await api.updateSettings(settings);
      setSuccessMsg('Application settings & alert thresholds saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await api.clearHistory();
      setActionMsg(res.message);
      setConfirmClearHistory(false);
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const handleClearAlerts = async () => {
    try {
      const res = await api.clearAlerts();
      setActionMsg(res.message);
      setConfirmClearAlerts(false);
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err) {
      console.error('Failed to clear alerts:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        Loading configuration settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text tracking-tight">
          Application & System Monitor Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
          Tune resource warning thresholds, background telemetry sampling rates, and database retention policies.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {actionMsg && (
        <div className="p-3.5 bg-sky-500/10 border border-sky-500/30 text-sky-500 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Alert Thresholds */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-dark-border">
            <Bell className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text">
              Health Anomaly Warning Thresholds
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPU */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <label className="text-slate-700 dark:text-dark-text">CPU Alert Threshold</label>
                <span className="font-mono font-bold text-sky-500">{settings.CPU_ALERT_THRESHOLD}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                step="1"
                value={settings.CPU_ALERT_THRESHOLD}
                onChange={(e) => handleChange('CPU_ALERT_THRESHOLD', e.target.value)}
                className="w-full accent-sky-500"
              />
              <p className="text-[11px] text-slate-400">Trigger warnings when processor usage exceeds this level.</p>
            </div>

            {/* RAM */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <label className="text-slate-700 dark:text-dark-text">RAM Alert Threshold</label>
                <span className="font-mono font-bold text-indigo-500">{settings.RAM_ALERT_THRESHOLD}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                step="1"
                value={settings.RAM_ALERT_THRESHOLD}
                onChange={(e) => handleChange('RAM_ALERT_THRESHOLD', e.target.value)}
                className="w-full accent-indigo-500"
              />
              <p className="text-[11px] text-slate-400">Trigger warnings when volatile memory footprint exceeds this level.</p>
            </div>

            {/* Disk */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <label className="text-slate-700 dark:text-dark-text">Disk Partition Threshold</label>
                <span className="font-mono font-bold text-emerald-500">{settings.DISK_ALERT_THRESHOLD}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="99"
                step="1"
                value={settings.DISK_ALERT_THRESHOLD}
                onChange={(e) => handleChange('DISK_ALERT_THRESHOLD', e.target.value)}
                className="w-full accent-emerald-500"
              />
              <p className="text-[11px] text-slate-400">Trigger warnings when storage saturation exceeds this level.</p>
            </div>

            {/* Swap */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <label className="text-slate-700 dark:text-dark-text">Swap Pagefile Threshold</label>
                <span className="font-mono font-bold text-rose-500">{settings.SWAP_ALERT_THRESHOLD}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                step="1"
                value={settings.SWAP_ALERT_THRESHOLD}
                onChange={(e) => handleChange('SWAP_ALERT_THRESHOLD', e.target.value)}
                className="w-full accent-rose-500"
              />
              <p className="text-[11px] text-slate-400">Trigger warnings when pagefile / swap allocation exceeds this level.</p>
            </div>
          </div>
        </div>

        {/* Card 2: Collector & Persistence Configuration */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-dark-border">
            <Sliders className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-dark-text">
              Telemetry Collection & Retention Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-dark-text block">
                Sampling Interval (Seconds)
              </label>
              <input
                type="number"
                min="0.5"
                max="10.0"
                step="0.5"
                value={settings.DEFAULT_COLLECTION_INTERVAL}
                onChange={(e) => handleChange('DEFAULT_COLLECTION_INTERVAL', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card font-mono text-slate-800 dark:text-dark-text"
              />
              <p className="text-[11px] text-slate-400">Background metric recording interval (default: 1.0s).</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-dark-text block">
                Historical Data Retention (Days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                step="1"
                value={settings.MAX_HISTORY_DAYS}
                onChange={(e) => handleChange('MAX_HISTORY_DAYS', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card font-mono text-slate-800 dark:text-dark-text"
              />
              <p className="text-[11px] text-slate-400">Records older than this period are purged automatically.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </form>

      {/* Card 3: Danger Zone / Database Management */}
      <div className="bg-white dark:bg-dark-surface border border-rose-500/20 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-rose-500/10">
          <Database className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
            Database Maintenance & Record Cleanup
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-dark-text">Clear Historical Metrics</h4>
            <p className="text-xs text-slate-400">Purges all time-series hardware utilization samples from SQLite.</p>
          </div>

          {!confirmClearHistory ? (
            <button
              type="button"
              onClick={() => setConfirmClearHistory(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 rounded-lg transition-all"
            >
              Clear Metrics
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setConfirmClearHistory(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-dark-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-t border-slate-100 dark:border-dark-border">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-dark-text">Clear Alert History</h4>
            <p className="text-xs text-slate-400">Purges past threshold alert logs.</p>
          </div>

          {!confirmClearAlerts ? (
            <button
              type="button"
              onClick={() => setConfirmClearAlerts(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 rounded-lg transition-all"
            >
              Clear Alerts
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setConfirmClearAlerts(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-dark-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAlerts}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

