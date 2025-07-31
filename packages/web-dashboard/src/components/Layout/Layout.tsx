import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { StickyChat } from '../UI/StickyChat';
import { ActiveView } from '../../App';
import './Layout.scss';

interface LayoutProps {
  children: React.ReactNode;
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeView,
  onViewChange,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Example navigation items for demonstration (can be made configurable)
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      active: activeView === 'dashboard',
      onClick: () => onViewChange('dashboard')
    },
    {
      id: 'documents',
      label: 'Documents',
      active: activeView === 'documents',
      onClick: () => onViewChange('documents')
    },
    {
      id: 'chat',
      label: 'Chat',
      active: activeView === 'chat',
      onClick: () => onViewChange('chat')
    },
    {
      id: 'settings',
      label: 'Settings',
      active: activeView === 'settings',
      onClick: () => onViewChange('settings')
    }
  ];

  return (
    <div className="layout">
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        variant="primary" // Can be changed to 'secondary', 'tertiary', or 'glass'
        navigationItems={navigationItems}
        showGradientText={false} // Can be enabled for gradient text effect
      />
      <div className="layout-body">
        <Sidebar
          activeView={activeView}
          onViewChange={onViewChange}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-content">
          <div className="content-wrapper">
            {children}
          </div>
        </main>
      </div>
      
      {/* Sticky Chat - available on all pages */}
      <StickyChat
        position="bottom-right"
        offset={{ x: 20, y: 20 }}
        onNavigateToChat={() => onViewChange('chat')}
      />
    </div>
  );
};