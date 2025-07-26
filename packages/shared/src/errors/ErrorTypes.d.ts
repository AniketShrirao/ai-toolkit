/**
 * Centralized error type definitions for the AI Toolkit
 * Provides categorized error types with recovery information
 */
export declare enum ErrorCategory {
    OLLAMA_CONNECTION = "OLLAMA_CONNECTION",
    DOCUMENT_PROCESSING = "DOCUMENT_PROCESSING",
    AI_MODEL = "AI_MODEL",
    WORKFLOW_EXECUTION = "WORKFLOW_EXECUTION",
    FILE_SYSTEM = "FILE_SYSTEM",
    VALIDATION = "VALIDATION",
    AUTHENTICATION = "AUTHENTICATION",
    AUTHORIZATION = "AUTHORIZATION",
    NETWORK = "NETWORK",
    DATABASE = "DATABASE",
    CACHE = "CACHE",
    CONFIGURATION = "CONFIGURATION",
    SYSTEM = "SYSTEM"
}
export declare enum ErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface ErrorContext {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    operation?: string;
    component?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface RecoveryAction {
    type: "retry" | "fallback" | "manual" | "ignore";
    description: string;
    automated: boolean;
    maxAttempts?: number;
    delayMs?: number;
}
export interface TroubleshootingStep {
    step: number;
    description: string;
    action: string;
    expected: string;
}
export interface BaseError {
    code: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    context: ErrorContext;
    details?: Record<string, any>;
    cause?: Error;
    recoveryActions: RecoveryAction[];
    troubleshootingSteps: TroubleshootingStep[];
    userMessage: string;
    technicalMessage: string;
}
export declare class OllamaConnectionError extends Error implements BaseError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    context: ErrorContext;
    details?: Record<string, any>;
    cause?: Error;
    recoveryActions: RecoveryAction[];
    troubleshootingSteps: TroubleshootingStep[];
    userMessage: string;
    technicalMessage: string;
    constructor(message: string, context: ErrorContext, details?: Record<string, any>, cause?: Error);
}
export declare class OllamaModelError extends Error implements BaseError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    context: ErrorContext;
    details?: Record<string, any>;
    cause?: Error;
    recoveryActions: RecoveryAction[];
    troubleshootingSteps: TroubleshootingStep[];
    userMessage: string;
    technicalMessage: string;
    constructor(message: string, context: ErrorContext, modelName?: string, details?: Record<string, any>, cause?: Error);
}
export declare class DocumentProcessingError extends Error implements BaseError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    context: ErrorContext;
    details?: Record<string, any>;
    cause?: Error;
    recoveryActions: RecoveryAction[];
    troubleshootingSteps: TroubleshootingStep[];
    userMessage: string;
    technicalMessage: string;
    constructor(message: string, context: ErrorContext, documentPath?: string, details?: Record<string, any>, cause?: Error);
}
export declare class WorkflowExecutionError extends Error implements BaseError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    context: ErrorContext;
    details?: Record<string, any>;
    cause?: Error;
    recoveryActions: RecoveryAction[];
    troubleshootingSteps: TroubleshootingStep[];
    userMessage: string;
    technicalMessage: string;
    constructor(message: string, context: ErrorContext, workflowId?: string, stepId?: string, details?: Record<string, any>, cause?: Error);
}
export declare class FileSystemError extends Error implements BaseError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    context: ErrorContext;
    details?: Record<string, any>;
    cause?: Error;
    recoveryActions: RecoveryAction[];
    troubleshootingSteps: TroubleshootingStep[];
    userMessage: string;
    technicalMessage: string;
    constructor(message: string, context: ErrorContext, operation?: string, path?: string, details?: Record<string, any>, cause?: Error);
}
export declare class ValidationError extends Error implements BaseError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    context: ErrorContext;
    details?: Record<string, any>;
    cause?: Error;
    recoveryActions: RecoveryAction[];
    troubleshootingSteps: TroubleshootingStep[];
    userMessage: string;
    technicalMessage: string;
    constructor(message: string, context: ErrorContext, field?: string, value?: any, details?: Record<string, any>, cause?: Error);
}
export declare class ConfigurationError extends Error implements BaseError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    context: ErrorContext;
    details?: Record<string, any>;
    cause?: Error;
    recoveryActions: RecoveryAction[];
    troubleshootingSteps: TroubleshootingStep[];
    userMessage: string;
    technicalMessage: string;
    constructor(message: string, context: ErrorContext, configKey?: string, details?: Record<string, any>, cause?: Error);
}
export declare class SystemError extends Error implements BaseError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    recoverable: boolean;
    context: ErrorContext;
    details?: Record<string, any>;
    cause?: Error;
    recoveryActions: RecoveryAction[];
    troubleshootingSteps: TroubleshootingStep[];
    userMessage: string;
    technicalMessage: string;
    constructor(message: string, context: ErrorContext, details?: Record<string, any>, cause?: Error);
}
//# sourceMappingURL=ErrorTypes.d.ts.map