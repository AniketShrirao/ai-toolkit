import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/*/src/**/*.test.ts",
      "test/**/*.test.ts",
      "test/**/*.spec.ts",
    ],
    exclude: ["node_modules/**", "dist/**", "**/*.d.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/examples/**",
        "**/__mocks__/**",
        "**/test/**",
        "coverage/**",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 30000,
    hookTimeout: 10000,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },
  resolve: {
    alias: {
      "@test": path.resolve(__dirname, "./test"),
      "@fixtures": path.resolve(__dirname, "./test/fixtures"),
      "@utils": path.resolve(__dirname, "./test/utils"),
    },
  },
});
