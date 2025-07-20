export class RiskAnalyzer {
    ollamaService;
    constructor(ollamaService) {
        this.ollamaService = ollamaService;
    }
    async assessRisks(requirements, codebase, options) {
        const riskFactors = [];
        // Identify different types of risks
        const technicalRisks = await this.identifyTechnicalRisks(requirements, codebase);
        const integrationRisks = await this.assessIntegrationRisks(requirements, codebase);
        const businessRisks = await this.identifyBusinessRisks(requirements);
        const resourceRisks = await this.assessResourceRisks(requirements);
        riskFactors.push(...technicalRisks, ...integrationRisks, ...businessRisks, ...resourceRisks);
        // Calculate overall risk level
        const overallRisk = this.calculateOverallRisk(riskFactors);
        // Generate recommendations
        const recommendations = this.generateRiskRecommendations(riskFactors);
        return {
            overall: overallRisk,
            factors: riskFactors,
            recommendations,
        };
    }
    async identifyTechnicalRisks(requirements, codebase) {
        const risks = [];
        // Analyze requirements for technical complexity risks
        for (const requirement of requirements) {
            const technicalRisks = await this.analyzeTechnicalRisk(requirement, codebase);
            risks.push(...technicalRisks);
        }
        // Add codebase-specific risks
        if (codebase) {
            const codebaseRisks = this.analyzeCodebaseRisks(codebase);
            risks.push(...codebaseRisks);
        }
        return risks;
    }
    async analyzeTechnicalRisk(requirement, codebase) {
        const risks = [];
        // Check for high-risk technical patterns
        const description = requirement.description.toLowerCase();
        // Performance risks
        if (this.hasPerformanceRisk(description)) {
            risks.push({
                id: `perf-${requirement.id}`,
                name: "Performance Risk",
                probability: 0.6,
                impact: "high",
                description: "Requirement may have significant performance implications",
                mitigation: "Conduct performance testing early, implement caching strategies",
            });
        }
        // Security risks
        if (this.hasSecurityRisk(description)) {
            risks.push({
                id: `sec-${requirement.id}`,
                name: "Security Risk",
                probability: 0.4,
                impact: "high",
                description: "Requirement involves security-sensitive functionality",
                mitigation: "Security review, penetration testing, compliance audit",
            });
        }
        // Scalability risks
        if (this.hasScalabilityRisk(description)) {
            risks.push({
                id: `scale-${requirement.id}`,
                name: "Scalability Risk",
                probability: 0.5,
                impact: "medium",
                description: "Solution may not scale with increased load",
                mitigation: "Design for horizontal scaling, implement load testing",
            });
        }
        // Technology risks
        if (this.hasNewTechnologyRisk(description, codebase)) {
            risks.push({
                id: `tech-${requirement.id}`,
                name: "Technology Risk",
                probability: 0.7,
                impact: "medium",
                description: "Requirement involves unfamiliar or cutting-edge technology",
                mitigation: "Proof of concept, team training, expert consultation",
            });
        }
        return risks;
    }
    analyzeCodebaseRisks(codebase) {
        const risks = [];
        // Technical debt risks
        if (codebase.metrics && codebase.metrics.technicalDebt > 0.7) {
            risks.push({
                id: "tech-debt",
                name: "Technical Debt Risk",
                probability: 0.8,
                impact: "medium",
                description: "High technical debt may slow development",
                mitigation: "Refactoring sprint, code quality improvements",
            });
        }
        // Dependency risks
        if (codebase.dependencies && codebase.dependencies.length > 50) {
            risks.push({
                id: "dependency-risk",
                name: "Dependency Management Risk",
                probability: 0.6,
                impact: "medium",
                description: "Large number of dependencies increases maintenance risk",
                mitigation: "Dependency audit, update strategy, alternatives evaluation",
            });
        }
        // Architecture risks
        if (codebase.issues &&
            codebase.issues.some((issue) => issue.severity === "high")) {
            risks.push({
                id: "architecture-risk",
                name: "Architecture Risk",
                probability: 0.7,
                impact: "high",
                description: "Existing architecture issues may complicate implementation",
                mitigation: "Architecture review, refactoring plan, design patterns",
            });
        }
        return risks;
    }
    async assessIntegrationRisks(requirements, codebase) {
        const risks = [];
        // Find integration requirements
        const integrationReqs = requirements.filter((req) => this.isIntegrationRequirement(req));
        for (const req of integrationReqs) {
            // Third-party integration risks
            if (this.hasThirdPartyIntegration(req.description)) {
                risks.push({
                    id: `integration-${req.id}`,
                    name: "Third-party Integration Risk",
                    probability: 0.6,
                    impact: "medium",
                    description: "External service dependencies may cause delays or failures",
                    mitigation: "API documentation review, fallback strategies, SLA verification",
                });
            }
            // Data migration risks
            if (this.hasDataMigrationRisk(req.description)) {
                risks.push({
                    id: `migration-${req.id}`,
                    name: "Data Migration Risk",
                    probability: 0.5,
                    impact: "high",
                    description: "Data migration may be complex and error-prone",
                    mitigation: "Migration testing, rollback plan, data validation",
                });
            }
        }
        return risks;
    }
    async identifyBusinessRisks(requirements) {
        const risks = [];
        // Scope creep risk
        const vagueRequirements = requirements.filter((req) => this.isVagueRequirement(req.description));
        if (vagueRequirements.length > requirements.length * 0.3) {
            risks.push({
                id: "scope-creep",
                name: "Scope Creep Risk",
                probability: 0.8,
                impact: "high",
                description: "Vague requirements may lead to scope expansion",
                mitigation: "Requirements clarification, change control process",
            });
        }
        // Stakeholder alignment risk
        const conflictingReqs = this.findConflictingRequirements(requirements);
        if (conflictingReqs.length > 0) {
            risks.push({
                id: "stakeholder-alignment",
                name: "Stakeholder Alignment Risk",
                probability: 0.7,
                impact: "medium",
                description: "Conflicting requirements suggest stakeholder misalignment",
                mitigation: "Stakeholder workshops, requirement prioritization",
            });
        }
        return risks;
    }
    async assessResourceRisks(requirements) {
        const risks = [];
        // Skill gap risk
        const specializedReqs = requirements.filter((req) => this.requiresSpecializedSkills(req.description));
        if (specializedReqs.length > 0) {
            risks.push({
                id: "skill-gap",
                name: "Skill Gap Risk",
                probability: 0.6,
                impact: "medium",
                description: "Requirements may require specialized skills not available in team",
                mitigation: "Training plan, external consultants, skill assessment",
            });
        }
        // Timeline risk
        const highPriorityCount = requirements.filter((req) => req.priority === "high").length;
        if (highPriorityCount > requirements.length * 0.5) {
            risks.push({
                id: "timeline-pressure",
                name: "Timeline Pressure Risk",
                probability: 0.7,
                impact: "high",
                description: "High number of high-priority requirements may create timeline pressure",
                mitigation: "Requirement prioritization, phased delivery, resource allocation",
            });
        }
        return risks;
    }
    calculateOverallRisk(riskFactors) {
        if (riskFactors.length === 0)
            return "low";
        // Calculate weighted risk score
        let totalRiskScore = 0;
        let totalWeight = 0;
        riskFactors.forEach((risk) => {
            const impactWeight = this.getImpactWeight(risk.impact);
            const riskScore = risk.probability * impactWeight;
            totalRiskScore += riskScore;
            totalWeight += 1;
        });
        const averageRisk = totalRiskScore / totalWeight;
        // Convert to priority level
        if (averageRisk >= 0.7)
            return "high";
        if (averageRisk >= 0.4)
            return "medium";
        return "low";
    }
    getImpactWeight(impact) {
        switch (impact) {
            case "high":
                return 1.0;
            case "medium":
                return 0.6;
            case "low":
                return 0.3;
            default:
                return 0.5;
        }
    }
    generateRiskRecommendations(riskFactors) {
        const recommendations = new Set();
        // Add specific mitigations
        riskFactors.forEach((risk) => {
            recommendations.add(risk.mitigation);
        });
        // Add general recommendations based on risk patterns
        const highRisks = riskFactors.filter((r) => r.impact === "high");
        if (highRisks.length > 0) {
            recommendations.add("Implement risk monitoring and early warning systems");
            recommendations.add("Create detailed contingency plans for high-impact risks");
        }
        const techRisks = riskFactors.filter((r) => r.name.includes("Technology") || r.name.includes("Technical"));
        if (techRisks.length > 0) {
            recommendations.add("Conduct proof-of-concept development for high-risk technical components");
        }
        return Array.from(recommendations);
    }
    // Helper methods for risk detection
    hasPerformanceRisk(description) {
        const performanceKeywords = [
            "real-time",
            "high-volume",
            "concurrent",
            "scalable",
            "performance",
            "fast",
            "responsive",
            "load",
        ];
        return performanceKeywords.some((keyword) => description.includes(keyword));
    }
    hasSecurityRisk(description) {
        const securityKeywords = [
            "authentication",
            "authorization",
            "security",
            "encrypt",
            "payment",
            "personal data",
            "sensitive",
            "compliance",
        ];
        return securityKeywords.some((keyword) => description.includes(keyword));
    }
    hasScalabilityRisk(description) {
        const scalabilityKeywords = [
            "scale",
            "growth",
            "expand",
            "multiple users",
            "distributed",
            "cloud",
            "microservices",
        ];
        return scalabilityKeywords.some((keyword) => description.includes(keyword));
    }
    hasNewTechnologyRisk(description, codebase) {
        const newTechKeywords = [
            "machine learning",
            "ai",
            "blockchain",
            "iot",
            "ar",
            "vr",
            "quantum",
            "edge computing",
        ];
        return newTechKeywords.some((keyword) => description.includes(keyword));
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
    hasThirdPartyIntegration(description) {
        const thirdPartyKeywords = [
            "third-party",
            "external api",
            "service integration",
            "payment gateway",
            "social media",
            "cloud service",
        ];
        return thirdPartyKeywords.some((keyword) => description.toLowerCase().includes(keyword));
    }
    hasDataMigrationRisk(description) {
        const migrationKeywords = [
            "migrate",
            "transfer",
            "import data",
            "legacy system",
            "data conversion",
            "database migration",
        ];
        return migrationKeywords.some((keyword) => description.toLowerCase().includes(keyword));
    }
    isVagueRequirement(description) {
        const vagueIndicators = [
            "user-friendly",
            "intuitive",
            "flexible",
            "scalable",
            "robust",
            "efficient",
            "as needed",
            "appropriate",
        ];
        const vagueCount = vagueIndicators.filter((indicator) => description.toLowerCase().includes(indicator)).length;
        return vagueCount > 0 && description.split(" ").length < 10;
    }
    findConflictingRequirements(requirements) {
        // Simple conflict detection based on contradictory keywords
        const conflicts = [];
        for (let i = 0; i < requirements.length; i++) {
            for (let j = i + 1; j < requirements.length; j++) {
                if (this.areConflicting(requirements[i], requirements[j])) {
                    conflicts.push(requirements[i], requirements[j]);
                }
            }
        }
        return [...new Set(conflicts)]; // Remove duplicates
    }
    areConflicting(req1, req2) {
        const conflictPairs = [
            ["simple", "complex"],
            ["fast", "secure"],
            ["cheap", "high-quality"],
            ["automated", "manual"],
            ["public", "private"],
        ];
        const desc1 = req1.description.toLowerCase();
        const desc2 = req2.description.toLowerCase();
        return conflictPairs.some(([word1, word2]) => (desc1.includes(word1) && desc2.includes(word2)) ||
            (desc1.includes(word2) && desc2.includes(word1)));
    }
    requiresSpecializedSkills(description) {
        const specializedKeywords = [
            "machine learning",
            "ai",
            "blockchain",
            "devops",
            "security expert",
            "data scientist",
            "architect",
            "specialized",
            "expert knowledge",
        ];
        return specializedKeywords.some((keyword) => description.toLowerCase().includes(keyword));
    }
}
//# sourceMappingURL=RiskAnalyzer.js.map