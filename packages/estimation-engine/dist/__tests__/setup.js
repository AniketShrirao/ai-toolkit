import { vi, beforeEach } from "vitest";
// Vitest setup file for estimation-engine tests
// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
};
// Setup test environment
beforeEach(() => {
    vi.clearAllMocks();
});
// Global test utilities
global.createMockRequirement = (overrides = {}) => ({
    id: "1",
    type: "functional",
    priority: "medium",
    description: "Test requirement",
    acceptanceCriteria: ["Test criteria"],
    complexity: 0,
    estimatedHours: 0,
    ...overrides,
});
global.createMockCodebaseAnalysis = (overrides = {}) => ({
    structure: { directories: [], files: [] },
    dependencies: [],
    metrics: {
        linesOfCode: 1000,
        complexity: 5,
        testCoverage: 0.8,
        technicalDebt: 0.3,
        maintainabilityIndex: 0.7,
    },
    issues: [],
    documentation: [],
    recommendations: [],
    ...overrides,
});
//# sourceMappingURL=setup.js.map