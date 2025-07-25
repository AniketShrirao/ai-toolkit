import { Requirement, ComplexityScore, TimeEstimate, RiskAssessment, ProjectEstimate, RateConfiguration, ComplexityFactors, ProjectData, CodebaseAnalysis, ProcessingOptions } from "@ai-toolkit/shared";
export interface EstimationEngine {
    calculateComplexity(requirements: Requirement[], options?: ProcessingOptions): Promise<ComplexityScore>;
    analyzeRequirementComplexity(requirement: Requirement, context?: string[]): Promise<number>;
    generateTimeEstimate(complexity: ComplexityScore, historicalData?: ProjectData[], options?: ProcessingOptions): Promise<TimeEstimate>;
    estimateByCategory(requirements: Requirement[], categories: string[]): Promise<Map<string, TimeEstimate>>;
    assessRisks(requirements: Requirement[], codebase?: CodebaseAnalysis, options?: ProcessingOptions): Promise<RiskAssessment>;
    identifyTechnicalRisks(requirements: Requirement[], codebase?: CodebaseAnalysis): Promise<string[]>;
    assessIntegrationRisks(requirements: Requirement[], existingSystems?: string[]): Promise<string[]>;
    generateProjectEstimate(requirements: Requirement[], options?: {
        includeRisks?: boolean;
        useHistoricalData?: boolean;
        codebaseContext?: CodebaseAnalysis;
        customFactors?: Partial<ComplexityFactors>;
    }): Promise<ProjectEstimate>;
    addHistoricalProject(projectData: ProjectData): Promise<void>;
    getHistoricalData(filters?: {
        technology?: string[];
        size?: "small" | "medium" | "large";
        domain?: string;
    }): Promise<ProjectData[]>;
    setHourlyRates(rates: RateConfiguration): void;
    getHourlyRates(): RateConfiguration;
    updateComplexityFactors(factors: Partial<ComplexityFactors>): void;
    getComplexityFactors(): ComplexityFactors;
    calibrateEstimates(actualProjects: ProjectData[]): Promise<{
        accuracy: number;
        bias: number;
        recommendations: string[];
    }>;
    improveAccuracy(feedback: {
        projectId: string;
        actualHours: number;
        estimatedHours: number;
        factors: string[];
    }[]): Promise<void>;
    generateScenarios(requirements: Requirement[], scenarios: ("optimistic" | "realistic" | "pessimistic")[]): Promise<Map<string, ProjectEstimate>>;
    validateEstimate(estimate: ProjectEstimate, requirements: Requirement[]): Promise<{
        valid: boolean;
        warnings: string[];
        suggestions: string[];
    }>;
    calculateCostBreakdown(timeEstimate: TimeEstimate): {
        breakdown: Array<{
            category: string;
            hours: number;
            cost: number;
            description: string;
        }>;
        subtotal: number;
        overhead: number;
        profit: number;
        total: number;
    };
    generateTimeEstimateWithBuffer(complexity: ComplexityScore, bufferPercentage?: number, historicalData?: ProjectData[], options?: ProcessingOptions): Promise<TimeEstimate & {
        buffer: number;
        totalWithBuffer: number;
    }>;
    generateResourceBasedEstimate(requirements: Requirement[], teamConfiguration: {
        seniorDevelopers: number;
        midDevelopers: number;
        juniorDevelopers: number;
        seniorRate: number;
        midRate: number;
        juniorRate: number;
    }, options?: ProcessingOptions): Promise<ProjectEstimate & {
        resourceBreakdown: any;
    }>;
}
//# sourceMappingURL=EstimationEngine.d.ts.map