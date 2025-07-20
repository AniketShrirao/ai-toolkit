import React, { ReactNode } from 'react';
import { SystemSettings, SystemHealth, UIWorkflowDefinition as WorkflowDefinition } from '@ai-toolkit/shared';
interface SettingsContextType {
    settings: SystemSettings | null;
    health: SystemHealth | null;
    workflows: WorkflowDefinition[];
    loading: boolean;
    error: string | null;
    updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
    resetSettings: () => Promise<void>;
    refreshHealth: () => Promise<void>;
    createWorkflow: (workflow: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => Promise<void>;
    deleteWorkflow: (id: string) => Promise<void>;
    toggleWorkflow: (id: string, enabled: boolean) => Promise<void>;
}
export declare const SettingsProvider: React.FC<{
    children: ReactNode;
}>;
export declare const useSettings: () => SettingsContextType;
export {};
//# sourceMappingURL=useSettings.d.ts.map