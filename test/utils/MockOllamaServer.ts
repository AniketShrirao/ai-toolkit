import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export interface MockModel {
  name: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface MockGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class MockOllamaServer {
  private server: ReturnType<typeof setupServer>;
  private models: MockModel[] = [];
  private responses: Map<string, string> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeDefaultModels();
    this.initializeDefaultResponses();
    this.server = setupServer(...this.createHandlers());
  }

  private initializeDefaultModels(): void {
    this.models = [
      {
        name: 'llama2:7b',
        size: 3825819519,
        digest: 'sha256:1a838c1e519b',
        details: {
          format: 'gguf',
          family: 'llama',
          families: ['llama'],
          parameter_size: '7B',
          quantization_level: 'Q4_0',
        },
      },
      {
        name: 'codellama:7b',
        size: 3825819519,
        digest: 'sha256:2b838c1e519b',
        details: {
          format: 'gguf',
          family: 'llama',
          families: ['llama'],
          parameter_size: '7B',
          quantization_level: 'Q4_0',
        },
      },
      {
        name: 'mistral:7b',
        size: 4109016832,
        digest: 'sha256:3c838c1e519b',
        details: {
          format: 'gguf',
          family: 'mistral',
          families: ['mistral'],
          parameter_size: '7B',
          quantization_level: 'Q4_0',
        },
      },
    ];
  }

  private initializeDefaultResponses(): void {
    // Document analysis responses
    this.responses.set('analyze-document', JSON.stringify({
      structure: {
        sections: ['Introduction', 'Requirements', 'Conclusion'],
        headings: 15,
        paragraphs: 45,
        lists: 8,
      },
      requirements: [
        {
          id: 'req-1',
          type: 'functional',
          priority: 'high',
          description: 'User authentication system',
          acceptanceCriteria: ['Login with email/password', 'Password reset functionality'],
          complexity: 3,
          estimatedHours: 16,
        },
        {
          id: 'req-2',
          type: 'non-functional',
          priority: 'medium',
          description: 'System performance requirements',
          acceptanceCriteria: ['Response time < 2 seconds', '99.9% uptime'],
          complexity: 2,
          estimatedHours: 8,
        },
      ],
      keyPoints: [
        'User authentication is critical for security',
        'Performance requirements are strict',
        'Database design needs careful consideration',
      ],
      actionItems: [
        {
          id: 'action-1',
          description: 'Set up development environment',
          priority: 'high',
          assignee: 'development-team',
          dueDate: '2024-02-15',
        },
        {
          id: 'action-2',
          description: 'Create database schema',
          priority: 'medium',
          assignee: 'database-admin',
          dueDate: '2024-02-20',
        },
      ],
      summary: 'This document outlines the requirements for a web application with user authentication, data management, and performance requirements.',
    }));

    // Project estimation responses
    this.responses.set('estimate-project', JSON.stringify({
      totalHours: 240,
      totalCost: 24000,
      breakdown: [
        {
          category: 'Frontend Development',
          hours: 80,
          cost: 8000,
          tasks: ['UI Components', 'User Interface', 'Responsive Design'],
        },
        {
          category: 'Backend Development',
          hours: 120,
          cost: 12000,
          tasks: ['API Development', 'Database Design', 'Authentication'],
        },
        {
          category: 'Testing & QA',
          hours: 40,
          cost: 4000,
          tasks: ['Unit Tests', 'Integration Tests', 'User Acceptance Testing'],
        },
      ],
      risks: [
        {
          description: 'Third-party API integration complexity',
          impact: 'medium',
          probability: 'high',
          mitigation: 'Allocate additional time for integration testing',
        },
        {
          description: 'Performance optimization challenges',
          impact: 'high',
          probability: 'medium',
          mitigation: 'Implement performance monitoring from early stages',
        },
      ],
      assumptions: [
        'Development team has experience with chosen technologies',
        'All requirements are clearly defined and stable',
        'Third-party services will be available and stable',
      ],
      confidence: 0.85,
    }));

    // Communication generation responses
    this.responses.set('generate-proposal', `Subject: Project Proposal - Web Application Development

Dear Client,

Thank you for considering our services for your web application development project. Based on our analysis of your requirements, we are pleased to present this comprehensive proposal.

## Project Overview
We propose to develop a modern web application with user authentication, data management capabilities, and high-performance requirements as outlined in your specification.

## Scope of Work
- Frontend development using React and TypeScript
- Backend API development with Node.js and Express
- Database design and implementation
- User authentication and authorization system
- Comprehensive testing and quality assurance

## Timeline and Investment
- **Duration**: 3 months
- **Total Investment**: $24,000
- **Team Size**: 3 developers + 1 QA engineer

## Why Choose Us
- 5+ years of experience in web application development
- Proven track record with similar projects
- Agile development methodology
- Comprehensive testing and quality assurance

We look forward to discussing this proposal with you and answering any questions you may have.

Best regards,
Development Team`);

    // Codebase analysis responses
    this.responses.set('analyze-codebase', JSON.stringify({
      structure: {
        directories: ['src', 'test', 'config', 'docs'],
        fileCount: 45,
        totalSize: 125000,
        languages: {
          typescript: 35,
          javascript: 8,
          json: 2,
        },
      },
      metrics: {
        linesOfCode: 5420,
        cyclomaticComplexity: 2.3,
        maintainabilityIndex: 78,
        technicalDebt: 12000,
      },
      issues: [
        {
          type: 'code-smell',
          severity: 'medium',
          file: 'src/utils/helper.ts',
          line: 45,
          description: 'Function is too complex',
          suggestion: 'Break down into smaller functions',
        },
        {
          type: 'security',
          severity: 'high',
          file: 'src/auth/login.ts',
          line: 23,
          description: 'Potential SQL injection vulnerability',
          suggestion: 'Use parameterized queries',
        },
      ],
      recommendations: [
        'Implement automated testing for better code coverage',
        'Add TypeScript strict mode for better type safety',
        'Consider implementing code splitting for better performance',
        'Add comprehensive error handling and logging',
      ],
    }));
  }

  private createHandlers() {
    return [
      // List models endpoint
      http.get('http://localhost:11434/api/tags', () => {
        return HttpResponse.json({
          models: this.models,
        });
      }),

      // Generate endpoint
      http.post('http://localhost:11434/api/generate', async ({ request }) => {
        const body = await request.json() as any;
        const prompt = body.prompt || '';
        
        let response = 'This is a mock response from Ollama.';
        
        // Determine response based on prompt content
        if (prompt.includes('analyze') && prompt.includes('document')) {
          response = this.responses.get('analyze-document') || response;
        } else if (prompt.includes('estimate') || prompt.includes('project')) {
          response = this.responses.get('estimate-project') || response;
        } else if (prompt.includes('proposal') || prompt.includes('email')) {
          response = this.responses.get('generate-proposal') || response;
        } else if (prompt.includes('codebase') || prompt.includes('code')) {
          response = this.responses.get('analyze-codebase') || response;
        }

        const mockResponse: MockGenerateResponse = {
          model: body.model || 'llama2:7b',
          created_at: new Date().toISOString(),
          response,
          done: true,
          total_duration: 1000000000, // 1 second in nanoseconds
          load_duration: 100000000,   // 0.1 seconds
          prompt_eval_count: prompt.split(' ').length,
          prompt_eval_duration: 200000000, // 0.2 seconds
          eval_count: response.split(' ').length,
          eval_duration: 700000000, // 0.7 seconds
        };

        return HttpResponse.json(mockResponse);
      }),

      // Chat endpoint
      http.post('http://localhost:11434/api/chat', async ({ request }) => {
        const body = await request.json() as any;
        const messages = body.messages || [];
        const lastMessage = messages[messages.length - 1];
        
        const mockResponse = {
          model: body.model || 'llama2:7b',
          created_at: new Date().toISOString(),
          message: {
            role: 'assistant',
            content: `Mock response to: ${lastMessage?.content || 'Hello'}`,
          },
          done: true,
        };

        return HttpResponse.json(mockResponse);
      }),

      // Pull model endpoint
      http.post('http://localhost:11434/api/pull', async ({ request }) => {
        const body = await request.json() as any;
        
        return HttpResponse.json({
          status: 'success',
          digest: 'sha256:mock-digest',
          total: 1000000,
          completed: 1000000,
        });
      }),

      // Show model info endpoint
      http.post('http://localhost:11434/api/show', async ({ request }) => {
        const body = await request.json() as any;
        const modelName = body.name;
        
        const model = this.models.find(m => m.name === modelName);
        if (!model) {
          return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json({
          modelfile: `FROM ${modelName}`,
          parameters: 'temperature 0.7',
          template: '{{ .Prompt }}',
          details: model.details,
        });
      }),

      // Health check endpoint
      http.get('http://localhost:11434/api/version', () => {
        return HttpResponse.json({
          version: '0.1.0-mock',
        });
      }),
    ];
  }

  async start(): Promise<void> {
    if (!this.isRunning) {
      this.server.listen({
        onUnhandledRequest: 'warn',
      });
      this.isRunning = true;
    }
  }

  async stop(): Promise<void> {
    if (this.isRunning) {
      this.server.close();
      this.isRunning = false;
    }
  }

  addModel(model: MockModel): void {
    this.models.push(model);
  }

  removeModel(modelName: string): void {
    this.models = this.models.filter(m => m.name !== modelName);
  }

  setResponse(key: string, response: string): void {
    this.responses.set(key, response);
  }

  getModels(): MockModel[] {
    return [...this.models];
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }

  reset(): void {
    this.initializeDefaultModels();
    this.initializeDefaultResponses();
  }
}