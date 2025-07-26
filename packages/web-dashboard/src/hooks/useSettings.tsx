import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SystemSettings, SystemHealth, UIWorkflowDefinition as WorkflowDefinition } from '@ai-toolkit/shared';

interface SettingsContextType {
  settings: SystemSettings | null;
  health: SystemHealth | null;
  workflows: WorkflowDefinition[];
  loading: boolean;
  error: string | null;
  
  // Settings management
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  
  // Health monitoring
  refreshHealth: () => Promise<void>;
  
  // Workflow management
  createWorkflow: (workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  toggleWorkflow: (id: string, enabled: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: SystemSettings = {
  ollama: {
    serverUrl: 'http://localhost:11434',
    defaultModel: '',
    timeout: 30000,
    maxRetries: 3,
    connectionPoolSize: 5,
  },
  cloudLLM: {
    provider: 'ollama',
    fallbackEnabled: false,
    fallbackProviders: ['ollama'],
    openai: {
      apiKey: '',
      defaultModel: 'gpt-4o-mini',
      timeout: 30000,
      maxRetries: 3,
    },
    anthropic: {
      apiKey: '',
      defaultModel: 'claude-3-5-sonnet-20241022',
      timeout: 30000,
      maxRetries: 3,
    },
  },
  processing: {
    autoProcess: true,
    maxConcurrentJobs: 3,
    enableNotifications: true,
    defaultAnalysisTypes: ['requirements', 'summary'],
    outputFormat: 'json',
  },
  workflows: {
    enableAutoWorkflows: false,
    watchedFolders: [],
    defaultWorkflowTimeout: 300000,
    retryFailedJobs: true,
    maxRetryAttempts: 3,
  },
  preferences: {
    theme: 'auto',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dateFormat: 'MM/dd/yyyy',
    notifications: {
      desktop: true,
      email: false,
      sound: true,
    },
  },
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadWorkflows();
    refreshHealth();
    
    // Set up health monitoring interval
    const healthInterval = setInterval(refreshHealth, 30000); // Every 30 seconds
    
    return () => clearInterval(healthInterval);
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from an API
      const savedSettings = localStorage.getItem('ai-toolkit-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        setSettings(defaultSettings);
      }
    } catch (err) {
      setError('Failed to load settings');
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflows = async () => {
    try {
      // In a real implementation, this would fetch from an API
      const savedWorkflows = localStorage.getItem('ai-toolkit-workflows');
      if (savedWorkflows) {
        setWorkflows(JSON.parse(savedWorkflows));
      }
    } catch (err) {
      console.error('Failed to load workflows:', err);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const updatedSettings = { ...settings!, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem('ai-toolkit-settings', JSON.stringify(updatedSettings));
      
      // In a real implementation, this would also send to API
      // await fetch('/api/settings', { method: 'PUT', body: JSON.stringify(updatedSettings) });
    } catch (err) {
      setError('Failed to update settings');
      throw err;
    }
  };

  const resetSettings = async () => {
    try {
      setSettings(defaultSettings);
      localStorage.setItem('ai-toolkit-settings', JSON.stringify(defaultSettings));
    } catch (err) {
      setError('Failed to reset settings');
      throw err;
    }
  };

  const refreshHealth = async () => {
    try {
      // Fetch real health data from API
      const response = await fetch('http://localhost:3002/api/health');
      
      // Handle both successful and error responses (API returns 503 for unhealthy)
      if (response.ok || response.status === 503) {
        const healthData = await response.json();
        
        // Transform API response to match our SystemHealth interface
        const transformedHealth: SystemHealth = {
          ollama: {
            connected: healthData.components.ollama.connected,
            version: healthData.components.ollama.version || '0.1.17',
            availableModels: healthData.components.ollama.availableModels || [],
            loadedModel: healthData.components.ollama.loadedModel || null,
            memoryUsage: healthData.components.ollama.memoryUsage || 0,
            responseTime: healthData.components.ollama.responseTime || 0,
          },
          cloudLLM: {
            activeProvider: settings?.cloudLLM?.provider || 'ollama',
            providers: {
              ollama: { 
                connected: healthData.components.ollama.connected, 
                available: true 
              },
              openai: { 
                connected: settings?.cloudLLM?.openai?.apiKey ? false : false, // Will be updated when cloud LLM health is implemented
                available: !!settings?.cloudLLM?.openai?.apiKey,
                rateLimitRemaining: 1000
              },
              anthropic: { 
                connected: settings?.cloudLLM?.anthropic?.apiKey ? false : false, // Will be updated when cloud LLM health is implemented
                available: !!settings?.cloudLLM?.anthropic?.apiKey,
                rateLimitRemaining: 1000
              },
            },
            fallbackActive: false,
          },
          system: {
            cpuUsage: healthData.components.system.memory?.percentage || 0,
            memoryUsage: healthData.components.system.memory?.percentage || 0,
            diskUsage: 50, // Mock value since API doesn't provide this in the expected format
            uptime: healthData.uptime * 1000, // Convert seconds to milliseconds
          },
          queue: {
            activeJobs: 0, // Mock values - these would come from a queue service
            pendingJobs: 0,
            completedJobs: 0,
            failedJobs: 0,
          },
        };
        
        setHealth(transformedHealth);
      } else {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Failed to refresh health:', err);
      // Set a fallback health state
      setHealth({
        ollama: {
          connected: false,
          version: 'Unknown',
          availableModels: [],
          loadedModel: null,
          memoryUsage: 0,
          responseTime: 0,
        },
        cloudLLM: {
          activeProvider: 'ollama',
          providers: {
            ollama: { connected: false, available: false },
            openai: { connected: false, available: false },
            anthropic: { connected: false, available: false },
          },
          fallbackActive: false,
        },
        system: {
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          uptime: 0,
        },
        queue: {
          activeJobs: 0,
          pendingJobs: 0,
          completedJobs: 0,
          failedJobs: 0,
        },
      });
    }
  };

  const createWorkflow = async (workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newWorkflow: WorkflowDefinition = {
        ...workflow,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const updatedWorkflows = [...workflows, newWorkflow];
      setWorkflows(updatedWorkflows);
      localStorage.setItem('ai-toolkit-workflows', JSON.stringify(updatedWorkflows));
    } catch (err) {
      setError('Failed to create workflow');
      throw err;
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<WorkflowDefinition>) => {
    try {
      const updatedWorkflows = workflows.map(w => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date() } : w
      );
      setWorkflows(updatedWorkflows);
      localStorage.setItem('ai-toolkit-workflows', JSON.stringify(updatedWorkflows));
    } catch (err) {
      setError('Failed to update workflow');
      throw err;
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      const updatedWorkflows = workflows.filter(w => w.id !== id);
      setWorkflows(updatedWorkflows);
      localStorage.setItem('ai-toolkit-workflows', JSON.stringify(updatedWorkflows));
    } catch (err) {
      setError('Failed to delete workflow');
      throw err;
    }
  };

  const toggleWorkflow = async (id: string, enabled: boolean) => {
    await updateWorkflow(id, { enabled });
  };

  const value: SettingsContextType = {
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
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};