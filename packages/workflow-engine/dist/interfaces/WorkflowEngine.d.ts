import { CoreWorkflowDefinition as WorkflowDefinition, Workflow, WorkflowInput, WorkflowResult, WorkflowExecution, WorkflowStatus, CronSchedule, ProcessingOptions } from "@ai-toolkit/shared";
export interface WorkflowEngine {
    createWorkflow(definition: WorkflowDefinition): Promise<Workflow>;
    getWorkflow(workflowId: string): Promise<Workflow | null>;
    updateWorkflow(workflowId: string, updates: Partial<WorkflowDefinition>): Promise<Workflow>;
    deleteWorkflow(workflowId: string): Promise<boolean>;
    listWorkflows(filters?: {
        enabled?: boolean;
        type?: string;
        tags?: string[];
    }): Promise<WorkflowDefinition[]>;
    executeWorkflow(workflowId: string, input: WorkflowInput, options?: ProcessingOptions): Promise<WorkflowResult>;
    executeWorkflowSync(workflowId: string, input: WorkflowInput, options?: ProcessingOptions): Promise<WorkflowResult>;
    executeWorkflowAsync(workflowId: string, input: WorkflowInput, options?: ProcessingOptions): Promise<string>;
    getWorkflowStatus(executionId: string): Promise<WorkflowStatus>;
    getWorkflowExecution(executionId: string): Promise<WorkflowExecution | null>;
    listActiveWorkflows(): Promise<WorkflowExecution[]>;
    getExecutionHistory(workflowId?: string, limit?: number): Promise<WorkflowExecution[]>;
    pauseWorkflow(executionId: string): Promise<boolean>;
    resumeWorkflow(executionId: string): Promise<boolean>;
    cancelWorkflow(executionId: string): Promise<boolean>;
    retryWorkflow(executionId: string): Promise<string>;
    scheduleWorkflow(workflowId: string, schedule: CronSchedule): Promise<boolean>;
    unscheduleWorkflow(workflowId: string): Promise<boolean>;
    listScheduledWorkflows(): Promise<Array<{
        workflowId: string;
        schedule: CronSchedule;
        nextRun: Date;
        enabled: boolean;
    }>>;
    addFileWatcher(workflowId: string, watchPath: string, options?: {
        recursive?: boolean;
        filePattern?: string;
        ignorePattern?: string;
    }): Promise<string>;
    removeFileWatcher(watcherId: string): Promise<boolean>;
    listFileWatchers(): Promise<Array<{
        id: string;
        workflowId: string;
        path: string;
        active: boolean;
    }>>;
    validateWorkflow(definition: WorkflowDefinition): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    testWorkflow(definition: WorkflowDefinition, testInput: WorkflowInput): Promise<{
        success: boolean;
        result?: WorkflowResult;
        errors?: string[];
    }>;
    getWorkflowMetrics(workflowId: string): Promise<{
        totalExecutions: number;
        successRate: number;
        averageDuration: number;
        lastExecution?: Date;
        errorRate: number;
    }>;
    getSystemMetrics(): Promise<{
        activeWorkflows: number;
        queuedJobs: number;
        completedToday: number;
        failedToday: number;
        systemLoad: number;
    }>;
    updateEngineConfig(config: {
        maxConcurrentWorkflows?: number;
        defaultTimeout?: number;
        retryPolicy?: {
            maxRetries: number;
            backoffStrategy: "linear" | "exponential";
        };
    }): Promise<void>;
    getEngineConfig(): Promise<{
        maxConcurrentWorkflows: number;
        defaultTimeout: number;
        retryPolicy: {
            maxRetries: number;
            backoffStrategy: "linear" | "exponential";
        };
    }>;
    cleanupCompletedExecutions(olderThan: Date): Promise<number>;
    archiveWorkflowData(workflowId: string, olderThan: Date): Promise<boolean>;
    onWorkflowStart(callback: (execution: WorkflowExecution) => void): void;
    onWorkflowComplete(callback: (execution: WorkflowExecution) => void): void;
    onWorkflowError(callback: (execution: WorkflowExecution, error: Error) => void): void;
    onWorkflowProgress(callback: (execution: WorkflowExecution) => void): void;
}
//# sourceMappingURL=WorkflowEngine.d.ts.map