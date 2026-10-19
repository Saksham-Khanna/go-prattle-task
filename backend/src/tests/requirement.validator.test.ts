import { describe, expect, it } from "vitest";
import {
  dateRangeError,
  requirementPayloadSchema,
} from "../validators/requirement";

const base = {
  eventName: "Circuitry — Annual Tech Fest 2026",
  eventType: "college-fest",
  startDate: "2026-03-14",
  endDate: "2026-03-15",
  location: "Pune",
  venue: "Central auditorium",
};

const emptyDetails = {
  facilities: [],
  availability: null,
  qualifications: null,
  specialInstructions: null,
  notes: null,
};

const plannerRequirements = {
  expectedAttendees: 800,
  services: ["venue-coordination", "catering"],
  planningScope: "Full 2-day fest planning: stages, vendor hiring, guest management.",
  budgetRange: "1l-5l",
  experienceLevel: "experienced",
  additionalNotes: null,
};

const performerRequirements = {
  performanceType: "dj",
  genreOrStyle: "EDM",
  numberOfPerformers: 2,
  durationMinutes: 60,
  budgetRange: "50k-1l",
  technicalSetup: "DJ booth + PA for 500",
  experienceRequirement: "Festival headliner preferred",
};

const crewRequirements = {
  crewRole: "sound-engineer",
  numberOfMembers: 3,
  requiredSkills: "Mixing on QSC",
  experienceLevel: "experienced",
  shiftDuration: "full-day",
  budgetRange: "25k-50k",
  equipmentUniform: "Branded crew tees",
};

describe("requirementPayloadSchema", () => {
  it("accepts a valid planner payload", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      category: "planner",
      requirements: plannerRequirements,
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(true);
  });

  it("accepts a valid performer payload", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      category: "performer",
      requirements: performerRequirements,
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(true);
  });

  it("accepts a valid crew payload", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      endDate: null,
      venue: null,
      category: "crew",
      requirements: crewRequirements,
      additionalDetails: { ...emptyDetails, facilities: ["meals", "crew-area"] },
    });
    expect(res.success).toBe(true);
  });

  it("rejects a planner payload carrying performer requirements", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      category: "planner",
      requirements: performerRequirements,
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
  });

  it("rejects a crew payload carrying planner requirements", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      category: "crew",
      requirements: plannerRequirements,
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
  });

  it("rejects an unknown category", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      category: "photographer",
      requirements: {},
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
  });

  it("reports the exact field when the event name is missing", () => {
    const { eventName: _drop, ...rest } = base;
    const res = requirementPayloadSchema.safeParse({
      ...rest,
      category: "crew",
      requirements: crewRequirements,
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const fields = res.error.issues.map((i) => i.path.join("."));
      expect(fields).toContain("eventName");
    }
  });

  it("reports services when a planner selects none", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      category: "planner",
      requirements: { ...plannerRequirements, services: [] },
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const fields = res.error.issues.map((i) => i.path.join("."));
      expect(fields).toContain("requirements.services");
    }
  });

  it("rejects a performer duration below the 5 minute floor", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      category: "performer",
      requirements: { ...performerRequirements, durationMinutes: 2 },
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
  });
});

describe("dateRangeError", () => {
  it("flags an end date earlier than the start date", () => {
    expect(dateRangeError("2026-03-14", "2026-03-10")).not.toBeNull();
  });

  it("allows a single-day event (end = start)", () => {
    expect(dateRangeError("2026-03-14", "2026-03-14")).toBeNull();
  });

  it("allows an open-ended range (no end date)", () => {
    expect(dateRangeError("2026-03-14", null)).toBeNull();
  });
});
