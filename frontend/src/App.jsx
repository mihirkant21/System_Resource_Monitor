import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { MetricsProvider } from './context/MetricsContext';
import AppLayout from './layouts/AppLayout';
import ProcessModal from './components/ProcessModal';

import OverviewPage from './pages/OverviewPage';
import CPUPage from './pages/CPUPage';
import MemoryPage from './pages/MemoryPage';
import DiskPage from './pages/DiskPage';
import NetworkPage from './pages/NetworkPage';
import ProcessesPage from './pages/ProcessesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [inspectPid, setInspectPid] = useState(null);

  const handleInspectProcess = (pid) => {
    setInspectPid(pid);
  };

  const handleCloseModal = () => {
    setInspectPid(null);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage onInspectProcess={handleInspectProcess} />;
      case 'cpu':
        return <CPUPage />;
      case 'memory':
        return <MemoryPage />;
      case 'disk':
        return <DiskPage />;
      case 'network':
        return <NetworkPage />;
      case 'processes':
        return <ProcessesPage onInspectProcess={handleInspectProcess} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onInspectProcess={handleInspectProcess} />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {renderActiveView()}

      {/* Process Inspector & Safety Termination Modal */}
      {inspectPid && (
        <ProcessModal
          pid={inspectPid}
          onClose={handleCloseModal}
          onProcessTerminated={(pid, msg) => {
            console.log(`PID ${pid} terminated:`, msg);
          }}
        />
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MetricsProvider>
        <DashboardContent />
      </MetricsProvider>
    </ThemeProvider>
  );
}
