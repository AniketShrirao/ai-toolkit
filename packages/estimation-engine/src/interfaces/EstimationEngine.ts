import {
  Requirement,
  ComplexityScore,
  TimeEstimate,
  RiskAssessment,
  ProjectEstimate,
  RateConfiguration,
  ComplexityFactors,
  ProjectData,
  CodebaseAnalysis,
  ProcessingOptions,
} from "@ai-toolkit/shared";

export interface EstimationEngine {
  // Complexity analysis
  calculateComplexity(
    requirements: Requirement[],
    options?: ProcessingOptions
  ): Promise<ComplexityScore>;

  analyzeRequirementComplexity(
    requirement: Requirement,
    context?: string[]
  ): Promise<number>;

  // Time estimation
  generateTimeEstimate(
    complexity: ComplexityScore,
    historicalData?: ProjectData[],
    options?: ProcessingOptions
  ): Promise<TimeEstimate>;

  estimateByCategory(
    requirements: Requirement[],
    categories: string[]
  ): Promise<Map<string, TimeEstimate>>;

  // Risk assessment
  assessRisks(
    requirements: Requirement[],
    codebase?: CodebaseAnalysis,
    options?: ProcessingOptions
  ): Promise<RiskAssessment>;

  identifyTechnicalRisks(
    requirements: Requirement[],
    codebase?: CodebaseAnalysis
  ): Promise<string[]>;

  assessIntegrationRisks(
    requirements: Requirement[],
    existingSystems?: string[]
  ): Promise<string[]>;

  // Comprehensive estimation
  generateProjectEstimate(
    requirements: Requirement[],
    options?: {
      includeRisks?: boolean;
      useHistoricalData?: boolean;
      codebaseContext?: CodebaseAnalysis;
      customFactors?: Partial<ComplexityFactors>;
    }
  ): Promise<ProjectEstimate>;

  // Historical data management
  addHistoricalProject(projectData: ProjectData): Promise<void>;
  getHistoricalData(filters?: {
    technology?: string[];
    size?: "small" | "medium" | "large";
    domain?: string;
  }): Promise<ProjectData[]>;

  // Configuration management
  setHourlyRates(rates: RateConfiguration): void;
  getHourlyRates(): RateConfiguration;

  updateComplexityFactors(factors: Partial<ComplexityFactors>): void;
  getComplexityFactors(): ComplexityFactors;

  // Calibration and learning
  calibrateEstimates(actualProjects: ProjectData[]): Promise<{
    accuracy: number;
    bias: number;
    recommendations: string[];
  }>;

  improveAccuracy(
    feedback: {
      projectId: string;
      actualHours: number;
      estimatedHours: number;
      factors: string[];
    }[]
  ): Promise<void>;

  // Scenario analysis
  generateScenarios(
    requirements: Requirement[],
    scenarios: ("optimistic" | "realistic" | "pessimistic")[]
  ): Promise<Map<string, ProjectEstimate>>;

  // Validation
  validateEstimate(
    estimate: ProjectEstimate,
    requirements: Requirement[]
  ): Promise<{
    valid: boolean;
    warnings: string[];
    suggestions: string[];
  }>;

  // Enhanced cost calculation
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

  // Time estimation with buffer
  generateTimeEstimateWithBuffer(
    complexity: ComplexityScore,
    bufferPercentage?: number,
    historicalData?: ProjectData[],
    options?: ProcessingOptions
  ): Promise<TimeEstimate & { buffer: number; totalWithBuffer: number }>;

  // Resource-based estimation
  generateResourceBasedEstimate(
    requirements: Requirement[],
    teamConfiguration: {
      seniorDevelopers: number;
      midDevelopers: number;
      juniorDevelopers: number;
      seniorRate: number;
      midRate: number;
      juniorRate: number;
    },
    options?: ProcessingOptions
  ): Promise<ProjectEstimate & { resourceBreakdown: any }>;
}
