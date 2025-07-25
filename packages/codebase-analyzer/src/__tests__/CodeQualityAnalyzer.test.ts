import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "fs";
import { CodeQualityAnalyzer } from "../analyzers/CodeQualityAnalyzer.js";
import {
  mockOllamaService,
  createMockProjectStructure,
  createMockFileInfo,
} from "./setup.js";

describe("CodeQualityAnalyzer", () => {
  let analyzer: CodeQualityAnalyzer;
  const mockFs = fs as any;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new CodeQualityAnalyzer(mockOllamaService as any);
  });

  describe("analyzeCodeQuality", () => {
    it("should analyze code quality and return issues", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/large-file.js",
            lines: 1200,
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue('console.log("test");');

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should detect large file issues", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/huge-file.js",
            lines: 1500,
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue("// Large file content");

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const largeFileIssue = result.find((issue) =>
        issue.id.includes("large-file")
      );
      expect(largeFileIssue).toBeDefined();
      expect(largeFileIssue?.severity).toBe("medium");
    });

    it("should detect high complexity issues", async () => {
      const complexCode = `
        function complexFunction() {
          if (condition1) {
            for (let i = 0; i < 10; i++) {
              if (condition2) {
                while (condition3) {
                  if (condition4) {
                    switch (value) {
                      case 1:
                        if (condition5) {
                          // complex logic
                        }
                        break;
                      case 2:
                        if (condition6) {
                          // more complex logic
                        }
                        break;
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/complex.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue(complexCode);

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const complexityIssue = result.find((issue) =>
        issue.id.includes("complexity")
      );
      expect(complexityIssue).toBeDefined();
      expect(complexityIssue?.type).toBe("code-smell");
    });

    it("should detect security vulnerabilities", async () => {
      const vulnerableCode = `
        const password = "hardcoded-password";
        const apiKey = "sk-1234567890abcdef";
        const query = "SELECT * FROM users WHERE id = " + userId;
        document.innerHTML = userInput;
        eval(userCode);
      `;

      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/vulnerable.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue(vulnerableCode);

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const securityIssues = result.filter(
        (issue) => issue.type === "vulnerability"
      );
      expect(securityIssues.length).toBeGreaterThan(0);

      const sqlInjectionIssue = securityIssues.find((issue) =>
        issue.description.includes("SQL injection")
      );
      expect(sqlInjectionIssue?.severity).toBe("critical");
    });

    it("should detect performance issues", async () => {
      const performanceCode = `
        for (let i = 0; i < 1000; i++) {
          for (let j = 0; j < 1000; j++) {
            // nested loop
          }
        }
        
        const fs = require('fs');
        const data = fs.readFileSync('file.txt');
      `;

      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/performance.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue(performanceCode);

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const performanceIssues = result.filter(
        (issue) => issue.type === "performance"
      );
      expect(performanceIssues.length).toBeGreaterThan(0);
    });

    it("should detect JavaScript-specific issues", async () => {
      const jsCode = `
        var oldVariable = 'should use let/const';
        console.log('debug statement');
        console.log('another debug');
        console.log('yet another debug');
        console.log('too many console logs');
        
        if (value == null) { // should use ===
          // loose equality
        }
      `;

      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/js-issues.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue(jsCode);

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const jsIssues = result.filter(
        (issue) =>
          issue.id.includes("console-statements") ||
          issue.id.includes("var-usage") ||
          issue.id.includes("loose-equality")
      );
      expect(jsIssues.length).toBeGreaterThan(0);
    });

    it("should detect Python-specific issues", async () => {
      const pythonCode = `
        from module import *
        
        global global_var
        global_var = "should avoid globals"
        
        def function_with_global():
            global another_global
            another_global = "more globals"
      `;

      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/python-issues.py",
            language: "Python",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue(pythonCode);

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const pythonIssues = result.filter(
        (issue) =>
          issue.id.includes("wildcard-import") ||
          issue.id.includes("global-variables")
      );
      expect(pythonIssues.length).toBeGreaterThan(0);
    });

    it("should detect code smells", async () => {
      const smellCode = `
        function longParameterFunction(param1, param2, param3, param4, param5, param6, param7, param8, param9, param10) {
          // Long parameter list
        }
        
        // TODO: Fix this later
        // TODO: Refactor this
        // TODO: Add error handling
        // TODO: Optimize performance
        // TODO: Add tests
        // TODO: Update documentation
        
        const duplicateLine = "This line is duplicated";
        const duplicateLine2 = "This line is duplicated";
        const duplicateLine3 = "This line is duplicated";
        const duplicateLine4 = "This line is duplicated";
        const duplicateLine5 = "This line is duplicated";
        const duplicateLine6 = "This line is duplicated";
        const duplicateLine7 = "This line is duplicated";
        const duplicateLine8 = "This line is duplicated";
        const duplicateLine9 = "This line is duplicated";
        const duplicateLine10 = "This line is duplicated";
        const duplicateLine11 = "This line is duplicated";
        
        const magicNumber1 = 42;
        const magicNumber2 = 123;
        const magicNumber3 = 456;
        const magicNumber4 = 789;
        const magicNumber5 = 999;
        const magicNumber6 = 111;
        const magicNumber7 = 222;
        const magicNumber8 = 333;
        const magicNumber9 = 444;
        const magicNumber10 = 555;
        const magicNumber11 = 666;
      `;

      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/smells.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue(smellCode);

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const codeSmells = result.filter((issue) => issue.type === "code-smell");
      expect(codeSmells.length).toBeGreaterThan(0);
    });

    it("should analyze project structure issues", async () => {
      const structure = createMockProjectStructure({
        files: Array.from({ length: 20 }, (_, i) =>
          createMockFileInfo({
            path: `file${i}.js`,
            language: "JavaScript",
          })
        ),
      });

      mockFs.readFile.mockResolvedValue('console.log("test");');

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const structureIssue = result.find(
        (issue) => issue.id === "too-many-root-files"
      );
      expect(structureIssue).toBeDefined();
    });

    it("should detect missing important files", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/app.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue('console.log("test");');

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const missingFiles = result.filter((issue) =>
        issue.id.includes("missing-")
      );
      expect(missingFiles.length).toBeGreaterThan(0);
    });

    it("should sort issues by severity", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/issues.js",
            language: "JavaScript",
            lines: 1200,
          }),
        ],
      });

      const codeWithIssues = `
        const password = "secret123";
        console.log("debug");
        var oldVar = "test";
      `;

      mockFs.readFile.mockResolvedValue(codeWithIssues);

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      // Check that issues are sorted by severity (critical first)
      const severityOrder = ["critical", "high", "medium", "low"];
      for (let i = 1; i < result.length; i++) {
        const prevSeverityIndex = severityOrder.indexOf(result[i - 1].severity);
        const currentSeverityIndex = severityOrder.indexOf(result[i].severity);
        expect(prevSeverityIndex).toBeLessThanOrEqual(currentSeverityIndex);
      }
    });

    it("should handle file reading errors gracefully", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/unreadable.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockRejectedValue(new Error("Permission denied"));

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      const fileReadError = result.find((issue) =>
        issue.id.includes("file-read-error")
      );
      expect(fileReadError).toBeDefined();
      expect(fileReadError?.severity).toBe("low");
    });

    it("should skip non-analyzable files", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "image.png",
            language: "Unknown",
          }),
          createMockFileInfo({
            path: "src/app.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue('console.log("test");');

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024,
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      // Should only analyze the JavaScript file
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    it("should skip files larger than maxFileSize", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/large.js",
            language: "JavaScript",
            size: 2 * 1024 * 1024, // 2MB
          }),
        ],
      });

      const result = await analyzer.analyzeCodeQuality(structure, {
        includeTests: true,
        includeNodeModules: false,
        maxFileSize: 1024 * 1024, // 1MB limit
        excludePatterns: [],
        analysisDepth: "detailed",
      });

      // Should not try to read the large file
      expect(mockFs.readFile).not.toHaveBeenCalled();
    });
  });
});
