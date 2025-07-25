import { beforeAll, afterAll, beforeEach } from "vitest";
import { app, server } from "../index.js";

// Test database setup
beforeAll(async () => {
  // Initialize test database
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret";
});

afterAll(async () => {
  // Close server
  if (server) {
    server.close();
  }
});

beforeEach(async () => {
  // Clean up test data before each test
  // This would typically reset the test database
});
