/**
 * Centralized error handler for the AI Toolkit
 * Provides error processing, logging, and recovery coordination
 */

import {
  BaseError,
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
} from "./ErrorTypes.js";
import { Logger } from "../logging/Logger";
import { ErrorRecoveryManager } from "./ErrorRecovery";

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

export class ErrorHandler {
  private logger: Logger;
  private recoveryManager: ErrorRecoveryManager;
  private config: ErrorHandlerConfig;
  private errorHistory: ErrorReport[] = [];
  private errorListeners: ((error: BaseError, report: ErrorReport) => void)[] =
    [];

  constructor(logger: Logger, config: Partial<ErrorHandlerConfig> = {}) {
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
  async handleError(error: BaseError): Promise<ErrorReport> {
    const startTime = Date.now();
    let recovered = false;
    let recoveryAttempts = 0;

    try {
      // Log the error
      this.logError(error);

      // Attempt recovery if enabled and error is recoverable
      if (this.config.enableRecovery && error.recoverable) {
        const recoveryResult = await this.recoveryManager.attemptRecovery(
          error,
          this.config.maxRecoveryAttempts
        );
        recovered = recoveryResult.success;
        recoveryAttempts = recoveryResult.attempts;
      }

      // Create error report
      const report: ErrorReport = {
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
    } catch (handlingError) {
      // Error occurred while handling the original error
      this.logger.error("Error handler failed", {
        originalError: error.message,
        handlingError:
          handlingError instanceof Error
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
  async handleGenericError(
    error: Error,
    context: ErrorContext,
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): Promise<ErrorReport> {
    // Convert generic error to BaseError
    const baseError: BaseError = {
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
  onError(listener: (error: BaseError, report: ErrorReport) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error event listener
   */
  removeErrorListener(
    listener: (error: BaseError, report: ErrorReport) => void
  ): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    const totalErrors = this.errorHistory.length;
    const errorsByCategory: Record<ErrorCategory, number> = {} as Record<
      ErrorCategory,
      number
    >;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as Record<
      ErrorSeverity,
      number
    >;

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
      if (report.recovered) totalRecovered++;
      totalHandlingTime += report.handlingDuration;
    });

    return {
      totalErrors,
      errorsByCategory,
      errorsBySeverity,
      recoverySuccessRate: totalErrors > 0 ? totalRecovered / totalErrors : 0,
      averageHandlingTime:
        totalErrors > 0 ? totalHandlingTime / totalErrors : 0,
    };
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ErrorReport[] {
    return this.errorHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Log error based on severity and configuration
   */
  private logError(error: BaseError): void {
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
        if (
          this.config.logLevel === "debug" ||
          this.config.logLevel === "info"
        ) {
          this.logger.info("Low severity error", logData);
        }
        break;
    }
  }

  /**
   * Notify error listeners
   */
  private notifyListeners(error: BaseError, report: ErrorReport): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error, report);
      } catch (listenerError) {
        this.logger.error("Error listener failed", {
          error:
            listenerError instanceof Error
              ? listenerError.message
              : String(listenerError),
        });
      }
    });
  }

  /**
   * Send error telemetry (placeholder for future implementation)
   */
  private sendTelemetry(report: ErrorReport): void {
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
let globalErrorHandler: ErrorHandler | null = null;

export function initializeGlobalErrorHandler(
  logger: Logger,
  config?: Partial<ErrorHandlerConfig>
): ErrorHandler {
  globalErrorHandler = new ErrorHandler(logger, config);
  return globalErrorHandler;
}

export function getGlobalErrorHandler(): ErrorHandler {
  if (!globalErrorHandler) {
    throw new Error(
      "Global error handler not initialized. Call initializeGlobalErrorHandler first."
    );
  }
  return globalErrorHandler;
}

/**
 * Convenience function to handle errors globally
 */
export async function handleError(error: BaseError): Promise<ErrorReport> {
  return getGlobalErrorHandler().handleError(error);
}

/**
 * Convenience function to handle generic errors globally
 */
export async function handleGenericError(
  error: Error,
  context: ErrorContext,
  category?: ErrorCategory,
  severity?: ErrorSeverity
): Promise<ErrorReport> {
  return getGlobalErrorHandler().handleGenericError(
    error,
    context,
    category,
    severity
  );
}
