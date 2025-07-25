import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "fs";
import { glob } from "glob";
import { CodebaseAnalyzer } from "../CodebaseAnalyzer.js";
import { mockOllamaService, createMockProjectStructure } from "./setup.js";

// Mock the analyzers
vi.mock("../analyzers/DependencyAnalyzer.js", () => ({
  DependencyAnalyzer: vi.fn().mockImplementation(() => ({
    analyzeDependencies: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("../analyzers/ArchitectureDetector.js", () => ({
  ArchitectureDetector: vi.fn().mockImplementation(() => ({
    detectArchitecture: vi.fn().mockResolvedValue({
      patterns: [],
      recommendations: [],
    }),
  })),
}));

vi.mock("../analyzers/CodeQualityAnalyzer.js", () => ({
  CodeQualityAnalyzer: vi.fn().mockImplementation(() => ({
    analyzeCodeQuality: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock("../analyzers/CircularDependencyDetector.js", () => ({
  CircularDependencyDetector: vi.fn().mockImplementation(() => ({
    detectCircularDependencies: vi.fn().mockResolvedValue([]),
  })),
}));

describe("CodebaseAnalyzer", () => {
  let analyzer: CodebaseAnalyzer;
  const mockFs = fs as any;
  const mockGlob = glob as any;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new CodebaseAnalyzer(mockOllamaService as any);
  });

  describe("analyzeCodebase", () => {
    it("should analyze a complete codebase successfully", async () => {
      // Setup mocks
      mockGlob.mockResolvedValue([
        "/test/project/src/index.ts",
        "/test/project/src/utils.ts",
        "/test/project/test/index.test.ts",
      ]);

      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date(),
        isDirectory: () => false,
      });

      mockFs.readFile.mockResolvedValue('console.log("test");');

      const result = await analyzer.analyzeCodebase("/test/project");

      expect(result).toHaveProperty("structure");
      expect(result).toHaveProperty("dependencies");
      expect(result).toHaveProperty("metrics");
      expect(result).toHaveProperty("issues");
      expect(result).toHaveProperty("documentation");
      expect(result).toHaveProperty("recommendations");
    });

    it("should handle analysis options correctly", async () => {
      mockGlob.mockResolvedValue(["/test/project/src/index.ts"]);
      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date(),
      });
      mockFs.readFile.mockResolvedValue("const test = 1;");

      const options = {
        includeTests: false,
        maxFileSize: 500,
        excludePatterns: ["dist", "build"],
        analysisDepth: "basic" as const,
      };

      const result = await analyzer.analyzeCodebase("/test/project", options);

      expect(result).toBeDefined();
      expect(mockGlob).toHaveBeenCalledWith(
        expect.stringContaining("/test/project/**/*"),
        expect.objectContaining({
          ignore: expect.arrayContaining(["**/dist/**", "**/build/**"]),
        })
      );
    });

    it("should handle errors gracefully", async () => {
      mockGlob.mockRejectedValue(new Error("File system error"));

      await expect(analyzer.analyzeCodebase("/invalid/path")).rejects.toThrow(
        "Failed to analyze codebase"
      );
    });
  });

  describe("language detection", () => {
    it("should detect JavaScript files correctly", async () => {
      mockGlob.mockResolvedValue(["/test/project/src/app.js"]);
      mockFs.stat.mockResolvedValue({ size: 1024, mtime: new Date() });
      mockFs.readFile.mockResolvedValue('console.log("hello");');

      const result = await analyzer.analyzeCodebase("/test/project");

      expect(result.structure.languages).toContainEqual(
        expect.objectContaining({
          language: "JavaScript",
        })
      );
    });

    it("should detect TypeScript files correctly", async () => {
      mockGlob.mockResolvedValue(["/test/project/src/app.ts"]);
      mockFs.stat.mockResolvedValue({ size: 1024, mtime: new Date() });
      mockFs.readFile.mockResolvedValue("const x: number = 1;");

      const result = await analyzer.analyzeCodebase("/test/project");

      expect(result.structure.languages).toContainEqual(
        expect.objectContaining({
          language: "TypeScript",
        })
      );
    });

    it("should detect Python files correctly", async () => {
      mockGlob.mockResolvedValue(["/test/project/src/app.py"]);
      mockFs.stat.mockResolvedValue({ size: 1024, mtime: new Date() });
      mockFs.readFile.mockResolvedValue('print("hello")');

      const result = await analyzer.analyzeCodebase("/test/project");

      expect(result.structure.languages).toContainEqual(
        expect.objectContaining({
          language: "Python",
        })
      );
    });
  });

  describe("metrics calculation", () => {
    it("should calculate complexity metrics", async () => {
      mockGlob.mockResolvedValue(["/test/project/src/complex.js"]);
      mockFs.stat.mockResolvedValue({ size: 2048, mtime: new Date() });
      mockFs.readFile.mockResolvedValue(`
        function complexFunction() {
          if (condition1) {
            for (let i = 0; i < 10; i++) {
              if (condition2) {
                while (condition3) {
                  // complex logic
                }
              }
            }
          }
        }
      `);

      const result = await analyzer.analyzeCodebase("/test/project");

      expect(result.metrics.complexity).toBeGreaterThan(0);
      expect(result.metrics.maintainability).toBeGreaterThanOrEqual(0);
      expect(result.metrics.maintainability).toBeLessThanOrEqual(100);
    });

    it("should handle empty codebase", async () => {
      mockGlob.mockResolvedValue([]);

      const result = await analyzer.analyzeCodebase("/test/project");

      expect(result.metrics.complexity).toBe(0);
      expect(result.metrics.maintainability).toBe(100);
    });
  });

  describe("directory purpose detection", () => {
    it("should detect common directory purposes", async () => {
      mockGlob.mockResolvedValue([
        "/test/project/src/index.js",
        "/test/project/test/app.test.js",
        "/test/project/docs/readme.md",
      ]);
      mockFs.stat.mockResolvedValue({ size: 1024, mtime: new Date() });
      mockFs.readFile.mockResolvedValue("// test content");

      const result = await analyzer.analyzeCodebase("/test/project");

      const srcDir = result.structure.directories.find((d) => d.path === "src");
      const testDir = result.structure.directories.find(
        (d) => d.path === "test"
      );
      const docsDir = result.structure.directories.find(
        (d) => d.path === "docs"
      );

      expect(srcDir?.purpose).toBe("Source code");
      expect(testDir?.purpose).toBe("Tests");
      expect(docsDir?.purpose).toBe("Documentation");
    });
  });

  describe("file filtering", () => {
    it("should exclude files larger than maxFileSize", async () => {
      mockGlob.mockResolvedValue([
        "/test/project/src/small.js",
        "/test/project/src/large.js",
      ]);

      mockFs.stat
        .mockResolvedValueOnce({ size: 500, mtime: new Date() })
        .mockResolvedValueOnce({ size: 2000, mtime: new Date() });

      mockFs.readFile.mockResolvedValue('console.log("test");');

      const result = await analyzer.analyzeCodebase("/test/project", {
        maxFileSize: 1000,
      });

      expect(result.structure.files).toHaveLength(1);
      expect(result.structure.files[0].path).toContain("small.js");
    });

    it("should exclude specified patterns", async () => {
      mockGlob.mockResolvedValue([
        "/test/project/src/app.js",
        "/test/project/node_modules/lib.js",
        "/test/project/dist/bundle.js",
      ]);

      const result = await analyzer.analyzeCodebase("/test/project", {
        excludePatterns: ["node_modules", "dist"],
      });

      // The glob mock should be called with ignore patterns
      expect(mockGlob).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ignore: expect.arrayContaining(["**/node_modules/**", "**/dist/**"]),
        })
      );
    });
  });

  describe("recommendations generation", () => {
    it("should generate architecture recommendations", async () => {
      mockGlob.mockResolvedValue(["/test/project/src/index.js"]);
      mockFs.stat.mockResolvedValue({ size: 1024, mtime: new Date() });
      mockFs.readFile.mockResolvedValue('console.log("test");');

      const result = await analyzer.analyzeCodebase("/test/project");

      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it("should recommend complexity reduction for high complexity", async () => {
      mockGlob.mockResolvedValue(["/test/project/src/complex.js"]);
      mockFs.stat.mockResolvedValue({ size: 5000, mtime: new Date() });
      mockFs.readFile.mockResolvedValue(`
        ${"if (true) { ".repeat(20)}
        ${"} ".repeat(20)}
      `);

      const result = await analyzer.analyzeCodebase("/test/project");

      const complexityRecommendation = result.recommendations.find(
        (r) => r.id === "high-complexity"
      );
      expect(complexityRecommendation).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should continue analysis when individual files fail", async () => {
      mockGlob.mockResolvedValue([
        "/test/project/src/good.js",
        "/test/project/src/bad.js",
      ]);

      mockFs.stat.mockResolvedValue({ size: 1024, mtime: new Date() });
      mockFs.readFile
        .mockResolvedValueOnce('console.log("good");')
        .mockRejectedValueOnce(new Error("Permission denied"));

      const result = await analyzer.analyzeCodebase("/test/project");

      // Should still have results despite one file failing
      expect(result.structure.files).toHaveLength(1);
      expect(result.structure.files[0].path).toContain("good.js");
    });

    it("should handle missing directories gracefully", async () => {
      mockGlob.mockResolvedValue([]);

      const result = await analyzer.analyzeCodebase("/nonexistent/path");

      expect(result.structure.files).toHaveLength(0);
      expect(result.structure.directories).toHaveLength(0);
    });
  });
});
