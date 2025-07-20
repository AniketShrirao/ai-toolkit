import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fetch from 'node-fetch';
import { OllamaServiceImpl } from '../OllamaServiceImpl.js';
import { ConnectionConfig, Model, AnalysisType } from '@ai-toolkit/shared';

// Mock node-fetch
vi.mock('node-fetch');
const mockFetch = vi.mocked(fetch);

describe('OllamaServiceImpl', () => {
  let service: OllamaServiceImpl;
  let mockConfig: Partial<ConnectionConfig>;

  beforeEach(() => {
    mockConfig = {
      host: 'localhost',
      port: 11434,
      timeout: 5000,
      retries: 2
    };
    service = new OllamaServiceImpl(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default config when no config provided', () => {
      const defaultService = new OllamaServiceImpl();
      const config = defaultService.getConfig();
      
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(11434);
      expect(config.timeout).toBe(30000);
      expect(config.retries).toBe(3);
    });

    it('should merge provided config with defaults', () => {
      const config = service.getConfig();
      
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(11434);
      expect(config.timeout).toBe(5000);
      expect(config.retries).toBe(2);
    });

    it('should update config', () => {
      service.updateConfig({ host: 'remote-host', port: 8080 });
      const config = service.getConfig();
      
      expect(config.host).toBe('remote-host');
      expect(config.port).toBe(8080);
      expect(config.timeout).toBe(5000); // Should retain existing values
    });
  });

  describe('Connection Management', () => {
    it('should connect successfully when Ollama is available', async () => {
      // Mock successful version response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '0.1.0' })
      } as any);

      // Mock successful models response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as any);

      const connected = await service.connect();
      
      expect(connected).toBe(true);
      expect(service.isConnected()).toBe(true);
    });

    it('should fail to connect when Ollama is not available', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const connected = await service.connect();
      
      expect(connected).toBe(false);
      expect(service.isConnected()).toBe(false);
    });

    it('should disconnect and clear state', async () => {
      // First connect
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '0.1.0' })
      } as any);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as any);

      await service.connect();
      expect(service.isConnected()).toBe(true);

      // Then disconnect
      await service.disconnect();
      expect(service.isConnected()).toBe(false);
      expect(service.getCurrentModel()).toBeNull();
    });

    it('should get connection status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '0.1.0' })
      } as any);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [{ name: 'llama2' }] })
      } as any);

      const status = await service.getConnectionStatus();
      
      expect(status.connected).toBe(true);
      expect(status.version).toBe('0.1.0');
      expect(status.models).toBe(1);
    });
  });

  describe('Model Management', () => {
    it('should get available models', async () => {
      const mockModels = [
        {
          name: 'llama2:7b',
          size: 3825819519,
          digest: 'abc123',
          modified_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: mockModels })
      } as any);

      const models = await service.getAvailableModels();
      
      expect(models).toHaveLength(1);
      expect(models[0].name).toBe('llama2:7b');
      expect(models[0].size).toBe('3.56 GB');
      expect(models[0].capabilities).toContain('text-generation');
      expect(models[0].capabilities).toContain('code-analysis');
    });

    it('should handle model loading', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: '' })
      } as any);

      await service.loadModel('llama2:7b');
      
      expect(service.getCurrentModel()).toBe('llama2:7b');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: 'llama2:7b',
            prompt: '',
            stream: false
          })
        })
      );
    });

    it('should handle model switching', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: '' })
      } as any);

      await service.switchModel('mistral:7b');
      
      expect(service.getCurrentModel()).toBe('mistral:7b');
    });

    it('should unload model', async () => {
      // First load a model
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: '' })
      } as any);
      await service.loadModel('llama2:7b');
      
      // Then unload it
      await service.unloadModel('llama2:7b');
      
      expect(service.getCurrentModel()).toBeNull();
    });

    it('should get model info', async () => {
      const mockModelInfo = {
        details: {
          format: 'gguf',
          family: 'llama',
          families: ['llama'],
          parameter_size: '7B',
          quantization_level: 'Q4_0'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelInfo
      } as any);

      const modelInfo = await service.getModelInfo('llama2:7b');
      
      expect(modelInfo.name).toBe('llama2:7b');
      expect(modelInfo.details.format).toBe('gguf');
      expect(modelInfo.details.family).toBe('llama');
    });
  });

  describe('Health Checks', () => {
    it('should perform health check successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '0.1.0' })
      } as any);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] })
      } as any);

      const healthy = await service.healthCheck();
      
      expect(healthy).toBe(true);
    });

    it('should fail health check when service unavailable', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const healthy = await service.healthCheck();
      
      expect(healthy).toBe(false);
    });

    it('should get system info', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ version: '0.1.0' })
      } as any);

      const systemInfo = await service.getSystemInfo();
      
      expect(systemInfo.version).toBe('0.1.0');
      expect(systemInfo.uptime).toBe(0);
      expect(systemInfo.memory).toBe(0);
    });
  });

  describe('Text Generation', () => {
    beforeEach(async () => {
      // Load a model first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: '' })
      } as any);
      await service.loadModel('llama2:7b');
      vi.clearAllMocks();
    });

    it('should generate text successfully', async () => {
      const mockResponse = { response: 'Generated text response' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as any);

      const result = await service.generateText('Test prompt');
      
      expect(result).toBe('Generated text response');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            model: 'llama2:7b',
            prompt: 'Test prompt',
            stream: false,
            options: {
              temperature: undefined,
              top_p: undefined,
              top_k: undefined,
              num_predict: undefined,
              stop: undefined
            }
          })
        })
      );
    });

    it('should generate text with options', async () => {
      const mockResponse = { response: 'Generated text with options' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as any);

      const options = {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 100
      };

      const result = await service.generateText('Test prompt', options);
      
      expect(result).toBe('Generated text with options');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          body: JSON.stringify({
            model: 'llama2:7b',
            prompt: 'Test prompt',
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              top_k: undefined,
              num_predict: 100,
              stop: undefined
            }
          })
        })
      );
    });

    it('should throw error when no model loaded', async () => {
      const serviceWithoutModel = new OllamaServiceImpl();
      
      await expect(serviceWithoutModel.generateText('Test prompt'))
        .rejects.toThrow('No model loaded. Please load a model first.');
    });

    it('should handle generation errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Generation failed'));

      await expect(service.generateText('Test prompt'))
        .rejects.toThrow('Failed to generate text: Generation failed');
    });
  });

  describe('Document Analysis', () => {
    beforeEach(async () => {
      // Load a model first
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: '' })
      } as any);
      await service.loadModel('llama2:7b');
      vi.clearAllMocks();
    });

    it('should analyze document for requirements', async () => {
      const mockResponse = { response: 'Extracted requirements analysis' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as any);

      const result = await service.analyzeDocument('Document content', 'requirements');
      
      expect(result.type).toBe('requirements');
      expect(result.data).toBe('Extracted requirements analysis');
      expect(result.confidence).toBe(0.8);
      expect(result.metadata.model).toBe('llama2:7b');
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should extract requirements from document', async () => {
      const mockRequirements = [
        {
          id: '1',
          type: 'functional',
          priority: 'high',
          description: 'User login functionality',
          acceptanceCriteria: ['User can login with email', 'Password validation']
        }
      ];
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: JSON.stringify(mockRequirements) })
      } as any);

      const result = await service.extractRequirements('Document with requirements');
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].type).toBe('functional');
      expect(result[0].description).toBe('User login functionality');
    });

    it('should handle invalid JSON in requirements extraction', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Invalid JSON response' })
      } as any);

      const result = await service.extractRequirements('Document content');
      
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Invalid JSON response');
      expect(result[0].type).toBe('functional');
    });

    it('should generate project estimate', async () => {
      const mockEstimate = {
        totalHours: 120,
        totalCost: 12000,
        breakdown: [],
        risks: [],
        assumptions: ['Standard development practices'],
        confidence: 0.8
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: JSON.stringify(mockEstimate) })
      } as any);

      const requirements = [
        {
          id: '1',
          type: 'functional' as const,
          priority: 'high' as const,
          description: 'Test requirement',
          acceptanceCriteria: [],
          complexity: 3,
          estimatedHours: 8
        }
      ];

      const result = await service.generateEstimate(requirements);
      
      expect(result.totalHours).toBe(120);
      expect(result.totalCost).toBe(12000);
      expect(result.confidence).toBe(0.8);
    });

    it('should provide fallback estimate for invalid JSON', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Invalid JSON' })
      } as any);

      const requirements = [
        {
          id: '1',
          type: 'functional' as const,
          priority: 'high' as const,
          description: 'Test requirement',
          acceptanceCriteria: [],
          complexity: 3,
          estimatedHours: 8
        }
      ];

      const result = await service.generateEstimate(requirements);
      
      expect(result.totalHours).toBe(8); // 1 requirement * 8 hours
      expect(result.totalCost).toBe(800); // 8 hours * 100 rate
      expect(result.confidence).toBe(0.5);
    });

    it('should summarize content with different lengths', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Short summary' })
      } as any);

      const result = await service.summarizeContent('Long content to summarize', 'short');
      
      expect(result).toBe('Short summary');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          body: expect.stringContaining('in 2-3 sentences')
        })
      );
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry operations with exponential backoff', async () => {
      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'Success';
      });

      const result = await service.retry(operation, 3);
      
      expect(result).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries exceeded', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(service.retry(operation, 2))
        .rejects.toThrow('Persistent failure');
      
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle timeout in makeRequest', async () => {
      // Create a service with very short timeout
      const shortTimeoutService = new OllamaServiceImpl({ timeout: 1 });
      
      // Mock a delayed response that will timeout
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      // getConnectionStatus catches errors and returns { connected: false }
      const status = await shortTimeoutService.getConnectionStatus();
      expect(status.connected).toBe(false);
    });
  });

  describe('Utility Methods', () => {
    it('should format bytes correctly', () => {
      const service = new OllamaServiceImpl();
      
      // Access private method through any cast for testing
      const formatBytes = (service as any).formatBytes;
      
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should infer model capabilities correctly', () => {
      const service = new OllamaServiceImpl();
      
      // Access private method through any cast for testing
      const inferCapabilities = (service as any).inferCapabilities;
      
      const llamaCapabilities = inferCapabilities('llama2:7b');
      expect(llamaCapabilities).toContain('text-generation');
      expect(llamaCapabilities).toContain('code-analysis');
      expect(llamaCapabilities).toContain('document-analysis');
      
      const codeCapabilities = inferCapabilities('codellama:7b');
      expect(codeCapabilities).toContain('code-analysis');
      
      const translateCapabilities = inferCapabilities('translate-model');
      expect(translateCapabilities).toContain('translation');
    });
  });
});