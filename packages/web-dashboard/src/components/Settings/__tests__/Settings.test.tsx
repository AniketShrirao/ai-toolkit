import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from '../Settings';
import { SettingsProvider } from '../../../hooks/useSettings';
import { vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      {component}
    </SettingsProvider>
  );
};

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should render settings page with navigation tabs', async () => {
    renderWithProvider(<Settings />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure your AI toolkit preferences and system settings')).toBeInTheDocument();

    // Check navigation tabs
    expect(screen.getByText('Ollama')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('should show Ollama settings by default', async () => {
    renderWithProvider(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Ollama Configuration')).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://localhost:11434')).toBeInTheDocument();
    });
  });

  it('should switch between different settings tabs', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Settings />);

    // Initially shows Ollama settings
    await waitFor(() => {
      expect(screen.getByText('Ollama Configuration')).toBeInTheDocument();
    });

    // Switch to Processing tab
    await user.click(screen.getByText('Processing'));
    await waitFor(() => {
      expect(screen.getByText('Processing Preferences')).toBeInTheDocument();
      expect(screen.getByText('Auto-process uploaded documents')).toBeInTheDocument();
    });

    // Switch to Monitoring tab
    await user.click(screen.getByText('Monitoring'));
    await waitFor(() => {
      expect(screen.getByText('Ollama Status')).toBeInTheDocument();
      expect(screen.getByText('System Resources')).toBeInTheDocument();
    });

    // Switch to Workflows tab
    await user.click(screen.getByText('Workflows'));
    await waitFor(() => {
      expect(screen.getByText('Workflow Management')).toBeInTheDocument();
      expect(screen.getByText('Create Workflow')).toBeInTheDocument();
    });

    // Switch to Preferences tab
    await user.click(screen.getByText('Preferences'));
    await waitFor(() => {
      expect(screen.getByText('User Preferences')).toBeInTheDocument();
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });
  });

  it('should highlight active tab', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Settings />);

    // Ollama tab should be active by default
    const ollamaTab = screen.getByRole('button', { name: /🤖 Ollama/ });
    expect(ollamaTab).toHaveClass('active');

    // Switch to Processing tab
    const processingTab = screen.getByRole('button', { name: /⚙️ Processing/ });
    await user.click(processingTab);

    await waitFor(() => {
      expect(processingTab).toHaveClass('active');
      expect(ollamaTab).not.toHaveClass('active');
    });
  });

  it('should maintain tab state during navigation', async () => {
    const user = userEvent.setup();
    renderWithProvider(<Settings />);

    // Switch to Monitoring tab
    await user.click(screen.getByText('Monitoring'));
    await waitFor(() => {
      expect(screen.getByText('System Resources')).toBeInTheDocument();
    });

    // Switch to another tab and back
    await user.click(screen.getByText('Processing'));
    await user.click(screen.getByText('Monitoring'));

    await waitFor(() => {
      expect(screen.getByText('System Resources')).toBeInTheDocument();
    });
  });
});