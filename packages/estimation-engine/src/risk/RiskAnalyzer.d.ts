import { Requirement, RiskAssessment, RiskFactor, CodebaseAnalysis, ProcessingOptions } from "@ai-toolkit/shared";
import { OllamaService } from "@ai-toolkit/ollama-interface";
export declare class RiskAnalyzer {
    private ollamaService;
    constructor(ollamaService: OllamaService);
    assessRisks(requirements: Requirement[], codebase?: CodebaseAnalysis, options?: ProcessingOptions): Promise<RiskAssessment>;
    identifyTechnicalRisks(requirements: Requirement[], codebase?: CodebaseAnalysis): Promise<RiskFactor[]>;
    private analyzeTechnicalRisk;
    private analyzeCodebaseRisks;
    assessIntegrationRisks(requirements: Requirement[], codebase?: CodebaseAnalysis): Promise<RiskFactor[]>;
    private identifyBusinessRisks;
    private assessResourceRisks;
    private calculateOverallRisk;
    private getImpactWeight;
    private generateRiskRecommendations;
    private hasPerformanceRisk;
    private hasSecurityRisk;
    private hasScalabilityRisk;
    private hasNewTechnologyRisk;
    private isIntegrationRequirement;
    private hasThirdPartyIntegration;
    private hasDataMigrationRisk;
    private isVagueRequirement;
    private findConflictingRequirements;
    private areConflicting;
    private requiresSpecializedSkills;
}
//# sourceMappingURL=RiskAnalyzer.d.ts.map