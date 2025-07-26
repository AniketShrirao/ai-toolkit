/**
 * Centralized error handler for the AI Toolkit
 * Provides error processing, logging, and recovery coordination
 */
import { ErrorCategory, ErrorSeverity, } from "./ErrorTypes.js";
import { ErrorRecoveryManager } from "./ErrorRecovery";
export class ErrorHandler {
    logger;
    recoveryManager;
    config;
    errorHistory = [];
    errorListeners = [];
    constructor(logger, config = {}) {
        this.logger = logger;
        this.config = {
            enableRecovery: true,
            maxRecoveryAttempts: 3,
            logLevel: "error",
            enableTelemetry: true,
            enableUserNotifications: true,
            ...config,
        };
        this.recoveryManager = new ErrorRecoveryManager(logger);
    }
    /**
     * Handle an error with full processing pipeline
     */
    async handleError(error) {
        const startTime = Date.now();
        let recovered = false;
        let recoveryAttempts = 0;
        try {
            // Log the error
            this.logError(error);
            // Attempt recovery if enabled and error is recoverable
            if (this.config.enableRecovery && error.recoverable) {
                const recoveryResult = await this.recoveryManager.attemptRecovery(error, this.config.maxRecoveryAttempts);
                recovered = recoveryResult.success;
                recoveryAttempts = recoveryResult.attempts;
            }
            // Create error report
            const report = {
                error,
                handled: true,
                recovered,
                recoveryAttempts,
                timestamp: new Date(),
                handlingDuration: Date.now() - startTime,
            };
            // Store in history
            this.errorHistory.push(report);
            // Notify listeners
            this.notifyListeners(error, report);
            // Send telemetry if enabled
            if (this.config.enableTelemetry) {
                this.sendTelemetry(report);
            }
            return report;
        }
        catch (handlingError) {
            // Error occurred while handling the original error
            this.logger.error("Error handler failed", {
                originalError: error.message,
                handlingError: handlingError instanceof Error
                    ? handlingError.message
                    : String(handlingError),
                context: error.context,
            });
            return {
                error,
                handled: false,
                recovered: false,
                recoveryAttempts: 0,
                timestamp: new Date(),
                handlingDuration: Date.now() - startTime,
            };
        }
    }
    /**
     * Handle a generic Error and convert it to BaseError
     */
    async handleGenericError(error, context, category = ErrorCategory.SYSTEM, severity = ErrorSeverity.MEDIUM) {
        // Convert generic error to BaseError
        const baseError = {
            code: "GENERIC_ERROR",
            message: error.message,
            category,
            severity,
            recoverable: severity !== ErrorSeverity.CRITICAL,
            context,
            cause: error,
            recoveryActions: [
                {
                    type: "retry",
                    description: "Retry the operation",
                    automated: true,
                    maxAttempts: 2,
                    delayMs: 1000,
                },
            ],
            troubleshootingSteps: [
                {
                    step: 1,
                    description: "Check error details",
                    action: "Review the error message and stack trace",
                    expected: "Error should provide context about the failure",
                },
            ],
            userMessage: "An unexpected error occurred. Please try again.",
            technicalMessage: error.message,
        };
        return this.handleError(baseError);
    }
    /**
     * Add error event listener
     */
    onError(listener) {
        this.errorListeners.push(listener);
    }
    /**
     * Remove error event listener
     */
    removeErrorListener(listener) {
        const index = this.errorListeners.indexOf(listener);
        if (index > -1) {
            this.errorListeners.splice(index, 1);
        }
    }
    /**
     * Get error metrics
     */
    getMetrics() {
        const totalErrors = this.errorHistory.length;
        const errorsByCategory = {};
        const errorsBySeverity = {};
        // Initialize counters
        Object.values(ErrorCategory).forEach((category) => {
            errorsByCategory[category] = 0;
        });
        Object.values(ErrorSeverity).forEach((severity) => {
            errorsBySeverity[severity] = 0;
        });
        let totalRecovered = 0;
        let totalHandlingTime = 0;
        this.errorHistory.forEach((report) => {
            errorsByCategory[report.error.category]++;
            errorsBySeverity[report.error.severity]++;
            if (report.recovered)
                totalRecovered++;
            totalHandlingTime += report.handlingDuration;
        });
        return {
            totalErrors,
            errorsByCategory,
            errorsBySeverity,
            recoverySuccessRate: totalErrors > 0 ? totalRecovered / totalErrors : 0,
            averageHandlingTime: totalErrors > 0 ? totalHandlingTime / totalErrors : 0,
        };
    }
    /**
     * Clear error history
     */
    clearHistory() {
        this.errorHistory = [];
    }
    /**
     * Get recent errors
     */
    getRecentErrors(limit = 50) {
        return this.errorHistory
            .slice(-limit)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Log error based on severity and configuration
     */
    logError(error) {
        const logData = {
            code: error.code,
            message: error.message,
            category: error.category,
            severity: error.severity,
            context: error.context,
            details: error.details,
            stack: error.cause?.stack,
        };
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                this.logger.error("Critical error occurred", logData);
                break;
            case ErrorSeverity.HIGH:
                this.logger.error("High severity error", logData);
                break;
            case ErrorSeverity.MEDIUM:
                this.logger.warn("Medium severity error", logData);
                break;
            case ErrorSeverity.LOW:
                if (this.config.logLevel === "debug" ||
                    this.config.logLevel === "info") {
                    this.logger.info("Low severity error", logData);
                }
                break;
        }
    }
    /**
     * Notify error listeners
     */
    notifyListeners(error, report) {
        this.errorListeners.forEach((listener) => {
            try {
                listener(error, report);
            }
            catch (listenerError) {
                this.logger.error("Error listener failed", {
                    error: listenerError instanceof Error
                        ? listenerError.message
                        : String(listenerError),
                });
            }
        });
    }
    /**
     * Send error telemetry (placeholder for future implementation)
     */
    sendTelemetry(report) {
        // This would send anonymized error data to telemetry service
        // For now, just log that telemetry would be sent
        this.logger.debug("Telemetry data prepared", {
            category: report.error.category,
            severity: report.error.severity,
            recovered: report.recovered,
            handlingDuration: report.handlingDuration,
        });
    }
}
/**
 * Global error handler instance
 */
let globalErrorHandler = null;
export function initializeGlobalErrorHandler(logger, config) {
    globalErrorHandler = new ErrorHandler(logger, config);
    return globalErrorHandler;
}
export function getGlobalErrorHandler() {
    if (!globalErrorHandler) {
        throw new Error("Global error handler not initialized. Call initializeGlobalErrorHandler first.");
    }
    return globalErrorHandler;
}
/**
 * Convenience function to handle errors globally
 */
export async function handleError(error) {
    return getGlobalErrorHandler().handleError(error);
}
/**
 * Convenience function to handle generic errors globally
 */
export async function handleGenericError(error, context, category, severity) {
    return getGlobalErrorHandler().handleGenericError(error, context, category, severity);
}
//# sourceMappingURL=ErrorHandler.js.map