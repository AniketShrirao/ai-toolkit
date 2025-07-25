import { EventEmitter } from "events";
import { watch } from "fs";
import { CronJob } from "cron";
import { QUEUE_NAMES } from "../queue/QueueFactory.js";
export class WorkflowEngineImpl extends EventEmitter {
    workflows = new Map();
    executions = new Map();
    scheduledJobs = new Map();
    fileWatchers = new Map();
    queueManager;
    config = {
        maxConcurrentWorkflows: 10,
        defaultTimeout: 300000, // 5 minutes
        retryPolicy: {
            maxRetries: 3,
            backoffStrategy: "exponential",
        },
    };
    constructor(queueManager) {
        super();
        this.queueManager = queueManager;
    }
    // Workflow management
    async createWorkflow(definition) {
        const validation = await this.validateWorkflow(definition);
        if (!validation.valid) {
            throw new Error(`Invalid workflow: ${validation.errors.join(", ")}`);
        }
        this.workflows.set(definition.id, {
            ...definition,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return this.createWorkflowInstance(definition);
    }
    async getWorkflow(workflowId) {
        const definition = this.workflows.get(workflowId);
        if (!definition)
            return null;
        return this.createWorkflowInstance(definition);
    }
    async updateWorkflow(workflowId, updates) {
        const existing = this.workflows.get(workflowId);
        if (!existing) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        const updated = {
            ...existing,
            ...updates,
            id: workflowId, // Ensure ID doesn't change
            updatedAt: new Date(),
        };
        const validation = await this.validateWorkflow(updated);
        if (!validation.valid) {
            throw new Error(`Invalid workflow update: ${validation.errors.join(", ")}`);
        }
        this.workflows.set(workflowId, updated);
        return this.createWorkflowInstance(updated);
    }
    async deleteWorkflow(workflowId) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow)
            return false;
        // Stop any scheduled jobs
        await this.unscheduleWorkflow(workflowId);
        // Remove file watchers
        const watchersToRemove = Array.from(this.fileWatchers.entries())
            .filter(([_, config]) => config.config.workflowId === workflowId)
            .map(([id]) => id);
        for (const watcherId of watchersToRemove) {
            await this.removeFileWatcher(watcherId);
        }
        // Cancel active executions
        const activeExecutions = Array.from(this.executions.values()).filter((exec) => exec.workflowId === workflowId && exec.status === "running");
        for (const execution of activeExecutions) {
            await this.cancelWorkflow(execution.id);
        }
        this.workflows.delete(workflowId);
        return true;
    }
    async listWorkflows(filters) {
        let workflows = Array.from(this.workflows.values());
        if (filters) {
            if (filters.enabled !== undefined) {
                workflows = workflows.filter((w) => w.enabled === filters.enabled);
            }
            // Add more filtering logic as needed
        }
        return workflows;
    }
    // Workflow execution
    async executeWorkflow(workflowId, input, options) {
        const executionId = await this.executeWorkflowAsync(workflowId, input, options);
        // Wait for completion
        return new Promise((resolve, reject) => {
            const checkStatus = async () => {
                const execution = await this.getWorkflowExecution(executionId);
                if (!execution) {
                    reject(new Error("Execution not found"));
                    return;
                }
                if (execution.status === "completed") {
                    resolve(execution.result);
                }
                else if (execution.status === "failed") {
                    reject(new Error(`Workflow failed: ${execution.result?.errors?.join(", ")}`));
                }
                else {
                    setTimeout(checkStatus, 1000);
                }
            };
            checkStatus();
        });
    }
    async executeWorkflowSync(workflowId, input, options) {
        return this.executeWorkflow(workflowId, input, options);
    }
    async executeWorkflowAsync(workflowId, input, options) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        if (!workflow.enabled) {
            throw new Error(`Workflow is disabled: ${workflowId}`);
        }
        const executionId = this.generateExecutionId();
        const execution = {
            id: executionId,
            workflowId,
            status: "pending",
            input,
            progress: 0,
            logs: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.executions.set(executionId, execution);
        this.emit("workflowStart", execution);
        // Queue the workflow execution
        const jobData = {
            id: executionId,
            type: "workflow-execution",
            payload: {
                workflowId,
                executionId,
                input,
                steps: workflow.steps,
                options,
            },
            createdAt: new Date(),
        };
        await this.queueManager.addJob(QUEUE_NAMES.WORKFLOW_EXECUTION, jobData, options?.priority || "medium");
        return executionId;
    }
    // Execution monitoring
    async getWorkflowStatus(executionId) {
        const execution = this.executions.get(executionId);
        return execution?.status || "pending";
    }
    async getWorkflowExecution(executionId) {
        return this.executions.get(executionId) || null;
    }
    async listActiveWorkflows() {
        return Array.from(this.executions.values()).filter((exec) => exec.status === "running");
    }
    async getExecutionHistory(workflowId, limit = 50) {
        let executions = Array.from(this.executions.values());
        if (workflowId) {
            executions = executions.filter((exec) => exec.workflowId === workflowId);
        }
        return executions
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }
    // Execution control
    async pauseWorkflow(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== "running") {
            return false;
        }
        execution.status = "paused";
        execution.updatedAt = new Date();
        this.executions.set(executionId, execution);
        return true;
    }
    async resumeWorkflow(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution || execution.status !== "paused") {
            return false;
        }
        execution.status = "running";
        execution.updatedAt = new Date();
        this.executions.set(executionId, execution);
        return true;
    }
    async cancelWorkflow(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            return false;
        }
        execution.status = "cancelled";
        execution.updatedAt = new Date();
        this.executions.set(executionId, execution);
        return true;
    }
    async retryWorkflow(executionId) {
        const execution = this.executions.get(executionId);
        if (!execution) {
            throw new Error("Execution not found");
        }
        return this.executeWorkflowAsync(execution.workflowId, execution.input, {
            priority: "high",
        });
    }
    // Scheduling
    async scheduleWorkflow(workflowId, schedule) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        // Remove existing schedule if any
        await this.unscheduleWorkflow(workflowId);
        try {
            const cronJob = new CronJob(schedule.expression, async () => {
                try {
                    await this.executeWorkflowAsync(workflowId, {});
                }
                catch (error) {
                    console.error(`Scheduled workflow execution failed: ${error}`);
                }
            }, null, true, schedule.timezone);
            this.scheduledJobs.set(workflowId, cronJob);
            return true;
        }
        catch (error) {
            throw new Error(`Invalid cron expression: ${schedule.expression}`);
        }
    }
    async unscheduleWorkflow(workflowId) {
        const cronJob = this.scheduledJobs.get(workflowId);
        if (cronJob) {
            cronJob.stop();
            this.scheduledJobs.delete(workflowId);
            return true;
        }
        return false;
    }
    async listScheduledWorkflows() {
        const scheduled = [];
        for (const [workflowId, cronJob] of this.scheduledJobs) {
            const workflow = this.workflows.get(workflowId);
            if (workflow?.schedule) {
                scheduled.push({
                    workflowId,
                    schedule: workflow.schedule,
                    nextRun: cronJob.nextDate().toJSDate(),
                    enabled: workflow.enabled,
                });
            }
        }
        return scheduled;
    }
    // File watching and triggers
    async addFileWatcher(workflowId, watchPath, options) {
        const workflow = this.workflows.get(workflowId);
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`);
        }
        const watcherId = this.generateWatcherId();
        try {
            const watcher = watch(watchPath, { recursive: options?.recursive || false }, async (eventType, filename) => {
                if (!filename)
                    return;
                // Apply file pattern filtering
                if (options?.filePattern) {
                    const regex = new RegExp(options.filePattern);
                    if (!regex.test(filename))
                        return;
                }
                if (options?.ignorePattern) {
                    const regex = new RegExp(options.ignorePattern);
                    if (regex.test(filename))
                        return;
                }
                // Trigger workflow execution
                try {
                    await this.executeWorkflowAsync(workflowId, {
                        files: [filename],
                        context: {
                            trigger: "file-watch",
                            eventType,
                            watchPath,
                            filename,
                        },
                    });
                }
                catch (error) {
                    console.error(`File watcher triggered workflow failed: ${error}`);
                }
            });
            this.fileWatchers.set(watcherId, {
                watcher,
                config: {
                    workflowId,
                    watchPath,
                    options,
                },
            });
            return watcherId;
        }
        catch (error) {
            throw new Error(`Failed to create file watcher: ${error}`);
        }
    }
    async removeFileWatcher(watcherId) {
        const watcherInfo = this.fileWatchers.get(watcherId);
        if (!watcherInfo)
            return false;
        watcherInfo.watcher.close();
        this.fileWatchers.delete(watcherId);
        return true;
    }
    async listFileWatchers() {
        return Array.from(this.fileWatchers.entries()).map(([id, info]) => ({
            id,
            workflowId: info.config.workflowId,
            path: info.config.watchPath,
            active: true, // Assume active if in the map
        }));
    }
    // Workflow validation
    async validateWorkflow(definition) {
        const errors = [];
        const warnings = [];
        // Basic validation
        if (!definition.id) {
            errors.push("Workflow ID is required");
        }
        if (!definition.name) {
            errors.push("Workflow name is required");
        }
        if (!definition.steps || definition.steps.length === 0) {
            errors.push("Workflow must have at least one step");
        }
        // Step validation
        if (definition.steps) {
            const stepIds = new Set();
            for (const step of definition.steps) {
                if (!step.id) {
                    errors.push("Step ID is required");
                }
                else if (stepIds.has(step.id)) {
                    errors.push(`Duplicate step ID: ${step.id}`);
                }
                else {
                    stepIds.add(step.id);
                }
                if (!step.name) {
                    errors.push(`Step ${step.id} must have a name`);
                }
                if (!step.type) {
                    errors.push(`Step ${step.id} must have a type`);
                }
                // Validate dependencies
                for (const depId of step.dependencies || []) {
                    if (!stepIds.has(depId)) {
                        errors.push(`Step ${step.id} depends on non-existent step: ${depId}`);
                    }
                }
            }
        }
        // Schedule validation
        if (definition.schedule) {
            try {
                new CronJob(definition.schedule.expression, () => { }, null, false);
            }
            catch {
                errors.push(`Invalid cron expression: ${definition.schedule.expression}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
    async testWorkflow(definition, testInput) {
        try {
            const validation = await this.validateWorkflow(definition);
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors,
                };
            }
            // Create a temporary workflow for testing
            const testWorkflowId = `test-${Date.now()}`;
            const testDefinition = { ...definition, id: testWorkflowId };
            await this.createWorkflow(testDefinition);
            try {
                const result = await this.executeWorkflow(testWorkflowId, testInput);
                return {
                    success: true,
                    result,
                };
            }
            finally {
                // Clean up test workflow
                await this.deleteWorkflow(testWorkflowId);
            }
        }
        catch (error) {
            return {
                success: false,
                errors: [error instanceof Error ? error.message : String(error)],
            };
        }
    }
    // Performance and monitoring
    async getWorkflowMetrics(workflowId) {
        const executions = Array.from(this.executions.values()).filter((exec) => exec.workflowId === workflowId);
        const totalExecutions = executions.length;
        const completedExecutions = executions.filter((exec) => exec.status === "completed");
        const failedExecutions = executions.filter((exec) => exec.status === "failed");
        const successRate = totalExecutions > 0 ? completedExecutions.length / totalExecutions : 0;
        const errorRate = totalExecutions > 0 ? failedExecutions.length / totalExecutions : 0;
        const durations = completedExecutions
            .map((exec) => exec.result?.duration || 0)
            .filter((duration) => duration > 0);
        const averageDuration = durations.length > 0
            ? durations.reduce((sum, duration) => sum + duration, 0) /
                durations.length
            : 0;
        const lastExecution = executions.length > 0
            ? executions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
            : undefined;
        return {
            totalExecutions,
            successRate,
            averageDuration,
            lastExecution,
            errorRate,
        };
    }
    async getSystemMetrics() {
        const activeWorkflows = Array.from(this.executions.values()).filter((exec) => exec.status === "running").length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayExecutions = Array.from(this.executions.values()).filter((exec) => exec.createdAt >= today);
        const completedToday = todayExecutions.filter((exec) => exec.status === "completed").length;
        const failedToday = todayExecutions.filter((exec) => exec.status === "failed").length;
        // Get queue stats
        const queueStats = await this.queueManager.getSystemStats();
        return {
            activeWorkflows,
            queuedJobs: queueStats.activeJobs,
            completedToday,
            failedToday,
            systemLoad: activeWorkflows / this.config.maxConcurrentWorkflows,
        };
    }
    // Configuration
    async updateEngineConfig(config) {
        this.config = { ...this.config, ...config };
    }
    async getEngineConfig() {
        return { ...this.config };
    }
    // Cleanup and maintenance
    async cleanupCompletedExecutions(olderThan) {
        const toRemove = Array.from(this.executions.entries()).filter(([_, exec]) => (exec.status === "completed" || exec.status === "failed") &&
            exec.updatedAt < olderThan);
        for (const [id] of toRemove) {
            this.executions.delete(id);
        }
        return toRemove.length;
    }
    async archiveWorkflowData(workflowId, olderThan) {
        // In a real implementation, this would archive to persistent storage
        const executions = Array.from(this.executions.entries()).filter(([_, exec]) => exec.workflowId === workflowId && exec.updatedAt < olderThan);
        // For now, just remove old executions
        for (const [id] of executions) {
            this.executions.delete(id);
        }
        return true;
    }
    // Event handling
    onWorkflowStart(callback) {
        this.on("workflowStart", callback);
    }
    onWorkflowComplete(callback) {
        this.on("workflowComplete", callback);
    }
    onWorkflowError(callback) {
        this.on("workflowError", callback);
    }
    onWorkflowProgress(callback) {
        this.on("workflowProgress", callback);
    }
    // Private helper methods
    createWorkflowInstance(definition) {
        return {
            definition,
            execute: async (input) => {
                return this.executeWorkflow(definition.id, input);
            },
            getStatus: async (executionId) => {
                return this.getWorkflowStatus(executionId);
            },
            cancel: async (executionId) => {
                await this.cancelWorkflow(executionId);
            },
        };
    }
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateWatcherId() {
        return `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Method to update execution status (called by job processors)
    updateExecutionStatus(executionId, status, result, progress, currentStep) {
        const execution = this.executions.get(executionId);
        if (!execution)
            return;
        execution.status = status;
        execution.updatedAt = new Date();
        if (result) {
            execution.result = result;
        }
        if (progress !== undefined) {
            execution.progress = progress;
        }
        if (currentStep) {
            execution.currentStep = currentStep;
        }
        this.executions.set(executionId, execution);
        // Emit events
        if (status === "completed") {
            this.emit("workflowComplete", execution);
        }
        else if (status === "failed") {
            this.emit("workflowError", execution, new Error(result?.errors?.join(", ") || "Unknown error"));
        }
        else {
            this.emit("workflowProgress", execution);
        }
    }
}
//# sourceMappingURL=WorkflowEngineImpl.js.map