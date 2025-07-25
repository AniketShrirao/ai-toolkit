import { QUEUE_NAMES } from "../queue/QueueFactory.js";
export class WorkflowStepExecutor {
    queueManager;
    stepHandlers = new Map();
    constructor(queueManager) {
        this.queueManager = queueManager;
        this.registerBuiltInHandlers();
    }
    async executeStep(step, context) {
        const startTime = Date.now();
        try {
            // Check if step dependencies are satisfied
            const dependenciesResult = this.checkDependencies(step, context.previousResults);
            if (!dependenciesResult.satisfied) {
                return {
                    success: false,
                    error: `Dependencies not satisfied: ${dependenciesResult.missing.join(", ")}`,
                    duration: Date.now() - startTime,
                };
            }
            // Get the appropriate handler for this step type
            const handler = this.stepHandlers.get(step.type);
            if (!handler) {
                return {
                    success: false,
                    error: `No handler registered for step type: ${step.type}`,
                    duration: Date.now() - startTime,
                };
            }
            // Execute the step
            const result = await handler(context, step);
            result.duration = Date.now() - startTime;
            return result;
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                duration: Date.now() - startTime,
            };
        }
    }
    registerStepHandler(stepType, handler) {
        this.stepHandlers.set(stepType, handler);
    }
    checkDependencies(step, previousResults) {
        const missing = [];
        for (const depId of step.dependencies) {
            if (!previousResults.has(depId)) {
                missing.push(depId);
            }
        }
        return {
            satisfied: missing.length === 0,
            missing,
        };
    }
    registerBuiltInHandlers() {
        // Document analysis handler
        this.registerStepHandler("document-analysis", async (context, step) => {
            const jobData = {
                id: `${context.executionId}-${step.id}`,
                type: "document-analysis",
                payload: {
                    ...step.config,
                    input: context.input,
                    context: context.globalContext,
                },
                createdAt: new Date(),
            };
            const jobId = await this.queueManager.addJob(QUEUE_NAMES.DOCUMENT_PROCESSING, jobData, "medium");
            // Wait for job completion
            return this.waitForJobCompletion(jobId);
        });
        // Requirement extraction handler
        this.registerStepHandler("requirement-extraction", async (context, step) => {
            const jobData = {
                id: `${context.executionId}-${step.id}`,
                type: "ai-analysis",
                payload: {
                    operation: "requirement-extraction",
                    ...step.config,
                    input: context.input,
                    context: context.globalContext,
                },
                createdAt: new Date(),
            };
            const jobId = await this.queueManager.addJob(QUEUE_NAMES.AI_ANALYSIS, jobData, "medium");
            return this.waitForJobCompletion(jobId);
        });
        // Estimation handler
        this.registerStepHandler("estimation", async (context, step) => {
            const jobData = {
                id: `${context.executionId}-${step.id}`,
                type: "ai-analysis",
                payload: {
                    operation: "estimation",
                    ...step.config,
                    input: context.input,
                    previousResults: Array.from(context.previousResults.entries()),
                    context: context.globalContext,
                },
                createdAt: new Date(),
            };
            const jobId = await this.queueManager.addJob(QUEUE_NAMES.AI_ANALYSIS, jobData, "medium");
            return this.waitForJobCompletion(jobId);
        });
        // Communication generation handler
        this.registerStepHandler("communication-generation", async (context, step) => {
            const jobData = {
                id: `${context.executionId}-${step.id}`,
                type: "communication-generation",
                payload: {
                    ...step.config,
                    input: context.input,
                    previousResults: Array.from(context.previousResults.entries()),
                    context: context.globalContext,
                },
                createdAt: new Date(),
            };
            const jobId = await this.queueManager.addJob(QUEUE_NAMES.AI_ANALYSIS, jobData, "medium");
            return this.waitForJobCompletion(jobId);
        });
        // Codebase analysis handler
        this.registerStepHandler("codebase-analysis", async (context, step) => {
            const jobData = {
                id: `${context.executionId}-${step.id}`,
                type: "codebase-analysis",
                payload: {
                    ...step.config,
                    input: context.input,
                    context: context.globalContext,
                },
                createdAt: new Date(),
            };
            const jobId = await this.queueManager.addJob(QUEUE_NAMES.AI_ANALYSIS, jobData, "medium");
            return this.waitForJobCompletion(jobId);
        });
        // File operation handler
        this.registerStepHandler("file-operation", async (context, step) => {
            const jobData = {
                id: `${context.executionId}-${step.id}`,
                type: "file-operations",
                payload: {
                    ...step.config,
                    input: context.input,
                    context: context.globalContext,
                },
                createdAt: new Date(),
            };
            const jobId = await this.queueManager.addJob(QUEUE_NAMES.FILE_OPERATIONS, jobData, "medium");
            return this.waitForJobCompletion(jobId);
        });
        // Notification handler
        this.registerStepHandler("notification", async (context, step) => {
            const jobData = {
                id: `${context.executionId}-${step.id}`,
                type: "notification",
                payload: {
                    ...step.config,
                    input: context.input,
                    previousResults: Array.from(context.previousResults.entries()),
                    context: context.globalContext,
                },
                createdAt: new Date(),
            };
            const jobId = await this.queueManager.addJob(QUEUE_NAMES.NOTIFICATIONS, jobData, "medium");
            return this.waitForJobCompletion(jobId);
        });
    }
    async waitForJobCompletion(jobId) {
        const maxWaitTime = 300000; // 5 minutes
        const pollInterval = 1000; // 1 second
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitTime) {
            const jobStatus = await this.queueManager.getJob(jobId);
            if (!jobStatus) {
                return {
                    success: false,
                    error: "Job not found",
                    duration: Date.now() - startTime,
                };
            }
            if (jobStatus.status === "completed") {
                return {
                    success: true,
                    output: jobStatus.result?.data,
                    duration: Date.now() - startTime,
                    metadata: {
                        jobId,
                        attempts: jobStatus.attempts,
                    },
                };
            }
            if (jobStatus.status === "failed") {
                return {
                    success: false,
                    error: jobStatus.failedReason || "Job failed",
                    duration: Date.now() - startTime,
                    metadata: {
                        jobId,
                        attempts: jobStatus.attempts,
                    },
                };
            }
            // Wait before polling again
            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
        return {
            success: false,
            error: "Job execution timeout",
            duration: Date.now() - startTime,
        };
    }
    // Utility methods for creating step execution contexts
    createExecutionContext(workflowId, executionId, stepId, input, previousResults = new Map(), globalContext = {}) {
        return {
            workflowId,
            executionId,
            stepId,
            input,
            previousResults,
            globalContext,
        };
    }
    // Method to execute steps in dependency order
    async executeStepsInOrder(steps, baseContext) {
        const results = new Map();
        const executed = new Set();
        const executing = new Set();
        const executeStep = async (step) => {
            if (executed.has(step.id) || executing.has(step.id)) {
                return;
            }
            executing.add(step.id);
            // Execute dependencies first
            for (const depId of step.dependencies) {
                const depStep = steps.find((s) => s.id === depId);
                if (depStep && !executed.has(depId)) {
                    await executeStep(depStep);
                }
            }
            // Execute this step
            const context = {
                ...baseContext,
                stepId: step.id,
                previousResults: new Map(Array.from(results.entries())
                    .filter(([id]) => step.dependencies.includes(id))
                    .map(([id, result]) => [id, result.output])),
            };
            const result = await this.executeStep(step, context);
            results.set(step.id, result);
            executed.add(step.id);
            executing.delete(step.id);
        };
        // Execute all steps
        for (const step of steps) {
            if (!executed.has(step.id)) {
                await executeStep(step);
            }
        }
        return results;
    }
    // Method to validate step execution order
    validateStepOrder(steps) {
        const errors = [];
        const stepIds = new Set(steps.map((s) => s.id));
        // Check for circular dependencies
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (stepId) => {
            if (recursionStack.has(stepId)) {
                return true;
            }
            if (visited.has(stepId)) {
                return false;
            }
            visited.add(stepId);
            recursionStack.add(stepId);
            const step = steps.find((s) => s.id === stepId);
            if (step) {
                for (const depId of step.dependencies) {
                    if (hasCycle(depId)) {
                        return true;
                    }
                }
            }
            recursionStack.delete(stepId);
            return false;
        };
        // Check each step for cycles
        for (const step of steps) {
            if (hasCycle(step.id)) {
                errors.push(`Circular dependency detected involving step: ${step.id}`);
                break;
            }
        }
        // Check for invalid dependencies
        for (const step of steps) {
            for (const depId of step.dependencies) {
                if (!stepIds.has(depId)) {
                    errors.push(`Step ${step.id} depends on non-existent step: ${depId}`);
                }
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
//# sourceMappingURL=WorkflowStepExecutor.js.map