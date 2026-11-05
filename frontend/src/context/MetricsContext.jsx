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
  const pingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // Fetch initial system information
  const loadSystemInfo = async () => {
    try {
      const info = await api.getSystemInfo();
      if (isMountedRef.current) {
        setSystemInfo(info);
      }
    } catch (err) {
      console.error('Failed to load system info:', err);
    }
  };

  // Fetch recent active alerts
  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts(15);
      if (isMountedRef.current) {
        setActiveAlerts(data.alerts.filter(a => !a.is_resolved));
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  const getWebSocketUrl = () => {
    // When running in development on Vite port 5173, connect directly to FastAPI on 8000
    // This avoids Vite's Node.js http-proxy ECONNABORTED/ECONNRESET stream abort warnings
    if (window.location.port === '5173' || window.location.port === '3000') {
      return `ws://${window.location.hostname || '127.0.0.1'}:8000/ws/metrics`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/metrics`;
  };

  const connectWebSocket = () => {
    if (!isMountedRef.current) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionStatus('connecting');
    const wsUrl = getWebSocketUrl();
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        setConnectionStatus('connected');
        console.log('WebSocket telemetry connection established:', wsUrl);

        // Keep connection active with lightweight ping every 20 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          if (event.data === 'pong') return;
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
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (!isMountedRef.current) return;
        setConnectionStatus('disconnected');
        console.log('WebSocket closed. Reconnecting in 2 seconds...');
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        try {
          ws.close();
        } catch {}
      };
    } catch (e) {
      console.error('Failed to construct WebSocket:', e);
      if (isMountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadSystemInfo();
    loadAlerts();
    connectWebSocket();

    // Periodically refresh system info & alerts every 30 seconds
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        loadSystemInfo();
        loadAlerts();
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        try {
          wsRef.current.close();
        } catch {}
      }
    };
  }, []);

  const resolveAlert = async (alertId) => {
    try {
      await api.resolveAlert(alertId);
      if (isMountedRef.current) {
        setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
      }
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
