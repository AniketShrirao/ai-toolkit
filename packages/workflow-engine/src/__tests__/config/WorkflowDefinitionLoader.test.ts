import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import {
  WorkflowDefinitionLoader,
  WorkflowConfigFile,
} from "../../config/WorkflowDefinitionLoader.js";
import { WorkflowDefinition as CoreWorkflowDefinition } from "@ai-toolkit/shared";

describe("WorkflowDefinitionLoader", () => {
  const testConfigPath = join(process.cwd(), "test-workflows.json");
  let loader: WorkflowDefinitionLoader;

  const sampleWorkflow: CoreWorkflowDefinition = {
    id: "test-workflow-1",
    name: "Test Workflow",
    description: "A test workflow",
    steps: [
      {
        id: "step-1",
        name: "First Step",
        type: "document-analysis",
        config: { extractText: true },
        dependencies: [],
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

  const sampleConfig: WorkflowConfigFile = {
    version: "1.0.0",
    workflows: [sampleWorkflow],
    settings: {
      defaultTimeout: 300000,
      maxRetries: 3,
      concurrency: 5,
    },
  };

  beforeEach(() => {
    loader = new WorkflowDefinitionLoader(testConfigPath);
  });

  afterEach(async () => {
    try {
      await unlink(testConfigPath);
    } catch {
      // File might not exist, ignore error
    }
  });

  describe("Loading Workflows", () => {
    it("should load workflows from a valid config file", async () => {
      await writeFile(testConfigPath, JSON.stringify(sampleConfig, null, 2));

      const workflows = await loader.loadWorkflows();

      expect(workflows).toHaveLength(1);
      expect(workflows[0].id).toBe(sampleWorkflow.id);
      expect(workflows[0].name).toBe(sampleWorkflow.name);
    });

    it("should return empty array when config file does not exist", async () => {
      const workflows = await loader.loadWorkflows();
      expect(workflows).toHaveLength(0);
    });

    it("should throw error for invalid JSON", async () => {
      await writeFile(testConfigPath, "invalid json");

      await expect(loader.loadWorkflows()).rejects.toThrow(
        "Failed to load workflow definitions"
      );
    });

    it("should throw error for incompatible version", async () => {
      const incompatibleConfig = { ...sampleConfig, version: "2.0.0" };
      await writeFile(testConfigPath, JSON.stringify(incompatibleConfig));

      await expect(loader.loadWorkflows()).rejects.toThrow(
        "Incompatible workflow config version"
      );
    });

    it("should load a specific workflow by ID", async () => {
      await writeFile(testConfigPath, JSON.stringify(sampleConfig, null, 2));

      const workflow = await loader.loadWorkflow(sampleWorkflow.id);

      expect(workflow).toBeDefined();
      expect(workflow?.id).toBe(sampleWorkflow.id);
    });

    it("should return null for non-existent workflow ID", async () => {
      await writeFile(testConfigPath, JSON.stringify(sampleConfig, null, 2));

      const workflow = await loader.loadWorkflow("non-existent-id");

      expect(workflow).toBeNull();
    });
  });

  describe("Saving Workflows", () => {
    it("should save workflows to config file", async () => {
      const workflows = [sampleWorkflow];

      await loader.saveWorkflows(workflows);

      const loadedWorkflows = await loader.loadWorkflows();
      expect(loadedWorkflows).toHaveLength(1);
      expect(loadedWorkflows[0].id).toBe(sampleWorkflow.id);
    });

    it("should save a single workflow", async () => {
      await loader.saveWorkflow(sampleWorkflow);

      const loadedWorkflow = await loader.loadWorkflow(sampleWorkflow.id);
      expect(loadedWorkflow).toBeDefined();
      expect(loadedWorkflow?.id).toBe(sampleWorkflow.id);
    });

    it("should update existing workflow when saving", async () => {
      await loader.saveWorkflow(sampleWorkflow);

      const updatedWorkflow = {
        ...sampleWorkflow,
        name: "Updated Test Workflow",
        description: "Updated description",
      };

      await loader.saveWorkflow(updatedWorkflow);

      const loadedWorkflow = await loader.loadWorkflow(sampleWorkflow.id);
      expect(loadedWorkflow?.name).toBe("Updated Test Workflow");
      expect(loadedWorkflow?.description).toBe("Updated description");
    });
  });

  describe("Deleting Workflows", () => {
    it("should delete a workflow", async () => {
      await loader.saveWorkflow(sampleWorkflow);

      const deleted = await loader.deleteWorkflow(sampleWorkflow.id);
      expect(deleted).toBe(true);

      const loadedWorkflow = await loader.loadWorkflow(sampleWorkflow.id);
      expect(loadedWorkflow).toBeNull();
    });

    it("should return false when deleting non-existent workflow", async () => {
      const deleted = await loader.deleteWorkflow("non-existent-id");
      expect(deleted).toBe(false);
    });
  });

  describe("Workflow Templates", () => {
    it("should create a workflow template", () => {
      const template = loader.createWorkflowTemplate();

      expect(template).toBeDefined();
      expect(template.id).toBe("");
      expect(template.name).toBe("");
      expect(template.steps).toHaveLength(0);
      expect(template.triggers).toHaveLength(0);
      expect(template.enabled).toBe(true);
    });

    it("should create document processing workflow template", () => {
      const workflow = loader.createDocumentProcessingWorkflow(
        "Test Doc Processing",
        "Test document processing workflow"
      );

      expect(workflow.name).toBe("Test Doc Processing");
      expect(workflow.description).toBe("Test document processing workflow");
      expect(workflow.steps.length).toBeGreaterThan(0);
      expect(workflow.steps.some((s) => s.type === "document-analysis")).toBe(
        true
      );
      expect(workflow.triggers.some((t) => t.type === "file-watch")).toBe(true);
    });

    it("should create estimation workflow template", () => {
      const workflow = loader.createEstimationWorkflow(
        "Test Estimation",
        "Test estimation workflow"
      );

      expect(workflow.name).toBe("Test Estimation");
      expect(workflow.description).toBe("Test estimation workflow");
      expect(workflow.steps.length).toBeGreaterThan(0);
      expect(workflow.steps.some((s) => s.type === "estimation")).toBe(true);
      expect(
        workflow.steps.some((s) => s.type === "communication-generation")
      ).toBe(true);
    });
  });

  describe("Validation", () => {
    it("should validate a correct workflow config", () => {
      const validation = loader.validateWorkflowConfig(sampleConfig);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should detect missing version", () => {
      const invalidConfig = { ...sampleConfig };
      delete (invalidConfig as any).version;

      const validation = loader.validateWorkflowConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) => e.includes("version is required"))
      ).toBe(true);
    });

    it("should detect invalid workflows array", () => {
      const invalidConfig = { ...sampleConfig, workflows: "not-an-array" };

      const validation = loader.validateWorkflowConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) => e.includes("must be an array"))
      ).toBe(true);
    });

    it("should detect workflow validation errors", () => {
      const invalidWorkflow = {
        id: "",
        name: "",
        steps: [],
        triggers: [],
      };

      const invalidConfig = {
        ...sampleConfig,
        workflows: [invalidWorkflow],
      };

      const validation = loader.validateWorkflowConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should detect duplicate step IDs", () => {
      const workflowWithDuplicateSteps: CoreWorkflowDefinition = {
        ...sampleWorkflow,
        steps: [
          {
            id: "duplicate-step",
            name: "Step 1",
            type: "document-analysis",
            config: {},
            dependencies: [],
          },
          {
            id: "duplicate-step",
            name: "Step 2",
            type: "document-analysis",
            config: {},
            dependencies: [],
          },
        ],
      };

      const invalidConfig = {
        ...sampleConfig,
        workflows: [workflowWithDuplicateSteps],
      };

      const validation = loader.validateWorkflowConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) => e.includes("Duplicate step ID"))
      ).toBe(true);
    });

    it("should detect invalid step dependencies", () => {
      const workflowWithInvalidDeps: CoreWorkflowDefinition = {
        ...sampleWorkflow,
        steps: [
          {
            id: "step-1",
            name: "Step 1",
            type: "document-analysis",
            config: {},
            dependencies: ["non-existent-step"],
          },
        ],
      };

      const invalidConfig = {
        ...sampleConfig,
        workflows: [workflowWithInvalidDeps],
      };

      const validation = loader.validateWorkflowConfig(invalidConfig);

      expect(validation.valid).toBe(false);
      expect(
        validation.errors.some((e) => e.includes("Invalid dependency"))
      ).toBe(true);
    });
  });

  describe("Template Processing", () => {
    it("should process workflows with templates", async () => {
      const configWithTemplates: WorkflowConfigFile = {
        version: "1.0.0",
        workflows: [
          {
            ...sampleWorkflow,
            steps: [
              {
                id: "templated-step",
                name: "Templated Step",
                type: "document-analysis",
                template: "document-extraction",
                config: { customOption: true },
                dependencies: [],
              },
            ],
          },
        ],
        templates: {
          "document-extraction": {
            type: "document-analysis",
            config: {
              extractText: true,
              extractImages: false,
            },
          },
        },
      };

      await writeFile(
        testConfigPath,
        JSON.stringify(configWithTemplates, null, 2)
      );

      const workflows = await loader.loadWorkflows();
      const step = workflows[0].steps[0];

      expect(step.config.extractText).toBe(true);
      expect(step.config.extractImages).toBe(false);
      expect(step.config.customOption).toBe(true);
      expect(step.id).toBe("templated-step"); // ID should be preserved
    });
  });
});
