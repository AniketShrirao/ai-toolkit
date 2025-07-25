import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../index.js";

describe("Estimation API", () => {
  let authToken: string;

  beforeAll(async () => {
    // Get auth token for protected routes
    const loginResponse = await request(app).post("/api/auth/login").send({
      username: "admin",
      password: "admin123",
    });

    authToken = loginResponse.body.token;
  });

  describe("POST /api/estimation/estimate", () => {
    const validRequirements = [
      {
        id: "1",
        type: "functional",
        priority: "high",
        description: "User authentication system",
        acceptanceCriteria: ["Users can login", "Users can logout"],
        complexity: 5,
        estimatedHours: 20,
      },
      {
        id: "2",
        type: "non-functional",
        priority: "medium",
        description: "System performance requirements",
        acceptanceCriteria: ["Response time < 2s"],
        complexity: 3,
        estimatedHours: 10,
      },
    ];

    it("should require authentication", async () => {
      const response = await request(app)
        .post("/api/estimation/estimate")
        .send({ requirements: validRequirements });

      expect(response.status).toBe(401);
    });

    it("should generate estimation with valid requirements", async () => {
      const response = await request(app)
        .post("/api/estimation/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          requirements: validRequirements,
          hourlyRate: 100,
          complexityMultiplier: 1.2,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("totalHours");
      expect(response.body).toHaveProperty("totalCost");
      expect(response.body).toHaveProperty("breakdown");
      expect(response.body).toHaveProperty("risks");
      expect(response.body).toHaveProperty("confidence");
    });

    it("should validate requirements format", async () => {
      const response = await request(app)
        .post("/api/estimation/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          requirements: [
            {
              // Missing required fields
              description: "Invalid requirement",
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should validate requirement types", async () => {
      const response = await request(app)
        .post("/api/estimation/estimate")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          requirements: [
            {
              id: "1",
              type: "invalid-type", // Invalid type
              priority: "high",
              description: "Test requirement",
              acceptanceCriteria: ["Test criteria"],
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("POST /api/estimation/complexity", () => {
    it("should calculate complexity for requirements", async () => {
      const requirements = [
        {
          id: "1",
          type: "functional",
          priority: "high",
          description: "Complex feature with multiple integrations",
          acceptanceCriteria: [
            "Integration A",
            "Integration B",
            "Complex logic",
          ],
        },
      ];

      const response = await request(app)
        .post("/api/estimation/complexity")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ requirements });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("overallComplexity");
      expect(response.body).toHaveProperty("breakdown");
    });
  });

  describe("GET /api/estimation/history", () => {
    it("should return estimation history", async () => {
      const response = await request(app)
        .get("/api/estimation/history")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("estimations");
      expect(response.body).toHaveProperty("pagination");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get("/api/estimation/history?page=1&limit=5")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });
  });
});
