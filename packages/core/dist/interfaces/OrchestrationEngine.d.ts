import { ProcessedDocument, CoreWorkflowDefinition as WorkflowDefinition, WorkflowInput, WorkflowResult, ProcessingOptions, AnalysisType, ProjectEstimate, Requirement } from "@ai-toolkit/shared";
export interface OrchestrationEngine {
    processDocument(filePath: string, analysisTypes: AnalysisType[], options?: ProcessingOptions): Promise<ProcessedDocument>;
    processBatch(filePaths: string[], analysisTypes: AnalysisType[], options?: ProcessingOptions): Promise<ProcessedDocument[]>;
    executeWorkflow(workflowId: string, input: WorkflowInput, options?: ProcessingOptions): Promise<WorkflowResult>;
    createWorkflowFromTemplate(templateName: string, parameters: Record<string, any>): Promise<WorkflowDefinition>;
    analyzeAndEstimate(documents: ProcessedDocument[], options?: ProcessingOptions): Promise<{
        analysis: ProcessedDocument[];
        estimate: ProjectEstimate;
        requirements: Requirement[];
    }>;
    generateCommunication(analysisResults: ProcessedDocument[], estimate: ProjectEstimate, communicationType: "email" | "proposal" | "status-report", options?: {
        clientName?: string;
        projectName?: string;
        customization?: Record<string, any>;
    }): Promise<{
        subject: string;
        content: string;
        attachments?: string[];
    }>;
    getSystemStatus(): Promise<{
        services: Array<{
            name: string;
            status: "healthy" | "degraded" | "down";
            lastCheck: Date;
            details?: string;
        }>;
        queues: Array<{
            name: string;
            pending: number;
            active: number;
            completed: number;
            failed: number;
        }>;
        resources: {
            memory: number;
            cpu: number;
            disk: number;
        };
    }>;
    updateConfiguration(config: {
        ollama?: {
            host: string;
            port: number;
            defaultModel: string;
        };
        processing?: {
            maxConcurrent: number;
            timeout: number;
            retries: number;
        };
        storage?: {
            basePath: string;
            cleanup: {
                enabled: boolean;
                retentionDays: number;
            };
        };
    }): Promise<void>;
    getConfiguration(): Promise<{
        ollama: {
            host: string;
            port: number;
            defaultModel: string;
            connected: boolean;
        };
        processing: {
            maxConcurrent: number;
            timeout: number;
            retries: number;
        };
        storage: {
            basePath: string;
            cleanup: {
                enabled: boolean;
                retentionDays: number;
            };
        };
    }>;
    healthCheck(): Promise<{
        overall: "healthy" | "degraded" | "down";
        services: Record<string, boolean>;
        timestamp: Date;
    }>;
    onDocumentProcessed(callback: (document: ProcessedDocument) => void): void;
    onWorkflowCompleted(callback: (result: WorkflowResult) => void): void;
    onError(callback: (error: Error, context: any) => void): void;
}
//# sourceMappingURL=OrchestrationEngine.d.ts.map