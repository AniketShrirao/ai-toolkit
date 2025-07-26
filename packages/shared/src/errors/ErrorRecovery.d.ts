/**
 * Error recovery mechanisms for the AI Toolkit
 * Implements automated recovery strategies for common failure scenarios
 */
import { BaseError } from "./ErrorTypes.js";
import { Logger } from "../logging/Logger";
export interface RecoveryResult {
    success: boolean;
    attempts: number;
    strategy: string;
    message: string;
    details?: Record<string, any>;
}
export interface RecoveryStrategy {
    name: string;
    canHandle: (error: BaseError) => boolean;
    execute: (error: BaseError, attempt: number) => Promise<RecoveryResult>;
    maxAttempts: number;
    delayMs: number;
}
export declare class ErrorRecoveryManager {
    private logger;
    private strategies;
    constructor(logger: Logger);
    /**
     * Attempt to recover from an error using available strategies
     */
    attemptRecovery(error: BaseError, maxAttempts?: number): Promise<RecoveryResult>;
    /**
     * Register a custom recovery strategy
     */
    registerStrategy(strategy: RecoveryStrategy): void;
    /**
     * Remove a recovery strategy
     */
    removeStrategy(name: string): boolean;
    /**
     * Get list of registered strategies
     */
    getStrategies(): string[];
    /**
     * Register built-in recovery strategies
     */
    private registerBuiltInStrategies;
    /**
     * Utility method to add delay
     */
    private delay;
}
//# sourceMappingURL=ErrorRecovery.d.ts.map