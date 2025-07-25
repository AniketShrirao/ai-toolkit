import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "fs";
import { DependencyAnalyzer } from "../analyzers/DependencyAnalyzer.js";

describe("DependencyAnalyzer", () => {
  let analyzer: DependencyAnalyzer;
  const mockFs = fs as any;

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new DependencyAnalyzer();
  });

  describe("analyzeDependencies", () => {
    it("should analyze package.json dependencies", async () => {
      const packageJson = {
        dependencies: {
          react: "^18.0.0",
          lodash: "^4.17.21",
        },
        devDependencies: {
          typescript: "^5.0.0",
          vitest: "^1.0.0",
        },
      };

      mockFs.readdir.mockResolvedValue([
        { name: "package.json", isFile: () => true, isDirectory: () => false },
      ]);
      mockFs.readFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await analyzer.analyzeDependencies("/test/project");

      expect(result).toHaveLength(4);
      expect(result).toContainEqual(
        expect.objectContaining({
          name: "react",
          version: "^18.0.0",
          type: "production",
        })
      );
      expect(result).toContainEqual(
        expect.objectContaining({
          name: "typescript",
          version: "^5.0.0",
          type: "development",
        })
      );
    });

    it("should handle peer dependencies", async () => {
      const packageJson = {
        peerDependencies: {
          react: ">=16.0.0",
        },
      };

      mockFs.readdir.mockResolvedValue([
        { name: "package.json", isFile: () => true, isDirectory: () => false },
      ]);
      mockFs.readFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await analyzer.analyzeDependencies("/test/project");

      expect(result).toContainEqual(
        expect.objectContaining({
          name: "react",
          version: ">=16.0.0",
          type: "peer",
        })
      );
    });

    it("should detect outdated dependencies", async () => {
      const packageJson = {
        dependencies: {
          "old-package": "^0.5.0",
          "newer-package": "^2.1.0",
        },
      };

      mockFs.readdir.mockResolvedValue([
        { name: "package.json", isFile: () => true, isDirectory: () => false },
      ]);
      mockFs.readFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await analyzer.analyzeDependencies("/test/project");

      const oldPackage = result.find((dep) => dep.name === "old-package");
      const newerPackage = result.find((dep) => dep.name === "newer-package");

      expect(oldPackage?.outdated).toBe(true);
      expect(newerPackage?.outdated).toBe(false);
    });

    it("should identify vulnerable packages", async () => {
      const packageJson = {
        dependencies: {
          lodash: "^4.17.20",
          "safe-package": "^1.0.0",
        },
      };

      mockFs.readdir.mockResolvedValue([
        { name: "package.json", isFile: () => true, isDirectory: () => false },
      ]);
      mockFs.readFile.mockResolvedValue(JSON.stringify(packageJson));

      const result = await analyzer.analyzeDependencies("/test/project");

      const lodashDep = result.find((dep) => dep.name === "lodash");
      const safeDep = result.find((dep) => dep.name === "safe-package");

      expect(lodashDep?.vulnerabilities).toBeDefined();
      expect(lodashDep?.vulnerabilities).toHaveLength(1);
      expect(safeDep?.vulnerabilities).toBeUndefined();
    });

    it("should merge dependencies from multiple package.json files", async () => {
      const rootPackageJson = {
        dependencies: {
          "shared-dep": "^1.0.0",
        },
      };

      const subPackageJson = {
        dependencies: {
          "shared-dep": "^1.0.0",
          "sub-dep": "^2.0.0",
        },
      };

      mockFs.readdir
        .mockResolvedValueOnce([
          {
            name: "package.json",
            isFile: () => true,
            isDirectory: () => false,
          },
          { name: "packages", isFile: () => false, isDirectory: () => true },
        ])
        .mockResolvedValueOnce([
          {
            name: "package.json",
            isFile: () => true,
            isDirectory: () => false,
          },
        ])
        .mockResolvedValueOnce([]);

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(rootPackageJson))
        .mockResolvedValueOnce(JSON.stringify(subPackageJson));

      const result = await analyzer.analyzeDependencies("/test/project");

      expect(result).toHaveLength(2);
      expect(result.find((dep) => dep.name === "shared-dep")).toBeDefined();
      expect(result.find((dep) => dep.name === "sub-dep")).toBeDefined();
    });

    it("should handle malformed package.json files", async () => {
      mockFs.readdir.mockResolvedValue([
        { name: "package.json", isFile: () => true, isDirectory: () => false },
      ]);
      mockFs.readFile.mockResolvedValue("invalid json");

      const result = await analyzer.analyzeDependencies("/test/project");

      expect(result).toHaveLength(0);
    });

    it("should skip node_modules and other excluded directories", async () => {
      mockFs.readdir.mockResolvedValue([
        { name: "node_modules", isFile: () => false, isDirectory: () => true },
        { name: ".git", isFile: () => false, isDirectory: () => true },
        { name: "src", isFile: () => false, isDirectory: () => true },
      ]);

      const result = await analyzer.analyzeDependencies("/test/project");

      // Should not try to read from excluded directories
      expect(mockFs.readdir).toHaveBeenCalledTimes(1);
    });

    it("should handle file system errors gracefully", async () => {
      mockFs.readdir.mockRejectedValue(new Error("Permission denied"));

      const result = await analyzer.analyzeDependencies("/test/project");

      expect(result).toHaveLength(0);
    });
  });

  describe("dependency type prioritization", () => {
    it("should prioritize production over development dependencies", async () => {
      const packageJson1 = {
        dependencies: {
          "shared-dep": "^1.0.0",
        },
      };

      const packageJson2 = {
        devDependencies: {
          "shared-dep": "^1.0.0",
        },
      };

      mockFs.readdir
        .mockResolvedValueOnce([
          {
            name: "package.json",
            isFile: () => true,
            isDirectory: () => false,
          },
          { name: "sub", isFile: () => false, isDirectory: () => true },
        ])
        .mockResolvedValueOnce([
          {
            name: "package.json",
            isFile: () => true,
            isDirectory: () => false,
          },
        ])
        .mockResolvedValueOnce([]);

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(packageJson1))
        .mockResolvedValueOnce(JSON.stringify(packageJson2));

      const result = await analyzer.analyzeDependencies("/test/project");

      const sharedDep = result.find((dep) => dep.name === "shared-dep");
      expect(sharedDep?.type).toBe("production");
    });

    it("should prioritize peer over development dependencies", async () => {
      const packageJson1 = {
        peerDependencies: {
          "shared-dep": "^1.0.0",
        },
      };

      const packageJson2 = {
        devDependencies: {
          "shared-dep": "^1.0.0",
        },
      };

      mockFs.readdir
        .mockResolvedValueOnce([
          {
            name: "package.json",
            isFile: () => true,
            isDirectory: () => false,
          },
          { name: "sub", isFile: () => false, isDirectory: () => true },
        ])
        .mockResolvedValueOnce([
          {
            name: "package.json",
            isFile: () => true,
            isDirectory: () => false,
          },
        ])
        .mockResolvedValueOnce([]);

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(packageJson1))
        .mockResolvedValueOnce(JSON.stringify(packageJson2));

      const result = await analyzer.analyzeDependencies("/test/project");

      const sharedDep = result.find((dep) => dep.name === "shared-dep");
      expect(sharedDep?.type).toBe("peer");
    });
  });

  describe("vulnerability detection", () => {
    it("should merge vulnerabilities from multiple sources", async () => {
      const packageJson1 = {
        dependencies: {
          lodash: "^4.17.20",
        },
      };

      const packageJson2 = {
        dependencies: {
          lodash: "^4.17.20",
        },
      };

      mockFs.readdir
        .mockResolvedValueOnce([
          {
            name: "package.json",
            isFile: () => true,
            isDirectory: () => false,
          },
          { name: "sub", isFile: () => false, isDirectory: () => true },
        ])
        .mockResolvedValueOnce([
          {
            name: "package.json",
            isFile: () => true,
            isDirectory: () => false,
          },
        ])
        .mockResolvedValueOnce([]);

      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(packageJson1))
        .mockResolvedValueOnce(JSON.stringify(packageJson2));

      const result = await analyzer.analyzeDependencies("/test/project");

      const lodashDep = result.find((dep) => dep.name === "lodash");
      expect(lodashDep?.vulnerabilities).toHaveLength(1);
    });
  });
});
