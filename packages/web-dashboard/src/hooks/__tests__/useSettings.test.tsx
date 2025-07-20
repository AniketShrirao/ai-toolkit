import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider, useSettings } from '../useSettings';
import { SystemSettings, SystemHealth, UIWorkflowDefinition as WorkflowDefinition } from '@ai-toolkit/shared';

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

// Test component that uses the hook
const TestComponent: React.FC = () => {
  const {
    settings,
    health,
    workflows,
    loading,
    error,
    updateSettings,
    resetSettings,
    refreshHealth,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
  } = useSettings();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="settings">{settings ? JSON.stringify(settings) : 'no-settings'}</div>
      <div data-testid="health">{health ? JSON.stringify(health) : 'no-health'}</div>
      <div data-testid="workflows">{JSON.stringify(workflows)}</div>
      
      <button onClick={() => updateSettings({ ollama: { ...settings!.ollama, serverUrl: 'http://test:11434' } })}>
        Update Settings
      </button>
      <button onClick={resetSettings}>Reset Settings</button>
      <button onClick={refreshHealth}>Refresh Health</button>
      <button onClick={() => createWorkflow({
        name: 'Test Workflow',
        description: 'Test Description',
        trigger: { type: 'manual', config: {} },
        steps: [],
        enabled: true,
      })}>
        Create Workflow
      </button>
      <button onClick={() => updateWorkflow('1', { name: 'Updated Workflow' })}>
        Update Workflow
      </button>
      <button onClick={() => deleteWorkflow('1')}>Delete Workflow</button>
      <button onClick={() => toggleWorkflow('1', false)}>Toggle Workflow</button>
    </div>
  );
};

describe('useSettings Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should provide default settings when no saved settings exist', async () => {
    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const settingsElement = screen.getByTestId('settings');
    const settings = JSON.parse(settingsElement.textContent!);
    
    expect(settings.ollama.serverUrl).toBe('http://localhost:11434');
    expect(settings.processing.autoProcess).toBe(true);
    expect(settings.preferences.theme).toBe('auto');
  });

  it('should load saved settings from localStorage', async () => {
    const savedSettings: SystemSettings = {
      ollama: {
        serverUrl: 'http://saved:11434',
        defaultModel: 'llama2',
        timeout: 60000,
        maxRetries: 5,
        connectionPoolSize: 10,
      },
      processing: {
        autoProcess: false,
        maxConcurrentJobs: 5,
        enableNotifications: false,
        defaultAnalysisTypes: ['requirements'],
        outputFormat: 'markdown',
      },
      workflows: {
        enableAutoWorkflows: true,
        watchedFolders: ['/test'],
        defaultWorkflowTimeout: 600000,
        retryFailedJobs: false,
        maxRetryAttempts: 1,
      },
      preferences: {
        theme: 'dark',
        language: 'es',
        timezone: 'America/New_York',
        dateFormat: 'dd/MM/yyyy',
        notifications: {
          desktop: false,
          email: true,
          sound: false,
        },
      },
    };

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedSettings));

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const settingsElement = screen.getByTestId('settings');
    const settings = JSON.parse(settingsElement.textContent!);
    
    expect(settings.ollama.serverUrl).toBe('http://saved:11434');
    expect(settings.processing.autoProcess).toBe(false);
    expect(settings.preferences.theme).toBe('dark');
  });

  it('should update settings and save to localStorage', async () => {
    const user = userEvent.setup();

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    await user.click(screen.getByText('Update Settings'));

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai-toolkit-settings',
        expect.stringContaining('http://test:11434')
      );
    });

    const settingsElement = screen.getByTestId('settings');
    const settings = JSON.parse(settingsElement.textContent!);
    expect(settings.ollama.serverUrl).toBe('http://test:11434');
  });

  it('should reset settings to defaults', async () => {
    const user = userEvent.setup();

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    await user.click(screen.getByText('Reset Settings'));

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai-toolkit-settings',
        expect.stringContaining('http://localhost:11434')
      );
    });
  });

  it('should refresh health data', async () => {
    const user = userEvent.setup();

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Initial health should be set
    expect(screen.getByTestId('health')).not.toHaveTextContent('no-health');

    await user.click(screen.getByText('Refresh Health'));

    // Health should still be present after refresh
    await waitFor(() => {
      expect(screen.getByTestId('health')).not.toHaveTextContent('no-health');
    });
  });

  it('should create a new workflow', async () => {
    const user = userEvent.setup();

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    await user.click(screen.getByText('Create Workflow'));

    await waitFor(() => {
      const workflows = JSON.parse(screen.getByTestId('workflows').textContent!);
      expect(workflows).toHaveLength(1);
      expect(workflows[0].name).toBe('Test Workflow');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'ai-toolkit-workflows',
        expect.stringContaining('Test Workflow')
      );
    });
  });

  it('should update an existing workflow', async () => {
    const user = userEvent.setup();
    const existingWorkflows: WorkflowDefinition[] = [{
      id: '1',
      name: 'Original Workflow',
      description: 'Original Description',
      trigger: { type: 'manual', config: {} },
      steps: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'ai-toolkit-workflows') {
        return JSON.stringify(existingWorkflows);
      }
      return null;
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    await user.click(screen.getByText('Update Workflow'));

    await waitFor(() => {
      const workflows = JSON.parse(screen.getByTestId('workflows').textContent!);
      expect(workflows[0].name).toBe('Updated Workflow');
    });
  });

  it('should delete a workflow', async () => {
    const user = userEvent.setup();
    const existingWorkflows: WorkflowDefinition[] = [{
      id: '1',
      name: 'To Delete',
      description: 'Will be deleted',
      trigger: { type: 'manual', config: {} },
      steps: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'ai-toolkit-workflows') {
        return JSON.stringify(existingWorkflows);
      }
      return null;
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    await user.click(screen.getByText('Delete Workflow'));

    await waitFor(() => {
      const workflows = JSON.parse(screen.getByTestId('workflows').textContent!);
      expect(workflows).toHaveLength(0);
    });
  });

  it('should toggle workflow enabled state', async () => {
    const user = userEvent.setup();
    const existingWorkflows: WorkflowDefinition[] = [{
      id: '1',
      name: 'Toggle Test',
      description: 'Test toggle',
      trigger: { type: 'manual', config: {} },
      steps: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }];

    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'ai-toolkit-workflows') {
        return JSON.stringify(existingWorkflows);
      }
      return null;
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    await user.click(screen.getByText('Toggle Workflow'));

    await waitFor(() => {
      const workflows = JSON.parse(screen.getByTestId('workflows').textContent!);
      expect(workflows[0].enabled).toBe(false);
    });
  });

  it('should handle errors gracefully', async () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    render(
      <SettingsProvider>
        <TestComponent />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load settings');
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Should still provide default settings
    const settingsElement = screen.getByTestId('settings');
    const settings = JSON.parse(settingsElement.textContent!);
    expect(settings.ollama.serverUrl).toBe('http://localhost:11434');
  });

  it('should throw error when used outside provider', () => {
    const TestComponentWithoutProvider = () => {
      useSettings();
      return <div>Test</div>;
    };

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponentWithoutProvider />);
    }).toThrow('useSettings must be used within a SettingsProvider');

    consoleSpy.mockRestore();
  });
});