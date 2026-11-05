import React, { useState, useEffect } from 'react';
import { X, AlertOctagon, Terminal, Cpu, HardDrive, User, Clock, Layers } from 'lucide-react';
import { api } from '../services/api';
import { formatBytes, formatDateTime } from '../utils/formatters';

export default function ProcessModal({ pid, onClose, onProcessTerminated }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmKill, setConfirmKill] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!pid) return;
    setLoading(true);
    setError(null);
    setConfirmKill(false);

    api.getProcessDetails(pid)
      .then(data => {
        setDetails(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [pid]);

  const handleTerminate = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await api.terminateProcess(pid);
      if (onProcessTerminated) onProcessTerminated(pid, res.message);
      onClose();
    } catch (err) {
      setError(err.message);
      setActionLoading(false);
    }
  };

  if (!pid) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/10 text-sky-500 rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-dark-text flex items-center space-x-2">
                <span>{details?.name || `PID ${pid}`}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-slate-100 dark:bg-dark-card text-slate-600 dark:text-dark-muted">
                  PID: {pid}
                </span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-dark-muted">
                Status: <span className="font-semibold text-emerald-500 uppercase">{details?.status || 'Unknown'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-dark-text rounded-lg hover:bg-slate-100 dark:hover:bg-dark-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          {loading && (
            <div className="py-12 text-center text-slate-500 dark:text-dark-muted">
              Loading process inspection metrics...
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs">
              {error}
            </div>
          )}

          {details && !loading && (
            <>
              {/* Quick KPI grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-dark-card p-3 rounded-xl border border-slate-200 dark:border-dark-border">
                  <div className="flex items-center text-xs text-slate-400 mb-1 space-x-1">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>CPU Usage</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-800 dark:text-dark-text">
                    {details.cpu_percent}%
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-dark-card p-3 rounded-xl border border-slate-200 dark:border-dark-border">
                  <div className="flex items-center text-xs text-slate-400 mb-1 space-x-1">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Memory (RSS)</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-800 dark:text-dark-text">
                    {formatBytes(details.memory_rss_bytes)}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-dark-card p-3 rounded-xl border border-slate-200 dark:border-dark-border">
                  <div className="flex items-center text-xs text-slate-400 mb-1 space-x-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Threads</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-slate-800 dark:text-dark-text">
                    {details.num_threads || 'N/A'}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-dark-card p-3 rounded-xl border border-slate-200 dark:border-dark-border">
                  <div className="flex items-center text-xs text-slate-400 mb-1 space-x-1">
                    <User className="w-3.5 h-3.5" />
                    <span>User</span>
                  </div>
                  <div className="text-sm font-semibold truncate text-slate-800 dark:text-dark-text">
                    {details.username || 'System'}
                  </div>
                </div>
              </div>

              {/* Metadata Details */}
              <div className="space-y-3 bg-slate-50 dark:bg-dark-card/50 p-4 rounded-xl border border-slate-200 dark:border-dark-border">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Executable Path</label>
                  <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all mt-0.5">
                    {details.exe || 'Protected System Binary'}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase font-semibold">Command Line Invocation</label>
                  <p className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all mt-0.5 bg-white dark:bg-dark-card p-2 rounded border border-slate-200 dark:border-dark-border">
                    {details.cmdline || 'N/A'}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Process Started</span>
                  </span>
                  <span className="font-mono text-slate-600 dark:text-dark-muted">
                    {formatDateTime(details.create_time)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer / Safety Termination Action */}
        <div className="p-5 border-t border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-card/30 flex items-center justify-between">
          {!confirmKill ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-dark-muted hover:text-slate-800 dark:hover:text-dark-text transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => setConfirmKill(true)}
                className="px-4 py-2 text-sm font-semibold text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/30 rounded-xl transition-all flex items-center space-x-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>End Process</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-500 flex items-center space-x-1">
                <AlertOctagon className="w-4 h-4" />
                <span>Terminate PID {pid}? Unsaved data will be lost.</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setConfirmKill(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-dark-muted dark:hover:text-dark-text"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTerminate}
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Terminating...' : 'Yes, Terminate'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

