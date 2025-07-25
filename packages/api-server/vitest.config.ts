import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@ai-toolkit/document-analyzer": path.resolve(
        __dirname,
        "./src/__mocks__/@ai-toolkit/document-analyzer.ts"
      ),
      "@ai-toolkit/estimation-engine": path.resolve(
        __dirname,
        "./src/__mocks__/@ai-toolkit/estimation-engine.ts"
      ),
      "@ai-toolkit/workflow-engine": path.resolve(
        __dirname,
        "./src/__mocks__/@ai-toolkit/workflow-engine.ts"
      ),
      "@ai-toolkit/data-layer": path.resolve(
        __dirname,
        "./src/__mocks__/@ai-toolkit/data-layer.ts"
      ),
      "@ai-toolkit/shared": path.resolve(
        __dirname,
        "./src/__mocks__/@ai-toolkit/shared.ts"
      ),
      "@ai-toolkit/ollama-interface": path.resolve(
        __dirname,
        "./src/__mocks__/@ai-toolkit/ollama-interface.ts"
      ),
    },
  },
});
