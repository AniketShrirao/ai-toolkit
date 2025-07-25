import { Router, Request, Response } from "express";
import {
  validateEstimationRequest,
  validatePagination,
} from "../middleware/validation.js";
import { ProcessingError } from "../middleware/errorHandler.js";

// Use mock implementations for testing
import { EstimationEngine } from "../__mocks__/@ai-toolkit/estimation-engine.js";
import { DatabaseManager } from "../__mocks__/@ai-toolkit/data-layer.js";

const router = Router();

/**
 * @swagger
 * /api/estimation/estimate:
 *   post:
 *     summary: Generate project estimation
 *     tags: [Estimation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requirements
 *             properties:
 *               requirements:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Requirement'
 *               hourlyRate:
 *                 type: number
 *                 default: 100
 *                 description: Hourly rate for cost calculation
 *               complexityMultiplier:
 *                 type: number
 *                 default: 1.0
 *                 description: Multiplier for complexity adjustment
 *               historicalData:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Historical project data for better estimation
 *     responses:
 *       200:
 *         description: Project estimation generated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectEstimate'
 *       400:
 *         description: Invalid requirements data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/estimate",
  validateEstimationRequest,
  async (req: Request, res: Response) => {
    const {
      requirements,
      hourlyRate = 100,
      complexityMultiplier = 1.0,
      historicalData,
    } = req.body;

    try {
      const estimationEngine = new EstimationEngine();

      // Configure estimation parameters
      if (hourlyRate) {
        estimationEngine.setHourlyRates({ default: hourlyRate });
      }

      if (complexityMultiplier !== 1.0) {
        estimationEngine.updateComplexityFactors({
          multiplier: complexityMultiplier,
        });
      }

      // Calculate complexity
      const complexity =
        await estimationEngine.calculateComplexity(requirements);

      // Generate time estimate
      const timeEstimate = await estimationEngine.generateTimeEstimate(
        complexity,
        historicalData
      );

      // Assess risks
      const riskAssessment = await estimationEngine.assessRisks(requirements);

      // Combine into project estimate
      const projectEstimate = {
        totalHours: timeEstimate.totalHours,
        totalCost: timeEstimate.totalHours * hourlyRate,
        breakdown: timeEstimate.breakdown,
        risks: riskAssessment.risks,
        assumptions: timeEstimate.assumptions,
        confidence: Math.min(
          timeEstimate.confidence,
          riskAssessment.confidence
        ),
      };

      // Save estimation to database
      const dbManager = new DatabaseManager();
      await dbManager.saveEstimation({
        requirements,
        estimate: projectEstimate,
        parameters: { hourlyRate, complexityMultiplier },
        createdAt: new Date(),
      });

      res.json(projectEstimate);
    } catch (error) {
      throw new ProcessingError("Failed to generate estimation", error);
    }
  }
);

/**
 * @swagger
 * /api/estimation/history:
 *   get:
 *     summary: Get estimation history
 *     tags: [Estimation]
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
 *     responses:
 *       200:
 *         description: List of past estimations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estimations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       estimate:
 *                         $ref: '#/components/schemas/ProjectEstimate'
 *                       parameters:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
router.get(
  "/history",
  validatePagination,
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const dbManager = new DatabaseManager();
      const estimations = await dbManager.getEstimationHistory({ page, limit });

      res.json(estimations);
    } catch (error) {
      throw new ProcessingError("Failed to retrieve estimation history", error);
    }
  }
);

/**
 * @swagger
 * /api/estimation/complexity:
 *   post:
 *     summary: Calculate complexity score for requirements
 *     tags: [Estimation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requirements
 *             properties:
 *               requirements:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Requirement'
 *     responses:
 *       200:
 *         description: Complexity analysis results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overallComplexity:
 *                   type: number
 *                   description: Overall complexity score
 *                 breakdown:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       requirementId:
 *                         type: string
 *                       complexity:
 *                         type: number
 *                       factors:
 *                         type: object
 *                         description: Factors contributing to complexity
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Recommendations for complexity reduction
 */
router.post(
  "/complexity",
  validateEstimationRequest,
  async (req: Request, res: Response) => {
    const { requirements } = req.body;

    try {
      const estimationEngine = new EstimationEngine();
      const complexityScore =
        await estimationEngine.calculateComplexity(requirements);

      res.json(complexityScore);
    } catch (error) {
      throw new ProcessingError("Failed to calculate complexity", error);
    }
  }
);

export default router;
