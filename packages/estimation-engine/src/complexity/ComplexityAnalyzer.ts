import {
  Requirement,
  ComplexityScore,
  ComplexityFactor,
  ComplexityFactors,
  ProjectData,
  ProcessingOptions,
} from "@ai-toolkit/shared";
import { OllamaService } from "@ai-toolkit/ollama-interface";

export class ComplexityAnalyzer {
  private complexityFactors: ComplexityFactors;
  private historicalData: ProjectData[];
  private ollamaService: OllamaService;

  constructor(
    ollamaService: OllamaService,
    initialFactors?: Partial<ComplexityFactors>
  ) {
    this.ollamaService = ollamaService;
    this.historicalData = [];
    this.complexityFactors = {
      technical: 1.0,
      business: 0.8,
      integration: 1.2,
      testing: 0.6,
      documentation: 0.4,
      ...initialFactors,
    };
  }

  async calculateComplexity(
    requirements: Requirement[],
    options?: ProcessingOptions
  ): Promise<ComplexityScore> {
    const factors: ComplexityFactor[] = [];
    let technicalScore = 0;
    let businessScore = 0;
    let integrationScore = 0;

    // Analyze each requirement for complexity
    for (const requirement of requirements) {
      const reqComplexity =
        await this.analyzeRequirementComplexity(requirement);

      // Categorize complexity by requirement type
      if (this.isTechnicalRequirement(requirement)) {
        technicalScore += reqComplexity * this.complexityFactors.technical;
      } else if (this.isIntegrationRequirement(requirement)) {
        integrationScore += reqComplexity * this.complexityFactors.integration;
      } else {
        businessScore += reqComplexity * this.complexityFactors.business;
      }

      // Add specific complexity factors
      const reqFactors = await this.identifyComplexityFactors(requirement);
      factors.push(...reqFactors);
    }

    // Normalize scores based on number of requirements
    const reqCount = requirements.length || 1;
    technicalScore = technicalScore / reqCount;
    businessScore = businessScore / reqCount;
    integrationScore = integrationScore / reqCount;

    // Calculate overall complexity with historical adjustment
    const baseOverall = (technicalScore + businessScore + integrationScore) / 3;
    const historicalAdjustment = this.getHistoricalAdjustment(requirements);
    const overall = Math.min(
      10,
      Math.max(1, baseOverall * historicalAdjustment)
    );

    return {
      overall,
      technical: Math.min(10, Math.max(1, technicalScore)),
      business: Math.min(10, Math.max(1, businessScore)),
      integration: Math.min(10, Math.max(1, integrationScore)),
      factors,
    };
  }

  async analyzeRequirementComplexity(
    requirement: Requirement,
    context?: string[]
  ): Promise<number> {
    try {
      const prompt = this.buildComplexityAnalysisPrompt(requirement, context);
      const response = await this.ollamaService.generateText(prompt, {
        temperature: 0.1,
        maxTokens: 200,
      });

      // Parse the AI response to extract complexity score
      const score = this.parseComplexityScore(response);
      return Math.min(10, Math.max(1, score));
    } catch (error) {
      console.warn("AI complexity analysis failed, using heuristic:", error);
      return this.calculateHeuristicComplexity(requirement);
    }
  }

  private buildComplexityAnalysisPrompt(
    requirement: Requirement,
    context?: string[]
  ): string {
    const contextStr = context ? `\nContext: ${context.join(", ")}` : "";

    return `Analyze the technical complexity of this software requirement on a scale of 1-10:

Requirement: ${requirement.description}
Type: ${requirement.type}
Priority: ${requirement.priority}${contextStr}

Consider these factors:
- Technical difficulty and implementation complexity
- Integration requirements with existing systems
- Testing complexity and edge cases
- Performance and scalability requirements
- Security and compliance considerations

Respond with only a number between 1-10, where:
1-3: Simple (basic CRUD, simple UI changes)
4-6: Moderate (business logic, API integration)
7-8: Complex (advanced algorithms, complex integrations)
9-10: Very Complex (distributed systems, AI/ML, critical security)

Score:`;
  }

  private parseComplexityScore(response: string): number {
    // Extract number from AI response
    const match = response.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      return parseFloat(match[1]);
    }

    // Fallback: analyze response text for complexity indicators
    const text = response.toLowerCase();
    if (text.includes("simple") || text.includes("basic")) return 3;
    if (text.includes("complex") || text.includes("difficult")) return 7;
    if (text.includes("very complex") || text.includes("extremely")) return 9;
    if (text.includes("moderate") || text.includes("medium")) return 5;

    return 5; // Default moderate complexity
  }

  private calculateHeuristicComplexity(requirement: Requirement): number {
    let score = 3; // Base complexity

    // Adjust based on requirement type
    if (requirement.type === "non-functional") {
      score += 2; // Non-functional requirements are typically more complex
    }

    // Adjust based on priority
    if (requirement.priority === "high") {
      score += 1; // High priority often means more complexity
    }

    // Analyze description for complexity keywords
    const description = requirement.description.toLowerCase();
    const complexityKeywords = {
      simple: ["create", "add", "display", "show", "list"],
      moderate: ["update", "modify", "validate", "process", "calculate"],
      complex: ["integrate", "synchronize", "optimize", "secure", "scale"],
      veryComplex: [
        "machine learning",
        "ai",
        "distributed",
        "real-time",
        "blockchain",
      ],
    };

    if (
      complexityKeywords.veryComplex.some((keyword) =>
        description.includes(keyword)
      )
    ) {
      score += 4;
    } else if (
      complexityKeywords.complex.some((keyword) =>
        description.includes(keyword)
      )
    ) {
      score += 3;
    } else if (
      complexityKeywords.moderate.some((keyword) =>
        description.includes(keyword)
      )
    ) {
      score += 1;
    }

    return Math.min(10, Math.max(1, score));
  }

  private async identifyComplexityFactors(
    requirement: Requirement
  ): Promise<ComplexityFactor[]> {
    const factors: ComplexityFactor[] = [];

    // Technical complexity factors
    if (this.isTechnicalRequirement(requirement)) {
      factors.push({
        name: "Technical Implementation",
        weight: this.complexityFactors.technical,
        score: await this.analyzeRequirementComplexity(requirement),
        description: "Complexity of technical implementation",
      });
    }

    // Integration complexity factors
    if (this.isIntegrationRequirement(requirement)) {
      factors.push({
        name: "System Integration",
        weight: this.complexityFactors.integration,
        score: await this.analyzeRequirementComplexity(requirement),
        description: "Complexity of integrating with existing systems",
      });
    }

    // Testing complexity factors
    if (this.requiresExtensiveTesting(requirement)) {
      factors.push({
        name: "Testing Complexity",
        weight: this.complexityFactors.testing,
        score: 6,
        description: "Requires extensive testing and validation",
      });
    }

    return factors;
  }

  private isTechnicalRequirement(requirement: Requirement): boolean {
    const technicalKeywords = [
      "api",
      "database",
      "algorithm",
      "performance",
      "security",
      "authentication",
      "encryption",
      "optimization",
      "caching",
    ];

    return technicalKeywords.some((keyword) =>
      requirement.description.toLowerCase().includes(keyword)
    );
  }

  private isIntegrationRequirement(requirement: Requirement): boolean {
    const integrationKeywords = [
      "integrate",
      "connect",
      "sync",
      "import",
      "export",
      "third-party",
      "external",
      "webhook",
      "api integration",
    ];

    return integrationKeywords.some((keyword) =>
      requirement.description.toLowerCase().includes(keyword)
    );
  }

  private requiresExtensiveTesting(requirement: Requirement): boolean {
    const testingKeywords = [
      "security",
      "payment",
      "critical",
      "safety",
      "compliance",
      "real-time",
      "performance",
      "scalability",
    ];

    return testingKeywords.some((keyword) =>
      requirement.description.toLowerCase().includes(keyword)
    );
  }

  private getHistoricalAdjustment(requirements: Requirement[]): number {
    if (this.historicalData.length === 0) {
      return 1.0; // No historical data, no adjustment
    }

    // Find similar historical projects
    const similarProjects = this.findSimilarProjects(requirements);

    if (similarProjects.length === 0) {
      return 1.0;
    }

    // Calculate average accuracy ratio from historical data
    const accuracyRatios = similarProjects.map(
      (project) => project.actualHours / project.estimatedHours
    );

    const avgRatio =
      accuracyRatios.reduce((sum, ratio) => sum + ratio, 0) /
      accuracyRatios.length;

    // Apply conservative adjustment (don't adjust too dramatically)
    return Math.min(1.5, Math.max(0.7, avgRatio));
  }

  private findSimilarProjects(requirements: Requirement[]): ProjectData[] {
    // Simple similarity matching based on requirement types and keywords
    return this.historicalData.filter((project) => {
      const projectKeywords = this.extractKeywords(project.requirements);
      const currentKeywords = this.extractKeywords(requirements);

      const commonKeywords = projectKeywords.filter((keyword) =>
        currentKeywords.includes(keyword)
      );

      // Consider projects similar if they share at least 30% of keywords
      return (
        commonKeywords.length /
          Math.max(projectKeywords.length, currentKeywords.length) >=
        0.3
      );
    });
  }

  private extractKeywords(requirements: Requirement[]): string[] {
    const keywords = new Set<string>();

    requirements.forEach((req) => {
      const words = req.description
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3)
        .slice(0, 10); // Limit to first 10 significant words

      words.forEach((word) => keywords.add(word));
    });

    return Array.from(keywords);
  }

  // Configuration methods
  updateComplexityFactors(factors: Partial<ComplexityFactors>): void {
    this.complexityFactors = { ...this.complexityFactors, ...factors };
  }

  getComplexityFactors(): ComplexityFactors {
    return { ...this.complexityFactors };
  }

  // Historical data management
  addHistoricalProject(projectData: ProjectData): void {
    this.historicalData.push(projectData);

    // Keep only the most recent 100 projects to prevent memory issues
    if (this.historicalData.length > 100) {
      this.historicalData = this.historicalData.slice(-100);
    }
  }

  getHistoricalData(): ProjectData[] {
    return [...this.historicalData];
  }

  clearHistoricalData(): void {
    this.historicalData = [];
  }
}
