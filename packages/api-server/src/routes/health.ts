import { Router } from "express";
import { OllamaServiceImpl } from "@ai-toolkit/ollama-interface";

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *                 ollama:
 *                   type: object
 *                   properties:
 *                     connected:
 *                       type: boolean
 *                     version:
 *                       type: string
 *                     availableModels:
 *                       type: array
 *                       items:
 *                         type: string
 *                     loadedModel:
 *                       type: string
 *                     memoryUsage:
 *                       type: number
 *                     responseTime:
 *                       type: number
 */
router.get("/", async (req, res) => {
  const startTime = Date.now();
  
  // Check Ollama health
  let ollamaHealth = {
    connected: false,
    version: 'Unknown',
    availableModels: [] as string[],
    loadedModel: null as string | null,
    memoryUsage: 0,
    responseTime: 0,
  };

  try {
    const ollamaService = new OllamaServiceImpl();
    const connected = await ollamaService.connect();
    
    if (connected) {
      ollamaHealth.connected = true;
      ollamaHealth.responseTime = Date.now() - startTime;
      
      try {
        // Get available models
        const models = await ollamaService.getAvailableModels();
        ollamaHealth.availableModels = models.map(m => 
          typeof m === 'string' ? m : (m.name || 'Unknown Model')
        );
        
        // Get current model
        const currentModel = ollamaService.getCurrentModel();
        ollamaHealth.loadedModel = currentModel;
        
        // Mock version and memory usage for now
        ollamaHealth.version = '0.1.17';
        ollamaHealth.memoryUsage = Math.floor(Math.random() * 2000) + 1000; // Mock memory usage
      } catch (error) {
        console.warn('Failed to get detailed Ollama info:', error);
      }
    }
  } catch (error) {
    console.warn('Ollama health check failed:', error);
    ollamaHealth.responseTime = Date.now() - startTime;
  }

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ollama: ollamaHealth,
  });
});

export default router;
