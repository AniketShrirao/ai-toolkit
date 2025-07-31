import React, { useState } from 'react';
import { Layout } from '@components/Layout';
import { WebSocketProvider } from '@hooks/useWebSocket';
import { SettingsProvider } from '@hooks/useSettings';
import { ChatProvider } from './contexts/ChatContext';
import { Dashboard } from '@components/Dashboard';
import { Documents } from '@components/Documents';
import { Settings } from '@components/Settings';
import { Chat } from '@components/Chat';

export type ActiveView = 'dashboard' | 'documents' | 'settings' | 'chat';

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
      case 'chat':
        return <Chat />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <SettingsProvider>
      <WebSocketProvider>
        <ChatProvider>
          <Layout activeView={activeView} onViewChange={setActiveView}>
            {renderContent()}
          </Layout>
        </ChatProvider>
      </WebSocketProvider>
    </SettingsProvider>
  );
}

export default App;