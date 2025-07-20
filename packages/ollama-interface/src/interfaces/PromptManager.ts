import { AnalysisType, GenerationOptions } from '@ai-toolkit/shared';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  analysisType: AnalysisType;
  maxTokens?: number;
  examples?: PromptExample[];
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: VariableValidation;
}

export interface VariableValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  allowedValues?: any[];
}

export interface PromptExample {
  input: Record<string, any>;
  expectedOutput: string;
  description: string;
}

export interface PromptContext {
  maxTokens: number;
  currentTokens: number;
  truncationStrategy: 'start' | 'middle' | 'end' | 'smart';
}

export interface RenderedPrompt {
  content: string;
  tokenCount: number;
  truncated: boolean;
  variables: Record<string, any>;
  template: PromptTemplate;
}

export interface PromptOptimization {
  originalLength: number;
  optimizedLength: number;
  compressionRatio: number;
  preservedKeywords: string[];
  removedSections: string[];
}

export interface PromptManager {
  // Template management
  registerTemplate(template: PromptTemplate): void;
  getTemplate(id: string): PromptTemplate | undefined;
  listTemplates(analysisType?: AnalysisType): PromptTemplate[];
  updateTemplate(id: string, updates: Partial<PromptTemplate>): void;
  removeTemplate(id: string): void;

  // Prompt rendering
  renderPrompt(
    templateId: string,
    variables: Record<string, any>,
    context?: Partial<PromptContext>
  ): Promise<RenderedPrompt>;

  // Context management
  estimateTokens(text: string): number;
  truncateContent(
    content: string,
    maxTokens: number,
    strategy?: 'start' | 'middle' | 'end' | 'smart'
  ): string;

  // Optimization
  optimizePrompt(
    content: string,
    targetLength?: number
  ): Promise<PromptOptimization>;

  // Validation
  validateTemplate(template: PromptTemplate): ValidationResult;
  validateVariables(
    template: PromptTemplate,
    variables: Record<string, any>
  ): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}