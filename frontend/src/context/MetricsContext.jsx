import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const MetricsContext = createContext();

const MAX_CHART_POINTS = 30;

export function MetricsProvider({ children }) {
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected
  const [systemInfo, setSystemInfo] = useState(null);
  const [latestMetrics, setLatestMetrics] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Fetch initial system information
  const loadSystemInfo = async () => {
    try {
      const info = await api.getSystemInfo();
      setSystemInfo(info);
    } catch (err) {
      console.error('Failed to load system info:', err);
    }
  };

  // Fetch recent active alerts
  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts(15);
      setActiveAlerts(data.alerts.filter(a => !a.is_resolved));
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/metrics`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      console.log('WebSocket connection established.');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'METRICS_UPDATE') {
          setLatestMetrics(payload);

          // Add to sliding chart history buffer
          setRecentHistory(prev => {
            const timeLabel = new Date(payload.timestamp).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
            const point = {
              timestamp: payload.timestamp,
              time: timeLabel,
              cpu: payload.cpu.overall_percent,
              ram: payload.memory.virtual_memory.percent,
              diskReadMB: payload.disk.io.read_mb_per_sec,
              diskWriteMB: payload.disk.io.write_mb_per_sec,
              netDownMB: payload.network.aggregated.download_mb_per_sec,
              netUpMB: payload.network.aggregated.upload_mb_per_sec,
            };
            const updated = [...prev, point];
            return updated.length > MAX_CHART_POINTS ? updated.slice(-MAX_CHART_POINTS) : updated;
          });

          // Refresh alerts if any new alerts arrived
          if (payload.new_alerts && payload.new_alerts.length > 0) {
            loadAlerts();
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      console.log('WebSocket closed. Reconnecting in 2 seconds...');
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
    };

    ws.onerror = (err) => {
      console.warn('WebSocket encountered error:', err);
      ws.close();
    };
  };

  useEffect(() => {
    loadSystemInfo();
    loadAlerts();
    connectWebSocket();

    // Periodically refresh system info & alerts every 30 seconds
    const interval = setInterval(() => {
      loadSystemInfo();
      loadAlerts();
    }, 30000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const resolveAlert = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  return (
    <MetricsContext.Provider
      value={{
        connectionStatus,
        systemInfo,
        latestMetrics,
        recentHistory,
        activeAlerts,
        resolveAlert,
        refreshAlerts: loadAlerts,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
}

