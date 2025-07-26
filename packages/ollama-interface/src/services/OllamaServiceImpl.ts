import fetch, { RequestInit } from 'node-fetch';
import {
  Model,
  GenerationOptions,
  ConnectionConfig,
  ModelInfo,
  AnalysisType,
  AnalysisResult,
  Requirement,
  ProjectEstimate,
  ErrorInfo
} from '@ai-toolkit/shared';
import { OllamaService } from '../interfaces/OllamaService.js';

export class OllamaServiceImpl implements OllamaService {
  private config: ConnectionConfig;
  private connected: boolean = false;
  private currentModel: string | null = null;
  private connectionPool: Map<string, Date> = new Map();
  private readonly maxPoolSize = 5;

  constructor(config?: Partial<ConnectionConfig>) {
    this.config = {
      host: 'localhost',
      port: 11434,
      timeout: 30000,
      retries: 3,
      ...config
    };
  }

  private get baseUrl(): string {
    return `http://${this.config.host}:${this.config.port}`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async connect(config?: Partial<ConnectionConfig>): Promise<boolean> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      const status = await this.getConnectionStatus();
      this.connected = status.connected;
      return this.connected;
    } catch (error) {
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.currentModel = null;
    this.connectionPool.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    version?: string;
    models?: number;
  }> {
    try {
      const response = await this.makeRequest<{ version: string }>('/api/version');
      const models = await this.getAvailableModels();
      
      return {
        connected: true,
        version: response.version,
        models: models.length
      };
    } catch (error) {
      return { connected: false };
    }
  }

  async getAvailableModels(): Promise<Model[]> {
    try {
      const response = await this.makeRequest<{ models: any[] }>('/api/tags');
      
      return response.models.map(model => ({
        name: model.name,
        size: this.formatBytes(model.size),
        digest: model.digest,
        modified: new Date(model.modified_at),
        capabilities: this.inferCapabilities(model.name)
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get available models: ${errorMessage}`);
    }
  }

  private inferCapabilities(modelName: string): Array<'text-generation' | 'code-analysis' | 'document-analysis' | 'summarization' | 'translation'> {
    const capabilities: Array<'text-generation' | 'code-analysis' | 'document-analysis' | 'summarization' | 'translation'> = ['text-generation'];
    
    const name = modelName.toLowerCase();
    
    if (name.includes('code') || name.includes('llama') || name.includes('mistral')) {
      capabilities.push('code-analysis');
    }
    
    capabilities.push('document-analysis', 'summarization');
    
    if (name.includes('translate') || name.includes('multilingual')) {
      capabilities.push('translation');
    }
    
    return capabilities;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async getModelInfo(modelName: string): Promise<ModelInfo> {
    try {
      const response = await this.makeRequest<{ modelfile: string; parameters: string; template: string; details: any }>(
        `/api/show`,
        {
          method: 'POST',
          body: JSON.stringify({ name: modelName })
        }
      );

      return {
        name: modelName,
        details: response.details || {
          format: 'unknown',
          family: 'unknown',
          families: [],
          parameter_size: 'unknown',
          quantization_level: 'unknown'
        },
        size: 0, // Size not provided in show endpoint
        digest: '',
        modified_at: new Date().toISOString()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get model info for ${modelName}: ${errorMessage}`);
    }
  }

  async loadModel(modelName: string): Promise<void> {
    try {
      // Ollama loads models automatically on first use, but we can preload
      await this.makeRequest('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: modelName,
          prompt: '',
          stream: false
        })
      });
      
      this.currentModel = modelName;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load model ${modelName}: ${errorMessage}`);
    }
  }

  async unloadModel(modelName: string): Promise<void> {
    // Ollama doesn't have explicit unload, models are managed automatically
    if (this.currentModel === modelName) {
      this.currentModel = null;
    }
  }

  getCurrentModel(): string | null {
    return this.currentModel;
  }

  async switchModel(modelName: string): Promise<void> {
    await this.loadModel(modelName);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const status = await this.getConnectionStatus();
      return status.connected;
    } catch {
      return false;
    }
  }

  async getSystemInfo(): Promise<{
    version: string;
    uptime: number;
    memory: number;
    gpu?: boolean;
  }> {
    try {
      const versionResponse = await this.makeRequest<{ version: string }>('/api/version');
      
      // Ollama doesn't provide system info endpoint, so we return basic info
      return {
        version: versionResponse.version,
        uptime: 0, // Not available
        memory: 0, // Not available
        gpu: undefined // Not available
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get system info: ${errorMessage}`);
    }
  }

  async generateText(
    prompt: string,
    options?: GenerationOptions
  ): Promise<string> {
    if (!this.currentModel) {
      throw new Error('No model loaded. Please load a model first.');
    }

    try {
      const response = await this.makeRequest<{ response: string }>('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: this.currentModel,
          prompt,
          stream: false,
          options: {
            temperature: options?.temperature,
            top_p: options?.topP,
            top_k: options?.topK,
            num_predict: options?.maxTokens,
            stop: options?.stop
          }
        })
      });

      return response.response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate text: ${errorMessage}`);
    }
  }

  async *generateTextStream(
    prompt: string,
    options?: GenerationOptions
  ): AsyncGenerator<string, void, unknown> {
    if (!this.currentModel) {
      throw new Error('No model loaded. Please load a model first.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.currentModel,
          prompt,
          stream: true,
          options: {
            temperature: options?.temperature,
            top_p: options?.topP,
            top_k: options?.topK,
            num_predict: options?.maxTokens,
            stop: options?.stop
          }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = (response.body as any)?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                if (data.response) {
                  yield data.response;
                }
                if (data.done) {
                  return;
                }
              } catch (e) {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        clearTimeout(timeoutId);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate text stream: ${errorMessage}`);
    }
  }

  async analyzeDocument(
    content: string,
    analysisType: AnalysisType,
    options?: GenerationOptions
  ): Promise<AnalysisResult> {
    const prompts = {
      requirements: `Analyze the following document and extract all requirements. Format as JSON with functional and non-functional requirements:\n\n${content}`,
      summary: `Provide a comprehensive summary of the following document:\n\n${content}`,
      structure: `Analyze the structure and organization of the following document:\n\n${content}`,
      estimation: `Analyze the following requirements and provide project estimation insights:\n\n${content}`,
      codebase: `Analyze the following codebase information and provide insights:\n\n${content}`
    };

    const prompt = prompts[analysisType];
    const startTime = Date.now();
    
    try {
      const response = await this.generateText(prompt, options);
      const processingTime = Date.now() - startTime;

      return {
        type: analysisType,
        summary: response,
        keyPoints: [],
        actionItems: [],
        confidence: 0.8, // Default confidence
        data: response,
        metadata: {
          model: this.currentModel || 'unknown',
          processingTime,
          tokensUsed: Math.ceil(response.length / 4), // Rough estimate
          version: '1.0.0',
          timestamp: new Date()
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to analyze document: ${errorMessage}`);
    }
  }

  async extractRequirements(
    content: string,
    options?: GenerationOptions
  ): Promise<Requirement[]> {
    const prompt = `Extract all requirements from the following document. Return as JSON array with each requirement having: id, type (functional/non-functional), priority (high/medium/low), description, acceptanceCriteria array:\n\n${content}`;
    
    try {
      const response = await this.generateText(prompt, options);
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // If not valid JSON, return a single requirement with the response
        return [{
          id: '1',
          type: 'functional',
          priority: 'medium',
          description: response,
          acceptanceCriteria: [],
          complexity: 1,
          estimatedHours: 0
        }];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract requirements: ${errorMessage}`);
    }
  }

  async generateEstimate(
    requirements: Requirement[],
    options?: GenerationOptions
  ): Promise<ProjectEstimate> {
    const prompt = `Based on the following requirements, provide a detailed project estimate. Return as JSON with totalHours, totalCost, breakdown array, risks array, assumptions array, and confidence (0-1):\n\n${JSON.stringify(requirements, null, 2)}`;
    
    try {
      const response = await this.generateText(prompt, options);
      
      try {
        return JSON.parse(response);
      } catch {
        // Return default estimate if parsing fails
        return {
          id: `estimate-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          totalHours: requirements.length * 8,
          totalCost: requirements.length * 8 * 100,
          breakdown: [],
          risks: [],
          assumptions: ['Estimate based on requirement count'],
          confidence: 0.5,
          requirements
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate estimate: ${errorMessage}`);
    }
  }

  async summarizeContent(
    content: string,
    length: 'short' | 'medium' | 'long',
    options?: GenerationOptions
  ): Promise<string> {
    const lengthInstructions = {
      short: 'in 2-3 sentences',
      medium: 'in 1-2 paragraphs',
      long: 'in 3-4 paragraphs with detailed analysis'
    };

    const prompt = `Summarize the following content ${lengthInstructions[length]}:\n\n${content}`;
    
    try {
      return await this.generateText(prompt, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to summarize content: ${errorMessage}`);
    }
  }

  async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  updateConfig(config: Partial<ConnectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ConnectionConfig {
    return { ...this.config };
  }
}