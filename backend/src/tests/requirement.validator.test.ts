import { describe, expect, it } from "vitest";
import {
  dateRangeError,
  requirementPayloadSchema,
  toFieldErrors,
  todayIsoDate,
} from "../validators/requirement";

function addDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const base = {
  eventName: "Circuitry — Annual Tech Fest 2026",
  eventType: "college-fest",
  startDate: addDays(10),
  endDate: addDays(11),
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

  it("accepts a single-day event (end = start)", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      startDate: addDays(10),
      endDate: addDays(10),
      category: "performer",
      requirements: performerRequirements,
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(true);
  });

  it("accepts a valid multi-day event", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      startDate: addDays(5),
      endDate: addDays(9),
      category: "crew",
      requirements: crewRequirements,
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(true);
  });

  it("rejects an event date in the past with a field-specific message", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      startDate: addDays(-1),
      endDate: null,
      category: "performer",
      requirements: performerRequirements,
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const errors = toFieldErrors(res.error.issues, {
        ...base,
        category: "performer",
        requirements: performerRequirements,
        additionalDetails: emptyDetails,
      });
      expect(errors).toContainEqual({
        field: "startDate",
        message: "Event date can't be in the past",
      });
    }
  });

  it("rejects an end date earlier than the start date", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      startDate: addDays(10),
      endDate: addDays(9),
      category: "planner",
      requirements: plannerRequirements,
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const fields = toFieldErrors(res.error.issues).map((e) => e.field);
      expect(fields).toContain("endDate");
    }
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

  it("rejects a performer payload carrying crew requirements", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      category: "performer",
      requirements: crewRequirements,
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

  it("rejects a planner payload with valid planner fields plus a performer field", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      category: "planner",
      requirements: { ...plannerRequirements, performanceType: "dj" },
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const errors = toFieldErrors(res.error.issues, {
        category: "planner",
        requirements: { ...plannerRequirements, performanceType: "dj" },
      });
      expect(errors).toContainEqual({
        field: "requirements.performanceType",
        message:
          "Performance type is a Performer field and isn't valid for a Planner requirement.",
      });
    }
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

  it("never exposes raw Zod messages for missing fields", () => {
    const res = requirementPayloadSchema.safeParse({
      category: "planner",
      requirements: {},
      additionalDetails: emptyDetails,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const messages = toFieldErrors(res.error.issues).map((e) => e.message);
      expect(messages).toContain("Event name is required.");
      expect(messages).toContain("Expected attendee count is required.");
      expect(messages.some((m) => m === "Required")).toBe(false);
      expect(
        messages.some((m) =>
          /^Expected (string|number|array|object), received/.test(m),
        ),
      ).toBe(false);
      expect(messages.some((m) => m.startsWith("Invalid input"))).toBe(false);
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

  it("rejects an impossible calendar date", () => {
    const res = requirementPayloadSchema.safeParse({
      ...base,
      startDate: "2027-02-31",
      endDate: null,
      category: "performer",
      requirements: performerRequirements,
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

  it("allows a multi-day range", () => {
    expect(dateRangeError("2026-03-14", "2026-03-18")).toBeNull();
  });
});

describe("todayIsoDate", () => {
  it("returns a yyyy-mm-dd UTC date", () => {
    expect(todayIsoDate(new Date("2026-10-20T23:30:00Z"))).toBe("2026-10-20");
  });
});
