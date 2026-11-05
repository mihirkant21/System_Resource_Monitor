const API_BASE = '/api';

export const api = {
  // System
  async getSystemInfo() {
    const res = await fetch(`${API_BASE}/system/info`);
    if (!res.ok) throw new Error('Failed to fetch system info');
    return res.json();
  },

  // CPU
  async getCpuMetrics() {
    const res = await fetch(`${API_BASE}/cpu`);
    if (!res.ok) throw new Error('Failed to fetch CPU metrics');
    return res.json();
  },

  // Memory
  async getMemoryMetrics() {
    const res = await fetch(`${API_BASE}/memory`);
    if (!res.ok) throw new Error('Failed to fetch memory metrics');
    return res.json();
  },

  // Disk
  async getDiskMetrics() {
    const res = await fetch(`${API_BASE}/disk`);
    if (!res.ok) throw new Error('Failed to fetch disk metrics');
    return res.json();
  },

  // Network
  async getNetworkMetrics() {
    const res = await fetch(`${API_BASE}/network`);
    if (!res.ok) throw new Error('Failed to fetch network metrics');
    return res.json();
  },

  // Processes
  async getProcesses(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.order) query.set('order', params.order);
    if (params.limit) query.set('limit', params.limit);
    const res = await fetch(`${API_BASE}/processes?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch processes');
    return res.json();
  },

  async getTopProcesses(limit = 5) {
    const res = await fetch(`${API_BASE}/processes/top?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch top processes');
    return res.json();
  },

  async getProcessDetails(pid) {
    const res = await fetch(`${API_BASE}/processes/${pid}`);
    if (!res.ok) throw new Error(`Failed to fetch details for PID ${pid}`);
    return res.json();
  },

  async terminateProcess(pid) {
    const res = await fetch(`${API_BASE}/processes/${pid}/terminate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: true }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to terminate process');
    return data;
  },

  // History & Analytics
  async getHistory(params = {}) {
    const query = new URLSearchParams();
    if (params.start_time) query.set('start_time', params.start_time);
    if (params.end_time) query.set('end_time', params.end_time);
    if (params.limit) query.set('limit', params.limit || 500);
    const res = await fetch(`${API_BASE}/history?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch historical metrics');
    return res.json();
  },

  async getHistorySummary(params = {}) {
    const query = new URLSearchParams();
    if (params.start_time) query.set('start_time', params.start_time);
    if (params.end_time) query.set('end_time', params.end_time);
    const res = await fetch(`${API_BASE}/history/summary?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch history summary');
    return res.json();
  },

  getExportCsvUrl(params = {}) {
    const query = new URLSearchParams();
    if (params.start_time) query.set('start_time', params.start_time);
    if (params.end_time) query.set('end_time', params.end_time);
    return `${API_BASE}/history/export?${query.toString()}`;
  },

  async clearHistory() {
    const res = await fetch(`${API_BASE}/history?confirm=true`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear history');
    return res.json();
  },

  // Alerts
  async getAlerts(limit = 50) {
    const res = await fetch(`${API_BASE}/alerts?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async resolveAlert(alertId) {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/resolve`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  async clearAlerts() {
    const res = await fetch(`${API_BASE}/alerts?confirm=true`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear alerts');
    return res.json();
  },

  // Settings
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(settingsObj) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsObj),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },
};

