import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { TestDataManager } from "./utils/TestDataManager.js";
import { MockOllamaServer } from "./utils/MockOllamaServer.js";
import { TestLogger } from "./utils/TestLogger.js";

// Import testing library matchers
import '@testing-library/jest-dom';

// Mock fetch globally for all tests
import { vi } from 'vitest';

// Create a mock fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Make mockFetch available globally
declare global {
  var mockFetch: typeof vi.fn;
}
global.mockFetch = mockFetch;

// Global test setup
let testDataManager: TestDataManager;
let mockOllamaServer: MockOllamaServer;
let testLogger: TestLogger;

beforeAll(async () => {
  // Initialize test logger
  testLogger = new TestLogger();
  testLogger.setLevel("error"); // Reduce noise during tests

  // Initialize test data manager
  testDataManager = new TestDataManager();
  await testDataManager.initialize();

  // Start mock Ollama server for integration tests
  mockOllamaServer = new MockOllamaServer();
  await mockOllamaServer.start();

  // Set environment variables for testing
  process.env.NODE_ENV = "test";
  process.env.OLLAMA_HOST = "http://localhost:11434";
  process.env.TEST_MODE = "true";
});

afterAll(async () => {
  // Cleanup test data
  if (testDataManager) {
    await testDataManager.cleanup();
  }

  // Stop mock Ollama server
  if (mockOllamaServer) {
    await mockOllamaServer.stop();
  }

  // Reset environment
  delete process.env.TEST_MODE;
});

beforeEach(() => {
  // Clear any cached data before each test
  if (testDataManager) {
    testDataManager.clearCache();
  }
  
  // Reset fetch mock before each test
  vi.clearAllMocks();
  mockFetch.mockClear();
});

afterEach(() => {
  // Cleanup after each test
  if (testLogger) {
    testLogger.clearLogs();
  }
});

// Make utilities available globally for tests
declare global {
  var testDataManager: TestDataManager;
  var mockOllamaServer: MockOllamaServer;
  var testLogger: TestLogger;
}

global.testDataManager = testDataManager;
global.mockOllamaServer = mockOllamaServer;
global.testLogger = testLogger;
