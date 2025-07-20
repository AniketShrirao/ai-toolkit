import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { vi } from 'vitest';

// Mock the useWebSocket hook and WebSocketProvider
vi.mock('@hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionStatus: 'connected',
    lastUpdate: new Date(),
  }),
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('App Component', () => {
  it('renders with dashboard as default view', () => {
    render(<App />);
    
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Monitor your AI toolkit operations and system status')).toBeInTheDocument();
  });

  it('switches between views', () => {
    render(<App />);
    
    // Initially on dashboard
    expect(screen.getByText('Monitor your AI toolkit operations and system status')).toBeInTheDocument();
    
    // Switch to documents
    const documentsButton = screen.getByRole('button', { name: /documents/i });
    fireEvent.click(documentsButton);
    
    expect(screen.getByText('Upload and manage your documents for AI processing')).toBeInTheDocument();
    
    // Switch to settings
    const settingsButton = screen.getByRole('button', { name: /settings/i });
    fireEvent.click(settingsButton);
    
    expect(screen.getByText('Configure your AI toolkit preferences and system settings')).toBeInTheDocument();
  });

  it('maintains active navigation state', () => {
    render(<App />);
    
    // Dashboard should be active initially
    const dashboardButton = screen.getByRole('button', { name: /dashboard/i });
    expect(dashboardButton).toHaveClass('active');
    
    // Switch to documents
    const documentsButton = screen.getByRole('button', { name: /documents/i });
    fireEvent.click(documentsButton);
    
    expect(documentsButton).toHaveClass('active');
    expect(dashboardButton).not.toHaveClass('active');
  });

  it('renders layout components', () => {
    render(<App />);
    
    // Header should be present
    expect(screen.getByText('AI Toolkit Dashboard')).toBeInTheDocument();
    
    // Navigation buttons should be present
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /documents/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });
});