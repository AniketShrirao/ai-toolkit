import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';

// Dynamic imports to avoid bundling issues
let OllamaServiceImpl: any;
let CloudLLMManager: any;

// Try to import AI services, but don't fail if they're not available
const initializeAIServices = async () => {
  try {
    const ollamaModule = await import('@ai-toolkit/ollama-interface');
    OllamaServiceImpl = ollamaModule.OllamaServiceImpl;
    CloudLLMManager = ollamaModule.CloudLLMManager;
  } catch (error) {
    console.warn('AI services not available:', error);
  }
};

const router = Router();

// Initialize AI services on module load
initializeAIServices();

// In-memory service instances (in production, consider using a service registry)
const services = new Map<string, any>();

interface ChatRequest {
  message: string;
  provider: 'ollama' | 'openai' | 'anthropic';
  model?: string;
  config?: {
    baseUrl?: string;
    apiKey?: string;
  };
  options?: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  };
}

interface ChatResponse {
  response: string;
  model?: string;
  provider: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  cost?: number;
}

// Get or create service instance
async function getService(provider: string, config?: any) {
  if (!OllamaServiceImpl && !CloudLLMManager) {
    throw new Error('AI services not available. Please ensure @ai-toolkit/ollama-interface is properly installed.');
  }

  const serviceKey = `${provider}-${JSON.stringify(config || {})}`;
  
  if (services.has(serviceKey)) {
    return services.get(serviceKey);
  }

  let service;
  
  if (provider === 'ollama') {
    if (!OllamaServiceImpl) {
      throw new Error('Ollama service not available');
    }
    service = new OllamaServiceImpl();
    await service.connect(config);
  } else {
    if (!CloudLLMManager) {
      throw new Error('Cloud LLM services not available');
    }
    const manager = new CloudLLMManager();
    service = manager.getService(provider);
    service.configure(config);
  }
  
  services.set(serviceKey, service);
  return service;
}

// POST /api/ai-chat/send - Send message to AI service
router.post('/send', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      message,
      provider = 'ollama',
      model,
      config = {},
      options = {}
    }: ChatRequest = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Get service instance
    const service = await getService(provider, config);

    // Set model if specified
    if (model) {
      if (provider === 'ollama') {
        await service.switchModel(model);
      } else {
        service.setDefaultModel(model);
      }
    }

    // Generate response
    let response: ChatResponse;
    
    if (provider === 'ollama') {
      const text = await service.generateText(message, options);
      response = {
        response: text,
        model: service.getCurrentModel(),
        provider,
      };
    } else {
      const result = await service.generateText(message, options);
      response = {
        response: result.content,
        model: result.model,
        provider,
        usage: result.usage ? {
          input_tokens: result.usage.input_tokens,
          output_tokens: result.usage.output_tokens,
          total_tokens: result.usage.total_tokens,
        } : undefined,
        cost: result.cost?.total,
      };
    }

    res.json(response);

  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: 'Failed to process AI request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ai-chat/stream - Stream response from AI service
router.post('/stream', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      message,
      provider = 'ollama',
      model,
      config = {},
      options = {}
    }: ChatRequest = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Get service instance
    const service = await getService(provider, config);

    // Set model if specified
    if (model) {
      if (provider === 'ollama') {
        await service.switchModel(model);
      } else {
        service.setDefaultModel(model);
      }
    }

    // Stream response
    try {
      const stream = service.generateTextStream(message, options);
      let fullResponse = '';

      for await (const chunk of stream) {
        const content = provider === 'ollama' ? chunk : chunk.content;
        fullResponse += content;
        
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk', 
          content,
          fullResponse 
        })}\n\n`);
      }

      // Send completion event
      res.write(`data: ${JSON.stringify({ 
        type: 'complete',
        response: fullResponse,
        model: provider === 'ollama' ? service.getCurrentModel() : model,
        provider
      })}\n\n`);

    } catch (streamError) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        error: streamError instanceof Error ? streamError.message : 'Stream error'
      })}\n\n`);
    }

    res.end();

  } catch (error) {
    console.error('AI chat stream error:', error);
    res.status(500).json({
      error: 'Failed to process AI stream request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/ai-chat/models - Get available models for a provider
router.get('/models/:provider', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const config = req.query;

    const service = await getService(provider, config);
    const models = await service.getAvailableModels();

    res.json({
      provider,
      models: provider === 'ollama' 
        ? models.map((m: any) => ({ id: m.name, name: m.name, size: m.size }))
        : models
    });

  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({
      error: 'Failed to get available models',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/ai-chat/test - Test connection to AI service
router.post('/test', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { provider = 'ollama', config = {} } = req.body;

    const service = await getService(provider, config);
    const isHealthy = await service.healthCheck();

    if (isHealthy) {
      const models = await service.getAvailableModels();
      res.json({
        success: true,
        provider,
        models: provider === 'ollama' 
          ? models.map((m: any) => m.name)
          : models.map((m: any) => m.id),
        message: 'Successfully connected to AI service'
      });
    } else {
      res.status(503).json({
        success: false,
        provider,
        message: 'AI service is not healthy'
      });
    }

  } catch (error) {
    console.error('AI service test error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI service connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;