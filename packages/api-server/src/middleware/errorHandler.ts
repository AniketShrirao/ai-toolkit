import { Request, Response, NextFunction } from "express";
import {
  getLogger,
  handleError,
  handleGenericError,
  ValidationError as SharedValidationError,
  ErrorCategory,
  ErrorSeverity,
  BaseError,
} from "@ai-toolkit/shared";

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  recoverable?: boolean;
  suggestions?: string[];
}

export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  code = "VALIDATION_ERROR";
  recoverable = true;
  suggestions: string[] = [];

  constructor(
    message: string,
    public details?: any,
    suggestions?: string[]
  ) {
    super(message);
    this.name = "ValidationError";
    this.suggestions = suggestions || [];
  }
}

export class AuthenticationError extends Error implements ApiError {
  statusCode = 401;
  code = "AUTHENTICATION_ERROR";
  recoverable = true;
  suggestions: string[] = ["Please provide valid authentication credentials"];

  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error implements ApiError {
  statusCode = 403;
  code = "AUTHORIZATION_ERROR";
  recoverable = true;
  suggestions: string[] = ["Contact administrator for access permissions"];

  constructor(message: string = "Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  code = "NOT_FOUND";
  recoverable = true;
  suggestions: string[] = ["Check the URL path", "Verify the resource exists"];

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ProcessingError extends Error implements ApiError {
  statusCode = 500;
  code = "PROCESSING_ERROR";
  recoverable = false;

  constructor(
    message: string,
    public details?: any,
    public suggestions?: string[]
  ) {
    super(message);
    this.name = "ProcessingError";
  }
}

/**
 * Convert API errors to HTTP status codes
 */
function getHttpStatusCode(error: BaseError | ApiError): number {
  if ("statusCode" in error && error.statusCode) {
    return error.statusCode;
  }

  // Map error categories to HTTP status codes
  if ("category" in error) {
    switch (error.category) {
      case ErrorCategory.VALIDATION:
        return 400;
      case ErrorCategory.AUTHENTICATION:
        return 401;
      case ErrorCategory.AUTHORIZATION:
        return 403;
      case ErrorCategory.OLLAMA_CONNECTION:
      case ErrorCategory.AI_MODEL:
        return 503; // Service Unavailable
      case ErrorCategory.DOCUMENT_PROCESSING:
      case ErrorCategory.WORKFLOW_EXECUTION:
        return 422; // Unprocessable Entity
      case ErrorCategory.FILE_SYSTEM:
        return 500;
      case ErrorCategory.CONFIGURATION:
        return 500;
      default:
        return 500;
    }
  }

  return 500;
}

export const errorHandler = async (
  error: ApiError | BaseError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const logger = getLogger().child({
    component: "API",
    requestId: req.headers["x-request-id"] as string,
    metadata: {
      method: req.method,
      url: req.url,
    },
  });

  let errorReport;
  let statusCode: number;
  let response: any;

  try {
    // Handle BaseError (from centralized error system)
    if ("category" in error && "severity" in error) {
      const baseError = error as BaseError;
      errorReport = await handleError(baseError);

      statusCode = getHttpStatusCode(baseError);
      response = {
        code: baseError.code,
        message: baseError.userMessage,
        details: baseError.details,
        recoverable: baseError.recoverable,
        suggestions: baseError.recoveryActions.map(
          (action) => action.description
        ),
        timestamp: new Date().toISOString(),
        handled: errorReport.handled,
        recovered: errorReport.recovered,
      };
    }
    // Handle legacy ApiError
    else if ("statusCode" in error || "code" in error) {
      const apiError = error as ApiError;
      statusCode = apiError.statusCode || 500;

      // Convert to centralized error handling
      const context = {
        component: "API",
        operation: `${req.method} ${req.path}`,
        requestId: req.headers["x-request-id"] as string,
        timestamp: new Date(),
        metadata: {
          method: req.method,
          url: req.url,
          userAgent: req.headers["user-agent"],
        },
      };

      if (apiError instanceof ValidationError) {
        const validationError = new SharedValidationError(
          apiError.message,
          context,
          undefined,
          apiError.details
        );
        errorReport = await handleError(validationError);
      } else {
        errorReport = await handleGenericError(
          apiError,
          context,
          ErrorCategory.SYSTEM,
          statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM
        );
      }

      response = {
        code: apiError.code || "INTERNAL_ERROR",
        message: apiError.message,
        details: apiError.details,
        recoverable: apiError.recoverable ?? false,
        suggestions: apiError.suggestions || [],
        timestamp: new Date().toISOString(),
        handled: errorReport.handled,
        recovered: errorReport.recovered,
      };
    }
    // Handle generic Error
    else {
      const context = {
        component: "API",
        operation: `${req.method} ${req.path}`,
        requestId: req.headers["x-request-id"] as string,
        timestamp: new Date(),
        metadata: {
          method: req.method,
          url: req.url,
          userAgent: req.headers["user-agent"],
        },
      };

      errorReport = await handleGenericError(
        error as Error,
        context,
        ErrorCategory.SYSTEM,
        ErrorSeverity.HIGH
      );

      statusCode = 500;
      response = {
        code: "INTERNAL_ERROR",
        message: error.message || "An unexpected error occurred",
        details: {},
        recoverable: false,
        suggestions: [
          "Please try again later",
          "Contact support if the problem persists",
        ],
        timestamp: new Date().toISOString(),
        handled: errorReport.handled,
        recovered: errorReport.recovered,
      };
    }

    // Log additional API-specific information
    logger.error("API request failed", {
      statusCode,
      errorCode: response.code,
      recovered: response.recovered,
      handlingDuration: errorReport?.handlingDuration,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });
  } catch (handlingError) {
    // Fallback if error handling itself fails
    logger.error("Error handler failed", {
      originalError: error.message,
      handlingError:
        handlingError instanceof Error
          ? handlingError.message
          : String(handlingError),
    });

    statusCode = 500;
    response = {
      code: "ERROR_HANDLER_FAILED",
      message: "An error occurred while processing the error",
      details: {},
      recoverable: false,
      suggestions: ["Please try again later"],
      timestamp: new Date().toISOString(),
      handled: false,
      recovered: false,
    };
  }

  res.status(statusCode).json(response);
};
