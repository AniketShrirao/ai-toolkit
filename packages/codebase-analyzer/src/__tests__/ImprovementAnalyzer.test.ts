import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImprovementAnalyzer } from "../analyzers/ImprovementAnalyzer.js";
import {
  mockOllamaService,
  createMockProjectStructure,
  createMockFileInfo,
} from "./setup.js";
import { CodeIssue } from "@ai-toolkit/shared/types/analysis.js";

describe("ImprovementAnalyzer", () => {
  let analyzer: ImprovementAnalyzer;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new ImprovementAnalyzer(mockOllamaService as any);
  });

  describe("analyzeImprovements", () => {
    it("should analyze improvements and return comprehensive recommendations", async () => {
      const structure = createMockProjectStructure();
      const issues: CodeIssue[] = [];

      const result = await analyzer.analyzeImprovements(structure, issues);

      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("optimizations");
      expect(result).toHaveProperty("securityImprovements");
      expect(result).toHaveProperty("performanceImprovements");
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.optimizations)).toBe(true);
      expect(Array.isArray(result.securityImprovements)).toBe(true);
      expect(Array.isArray(result.performanceImprovements)).toBe(true);
    });

    it("should recommend async operations for sync issues", async () => {
      const structure = createMockProjectStructure();
      const issues: CodeIssue[] = [
        {
          id: "sync-op-1",
          type: "performance",
          severity: "medium",
          file: "src/app.js",
          description: "Synchronous operation readFileSync detected",
        },
        {
          id: "sync-op-2",
          type: "performance",
          severity: "medium",
          file: "src/utils.js",
          description: "Synchronous operation writeFileSync detected",
        },
      ];

      const result = await analyzer.analyzeImprovements(structure, issues);

      const asyncRecommendation = result.performanceImprovements.find(
        (r) => r.id === "async-operations"
      );
      expect(asyncRecommendation).toBeDefined();
      expect(asyncRecommendation?.priority).toBe("high");
      expect(asyncRecommendation?.category).toBe("performance");
    });

    it("should recommend algorithm optimization for nested loops", async () => {
      const structure = createMockProjectStructure();
      const issues: CodeIssue[] = [
        {
          id: "nested-loop-1",
          type: "performance",
          severity: "medium",
          file: "src/algorithm.js",
          description: "Nested loops detected",
        },
      ];

      const result = await analyzer.analyzeImprovements(structure, issues);

      const algorithmRecommendation = result.performanceImprovements.find(
        (r) => r.id === "optimize-algorithms"
      );
      expect(algorithmRecommendation).toBeDefined();
      expect(algorithmRecommendation?.category).toBe("performance");
    });

    it("should recommend bundle optimization for large JavaScript projects", async () => {
      const structure = createMockProjectStructure({
        files: Array.from({ length: 10 }, (_, i) =>
          createMockFileInfo({
            path: `src/component${i}.js`,
            language: "JavaScript",
            size: 1024 * 1024, // 1MB each
          })
        ),
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const bundleRecommendation = result.performanceImprovements.find(
        (r) => r.id === "bundle-optimization"
      );
      expect(bundleRecommendation).toBeDefined();
    });

    it("should recommend caching for API services", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/api/users.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/services/data.js",
            language: "JavaScript",
          }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const cachingRecommendation = result.performanceImprovements.find(
        (r) => r.id === "implement-caching"
      );
      expect(cachingRecommendation).toBeDefined();
    });

    it("should recommend fixing critical security vulnerabilities", async () => {
      const structure = createMockProjectStructure();
      const issues: CodeIssue[] = [
        {
          id: "sql-injection",
          type: "vulnerability",
          severity: "critical",
          file: "src/db.js",
          description: "Potential SQL injection vulnerability",
        },
        {
          id: "xss-vuln",
          type: "vulnerability",
          severity: "high",
          file: "src/render.js",
          description: "Potential XSS vulnerability",
        },
      ];

      const result = await analyzer.analyzeImprovements(structure, issues);

      const criticalSecurityRecommendation = result.securityImprovements.find(
        (r) => r.id === "fix-critical-vulnerabilities"
      );
      expect(criticalSecurityRecommendation).toBeDefined();
      expect(criticalSecurityRecommendation?.priority).toBe("high");

      const highSecurityRecommendation = result.securityImprovements.find(
        (r) => r.id === "fix-high-vulnerabilities"
      );
      expect(highSecurityRecommendation).toBeDefined();
    });

    it("should recommend security headers for web projects", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/server.js", language: "JavaScript" }),
          createMockFileInfo({ path: "public/index.html", language: "HTML" }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const securityHeadersRecommendation = result.securityImprovements.find(
        (r) => r.id === "security-headers"
      );
      expect(securityHeadersRecommendation).toBeDefined();
    });

    it("should recommend input validation", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/api/users.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/forms/contact.js",
            language: "JavaScript",
          }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const inputValidationRecommendation = result.securityImprovements.find(
        (r) => r.id === "input-validation"
      );
      expect(inputValidationRecommendation).toBeDefined();
      expect(inputValidationRecommendation?.priority).toBe("high");
    });

    it("should recommend authentication for API projects", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/api/users.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/api/orders.js",
            language: "JavaScript",
          }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const authRecommendation = result.securityImprovements.find(
        (r) => r.id === "implement-authentication"
      );
      expect(authRecommendation).toBeDefined();
    });

    it("should not recommend authentication when auth files exist", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/api/users.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/auth/login.js",
            language: "JavaScript",
          }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const authRecommendation = result.securityImprovements.find(
        (r) => r.id === "implement-authentication"
      );
      expect(authRecommendation).toBeUndefined();
    });

    it("should recommend refactoring code smells", async () => {
      const structure = createMockProjectStructure();
      const issues: CodeIssue[] = Array.from({ length: 15 }, (_, i) => ({
        id: `code-smell-${i}`,
        type: "code-smell",
        severity: "medium",
        file: `src/file${i}.js`,
        description: "Code smell detected",
      }));

      const result = await analyzer.analyzeImprovements(structure, issues);

      const codeSmellRecommendation = result.recommendations.find(
        (r) => r.id === "refactor-code-smells"
      );
      expect(codeSmellRecommendation).toBeDefined();
      expect(codeSmellRecommendation?.category).toBe("maintainability");
    });

    it("should recommend breaking down large files", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/large1.js",
            lines: 800,
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/large2.js",
            lines: 600,
            language: "JavaScript",
          }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const largeFileRecommendation = result.recommendations.find(
        (r) => r.id === "break-down-large-files"
      );
      expect(largeFileRecommendation).toBeDefined();
    });

    it("should recommend error handling when missing", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
          createMockFileInfo({ path: "src/utils.js", language: "JavaScript" }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const errorHandlingRecommendation = result.recommendations.find(
        (r) => r.id === "error-handling"
      );
      expect(errorHandlingRecommendation).toBeDefined();
    });

    it("should recommend organizing file structure for messy root", async () => {
      const structure = createMockProjectStructure({
        files: Array.from({ length: 20 }, (_, i) =>
          createMockFileInfo({ path: `file${i}.js`, language: "JavaScript" })
        ),
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const fileStructureRecommendation = result.optimizations.find(
        (r) => r.id === "organize-file-structure"
      );
      expect(fileStructureRecommendation).toBeDefined();
    });

    it("should recommend separation of concerns for large projects", async () => {
      const structure = createMockProjectStructure({
        totalFiles: 25,
        files: Array.from({ length: 25 }, (_, i) =>
          createMockFileInfo({
            path: `src/file${i}.js`,
            language: "JavaScript",
          })
        ),
        directories: [{ path: "src", fileCount: 25, subdirectories: 0 }],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const separationRecommendation = result.optimizations.find(
        (r) => r.id === "separation-of-concerns"
      );
      expect(separationRecommendation).toBeDefined();
    });

    it("should recommend configuration management", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const configRecommendation = result.optimizations.find(
        (r) => r.id === "configuration-management"
      );
      expect(configRecommendation).toBeDefined();
    });

    it("should recommend dependency audits for Node.js projects", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "package.json", language: "JSON" }),
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const auditRecommendation = result.optimizations.find(
        (r) => r.id === "dependency-audit"
      );
      expect(auditRecommendation).toBeDefined();

      const unusedDepsRecommendation = result.optimizations.find(
        (r) => r.id === "unused-dependencies"
      );
      expect(unusedDepsRecommendation).toBeDefined();
    });

    it("should recommend dependency locking when missing", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "package.json", language: "JSON" }),
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const lockingRecommendation = result.optimizations.find(
        (r) => r.id === "dependency-locking"
      );
      expect(lockingRecommendation).toBeDefined();
    });

    it("should not recommend dependency locking when lock file exists", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "package.json", language: "JSON" }),
          createMockFileInfo({ path: "package-lock.json", language: "JSON" }),
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const lockingRecommendation = result.optimizations.find(
        (r) => r.id === "dependency-locking"
      );
      expect(lockingRecommendation).toBeUndefined();
    });

    it("should recommend increasing test coverage for low coverage", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
          createMockFileInfo({ path: "src/utils.js", language: "JavaScript" }),
          createMockFileInfo({
            path: "src/service.js",
            language: "JavaScript",
          }),
          createMockFileInfo({ path: "src/model.js", language: "JavaScript" }),
          createMockFileInfo({
            path: "src/controller.js",
            language: "JavaScript",
          }),
          // Only 5 code files, no test files = 0% coverage
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const testCoverageRecommendation = result.recommendations.find(
        (r) => r.id === "increase-test-coverage"
      );
      expect(testCoverageRecommendation).toBeDefined();
      expect(testCoverageRecommendation?.priority).toBe("high");
    });

    it("should recommend test configuration when tests exist but no config", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
          createMockFileInfo({
            path: "src/app.test.js",
            language: "JavaScript",
          }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const testConfigRecommendation = result.recommendations.find(
        (r) => r.id === "test-configuration"
      );
      expect(testConfigRecommendation).toBeDefined();
    });

    it("should recommend E2E testing for web applications", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
          createMockFileInfo({ path: "public/index.html", language: "HTML" }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const e2eRecommendation = result.recommendations.find(
        (r) => r.id === "e2e-testing"
      );
      expect(e2eRecommendation).toBeDefined();
    });

    it("should not recommend E2E testing when E2E tests exist", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
          createMockFileInfo({ path: "public/index.html", language: "HTML" }),
          createMockFileInfo({
            path: "e2e/app.e2e.js",
            language: "JavaScript",
          }),
        ],
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      const e2eRecommendation = result.recommendations.find(
        (r) => r.id === "e2e-testing"
      );
      expect(e2eRecommendation).toBeUndefined();
    });

    it("should handle empty project gracefully", async () => {
      const structure = createMockProjectStructure({
        files: [],
        directories: [],
        totalFiles: 0,
      });

      const result = await analyzer.analyzeImprovements(structure, []);

      expect(result.recommendations).toBeDefined();
      expect(result.optimizations).toBeDefined();
      expect(result.securityImprovements).toBeDefined();
      expect(result.performanceImprovements).toBeDefined();
    });
  });
});
