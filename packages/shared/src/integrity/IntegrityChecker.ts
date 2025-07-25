import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

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

export class IntegrityChecker {
  private options: Required<IntegrityCheckerOptions>;

  constructor(options: IntegrityCheckerOptions) {
    this.options = {
      includePatterns: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'],
      excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/coverage/**',
        '**/.git/**'
      ],
      checkTodos: true,
      checkMocks: true,
      checkPlaceholders: true,
      checkUnimplemented: true,
      checkMissingModules: true,
      ...options
    };
  }

  async checkIntegrity(): Promise<IntegrityReport> {
    const issues: IntegrityIssue[] = [];
    
    try {
      // Get all files to check
      const files = await this.getFilesToCheck();
      
      // Check each file
      for (const file of files) {
        const fileIssues = await this.checkFile(file);
        issues.push(...fileIssues);
      }

      // Check for missing modules
      if (this.options.checkMissingModules) {
        const moduleIssues = await this.checkMissingModules();
        issues.push(...moduleIssues);
      }

      return this.generateReport(issues);
    } catch (error) {
      throw new Error(`Integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getFilesToCheck(): Promise<string[]> {
    const files: string[] = [];
    
    for (const pattern of this.options.includePatterns) {
      const matchedFiles = await glob(pattern, {
        cwd: this.options.rootPath,
        ignore: this.options.excludePatterns,
        absolute: true
      });
      files.push(...matchedFiles);
    }

    // Remove duplicates
    return [...new Set(files)];
  }

  private async checkFile(filePath: string): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        
        // Check for TODOs
        if (this.options.checkTodos) {
          const todoMatch = line.match(/(TODO|FIXME|HACK|XXX)[\s:]/i);
          if (todoMatch) {
            issues.push({
              type: 'TODO',
              severity: this.getTodoSeverity(todoMatch[1]),
              file: path.relative(this.options.rootPath, filePath),
              line: lineNumber,
              message: `Found ${todoMatch[1]}: ${line.trim()}`,
              context: line.trim()
            });
          }
        }

        // Check for mocks
        if (this.options.checkMocks) {
          const mockMatch = line.match(/(mock|stub|fake)[\w]*\s*\(/i);
          if (mockMatch && !line.includes('test') && !line.includes('spec') && !filePath.includes('.test.') && !filePath.includes('.spec.')) {
            issues.push({
              type: 'MOCK',
              severity: 'medium',
              file: path.relative(this.options.rootPath, filePath),
              line: lineNumber,
              message: `Found mock implementation in production code: ${line.trim()}`,
              context: line.trim()
            });
          }
        }

        // Check for placeholders
        if (this.options.checkPlaceholders) {
          const placeholderPatterns = [
            /placeholder/i,
            /not implemented/i,
            /coming soon/i,
            /under construction/i,
            /\[API_URL\]/i,
            /\[NAME\]/i,
            /\[EMAIL\]/i,
            /\[PHONE\]/i,
            /\[ADDRESS\]/i,
            /\[TODO[^\]]*\]/i
          ];
          
          for (const pattern of placeholderPatterns) {
            if (pattern.test(line) && !line.includes('//') && !line.includes('/*')) {
              issues.push({
                type: 'PLACEHOLDER',
                severity: 'medium',
                file: path.relative(this.options.rootPath, filePath),
                line: lineNumber,
                message: `Found placeholder text: ${line.trim()}`,
                context: line.trim()
              });
              break;
            }
          }
        }

        // Check for unimplemented functions
        if (this.options.checkUnimplemented) {
          const unimplementedPatterns = [
            /throw new Error\(['"]not implemented['"]?\)/i,
            /throw new Error\(['"]unimplemented['"]?\)/i,
            /return null;?\s*\/\/.*implement/i,
            /return undefined;?\s*\/\/.*implement/i
          ];
          
          for (const pattern of unimplementedPatterns) {
            if (pattern.test(line)) {
              issues.push({
                type: 'UNIMPLEMENTED',
                severity: 'high',
                file: path.relative(this.options.rootPath, filePath),
                line: lineNumber,
                message: `Found unimplemented function: ${line.trim()}`,
                context: line.trim()
              });
              break;
            }
          }
        }
      }
    } catch (error) {
      issues.push({
        type: 'MISSING_MODULE',
        severity: 'critical',
        file: path.relative(this.options.rootPath, filePath),
        message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return issues;
  }

  private async checkMissingModules(): Promise<IntegrityIssue[]> {
    const issues: IntegrityIssue[] = [];
    
    try {
      // Check for essential package.json files
      const essentialPackages = [
        'packages/core/package.json',
        'packages/shared/package.json',
        'packages/ollama-interface/package.json',
        'packages/document-analyzer/package.json',
        'packages/web-dashboard/package.json'
      ];

      for (const packagePath of essentialPackages) {
        const fullPath = path.join(this.options.rootPath, packagePath);
        try {
          await fs.access(fullPath);
        } catch {
          issues.push({
            type: 'MISSING_MODULE',
            severity: 'critical',
            file: packagePath,
            message: `Essential package.json missing: ${packagePath}`
          });
        }
      }

      // Check for main entry points
      const entryPoints = [
        'packages/core/src/index.ts',
        'packages/shared/src/index.ts',
        'packages/ollama-interface/src/index.ts'
      ];

      for (const entryPoint of entryPoints) {
        const fullPath = path.join(this.options.rootPath, entryPoint);
        try {
          await fs.access(fullPath);
        } catch {
          issues.push({
            type: 'MISSING_MODULE',
            severity: 'high',
            file: entryPoint,
            message: `Main entry point missing: ${entryPoint}`
          });
        }
      }

    } catch (error) {
      issues.push({
        type: 'MISSING_MODULE',
        severity: 'critical',
        file: 'system',
        message: `Failed to check modules: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return issues;
  }

  private getTodoSeverity(todoType: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (todoType.toUpperCase()) {
      case 'FIXME':
      case 'HACK':
        return 'high';
      case 'XXX':
        return 'medium';
      case 'TODO':
      default:
        return 'low';
    }
  }

  private generateReport(issues: IntegrityIssue[]): IntegrityReport {
    const issuesByType: Record<string, number> = {};
    const issuesBySeverity: Record<string, number> = {};

    for (const issue of issues) {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
    }

    const codeQualityScore = this.calculateQualityScore(issues);
    const readinessLevel = this.determineReadinessLevel(issues, codeQualityScore);
    const recommendations = this.generateRecommendations(issues);

    return {
      timestamp: new Date(),
      totalIssues: issues.length,
      issuesByType,
      issuesBySeverity,
      issues,
      summary: {
        codeQualityScore,
        readinessLevel,
        recommendations
      }
    };
  }

  private calculateQualityScore(issues: IntegrityIssue[]): number {
    if (issues.length === 0) return 100;

    const severityWeights = {
      low: 1,
      medium: 3,
      high: 7,
      critical: 15
    };

    const totalWeight = issues.reduce((sum, issue) => {
      return sum + severityWeights[issue.severity];
    }, 0);

    // Calculate score (0-100, where 100 is perfect)
    const maxPossibleWeight = issues.length * severityWeights.critical;
    const score = Math.max(0, 100 - (totalWeight / maxPossibleWeight) * 100);
    
    return Math.round(score);
  }

  private determineReadinessLevel(
    issues: IntegrityIssue[], 
    qualityScore: number
  ): 'not-ready' | 'needs-attention' | 'ready' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;

    if (criticalIssues > 0 || qualityScore < 60) {
      return 'not-ready';
    } else if (highIssues > 5 || qualityScore < 80) {
      return 'needs-attention';
    } else {
      return 'ready';
    }
  }

  private generateRecommendations(issues: IntegrityIssue[]): string[] {
    const recommendations: string[] = [];
    const issuesByType = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if (issuesByType.CRITICAL > 0) {
      recommendations.push('Address critical issues immediately - these may prevent the system from functioning');
    }

    if (issuesByType.UNIMPLEMENTED > 0) {
      recommendations.push(`Complete ${issuesByType.UNIMPLEMENTED} unimplemented functions before deployment`);
    }

    if (issuesByType.MOCK > 0) {
      recommendations.push(`Replace ${issuesByType.MOCK} mock implementations with production code`);
    }

    if (issuesByType.TODO > 10) {
      recommendations.push('Consider creating tickets for the numerous TODO items to track technical debt');
    }

    if (issuesByType.PLACEHOLDER > 0) {
      recommendations.push('Replace placeholder text with actual content or remove if not needed');
    }

    if (issuesByType.MISSING_MODULE > 0) {
      recommendations.push('Restore missing modules and entry points for proper system functionality');
    }

    if (recommendations.length === 0) {
      recommendations.push('Code integrity looks good! Consider running this check regularly to maintain quality.');
    }

    return recommendations;
  }
}