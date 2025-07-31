import React from 'react';
import { ActiveView } from '../../App';
import './Sidebar.scss';

interface SidebarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  isOpen,
  onClose,
}) => {
  const handleNavClick = (view: ActiveView) => {
    onViewChange(view);
    onClose(); // Close sidebar on mobile after selection
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};