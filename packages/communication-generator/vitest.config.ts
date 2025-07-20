import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/setup.ts",
        "dist/",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@ai-toolkit/shared": "../shared/src",
      "@ai-toolkit/ollama-interface": "../ollama-interface/src",
    },
  },
});
