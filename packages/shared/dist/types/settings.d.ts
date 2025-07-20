/**
 * Settings and configuration types
 */
export interface OllamaSettings {
    serverUrl: string;
    defaultModel: string;
    timeout: number;
    maxRetries: number;
    connectionPoolSize: number;
}
export interface ProcessingSettings {
    autoProcess: boolean;
    maxConcurrentJobs: number;
    enableNotifications: boolean;
    defaultAnalysisTypes: string[];
    outputFormat: "json" | "markdown" | "html";
}
export interface WorkflowSettings {
    enableAutoWorkflows: boolean;
    watchedFolders: string[];
    defaultWorkflowTimeout: number;
    retryFailedJobs: boolean;
    maxRetryAttempts: number;
}
export interface UserPreferences {
    theme: "light" | "dark" | "auto";
    language: string;
    timezone: string;
    dateFormat: string;
    notifications: {
        desktop: boolean;
        email: boolean;
        sound: boolean;
    };
}
export interface SystemSettings {
    ollama: OllamaSettings;
    processing: ProcessingSettings;
    workflows: WorkflowSettings;
    preferences: UserPreferences;
}
export interface SystemHealth {
    ollama: {
        connected: boolean;
        version: string;
        availableModels: string[];
        loadedModel: string | null;
        memoryUsage: number;
        responseTime: number;
    };
    system: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        uptime: number;
    };
    queue: {
        activeJobs: number;
        pendingJobs: number;
        completedJobs: number;
        failedJobs: number;
    };
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    trigger: {
        type: "manual" | "folder-watch" | "schedule";
        config: any;
    };
    steps: WorkflowStep[];
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: "document-analysis" | "estimation" | "communication" | "custom";
    config: any;
    order: number;
}
//# sourceMappingURL=settings.d.ts.map