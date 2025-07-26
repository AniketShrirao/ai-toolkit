import {
  CloudModel,
  CloudGenerationOptions,
  CloudLLMResponse,
  CloudLLMConfig,
  ProviderCapabilities,
  LLMProvider,
  TokenUsage,
  CostEstimate,
  AnalysisType,
  AnalysisResult,
  Requirement,
  ProjectEstimate
} from '@ai-toolkit/shared';
import { CloudLLMService as ICloudLLMService } from '../interfaces/CloudLLMService.js';

/**
 * OpenAI ChatGPT API adapter implementation
 */
export class OpenAIService implements ICloudLLMService {
  private config: CloudLLMConfig | null = null;
  private defaultModel = 'gpt-4o-mini';
  private usageStats = {
    totalRequests: 0,
    totalTokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    totalCost: { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' },
    requestsToday: 0,
    costToday: { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' }
  };

  private readonly models: CloudModel[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      capabilities: ['text-generation', 'code-analysis', 'document-analysis', 'summarization'],
      contextLength: 128000,
      costPer1kTokens: { input: 0.005, output: 0.015 },
      description: 'Most capable GPT-4 model with vision capabilities'
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      capabilities: ['text-generation', 'code-analysis', 'document-analysis', 'summarization'],
      contextLength: 128000,
      costPer1kTokens: { input: 0.00015, output: 0.0006 },
      description: 'Affordable and intelligent small model for fast, lightweight tasks'
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      capabilities: ['text-generation', 'code-analysis', 'document-analysis', 'summarization'],
      contextLength: 128000,
      costPer1kTokens: { input: 0.01, output: 0.03 },
      description: 'Previous generation GPT-4 Turbo model'
    }
  ];

  getProvider(): LLMProvider {
    return 'openai';
  }

  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      imageInput: true,
      maxContextLength: 128000,
      supportedModels: this.models
    };
  }

  configure(config: CloudLLMConfig): void {
    this.config = config;
    if (config.defaultModel) {
      this.defaultModel = config.defaultModel;
    }
  }

  isConfigured(): boolean {
    return this.config !== null && !!this.config.apiKey;
  }

  async validateConfig(config: CloudLLMConfig): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<CloudModel[]> {
    return this.models;
  }

  async getModel(modelId: string): Promise<CloudModel> {
    const model = this.models.find(m => m.id === modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    return model;
  }

  setDefaultModel(modelId: string): void {
    this.defaultModel = modelId;
  }

  getDefaultModel(): string {
    return this.defaultModel;
  }

  async generateText(
    prompt: string,
    options?: CloudGenerationOptions
  ): Promise<CloudLLMResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI service not configured');
    }

    const model = options?.model || this.defaultModel;
    const requestBody = {
      model,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      stop: options?.stop
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const usage: TokenUsage = {
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens
    };

    const cost = this.estimateCost(usage.inputTokens, usage.outputTokens, model);
    this.updateUsageStats(usage, cost);

    return {
      content: data.choices[0].message.content,
      model,
      provider: 'openai',
      usage,
      cost,
      finishReason: data.choices[0].finish_reason,
      requestId: data.id
    };
  }

  async *generateTextStream(
    prompt: string,
    options?: CloudGenerationOptions
  ): AsyncGenerator<{ content: string; usage?: TokenUsage }, CloudLLMResponse, unknown> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI service not configured');
    }

    const model = options?.model || this.defaultModel;
    const requestBody = {
      model,
      messages: [
        ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens,
      top_p: options?.topP,
      stop: options?.stop,
      stream: true
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    let fullContent = '';
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              const cost = this.estimateCost(usage.inputTokens, usage.outputTokens, model);
              this.updateUsageStats(usage, cost);
              
              return {
                content: fullContent,
                model,
                provider: 'openai',
                usage,
                cost,
                finishReason: 'stop'
              };
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                fullContent += content;
                yield { content };
              }
              if (parsed.usage) {
                usage = {
                  inputTokens: parsed.usage.prompt_tokens,
                  outputTokens: parsed.usage.completion_tokens,
                  totalTokens: parsed.usage.total_tokens
                };
              }
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const cost = this.estimateCost(usage.inputTokens, usage.outputTokens, model);
    this.updateUsageStats(usage, cost);

    return {
      content: fullContent,
      model,
      provider: 'openai',
      usage,
      cost,
      finishReason: 'stop'
    };
  }

  async analyzeDocument(
    content: string,
    analysisType: AnalysisType,
    options?: CloudGenerationOptions
  ): Promise<AnalysisResult> {
    const systemPrompt = this.getAnalysisSystemPrompt(analysisType);
    const response = await this.generateText(content, { ...options, systemPrompt });
    
    // Parse the response based on analysis type
    return this.parseAnalysisResponse(response.content, analysisType);
  }

  async extractRequirements(
    content: string,
    options?: CloudGenerationOptions
  ): Promise<Requirement[]> {
    const systemPrompt = `Extract functional and non-functional requirements from the following document. 
    Return a JSON array of requirements with the following structure:
    {
      "id": "unique_id",
      "type": "functional" | "non-functional",
      "priority": "critical" | "high" | "medium" | "low",
      "description": "requirement description",
      "acceptanceCriteria": ["criteria1", "criteria2"],
      "complexity": 1-10,
      "estimatedHours": number
    }`;

    const response = await this.generateText(content, { ...options, systemPrompt });
    
    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error('Failed to parse requirements from response');
    }
  }

  async generateEstimate(
    requirements: Requirement[],
    options?: CloudGenerationOptions
  ): Promise<ProjectEstimate> {
    const systemPrompt = `Based on the provided requirements, generate a project estimate.
    Return a JSON object with the following structure:
    {
      "totalHours": number,
      "totalCost": number,
      "breakdown": [{"category": "string", "hours": number, "cost": number}],
      "risks": [{"description": "string", "impact": "high|medium|low", "probability": "high|medium|low"}],
      "assumptions": ["assumption1", "assumption2"],
      "confidence": 0-100
    }`;

    const requirementsText = JSON.stringify(requirements, null, 2);
    const response = await this.generateText(requirementsText, { ...options, systemPrompt });
    
    try {
      return JSON.parse(response.content);
    } catch (error) {
      throw new Error('Failed to parse estimate from response');
    }
  }

  async summarizeContent(
    content: string,
    length: 'short' | 'medium' | 'long',
    options?: CloudGenerationOptions
  ): Promise<string> {
    const lengthInstructions = {
      short: 'in 2-3 sentences',
      medium: 'in 1-2 paragraphs',
      long: 'in 3-4 paragraphs with detailed analysis'
    };

    const systemPrompt = `Summarize the following content ${lengthInstructions[length]}. 
    Focus on key points, main ideas, and actionable items.`;

    const response = await this.generateText(content, { ...options, systemPrompt });
    return response.content;
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  estimateCost(inputTokens: number, outputTokens: number, model?: string): CostEstimate {
    const modelInfo = this.models.find(m => m.id === (model || this.defaultModel));
    if (!modelInfo) {
      throw new Error(`Model ${model || this.defaultModel} not found`);
    }

    const inputCost = (inputTokens / 1000) * modelInfo.costPer1kTokens.input;
    const outputCost = (outputTokens / 1000) * modelInfo.costPer1kTokens.output;

    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD'
    };
  }

  async getUsageStats() {
    return this.usageStats;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getRateLimitStatus() {
    // OpenAI doesn't provide rate limit info in a standard endpoint
    // This would need to be tracked from response headers
    return {
      remaining: 1000,
      resetTime: new Date(Date.now() + 60000),
      limit: 1000
    };
  }

  async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  private getAnalysisSystemPrompt(analysisType: AnalysisType): string {
    const prompts = {
      requirements: 'Analyze the document and extract all requirements, categorizing them as functional or non-functional.',
      summary: 'Provide a comprehensive summary of the document, highlighting key points and main ideas.',
      structure: 'Analyze the document structure and organization, identifying sections and content hierarchy.',
      estimation: 'Analyze the requirements and provide effort estimation for implementation.',
      codebase: 'Analyze the codebase structure, dependencies, and provide architectural insights.'
    };

    return prompts[analysisType] || 'Analyze the provided content and provide relevant insights.';
  }

  private parseAnalysisResponse(content: string, analysisType: AnalysisType): AnalysisResult {
    // This is a simplified implementation - in practice, you'd want more sophisticated parsing
    return {
      type: analysisType,
      summary: content,
      keyPoints: [],
      actionItems: [],
      confidence: 0.8,
      metadata: {
        model: this.defaultModel,
        provider: 'openai',
        timestamp: new Date()
      }
    };
  }

  private updateUsageStats(usage: TokenUsage, cost: CostEstimate): void {
    this.usageStats.totalRequests++;
    this.usageStats.totalTokens.inputTokens += usage.inputTokens;
    this.usageStats.totalTokens.outputTokens += usage.outputTokens;
    this.usageStats.totalTokens.totalTokens += usage.totalTokens;
    this.usageStats.totalCost.inputCost += cost.inputCost;
    this.usageStats.totalCost.outputCost += cost.outputCost;
    this.usageStats.totalCost.totalCost += cost.totalCost;

    // Update daily stats (simplified - in practice, you'd want proper date tracking)
    this.usageStats.requestsToday++;
    this.usageStats.costToday.inputCost += cost.inputCost;
    this.usageStats.costToday.outputCost += cost.outputCost;
    this.usageStats.costToday.totalCost += cost.totalCost;
  }
}