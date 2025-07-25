import { vi } from "vitest";

// Mock file system operations
vi.mock("fs", async () => {
  const actual = await vi.importActual("fs");
  return {
    ...actual,
    promises: {
      readFile: vi.fn(),
      readdir: vi.fn(),
      stat: vi.fn(),
    },
  };
});

// Mock glob
vi.mock("glob", () => ({
  glob: vi.fn(),
}));

// Mock Ollama service
export const mockOllamaService = {
  generateText: vi.fn(),
  analyzeDocument: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
  connect: vi.fn().mockResolvedValue(true),
};

// Test data generators
export const createMockFileInfo = (overrides: any = {}) => ({
  path: "src/test.ts",
  size: 1024,
  lines: 50,
  language: "TypeScript",
  lastModified: new Date(),
  ...overrides,
});

export const createMockDirectoryInfo = (overrides: any = {}) => ({
  path: "src",
  fileCount: 5,
  subdirectories: 2,
  purpose: "Source code",
  ...overrides,
});

export const createMockProjectStructure = (overrides: any = {}) => ({
  rootPath: "/test/project",
  directories: [
    createMockDirectoryInfo({ path: "src" }),
    createMockDirectoryInfo({ path: "test", purpose: "Tests" }),
  ],
  files: [
    createMockFileInfo({ path: "src/index.ts" }),
    createMockFileInfo({ path: "src/utils.ts" }),
    createMockFileInfo({ path: "test/index.test.ts", language: "TypeScript" }),
  ],
  totalFiles: 3,
  totalLines: 150,
  languages: [
    { language: "TypeScript", files: 3, lines: 150, percentage: 100 },
  ],
  ...overrides,
});

export const createMockCodebaseAnalysis = (overrides: any = {}) => ({
  structure: createMockProjectStructure(),
  dependencies: [],
  metrics: {
    complexity: 5.2,
    maintainability: 85,
    duplicateCode: 2.1,
    technicalDebt: 15,
  },
  issues: [],
  documentation: [],
  recommendations: [],
  ...overrides,
});
