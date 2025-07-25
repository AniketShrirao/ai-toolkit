import { readFile, writeFile, access } from "fs/promises";
import { join, dirname } from "path";
import { CoreWorkflowDefinition } from "@ai-toolkit/shared";

export interface WorkflowConfigFile {
  version: string;
  workflows: CoreWorkflowDefinition[];
  templates?: Record<string, any>;
  settings?: {
    defaultTimeout?: number;
    maxRetries?: number;
    concurrency?: number;
  };
}

export class WorkflowDefinitionLoader {
  private configPath: string;
  private loadedWorkflows: Map<string, CoreWorkflowDefinition> = new Map();

  constructor(configPath: string = "./workflows.json") {
    this.configPath = configPath;
  }

  async loadWorkflows(): Promise<CoreWorkflowDefinition[]> {
    try {
      await access(this.configPath);
      const content = await readFile(this.configPath, "utf-8");
      const config: WorkflowConfigFile = JSON.parse(content);

      // Validate config version
      if (!this.isCompatibleVersion(config.version)) {
        throw new Error(
          `Incompatible workflow config version: ${config.version}`
        );
      }

      // Process and validate workflows
      const workflows = await this.processWorkflows(
        config.workflows,
        config.templates
      );

      // Cache loaded workflows
      this.loadedWorkflows.clear();
      for (const workflow of workflows) {
        this.loadedWorkflows.set(workflow.id, workflow);
      }

      return workflows;
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        // Config file doesn't exist, return empty array
        return [];
      }
      throw new Error(`Failed to load workflow definitions: ${error}`);
    }
  }

  async saveWorkflows(workflows: CoreWorkflowDefinition[]): Promise<void> {
    const config: WorkflowConfigFile = {
      version: "1.0.0",
      workflows,
      settings: {
        defaultTimeout: 300000,
        maxRetries: 3,
        concurrency: 5,
      },
    };

    try {
      // Ensure directory exists
      const dir = dirname(this.configPath);
      await access(dir).catch(async () => {
        const { mkdir } = await import("fs/promises");
        await mkdir(dir, { recursive: true });
      });

      await writeFile(
        this.configPath,
        JSON.stringify(config, null, 2),
        "utf-8"
      );

      // Update cache
      this.loadedWorkflows.clear();
      for (const workflow of workflows) {
        this.loadedWorkflows.set(workflow.id, workflow);
      }
    } catch (error) {
      throw new Error(`Failed to save workflow definitions: ${error}`);
    }
  }

  async loadWorkflow(
    workflowId: string
  ): Promise<CoreWorkflowDefinition | null> {
    if (this.loadedWorkflows.has(workflowId)) {
      return this.loadedWorkflows.get(workflowId)!;
    }

    // Try to load from file if not in cache
    const workflows = await this.loadWorkflows();
    return workflows.find((w) => w.id === workflowId) || null;
  }

  async saveWorkflow(workflow: CoreWorkflowDefinition): Promise<void> {
    const workflows = await this.loadWorkflows();
    const existingIndex = workflows.findIndex((w) => w.id === workflow.id);

    if (existingIndex >= 0) {
      workflows[existingIndex] = workflow;
    } else {
      workflows.push(workflow);
    }

    await this.saveWorkflows(workflows);
  }

  async deleteWorkflow(workflowId: string): Promise<boolean> {
    const workflows = await this.loadWorkflows();
    const initialLength = workflows.length;
    const filtered = workflows.filter((w) => w.id !== workflowId);

    if (filtered.length < initialLength) {
      await this.saveWorkflows(filtered);
      this.loadedWorkflows.delete(workflowId);
      return true;
    }

    return false;
  }

  createWorkflowTemplate(): CoreWorkflowDefinition {
    return {
      id: "",
      name: "",
      description: "",
      steps: [],
      triggers: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  validateWorkflowConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.version) {
      errors.push("Config version is required");
    }

    if (!Array.isArray(config.workflows)) {
      errors.push("Workflows must be an array");
    } else {
      for (let i = 0; i < config.workflows.length; i++) {
        const workflow = config.workflows[i];
        const workflowErrors = this.validateWorkflowDefinition(workflow, i);
        errors.push(...workflowErrors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private isCompatibleVersion(version: string): boolean {
    // Simple version compatibility check
    const supportedVersions = ["1.0.0", "1.0.1"];
    return supportedVersions.includes(version);
  }

  private async processWorkflows(
    workflows: CoreWorkflowDefinition[],
    templates?: Record<string, any>
  ): Promise<CoreWorkflowDefinition[]> {
    const processed: CoreWorkflowDefinition[] = [];

    for (const workflow of workflows) {
      // Apply templates if specified
      let processedWorkflow = { ...workflow };

      if (workflow.steps) {
        processedWorkflow.steps = await this.processSteps(
          workflow.steps,
          templates
        );
      }

      // Set default values
      processedWorkflow.enabled = processedWorkflow.enabled ?? true;
      processedWorkflow.createdAt = processedWorkflow.createdAt || new Date();
      processedWorkflow.updatedAt = processedWorkflow.updatedAt || new Date();

      processed.push(processedWorkflow);
    }

    return processed;
  }

  private async processSteps(
    steps: any[],
    templates?: Record<string, any>
  ): Promise<any[]> {
    const processed = [];

    for (const step of steps) {
      let processedStep = { ...step };

      // Apply template if specified
      if (step.template && templates?.[step.template]) {
        const template = templates[step.template];
        processedStep = {
          ...template,
          ...processedStep,
          id: step.id, // Always preserve the step ID
          config: {
            ...template.config,
            ...processedStep.config,
          },
        };
      }

      // Set default values
      processedStep.dependencies = processedStep.dependencies || [];
      processedStep.retryPolicy = processedStep.retryPolicy || {
        maxRetries: 3,
        backoffStrategy: "exponential",
        initialDelay: 1000,
        maxDelay: 30000,
      };

      processed.push(processedStep);
    }

    return processed;
  }

  private validateWorkflowDefinition(workflow: any, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Workflow ${index}`;

    if (!workflow.id) {
      errors.push(`${prefix}: ID is required`);
    }

    if (!workflow.name) {
      errors.push(`${prefix}: Name is required`);
    }

    if (!Array.isArray(workflow.steps)) {
      errors.push(`${prefix}: Steps must be an array`);
    } else if (workflow.steps.length === 0) {
      errors.push(`${prefix}: Must have at least one step`);
    } else {
      // Validate steps
      const stepIds = new Set<string>();
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i];
        const stepPrefix = `${prefix}, Step ${i}`;

        if (!step.id) {
          errors.push(`${stepPrefix}: ID is required`);
        } else if (stepIds.has(step.id)) {
          errors.push(`${stepPrefix}: Duplicate step ID: ${step.id}`);
        } else {
          stepIds.add(step.id);
        }

        if (!step.name) {
          errors.push(`${stepPrefix}: Name is required`);
        }

        if (!step.type) {
          errors.push(`${stepPrefix}: Type is required`);
        }

        // Validate dependencies
        if (step.dependencies) {
          for (const depId of step.dependencies) {
            if (!stepIds.has(depId)) {
              errors.push(`${stepPrefix}: Invalid dependency: ${depId}`);
            }
          }
        }
      }
    }

    if (!Array.isArray(workflow.triggers)) {
      errors.push(`${prefix}: Triggers must be an array`);
    }

    return errors;
  }

  // Utility methods for creating common workflow patterns
  createDocumentProcessingWorkflow(
    name: string,
    description: string
  ): CoreWorkflowDefinition {
    return {
      id: `doc-processing-${Date.now()}`,
      name,
      description,
      steps: [
        {
          id: "extract-content",
          name: "Extract Document Content",
          type: "document-analysis",
          config: {
            extractText: true,
            extractImages: false,
            preserveFormatting: true,
          },
          dependencies: [],
        },
        {
          id: "analyze-structure",
          name: "Analyze Document Structure",
          type: "document-analysis",
          config: {
            identifyHeaders: true,
            extractTables: true,
            findKeyPoints: true,
          },
          dependencies: ["extract-content"],
        },
        {
          id: "extract-requirements",
          name: "Extract Requirements",
          type: "requirement-extraction",
          config: {
            categorize: true,
            prioritize: true,
          },
          dependencies: ["analyze-structure"],
        },
        {
          id: "generate-summary",
          name: "Generate Summary",
          type: "communication-generation",
          config: {
            operation: "summarization",
            length: "medium",
          },
          dependencies: ["extract-requirements"],
        },
      ],
      triggers: [
        {
          type: "file-watch",
          config: {
            path: "./input",
            pattern: "\\.(pdf|docx|txt)$",
          },
        },
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  createEstimationWorkflow(
    name: string,
    description: string
  ): CoreWorkflowDefinition {
    return {
      id: `estimation-${Date.now()}`,
      name,
      description,
      steps: [
        {
          id: "analyze-requirements",
          name: "Analyze Requirements Complexity",
          type: "estimation",
          config: {
            factors: ["technical_complexity", "scope", "dependencies"],
          },
          dependencies: [],
        },
        {
          id: "calculate-estimates",
          name: "Calculate Time and Cost Estimates",
          type: "estimation",
          config: {
            includeRiskFactors: true,
            confidenceLevel: 0.8,
          },
          dependencies: ["analyze-requirements"],
        },
        {
          id: "generate-proposal",
          name: "Generate Project Proposal",
          type: "communication-generation",
          config: {
            template: "project-proposal",
            includeBreakdown: true,
          },
          dependencies: ["calculate-estimates"],
        },
      ],
      triggers: [
        {
          type: "manual",
          config: {},
        },
      ],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
