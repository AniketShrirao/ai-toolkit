import { promises as fs } from "fs";
import * as path from "path";
import { glob } from "glob";
import ignore from "ignore";
import {
  CodebaseAnalysis,
  ProjectStructure,
  DirectoryInfo,
  FileInfo,
  LanguageStats,
  Dependency,
  CodeMetrics,
  CodeIssue,
  DocumentationGap,
  Recommendation,
} from "@ai-toolkit/shared/types/analysis.js";
import { AnalysisType } from "@ai-toolkit/shared/types/common.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";
import { DependencyAnalyzer } from "./analyzers/DependencyAnalyzer";
import { ArchitectureDetector } from "./analyzers/ArchitectureDetector";
import { CodeQualityAnalyzer } from "./analyzers/CodeQualityAnalyzer";
import { CircularDependencyDetector } from "./analyzers/CircularDependencyDetector";
import { DocumentationAnalyzer } from "./analyzers/DocumentationAnalyzer.js";
import { ImprovementAnalyzer } from "./analyzers/ImprovementAnalyzer.js";

export interface CodebaseAnalyzerOptions {
  includeTests?: boolean;
  includeNodeModules?: boolean;
  maxFileSize?: number; // in bytes
  excludePatterns?: string[];
  analysisDepth?: "basic" | "detailed" | "comprehensive";
}

export class CodebaseAnalyzer {
  private ollamaService: OllamaService;
  private dependencyAnalyzer: DependencyAnalyzer;
  private architectureDetector: ArchitectureDetector;
  private codeQualityAnalyzer: CodeQualityAnalyzer;
  private circularDependencyDetector: CircularDependencyDetector;
  private documentationAnalyzer: DocumentationAnalyzer;
  private improvementAnalyzer: ImprovementAnalyzer;

  constructor(ollamaService: OllamaService) {
    this.ollamaService = ollamaService;
    this.dependencyAnalyzer = new DependencyAnalyzer();
    this.architectureDetector = new ArchitectureDetector(ollamaService);
    this.codeQualityAnalyzer = new CodeQualityAnalyzer(ollamaService);
    this.circularDependencyDetector = new CircularDependencyDetector();
    this.documentationAnalyzer = new DocumentationAnalyzer(ollamaService);
    this.improvementAnalyzer = new ImprovementAnalyzer(ollamaService);
  }

  /**
   * Analyze a complete codebase and return comprehensive analysis
   */
  async analyzeCodebase(
    rootPath: string,
    options: CodebaseAnalyzerOptions = {}
  ): Promise<CodebaseAnalysis> {
    const defaultOptions: Required<CodebaseAnalyzerOptions> = {
      includeTests: true,
      includeNodeModules: false,
      maxFileSize: 1024 * 1024, // 1MB
      excludePatterns: [".git", "node_modules", "dist", "build", ".next"],
      analysisDepth: "detailed",
    };

    const config = { ...defaultOptions, ...options };

    try {
      // 1. Analyze project structure
      const structure = await this.analyzeProjectStructure(rootPath, config);

      // 2. Analyze dependencies
      const dependencies =
        await this.dependencyAnalyzer.analyzeDependencies(rootPath);

      // 3. Calculate code metrics
      const metrics = await this.calculateCodeMetrics(structure, config);

      // 4. Detect architecture patterns
      const architectureInfo =
        await this.architectureDetector.detectArchitecture(structure);

      // 5. Analyze code quality and find issues
      const issues = await this.codeQualityAnalyzer.analyzeCodeQuality(
        structure,
        config
      );

      // 6. Detect circular dependencies
      const circularDeps =
        await this.circularDependencyDetector.detectCircularDependencies(
          structure
        );

      // 7. Generate recommendations
      const recommendations = await this.generateRecommendations(
        structure,
        dependencies,
        metrics,
        issues,
        architectureInfo
      );

      // 8. Analyze documentation gaps
      const documentationAnalysis =
        await this.documentationAnalyzer.analyzeDocumentation(structure);

      // 9. Analyze improvement opportunities
      const improvementAnalysis =
        await this.improvementAnalyzer.analyzeImprovements(structure, [
          ...issues,
          ...circularDeps,
        ]);

      // 10. Combine all recommendations
      const allRecommendations = [
        ...recommendations,
        ...documentationAnalysis.recommendations,
        ...improvementAnalysis.recommendations,
        ...improvementAnalysis.optimizations,
        ...improvementAnalysis.securityImprovements,
        ...improvementAnalysis.performanceImprovements,
      ];

      return {
        structure,
        dependencies,
        metrics,
        issues: [...issues, ...circularDeps],
        documentation: documentationAnalysis.gaps,
        recommendations: allRecommendations,
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze codebase: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Analyze project structure and map directories/files
   */
  private async analyzeProjectStructure(
    rootPath: string,
    options: Required<CodebaseAnalyzerOptions>
  ): Promise<ProjectStructure> {
    const ig = ignore().add(options.excludePatterns);

    // Get all files
    const pattern = path.join(rootPath, "**/*").replace(/\\/g, "/");
    const allFiles = await glob(pattern, {
      dot: true,
      nodir: true,
      ignore: options.excludePatterns.map((p) => `**/${p}/**`),
    });

    const filteredFiles = allFiles.filter((file: string) => {
      const relativePath = path.relative(rootPath, file);
      return !ig.ignores(relativePath);
    });

    // Process files and directories
    const files: FileInfo[] = [];
    const directoryMap = new Map<string, DirectoryInfo>();
    const languageStats = new Map<string, { files: number; lines: number }>();

    let totalLines = 0;

    for (const filePath of filteredFiles) {
      try {
        const stats = await fs.stat(filePath);

        // Skip files that are too large
        if (stats.size > options.maxFileSize) {
          continue;
        }

        const relativePath = path.relative(rootPath, filePath);
        const language = this.detectLanguage(filePath);
        const lines = await this.countLines(filePath);

        const fileInfo: FileInfo = {
          path: relativePath,
          size: stats.size,
          lines,
          language,
          lastModified: stats.mtime,
        };

        files.push(fileInfo);
        totalLines += lines;

        // Update language stats
        const langStat = languageStats.get(language) || { files: 0, lines: 0 };
        langStat.files++;
        langStat.lines += lines;
        languageStats.set(language, langStat);

        // Update directory info
        const dirPath = path.dirname(relativePath);
        if (dirPath !== ".") {
          const dirInfo = directoryMap.get(dirPath) || {
            path: dirPath,
            fileCount: 0,
            subdirectories: 0,
          };
          dirInfo.fileCount++;
          directoryMap.set(dirPath, dirInfo);
        }
      } catch (error) {
        // Skip files that can't be processed
        continue;
      }
    }

    // Convert language stats to array
    const languages: LanguageStats[] = Array.from(languageStats.entries())
      .map(([language, stats]) => ({
        language,
        files: stats.files,
        lines: stats.lines,
        percentage: totalLines > 0 ? (stats.lines / totalLines) * 100 : 0,
      }))
      .sort((a, b) => b.lines - a.lines);

    // Convert directory map to array and detect purposes
    const directories: DirectoryInfo[] = Array.from(directoryMap.values()).map(
      (dir) => ({
        ...dir,
        subdirectories: this.countSubdirectories(dir.path, directoryMap),
        purpose: this.detectDirectoryPurpose(dir.path),
      })
    );

    return {
      rootPath,
      directories,
      files,
      totalFiles: files.length,
      totalLines,
      languages,
    };
  }

  /**
   * Calculate comprehensive code metrics
   */
  private async calculateCodeMetrics(
    structure: ProjectStructure,
    options: Required<CodebaseAnalyzerOptions>
  ): Promise<CodeMetrics> {
    let totalComplexity = 0;
    let maintainabilityScore = 0;
    let duplicateCodePercentage = 0;
    let technicalDebtScore = 0;

    const codeFiles = structure.files.filter((file) =>
      this.isCodeFile(file.language)
    );

    if (codeFiles.length === 0) {
      return {
        complexity: 0,
        maintainability: 100,
        duplicateCode: 0,
        technicalDebt: 0,
      };
    }

    // Calculate average complexity based on file sizes and types
    for (const file of codeFiles) {
      const fileComplexity = this.estimateFileComplexity(file);
      totalComplexity += fileComplexity;
    }

    const avgComplexity = totalComplexity / codeFiles.length;

    // Estimate maintainability based on structure and patterns
    maintainabilityScore = this.calculateMaintainabilityScore(structure);

    // Estimate duplicate code (simplified heuristic)
    duplicateCodePercentage = this.estimateDuplicateCode(structure);

    // Calculate technical debt score
    technicalDebtScore = this.calculateTechnicalDebt(structure, avgComplexity);

    return {
      complexity: Math.round(avgComplexity * 10) / 10,
      maintainability: Math.round(maintainabilityScore),
      duplicateCode: Math.round(duplicateCodePercentage * 10) / 10,
      technicalDebt: Math.round(technicalDebtScore),
    };
  }

  /**
   * Generate recommendations based on analysis results
   */
  private async generateRecommendations(
    structure: ProjectStructure,
    dependencies: Dependency[],
    metrics: CodeMetrics,
    issues: CodeIssue[],
    architectureInfo: any
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Architecture recommendations
    if (architectureInfo.patterns.length === 0) {
      recommendations.push({
        id: "arch-pattern-missing",
        category: "architecture",
        priority: "medium",
        title: "Consider adopting a clear architecture pattern",
        description:
          "No clear architecture pattern detected. Consider implementing MVC, layered architecture, or microservices pattern.",
        effort: "high",
        impact: "high",
      });
    }

    // Complexity recommendations
    if (metrics.complexity > 7) {
      recommendations.push({
        id: "high-complexity",
        category: "maintainability",
        priority: "high",
        title: "Reduce code complexity",
        description: `Average complexity score of ${metrics.complexity} is high. Consider refactoring complex functions and classes.`,
        effort: "medium",
        impact: "high",
      });
    }

    // Maintainability recommendations
    if (metrics.maintainability < 60) {
      recommendations.push({
        id: "low-maintainability",
        category: "maintainability",
        priority: "high",
        title: "Improve code maintainability",
        description:
          "Low maintainability score detected. Focus on code organization, naming conventions, and documentation.",
        effort: "high",
        impact: "high",
      });
    }

    // Dependency recommendations
    const outdatedDeps = dependencies.filter((dep) => dep.outdated);
    if (outdatedDeps.length > 0) {
      recommendations.push({
        id: "outdated-dependencies",
        category: "security",
        priority: "medium",
        title: "Update outdated dependencies",
        description: `${outdatedDeps.length} outdated dependencies found. Consider updating to latest versions.`,
        effort: "low",
        impact: "medium",
      });
    }

    // Security recommendations
    const securityIssues = issues.filter(
      (issue) => issue.type === "vulnerability"
    );
    if (securityIssues.length > 0) {
      recommendations.push({
        id: "security-vulnerabilities",
        category: "security",
        priority: "high",
        title: "Address security vulnerabilities",
        description: `${securityIssues.length} security vulnerabilities found. Review and fix critical issues.`,
        effort: "medium",
        impact: "high",
      });
    }

    return recommendations;
  }

  // Helper methods
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      ".js": "JavaScript",
      ".jsx": "JavaScript",
      ".ts": "TypeScript",
      ".tsx": "TypeScript",
      ".py": "Python",
      ".java": "Java",
      ".cpp": "C++",
      ".c": "C",
      ".cs": "C#",
      ".php": "PHP",
      ".rb": "Ruby",
      ".go": "Go",
      ".rs": "Rust",
      ".swift": "Swift",
      ".kt": "Kotlin",
      ".scala": "Scala",
      ".html": "HTML",
      ".css": "CSS",
      ".scss": "SCSS",
      ".less": "LESS",
      ".json": "JSON",
      ".xml": "XML",
      ".yaml": "YAML",
      ".yml": "YAML",
      ".md": "Markdown",
      ".sql": "SQL",
      ".sh": "Shell",
      ".bat": "Batch",
      ".ps1": "PowerShell",
    };

    return languageMap[ext] || "Unknown";
  }

  private async countLines(filePath: string): Promise<number> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return content.split("\n").length;
    } catch {
      return 0;
    }
  }

  private countSubdirectories(
    dirPath: string,
    directoryMap: Map<string, DirectoryInfo>
  ): number {
    let count = 0;
    for (const [path] of directoryMap) {
      if (path.startsWith(dirPath + "/") && path !== dirPath) {
        const relativePath = path.substring(dirPath.length + 1);
        if (!relativePath.includes("/")) {
          count++;
        }
      }
    }
    return count;
  }

  private detectDirectoryPurpose(dirPath: string): string | undefined {
    const dirName = path.basename(dirPath).toLowerCase();
    const purposeMap: Record<string, string> = {
      src: "Source code",
      lib: "Library code",
      test: "Tests",
      tests: "Tests",
      __tests__: "Tests",
      spec: "Tests",
      docs: "Documentation",
      doc: "Documentation",
      config: "Configuration",
      configs: "Configuration",
      utils: "Utilities",
      helpers: "Helper functions",
      components: "UI Components",
      services: "Services",
      models: "Data models",
      controllers: "Controllers",
      views: "Views",
      routes: "Routing",
      middleware: "Middleware",
      assets: "Static assets",
      public: "Public files",
      static: "Static files",
      build: "Build output",
      dist: "Distribution files",
    };

    return purposeMap[dirName];
  }

  private isCodeFile(language: string): boolean {
    const codeLanguages = [
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "C++",
      "C",
      "C#",
      "PHP",
      "Ruby",
      "Go",
      "Rust",
      "Swift",
      "Kotlin",
      "Scala",
    ];
    return codeLanguages.includes(language);
  }

  private estimateFileComplexity(file: FileInfo): number {
    // Simple heuristic based on file size and type
    let baseComplexity = Math.min(file.lines / 100, 10); // Max 10 for very large files

    // Adjust based on language
    const complexityMultipliers: Record<string, number> = {
      JavaScript: 1.2,
      TypeScript: 1.0,
      Python: 0.8,
      Java: 1.3,
      "C++": 1.5,
      C: 1.4,
    };

    const multiplier = complexityMultipliers[file.language] || 1.0;
    return baseComplexity * multiplier;
  }

  private calculateMaintainabilityScore(structure: ProjectStructure): number {
    let score = 100;

    // Penalize for too many files in root
    const rootFiles = structure.files.filter((f) => !f.path.includes("/"));
    if (rootFiles.length > 10) {
      score -= (rootFiles.length - 10) * 2;
    }

    // Reward for good directory structure
    const hasGoodStructure = structure.directories.some((d) =>
      ["src", "lib", "components", "services"].includes(path.basename(d.path))
    );
    if (hasGoodStructure) {
      score += 10;
    }

    // Penalize for very large files
    const largeFiles = structure.files.filter((f) => f.lines > 500);
    score -= largeFiles.length * 5;

    // Reward for test presence
    const hasTests = structure.directories.some((d) =>
      ["test", "tests", "__tests__", "spec"].includes(path.basename(d.path))
    );
    if (hasTests) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  private estimateDuplicateCode(structure: ProjectStructure): number {
    // Simple heuristic: estimate based on file patterns and sizes
    const codeFiles = structure.files.filter((f) =>
      this.isCodeFile(f.language)
    );
    if (codeFiles.length < 2) return 0;

    // Look for files with similar names (potential duplicates)
    const fileNames = codeFiles.map((f) =>
      path.basename(f.path, path.extname(f.path))
    );
    const duplicateNames = fileNames.filter(
      (name, index) => fileNames.indexOf(name) !== index
    );

    // Estimate duplicate percentage based on similar file names and sizes
    return Math.min((duplicateNames.length / codeFiles.length) * 100, 30);
  }

  private calculateTechnicalDebt(
    structure: ProjectStructure,
    avgComplexity: number
  ): number {
    let debtScore = 0;

    // High complexity contributes to technical debt
    debtScore += Math.max(0, (avgComplexity - 5) * 10);

    // Large files contribute to technical debt
    const largeFiles = structure.files.filter((f) => f.lines > 300);
    debtScore += largeFiles.length * 5;

    // Poor directory structure contributes to technical debt
    const rootFiles = structure.files.filter((f) => !f.path.includes("/"));
    if (rootFiles.length > 5) {
      debtScore += (rootFiles.length - 5) * 3;
    }

    return Math.min(100, debtScore);
  }
}
