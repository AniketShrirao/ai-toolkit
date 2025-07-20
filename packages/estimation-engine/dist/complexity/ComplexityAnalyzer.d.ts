import { Requirement, ComplexityScore, ComplexityFactors, ProjectData, ProcessingOptions } from "@ai-toolkit/shared";
import { OllamaService } from "@ai-toolkit/ollama-interface";
export declare class ComplexityAnalyzer {
    private complexityFactors;
    private historicalData;
    private ollamaService;
    constructor(ollamaService: OllamaService, initialFactors?: Partial<ComplexityFactors>);
    calculateComplexity(requirements: Requirement[], options?: ProcessingOptions): Promise<ComplexityScore>;
    analyzeRequirementComplexity(requirement: Requirement, context?: string[]): Promise<number>;
    private buildComplexityAnalysisPrompt;
    private parseComplexityScore;
    private calculateHeuristicComplexity;
    private identifyComplexityFactors;
    private isTechnicalRequirement;
    private isIntegrationRequirement;
    private requiresExtensiveTesting;
    private getHistoricalAdjustment;
    private findSimilarProjects;
    private extractKeywords;
    updateComplexityFactors(factors: Partial<ComplexityFactors>): void;
    getComplexityFactors(): ComplexityFactors;
    addHistoricalProject(projectData: ProjectData): void;
    getHistoricalData(): ProjectData[];
    clearHistoricalData(): void;
}
//# sourceMappingURL=ComplexityAnalyzer.d.ts.map