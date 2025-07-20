import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
const SettingsContext = createContext(undefined);
const defaultSettings = {
    ollama: {
        serverUrl: 'http://localhost:11434',
        defaultModel: '',
        timeout: 30000,
        maxRetries: 3,
        connectionPoolSize: 5,
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
export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(null);
    const [health, setHealth] = useState(null);
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            }
            else {
                setSettings(defaultSettings);
            }
        }
        catch (err) {
            setError('Failed to load settings');
            setSettings(defaultSettings);
        }
        finally {
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
        }
        catch (err) {
            console.error('Failed to load workflows:', err);
        }
    };
    const updateSettings = async (newSettings) => {
        try {
            const updatedSettings = { ...settings, ...newSettings };
            setSettings(updatedSettings);
            localStorage.setItem('ai-toolkit-settings', JSON.stringify(updatedSettings));
            // In a real implementation, this would also send to API
            // await fetch('/api/settings', { method: 'PUT', body: JSON.stringify(updatedSettings) });
        }
        catch (err) {
            setError('Failed to update settings');
            throw err;
        }
    };
    const resetSettings = async () => {
        try {
            setSettings(defaultSettings);
            localStorage.setItem('ai-toolkit-settings', JSON.stringify(defaultSettings));
        }
        catch (err) {
            setError('Failed to reset settings');
            throw err;
        }
    };
    const refreshHealth = async () => {
        try {
            // Mock health data - in real implementation, this would fetch from API
            const mockHealth = {
                ollama: {
                    connected: Math.random() > 0.2, // 80% chance of being connected
                    version: '0.1.17',
                    availableModels: ['llama2', 'codellama', 'mistral'],
                    loadedModel: settings?.ollama.defaultModel || null,
                    memoryUsage: Math.random() * 2048, // MB
                    responseTime: Math.random() * 1000 + 100, // ms
                },
                system: {
                    cpuUsage: Math.random() * 100,
                    memoryUsage: Math.random() * 100,
                    diskUsage: Math.random() * 100,
                    uptime: Date.now() - (Math.random() * 86400000), // Random uptime up to 24 hours
                },
                queue: {
                    activeJobs: Math.floor(Math.random() * 5),
                    pendingJobs: Math.floor(Math.random() * 10),
                    completedJobs: Math.floor(Math.random() * 100),
                    failedJobs: Math.floor(Math.random() * 5),
                },
            };
            setHealth(mockHealth);
        }
        catch (err) {
            console.error('Failed to refresh health:', err);
        }
    };
    const createWorkflow = async (workflow) => {
        try {
            const newWorkflow = {
                ...workflow,
                id: Date.now().toString(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const updatedWorkflows = [...workflows, newWorkflow];
            setWorkflows(updatedWorkflows);
            localStorage.setItem('ai-toolkit-workflows', JSON.stringify(updatedWorkflows));
        }
        catch (err) {
            setError('Failed to create workflow');
            throw err;
        }
    };
    const updateWorkflow = async (id, updates) => {
        try {
            const updatedWorkflows = workflows.map(w => w.id === id ? { ...w, ...updates, updatedAt: new Date() } : w);
            setWorkflows(updatedWorkflows);
            localStorage.setItem('ai-toolkit-workflows', JSON.stringify(updatedWorkflows));
        }
        catch (err) {
            setError('Failed to update workflow');
            throw err;
        }
    };
    const deleteWorkflow = async (id) => {
        try {
            const updatedWorkflows = workflows.filter(w => w.id !== id);
            setWorkflows(updatedWorkflows);
            localStorage.setItem('ai-toolkit-workflows', JSON.stringify(updatedWorkflows));
        }
        catch (err) {
            setError('Failed to delete workflow');
            throw err;
        }
    };
    const toggleWorkflow = async (id, enabled) => {
        await updateWorkflow(id, { enabled });
    };
    const value = {
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
    return (_jsx(SettingsContext.Provider, { value: value, children: children }));
};
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
//# sourceMappingURL=useSettings.js.map