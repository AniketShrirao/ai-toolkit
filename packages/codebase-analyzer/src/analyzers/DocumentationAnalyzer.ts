import { promises as fs } from "fs";
import * as path from "path";
import {
  ProjectStructure,
  FileInfo,
  DocumentationGap,
  Recommendation,
} from "@ai-toolkit/shared/types/analysis.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";

export interface DocumentationAnalysis {
  gaps: DocumentationGap[];
  coverage: number;
  recommendations: Recommendation[];
}

export class DocumentationAnalyzer {
  private ollamaService: OllamaService;

  constructor(ollamaService: OllamaService) {
    this.ollamaService = ollamaService;
  }

  /**
   * Analyze documentation gaps in the codebase
   */
  async analyzeDocumentation(
    structure: ProjectStructure
  ): Promise<DocumentationAnalysis> {
    const gaps: DocumentationGap[] = [];
    const recommendations: Recommendation[] = [];

    // Analyze project-level documentation
    gaps.push(...this.analyzeProjectDocumentation(structure));

    // Analyze code documentation
    gaps.push(...(await this.analyzeCodeDocumentation(structure)));

    // Analyze API documentation
    gaps.push(...this.analyzeAPIDocumentation(structure));

    // Calculate coverage
    const coverage = this.calculateDocumentationCoverage(structure, gaps);

    // Generate recommendations
    recommendations.push(
      ...this.generateDocumentationRecommendations(gaps, coverage)
    );

    return {
      gaps,
      coverage,
      recommendations,
    };
  }

  /**
   * Analyze project-level documentation (README, CHANGELOG, etc.)
   */
  private analyzeProjectDocumentation(
    structure: ProjectStructure
  ): DocumentationGap[] {
    const gaps: DocumentationGap[] = [];
    const rootFiles = structure.files.filter(
      (f) => !f.path.includes("/") && !f.path.includes("\\")
    );

    // Check for README
    const hasReadme = rootFiles.some((f) =>
      f.path.toLowerCase().startsWith("readme")
    );
    if (!hasReadme) {
      gaps.push({
        type: "missing",
        file: ".",
        description: "Missing README file",
        priority: "high",
      });
    }

    // Check for CHANGELOG
    const hasChangelog = rootFiles.some(
      (f) =>
        f.path.toLowerCase().includes("changelog") ||
        f.path.toLowerCase().includes("history")
    );
    if (!hasChangelog) {
      gaps.push({
        type: "missing",
        file: ".",
        description: "Missing CHANGELOG file",
        priority: "medium",
      });
    }

    // Check for CONTRIBUTING guide
    const hasContributing = rootFiles.some((f) =>
      f.path.toLowerCase().includes("contributing")
    );
    if (!hasContributing) {
      gaps.push({
        type: "missing",
        file: ".",
        description: "Missing CONTRIBUTING guide",
        priority: "medium",
      });
    }

    // Check for LICENSE
    const hasLicense = rootFiles.some(
      (f) =>
        f.path.toLowerCase().includes("license") ||
        f.path.toLowerCase().includes("licence")
    );
    if (!hasLicense) {
      gaps.push({
        type: "missing",
        file: ".",
        description: "Missing LICENSE file",
        priority: "medium",
      });
    }

    // Check for documentation directory
    const hasDocsDir = structure.directories.some((d) =>
      ["docs", "doc", "documentation"].includes(
        path.basename(d.path).toLowerCase()
      )
    );
    if (!hasDocsDir && structure.totalFiles > 20) {
      gaps.push({
        type: "missing",
        file: ".",
        description: "Missing documentation directory for large project",
        priority: "medium",
      });
    }

    return gaps;
  }

  /**
   * Analyze code-level documentation (comments, JSDoc, etc.)
   */
  private async analyzeCodeDocumentation(
    structure: ProjectStructure
  ): Promise<DocumentationGap[]> {
    const gaps: DocumentationGap[] = [];
    const codeFiles = structure.files.filter((f) => this.isCodeFile(f));

    for (const file of codeFiles) {
      try {
        const filePath = path.join(structure.rootPath, file.path);
        const content = await fs.readFile(filePath, "utf-8");

        const fileGaps = this.analyzeFileDocumentation(file, content);
        gaps.push(...fileGaps);
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    return gaps;
  }

  /**
   * Analyze documentation for a single file
   */
  private analyzeFileDocumentation(
    file: FileInfo,
    content: string
  ): DocumentationGap[] {
    const gaps: DocumentationGap[] = [];

    // Check for file header documentation
    if (!this.hasFileHeader(content)) {
      gaps.push({
        type: "missing",
        file: file.path,
        description: "Missing file header documentation",
        priority: "low",
      });
    }

    // Check for function documentation
    const undocumentedFunctions = this.findUndocumentedFunctions(
      content,
      file.language
    );
    if (undocumentedFunctions.length > 0) {
      gaps.push({
        type: "incomplete",
        file: file.path,
        description: `${undocumentedFunctions.length} functions lack documentation`,
        priority: "medium",
      });
    }

    // Check for class documentation
    const undocumentedClasses = this.findUndocumentedClasses(
      content,
      file.language
    );
    if (undocumentedClasses.length > 0) {
      gaps.push({
        type: "incomplete",
        file: file.path,
        description: `${undocumentedClasses.length} classes lack documentation`,
        priority: "medium",
      });
    }

    // Check for complex code without comments
    if (this.hasComplexCodeWithoutComments(content)) {
      gaps.push({
        type: "incomplete",
        file: file.path,
        description: "Complex code sections lack explanatory comments",
        priority: "medium",
      });
    }

    // Check for TODO/FIXME comments
    const todoComments = this.findTodoComments(content);
    if (todoComments.length > 5) {
      gaps.push({
        type: "outdated",
        file: file.path,
        description: `${todoComments.length} TODO/FIXME comments may be outdated`,
        priority: "low",
      });
    }

    return gaps;
  }

  /**
   * Analyze API documentation
   */
  private analyzeAPIDocumentation(
    structure: ProjectStructure
  ): DocumentationGap[] {
    const gaps: DocumentationGap[] = [];

    // Check for OpenAPI/Swagger documentation
    const hasApiDocs = structure.files.some(
      (f) =>
        f.path.toLowerCase().includes("swagger") ||
        f.path.toLowerCase().includes("openapi") ||
        f.path.toLowerCase().includes("api-docs")
    );

    // Look for API routes/endpoints
    const hasApiRoutes = structure.files.some(
      (f) =>
        f.path.toLowerCase().includes("route") ||
        f.path.toLowerCase().includes("endpoint") ||
        f.path.toLowerCase().includes("controller")
    );

    if (hasApiRoutes && !hasApiDocs) {
      gaps.push({
        type: "missing",
        file: ".",
        description: "API endpoints found but no API documentation",
        priority: "high",
      });
    }

    // Check for GraphQL schema documentation
    const hasGraphQL = structure.files.some(
      (f) =>
        f.path.toLowerCase().includes("graphql") ||
        f.path.toLowerCase().includes("schema")
    );

    if (hasGraphQL) {
      const hasGraphQLDocs = structure.files.some(
        (f) =>
          f.path.toLowerCase().includes("graphql") &&
          f.path.toLowerCase().includes("doc")
      );

      if (!hasGraphQLDocs) {
        gaps.push({
          type: "missing",
          file: ".",
          description: "GraphQL schema lacks documentation",
          priority: "medium",
        });
      }
    }

    return gaps;
  }

  /**
   * Calculate documentation coverage percentage
   */
  private calculateDocumentationCoverage(
    structure: ProjectStructure,
    gaps: DocumentationGap[]
  ): number {
    const codeFiles = structure.files.filter((f) => this.isCodeFile(f));
    if (codeFiles.length === 0) return 100;

    // Base score
    let score = 100;

    // Deduct points for missing project documentation
    const projectGaps = gaps.filter((g) => g.file === ".");
    score -= projectGaps.length * 10;

    // Deduct points for code documentation gaps
    const codeGaps = gaps.filter((g) => g.file !== ".");
    score -= (codeGaps.length / codeFiles.length) * 50;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Generate documentation recommendations
   */
  private generateDocumentationRecommendations(
    gaps: DocumentationGap[],
    coverage: number
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Low coverage recommendation
    if (coverage < 60) {
      recommendations.push({
        id: "improve-documentation-coverage",
        category: "maintainability",
        priority: "high",
        title: "Improve documentation coverage",
        description: `Documentation coverage is ${coverage}%. Focus on adding missing documentation.`,
        effort: "high",
        impact: "high",
      });
    }

    // Missing README recommendation
    const missingReadme = gaps.find((g) => g.description.includes("README"));
    if (missingReadme) {
      recommendations.push({
        id: "add-readme",
        category: "maintainability",
        priority: "high",
        title: "Add README file",
        description:
          "Create a comprehensive README with project description, installation, and usage instructions.",
        effort: "medium",
        impact: "high",
      });
    }

    // API documentation recommendation
    const missingApiDocs = gaps.find((g) => g.description.includes("API"));
    if (missingApiDocs) {
      recommendations.push({
        id: "add-api-documentation",
        category: "maintainability",
        priority: "high",
        title: "Add API documentation",
        description:
          "Document API endpoints with OpenAPI/Swagger or similar tools.",
        effort: "medium",
        impact: "high",
      });
    }

    // Code documentation recommendation
    const codeGaps = gaps.filter(
      (g) => g.type === "incomplete" && g.file !== "."
    );
    if (codeGaps.length > 5) {
      recommendations.push({
        id: "improve-code-documentation",
        category: "maintainability",
        priority: "medium",
        title: "Improve code documentation",
        description:
          "Add JSDoc/docstrings to functions and classes for better code understanding.",
        effort: "high",
        impact: "medium",
      });
    }

    // Contributing guide recommendation
    const missingContributing = gaps.find((g) =>
      g.description.includes("CONTRIBUTING")
    );
    if (missingContributing) {
      recommendations.push({
        id: "add-contributing-guide",
        category: "maintainability",
        priority: "low",
        title: "Add contributing guide",
        description: "Create a CONTRIBUTING.md file to help new contributors.",
        effort: "low",
        impact: "medium",
      });
    }

    return recommendations;
  }

  // Helper methods
  private isCodeFile(file: FileInfo): boolean {
    const codeExtensions = [
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
    ];
    const ext = path.extname(file.path).toLowerCase();
    return codeExtensions.includes(ext);
  }

  private hasFileHeader(content: string): boolean {
    const lines = content.split("\n").slice(0, 10);
    return lines.some(
      (line) =>
        line.includes("/**") ||
        line.includes("/*") ||
        line.includes('"""') ||
        line.includes("# File:") ||
        line.includes("// File:")
    );
  }

  private findUndocumentedFunctions(
    content: string,
    language: string
  ): string[] {
    const undocumented: string[] = [];

    if (language === "JavaScript" || language === "TypeScript") {
      // Find function declarations
      const functionRegex =
        /(?:function\s+(\w+)|(\w+)\s*[:=]\s*(?:function|\([^)]*\)\s*=>))/g;
      let match;

      while ((match = functionRegex.exec(content)) !== null) {
        const functionName = match[1] || match[2];
        const functionStart = match.index;

        // Check if there's documentation before the function
        const beforeFunction = content.substring(
          Math.max(0, functionStart - 200),
          functionStart
        );
        const hasDoc =
          beforeFunction.includes("/**") || beforeFunction.includes("//");

        if (!hasDoc) {
          undocumented.push(functionName);
        }
      }
    } else if (language === "Python") {
      // Find Python function definitions
      const functionRegex = /def\s+(\w+)\s*\(/g;
      let match;

      while ((match = functionRegex.exec(content)) !== null) {
        const functionName = match[1];
        const functionStart = match.index;

        // Check for docstring
        const afterFunction = content.substring(
          functionStart,
          functionStart + 500
        );
        const hasDocstring =
          afterFunction.includes('"""') || afterFunction.includes("'''");

        if (!hasDocstring) {
          undocumented.push(functionName);
        }
      }
    }

    return undocumented;
  }

  private findUndocumentedClasses(content: string, language: string): string[] {
    const undocumented: string[] = [];

    if (language === "JavaScript" || language === "TypeScript") {
      const classRegex = /class\s+(\w+)/g;
      let match;

      while ((match = classRegex.exec(content)) !== null) {
        const className = match[1];
        const classStart = match.index;

        const beforeClass = content.substring(
          Math.max(0, classStart - 200),
          classStart
        );
        const hasDoc =
          beforeClass.includes("/**") || beforeClass.includes("//");

        if (!hasDoc) {
          undocumented.push(className);
        }
      }
    } else if (language === "Python") {
      const classRegex = /class\s+(\w+)/g;
      let match;

      while ((match = classRegex.exec(content)) !== null) {
        const className = match[1];
        const classStart = match.index;

        const afterClass = content.substring(classStart, classStart + 500);
        const hasDocstring =
          afterClass.includes('"""') || afterClass.includes("'''");

        if (!hasDocstring) {
          undocumented.push(className);
        }
      }
    }

    return undocumented;
  }

  private hasComplexCodeWithoutComments(content: string): boolean {
    const lines = content.split("\n");
    let complexLineCount = 0;
    let commentCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();

      // Count comments
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("*")
      ) {
        commentCount++;
      }

      // Count complex lines (nested conditions, loops, etc.)
      if (
        (trimmed.includes("if") && trimmed.includes("&&")) ||
        (trimmed.includes("for") && trimmed.includes("in")) ||
        trimmed.includes("while") ||
        trimmed.includes("switch") ||
        trimmed.includes("try") ||
        trimmed.includes("catch")
      ) {
        complexLineCount++;
      }
    }

    // If there are many complex lines but few comments, flag it
    return complexLineCount > 5 && commentCount / complexLineCount < 0.3;
  }

  private findTodoComments(content: string): string[] {
    const todoRegex = /(?:\/\/|#|\*)\s*(TODO|FIXME|HACK|XXX|NOTE).*$/gm;
    const matches = content.match(todoRegex);
    return matches || [];
  }
}
