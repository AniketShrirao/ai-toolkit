import { promises as fs } from "fs";
import * as path from "path";
import {
  ProjectStructure,
  FileInfo,
  CodeIssue,
} from "@ai-toolkit/shared/types/analysis.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import { CodebaseAnalyzerOptions } from "../CodebaseAnalyzer.js";

export class CodeQualityAnalyzer {
  private ollamaService: OllamaService;

  constructor(ollamaService: OllamaService) {
    this.ollamaService = ollamaService;
  }

  /**
   * Analyze code quality and identify issues
   */
  async analyzeCodeQuality(
    structure: ProjectStructure,
    options: Required<CodebaseAnalyzerOptions>
  ): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    // Get code files only
    const codeFiles = structure.files.filter((file) =>
      this.isAnalyzableFile(file)
    );

    // Analyze each file for quality issues
    for (const file of codeFiles) {
      try {
        const fileIssues = await this.analyzeFile(
          path.join(structure.rootPath, file.path),
          file,
          options
        );
        issues.push(...fileIssues);
      } catch (error) {
        // Log error but continue with other files
        console.warn(`Failed to analyze file ${file.path}:`, error);
      }
    }

    // Analyze project-level issues
    const projectIssues = this.analyzeProjectStructure(structure);
    issues.push(...projectIssues);

    return issues.sort((a, b) => {
      // Sort by severity (critical first)
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Analyze a single file for quality issues
   */
  private async analyzeFile(
    filePath: string,
    fileInfo: FileInfo,
    options: Required<CodebaseAnalyzerOptions>
  ): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    try {
      const content = await fs.readFile(filePath, "utf-8");

      // Static analysis checks
      issues.push(...this.checkFileSize(fileInfo));
      issues.push(...this.checkComplexity(fileInfo, content));
      issues.push(...this.checkCodeSmells(fileInfo, content));
      issues.push(...this.checkSecurityIssues(fileInfo, content));
      issues.push(...this.checkPerformanceIssues(fileInfo, content));

      // Language-specific checks
      if (
        fileInfo.language === "JavaScript" ||
        fileInfo.language === "TypeScript"
      ) {
        issues.push(...this.checkJavaScriptIssues(fileInfo, content));
      } else if (fileInfo.language === "Python") {
        issues.push(...this.checkPythonIssues(fileInfo, content));
      }
    } catch (error) {
      // File reading error
      issues.push({
        id: `file-read-error-${fileInfo.path}`,
        type: "bug",
        severity: "low",
        file: fileInfo.path,
        description: "Unable to read file for analysis",
        suggestion: "Check file permissions and encoding",
      });
    }

    return issues;
  }

  /**
   * Check file size issues
   */
  private checkFileSize(fileInfo: FileInfo): CodeIssue[] {
    const issues: CodeIssue[] = [];

    if (fileInfo.lines > 1000) {
      issues.push({
        id: `large-file-${fileInfo.path}`,
        type: "code-smell",
        severity: "medium",
        file: fileInfo.path,
        description: `File is very large (${fileInfo.lines} lines)`,
        suggestion:
          "Consider breaking this file into smaller, more focused modules",
      });
    } else if (fileInfo.lines > 500) {
      issues.push({
        id: `medium-file-${fileInfo.path}`,
        type: "code-smell",
        severity: "low",
        file: fileInfo.path,
        description: `File is moderately large (${fileInfo.lines} lines)`,
        suggestion: "Consider refactoring into smaller functions or classes",
      });
    }

    return issues;
  }

  /**
   * Check complexity issues
   */
  private checkComplexity(fileInfo: FileInfo, content: string): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Simple complexity heuristics
    const cyclomaticComplexity = this.calculateCyclomaticComplexity(content);

    if (cyclomaticComplexity > 15) {
      issues.push({
        id: `high-complexity-${fileInfo.path}`,
        type: "code-smell",
        severity: "high",
        file: fileInfo.path,
        description: `High cyclomatic complexity (${cyclomaticComplexity})`,
        suggestion:
          "Break down complex functions into smaller, more manageable pieces",
      });
    } else if (cyclomaticComplexity > 10) {
      issues.push({
        id: `medium-complexity-${fileInfo.path}`,
        type: "code-smell",
        severity: "medium",
        file: fileInfo.path,
        description: `Moderate cyclomatic complexity (${cyclomaticComplexity})`,
        suggestion: "Consider refactoring to reduce complexity",
      });
    }

    return issues;
  }

  /**
   * Check for code smells
   */
  private checkCodeSmells(fileInfo: FileInfo, content: string): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Long parameter lists
    const longParameterMatches = content.match(
      /function\s+\w+\s*\([^)]{100,}\)/g
    );
    if (longParameterMatches) {
      issues.push({
        id: `long-parameters-${fileInfo.path}`,
        type: "code-smell",
        severity: "medium",
        file: fileInfo.path,
        description: "Functions with long parameter lists detected",
        suggestion: "Consider using parameter objects or builder pattern",
      });
    }

    // Duplicate code patterns
    const duplicateLines = this.findDuplicateLines(content);
    if (duplicateLines > 10) {
      issues.push({
        id: `duplicate-code-${fileInfo.path}`,
        type: "code-smell",
        severity: "medium",
        file: fileInfo.path,
        description: `${duplicateLines} duplicate lines detected`,
        suggestion: "Extract common code into reusable functions or modules",
      });
    }

    // TODO comments (technical debt)
    const todoMatches = content.match(/\/\/\s*TODO|\/\*\s*TODO|\#\s*TODO/gi);
    if (todoMatches && todoMatches.length > 5) {
      issues.push({
        id: `many-todos-${fileInfo.path}`,
        type: "code-smell",
        severity: "low",
        file: fileInfo.path,
        description: `${todoMatches.length} TODO comments found`,
        suggestion:
          "Address TODO items or convert them to proper issue tracking",
      });
    }

    // Magic numbers
    const magicNumbers = content.match(/\b\d{2,}\b/g);
    if (magicNumbers && magicNumbers.length > 10) {
      issues.push({
        id: `magic-numbers-${fileInfo.path}`,
        type: "code-smell",
        severity: "low",
        file: fileInfo.path,
        description: "Multiple magic numbers detected",
        suggestion: "Replace magic numbers with named constants",
      });
    }

    return issues;
  }

  /**
   * Check for security issues
   */
  private checkSecurityIssues(
    fileInfo: FileInfo,
    content: string
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Hardcoded secrets patterns
    const secretPatterns = [
      {
        pattern: /password\s*=\s*["'][^"']+["']/gi,
        name: "hardcoded password",
      },
      {
        pattern: /api[_-]?key\s*=\s*["'][^"']+["']/gi,
        name: "hardcoded API key",
      },
      { pattern: /secret\s*=\s*["'][^"']+["']/gi, name: "hardcoded secret" },
      { pattern: /token\s*=\s*["'][^"']+["']/gi, name: "hardcoded token" },
    ];

    for (const { pattern, name } of secretPatterns) {
      if (pattern.test(content)) {
        issues.push({
          id: `security-${name.replace(/\s+/g, "-")}-${fileInfo.path}`,
          type: "vulnerability",
          severity: "high",
          file: fileInfo.path,
          description: `Potential ${name} detected`,
          suggestion:
            "Move sensitive data to environment variables or secure configuration",
        });
      }
    }

    // SQL injection patterns
    if (
      content.includes("SELECT") ||
      content.includes("INSERT") ||
      content.includes("UPDATE")
    ) {
      const sqlInjectionPatterns = [
        /["']\s*\+\s*\w+\s*\+\s*["']/g, // String concatenation in SQL
        /\$\{[^}]+\}/g, // Template literals in SQL
      ];

      for (const pattern of sqlInjectionPatterns) {
        if (pattern.test(content)) {
          issues.push({
            id: `sql-injection-${fileInfo.path}`,
            type: "vulnerability",
            severity: "critical",
            file: fileInfo.path,
            description: "Potential SQL injection vulnerability",
            suggestion: "Use parameterized queries or prepared statements",
          });
          break;
        }
      }
    }

    // XSS patterns
    if (
      fileInfo.language === "JavaScript" ||
      fileInfo.language === "TypeScript"
    ) {
      const xssPatterns = [
        /innerHTML\s*=\s*[^;]+/g,
        /document\.write\s*\(/g,
        /eval\s*\(/g,
      ];

      for (const pattern of xssPatterns) {
        if (pattern.test(content)) {
          issues.push({
            id: `xss-vulnerability-${fileInfo.path}`,
            type: "vulnerability",
            severity: "high",
            file: fileInfo.path,
            description: "Potential XSS vulnerability",
            suggestion: "Sanitize user input and avoid direct DOM manipulation",
          });
          break;
        }
      }
    }

    return issues;
  }

  /**
   * Check for performance issues
   */
  private checkPerformanceIssues(
    fileInfo: FileInfo,
    content: string
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Nested loops
    const nestedLoopPattern = /for\s*\([^}]*\{[^}]*for\s*\(/g;
    if (nestedLoopPattern.test(content)) {
      issues.push({
        id: `nested-loops-${fileInfo.path}`,
        type: "performance",
        severity: "medium",
        file: fileInfo.path,
        description: "Nested loops detected",
        suggestion:
          "Consider optimizing algorithm complexity or using more efficient data structures",
      });
    }

    // Synchronous file operations
    if (
      fileInfo.language === "JavaScript" ||
      fileInfo.language === "TypeScript"
    ) {
      const syncOperations = [
        "readFileSync",
        "writeFileSync",
        "existsSync",
        "statSync",
      ];

      for (const operation of syncOperations) {
        if (content.includes(operation)) {
          issues.push({
            id: `sync-operation-${fileInfo.path}`,
            type: "performance",
            severity: "medium",
            file: fileInfo.path,
            description: `Synchronous operation ${operation} detected`,
            suggestion:
              "Use asynchronous alternatives to avoid blocking the event loop",
          });
          break;
        }
      }
    }

    return issues;
  }

  /**
   * JavaScript/TypeScript specific checks
   */
  private checkJavaScriptIssues(
    fileInfo: FileInfo,
    content: string
  ): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Console.log statements (should not be in production)
    const consoleMatches = content.match(
      /console\.(log|debug|info|warn|error)/g
    );
    if (consoleMatches && consoleMatches.length > 3) {
      issues.push({
        id: `console-statements-${fileInfo.path}`,
        type: "code-smell",
        severity: "low",
        file: fileInfo.path,
        description: `${consoleMatches.length} console statements found`,
        suggestion: "Remove console statements or replace with proper logging",
      });
    }

    // Var usage (prefer let/const)
    if (content.includes("var ")) {
      issues.push({
        id: `var-usage-${fileInfo.path}`,
        type: "code-smell",
        severity: "low",
        file: fileInfo.path,
        description: "Usage of var keyword detected",
        suggestion: "Use let or const instead of var for better scoping",
      });
    }

    // == usage (prefer ===)
    const looseEqualityMatches = content.match(/[^=!]==[^=]/g);
    if (looseEqualityMatches && looseEqualityMatches.length > 0) {
      issues.push({
        id: `loose-equality-${fileInfo.path}`,
        type: "code-smell",
        severity: "low",
        file: fileInfo.path,
        description: "Loose equality (==) usage detected",
        suggestion:
          "Use strict equality (===) for more predictable comparisons",
      });
    }

    return issues;
  }

  /**
   * Python specific checks
   */
  private checkPythonIssues(fileInfo: FileInfo, content: string): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Import * usage
    if (content.includes("from ") && content.includes(" import *")) {
      issues.push({
        id: `wildcard-import-${fileInfo.path}`,
        type: "code-smell",
        severity: "medium",
        file: fileInfo.path,
        description: "Wildcard imports detected",
        suggestion: "Use specific imports to avoid namespace pollution",
      });
    }

    // Global variables
    const globalMatches = content.match(/^global\s+\w+/gm);
    if (globalMatches && globalMatches.length > 0) {
      issues.push({
        id: `global-variables-${fileInfo.path}`,
        type: "code-smell",
        severity: "medium",
        file: fileInfo.path,
        description: "Global variables detected",
        suggestion:
          "Minimize global variable usage and prefer function parameters",
      });
    }

    return issues;
  }

  /**
   * Analyze project-level structure issues
   */
  private analyzeProjectStructure(structure: ProjectStructure): CodeIssue[] {
    const issues: CodeIssue[] = [];

    // Too many files in root directory
    const rootFiles = structure.files.filter(
      (f) => !f.path.includes("/") && !f.path.includes("\\")
    );
    if (rootFiles.length > 15) {
      issues.push({
        id: "too-many-root-files",
        type: "code-smell",
        severity: "medium",
        file: ".",
        description: `Too many files in root directory (${rootFiles.length})`,
        suggestion: "Organize files into appropriate subdirectories",
      });
    }

    // Missing important files
    const importantFiles = ["README.md", "package.json", ".gitignore"];
    for (const fileName of importantFiles) {
      const hasFile = structure.files.some(
        (f) => path.basename(f.path).toLowerCase() === fileName.toLowerCase()
      );

      if (!hasFile) {
        issues.push({
          id: `missing-${fileName}`,
          type: "code-smell",
          severity: "low",
          file: ".",
          description: `Missing ${fileName} file`,
          suggestion: `Add ${fileName} file for better project documentation and configuration`,
        });
      }
    }

    return issues;
  }

  // Helper methods
  private isAnalyzableFile(file: FileInfo): boolean {
    const analyzableExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".py",
      ".java",
      ".cpp",
      ".c",
      ".cs",
      ".php",
      ".rb",
      ".go",
      ".rs",
      ".swift",
      ".kt",
      ".scala",
    ];

    const ext = path.extname(file.path).toLowerCase();
    return analyzableExtensions.includes(ext) && file.size < 1024 * 1024; // Max 1MB
  }

  private calculateCyclomaticComplexity(content: string): number {
    // Simple heuristic: count decision points
    const decisionPoints = [
      /\bif\b/g,
      /\belse\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b&&\b/g,
      /\b\|\|\b/g,
      /\?\s*:/g, // Ternary operator
    ];

    let complexity = 1; // Base complexity
    for (const pattern of decisionPoints) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private findDuplicateLines(content: string): number {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 10 && !line.startsWith("//") && !line.startsWith("*")
      );

    const lineCount = new Map<string, number>();
    let duplicates = 0;

    for (const line of lines) {
      const count = lineCount.get(line) || 0;
      lineCount.set(line, count + 1);
      if (count === 1) {
        duplicates += 2; // First duplicate adds 2 (original + duplicate)
      } else if (count > 1) {
        duplicates += 1; // Additional duplicates add 1 each
      }
    }

    return duplicates;
  }
}
