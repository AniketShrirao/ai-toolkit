import { Router, Request, Response } from "express";
import {
  validateWorkflowCreation,
  validateWorkflowId,
  validatePagination,
} from "../middleware/validation.js";
import { NotFoundError, ProcessingError } from "../middleware/errorHandler.js";

// Use mock implementations for testing
import { WorkflowEngine } from "../__mocks__/@ai-toolkit/workflow-engine.js";
import { DatabaseManager } from "../__mocks__/@ai-toolkit/data-layer.js";

const router = Router();

/**
 * @swagger
 * /api/workflows:
 *   get:
 *     summary: Get all workflows
 *     tags: [Workflows]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, running, completed, failed]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of workflows
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workflows:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Workflow'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get("/", validatePagination, async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  try {
    const dbManager = new DatabaseManager();
    const workflows = await dbManager.getWorkflows({ page, limit, status });

    res.json(workflows);
  } catch (error) {
    throw new ProcessingError("Failed to retrieve workflows", error);
  }
});

/**
 * @swagger
 * /api/workflows/{id}:
 *   get:
 *     summary: Get workflow by ID
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workflow ID
 *     responses:
 *       200:
 *         description: Workflow details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workflow'
 *       404:
 *         description: Workflow not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", validateWorkflowId, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const dbManager = new DatabaseManager();
    const workflow = await dbManager.getWorkflow(id);

    if (!workflow) {
      throw new NotFoundError("Workflow not found");
    }

    res.json(workflow);
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new ProcessingError("Failed to retrieve workflow", error);
  }
});

/**
 * @swagger
 * /api/workflows:
 *   post:
 *     summary: Create new workflow
 *     tags: [Workflows]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - definition
 *             properties:
 *               name:
 *                 type: string
 *                 description: Workflow name
 *               definition:
 *                 type: object
 *                 required:
 *                   - steps
 *                 properties:
 *                   steps:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         type:
 *                           type: string
 *                           enum: [document_analysis, estimation, communication_generation]
 *                         config:
 *                           type: object
 *                   triggers:
 *                     type: array
 *                     items:
 *                       type: object
 *               schedule:
 *                 type: string
 *                 description: Cron schedule expression
 *               enabled:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Workflow created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workflow:
 *                   $ref: '#/components/schemas/Workflow'
 *       400:
 *         description: Invalid workflow definition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/",
  validateWorkflowCreation,
  async (req: Request, res: Response) => {
    const { name, definition, schedule, enabled = true } = req.body;

    try {
      const workflowEngine = new WorkflowEngine();
      const workflow = await workflowEngine.createWorkflow({
        name,
        definition,
        schedule,
        enabled,
      });

      res.status(201).json({
        message: "Workflow created successfully",
        workflow,
      });
    } catch (error) {
      throw new ProcessingError("Failed to create workflow", error);
    }
  }
);

/**
 * @swagger
 * /api/workflows/{id}/execute:
 *   post:
 *     summary: Execute workflow
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workflow ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: object
 *                 description: Input data for workflow execution
 *     responses:
 *       200:
 *         description: Workflow execution started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 executionId:
 *                   type: string
 *                 status:
 *                   type: string
 *       404:
 *         description: Workflow not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/:id/execute",
  validateWorkflowId,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { input = {} } = req.body;

    try {
      const workflowEngine = new WorkflowEngine();
      const result = await workflowEngine.executeWorkflow(id, input);

      res.json({
        message: "Workflow execution started",
        executionId: result.executionId,
        status: result.status,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw new NotFoundError("Workflow not found");
      }
      throw new ProcessingError("Failed to execute workflow", error);
    }
  }
);

/**
 * @swagger
 * /api/workflows/{id}/status:
 *   get:
 *     summary: Get workflow execution status
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Execution ID
 *     responses:
 *       200:
 *         description: Workflow execution status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 executionId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [running, completed, failed, cancelled]
 *                 progress:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 100
 *                 currentStep:
 *                   type: string
 *                 result:
 *                   type: object
 *                 error:
 *                   type: string
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Execution not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/:id/status",
  validateWorkflowId,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const workflowEngine = new WorkflowEngine();
      const status = await workflowEngine.getWorkflowStatus(id);

      if (!status) {
        throw new NotFoundError("Workflow execution not found");
      }

      res.json(status);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ProcessingError("Failed to get workflow status", error);
    }
  }
);

/**
 * @swagger
 * /api/workflows/{id}:
 *   put:
 *     summary: Update workflow
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workflow ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               definition:
 *                 type: object
 *               schedule:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 workflow:
 *                   $ref: '#/components/schemas/Workflow'
 *       404:
 *         description: Workflow not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/:id", validateWorkflowId, async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const dbManager = new DatabaseManager();
    const workflow = await dbManager.updateWorkflow(id, updates);

    if (!workflow) {
      throw new NotFoundError("Workflow not found");
    }

    res.json({
      message: "Workflow updated successfully",
      workflow,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new ProcessingError("Failed to update workflow", error);
  }
});

/**
 * @swagger
 * /api/workflows/{id}:
 *   delete:
 *     summary: Delete workflow
 *     tags: [Workflows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workflow ID
 *     responses:
 *       200:
 *         description: Workflow deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Workflow not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
  "/:id",
  validateWorkflowId,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const dbManager = new DatabaseManager();
      const deleted = await dbManager.deleteWorkflow(id);

      if (!deleted) {
        throw new NotFoundError("Workflow not found");
      }

      res.json({
        message: "Workflow deleted successfully",
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ProcessingError("Failed to delete workflow", error);
    }
  }
);

export default router;
