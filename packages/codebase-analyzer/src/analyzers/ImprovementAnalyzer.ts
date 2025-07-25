import { promises as fs } from "fs";
import * as path from "path";
import {
  ProjectStructure,
  FileInfo,
  Recommendation,
  CodeIssue,
} from "@ai-toolkit/shared/types/analysis.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";

export interface ImprovementAnalysis {
  recommendations: Recommendation[];
  optimizations: Recommendation[];
  securityImprovements: Recommendation[];
  performanceImprovements: Recommendation[];
}

export class ImprovementAnalyzer {
  private ollamaService: OllamaService;

  constructor(ollamaService: OllamaService) {
    this.ollamaService = ollamaService;
  }

  /**
   * Analyze codebase for improvement opportunities
   */
  async analyzeImprovements(
    structure: ProjectStructure,
    issues: CodeIssue[]
  ): Promise<ImprovementAnalysis> {
    const recommendations: Recommendation[] = [];
    const optimizations: Recommendation[] = [];
    const securityImprovements: Recommendation[] = [];
    const performanceImprovements: Recommendation[] = [];

    // Analyze performance improvements
    performanceImprovements.push(
      ...this.analyzePerformanceImprovements(structure, issues)
    );

    // Analyze security improvements
    securityImprovements.push(
      ...this.analyzeSecurityImprovements(structure, issues)
    );

    // Analyze maintainability improvements
    recommendations.push(
      ...this.analyzeMaintainabilityImprovements(structure, issues)
    );

    // Analyze architecture optimizations
    optimizations.push(...this.analyzeArchitectureOptimizations(structure));

    // Analyze dependency optimizations
    optimizations.push(...this.analyzeDependencyOptimizations(structure));

    // Analyze testing improvements
    recommendations.push(...this.analyzeTestingImprovements(structure));

    return {
      recommendations,
      optimizations,
      securityImprovements,
      performanceImprovements,
    };
  }

  /**
   * Analyze performance improvement opportunities
   */
  private analyzePerformanceImprovements(
    structure: ProjectStructure,
    issues: CodeIssue[]
  ): Recommendation[] {
    const improvements: Recommendation[] = [];

    // Check for synchronous operations
    const syncIssues = issues.filter(
      (issue) =>
        issue.type === "performance" &&
        issue.description.includes("Synchronous")
    );
    if (syncIssues.length > 0) {
      improvements.push({
        id: "async-operations",
        category: "performance",
        priority: "high",
        title: "Replace synchronous operations with asynchronous alternatives",
        description: `Found ${syncIssues.length} synchronous operations that could block execution. Consider using async/await patterns.`,
        effort: "medium",
        impact: "high",
      });
    }

    // Check for nested loops
    const nestedLoopIssues = issues.filter((issue) =>
      issue.description.includes("nested loop")
    );
    if (nestedLoopIssues.length > 0) {
      improvements.push({
        id: "optimize-algorithms",
        category: "performance",
        priority: "medium",
        title: "Optimize algorithm complexity",
        description:
          "Consider using more efficient algorithms or data structures to reduce time complexity.",
        effort: "high",
        impact: "medium",
      });
    }

    // Check for large bundle sizes (JavaScript/TypeScript projects)
    const jsFiles = structure.files.filter(
      (f) => f.language === "JavaScript" || f.language === "TypeScript"
    );
    const totalJSSize = jsFiles.reduce((sum, f) => sum + f.size, 0);

    if (totalJSSize > 5 * 1024 * 1024) {
      // 5MB
      improvements.push({
        id: "bundle-optimization",
        category: "performance",
        priority: "medium",
        title: "Optimize bundle size",
        description:
          "Large JavaScript bundle detected. Consider code splitting, tree shaking, and lazy loading.",
        effort: "medium",
        impact: "medium",
      });
    }

    // Check for missing caching opportunities
    const hasApiCalls = structure.files.some((f) => {
      // This is a simplified check - in real implementation would analyze file contents
      return f.path.includes("api") || f.path.includes("service");
    });

    if (hasApiCalls) {
      improvements.push({
        id: "implement-caching",
        category: "performance",
        priority: "medium",
        title: "Implement caching strategies",
        description:
          "Add caching for API responses and expensive computations to improve performance.",
        effort: "medium",
        impact: "medium",
      });
    }

    return improvements;
  }

  /**
   * Analyze security improvement opportunities
   */
  private analyzeSecurityImprovements(
    structure: ProjectStructure,
    issues: CodeIssue[]
  ): Recommendation[] {
    const improvements: Recommendation[] = [];

    // Check for security vulnerabilities
    const securityIssues = issues.filter(
      (issue) => issue.type === "vulnerability"
    );
    if (securityIssues.length > 0) {
      const criticalIssues = securityIssues.filter(
        (issue) => issue.severity === "critical"
      );
      const highIssues = securityIssues.filter(
        (issue) => issue.severity === "high"
      );

      if (criticalIssues.length > 0) {
        improvements.push({
          id: "fix-critical-vulnerabilities",
          category: "security",
          priority: "high",
          title: "Fix critical security vulnerabilities",
          description: `${criticalIssues.length} critical security vulnerabilities found. Address immediately.`,
          effort: "high",
          impact: "high",
        });
      }

      if (highIssues.length > 0) {
        improvements.push({
          id: "fix-high-vulnerabilities",
          category: "security",
          priority: "high",
          title: "Fix high-priority security vulnerabilities",
          description: `${highIssues.length} high-priority security vulnerabilities found.`,
          effort: "medium",
          impact: "high",
        });
      }
    }

    // Check for missing security headers (web projects)
    const hasWebFiles = structure.files.some(
      (f) =>
        f.language === "HTML" ||
        f.path.includes("server") ||
        f.path.includes("app")
    );

    if (hasWebFiles) {
      improvements.push({
        id: "security-headers",
        category: "security",
        priority: "medium",
        title: "Implement security headers",
        description:
          "Add security headers like CSP, HSTS, X-Frame-Options to protect against common attacks.",
        effort: "low",
        impact: "medium",
      });
    }

    // Check for input validation
    const hasUserInput = structure.files.some(
      (f) =>
        f.path.includes("form") ||
        f.path.includes("input") ||
        f.path.includes("api")
    );

    if (hasUserInput) {
      improvements.push({
        id: "input-validation",
        category: "security",
        priority: "high",
        title: "Implement comprehensive input validation",
        description:
          "Add proper input validation and sanitization for all user inputs.",
        effort: "medium",
        impact: "high",
      });
    }

    // Check for authentication/authorization
    const hasAuth = structure.files.some(
      (f) =>
        f.path.includes("auth") ||
        f.path.includes("login") ||
        f.path.includes("session")
    );

    if (!hasAuth && structure.files.some((f) => f.path.includes("api"))) {
      improvements.push({
        id: "implement-authentication",
        category: "security",
        priority: "high",
        title: "Implement authentication and authorization",
        description:
          "Add proper authentication and authorization mechanisms for API endpoints.",
        effort: "high",
        impact: "high",
      });
    }

    return improvements;
  }

  /**
   * Analyze maintainability improvement opportunities
   */
  private analyzeMaintainabilityImprovements(
    structure: ProjectStructure,
    issues: CodeIssue[]
  ): Recommendation[] {
    const improvements: Recommendation[] = [];

    // Check for code smells
    const codeSmells = issues.filter((issue) => issue.type === "code-smell");
    if (codeSmells.length > 10) {
      improvements.push({
        id: "refactor-code-smells",
        category: "maintainability",
        priority: "medium",
        title: "Refactor code smells",
        description: `${codeSmells.length} code smells detected. Focus on the most critical ones first.`,
        effort: "high",
        impact: "medium",
      });
    }

    // Check for large files
    const largeFiles = structure.files.filter((f) => f.lines > 500);
    if (largeFiles.length > 0) {
      improvements.push({
        id: "break-down-large-files",
        category: "maintainability",
        priority: "medium",
        title: "Break down large files",
        description: `${largeFiles.length} files are larger than 500 lines. Consider splitting them into smaller modules.`,
        effort: "medium",
        impact: "medium",
      });
    }

    // Check for consistent naming conventions
    improvements.push({
      id: "naming-conventions",
      category: "maintainability",
      priority: "low",
      title: "Establish consistent naming conventions",
      description:
        "Define and enforce consistent naming conventions across the codebase.",
      effort: "medium",
      impact: "low",
    });

    // Check for error handling
    const hasErrorHandling = structure.files.some(
      (f) => f.path.includes("error") || f.path.includes("exception")
    );

    if (!hasErrorHandling) {
      improvements.push({
        id: "error-handling",
        category: "maintainability",
        priority: "medium",
        title: "Implement comprehensive error handling",
        description:
          "Add proper error handling and logging throughout the application.",
        effort: "medium",
        impact: "medium",
      });
    }

    return improvements;
  }

  /**
   * Analyze architecture optimization opportunities
   */
  private analyzeArchitectureOptimizations(
    structure: ProjectStructure
  ): Recommendation[] {
    const optimizations: Recommendation[] = [];

    // Check for monolithic structure
    const rootFiles = structure.files.filter(
      (f) => !f.path.includes("/") && !f.path.includes("\\")
    );
    if (rootFiles.length > 15) {
      optimizations.push({
        id: "organize-file-structure",
        category: "architecture",
        priority: "medium",
        title: "Organize file structure",
        description:
          "Too many files in root directory. Organize into logical subdirectories.",
        effort: "medium",
        impact: "medium",
      });
    }

    // Check for separation of concerns
    const hasProperSeparation = structure.directories.some((d) =>
      ["models", "views", "controllers", "services", "components"].includes(
        path.basename(d.path).toLowerCase()
      )
    );

    if (!hasProperSeparation && structure.totalFiles > 20) {
      optimizations.push({
        id: "separation-of-concerns",
        category: "architecture",
        priority: "medium",
        title: "Improve separation of concerns",
        description:
          "Organize code into clear layers (models, views, controllers, services).",
        effort: "high",
        impact: "high",
      });
    }

    // Check for configuration management
    const hasConfig = structure.files.some(
      (f) =>
        f.path.includes("config") ||
        f.path.includes("settings") ||
        f.path.includes(".env")
    );

    if (!hasConfig) {
      optimizations.push({
        id: "configuration-management",
        category: "architecture",
        priority: "medium",
        title: "Implement configuration management",
        description:
          "Add proper configuration management for different environments.",
        effort: "low",
        impact: "medium",
      });
    }

    return optimizations;
  }

  /**
   * Analyze dependency optimization opportunities
   */
  private analyzeDependencyOptimizations(
    structure: ProjectStructure
  ): Recommendation[] {
    const optimizations: Recommendation[] = [];

    // Check for package.json
    const hasPackageJson = structure.files.some((f) =>
      f.path.includes("package.json")
    );

    if (hasPackageJson) {
      optimizations.push({
        id: "dependency-audit",
        category: "maintainability",
        priority: "medium",
        title: "Regular dependency audits",
        description:
          "Regularly audit and update dependencies to latest secure versions.",
        effort: "low",
        impact: "medium",
      });

      optimizations.push({
        id: "unused-dependencies",
        category: "performance",
        priority: "low",
        title: "Remove unused dependencies",
        description:
          "Identify and remove unused dependencies to reduce bundle size.",
        effort: "low",
        impact: "low",
      });
    }

    // Check for lock files
    const hasLockFile = structure.files.some(
      (f) =>
        f.path.includes("package-lock.json") ||
        f.path.includes("yarn.lock") ||
        f.path.includes("pnpm-lock.yaml")
    );

    if (hasPackageJson && !hasLockFile) {
      optimizations.push({
        id: "dependency-locking",
        category: "maintainability",
        priority: "medium",
        title: "Use dependency lock files",
        description:
          "Add lock files to ensure consistent dependency versions across environments.",
        effort: "low",
        impact: "medium",
      });
    }

    return optimizations;
  }

  /**
   * Analyze testing improvement opportunities
   */
  private analyzeTestingImprovements(
    structure: ProjectStructure
  ): Recommendation[] {
    const improvements: Recommendation[] = [];

    // Check for test files
    const testFiles = structure.files.filter(
      (f) =>
        f.path.includes("test") ||
        f.path.includes("spec") ||
        f.path.includes("__tests__") ||
        f.path.endsWith(".test.js") ||
        f.path.endsWith(".test.ts") ||
        f.path.endsWith(".spec.js") ||
        f.path.endsWith(".spec.ts")
    );

    const codeFiles = structure.files.filter(
      (f) =>
        f.language === "JavaScript" ||
        f.language === "TypeScript" ||
        f.language === "Python" ||
        f.language === "Java"
    );

    const testCoverage =
      codeFiles.length > 0 ? (testFiles.length / codeFiles.length) * 100 : 0;

    if (testCoverage < 30) {
      improvements.push({
        id: "increase-test-coverage",
        category: "maintainability",
        priority: "high",
        title: "Increase test coverage",
        description: `Test coverage is low (${Math.round(testCoverage)}%). Add unit and integration tests.`,
        effort: "high",
        impact: "high",
      });
    }

    // Check for test configuration
    const hasTestConfig = structure.files.some(
      (f) =>
        f.path.includes("jest.config") ||
        f.path.includes("vitest.config") ||
        f.path.includes("karma.conf") ||
        f.path.includes("mocha.opts")
    );

    if (testFiles.length > 0 && !hasTestConfig) {
      improvements.push({
        id: "test-configuration",
        category: "maintainability",
        priority: "medium",
        title: "Add test configuration",
        description:
          "Set up proper test configuration and scripts for consistent testing.",
        effort: "low",
        impact: "medium",
      });
    }

    // Check for E2E tests
    const hasE2ETests = structure.files.some(
      (f) =>
        f.path.includes("e2e") ||
        f.path.includes("integration") ||
        f.path.includes("cypress") ||
        f.path.includes("playwright")
    );

    if (
      !hasE2ETests &&
      structure.files.some(
        (f) => f.language === "HTML" || f.path.includes("app")
      )
    ) {
      improvements.push({
        id: "e2e-testing",
        category: "maintainability",
        priority: "medium",
        title: "Add end-to-end testing",
        description:
          "Implement E2E tests to ensure application works correctly from user perspective.",
        effort: "medium",
        impact: "medium",
      });
    }

    return improvements;
  }
}
