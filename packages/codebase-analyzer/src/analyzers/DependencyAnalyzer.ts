import { promises as fs } from "fs";
import * as path from "path";
import {
  Dependency,
  SecurityVulnerability,
} from "@ai-toolkit/shared/types/analysis.js";

export class DependencyAnalyzer {
  /**
   * Analyze dependencies from package.json files
   */
  async analyzeDependencies(rootPath: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];

    try {
      // Look for package.json files
      const packageJsonPaths = await this.findPackageJsonFiles(rootPath);

      for (const packageJsonPath of packageJsonPaths) {
        const packageDeps = await this.analyzePackageJson(packageJsonPath);
        dependencies.push(...packageDeps);
      }

      // Remove duplicates and merge information
      return this.mergeDependencies(dependencies);
    } catch (error) {
      console.warn("Failed to analyze dependencies:", error);
      return [];
    }
  }

  /**
   * Find all package.json files in the project
   */
  private async findPackageJsonFiles(rootPath: string): Promise<string[]> {
    const packageJsonFiles: string[] = [];

    const searchDirectory = async (
      dirPath: string,
      depth: number = 0
    ): Promise<void> => {
      if (depth > 5) return; // Limit search depth

      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isFile() && entry.name === "package.json") {
            packageJsonFiles.push(fullPath);
          } else if (
            entry.isDirectory() &&
            !this.shouldSkipDirectory(entry.name)
          ) {
            await searchDirectory(fullPath, depth + 1);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    await searchDirectory(rootPath);
    return packageJsonFiles;
  }

  /**
   * Analyze a single package.json file
   */
  private async analyzePackageJson(
    packageJsonPath: string
  ): Promise<Dependency[]> {
    try {
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(content);

      const dependencies: Dependency[] = [];

      // Production dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(
          packageJson.dependencies
        )) {
          dependencies.push({
            name,
            version: version as string,
            type: "production",
            outdated: this.isVersionOutdated(version as string),
            vulnerabilities: await this.checkVulnerabilities(
              name,
              version as string
            ),
          });
        }
      }

      // Development dependencies
      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(
          packageJson.devDependencies
        )) {
          dependencies.push({
            name,
            version: version as string,
            type: "development",
            outdated: this.isVersionOutdated(version as string),
            vulnerabilities: await this.checkVulnerabilities(
              name,
              version as string
            ),
          });
        }
      }

      // Peer dependencies
      if (packageJson.peerDependencies) {
        for (const [name, version] of Object.entries(
          packageJson.peerDependencies
        )) {
          dependencies.push({
            name,
            version: version as string,
            type: "peer",
            outdated: this.isVersionOutdated(version as string),
            vulnerabilities: await this.checkVulnerabilities(
              name,
              version as string
            ),
          });
        }
      }

      return dependencies;
    } catch (error) {
      console.warn(`Failed to analyze ${packageJsonPath}:`, error);
      return [];
    }
  }

  /**
   * Merge duplicate dependencies from different package.json files
   */
  private mergeDependencies(dependencies: Dependency[]): Dependency[] {
    const merged = new Map<string, Dependency>();

    for (const dep of dependencies) {
      const existing = merged.get(dep.name);
      if (existing) {
        // Merge vulnerabilities and keep the most restrictive type
        const mergedVulns = [
          ...(existing.vulnerabilities || []),
          ...(dep.vulnerabilities || []),
        ];

        // Remove duplicate vulnerabilities
        const uniqueVulns = mergedVulns.filter(
          (vuln, index, arr) => arr.findIndex((v) => v.id === vuln.id) === index
        );

        merged.set(dep.name, {
          ...existing,
          vulnerabilities: uniqueVulns.length > 0 ? uniqueVulns : undefined,
          outdated: existing.outdated || dep.outdated,
          type: this.getMostRestrictiveType(existing.type, dep.type),
        });
      } else {
        merged.set(dep.name, dep);
      }
    }

    return Array.from(merged.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }

  /**
   * Check if a version string indicates an outdated dependency
   */
  private isVersionOutdated(version: string): boolean {
    // Simple heuristic: versions with ^ or ~ are potentially outdated
    // In a real implementation, this would check against npm registry
    if (version.startsWith("^") || version.startsWith("~")) {
      // Extract version number and check if it's old
      const versionNumber = version.substring(1);
      const parts = versionNumber.split(".");
      if (parts.length >= 2) {
        const major = parseInt(parts[0]);
        const minor = parseInt(parts[1]);

        // Very simple heuristic: consider old if major version is < 1 or very old
        return major === 0 || (major === 1 && minor < 5);
      }
    }

    return false;
  }

  /**
   * Check for known vulnerabilities (simplified implementation)
   */
  private async checkVulnerabilities(
    name: string,
    version: string
  ): Promise<SecurityVulnerability[] | undefined> {
    // In a real implementation, this would check against vulnerability databases
    // For now, we'll simulate some common vulnerable packages
    const knownVulnerablePackages = [
      "lodash",
      "moment",
      "request",
      "node-sass",
      "serialize-javascript",
    ];

    if (knownVulnerablePackages.includes(name)) {
      return [
        {
          id: `${name}-vuln-1`,
          severity: "medium",
          description: `Potential security vulnerability in ${name}`,
          fixAvailable: true,
        },
      ];
    }

    return undefined;
  }

  /**
   * Get the most restrictive dependency type
   */
  private getMostRestrictiveType(
    type1: Dependency["type"],
    type2: Dependency["type"]
  ): Dependency["type"] {
    const hierarchy: Dependency["type"][] = [
      "production",
      "peer",
      "development",
    ];
    const index1 = hierarchy.indexOf(type1);
    const index2 = hierarchy.indexOf(type2);
    return hierarchy[Math.min(index1, index2)];
  }

  /**
   * Check if directory should be skipped during search
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      "coverage",
      ".nyc_output",
      "tmp",
      "temp",
    ];
    return skipDirs.includes(dirName);
  }
}
