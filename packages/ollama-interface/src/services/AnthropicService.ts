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
 * Anthropic Claude API adapter implementation
 */
export class AnthropicService implements ICloudLLMService {
  private config: CloudLLMConfig | null = null;
  private defaultModel = 'claude-3-5-sonnet-20241022';
  private usageStats = {
    totalRequests: 0,
    totalTokens: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    totalCost: { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' },
    requestsToday: 0,
    costToday: { inputCost: 0, outputCost: 0, totalCost: 0, currency: 'USD' }
  };

  private readonly models: CloudModel[] = [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      capabilities: ['text-generation', 'code-analysis', 'document-analysis', 'summarization'],
      contextLength: 200000,
      costPer1kTokens: { input: 0.003, output: 0.015 },
      description: 'Most intelligent model, ideal for complex reasoning and analysis'
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku',
      provider: 'anthropic',
      capabilities: ['text-generation', 'code-analysis', 'document-analysis', 'summarization'],
      contextLength: 200000,
      costPer1kTokens: { input: 0.0008, output: 0.004 },
      description: 'Fastest model for quick tasks and real-time applications'
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      capabilities: ['text-generation', 'code-analysis', 'document-analysis', 'summarization'],
      contextLength: 200000,
      costPer1kTokens: { input: 0.015, output: 0.075 },
      description: 'Most powerful model for highly complex tasks'
    }
  ];

  getProvider(): LLMProvider {
    return 'anthropic';
  }

  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      imageInput: true,
      maxContextLength: 200000,
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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
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
      throw new Error('Anthropic service not configured');
    }

    const model = options?.model || this.defaultModel;
    const requestBody = {
      model,
      max_tokens: options?.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
      top_p: options?.topP,
      stop_sequences: options?.stop,
      ...(options?.systemPrompt && { system: options.systemPrompt })
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config!.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const usage: TokenUsage = {
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      totalTokens: data.usage.input_tokens + data.usage.output_tokens
    };

    const cost = this.estimateCost(usage.inputTokens, usage.outputTokens, model);
    this.updateUsageStats(usage, cost);

    return {
      content: data.content[0].text,
      model,
      provider: 'anthropic',
      usage,
      cost,
      finishReason: data.stop_reason,
      requestId: data.id
    };
  }

  async *generateTextStream(
    prompt: string,
    options?: CloudGenerationOptions
  ): AsyncGenerator<{ content: string; usage?: TokenUsage }, CloudLLMResponse, unknown> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic service not configured');
    }

    const model = options?.model || this.defaultModel;
    const requestBody = {
      model,
      max_tokens: options?.maxTokens || 4096,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
      top_p: options?.topP,
      stop_sequences: options?.stop,
      stream: true,
      ...(options?.systemPrompt && { system: options.systemPrompt })
    };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config!.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    let fullContent = '';
    let usage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    let finishReason = 'stop';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                const content = parsed.delta.text;
                fullContent += content;
                yield { content };
              }
              
              if (parsed.type === 'message_stop') {
                const cost = this.estimateCost(usage.inputTokens, usage.outputTokens, model);
                this.updateUsageStats(usage, cost);
                
                return {
                  content: fullContent,
                  model,
                  provider: 'anthropic',
                  usage,
                  cost,
                  finishReason: finishReason as any
                };
              }
              
              if (parsed.usage) {
                usage = {
                  inputTokens: parsed.usage.input_tokens,
                  outputTokens: parsed.usage.output_tokens,
                  totalTokens: parsed.usage.input_tokens + parsed.usage.output_tokens
                };
              }
              
              if (parsed.delta?.stop_reason) {
                finishReason = parsed.delta.stop_reason;
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
      provider: 'anthropic',
      usage,
      cost,
      finishReason: finishReason as any
    };
  }

  async analyzeDocument(
    content: string,
    analysisType: AnalysisType,
    options?: CloudGenerationOptions
  ): Promise<AnalysisResult> {
    const systemPrompt = this.getAnalysisSystemPrompt(analysisType);
    const response = await this.generateText(content, { ...options, systemPrompt });
    
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
    // Anthropic uses similar tokenization to OpenAI
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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config!.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async getRateLimitStatus() {
    // Anthropic doesn't provide rate limit info in a standard endpoint
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
        provider: 'anthropic',
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