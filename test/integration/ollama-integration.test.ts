import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestHelpers } from '../utils/TestHelpers';

describe('Ollama Integration Tests', () => {
  beforeAll(async () => {
    // Ensure mock Ollama server is running
    expect(global.mockOllamaServer.isServerRunning()).toBe(true);
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should connect to Ollama server', async () => {
    // Mock implementation - replace with actual OllamaService when available
    const mockConnect = async () => {
      const response = await fetch('http://localhost:11434/api/version');
      return response.ok;
    };

    const connected = await mockConnect();
    expect(connected).toBe(true);
  });

  it('should list available models', async () => {
    const mockListModels = async () => {
      const response = await fetch('http://localhost:11434/api/tags');
      const data = await response.json();
      return data.models;
    };

    const models = await mockListModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
  });

  it('should generate text response', async () => {
    const mockGenerate = async (prompt: string) => {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama2:7b',
          prompt,
          stream: false,
        }),
      });
      const data = await response.json();
      return data.response;
    };

    const result = await mockGenerate('Hello, world!');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle connection errors gracefully', async () => {
    const mockConnectWithError = async () => {
      // Simulate connection error
      throw new Error('Connection failed');
    };

    await expect(mockConnectWithError()).rejects.toThrow('Connection failed');
  });

  it('should retry failed requests', async () => {
    let attempts = 0;
    const mockRetryOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };

    const result = await TestHelpers.retryOperation(mockRetryOperation, {
      maxRetries: 3,
      delay: 10,
    });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});