import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Layout } from '../Layout';
import { vi } from 'vitest';

// Mock the useWebSocket hook
vi.mock('@hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionStatus: 'connected',
    lastUpdate: new Date(),
  }),
}));

describe('Layout Component', () => {
  const defaultProps = {
    activeView: 'dashboard' as const,
    onViewChange: vi.fn(),
    children: <div>Test Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders layout structure', () => {
    render(<Layout {...defaultProps} />);
    
    expect(screen.getByText('AI Toolkit Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('toggles sidebar on menu button click', () => {
    render(<Layout {...defaultProps} />);
    
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    
    // Initially sidebar should not be open
    let sidebar = document.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('open');
    
    // Click to open
    fireEvent.click(menuButton);
    sidebar = document.querySelector('.sidebar');
    expect(sidebar).toHaveClass('open');
    
    // Click to close
    fireEvent.click(menuButton);
    sidebar = document.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('open');
  });

  it('closes sidebar when navigation item is clicked', () => {
    render(<Layout {...defaultProps} />);
    
    // Open sidebar first
    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(menuButton);
    
    let sidebar = document.querySelector('.sidebar');
    expect(sidebar).toHaveClass('open');
    
    // Click on a navigation item
    const documentsButton = screen.getByRole('button', { name: /documents/i });
    fireEvent.click(documentsButton);
    
    // Sidebar should close
    sidebar = document.querySelector('.sidebar');
    expect(sidebar).not.toHaveClass('open');
  });

  it('passes view changes to parent', () => {
    const onViewChange = vi.fn();
    
    render(<Layout {...defaultProps} onViewChange={onViewChange} />);
    
    const documentsButton = screen.getByRole('button', { name: /documents/i });
    fireEvent.click(documentsButton);
    
    expect(onViewChange).toHaveBeenCalledWith('documents');
  });

  it('renders content in main area', () => {
    render(
      <Layout {...defaultProps}>
        <div data-testid="main-content">Custom Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });
});