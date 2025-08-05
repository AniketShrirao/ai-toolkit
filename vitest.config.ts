import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ['./test/setup.ts'],
    include: [
      "packages/*/src/**/*.test.ts",
      "packages/*/src/**/*.test.tsx",
      "test/**/*.test.ts",
      "test/**/*.test.tsx",
      "test/**/*.spec.ts",
      "test/**/*.spec.tsx",
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
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
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
