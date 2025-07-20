import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import React from 'react';
import { vi } from 'vitest';

// Mock the useWebSocket hook
vi.mock('@hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionStatus: 'connected',
    lastUpdate: new Date(),
  }),
}));

describe('Header Component', () => {
  const defaultProps = {
    onMenuToggle: vi.fn(),
    sidebarOpen: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header title', () => {
    render(<Header {...defaultProps} />);
    expect(screen.getByText('AI Toolkit Dashboard')).toBeInTheDocument();
  });

  it('renders menu button', () => {
    render(<Header {...defaultProps} />);
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('handles menu toggle click', () => {
    const onMenuToggle = vi.fn();
    render(<Header {...defaultProps} onMenuToggle={onMenuToggle} />);
    
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(menuButton);
    
    expect(onMenuToggle).toHaveBeenCalled();
  });

  it('shows hamburger menu in correct state', () => {
    const { rerender } = render(<Header {...defaultProps} sidebarOpen={false} />);
    
    let hamburger = document.querySelector('.hamburger');
    expect(hamburger).not.toHaveClass('open');
    
    rerender(<Header {...defaultProps} sidebarOpen={true} />);
    
    hamburger = document.querySelector('.hamburger');
    expect(hamburger).toHaveClass('open');
  });

  it('renders status indicator', () => {
    render(<Header {...defaultProps} />);
    expect(document.querySelector('.status-indicator')).toBeInTheDocument();
  });
});