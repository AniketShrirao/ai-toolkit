import { describe, it, expect, vi } from "vitest";
import { CodebaseAnalyzer } from "../CodebaseAnalyzer.js";

// Mock OllamaService
const mockOllamaService = {
  generateText: vi.fn(),
  analyzeDocument: vi.fn(),
  isConnected: vi.fn().mockReturnValue(true),
  connect: vi.fn().mockResolvedValue(true),
};

describe("CodebaseAnalyzer - Basic Functionality", () => {
  it("should create analyzer instance successfully", () => {
    const analyzer = new CodebaseAnalyzer(mockOllamaService as any);
    expect(analyzer).toBeDefined();
    expect(analyzer).toBeInstanceOf(CodebaseAnalyzer);
  });

  it("should have all required methods", () => {
    const analyzer = new CodebaseAnalyzer(mockOllamaService as any);
    expect(typeof analyzer.analyzeCodebase).toBe("function");
  });

  it("should handle invalid path gracefully", async () => {
    const analyzer = new CodebaseAnalyzer(mockOllamaService as any);

    await expect(
      analyzer.analyzeCodebase("/nonexistent/path")
    ).rejects.toThrow();
  });
});
