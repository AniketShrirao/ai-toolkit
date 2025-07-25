import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../index.js";

describe("Health API", () => {
  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "healthy");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(typeof response.body.uptime).toBe("number");
    });

    it("should not require authentication", async () => {
      const response = await request(app).get("/api/health");

      expect(response.status).toBe(200);
    });
  });
});
