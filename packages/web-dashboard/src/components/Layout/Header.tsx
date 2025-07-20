import React from 'react';
import { useWebSocket } from '@hooks/useWebSocket';
import { StatusIndicator } from '@components/UI';
import './Header.css';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, sidebarOpen }) => {
  const { connectionStatus, lastUpdate } = useWebSocket();

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <button
            className="menu-button"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${sidebarOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <h1 className="header-title">AI Toolkit Dashboard</h1>
        </div>
        <div className="header-right">
          <StatusIndicator
            status={connectionStatus}
            lastUpdate={lastUpdate}
          />
        </div>
      </div>
    </header>
  );
};