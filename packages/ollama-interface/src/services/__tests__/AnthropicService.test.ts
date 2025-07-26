import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnthropicService } from '../AnthropicService.js';
import { CloudLLMConfig } from '@ai-toolkit/shared';

// Mock fetch globally
global.fetch = vi.fn();

describe('AnthropicService', () => {
  let service: AnthropicService;
  let mockConfig: CloudLLMConfig;

  beforeEach(() => {
    service = new AnthropicService();
    mockConfig = {
      provider: 'anthropic',
      apiKey: 'test-api-key',
      defaultModel: 'claude-3-5-sonnet-20241022',
      timeout: 30000,
      maxRetries: 3
    };
    vi.clearAllMocks();
  });

  it('should initialize with correct provider', () => {
    expect(service.getProvider()).toBe('anthropic');
  });

  it('should return capabilities', () => {
    const capabilities = service.getCapabilities();
    expect(capabilities.streaming).toBe(true);
    expect(capabilities.functionCalling).toBe(true);
    expect(capabilities.imageInput).toBe(true);
    expect(capabilities.maxContextLength).toBe(200000);
    expect(capabilities.supportedModels.length).toBeGreaterThan(0);
  });

  it('should configure service', () => {
    expect(service.isConfigured()).toBe(false);
    service.configure(mockConfig);
    expect(service.isConfigured()).toBe(true);
  });

  it('should get available models', async () => {
    const models = await service.getAvailableModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty('id');
    expect(models[0]).toHaveProperty('name');
    expect(models[0]).toHaveProperty('provider', 'anthropic');
  });

  it('should set and get default model', () => {
    service.setDefaultModel('claude-3-opus-20240229');
    expect(service.getDefaultModel()).toBe('claude-3-opus-20240229');
  });

  it('should estimate tokens', () => {
    const text = 'Hello world';
    const tokens = service.estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
    expect(typeof tokens).toBe('number');
  });

  it('should estimate cost', () => {
    const cost = service.estimateCost(1000, 500, 'claude-3-5-sonnet-20241022');
    expect(cost.inputCost).toBeGreaterThan(0);
    expect(cost.outputCost).toBeGreaterThan(0);
    expect(cost.totalCost).toBe(cost.inputCost + cost.outputCost);
    expect(cost.currency).toBe('USD');
  });

  it('should validate config', async () => {
    const mockResponse = { ok: true };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const isValid = await service.validateConfig(mockConfig);
    expect(isValid).toBe(true);
    expect(fetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-api-key',
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
  });

  it('should perform health check', async () => {
    service.configure(mockConfig);
    const mockResponse = { ok: true };
    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const isHealthy = await service.healthCheck();
    expect(isHealthy).toBe(true);
  });

  it('should throw error when not configured', async () => {
    await expect(service.generateText('test')).rejects.toThrow('Anthropic service not configured');
  });
});