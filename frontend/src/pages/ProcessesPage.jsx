import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertTriangle, ArrowUpDown, Terminal, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { formatBytes } from '../utils/formatters';

export default function ProcessesPage({ onInspectProcess }) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('cpu'); // cpu, memory, name, pid
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const data = await api.getProcesses({
        search: searchTerm,
        sort_by: sortBy,
        order: sortOrder,
        limit: 150
      });
      setProcesses(data.processes || []);
    } catch (err) {
      console.error('Failed to load processes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProcesses();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-dark-text tracking-tight">
            Process Task Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-dark-muted mt-0.5">
            Active kernel processes, resource allocation, resident set size, and security context.
          </p>
        </div>

        {/* Search & Refresh Toolbar */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by PID or process name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-surface text-slate-800 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-sky-500 w-64 shadow-sm"
            />
          </div>

          <button
            onClick={fetchProcesses}
            disabled={loading}
            className="p-2 text-slate-600 dark:text-dark-muted hover:text-slate-800 dark:hover:text-dark-text bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Refresh Process List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-sky-500/10 border border-sky-500/30 text-sky-500 rounded-xl text-xs flex justify-between items-center">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs font-bold">×</button>
        </div>
      )}

      {/* Main Process Table */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-dark-card/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-dark-muted sticky top-0 border-b border-slate-200 dark:border-dark-border z-10">
              <tr>
                <th
                  onClick={() => handleSort('pid')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>PID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Process Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('cpu')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>CPU %</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('memory')}
                  className="py-3 px-4 font-semibold cursor-pointer hover:text-sky-500 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <span>Memory RSS</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Memory %</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-mono text-xs">
              {processes.map((proc) => {
                const isHighCpu = proc.cpu_percent >= 50;
                const isHighMem = proc.memory_percent >= 40;

                return (
                  <tr
                    key={proc.pid}
                    className="hover:bg-slate-50 dark:hover:bg-dark-card/40 transition-colors cursor-pointer group"
                    onClick={() => onInspectProcess && onInspectProcess(proc.pid)}
                  >
                    <td className="py-3 px-4 font-bold text-slate-500 group-hover:text-sky-500">
                      {proc.pid}
                    </td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-800 dark:text-dark-text max-w-xs truncate">
                      {proc.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${isHighCpu ? 'text-rose-500' : 'text-sky-500'}`}>
                        {proc.cpu_percent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-dark-text font-bold">
                      {formatBytes(proc.memory_bytes)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {proc.memory_percent}%
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-dark-card text-slate-600 dark:text-dark-muted">
                        {proc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-sans truncate max-w-[120px]">
                      {proc.username}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectProcess && onInspectProcess(proc.pid);
                        }}
                        className="px-2.5 py-1 text-[11px] font-sans font-medium rounded-lg text-slate-600 dark:text-dark-muted hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}

              {processes.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    No active processes matched your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

