import { Router } from "express";
import { HealthCheckService } from "../services/HealthCheckService";

const router = Router();
const healthCheckService = new HealthCheckService();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Comprehensive health check endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   enum: [development, production, test]
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *                 version:
 *                   type: string
 *                 components:
 *                   type: object
 *                   properties:
 *                     ollama:
 *                       type: object
 *                     database:
 *                       type: object
 *                     redis:
 *                       type: object
 *                     storage:
 *                       type: object
 *                     system:
 *                       type: object
 *                 diagnostics:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", async (req, res) => {
  try {
    const healthStatus = await healthCheckService.getHealthStatus();
    
    // Set appropriate HTTP status code based on health
    let httpStatus = 200;
    if (healthStatus.status === 'degraded') {
      httpStatus = 200; // Still OK, but with warnings
    } else if (healthStatus.status === 'unhealthy') {
      httpStatus = 503; // Service Unavailable
    }
    
    res.status(httpStatus).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check service failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/health/diagnostics:
 *   get:
 *     summary: Get detailed diagnostic information
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Diagnostic information
 */
router.get("/diagnostics", async (req, res) => {
  try {
    const healthStatus = await healthCheckService.getHealthStatus();
    res.json({
      environment: healthStatus.environment,
      diagnostics: healthStatus.diagnostics,
      timestamp: healthStatus.timestamp,
    });
  } catch (error) {
    console.error('Diagnostics check failed:', error);
    res.status(500).json({
      error: 'Diagnostics service failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/health/readiness:
 *   get:
 *     summary: Readiness probe for deployment
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get("/readiness", async (req, res) => {
  try {
    const healthStatus = await healthCheckService.getHealthStatus();
    
    // Service is ready if it's healthy or degraded (but not unhealthy)
    const isReady = healthStatus.status !== 'unhealthy';
    
    if (isReady) {
      res.json({
        status: 'ready',
        timestamp: healthStatus.timestamp,
        environment: healthStatus.environment,
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: healthStatus.timestamp,
        environment: healthStatus.environment,
        issues: healthStatus.diagnostics.filter(d => d.level === 'error'),
      });
    }
  } catch (error) {
    console.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      error: 'Readiness check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/health/liveness:
 *   get:
 *     summary: Liveness probe for deployment
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get("/liveness", (req, res) => {
  // Simple liveness check - if we can respond, we're alive
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
