import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OllamaSettings } from '../OllamaSettings';
import { SettingsProvider } from '@hooks/useSettings';
import { SystemHealth } from '@ai-toolkit/shared';
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

// Mock window.alert
const mockAlert = vi.fn();
Object.defineProperty(window, 'alert', {
  value: mockAlert,
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <SettingsProvider>
      {component}
    </SettingsProvider>
  );
};

describe('OllamaSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should render Ollama configuration form', async () => {
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      expect(screen.getByText('Ollama Configuration')).toBeInTheDocument();
      expect(screen.getByDisplayValue('http://localhost:11434')).toBeInTheDocument();
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
      expect(screen.getByText('Save Settings')).toBeInTheDocument();
    });
  });

  it('should show connection status indicator', async () => {
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      // Should show either Connected or Disconnected status
      const statusElements = screen.getAllByText(/Connected|Disconnected/);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  it('should populate available models in dropdown', async () => {
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      const modelSelect = screen.getByRole('combobox');
      expect(modelSelect).toBeInTheDocument();
      
      // Should have default option plus available models
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(1);
    });
  });

  it('should update server URL input', async () => {
    const user = userEvent.setup();
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      const serverUrlInput = screen.getByDisplayValue('http://localhost:11434');
      expect(serverUrlInput).toBeInTheDocument();
    });

    const serverUrlInput = screen.getByDisplayValue('http://localhost:11434');
    await user.clear(serverUrlInput);
    await user.type(serverUrlInput, 'http://custom:11434');

    expect(serverUrlInput).toHaveValue('http://custom:11434');
  });

  it('should update timeout and retry settings', async () => {
    const user = userEvent.setup();
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      const timeoutInput = screen.getByDisplayValue('30000');
      const retriesInput = screen.getByDisplayValue('3');
      expect(timeoutInput).toBeInTheDocument();
      expect(retriesInput).toBeInTheDocument();
    });

    const timeoutInput = screen.getByDisplayValue('30000');
    await user.clear(timeoutInput);
    await user.type(timeoutInput, '60000');

    expect(timeoutInput).toHaveValue(60000);
  });

  it('should test connection when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      const testButton = screen.getByText('Test Connection');
      expect(testButton).toBeInTheDocument();
    });

    const testButton = screen.getByText('Test Connection');
    await user.click(testButton);

    // Button should show "Testing..." state
    expect(screen.getByText('Testing...')).toBeInTheDocument();

    // Wait for test to complete
    await waitFor(() => {
      expect(screen.getByText('Test Connection')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should show alert with result
    expect(mockAlert).toHaveBeenCalled();
  });

  it('should save settings when save button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      const saveButton = screen.getByText('Save Settings');
      expect(saveButton).toBeInTheDocument();
    });

    // Modify a setting
    const serverUrlInput = screen.getByDisplayValue('http://localhost:11434');
    await user.clear(serverUrlInput);
    await user.type(serverUrlInput, 'http://modified:11434');

    // Save settings
    const saveButton = screen.getByText('Save Settings');
    await user.click(saveButton);

    // Should save to localStorage
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai-toolkit-settings',
        expect.stringContaining('http://modified:11434')
      );
    });
  });

  it('should display status information when available', async () => {
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      // Should show status information section
      expect(screen.getByText('Status Information')).toBeInTheDocument();
      expect(screen.getByText('Version:')).toBeInTheDocument();
      expect(screen.getByText('Memory Usage:')).toBeInTheDocument();
      expect(screen.getByText('Response Time:')).toBeInTheDocument();
    });
  });

  it('should handle model selection', async () => {
    const user = userEvent.setup();
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      const modelSelect = screen.getByRole('combobox');
      expect(modelSelect).toBeInTheDocument();
    });

    const modelSelect = screen.getByRole('combobox');
    await user.selectOptions(modelSelect, 'llama2');

    expect(modelSelect).toHaveValue('llama2');
  });

  it('should validate numeric inputs', async () => {
    const user = userEvent.setup();
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      const timeoutInput = screen.getByDisplayValue('30000');
      expect(timeoutInput).toBeInTheDocument();
    });

    const timeoutInput = screen.getByDisplayValue('30000');
    
    // Should have min/max constraints
    expect(timeoutInput).toHaveAttribute('min', '1000');
    expect(timeoutInput).toHaveAttribute('max', '300000');
  });

  it('should disable test button during testing', async () => {
    const user = userEvent.setup();
    renderWithProvider(<OllamaSettings />);

    await waitFor(() => {
      const testButton = screen.getByText('Test Connection');
      expect(testButton).toBeInTheDocument();
      expect(testButton).not.toBeDisabled();
    });

    const testButton = screen.getByText('Test Connection');
    await user.click(testButton);

    // Button should be disabled during testing
    const testingButton = screen.getByText('Testing...');
    expect(testingButton).toBeDisabled();
  });
});