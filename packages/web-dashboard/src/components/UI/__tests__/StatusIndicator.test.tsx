import { render, screen } from '@testing-library/react';
import { StatusIndicator } from '../StatusIndicator';
import React from 'react';

describe('StatusIndicator Component', () => {
  it('renders connected status', () => {
    const lastUpdate = new Date();
    render(<StatusIndicator status="connected" lastUpdate={lastUpdate} />);
    
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText(/ago/)).toBeInTheDocument();
    
    const dot = document.querySelector('.status-dot');
    expect(dot).toHaveClass('success');
  });

  it('renders connecting status', () => {
    render(<StatusIndicator status="connecting" lastUpdate={null} />);
    
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
    
    const dot = document.querySelector('.status-dot');
    expect(dot).toHaveClass('warning');
  });

  it('renders disconnected status', () => {
    render(<StatusIndicator status="disconnected" lastUpdate={null} />);
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    
    const dot = document.querySelector('.status-dot');
    expect(dot).toHaveClass('error');
  });

  it('renders error status', () => {
    render(<StatusIndicator status="error" lastUpdate={null} />);
    
    expect(screen.getByText('Connection Error')).toBeInTheDocument();
    
    const dot = document.querySelector('.status-dot');
    expect(dot).toHaveClass('error');
  });

  it('formats time correctly', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    
    render(<StatusIndicator status="connected" lastUpdate={thirtySecondsAgo} />);
    
    expect(screen.getByText('30s ago')).toBeInTheDocument();
  });

  it('formats minutes correctly', () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    
    render(<StatusIndicator status="connected" lastUpdate={twoMinutesAgo} />);
    
    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });
});