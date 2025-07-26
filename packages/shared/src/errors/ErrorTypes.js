/**
 * Centralized error type definitions for the AI Toolkit
 * Provides categorized error types with recovery information
 */
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["OLLAMA_CONNECTION"] = "OLLAMA_CONNECTION";
    ErrorCategory["DOCUMENT_PROCESSING"] = "DOCUMENT_PROCESSING";
    ErrorCategory["AI_MODEL"] = "AI_MODEL";
    ErrorCategory["WORKFLOW_EXECUTION"] = "WORKFLOW_EXECUTION";
    ErrorCategory["FILE_SYSTEM"] = "FILE_SYSTEM";
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["AUTHENTICATION"] = "AUTHENTICATION";
    ErrorCategory["AUTHORIZATION"] = "AUTHORIZATION";
    ErrorCategory["NETWORK"] = "NETWORK";
    ErrorCategory["DATABASE"] = "DATABASE";
    ErrorCategory["CACHE"] = "CACHE";
    ErrorCategory["CONFIGURATION"] = "CONFIGURATION";
    ErrorCategory["SYSTEM"] = "SYSTEM";
})(ErrorCategory || (ErrorCategory = {}));
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (ErrorSeverity = {}));
// Ollama Connection Errors
export class OllamaConnectionError extends Error {
    code = "OLLAMA_CONNECTION_FAILED";
    category = ErrorCategory.OLLAMA_CONNECTION;
    severity = ErrorSeverity.HIGH;
    recoverable = true;
    context;
    details;
    cause;
    recoveryActions;
    troubleshootingSteps;
    userMessage;
    technicalMessage;
    constructor(message, context, details, cause) {
        super(message);
        this.name = "OllamaConnectionError";
        this.context = context;
        this.details = details;
        this.cause = cause;
        this.technicalMessage = message;
        this.userMessage =
            "Unable to connect to Ollama. Please ensure Ollama is running and accessible.";
        this.recoveryActions = [
            {
                type: "retry",
                description: "Retry connection with exponential backoff",
                automated: true,
                maxAttempts: 3,
                delayMs: 1000,
            },
            {
                type: "manual",
                description: "Check Ollama installation and start service",
                automated: false,
            },
        ];
        this.troubleshootingSteps = [
            {
                step: 1,
                description: "Check if Ollama is installed",
                action: "Run 'ollama --version' in terminal",
                expected: "Version information should be displayed",
            },
            {
                step: 2,
                description: "Start Ollama service",
                action: "Run 'ollama serve' in terminal",
                expected: "Ollama should start listening on default port",
            },
            {
                step: 3,
                description: "Verify connection",
                action: "Check if http://localhost:11434 is accessible",
                expected: "Ollama API should respond",
            },
        ];
    }
}
export class OllamaModelError extends Error {
    code = "OLLAMA_MODEL_ERROR";
    category = ErrorCategory.AI_MODEL;
    severity = ErrorSeverity.MEDIUM;
    recoverable = true;
    context;
    details;
    cause;
    recoveryActions;
    troubleshootingSteps;
    userMessage;
    technicalMessage;
    constructor(message, context, modelName, details, cause) {
        super(message);
        this.name = "OllamaModelError";
        this.context = context;
        this.details = { ...details, modelName };
        this.cause = cause;
        this.technicalMessage = message;
        this.userMessage = `Model ${modelName || "unknown"} is not available or failed to respond. Please check model availability.`;
        this.recoveryActions = [
            {
                type: "fallback",
                description: "Switch to alternative model",
                automated: true,
            },
            {
                type: "manual",
                description: "Download required model",
                automated: false,
            },
        ];
        this.troubleshootingSteps = [
            {
                step: 1,
                description: "List available models",
                action: "Run 'ollama list' in terminal",
                expected: "List of installed models should be displayed",
            },
            {
                step: 2,
                description: "Download model if missing",
                action: `Run 'ollama pull ${modelName || "llama2"}' in terminal`,
                expected: "Model should download successfully",
            },
        ];
    }
}
// Document Processing Errors
export class DocumentProcessingError extends Error {
    code = "DOCUMENT_PROCESSING_FAILED";
    category = ErrorCategory.DOCUMENT_PROCESSING;
    severity = ErrorSeverity.MEDIUM;
    recoverable = true;
    context;
    details;
    cause;
    recoveryActions;
    troubleshootingSteps;
    userMessage;
    technicalMessage;
    constructor(message, context, documentPath, details, cause) {
        super(message);
        this.name = "DocumentProcessingError";
        this.context = context;
        this.details = { ...details, documentPath };
        this.cause = cause;
        this.technicalMessage = message;
        this.userMessage =
            "Failed to process document. The file may be corrupted or in an unsupported format.";
        this.recoveryActions = [
            {
                type: "fallback",
                description: "Use basic text extraction",
                automated: true,
            },
            {
                type: "manual",
                description: "Convert document to supported format",
                automated: false,
            },
        ];
        this.troubleshootingSteps = [
            {
                step: 1,
                description: "Check file format",
                action: "Verify file extension and MIME type",
                expected: "File should be PDF, DOCX, or other supported format",
            },
            {
                step: 2,
                description: "Check file integrity",
                action: "Try opening file in appropriate application",
                expected: "File should open without errors",
            },
        ];
    }
}
// Workflow Execution Errors
export class WorkflowExecutionError extends Error {
    code = "WORKFLOW_EXECUTION_FAILED";
    category = ErrorCategory.WORKFLOW_EXECUTION;
    severity = ErrorSeverity.HIGH;
    recoverable = true;
    context;
    details;
    cause;
    recoveryActions;
    troubleshootingSteps;
    userMessage;
    technicalMessage;
    constructor(message, context, workflowId, stepId, details, cause) {
        super(message);
        this.name = "WorkflowExecutionError";
        this.context = context;
        this.details = { ...details, workflowId, stepId };
        this.cause = cause;
        this.technicalMessage = message;
        this.userMessage =
            "Workflow execution failed. Some steps may need to be retried or reconfigured.";
        this.recoveryActions = [
            {
                type: "retry",
                description: "Retry failed step",
                automated: true,
                maxAttempts: 2,
                delayMs: 5000,
            },
            {
                type: "fallback",
                description: "Skip failed step and continue",
                automated: false,
            },
        ];
        this.troubleshootingSteps = [
            {
                step: 1,
                description: "Check workflow configuration",
                action: "Review workflow definition for errors",
                expected: "All steps should have valid configuration",
            },
            {
                step: 2,
                description: "Check dependencies",
                action: "Verify all required services are running",
                expected: "Ollama and other dependencies should be accessible",
            },
        ];
    }
}
// File System Errors
export class FileSystemError extends Error {
    code = "FILE_SYSTEM_ERROR";
    category = ErrorCategory.FILE_SYSTEM;
    severity = ErrorSeverity.MEDIUM;
    recoverable = true;
    context;
    details;
    cause;
    recoveryActions;
    troubleshootingSteps;
    userMessage;
    technicalMessage;
    constructor(message, context, operation, path, details, cause) {
        super(message);
        this.name = "FileSystemError";
        this.context = context;
        this.details = { ...details, operation, path };
        this.cause = cause;
        this.technicalMessage = message;
        this.userMessage =
            "File operation failed. Please check file permissions and disk space.";
        this.recoveryActions = [
            {
                type: "retry",
                description: "Retry file operation",
                automated: true,
                maxAttempts: 2,
                delayMs: 1000,
            },
            {
                type: "manual",
                description: "Check file permissions and disk space",
                automated: false,
            },
        ];
        this.troubleshootingSteps = [
            {
                step: 1,
                description: "Check file permissions",
                action: "Verify read/write permissions for the file path",
                expected: "Application should have necessary permissions",
            },
            {
                step: 2,
                description: "Check disk space",
                action: "Verify sufficient disk space is available",
                expected: "At least 1GB free space recommended",
            },
        ];
    }
}
// Validation Errors
export class ValidationError extends Error {
    code = "VALIDATION_ERROR";
    category = ErrorCategory.VALIDATION;
    severity = ErrorSeverity.LOW;
    recoverable = true;
    context;
    details;
    cause;
    recoveryActions;
    troubleshootingSteps;
    userMessage;
    technicalMessage;
    constructor(message, context, field, value, details, cause) {
        super(message);
        this.name = "ValidationError";
        this.context = context;
        this.details = { ...details, field, value };
        this.cause = cause;
        this.technicalMessage = message;
        this.userMessage =
            "Invalid input provided. Please check your data and try again.";
        this.recoveryActions = [
            {
                type: "manual",
                description: "Correct input and retry",
                automated: false,
            },
        ];
        this.troubleshootingSteps = [
            {
                step: 1,
                description: "Check input format",
                action: "Verify input matches expected format",
                expected: "Input should conform to validation rules",
            },
        ];
    }
}
// Configuration Errors
export class ConfigurationError extends Error {
    code = "CONFIGURATION_ERROR";
    category = ErrorCategory.CONFIGURATION;
    severity = ErrorSeverity.HIGH;
    recoverable = true;
    context;
    details;
    cause;
    recoveryActions;
    troubleshootingSteps;
    userMessage;
    technicalMessage;
    constructor(message, context, configKey, details, cause) {
        super(message);
        this.name = "ConfigurationError";
        this.context = context;
        this.details = { ...details, configKey };
        this.cause = cause;
        this.technicalMessage = message;
        this.userMessage =
            "Configuration error detected. Please check your settings.";
        this.recoveryActions = [
            {
                type: "fallback",
                description: "Use default configuration",
                automated: true,
            },
            {
                type: "manual",
                description: "Update configuration file",
                automated: false,
            },
        ];
        this.troubleshootingSteps = [
            {
                step: 1,
                description: "Check configuration file",
                action: "Verify configuration file exists and is valid JSON",
                expected: "Configuration should be properly formatted",
            },
            {
                step: 2,
                description: "Validate configuration values",
                action: "Check all required configuration keys are present",
                expected: "All required settings should be configured",
            },
        ];
    }
}
// System Errors
export class SystemError extends Error {
    code = "SYSTEM_ERROR";
    category = ErrorCategory.SYSTEM;
    severity = ErrorSeverity.CRITICAL;
    recoverable = false;
    context;
    details;
    cause;
    recoveryActions;
    troubleshootingSteps;
    userMessage;
    technicalMessage;
    constructor(message, context, details, cause) {
        super(message);
        this.name = "SystemError";
        this.context = context;
        this.details = details;
        this.cause = cause;
        this.technicalMessage = message;
        this.userMessage =
            "A system error occurred. Please contact support if the problem persists.";
        this.recoveryActions = [
            {
                type: "manual",
                description: "Restart application",
                automated: false,
            },
        ];
        this.troubleshootingSteps = [
            {
                step: 1,
                description: "Check system resources",
                action: "Verify CPU and memory usage",
                expected: "System should have adequate resources",
            },
            {
                step: 2,
                description: "Check logs",
                action: "Review application logs for additional details",
                expected: "Logs should provide more context about the error",
            },
        ];
    }
}
//# sourceMappingURL=ErrorTypes.js.map