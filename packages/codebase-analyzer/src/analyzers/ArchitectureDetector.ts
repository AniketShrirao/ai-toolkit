import * as path from "path";
import {
  ProjectStructure,
  DirectoryInfo,
  FileInfo,
} from "@ai-toolkit/shared/types/analysis.js";
import { OllamaService } from "@ai-toolkit/ollama-interface";

export interface ArchitecturePattern {
  name: string;
  confidence: number;
  description: string;
  indicators: string[];
}

export interface ArchitectureAnalysis {
  patterns: ArchitecturePattern[];
  primaryPattern?: ArchitecturePattern;
  recommendations: string[];
}

export class ArchitectureDetector {
  private ollamaService: OllamaService;

  constructor(ollamaService: OllamaService) {
    this.ollamaService = ollamaService;
  }

  /**
   * Detect architecture patterns in the codebase
   */
  async detectArchitecture(
    structure: ProjectStructure
  ): Promise<ArchitectureAnalysis> {
    const patterns: ArchitecturePattern[] = [];

    // Detect various architecture patterns
    patterns.push(...this.detectMVCPattern(structure));
    patterns.push(...this.detectLayeredArchitecture(structure));
    patterns.push(...this.detectMicroservicesPattern(structure));
    patterns.push(...this.detectComponentBasedArchitecture(structure));
    patterns.push(...this.detectModularArchitecture(structure));
    patterns.push(...this.detectCleanArchitecture(structure));

    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);

    // Determine primary pattern
    const primaryPattern =
      patterns.length > 0 && patterns[0].confidence > 0.6
        ? patterns[0]
        : undefined;

    // Generate recommendations
    const recommendations = this.generateArchitectureRecommendations(
      structure,
      patterns
    );

    return {
      patterns,
      primaryPattern,
      recommendations,
    };
  }

  /**
   * Detect MVC (Model-View-Controller) pattern
   */
  private detectMVCPattern(structure: ProjectStructure): ArchitecturePattern[] {
    const indicators: string[] = [];
    let confidence = 0;

    // Look for MVC directories
    const mvcDirs = ["models", "views", "controllers"];
    const foundDirs = mvcDirs.filter((dir) =>
      structure.directories.some(
        (d) => path.basename(d.path).toLowerCase() === dir
      )
    );

    if (foundDirs.length >= 2) {
      confidence += foundDirs.length * 0.25;
      indicators.push(`Found ${foundDirs.join(", ")} directories`);
    }

    // Look for MVC file patterns
    const mvcFilePatterns = [
      /controller\.(js|ts|py|java|php)$/i,
      /model\.(js|ts|py|java|php)$/i,
      /view\.(js|ts|py|java|php)$/i,
    ];

    const mvcFiles = structure.files.filter((file) =>
      mvcFilePatterns.some((pattern) => pattern.test(file.path))
    );

    if (mvcFiles.length > 0) {
      confidence += Math.min(mvcFiles.length * 0.1, 0.3);
      indicators.push(`Found ${mvcFiles.length} MVC-pattern files`);
    }

    // Look for framework-specific MVC patterns
    const frameworkPatterns = [
      { pattern: /app\/controllers/i, framework: "Rails/Laravel" },
      { pattern: /src\/main\/java.*\/controller/i, framework: "Spring" },
      { pattern: /Controllers/i, framework: ".NET MVC" },
    ];

    for (const { pattern, framework } of frameworkPatterns) {
      if (structure.directories.some((d) => pattern.test(d.path))) {
        confidence += 0.4;
        indicators.push(`Detected ${framework} MVC structure`);
        break;
      }
    }

    if (confidence > 0) {
      return [
        {
          name: "MVC (Model-View-Controller)",
          confidence: Math.min(confidence, 1.0),
          description:
            "Separates application logic into three interconnected components",
          indicators,
        },
      ];
    }

    return [];
  }

  /**
   * Detect Layered Architecture pattern
   */
  private detectLayeredArchitecture(
    structure: ProjectStructure
  ): ArchitecturePattern[] {
    const indicators: string[] = [];
    let confidence = 0;

    // Look for typical layers
    const layerDirs = [
      "presentation",
      "ui",
      "web",
      "business",
      "service",
      "logic",
      "data",
      "dal",
      "repository",
      "persistence",
    ];

    const foundLayers = layerDirs.filter((layer) =>
      structure.directories.some((d) =>
        path.basename(d.path).toLowerCase().includes(layer)
      )
    );

    if (foundLayers.length >= 2) {
      confidence += foundLayers.length * 0.2;
      indicators.push(`Found layered structure: ${foundLayers.join(", ")}`);
    }

    // Look for service layer patterns
    const serviceFiles = structure.files.filter(
      (file) =>
        /service\.(js|ts|py|java|cs)$/i.test(file.path) ||
        file.path.toLowerCase().includes("service")
    );

    if (serviceFiles.length > 0) {
      confidence += Math.min(serviceFiles.length * 0.05, 0.3);
      indicators.push(`Found ${serviceFiles.length} service layer files`);
    }

    // Look for repository pattern
    const repositoryFiles = structure.files.filter(
      (file) =>
        /repository\.(js|ts|py|java|cs)$/i.test(file.path) ||
        file.path.toLowerCase().includes("repository")
    );

    if (repositoryFiles.length > 0) {
      confidence += Math.min(repositoryFiles.length * 0.05, 0.2);
      indicators.push(
        `Found ${repositoryFiles.length} repository pattern files`
      );
    }

    if (confidence > 0) {
      return [
        {
          name: "Layered Architecture",
          confidence: Math.min(confidence, 1.0),
          description:
            "Organizes code into horizontal layers with specific responsibilities",
          indicators,
        },
      ];
    }

    return [];
  }

  /**
   * Detect Microservices pattern
   */
  private detectMicroservicesPattern(
    structure: ProjectStructure
  ): ArchitecturePattern[] {
    const indicators: string[] = [];
    let confidence = 0;

    // Look for multiple service directories
    const serviceDirs = structure.directories.filter(
      (d) =>
        path.basename(d.path).toLowerCase().includes("service") ||
        path.basename(d.path).toLowerCase().includes("microservice")
    );

    if (serviceDirs.length > 1) {
      confidence += Math.min(serviceDirs.length * 0.2, 0.6);
      indicators.push(`Found ${serviceDirs.length} service directories`);
    }

    // Look for Docker files (common in microservices)
    const dockerFiles = structure.files.filter(
      (file) =>
        file.path.toLowerCase().includes("dockerfile") ||
        file.path.toLowerCase().includes("docker-compose")
    );

    if (dockerFiles.length > 0) {
      confidence += Math.min(dockerFiles.length * 0.1, 0.3);
      indicators.push(`Found ${dockerFiles.length} Docker configuration files`);
    }

    // Look for API gateway patterns
    const gatewayFiles = structure.files.filter(
      (file) =>
        file.path.toLowerCase().includes("gateway") ||
        file.path.toLowerCase().includes("proxy")
    );

    if (gatewayFiles.length > 0) {
      confidence += 0.2;
      indicators.push("Found API gateway/proxy files");
    }

    // Look for separate package.json files (indicating separate services)
    const packageJsonFiles = structure.files.filter(
      (file) => path.basename(file.path) === "package.json"
    );

    if (packageJsonFiles.length > 2) {
      confidence += Math.min((packageJsonFiles.length - 1) * 0.1, 0.4);
      indicators.push(
        `Found ${packageJsonFiles.length} package.json files indicating separate services`
      );
    }

    if (confidence > 0) {
      return [
        {
          name: "Microservices Architecture",
          confidence: Math.min(confidence, 1.0),
          description:
            "Decomposes application into small, independent services",
          indicators,
        },
      ];
    }

    return [];
  }

  /**
   * Detect Component-Based Architecture
   */
  private detectComponentBasedArchitecture(
    structure: ProjectStructure
  ): ArchitecturePattern[] {
    const indicators: string[] = [];
    let confidence = 0;

    // Look for component directories
    const componentDirs = structure.directories.filter((d) =>
      path.basename(d.path).toLowerCase().includes("component")
    );

    if (componentDirs.length > 0) {
      confidence += Math.min(componentDirs.length * 0.3, 0.6);
      indicators.push(`Found ${componentDirs.length} component directories`);
    }

    // Look for React/Vue/Angular patterns
    const componentFiles = structure.files.filter((file) => {
      const fileName = path.basename(file.path).toLowerCase();
      return (
        fileName.includes("component") ||
        file.path.match(/\.(jsx|tsx|vue)$/i) ||
        fileName.endsWith(".component.ts") ||
        fileName.endsWith(".component.js")
      );
    });

    if (componentFiles.length > 0) {
      confidence += Math.min(componentFiles.length * 0.02, 0.4);
      indicators.push(`Found ${componentFiles.length} component files`);
    }

    // Look for framework-specific patterns
    const frameworkFiles = structure.files.filter(
      (file) =>
        file.path.includes("node_modules") === false &&
        (file.path.includes("react") ||
          file.path.includes("vue") ||
          file.path.includes("angular"))
    );

    if (frameworkFiles.length > 0) {
      confidence += 0.2;
      indicators.push("Found frontend framework files");
    }

    if (confidence > 0) {
      return [
        {
          name: "Component-Based Architecture",
          confidence: Math.min(confidence, 1.0),
          description:
            "Organizes code into reusable, self-contained components",
          indicators,
        },
      ];
    }

    return [];
  }

  /**
   * Detect Modular Architecture
   */
  private detectModularArchitecture(
    structure: ProjectStructure
  ): ArchitecturePattern[] {
    const indicators: string[] = [];
    let confidence = 0;

    // Look for module directories
    const moduleDirs = structure.directories.filter(
      (d) =>
        path.basename(d.path).toLowerCase().includes("module") ||
        path.basename(d.path).toLowerCase().includes("packages")
    );

    if (moduleDirs.length > 0) {
      confidence += Math.min(moduleDirs.length * 0.2, 0.5);
      indicators.push(`Found ${moduleDirs.length} module directories`);
    }

    // Look for index files (common in modular architecture)
    const indexFiles = structure.files.filter((file) =>
      path.basename(file.path).toLowerCase().startsWith("index.")
    );

    if (indexFiles.length > 2) {
      confidence += Math.min(indexFiles.length * 0.05, 0.3);
      indicators.push(
        `Found ${indexFiles.length} index files indicating modular exports`
      );
    }

    // Look for barrel exports pattern
    const barrelFiles = structure.files.filter((file) => {
      const fileName = path.basename(file.path).toLowerCase();
      return fileName === "index.ts" || fileName === "index.js";
    });

    if (barrelFiles.length > 1) {
      confidence += 0.2;
      indicators.push("Found barrel export pattern");
    }

    if (confidence > 0) {
      return [
        {
          name: "Modular Architecture",
          confidence: Math.min(confidence, 1.0),
          description: "Organizes code into discrete, interchangeable modules",
          indicators,
        },
      ];
    }

    return [];
  }

  /**
   * Detect Clean Architecture pattern
   */
  private detectCleanArchitecture(
    structure: ProjectStructure
  ): ArchitecturePattern[] {
    const indicators: string[] = [];
    let confidence = 0;

    // Look for Clean Architecture layers
    const cleanArchDirs = [
      "entities",
      "domain",
      "usecases",
      "application",
      "interfaces",
      "adapters",
      "infrastructure",
      "frameworks",
    ];

    const foundCleanDirs = cleanArchDirs.filter((dir) =>
      structure.directories.some((d) =>
        path.basename(d.path).toLowerCase().includes(dir)
      )
    );

    if (foundCleanDirs.length >= 3) {
      confidence += foundCleanDirs.length * 0.2;
      indicators.push(
        `Found Clean Architecture layers: ${foundCleanDirs.join(", ")}`
      );
    }

    // Look for use case files
    const useCaseFiles = structure.files.filter(
      (file) =>
        file.path.toLowerCase().includes("usecase") ||
        file.path.toLowerCase().includes("use-case")
    );

    if (useCaseFiles.length > 0) {
      confidence += Math.min(useCaseFiles.length * 0.1, 0.3);
      indicators.push(`Found ${useCaseFiles.length} use case files`);
    }

    // Look for entity files
    const entityFiles = structure.files.filter(
      (file) =>
        file.path.toLowerCase().includes("entity") ||
        file.path.toLowerCase().includes("entities")
    );

    if (entityFiles.length > 0) {
      confidence += Math.min(entityFiles.length * 0.05, 0.2);
      indicators.push(`Found ${entityFiles.length} entity files`);
    }

    if (confidence > 0) {
      return [
        {
          name: "Clean Architecture",
          confidence: Math.min(confidence, 1.0),
          description:
            "Separates concerns through concentric layers with dependency inversion",
          indicators,
        },
      ];
    }

    return [];
  }

  /**
   * Generate architecture recommendations
   */
  private generateArchitectureRecommendations(
    structure: ProjectStructure,
    patterns: ArchitecturePattern[]
  ): string[] {
    const recommendations: string[] = [];

    // If no clear pattern is detected
    if (patterns.length === 0 || patterns[0].confidence < 0.5) {
      recommendations.push(
        "Consider adopting a clear architecture pattern to improve code organization and maintainability"
      );
    }

    // Check for mixed patterns
    const highConfidencePatterns = patterns.filter((p) => p.confidence > 0.6);
    if (highConfidencePatterns.length > 1) {
      recommendations.push(
        "Multiple architecture patterns detected. Consider consolidating to a single, consistent pattern"
      );
    }

    // Check for missing test structure
    const hasTestDirs = structure.directories.some((d) =>
      ["test", "tests", "__tests__", "spec"].includes(
        path.basename(d.path).toLowerCase()
      )
    );

    if (!hasTestDirs) {
      recommendations.push(
        "Add a clear testing structure to support your architecture pattern"
      );
    }

    // Check for documentation
    const hasDocumentation = structure.files.some(
      (f) =>
        f.path.toLowerCase().includes("readme") ||
        f.path.toLowerCase().includes("doc")
    );

    if (!hasDocumentation) {
      recommendations.push(
        "Add architectural documentation to help team members understand the chosen patterns"
      );
    }

    return recommendations;
  }
}
