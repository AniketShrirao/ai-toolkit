import { CoreWorkflowDefinition } from "@ai-toolkit/shared";
export interface WorkflowConfigFile {
    version: string;
    workflows: CoreWorkflowDefinition[];
    templates?: Record<string, any>;
    settings?: {
        defaultTimeout?: number;
        maxRetries?: number;
        concurrency?: number;
    };
}
export declare class WorkflowDefinitionLoader {
    private configPath;
    private loadedWorkflows;
    constructor(configPath?: string);
    loadWorkflows(): Promise<CoreWorkflowDefinition[]>;
    saveWorkflows(workflows: CoreWorkflowDefinition[]): Promise<void>;
    loadWorkflow(workflowId: string): Promise<CoreWorkflowDefinition | null>;
    saveWorkflow(workflow: CoreWorkflowDefinition): Promise<void>;
    deleteWorkflow(workflowId: string): Promise<boolean>;
    createWorkflowTemplate(): CoreWorkflowDefinition;
    validateWorkflowConfig(config: any): {
        valid: boolean;
        errors: string[];
    };
    private isCompatibleVersion;
    private processWorkflows;
    private processSteps;
    private validateWorkflowDefinition;
    createDocumentProcessingWorkflow(name: string, description: string): CoreWorkflowDefinition;
    createEstimationWorkflow(name: string, description: string): CoreWorkflowDefinition;
}
//# sourceMappingURL=WorkflowDefinitionLoader.d.ts.map