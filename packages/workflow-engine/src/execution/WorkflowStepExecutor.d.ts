import { CoreWorkflowStep as WorkflowStep, WorkflowStepType } from "@ai-toolkit/shared";
import { QueueManager } from "../interfaces/QueueManager.js";
export interface StepExecutionContext {
    workflowId: string;
    executionId: string;
    stepId: string;
    input: any;
    previousResults: Map<string, any>;
    globalContext: Record<string, any>;
}
export interface StepExecutionResult {
    success: boolean;
    output?: any;
    error?: string;
    duration: number;
    metadata?: Record<string, any>;
}
export declare class WorkflowStepExecutor {
    private queueManager;
    private stepHandlers;
    constructor(queueManager: QueueManager);
    executeStep(step: WorkflowStep, context: StepExecutionContext): Promise<StepExecutionResult>;
    registerStepHandler(stepType: WorkflowStepType, handler: (context: StepExecutionContext, step: WorkflowStep) => Promise<StepExecutionResult>): void;
    private checkDependencies;
    private registerBuiltInHandlers;
    private waitForJobCompletion;
    createExecutionContext(workflowId: string, executionId: string, stepId: string, input: any, previousResults?: Map<string, any>, globalContext?: Record<string, any>): StepExecutionContext;
    executeStepsInOrder(steps: WorkflowStep[], baseContext: Omit<StepExecutionContext, "stepId">): Promise<Map<string, StepExecutionResult>>;
    validateStepOrder(steps: WorkflowStep[]): {
        valid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=WorkflowStepExecutor.d.ts.map