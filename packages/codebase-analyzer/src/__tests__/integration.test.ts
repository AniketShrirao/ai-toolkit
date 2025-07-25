import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "fs";
import { glob } from "glob";
import { CodebaseAnalyzer } from "../CodebaseAnalyzer.js";
import { mockOllamaService } from "./setup.js";

describe("CodebaseAnalyzer Integration Tests", () => {
  let analyzer: CodebaseAnalyzer;
  const mockFs = fs as any;
  const mockGlob = glob as any;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new CodebaseAnalyzer(mockOllamaService as any);
  });

  describe("Real-world codebase scenarios", () => {
    it("should analyze a typical React project structure", async () => {
      // Mock a typical React project
      mockGlob.mockResolvedValue([
        "/project/src/App.jsx",
        "/project/src/components/Header.jsx",
        "/project/src/components/Footer.jsx",
        "/project/src/hooks/useAuth.js",
        "/project/src/services/api.js",
        "/project/src/utils/helpers.js",
        "/project/public/index.html",
        "/project/package.json",
        "/project/README.md",
      ]);

      mockFs.stat.mockResolvedValue({
        size: 2048,
        mtime: new Date(),
        isDirectory: () => false,
      });

      const fileContents = {
        "/project/src/App.jsx": `
          import React from 'react';
          import Header from './components/Header';
          import Footer from './components/Footer';
          
          function App() {
            return (
              <div>
                <Header />
                <main>Content</main>
                <Footer />
              </div>
            );
          }
          
          export default App;
        `,
        "/project/src/components/Header.jsx": `
          import React from 'react';
          import { useAuth } from '../hooks/useAuth';
          
          const Header = () => {
            const { user } = useAuth();
            return <header>Welcome {user?.name}</header>;
          };
          
          export default Header;
        `,
        "/project/package.json": JSON.stringify({
          name: "react-app",
          dependencies: {
            react: "^18.0.0",
            "react-dom": "^18.0.0",
          },
          devDependencies: {
            vite: "^4.0.0",
            "@types/react": "^18.0.0",
          },
        }),
      };

      mockFs.readFile.mockImplementation((path: string) => {
        return Promise.resolve(
          fileContents[path] || 'console.log("default content");'
        );
      });

      const result = await analyzer.analyzeCodebase("/project");

      // Verify structure analysis
      expect(result.structure.totalFiles).toBeGreaterThan(0);
      expect(result.structure.languages).toContainEqual(
        expect.objectContaining({ language: "JavaScript" })
      );

      // Verify dependencies were analyzed
      expect(result.dependencies.length).toBeGreaterThan(0);
      expect(result.dependencies).toContainEqual(
        expect.objectContaining({ name: "react", type: "production" })
      );

      // Verify architecture detection
      expect(result.structure.directories).toContainEqual(
        expect.objectContaining({ path: "src/components" })
      );

      // Verify metrics calculation
      expect(result.metrics.complexity).toBeGreaterThanOrEqual(0);
      expect(result.metrics.maintainability).toBeGreaterThanOrEqual(0);
    });

    it("should analyze a Node.js Express API project", async () => {
      mockGlob.mockResolvedValue([
        "/api/src/app.js",
        "/api/src/routes/users.js",
        "/api/src/routes/auth.js",
        "/api/src/controllers/UserController.js",
        "/api/src/models/User.js",
        "/api/src/middleware/auth.js",
        "/api/src/config/database.js",
        "/api/tests/user.test.js",
        "/api/package.json",
      ]);

      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date(),
      });

      const fileContents = {
        "/api/src/app.js": `
          const express = require('express');
          const userRoutes = require('./routes/users');
          const authRoutes = require('./routes/auth');
          
          const app = express();
          app.use('/api/users', userRoutes);
          app.use('/api/auth', authRoutes);
          
          module.exports = app;
        `,
        "/api/src/controllers/UserController.js": `
          const User = require('../models/User');
          
          class UserController {
            async getUsers(req, res) {
              const users = await User.findAll();
              res.json(users);
            }
            
            async createUser(req, res) {
              const user = await User.create(req.body);
              res.status(201).json(user);
            }
          }
          
          module.exports = UserController;
        `,
        "/api/package.json": JSON.stringify({
          name: "express-api",
          dependencies: {
            express: "^4.18.0",
            sequelize: "^6.28.0",
          },
          devDependencies: {
            jest: "^29.0.0",
            supertest: "^6.3.0",
          },
        }),
      };

      mockFs.readFile.mockImplementation((path: string) => {
        return Promise.resolve(fileContents[path] || 'console.log("default");');
      });

      const result = await analyzer.analyzeCodebase("/api");

      // Should detect MVC-like pattern
      const patterns = result.structure.directories.map((d) => d.purpose);
      expect(patterns).toContain("Tests");

      // Should detect Node.js dependencies
      expect(result.dependencies).toContainEqual(
        expect.objectContaining({ name: "express" })
      );

      // Should have reasonable metrics
      expect(result.metrics.complexity).toBeGreaterThan(0);
    });

    it("should handle a monorepo structure", async () => {
      mockGlob.mockResolvedValue([
        "/monorepo/packages/frontend/src/App.tsx",
        "/monorepo/packages/backend/src/server.ts",
        "/monorepo/packages/shared/src/types.ts",
        "/monorepo/packages/frontend/package.json",
        "/monorepo/packages/backend/package.json",
        "/monorepo/packages/shared/package.json",
        "/monorepo/package.json",
      ]);

      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date(),
      });

      const packageJsons = {
        "/monorepo/package.json": JSON.stringify({
          name: "monorepo",
          workspaces: ["packages/*"],
        }),
        "/monorepo/packages/frontend/package.json": JSON.stringify({
          name: "@monorepo/frontend",
          dependencies: {
            react: "^18.0.0",
            "@monorepo/shared": "workspace:*",
          },
        }),
        "/monorepo/packages/backend/package.json": JSON.stringify({
          name: "@monorepo/backend",
          dependencies: {
            express: "^4.18.0",
            "@monorepo/shared": "workspace:*",
          },
        }),
        "/monorepo/packages/shared/package.json": JSON.stringify({
          name: "@monorepo/shared",
          dependencies: {},
        }),
      };

      mockFs.readFile.mockImplementation((path: string) => {
        if (path.endsWith("package.json")) {
          return Promise.resolve(packageJsons[path] || "{}");
        }
        return Promise.resolve('export const test = "code";');
      });

      const result = await analyzer.analyzeCodebase("/monorepo");

      // Should detect multiple package.json files
      expect(result.dependencies.length).toBeGreaterThan(0);

      // Should detect TypeScript
      expect(result.structure.languages).toContainEqual(
        expect.objectContaining({ language: "TypeScript" })
      );

      // Should suggest microservices architecture due to multiple packages
      expect(result.structure.directories.length).toBeGreaterThan(0);
    });

    it("should handle a project with quality issues", async () => {
      mockGlob.mockResolvedValue([
        "/problematic/src/bad-code.js",
        "/problematic/src/security-issues.js",
        "/problematic/src/performance-problems.js",
      ]);

      mockFs.stat.mockResolvedValue({
        size: 5000,
        mtime: new Date(),
      });

      const problematicCode = {
        "/problematic/src/bad-code.js": `
          var globalVar = "bad practice";
          
          function veryComplexFunction(a, b, c, d, e, f, g, h, i, j) {
            if (a == null) {
              for (let x = 0; x < 1000; x++) {
                for (let y = 0; y < 1000; y++) {
                  if (b && c && d) {
                    while (e) {
                      if (f || g) {
                        switch (h) {
                          case 1:
                            if (i) {
                              console.log("debug");
                              console.log("more debug");
                              console.log("even more debug");
                              console.log("too much debug");
                            }
                            break;
                          case 2:
                            if (j) {
                              // TODO: Fix this
                              // TODO: Refactor this
                              // TODO: Add tests
                              // TODO: Optimize
                              // TODO: Document
                              // TODO: Review
                            }
                            break;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        "/problematic/src/security-issues.js": `
          const password = "hardcoded-secret-123";
          const apiKey = "sk-1234567890abcdef";
          
          function unsafeQuery(userId) {
            const query = "SELECT * FROM users WHERE id = " + userId;
            return database.query(query);
          }
          
          function xssVulnerable(userInput) {
            document.innerHTML = userInput;
            eval(userInput);
          }
        `,
        "/problematic/src/performance-problems.js": `
          const fs = require('fs');
          
          function syncOperations() {
            const data1 = fs.readFileSync('file1.txt');
            const data2 = fs.readFileSync('file2.txt');
            const data3 = fs.readFileSync('file3.txt');
            return data1 + data2 + data3;
          }
          
          function nestedLoops() {
            for (let i = 0; i < 1000; i++) {
              for (let j = 0; j < 1000; j++) {
                for (let k = 0; k < 1000; k++) {
                  // O(n³) complexity
                }
              }
            }
          }
        `,
      };

      mockFs.readFile.mockImplementation((path: string) => {
        return Promise.resolve(
          problematicCode[path] || 'console.log("default");'
        );
      });

      const result = await analyzer.analyzeCodebase("/problematic");

      // Should detect multiple issues
      expect(result.issues.length).toBeGreaterThan(5);

      // Should detect security vulnerabilities
      const securityIssues = result.issues.filter(
        (issue) => issue.type === "vulnerability"
      );
      expect(securityIssues.length).toBeGreaterThan(0);

      // Should detect performance issues
      const performanceIssues = result.issues.filter(
        (issue) => issue.type === "performance"
      );
      expect(performanceIssues.length).toBeGreaterThan(0);

      // Should detect code smells
      const codeSmells = result.issues.filter(
        (issue) => issue.type === "code-smell"
      );
      expect(codeSmells.length).toBeGreaterThan(0);

      // Should have low maintainability score
      expect(result.metrics.maintainability).toBeLessThan(70);

      // Should have high complexity
      expect(result.metrics.complexity).toBeGreaterThan(5);

      // Should provide recommendations
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it("should handle circular dependencies in a real scenario", async () => {
      mockGlob.mockResolvedValue([
        "/circular/src/UserService.js",
        "/circular/src/OrderService.js",
        "/circular/src/PaymentService.js",
      ]);

      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date(),
      });

      const circularCode = {
        "/circular/src/UserService.js": `
          const OrderService = require('./OrderService');
          
          class UserService {
            getUserOrders(userId) {
              return OrderService.getOrdersByUser(userId);
            }
          }
          
          module.exports = UserService;
        `,
        "/circular/src/OrderService.js": `
          const PaymentService = require('./PaymentService');
          const UserService = require('./UserService');
          
          class OrderService {
            static getOrdersByUser(userId) {
              const user = UserService.getUser(userId);
              return this.processPayment(user.orders);
            }
            
            static processPayment(orders) {
              return PaymentService.processOrders(orders);
            }
          }
          
          module.exports = OrderService;
        `,
        "/circular/src/PaymentService.js": `
          const OrderService = require('./OrderService');
          
          class PaymentService {
            static processOrders(orders) {
              return orders.map(order => OrderService.calculateTotal(order));
            }
          }
          
          module.exports = PaymentService;
        `,
      };

      mockFs.readFile.mockImplementation((path: string) => {
        return Promise.resolve(circularCode[path] || 'console.log("default");');
      });

      const result = await analyzer.analyzeCodebase("/circular");

      // Should detect circular dependencies
      const circularIssues = result.issues.filter((issue) =>
        issue.description.includes("Circular dependency")
      );
      expect(circularIssues.length).toBeGreaterThan(0);

      // Should provide suggestions for fixing circular dependencies
      const circularSuggestions = circularIssues.map(
        (issue) => issue.suggestion
      );
      expect(
        circularSuggestions.some((suggestion) =>
          suggestion?.includes("dependency injection")
        )
      ).toBe(true);
    });

    it("should provide comprehensive analysis summary", async () => {
      mockGlob.mockResolvedValue([
        "/comprehensive/src/app.js",
        "/comprehensive/src/utils.js",
        "/comprehensive/test/app.test.js",
        "/comprehensive/package.json",
        "/comprehensive/README.md",
      ]);

      mockFs.stat.mockResolvedValue({
        size: 2048,
        mtime: new Date(),
      });

      mockFs.readFile.mockImplementation((path: string) => {
        if (path.endsWith("package.json")) {
          return Promise.resolve(
            JSON.stringify({
              name: "comprehensive-app",
              dependencies: { lodash: "^4.17.21" },
              devDependencies: { jest: "^29.0.0" },
            })
          );
        }
        return Promise.resolve('function test() { return "clean code"; }');
      });

      const result = await analyzer.analyzeCodebase("/comprehensive");

      // Should have complete analysis
      expect(result).toHaveProperty("structure");
      expect(result).toHaveProperty("dependencies");
      expect(result).toHaveProperty("metrics");
      expect(result).toHaveProperty("issues");
      expect(result).toHaveProperty("recommendations");

      // Structure should be well-analyzed
      expect(result.structure.totalFiles).toBeGreaterThan(0);
      expect(result.structure.totalLines).toBeGreaterThan(0);
      expect(result.structure.languages.length).toBeGreaterThan(0);

      // Should have reasonable metrics
      expect(result.metrics.complexity).toBeGreaterThanOrEqual(0);
      expect(result.metrics.maintainability).toBeGreaterThanOrEqual(0);
      expect(result.metrics.maintainability).toBeLessThanOrEqual(100);

      // Dependencies should be analyzed
      expect(result.dependencies.length).toBeGreaterThan(0);
    });
  });
});
