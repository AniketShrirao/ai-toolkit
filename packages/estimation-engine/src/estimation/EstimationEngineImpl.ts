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
  EstimateBreakdown,
  RiskFactor,
} from "@ai-toolkit/shared";
import { EstimationEngine } from "../interfaces/EstimationEngine.js";
import { ComplexityAnalyzer } from "../complexity/ComplexityAnalyzer.js";
import { RiskAnalyzer } from "../risk/RiskAnalyzer.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";

export class EstimationEngineImpl implements EstimationEngine {
  private complexityAnalyzer: ComplexityAnalyzer;
  private riskAnalyzer: RiskAnalyzer;
  private rateConfiguration: RateConfiguration;
  private historicalData: ProjectData[];

  constructor(ollamaService: OllamaService) {
    this.complexityAnalyzer = new ComplexityAnalyzer(ollamaService);
    this.riskAnalyzer = new RiskAnalyzer(ollamaService);
    this.historicalData = [];

    // Default rate configuration
    this.rateConfiguration = {
      hourlyRate: 100,
      currency: "USD",
      overhead: 0.3,
      profitMargin: 0.2,
    };
  }

  async calculateComplexity(
    requirements: Requirement[],
    options?: ProcessingOptions
  ): Promise<ComplexityScore> {
    return this.complexityAnalyzer.calculateComplexity(requirements, options);
  }

  async analyzeRequirementComplexity(
    requirement: Requirement,
    context?: string[]
  ): Promise<number> {
    return this.complexityAnalyzer.analyzeRequirementComplexity(
      requirement,
      context
    );
  }

  async generateTimeEstimate(
    complexity: ComplexityScore,
    historicalData?: ProjectData[],
    options?: ProcessingOptions
  ): Promise<TimeEstimate> {
    const dataToUse = historicalData || this.historicalData;

    // Base hours calculation from complexity
    const baseHours = this.calculateBaseHours(complexity);

    // Apply historical adjustment
    const historicalAdjustment = this.calculateHistoricalAdjustment(
      complexity,
      dataToUse
    );
    const adjustedHours = baseHours * historicalAdjustment;

    // Create breakdown by complexity categories
    const breakdown = this.createTimeBreakdown(complexity, adjustedHours);

    // Calculate confidence based on historical data availability and complexity clarity
    const confidence = this.calculateConfidence(complexity, dataToUse);

    // Generate assumptions
    const assumptions = this.generateAssumptions(complexity, dataToUse);

    return {
      totalHours: Math.round(adjustedHours * 100) / 100,
      breakdown,
      confidence,
      assumptions,
    };
  }

  async estimateByCategory(
    requirements: Requirement[],
    categories: string[]
  ): Promise<Map<string, TimeEstimate>> {
    const estimates = new Map<string, TimeEstimate>();

    // Group requirements by category
    const categorizedReqs = this.categorizeRequirements(
      requirements,
      categories
    );

    for (const [category, reqs] of categorizedReqs.entries()) {
      if (reqs.length > 0) {
        const complexity = await this.calculateComplexity(reqs);
        const timeEstimate = await this.generateTimeEstimate(complexity);
        estimates.set(category, timeEstimate);
      }
    }

    return estimates;
  }

  async assessRisks(
    requirements: Requirement[],
    codebase?: CodebaseAnalysis,
    options?: ProcessingOptions
  ): Promise<RiskAssessment> {
    return this.riskAnalyzer.assessRisks(requirements, codebase, options);
  }

  async identifyTechnicalRisks(
    requirements: Requirement[],
    codebase?: CodebaseAnalysis
  ): Promise<string[]> {
    const risks = await this.riskAnalyzer.identifyTechnicalRisks(
      requirements,
      codebase
    );
    return risks.map((risk) => risk.description);
  }

  async assessIntegrationRisks(
    requirements: Requirement[],
    existingSystems?: string[]
  ): Promise<string[]> {
    const integrationRisks: string[] = [];

    for (const req of requirements) {
      if (this.isIntegrationRequirement(req)) {
        const riskDescription = `Integration risk for: ${req.description}`;
        integrationRisks.push(riskDescription);

        if (existingSystems && existingSystems.length > 0) {
          integrationRisks.push(
            `Potential conflicts with existing systems: ${existingSystems.join(", ")}`
          );
        }
      }
    }

    return integrationRisks;
  }

  async generateProjectEstimate(
    requirements: Requirement[],
    options?: {
      includeRisks?: boolean;
      useHistoricalData?: boolean;
      codebaseContext?: CodebaseAnalysis;
      customFactors?: Partial<ComplexityFactors>;
    }
  ): Promise<ProjectEstimate> {
    // Apply custom complexity factors if provided
    if (options?.customFactors) {
      this.complexityAnalyzer.updateComplexityFactors(options.customFactors);
    }

    // Calculate complexity
    const complexity = await this.calculateComplexity(requirements);

    // Generate time estimate
    const historicalData = options?.useHistoricalData
      ? this.historicalData
      : undefined;
    const timeEstimate = await this.generateTimeEstimate(
      complexity,
      historicalData
    );

    // Enhance confidence calculation with requirement clarity
    const enhancedConfidence = this.calculateConfidenceWithRequirements(
      complexity,
      requirements,
      historicalData || []
    );

    // Calculate costs
    const totalCost = this.calculateTotalCost(timeEstimate.totalHours);

    // Assess risks if requested
    let risks: RiskFactor[] = [];
    if (options?.includeRisks) {
      const riskAssessment = await this.assessRisks(
        requirements,
        options.codebaseContext
      );
      risks = riskAssessment.factors;
    }

    return {
      id: `estimate-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalHours: timeEstimate.totalHours,
      totalCost,
      breakdown: timeEstimate.breakdown,
      risks,
      assumptions: timeEstimate.assumptions,
      confidence: enhancedConfidence,
      requirements,
    };
  }

  async addHistoricalProject(projectData: ProjectData): Promise<void> {
    this.historicalData.push(projectData);

    // Keep only the most recent 100 projects to prevent memory issues
    if (this.historicalData.length > 100) {
      this.historicalData = this.historicalData.slice(-100);
    }

    // Add to complexity analyzer as well
    this.complexityAnalyzer.addHistoricalProject(projectData);
  }

  async getHistoricalData(filters?: {
    technology?: string[];
    size?: "small" | "medium" | "large";
    domain?: string;
  }): Promise<ProjectData[]> {
    let filteredData = [...this.historicalData];

    if (filters) {
      if (filters.size) {
        filteredData = filteredData.filter(
          (project) =>
            this.categorizeProjectSize(project.actualHours) === filters.size
        );
      }

      if (filters.technology) {
        filteredData = filteredData.filter((project) =>
          this.projectUsesAnyTechnology(project, filters.technology!)
        );
      }

      if (filters.domain) {
        filteredData = filteredData.filter((project) =>
          project.name.toLowerCase().includes(filters.domain!.toLowerCase())
        );
      }
    }

    return filteredData;
  }

  setHourlyRates(rates: RateConfiguration): void {
    this.rateConfiguration = { ...rates };
  }

  getHourlyRates(): RateConfiguration {
    return { ...this.rateConfiguration };
  }

  updateComplexityFactors(factors: Partial<ComplexityFactors>): void {
    this.complexityAnalyzer.updateComplexityFactors(factors);
  }

  getComplexityFactors(): ComplexityFactors {
    return this.complexityAnalyzer.getComplexityFactors();
  }

  async calibrateEstimates(actualProjects: ProjectData[]): Promise<{
    accuracy: number;
    bias: number;
    recommendations: string[];
  }> {
    if (actualProjects.length === 0) {
      return {
        accuracy: 0,
        bias: 0,
        recommendations: ["No historical data available for calibration"],
      };
    }

    // Calculate accuracy metrics
    const accuracyRatios = actualProjects.map(
      (project) =>
        Math.abs(project.actualHours - project.estimatedHours) /
        project.actualHours
    );

    const accuracy =
      1 -
      accuracyRatios.reduce((sum, ratio) => sum + ratio, 0) /
        accuracyRatios.length;

    // Calculate bias (positive = underestimating, negative = overestimating)
    const biasRatios = actualProjects.map(
      (project) =>
        (project.estimatedHours - project.actualHours) / project.actualHours
    );

    const bias =
      biasRatios.reduce((sum, ratio) => sum + ratio, 0) / biasRatios.length;

    // Generate recommendations
    const recommendations = this.generateCalibrationRecommendations(
      accuracy,
      bias,
      actualProjects
    );

    return {
      accuracy: Math.max(0, Math.min(1, accuracy)),
      bias,
      recommendations,
    };
  }

  async improveAccuracy(
    feedback: {
      projectId: string;
      actualHours: number;
      estimatedHours: number;
      factors: string[];
    }[]
  ): Promise<void> {
    // Analyze feedback patterns
    const patterns = this.analyzeFeedbackPatterns(feedback);

    // Adjust complexity factors based on patterns
    if (patterns.technicalUnderestimation > 0.2) {
      const currentFactors = this.getComplexityFactors();
      this.updateComplexityFactors({
        technical: currentFactors.technical * 1.1,
      });
    }

    if (patterns.integrationUnderestimation > 0.2) {
      const currentFactors = this.getComplexityFactors();
      this.updateComplexityFactors({
        integration: currentFactors.integration * 1.1,
      });
    }
  }

  async generateScenarios(
    requirements: Requirement[],
    scenarios: ("optimistic" | "realistic" | "pessimistic")[]
  ): Promise<Map<string, ProjectEstimate>> {
    const scenarioEstimates = new Map<string, ProjectEstimate>();

    for (const scenario of scenarios) {
      const adjustedFactors = this.getScenarioFactors(scenario);

      const estimate = await this.generateProjectEstimate(requirements, {
        customFactors: adjustedFactors,
        includeRisks: true,
        useHistoricalData: true,
      });

      // Apply scenario-specific adjustments
      const adjustedEstimate = this.applyScenarioAdjustments(
        estimate,
        scenario
      );
      scenarioEstimates.set(scenario, adjustedEstimate);
    }

    return scenarioEstimates;
  }

  async validateEstimate(
    estimate: ProjectEstimate,
    requirements: Requirement[]
  ): Promise<{
    valid: boolean;
    warnings: string[];
    suggestions: string[];
  }> {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check if estimate seems reasonable
    const avgHoursPerRequirement = estimate.totalHours / requirements.length;

    if (avgHoursPerRequirement < 2) {
      warnings.push(
        "Estimate seems very low - average less than 2 hours per requirement"
      );
      suggestions.push(
        "Review requirement complexity and consider hidden tasks"
      );
    }

    if (avgHoursPerRequirement > 100) {
      warnings.push(
        "Estimate seems very high - average more than 100 hours per requirement"
      );
      suggestions.push(
        "Consider breaking down requirements into smaller, more manageable pieces"
      );
    }

    // Check confidence level
    if (estimate.confidence < 0.5) {
      warnings.push(
        "Low confidence in estimate due to unclear requirements or lack of historical data"
      );
      suggestions.push(
        "Gather more detailed requirements or similar project data"
      );
    }

    // Check for missing breakdown categories
    const expectedCategories = ["Development", "Testing", "Documentation"];
    const actualCategories = estimate.breakdown.map((b) => b.category);
    const missingCategories = expectedCategories.filter(
      (cat) => !actualCategories.includes(cat)
    );

    if (missingCategories.length > 0) {
      warnings.push(
        `Missing estimate categories: ${missingCategories.join(", ")}`
      );
      suggestions.push(
        "Ensure all development phases are included in the estimate"
      );
    }

    const valid = warnings.length === 0;

    return { valid, warnings, suggestions };
  }

  // Private helper methods
  private calculateBaseHours(complexity: ComplexityScore): number {
    // Base formula: complexity score translates to hours
    // This is a simplified model - in practice, you'd want more sophisticated calculations
    const baseMultiplier = 8; // 8 hours per complexity point as baseline

    return (
      (complexity.technical * 0.4 +
        complexity.business * 0.3 +
        complexity.integration * 0.3) *
      baseMultiplier
    );
  }

  private calculateHistoricalAdjustment(
    complexity: ComplexityScore,
    historicalData: ProjectData[]
  ): number {
    if (historicalData.length === 0) return 1.0;

    // Find similar projects and calculate average adjustment factor
    const similarProjects = historicalData.filter((project) =>
      this.isSimilarComplexity(complexity, project)
    );

    if (similarProjects.length === 0) return 1.0;

    const adjustmentFactors = similarProjects.map(
      (project) => project.actualHours / project.estimatedHours
    );

    const avgAdjustment =
      adjustmentFactors.reduce((sum, factor) => sum + factor, 0) /
      adjustmentFactors.length;

    // Apply conservative adjustment (don't adjust too dramatically)
    return Math.min(1.5, Math.max(0.7, avgAdjustment));
  }

  private createTimeBreakdown(
    complexity: ComplexityScore,
    totalHours: number
  ): EstimateBreakdown[] {
    const breakdown: EstimateBreakdown[] = [];

    // Development (60% of total)
    const developmentHours = totalHours * 0.6;
    breakdown.push({
      category: "Development",
      hours: Math.round(developmentHours * 100) / 100,
      description:
        "Core development work including implementation and unit testing",
      requirements: [],
    });

    // Testing (25% of total)
    const testingHours = totalHours * 0.25;
    breakdown.push({
      category: "Testing",
      hours: Math.round(testingHours * 100) / 100,
      description: "Integration testing, system testing, and bug fixes",
      requirements: [],
    });

    // Documentation (10% of total)
    const documentationHours = totalHours * 0.1;
    breakdown.push({
      category: "Documentation",
      hours: Math.round(documentationHours * 100) / 100,
      description: "Technical documentation and user guides",
      requirements: [],
    });

    // Deployment & Setup (5% of total)
    const deploymentHours = totalHours * 0.05;
    breakdown.push({
      category: "Deployment",
      hours: Math.round(deploymentHours * 100) / 100,
      description: "Environment setup, deployment, and configuration",
      requirements: [],
    });

    return breakdown;
  }

  private calculateConfidence(
    complexity: ComplexityScore,
    historicalData: ProjectData[]
  ): number {
    let confidence = 0.7; // Base confidence

    // Adjust based on historical data availability
    if (historicalData.length > 10) {
      confidence += 0.2;
    } else if (historicalData.length > 5) {
      confidence += 0.1;
    }

    // Adjust based on complexity clarity (lower complexity = higher confidence)
    const avgComplexity =
      (complexity.technical + complexity.business + complexity.integration) / 3;
    if (avgComplexity < 5) {
      confidence += 0.1;
    } else if (avgComplexity > 8) {
      confidence -= 0.2;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // Enhanced confidence calculation that considers requirement clarity
  private calculateConfidenceWithRequirements(
    complexity: ComplexityScore,
    requirements: Requirement[],
    historicalData: ProjectData[]
  ): number {
    let confidence = 0.7; // Base confidence

    // Adjust based on historical data availability
    if (historicalData.length > 10) {
      confidence += 0.2;
    } else if (historicalData.length > 5) {
      confidence += 0.1;
    }

    // Adjust based on requirement clarity
    const clarityScore = this.calculateRequirementClarity(requirements);
    confidence += (clarityScore - 0.5) * 0.3; // Scale clarity impact

    // Adjust based on complexity clarity (lower complexity = higher confidence)
    const avgComplexity =
      (complexity.technical + complexity.business + complexity.integration) / 3;
    if (avgComplexity < 5) {
      confidence += 0.1;
    } else if (avgComplexity > 8) {
      confidence -= 0.2;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // Calculate how clear and detailed the requirements are
  private calculateRequirementClarity(requirements: Requirement[]): number {
    if (requirements.length === 0) return 0.5;

    let totalClarityScore = 0;

    for (const req of requirements) {
      let clarityScore = 0.5; // Base score

      // Check description quality
      const description = req.description.toLowerCase();
      const wordCount = description.split(/\s+/).length;

      // Longer, more detailed descriptions are clearer
      if (wordCount > 15) {
        clarityScore += 0.2;
      } else if (wordCount < 5) {
        clarityScore -= 0.2;
      }

      // Check for vague terms
      const vagueTerms = [
        "user-friendly",
        "intuitive",
        "flexible",
        "scalable",
        "robust",
        "efficient",
        "as needed",
        "appropriate",
        "good",
        "nice",
        "easy",
      ];
      const vagueTermCount = vagueTerms.filter((term) =>
        description.includes(term)
      ).length;
      clarityScore -= vagueTermCount * 0.1;

      // Check for specific technical terms
      const specificTerms = [
        "api",
        "database",
        "authentication",
        "validation",
        "integration",
        "endpoint",
        "response",
        "request",
        "format",
        "protocol",
      ];
      const specificTermCount = specificTerms.filter((term) =>
        description.includes(term)
      ).length;
      clarityScore += specificTermCount * 0.05;

      // Check acceptance criteria quality
      if (req.acceptanceCriteria && req.acceptanceCriteria.length > 0) {
        clarityScore += 0.1;

        // More detailed acceptance criteria = higher clarity
        const avgCriteriaLength =
          req.acceptanceCriteria.reduce(
            (sum, criteria) => sum + criteria.length,
            0
          ) / req.acceptanceCriteria.length;

        if (avgCriteriaLength > 20) {
          clarityScore += 0.1;
        }
      } else {
        clarityScore -= 0.1;
      }

      totalClarityScore += Math.max(0, Math.min(1, clarityScore));
    }

    return totalClarityScore / requirements.length;
  }

  private generateAssumptions(
    complexity: ComplexityScore,
    historicalData: ProjectData[]
  ): string[] {
    const assumptions: string[] = [
      "Estimates assume standard working hours (8 hours per day)",
      "Requirements are stable and well-defined",
      "Development team has appropriate skill level",
    ];

    if (historicalData.length === 0) {
      assumptions.push(
        "No historical data available - estimates based on industry standards"
      );
    }

    if (complexity.integration > 7) {
      assumptions.push(
        "Complex integrations may require additional coordination time"
      );
    }

    if (complexity.technical > 8) {
      assumptions.push(
        "High technical complexity may require research and prototyping time"
      );
    }

    return assumptions;
  }

  private categorizeRequirements(
    requirements: Requirement[],
    categories: string[]
  ): Map<string, Requirement[]> {
    const categorized = new Map<string, Requirement[]>();

    // Initialize categories
    categories.forEach((category) => categorized.set(category, []));

    // Simple categorization based on keywords
    requirements.forEach((req) => {
      let assigned = false;

      for (const category of categories) {
        if (req.description.toLowerCase().includes(category.toLowerCase())) {
          categorized.get(category)!.push(req);
          assigned = true;
          break;
        }
      }

      // If not assigned to any specific category, put in 'General' or first category
      if (!assigned) {
        const generalCategory =
          categories.find((cat) => cat.toLowerCase() === "general") ||
          categories[0];
        if (generalCategory) {
          categorized.get(generalCategory)!.push(req);
        }
      }
    });

    return categorized;
  }

  private calculateTotalCost(totalHours: number): number {
    const baseCost = totalHours * this.rateConfiguration.hourlyRate;
    const withOverhead = baseCost * (1 + this.rateConfiguration.overhead);
    const withProfit = withOverhead * (1 + this.rateConfiguration.profitMargin);

    return Math.round(withProfit * 100) / 100;
  }

  // Enhanced cost calculation with breakdown by category
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
  } {
    const breakdown = timeEstimate.breakdown.map((item) => ({
      category: item.category,
      hours: item.hours,
      cost:
        Math.round(item.hours * this.rateConfiguration.hourlyRate * 100) / 100,
      description: item.description,
    }));

    const subtotal = breakdown.reduce((sum, item) => sum + item.cost, 0);
    const overhead =
      Math.round(subtotal * this.rateConfiguration.overhead * 100) / 100;
    const profit =
      Math.round(
        (subtotal + overhead) * this.rateConfiguration.profitMargin * 100
      ) / 100;
    const total = subtotal + overhead + profit;

    return {
      breakdown,
      subtotal: Math.round(subtotal * 100) / 100,
      overhead,
      profit,
      total: Math.round(total * 100) / 100,
    };
  }

  // Enhanced time estimation with buffer calculation
  async generateTimeEstimateWithBuffer(
    complexity: ComplexityScore,
    bufferPercentage: number = 0.2,
    historicalData?: ProjectData[],
    options?: ProcessingOptions
  ): Promise<TimeEstimate & { buffer: number; totalWithBuffer: number }> {
    const baseEstimate = await this.generateTimeEstimate(
      complexity,
      historicalData,
      options
    );
    const buffer =
      Math.round(baseEstimate.totalHours * bufferPercentage * 100) / 100;
    const totalWithBuffer =
      Math.round((baseEstimate.totalHours + buffer) * 100) / 100;

    return {
      ...baseEstimate,
      buffer,
      totalWithBuffer,
      assumptions: [
        ...baseEstimate.assumptions,
        `${Math.round(bufferPercentage * 100)}% buffer added for uncertainty and scope changes`,
      ],
    };
  }

  // Resource-based estimation considering team size and skill levels
  async generateResourceBasedEstimate(
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
  ): Promise<ProjectEstimate & { resourceBreakdown: any }> {
    const complexity = await this.calculateComplexity(requirements, options);
    const baseTimeEstimate = await this.generateTimeEstimate(complexity);

    // Distribute work based on complexity and team composition
    const totalTeamMembers =
      teamConfiguration.seniorDevelopers +
      teamConfiguration.midDevelopers +
      teamConfiguration.juniorDevelopers;

    if (totalTeamMembers === 0) {
      throw new Error("Team configuration must include at least one developer");
    }

    // Complex work goes to senior developers, simple work can go to junior developers
    const complexWork = baseTimeEstimate.totalHours * 0.4; // 40% complex work
    const moderateWork = baseTimeEstimate.totalHours * 0.4; // 40% moderate work
    const simpleWork = baseTimeEstimate.totalHours * 0.2; // 20% simple work

    const seniorHours = complexWork + moderateWork * 0.5;
    const midHours = moderateWork * 0.5 + simpleWork * 0.5;
    const juniorHours = simpleWork * 0.5;

    const resourceBreakdown = {
      senior: {
        hours: Math.round(seniorHours * 100) / 100,
        cost:
          Math.round(seniorHours * teamConfiguration.seniorRate * 100) / 100,
        developers: teamConfiguration.seniorDevelopers,
      },
      mid: {
        hours: Math.round(midHours * 100) / 100,
        cost: Math.round(midHours * teamConfiguration.midRate * 100) / 100,
        developers: teamConfiguration.midDevelopers,
      },
      junior: {
        hours: Math.round(juniorHours * 100) / 100,
        cost:
          Math.round(juniorHours * teamConfiguration.juniorRate * 100) / 100,
        developers: teamConfiguration.juniorDevelopers,
      },
    };

    const totalResourceCost =
      resourceBreakdown.senior.cost +
      resourceBreakdown.mid.cost +
      resourceBreakdown.junior.cost;

    const risks = await this.assessRisks(requirements);

    return {
      id: `resource-estimate-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalHours: baseTimeEstimate.totalHours,
      totalCost:
        Math.round(
          totalResourceCost *
            (1 + this.rateConfiguration.overhead) *
            (1 + this.rateConfiguration.profitMargin) *
            100
        ) / 100,
      breakdown: baseTimeEstimate.breakdown,
      risks: risks.factors,
      assumptions: [
        ...baseTimeEstimate.assumptions,
        "Resource allocation based on complexity distribution",
        `Team: ${teamConfiguration.seniorDevelopers} senior, ${teamConfiguration.midDevelopers} mid, ${teamConfiguration.juniorDevelopers} junior developers`,
      ],
      confidence: baseTimeEstimate.confidence,
      requirements,
      resourceBreakdown,
    };
  }

  private isIntegrationRequirement(requirement: Requirement): boolean {
    const integrationKeywords = [
      "integrate",
      "connect",
      "sync",
      "import",
      "export",
      "api",
      "webhook",
      "third-party",
      "external",
    ];

    return integrationKeywords.some((keyword) =>
      requirement.description.toLowerCase().includes(keyword)
    );
  }

  private categorizeProjectSize(hours: number): "small" | "medium" | "large" {
    if (hours < 100) return "small";
    if (hours < 500) return "medium";
    return "large";
  }

  private projectUsesAnyTechnology(
    project: ProjectData,
    technologies: string[]
  ): boolean {
    const projectDescription = project.name.toLowerCase();
    return technologies.some((tech) =>
      projectDescription.includes(tech.toLowerCase())
    );
  }

  private isSimilarComplexity(
    complexity: ComplexityScore,
    project: ProjectData
  ): boolean {
    // Simple similarity check - in practice, you'd want more sophisticated matching
    const projectComplexity = project.estimatedHours / 40; // Rough complexity estimate
    const currentComplexity = complexity.overall;

    return Math.abs(projectComplexity - currentComplexity) < 2;
  }

  private generateCalibrationRecommendations(
    accuracy: number,
    bias: number,
    projects: ProjectData[]
  ): string[] {
    const recommendations: string[] = [];

    if (accuracy < 0.7) {
      recommendations.push(
        "Estimation accuracy is below 70% - consider refining estimation methodology"
      );
    }

    if (bias > 0.2) {
      recommendations.push(
        "Consistent underestimation detected - increase complexity factors by 10-20%"
      );
    } else if (bias < -0.2) {
      recommendations.push(
        "Consistent overestimation detected - reduce complexity factors by 10-15%"
      );
    }

    if (projects.length < 10) {
      recommendations.push(
        "Collect more historical project data to improve estimation accuracy"
      );
    }

    return recommendations;
  }

  private analyzeFeedbackPatterns(feedback: any[]): {
    technicalUnderestimation: number;
    integrationUnderestimation: number;
  } {
    const technicalProjects = feedback.filter((f) =>
      f.factors.some((factor: string) =>
        factor.toLowerCase().includes("technical")
      )
    );

    const integrationProjects = feedback.filter((f) =>
      f.factors.some((factor: string) =>
        factor.toLowerCase().includes("integration")
      )
    );

    const technicalUnderestimation =
      technicalProjects.length > 0
        ? technicalProjects.filter((p) => p.actualHours > p.estimatedHours)
            .length / technicalProjects.length
        : 0;

    const integrationUnderestimation =
      integrationProjects.length > 0
        ? integrationProjects.filter((p) => p.actualHours > p.estimatedHours)
            .length / integrationProjects.length
        : 0;

    return { technicalUnderestimation, integrationUnderestimation };
  }

  private getScenarioFactors(
    scenario: "optimistic" | "realistic" | "pessimistic"
  ): Partial<ComplexityFactors> {
    const baseFactors = this.getComplexityFactors();

    switch (scenario) {
      case "optimistic":
        return {
          technical: baseFactors.technical * 0.8,
          business: baseFactors.business * 0.8,
          integration: baseFactors.integration * 0.8,
          testing: baseFactors.testing * 0.7,
          documentation: baseFactors.documentation * 0.7,
        };
      case "pessimistic":
        return {
          technical: baseFactors.technical * 1.3,
          business: baseFactors.business * 1.2,
          integration: baseFactors.integration * 1.4,
          testing: baseFactors.testing * 1.3,
          documentation: baseFactors.documentation * 1.2,
        };
      default: // realistic
        return baseFactors;
    }
  }

  private applyScenarioAdjustments(
    estimate: ProjectEstimate,
    scenario: "optimistic" | "realistic" | "pessimistic"
  ): ProjectEstimate {
    let multiplier = 1.0;

    switch (scenario) {
      case "optimistic":
        multiplier = 0.85;
        break;
      case "pessimistic":
        multiplier = 1.25;
        break;
    }

    return {
      ...estimate,
      totalHours: estimate.totalHours * multiplier,
      totalCost: estimate.totalCost * multiplier,
      breakdown: estimate.breakdown.map((b) => ({
        ...b,
        hours: b.hours * multiplier,
      })),
      assumptions: [
        ...estimate.assumptions,
        `Scenario: ${scenario} (${multiplier}x adjustment applied)`,
      ],
    };
  }
}
