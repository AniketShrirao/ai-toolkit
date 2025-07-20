import React, { useState } from 'react';
import { Layout } from '@components/Layout';
import { WebSocketProvider } from '@hooks/useWebSocket';
import { SettingsProvider } from '@hooks/useSettings';
import { Dashboard } from '@components/Dashboard';
import { Documents } from '@components/Documents';
import { Settings } from '@components/Settings';

export type ActiveView = 'dashboard' | 'documents' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'documents':
        return <Documents />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SettingsProvider>
      <WebSocketProvider>
        <Layout activeView={activeView} onViewChange={setActiveView}>
          {renderContent()}
        </Layout>
      </WebSocketProvider>
    </SettingsProvider>
  );
}

export default App;