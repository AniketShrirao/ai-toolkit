/**
 * Centralized error handler for the AI Toolkit
 * Provides error processing, logging, and recovery coordination
 */
import { BaseError, ErrorCategory, ErrorSeverity, ErrorContext } from "./ErrorTypes.js";
import { Logger } from "../logging/Logger";
export interface ErrorHandlerConfig {
    enableRecovery: boolean;
    maxRecoveryAttempts: number;
    logLevel: "debug" | "info" | "warn" | "error";
    enableTelemetry: boolean;
    enableUserNotifications: boolean;
}
export interface ErrorReport {
    error: BaseError;
    handled: boolean;
    recovered: boolean;
    recoveryAttempts: number;
    timestamp: Date;
    handlingDuration: number;
}
export interface ErrorMetrics {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recoverySuccessRate: number;
    averageHandlingTime: number;
}
export declare class ErrorHandler {
    private logger;
    private recoveryManager;
    private config;
    private errorHistory;
    private errorListeners;
    constructor(logger: Logger, config?: Partial<ErrorHandlerConfig>);
    /**
     * Handle an error with full processing pipeline
     */
    handleError(error: BaseError): Promise<ErrorReport>;
    /**
     * Handle a generic Error and convert it to BaseError
     */
    handleGenericError(error: Error, context: ErrorContext, category?: ErrorCategory, severity?: ErrorSeverity): Promise<ErrorReport>;
    /**
     * Add error event listener
     */
    onError(listener: (error: BaseError, report: ErrorReport) => void): void;
    /**
     * Remove error event listener
     */
    removeErrorListener(listener: (error: BaseError, report: ErrorReport) => void): void;
    /**
     * Get error metrics
     */
    getMetrics(): ErrorMetrics;
    /**
     * Clear error history
     */
    clearHistory(): void;
    /**
     * Get recent errors
     */
    getRecentErrors(limit?: number): ErrorReport[];
    /**
     * Log error based on severity and configuration
     */
    private logError;
    /**
     * Notify error listeners
     */
    private notifyListeners;
    /**
     * Send error telemetry (placeholder for future implementation)
     */
    private sendTelemetry;
}
export declare function initializeGlobalErrorHandler(logger: Logger, config?: Partial<ErrorHandlerConfig>): ErrorHandler;
export declare function getGlobalErrorHandler(): ErrorHandler;
/**
 * Convenience function to handle errors globally
 */
export declare function handleError(error: BaseError): Promise<ErrorReport>;
/**
 * Convenience function to handle generic errors globally
 */
export declare function handleGenericError(error: Error, context: ErrorContext, category?: ErrorCategory, severity?: ErrorSeverity): Promise<ErrorReport>;
//# sourceMappingURL=ErrorHandler.d.ts.map