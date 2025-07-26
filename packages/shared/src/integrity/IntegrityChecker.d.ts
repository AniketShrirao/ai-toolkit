export interface IntegrityIssue {
    type: 'TODO' | 'MOCK' | 'PLACEHOLDER' | 'UNIMPLEMENTED' | 'MISSING_MODULE';
    severity: 'low' | 'medium' | 'high' | 'critical';
    file: string;
    line?: number;
    column?: number;
    message: string;
    context?: string;
}
export interface IntegrityReport {
    timestamp: Date;
    totalIssues: number;
    issuesByType: Record<string, number>;
    issuesBySeverity: Record<string, number>;
    issues: IntegrityIssue[];
    summary: {
        codeQualityScore: number;
        readinessLevel: 'not-ready' | 'needs-attention' | 'ready';
        recommendations: string[];
    };
}
export interface IntegrityCheckerOptions {
    rootPath: string;
    includePatterns?: string[];
    excludePatterns?: string[];
    checkTodos?: boolean;
    checkMocks?: boolean;
    checkPlaceholders?: boolean;
    checkUnimplemented?: boolean;
    checkMissingModules?: boolean;
}
export declare class IntegrityChecker {
    private options;
    constructor(options: IntegrityCheckerOptions);
    checkIntegrity(): Promise<IntegrityReport>;
    private getFilesToCheck;
    private checkFile;
    private checkMissingModules;
    private getTodoSeverity;
    private generateReport;
    private calculateQualityScore;
    private determineReadinessLevel;
    private generateRecommendations;
}
//# sourceMappingURL=IntegrityChecker.d.ts.map