import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app";

describe("health API", () => {
  const app = createApp();

  it("returns 503 while MongoDB is disconnected", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({
      success: false,
      status: "degraded",
      database: "disconnected",
    });
  });
});
