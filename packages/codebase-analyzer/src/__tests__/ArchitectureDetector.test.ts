import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArchitectureDetector } from "../analyzers/ArchitectureDetector.js";
import { mockOllamaService, createMockProjectStructure } from "./setup.js";

describe("ArchitectureDetector", () => {
  let detector: ArchitectureDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new ArchitectureDetector(mockOllamaService as any);
  });

  describe("detectArchitecture", () => {
    it("should detect MVC pattern", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "models", fileCount: 5, subdirectories: 0 },
          { path: "views", fileCount: 8, subdirectories: 0 },
          { path: "controllers", fileCount: 6, subdirectories: 0 },
        ],
        files: [
          { path: "models/User.js", language: "JavaScript" },
          { path: "views/UserView.js", language: "JavaScript" },
          { path: "controllers/UserController.js", language: "JavaScript" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const mvcPattern = result.patterns.find(
        (p) => p.name === "MVC (Model-View-Controller)"
      );
      expect(mvcPattern).toBeDefined();
      expect(mvcPattern?.confidence).toBeGreaterThan(0.5);
      expect(mvcPattern?.indicators).toContain(
        "Found models, views, controllers directories"
      );
    });

    it("should detect Layered Architecture pattern", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "presentation", fileCount: 5, subdirectories: 0 },
          { path: "business", fileCount: 8, subdirectories: 0 },
          { path: "data", fileCount: 6, subdirectories: 0 },
        ],
        files: [
          { path: "services/UserService.js", language: "JavaScript" },
          { path: "repositories/UserRepository.js", language: "JavaScript" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const layeredPattern = result.patterns.find(
        (p) => p.name === "Layered Architecture"
      );
      expect(layeredPattern).toBeDefined();
      expect(layeredPattern?.confidence).toBeGreaterThan(0);
    });

    it("should detect Microservices pattern", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "user-service", fileCount: 10, subdirectories: 2 },
          { path: "order-service", fileCount: 8, subdirectories: 2 },
          { path: "payment-service", fileCount: 6, subdirectories: 1 },
        ],
        files: [
          { path: "user-service/Dockerfile", language: "Unknown" },
          { path: "order-service/Dockerfile", language: "Unknown" },
          { path: "docker-compose.yml", language: "YAML" },
          { path: "user-service/package.json", language: "JSON" },
          { path: "order-service/package.json", language: "JSON" },
          { path: "payment-service/package.json", language: "JSON" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const microservicesPattern = result.patterns.find(
        (p) => p.name === "Microservices Architecture"
      );
      expect(microservicesPattern).toBeDefined();
      expect(microservicesPattern?.confidence).toBeGreaterThan(0.5);
    });

    it("should detect Component-Based Architecture", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "components", fileCount: 15, subdirectories: 3 },
          { path: "components/Button", fileCount: 3, subdirectories: 0 },
          { path: "components/Modal", fileCount: 4, subdirectories: 0 },
        ],
        files: [
          { path: "components/Button/Button.jsx", language: "JavaScript" },
          { path: "components/Modal/Modal.tsx", language: "TypeScript" },
          { path: "components/Header/Header.vue", language: "Unknown" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const componentPattern = result.patterns.find(
        (p) => p.name === "Component-Based Architecture"
      );
      expect(componentPattern).toBeDefined();
      expect(componentPattern?.confidence).toBeGreaterThan(0.5);
    });

    it("should detect Clean Architecture pattern", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "domain/entities", fileCount: 5, subdirectories: 0 },
          { path: "application/usecases", fileCount: 8, subdirectories: 0 },
          { path: "infrastructure/adapters", fileCount: 6, subdirectories: 0 },
        ],
        files: [
          { path: "domain/entities/User.ts", language: "TypeScript" },
          {
            path: "application/usecases/CreateUser.ts",
            language: "TypeScript",
          },
          {
            path: "infrastructure/adapters/UserRepository.ts",
            language: "TypeScript",
          },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const cleanArchPattern = result.patterns.find(
        (p) => p.name === "Clean Architecture"
      );
      expect(cleanArchPattern).toBeDefined();
      expect(cleanArchPattern?.confidence).toBeGreaterThan(0.5);
    });

    it("should detect Modular Architecture", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "modules/auth", fileCount: 8, subdirectories: 1 },
          { path: "modules/user", fileCount: 6, subdirectories: 1 },
          { path: "packages/utils", fileCount: 4, subdirectories: 0 },
        ],
        files: [
          { path: "modules/auth/index.ts", language: "TypeScript" },
          { path: "modules/user/index.ts", language: "TypeScript" },
          { path: "packages/utils/index.js", language: "JavaScript" },
          { path: "src/index.ts", language: "TypeScript" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const modularPattern = result.patterns.find(
        (p) => p.name === "Modular Architecture"
      );
      expect(modularPattern).toBeDefined();
      expect(modularPattern?.confidence).toBeGreaterThan(0);
    });

    it("should sort patterns by confidence", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "models", fileCount: 5, subdirectories: 0 },
          { path: "views", fileCount: 8, subdirectories: 0 },
          { path: "controllers", fileCount: 6, subdirectories: 0 },
          { path: "components", fileCount: 3, subdirectories: 0 },
        ],
        files: [
          { path: "models/User.js", language: "JavaScript" },
          { path: "views/UserView.js", language: "JavaScript" },
          { path: "controllers/UserController.js", language: "JavaScript" },
          { path: "components/Button.jsx", language: "JavaScript" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      expect(result.patterns.length).toBeGreaterThan(1);

      // Patterns should be sorted by confidence (highest first)
      for (let i = 1; i < result.patterns.length; i++) {
        expect(result.patterns[i - 1].confidence).toBeGreaterThanOrEqual(
          result.patterns[i].confidence
        );
      }
    });

    it("should identify primary pattern when confidence is high", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "models", fileCount: 5, subdirectories: 0 },
          { path: "views", fileCount: 8, subdirectories: 0 },
          { path: "controllers", fileCount: 6, subdirectories: 0 },
        ],
        files: [
          { path: "models/User.js", language: "JavaScript" },
          { path: "models/Product.js", language: "JavaScript" },
          { path: "views/UserView.js", language: "JavaScript" },
          { path: "views/ProductView.js", language: "JavaScript" },
          { path: "controllers/UserController.js", language: "JavaScript" },
          { path: "controllers/ProductController.js", language: "JavaScript" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      expect(result.primaryPattern).toBeDefined();
      expect(result.primaryPattern?.confidence).toBeGreaterThan(0.6);
    });

    it("should not identify primary pattern when confidence is low", async () => {
      const structure = createMockProjectStructure({
        directories: [{ path: "src", fileCount: 10, subdirectories: 0 }],
        files: [
          { path: "src/app.js", language: "JavaScript" },
          { path: "src/utils.js", language: "JavaScript" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      expect(result.primaryPattern).toBeUndefined();
    });
  });

  describe("recommendations generation", () => {
    it("should recommend adopting architecture pattern when none detected", async () => {
      const structure = createMockProjectStructure({
        directories: [{ path: "src", fileCount: 10, subdirectories: 0 }],
        files: [{ path: "src/app.js", language: "JavaScript" }],
      });

      const result = await detector.detectArchitecture(structure);

      expect(result.recommendations).toContain(
        "Consider adopting a clear architecture pattern to improve code organization and maintainability"
      );
    });

    it("should recommend consolidation when multiple patterns detected", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "models", fileCount: 5, subdirectories: 0 },
          { path: "views", fileCount: 8, subdirectories: 0 },
          { path: "controllers", fileCount: 6, subdirectories: 0 },
          { path: "components", fileCount: 10, subdirectories: 2 },
        ],
        files: [
          { path: "models/User.js", language: "JavaScript" },
          { path: "views/UserView.js", language: "JavaScript" },
          { path: "controllers/UserController.js", language: "JavaScript" },
          { path: "components/Button.jsx", language: "JavaScript" },
          { path: "components/Modal.jsx", language: "JavaScript" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const consolidationRecommendation = result.recommendations.find((r) =>
        r.includes("Multiple architecture patterns detected")
      );
      expect(consolidationRecommendation).toBeDefined();
    });

    it("should recommend adding test structure when missing", async () => {
      const structure = createMockProjectStructure({
        directories: [{ path: "src", fileCount: 10, subdirectories: 0 }],
        files: [{ path: "src/app.js", language: "JavaScript" }],
      });

      const result = await detector.detectArchitecture(structure);

      expect(result.recommendations).toContain(
        "Add a clear testing structure to support your architecture pattern"
      );
    });

    it("should recommend adding documentation when missing", async () => {
      const structure = createMockProjectStructure({
        directories: [{ path: "src", fileCount: 10, subdirectories: 0 }],
        files: [{ path: "src/app.js", language: "JavaScript" }],
      });

      const result = await detector.detectArchitecture(structure);

      expect(result.recommendations).toContain(
        "Add architectural documentation to help team members understand the chosen patterns"
      );
    });

    it("should not recommend test structure when tests exist", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "src", fileCount: 10, subdirectories: 0 },
          { path: "test", fileCount: 5, subdirectories: 0 },
        ],
        files: [
          { path: "src/app.js", language: "JavaScript" },
          { path: "test/app.test.js", language: "JavaScript" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const testRecommendation = result.recommendations.find((r) =>
        r.includes("Add a clear testing structure")
      );
      expect(testRecommendation).toBeUndefined();
    });

    it("should not recommend documentation when README exists", async () => {
      const structure = createMockProjectStructure({
        directories: [{ path: "src", fileCount: 10, subdirectories: 0 }],
        files: [
          { path: "src/app.js", language: "JavaScript" },
          { path: "README.md", language: "Markdown" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const docRecommendation = result.recommendations.find((r) =>
        r.includes("Add architectural documentation")
      );
      expect(docRecommendation).toBeUndefined();
    });
  });

  describe("framework-specific detection", () => {
    it("should detect Spring MVC pattern", async () => {
      const structure = createMockProjectStructure({
        directories: [
          {
            path: "src/main/java/com/example/controller",
            fileCount: 5,
            subdirectories: 0,
          },
        ],
        files: [
          {
            path: "src/main/java/com/example/controller/UserController.java",
            language: "Java",
          },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const mvcPattern = result.patterns.find(
        (p) => p.name === "MVC (Model-View-Controller)"
      );
      expect(mvcPattern).toBeDefined();
      expect(mvcPattern?.indicators).toContain("Detected Spring MVC structure");
    });

    it("should detect Rails MVC pattern", async () => {
      const structure = createMockProjectStructure({
        directories: [
          { path: "app/controllers", fileCount: 5, subdirectories: 0 },
        ],
        files: [
          { path: "app/controllers/users_controller.rb", language: "Ruby" },
        ],
      });

      const result = await detector.detectArchitecture(structure);

      const mvcPattern = result.patterns.find(
        (p) => p.name === "MVC (Model-View-Controller)"
      );
      expect(mvcPattern).toBeDefined();
      expect(mvcPattern?.indicators).toContain(
        "Detected Rails/Laravel MVC structure"
      );
    });
  });
});
