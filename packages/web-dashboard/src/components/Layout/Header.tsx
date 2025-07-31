import React from 'react';
import { useWebSocket } from '@hooks/useWebSocket';
import { StatusIndicator } from '@components/UI';
import './Header.scss';

interface NavItem {
  id: string;
  label: string;
  icon?: string;
  active?: boolean;
  onClick: () => void;
}

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'glass';
  navigationItems?: NavItem[];
  showGradientText?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuToggle, 
  sidebarOpen, 
  variant = 'primary',
  navigationItems = [],
  showGradientText = false
}) => {
  const { connectionStatus, lastUpdate } = useWebSocket();

  // Generate header class names based on variant
  const headerClasses = [
    'header',
    'header-responsive',
    variant === 'glass' ? 'header-glass' : `header-variant-${variant}`
  ].join(' ');

  // Generate title class names
  const titleClasses = [
    'header-title',
    showGradientText ? 'gradient-text' : ''
  ].filter(Boolean).join(' ');

  return (
    <header className={headerClasses}>
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
          <h1 className={titleClasses}>AI Toolkit Dashboard</h1>
          
          {/* Modern navigation items */}
          {navigationItems.length > 0 && (
            <nav className="header-nav" role="navigation" aria-label="Main navigation">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${item.active ? 'active' : ''}`}
                  onClick={item.onClick}
                  aria-current={item.active ? 'page' : undefined}
                >
                  {item.icon && <span className="nav-icon">{item.icon}</span>}
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
        
        <div className="header-right">
          <div className="header-actions">
            <StatusIndicator
              status={connectionStatus}
              lastUpdate={lastUpdate}
            />
          </div>
        </div>
      </div>
    </header>
  );
};