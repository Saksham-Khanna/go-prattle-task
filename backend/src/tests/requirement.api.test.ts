import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app";
import { Requirement } from "../models/Requirement";

function addDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const base = {
  eventName: "Circuitry — Annual Tech Fest 2027",
  eventType: "college-fest",
  startDate: addDays(10),
  endDate: addDays(12),
  location: "Pune",
  venue: "Central auditorium",
};

const additionalDetails = {
  facilities: ["stage", "meals"],
  availability: "Setup from 9 AM",
  qualifications: null,
  specialInstructions: null,
  notes: null,
};

const performerRequirements = {
  performanceType: "dj",
  genreOrStyle: "EDM",
  numberOfPerformers: 2,
  durationMinutes: 60,
  budgetRange: "50k-1l",
  technicalSetup: "DJ booth + PA for 500",
  experienceRequirement: null,
};

const plannerRequirements = {
  expectedAttendees: 800,
  services: ["venue-coordination", "catering"],
  planningScope: "Full 3-day fest planning including vendors and stage.",
  budgetRange: "1l-5l",
  experienceLevel: "experienced",
  additionalNotes: null,
};

const validPerformerPayload = {
  ...base,
  category: "performer",
  requirements: performerRequirements,
  additionalDetails,
};

describe("requirements API", () => {
  let mongo: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  beforeEach(async () => {
    await Requirement.deleteMany({});
  });

  it("returns 200 from the health endpoint while connected", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      status: "ok",
      database: "connected",
    });
  });

  it("returns 201 and persists a valid multi-day requirement", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send(validPerformerPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeTypeOf("string");
    expect(res.body.data.category).toBe("performer");

    const stored = await Requirement.findById(res.body.data.id).lean();
    expect(stored).not.toBeNull();
    expect(stored?.startDate.toISOString().slice(0, 10)).toBe(base.startDate);
    expect(stored?.endDate?.toISOString().slice(0, 10)).toBe(base.endDate);
  });

  it("returns 400 with field errors for an incompatible category payload", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send({
        ...base,
        category: "planner",
        requirements: performerRequirements,
        additionalDetails,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Validation failed");
    expect(res.body.errors).toContainEqual({
      field: "requirements.performanceType",
      message:
        "Performance type is a Performer field and isn't valid for a Planner requirement.",
    });
  });

  it("returns 400 with a clear message for an invalid numeric field", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send({
        ...validPerformerPayload,
        requirements: { ...performerRequirements, numberOfPerformers: "two" },
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContainEqual({
      field: "requirements.numberOfPerformers",
      message: "Number of performers must be a number.",
    });
  });

  it("returns 400 for a past event date", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send({ ...validPerformerPayload, startDate: addDays(-2), endDate: null });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContainEqual({
      field: "startDate",
      message: "Event date can't be in the past",
    });
  });

  it("returns 400 for a malformed MongoDB ID", async () => {
    const res = await request(app).get("/api/requirements/not-a-valid-id");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: "Invalid requirement ID format",
    });
  });

  it("returns 404 for a valid but nonexistent MongoDB ID", async () => {
    const res = await request(app).get(
      "/api/requirements/000000000000000000000000",
    );

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      success: false,
      message: "Requirement not found",
    });
  });

  it("returns the created record with ISO date strings", async () => {
    const created = await request(app)
      .post("/api/requirements")
      .send(validPerformerPayload);

    const res = await request(app).get(
      `/api/requirements/${created.body.data.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: created.body.data.id,
      category: "performer",
      startDate: base.startDate,
      endDate: base.endDate,
      status: "submitted",
    });
    expect(typeof res.body.data.createdAt).toBe("string");
    expect(Number.isNaN(Date.parse(res.body.data.createdAt))).toBe(false);
  });

  it("rejects a planner payload carrying crew fields (400)", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send({
        ...base,
        category: "planner",
        requirements: { ...plannerRequirements, crewRole: "stage-manager" },
        additionalDetails,
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toContainEqual({
      field: "requirements.crewRole",
      message:
        "Crew role is a Crew field and isn't valid for a Planner requirement.",
    });
  });
});
