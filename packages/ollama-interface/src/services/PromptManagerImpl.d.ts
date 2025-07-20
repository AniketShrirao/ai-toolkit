import { AnalysisType } from '@ai-toolkit/shared';
import { PromptManager, PromptTemplate, PromptContext, RenderedPrompt, PromptOptimization, ValidationResult } from '../interfaces/PromptManager.js';
export declare class PromptManagerImpl implements PromptManager {
    private templates;
    private readonly defaultContext;
    constructor();
    private initializeDefaultTemplates;
    registerTemplate(template: PromptTemplate): void;
    getTemplate(id: string): PromptTemplate | undefined;
    listTemplates(analysisType?: AnalysisType): PromptTemplate[];
    updateTemplate(id: string, updates: Partial<PromptTemplate>): void;
    removeTemplate(id: string): void;
    renderPrompt(templateId: string, variables: Record<string, any>, context?: Partial<PromptContext>): Promise<RenderedPrompt>;
    private processVariables;
    private renderTemplate;
    private processConditionals;
    private processLoops;
    estimateTokens(text: string): number;
    truncateContent(content: string, maxTokens: number, strategy?: 'start' | 'middle' | 'end' | 'smart'): string;
    private smartTruncate;
    private scoreLineImportance;
    optimizePrompt(content: string, targetLength?: number): Promise<PromptOptimization>;
    validateTemplate(template: PromptTemplate): ValidationResult;
    validateVariables(template: PromptTemplate, variables: Record<string, any>): ValidationResult;
    private validateVariableType;
}
//# sourceMappingURL=PromptManagerImpl.d.ts.map