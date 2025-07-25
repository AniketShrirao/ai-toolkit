import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../index.js";

describe("Authentication API", () => {
  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "admin123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.username).toBe("admin");
    });

    it("should reject invalid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "admin",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("code", "AUTHENTICATION_ERROR");
    });

    it("should validate required fields", async () => {
      const response = await request(app).post("/api/auth/login").send({
        username: "admin",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });

  describe("POST /api/auth/register", () => {
    it("should register new user", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "testuser",
        password: "testpass123",
        role: "user",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.username).toBe("testuser");
    });

    it("should reject duplicate username", async () => {
      // First registration
      await request(app).post("/api/auth/register").send({
        username: "duplicate",
        password: "testpass123",
      });

      // Second registration with same username
      const response = await request(app).post("/api/auth/register").send({
        username: "duplicate",
        password: "testpass123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });

    it("should validate password length", async () => {
      const response = await request(app).post("/api/auth/register").send({
        username: "testuser2",
        password: "123", // Too short
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("code", "VALIDATION_ERROR");
    });
  });
});
