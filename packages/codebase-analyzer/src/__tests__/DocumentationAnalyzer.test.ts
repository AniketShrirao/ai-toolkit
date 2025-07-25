import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "fs";
import { DocumentationAnalyzer } from "../analyzers/DocumentationAnalyzer.js";
import {
  mockOllamaService,
  createMockProjectStructure,
  createMockFileInfo,
} from "./setup.js";

describe("DocumentationAnalyzer", () => {
  let analyzer: DocumentationAnalyzer;
  const mockFs = fs as any;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new DocumentationAnalyzer(mockOllamaService as any);
  });

  describe("analyzeDocumentation", () => {
    it("should analyze documentation and return gaps and coverage", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
          createMockFileInfo({ path: "package.json", language: "JSON" }),
        ],
      });

      mockFs.readFile.mockResolvedValue('function test() { return "hello"; }');

      const result = await analyzer.analyzeDocumentation(structure);

      expect(result).toHaveProperty("gaps");
      expect(result).toHaveProperty("coverage");
      expect(result).toHaveProperty("recommendations");
      expect(Array.isArray(result.gaps)).toBe(true);
      expect(typeof result.coverage).toBe("number");
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it("should detect missing README file", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile.mockResolvedValue("function test() {}");

      const result = await analyzer.analyzeDocumentation(structure);

      const readmeGap = result.gaps.find((gap) =>
        gap.description.includes("README")
      );
      expect(readmeGap).toBeDefined();
      expect(readmeGap?.type).toBe("missing");
      expect(readmeGap?.priority).toBe("high");
    });

    it("should detect missing CHANGELOG file", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "README.md", language: "Markdown" }),
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile.mockResolvedValue("function test() {}");

      const result = await analyzer.analyzeDocumentation(structure);

      const changelogGap = result.gaps.find((gap) =>
        gap.description.includes("CHANGELOG")
      );
      expect(changelogGap).toBeDefined();
      expect(changelogGap?.priority).toBe("medium");
    });

    it("should detect missing CONTRIBUTING guide", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "README.md", language: "Markdown" }),
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile.mockResolvedValue("function test() {}");

      const result = await analyzer.analyzeDocumentation(structure);

      const contributingGap = result.gaps.find((gap) =>
        gap.description.includes("CONTRIBUTING")
      );
      expect(contributingGap).toBeDefined();
    });

    it("should detect missing LICENSE file", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "README.md", language: "Markdown" }),
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile.mockResolvedValue("function test() {}");

      const result = await analyzer.analyzeDocumentation(structure);

      const licenseGap = result.gaps.find((gap) =>
        gap.description.includes("LICENSE")
      );
      expect(licenseGap).toBeDefined();
    });

    it("should detect undocumented functions", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      const codeWithUndocumentedFunctions = `
        function undocumentedFunction() {
          return "no docs";
        }
        
        function anotherUndocumentedFunction() {
          return "also no docs";
        }
      `;

      mockFs.readFile.mockResolvedValue(codeWithUndocumentedFunctions);

      const result = await analyzer.analyzeDocumentation(structure);

      const functionGap = result.gaps.find((gap) =>
        gap.description.includes("functions lack documentation")
      );
      expect(functionGap).toBeDefined();
      expect(functionGap?.type).toBe("incomplete");
    });

    it("should detect undocumented classes", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      const codeWithUndocumentedClasses = `
        class UndocumentedClass {
          constructor() {}
          
          method() {
            return "no docs";
          }
        }
      `;

      mockFs.readFile.mockResolvedValue(codeWithUndocumentedClasses);

      const result = await analyzer.analyzeDocumentation(structure);

      const classGap = result.gaps.find((gap) =>
        gap.description.includes("classes lack documentation")
      );
      expect(classGap).toBeDefined();
    });

    it("should detect complex code without comments", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/complex.js",
            language: "JavaScript",
          }),
        ],
      });

      const complexCodeWithoutComments = `
        function complexFunction() {
          if (condition1 && condition2) {
            for (let i = 0; i < 100; i++) {
              if (condition3) {
                while (condition4) {
                  switch (value) {
                    case 1:
                      if (condition5) {
                        // Only one comment in complex code
                      }
                      break;
                  }
                }
              }
            }
          }
        }
      `;

      mockFs.readFile.mockResolvedValue(complexCodeWithoutComments);

      const result = await analyzer.analyzeDocumentation(structure);

      const complexityGap = result.gaps.find((gap) =>
        gap.description.includes(
          "Complex code sections lack explanatory comments"
        )
      );
      expect(complexityGap).toBeDefined();
    });

    it("should detect excessive TODO comments", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/todos.js", language: "JavaScript" }),
        ],
      });

      const codeWithManyTodos = `
        // TODO: Fix this
        // TODO: Refactor this
        // TODO: Add tests
        // TODO: Optimize
        // TODO: Document
        // TODO: Review
        // TODO: Update
        function test() {}
      `;

      mockFs.readFile.mockResolvedValue(codeWithManyTodos);

      const result = await analyzer.analyzeDocumentation(structure);

      const todoGap = result.gaps.find((gap) =>
        gap.description.includes("TODO/FIXME comments may be outdated")
      );
      expect(todoGap).toBeDefined();
    });

    it("should detect missing API documentation", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/routes/users.js",
            language: "JavaScript",
          }),
          createMockFileInfo({
            path: "src/controllers/UserController.js",
            language: "JavaScript",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue("function getUserById() {}");

      const result = await analyzer.analyzeDocumentation(structure);

      const apiGap = result.gaps.find((gap) =>
        gap.description.includes("API endpoints found but no API documentation")
      );
      expect(apiGap).toBeDefined();
      expect(apiGap?.priority).toBe("high");
    });

    it("should detect missing GraphQL documentation", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({
            path: "src/schema.graphql",
            language: "Unknown",
          }),
        ],
      });

      mockFs.readFile.mockResolvedValue("type User { id: ID! }");

      const result = await analyzer.analyzeDocumentation(structure);

      const graphqlGap = result.gaps.find((gap) =>
        gap.description.includes("GraphQL schema lacks documentation")
      );
      expect(graphqlGap).toBeDefined();
    });

    it("should calculate documentation coverage correctly", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "README.md", language: "Markdown" }),
          createMockFileInfo({ path: "CHANGELOG.md", language: "Markdown" }),
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      const wellDocumentedCode = `
        /**
         * This is a well-documented function
         * @param {string} input - The input parameter
         * @returns {string} The processed output
         */
        function documentedFunction(input) {
          // Clear comment explaining the logic
          return input.toUpperCase();
        }
      `;

      mockFs.readFile.mockResolvedValue(wellDocumentedCode);

      const result = await analyzer.analyzeDocumentation(structure);

      expect(result.coverage).toBeGreaterThan(70);
    });

    it("should generate appropriate recommendations", async () => {
      const structure = createMockProjectStructure({
        files: [
          createMockFileInfo({ path: "src/app.js", language: "JavaScript" }),
        ],
      });

      mockFs.readFile.mockResolvedValue("function test() {}");

      const result = await analyzer.analyzeDocumentation(structure);

      expect(result.recommendations.length).toBeGreaterThan(0);

      const readmeRecommendation = result.recommendations.find(
        (r) => r.id === "add-readme"
      );
      expect(readmeRecommendation).toBeDefined();
      expect(readmeRecommendation?.priority).toBe("high");
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

      const result = await analyzer.analyzeDocumentation(structure);

      // Should not crash and should still return results
      expect(result).toHaveProperty("gaps");
      expect(result).toHaveProperty("coverage");
    });

    it("should detect missing docs directory for large projects", async () => {
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

      mockFs.readFile.mockResolvedValue("function test() {}");

      const result = await analyzer.analyzeDocumentation(structure);

      const docsGap = result.gaps.find((gap) =>
        gap.description.includes("Missing documentation directory")
      );
      expect(docsGap).toBeDefined();
    });

    it("should not flag missing docs directory for small projects", async () => {
      const structure = createMockProjectStructure({
        totalFiles: 5,
        files: Array.from({ length: 5 }, (_, i) =>
          createMockFileInfo({
            path: `src/file${i}.js`,
            language: "JavaScript",
          })
        ),
      });

      mockFs.readFile.mockResolvedValue("function test() {}");

      const result = await analyzer.analyzeDocumentation(structure);

      const docsGap = result.gaps.find((gap) =>
        gap.description.includes("Missing documentation directory")
      );
      expect(docsGap).toBeUndefined();
    });

    it("should handle Python docstrings correctly", async () => {
      const structure = createMockProjectStructure({
        files: [createMockFileInfo({ path: "src/app.py", language: "Python" })],
      });

      const pythonCodeWithDocstrings = `
        def documented_function():
            """
            This function is properly documented.
            """
            return "hello"
            
        def undocumented_function():
            return "no docs"
      `;

      mockFs.readFile.mockResolvedValue(pythonCodeWithDocstrings);

      const result = await analyzer.analyzeDocumentation(structure);

      const functionGap = result.gaps.find((gap) =>
        gap.description.includes("functions lack documentation")
      );
      expect(functionGap).toBeDefined();
    });
  });
});
