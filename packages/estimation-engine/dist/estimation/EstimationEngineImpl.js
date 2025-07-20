import { ComplexityAnalyzer } from "../complexity/ComplexityAnalyzer.js";
import { RiskAnalyzer } from "../risk/RiskAnalyzer.js";
export class EstimationEngineImpl {
    complexityAnalyzer;
    riskAnalyzer;
    rateConfiguration;
    historicalData;
    constructor(ollamaService) {
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
    async calculateComplexity(requirements, options) {
        return this.complexityAnalyzer.calculateComplexity(requirements, options);
    }
    async analyzeRequirementComplexity(requirement, context) {
        return this.complexityAnalyzer.analyzeRequirementComplexity(requirement, context);
    }
    async generateTimeEstimate(complexity, historicalData, options) {
        const dataToUse = historicalData || this.historicalData;
        // Base hours calculation from complexity
        const baseHours = this.calculateBaseHours(complexity);
        // Apply historical adjustment
        const historicalAdjustment = this.calculateHistoricalAdjustment(complexity, dataToUse);
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
    async estimateByCategory(requirements, categories) {
        const estimates = new Map();
        // Group requirements by category
        const categorizedReqs = this.categorizeRequirements(requirements, categories);
        for (const [category, reqs] of categorizedReqs.entries()) {
            if (reqs.length > 0) {
                const complexity = await this.calculateComplexity(reqs);
                const timeEstimate = await this.generateTimeEstimate(complexity);
                estimates.set(category, timeEstimate);
            }
        }
        return estimates;
    }
    async assessRisks(requirements, codebase, options) {
        return this.riskAnalyzer.assessRisks(requirements, codebase, options);
    }
    async identifyTechnicalRisks(requirements, codebase) {
        const risks = await this.riskAnalyzer.identifyTechnicalRisks(requirements, codebase);
        return risks.map((risk) => risk.description);
    }
    async assessIntegrationRisks(requirements, existingSystems) {
        const integrationRisks = [];
        for (const req of requirements) {
            if (this.isIntegrationRequirement(req)) {
                const riskDescription = `Integration risk for: ${req.description}`;
                integrationRisks.push(riskDescription);
                if (existingSystems && existingSystems.length > 0) {
                    integrationRisks.push(`Potential conflicts with existing systems: ${existingSystems.join(", ")}`);
                }
            }
        }
        return integrationRisks;
    }
    async generateProjectEstimate(requirements, options) {
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
        const timeEstimate = await this.generateTimeEstimate(complexity, historicalData);
        // Calculate costs
        const totalCost = this.calculateTotalCost(timeEstimate.totalHours);
        // Assess risks if requested
        let risks = [];
        if (options?.includeRisks) {
            const riskAssessment = await this.assessRisks(requirements, options.codebaseContext);
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
            confidence: timeEstimate.confidence,
            requirements,
        };
    }
    async addHistoricalProject(projectData) {
        this.historicalData.push(projectData);
        // Keep only the most recent 100 projects to prevent memory issues
        if (this.historicalData.length > 100) {
            this.historicalData = this.historicalData.slice(-100);
        }
        // Add to complexity analyzer as well
        this.complexityAnalyzer.addHistoricalProject(projectData);
    }
    async getHistoricalData(filters) {
        let filteredData = [...this.historicalData];
        if (filters) {
            if (filters.size) {
                filteredData = filteredData.filter((project) => this.categorizeProjectSize(project.actualHours) === filters.size);
            }
            if (filters.technology) {
                filteredData = filteredData.filter((project) => this.projectUsesAnyTechnology(project, filters.technology));
            }
            if (filters.domain) {
                filteredData = filteredData.filter((project) => project.name.toLowerCase().includes(filters.domain.toLowerCase()));
            }
        }
        return filteredData;
    }
    setHourlyRates(rates) {
        this.rateConfiguration = { ...rates };
    }
    getHourlyRates() {
        return { ...this.rateConfiguration };
    }
    updateComplexityFactors(factors) {
        this.complexityAnalyzer.updateComplexityFactors(factors);
    }
    getComplexityFactors() {
        return this.complexityAnalyzer.getComplexityFactors();
    }
    async calibrateEstimates(actualProjects) {
        if (actualProjects.length === 0) {
            return {
                accuracy: 0,
                bias: 0,
                recommendations: ["No historical data available for calibration"],
            };
        }
        // Calculate accuracy metrics
        const accuracyRatios = actualProjects.map((project) => Math.abs(project.actualHours - project.estimatedHours) /
            project.actualHours);
        const accuracy = 1 -
            accuracyRatios.reduce((sum, ratio) => sum + ratio, 0) /
                accuracyRatios.length;
        // Calculate bias (positive = underestimating, negative = overestimating)
        const biasRatios = actualProjects.map((project) => (project.estimatedHours - project.actualHours) / project.actualHours);
        const bias = biasRatios.reduce((sum, ratio) => sum + ratio, 0) / biasRatios.length;
        // Generate recommendations
        const recommendations = this.generateCalibrationRecommendations(accuracy, bias, actualProjects);
        return {
            accuracy: Math.max(0, Math.min(1, accuracy)),
            bias,
            recommendations,
        };
    }
    async improveAccuracy(feedback) {
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
    async generateScenarios(requirements, scenarios) {
        const scenarioEstimates = new Map();
        for (const scenario of scenarios) {
            const adjustedFactors = this.getScenarioFactors(scenario);
            const estimate = await this.generateProjectEstimate(requirements, {
                customFactors: adjustedFactors,
                includeRisks: true,
                useHistoricalData: true,
            });
            // Apply scenario-specific adjustments
            const adjustedEstimate = this.applyScenarioAdjustments(estimate, scenario);
            scenarioEstimates.set(scenario, adjustedEstimate);
        }
        return scenarioEstimates;
    }
    async validateEstimate(estimate, requirements) {
        const warnings = [];
        const suggestions = [];
        // Check if estimate seems reasonable
        const avgHoursPerRequirement = estimate.totalHours / requirements.length;
        if (avgHoursPerRequirement < 2) {
            warnings.push("Estimate seems very low - average less than 2 hours per requirement");
            suggestions.push("Review requirement complexity and consider hidden tasks");
        }
        if (avgHoursPerRequirement > 100) {
            warnings.push("Estimate seems very high - average more than 100 hours per requirement");
            suggestions.push("Consider breaking down requirements into smaller, more manageable pieces");
        }
        // Check confidence level
        if (estimate.confidence < 0.5) {
            warnings.push("Low confidence in estimate due to unclear requirements or lack of historical data");
            suggestions.push("Gather more detailed requirements or similar project data");
        }
        // Check for missing breakdown categories
        const expectedCategories = ["Development", "Testing", "Documentation"];
        const actualCategories = estimate.breakdown.map((b) => b.category);
        const missingCategories = expectedCategories.filter((cat) => !actualCategories.includes(cat));
        if (missingCategories.length > 0) {
            warnings.push(`Missing estimate categories: ${missingCategories.join(", ")}`);
            suggestions.push("Ensure all development phases are included in the estimate");
        }
        const valid = warnings.length === 0;
        return { valid, warnings, suggestions };
    }
    // Private helper methods
    calculateBaseHours(complexity) {
        // Base formula: complexity score translates to hours
        // This is a simplified model - in practice, you'd want more sophisticated calculations
        const baseMultiplier = 8; // 8 hours per complexity point as baseline
        return ((complexity.technical * 0.4 +
            complexity.business * 0.3 +
            complexity.integration * 0.3) *
            baseMultiplier);
    }
    calculateHistoricalAdjustment(complexity, historicalData) {
        if (historicalData.length === 0)
            return 1.0;
        // Find similar projects and calculate average adjustment factor
        const similarProjects = historicalData.filter((project) => this.isSimilarComplexity(complexity, project));
        if (similarProjects.length === 0)
            return 1.0;
        const adjustmentFactors = similarProjects.map((project) => project.actualHours / project.estimatedHours);
        const avgAdjustment = adjustmentFactors.reduce((sum, factor) => sum + factor, 0) /
            adjustmentFactors.length;
        // Apply conservative adjustment (don't adjust too dramatically)
        return Math.min(1.5, Math.max(0.7, avgAdjustment));
    }
    createTimeBreakdown(complexity, totalHours) {
        const breakdown = [];
        // Development (60% of total)
        const developmentHours = totalHours * 0.6;
        breakdown.push({
            category: "Development",
            hours: Math.round(developmentHours * 100) / 100,
            description: "Core development work including implementation and unit testing",
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
    calculateConfidence(complexity, historicalData) {
        let confidence = 0.7; // Base confidence
        // Adjust based on historical data availability
        if (historicalData.length > 10) {
            confidence += 0.2;
        }
        else if (historicalData.length > 5) {
            confidence += 0.1;
        }
        // Adjust based on complexity clarity (lower complexity = higher confidence)
        const avgComplexity = (complexity.technical + complexity.business + complexity.integration) / 3;
        if (avgComplexity < 5) {
            confidence += 0.1;
        }
        else if (avgComplexity > 8) {
            confidence -= 0.2;
        }
        return Math.max(0.1, Math.min(1.0, confidence));
    }
    generateAssumptions(complexity, historicalData) {
        const assumptions = [
            "Estimates assume standard working hours (8 hours per day)",
            "Requirements are stable and well-defined",
            "Development team has appropriate skill level",
        ];
        if (historicalData.length === 0) {
            assumptions.push("No historical data available - estimates based on industry standards");
        }
        if (complexity.integration > 7) {
            assumptions.push("Complex integrations may require additional coordination time");
        }
        if (complexity.technical > 8) {
            assumptions.push("High technical complexity may require research and prototyping time");
        }
        return assumptions;
    }
    categorizeRequirements(requirements, categories) {
        const categorized = new Map();
        // Initialize categories
        categories.forEach((category) => categorized.set(category, []));
        // Simple categorization based on keywords
        requirements.forEach((req) => {
            let assigned = false;
            for (const category of categories) {
                if (req.description.toLowerCase().includes(category.toLowerCase())) {
                    categorized.get(category).push(req);
                    assigned = true;
                    break;
                }
            }
            // If not assigned to any specific category, put in 'General' or first category
            if (!assigned) {
                const generalCategory = categories.find((cat) => cat.toLowerCase() === "general") ||
                    categories[0];
                if (generalCategory) {
                    categorized.get(generalCategory).push(req);
                }
            }
        });
        return categorized;
    }
    calculateTotalCost(totalHours) {
        const baseCost = totalHours * this.rateConfiguration.hourlyRate;
        const withOverhead = baseCost * (1 + this.rateConfiguration.overhead);
        const withProfit = withOverhead * (1 + this.rateConfiguration.profitMargin);
        return Math.round(withProfit * 100) / 100;
    }
    isIntegrationRequirement(requirement) {
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
        return integrationKeywords.some((keyword) => requirement.description.toLowerCase().includes(keyword));
    }
    categorizeProjectSize(hours) {
        if (hours < 100)
            return "small";
        if (hours < 500)
            return "medium";
        return "large";
    }
    projectUsesAnyTechnology(project, technologies) {
        const projectDescription = project.name.toLowerCase();
        return technologies.some((tech) => projectDescription.includes(tech.toLowerCase()));
    }
    isSimilarComplexity(complexity, project) {
        // Simple similarity check - in practice, you'd want more sophisticated matching
        const projectComplexity = project.estimatedHours / 40; // Rough complexity estimate
        const currentComplexity = complexity.overall;
        return Math.abs(projectComplexity - currentComplexity) < 2;
    }
    generateCalibrationRecommendations(accuracy, bias, projects) {
        const recommendations = [];
        if (accuracy < 0.7) {
            recommendations.push("Estimation accuracy is below 70% - consider refining estimation methodology");
        }
        if (bias > 0.2) {
            recommendations.push("Consistent underestimation detected - increase complexity factors by 10-20%");
        }
        else if (bias < -0.2) {
            recommendations.push("Consistent overestimation detected - reduce complexity factors by 10-15%");
        }
        if (projects.length < 10) {
            recommendations.push("Collect more historical project data to improve estimation accuracy");
        }
        return recommendations;
    }
    analyzeFeedbackPatterns(feedback) {
        const technicalProjects = feedback.filter((f) => f.factors.some((factor) => factor.toLowerCase().includes("technical")));
        const integrationProjects = feedback.filter((f) => f.factors.some((factor) => factor.toLowerCase().includes("integration")));
        const technicalUnderestimation = technicalProjects.length > 0
            ? technicalProjects.filter((p) => p.actualHours > p.estimatedHours)
                .length / technicalProjects.length
            : 0;
        const integrationUnderestimation = integrationProjects.length > 0
            ? integrationProjects.filter((p) => p.actualHours > p.estimatedHours)
                .length / integrationProjects.length
            : 0;
        return { technicalUnderestimation, integrationUnderestimation };
    }
    getScenarioFactors(scenario) {
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
    applyScenarioAdjustments(estimate, scenario) {
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
//# sourceMappingURL=EstimationEngineImpl.js.map