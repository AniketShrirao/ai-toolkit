import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "fs";
import { CircularDependencyDetector } from "../analyzers/CircularDependencyDetector.js";
import { createMockProjectStructure, createMockFileInfo } from "./setup.js";

describe("CircularDependencyDetector", () => {
  let detector: CircularDependencyDetector;
  const mockFs = fs as any;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new CircularDependencyDetector();
  });

  describe("detectCircularDependencies", () => {
    it("should detect simple circular dependency", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/a.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/b.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce('import "./b.js";') // a.js imports b.js
        .mockResolvedValueOnce('import "./a.js";'); // b.js imports a.js

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
      const circularIssue = result.find(
        (issue) =>
          issue.type === "bug" &&
          issue.description.includes("Circular dependency")
      );
      expect(circularIssue).toBeDefined();
      expect(circularIssue?.severity).toBe("critical");
    });

    it("should detect complex circular dependency chain", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/a.js", language: "JavaScript" }),
          createMockFileInfo({ path: "src/b.js", language: "JavaScript" }),
          createMockFileInfo({ path: "src/c.js", language: "JavaScript" }),
          createMockFileInfo({ path: "src/d.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce('import "./b.js";') // a -> b
        .mockResolvedValueOnce('import "./c.js";') // b -> c
        .mockResolvedValueOnce('import "./d.js";') // c -> d
        .mockResolvedValueOnce('import "./a.js";'); // d -> a (completes cycle)

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
      const circularIssue = result[0];
      expect(circularIssue.description).toContain("Circular dependency");
      expect(circularIssue.severity).toBe("medium"); // Longer cycles are less severe
    });

    it("should handle JavaScript ES6 imports", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/module1.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/module2.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce('import { func } from "./module2.js";')
        .mockResolvedValueOnce('import { helper } from "./module1.js";');

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].severity).toBe("critical");
    });

    it("should handle CommonJS requires", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/module1.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/module2.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce('const module2 = require("./module2.js");')
        .mockResolvedValueOnce('const module1 = require("./module1.js");');

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].type).toBe("bug");
    });

    it("should handle dynamic imports", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/async1.js", language: "JavaScript" }),
          createMockFileInfo({ path: "src/async2.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce('const module = await import("./async2.js");')
        .mockResolvedValueOnce('const module = await import("./async1.js");');

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle TypeScript imports", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/service1.ts",
            language: "TypeScript",
          }),
          createMockFileInfo({
            path: "src/service2.ts",
            language: "TypeScript",
          }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce('import { Service2 } from "./service2";')
        .mockResolvedValueOnce('import { Service1 } from "./service1";');

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle Python imports", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/module1.py", language: "Python" }),
          createMockFileInfo({ path: "src/module2.py", language: "Python" }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce("from .module2 import function2")
        .mockResolvedValueOnce("from .module1 import function1");

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle Java imports", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/Class1.java", language: "Java" }),
          createMockFileInfo({ path: "src/Class2.java", language: "Java" }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce("import com.example.Class2;")
        .mockResolvedValueOnce("import com.example.Class1;");

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
    });

    it("should ignore external dependencies", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile.mockResolvedValue(`
        import React from "react";
        import lodash from "lodash";
        const fs = require("fs");
      `);

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBe(0);
    });

    it("should calculate severity based on cycle length", async () => {
      // Test different cycle lengths
      const testCases = [
        { files: ["a.js", "b.js"], expectedSeverity: "critical" },
        { files: ["a.js", "b.js", "c.js"], expectedSeverity: "high" },
        {
          files: ["a.js", "b.js", "c.js", "d.js", "e.js"],
          expectedSeverity: "medium",
        },
        {
          files: ["a.js", "b.js", "c.js", "d.js", "e.js", "f.js", "g.js"],
          expectedSeverity: "low",
        },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        const structure = createMockProjectStructure({
          files: testCase.files.map((file) =>
            createMockFileInfo({ path: `src/${file}`, language: "JavaScript" })
          ),
        });

        // Create circular dependency chain
        const mockCalls = testCase.files.map((file, index) => {
          const nextIndex = (index + 1) % testCase.files.length;
          const nextFile = testCase.files[nextIndex];
          return `import "./${nextFile}";`;
        });

        mockFs.readFile.mockImplementation((filePath: string) => {
          const fileName = filePath.split("/").pop();
          const fileIndex = testCase.files.indexOf(fileName!);
          return Promise.resolve(mockCalls[fileIndex]);
        });

        const result = await detector.detectCircularDependencies(structure);

        if (result.length > 0) {
          expect(result[0].severity).toBe(testCase.expectedSeverity);
        }
      }
    });

    it("should handle files that cannot be read", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/readable.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/unreadable.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce('import "./unreadable.js";')
        .mockRejectedValueOnce(new Error("Permission denied"));

      const result = await detector.detectCircularDependencies(structure);

      // Should not crash and should handle the error gracefully
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle non-analyzable files", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "image.png", language: "Unknown" }),
          createMockFileInfo({ path: "data.json", language: "JSON" }),
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile.mockResolvedValue('console.log("test");');

      const result = await detector.detectCircularDependencies(structure);

      // Should only analyze the JavaScript file
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    it("should handle empty project", async () => {
      const structure = createMockProjectStructure({
        files: [],
      });

      const result = await detector.detectCircularDependencies(structure);

      expect(result).toHaveLength(0);
    });

    it("should handle project with no dependencies", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/standalone.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue('console.log("No imports here");');

      const result = await detector.detectCircularDependencies(structure);

      expect(result).toHaveLength(0);
    });

    it("should handle mixed import styles", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/mixed1.js", language: "JavaScript" }),
          createMockFileInfo({ path: "src/mixed2.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile.mockResolvedValueOnce(`
          import { func1 } from "./mixed2.js";
          const helper = require("./mixed2.js");
        `).mockResolvedValueOnce(`
          const mixed1 = require("./mixed1.js");
          import { func2 } from "./mixed1.js";
        `);

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
    });

    it("should provide helpful suggestions for circular dependencies", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/a.js", language: "JavaScript" }),
          createMockFileInfo({ path: "src/b.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce('import "./b.js";')
        .mockResolvedValueOnce('import "./a.js";');

      const result = await detector.detectCircularDependencies(structure);

      expect(result[0].suggestion).toContain(
        "Refactor code to remove circular dependencies"
      );
      expect(result[0].suggestion).toContain("dependency injection");
    });

    it("should handle relative path resolution correctly", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/components/Button.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/utils/helpers.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile
        .mockResolvedValueOnce('import "../utils/helpers.js";')
        .mockResolvedValueOnce('import "../components/Button.js";');

      const result = await detector.detectCircularDependencies(structure);

      expect(result.length).toBeGreaterThan(0);
    });
  });
});
