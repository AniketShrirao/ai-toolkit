import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ActiveView } from '../../App';
import './Layout.css';

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

  return (
    <div className="layout">
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
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
    </div>
  );
};