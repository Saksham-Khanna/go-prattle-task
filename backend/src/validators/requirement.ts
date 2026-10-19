import { z } from "zod";

/**
 * Server-side validation for event requirements.
 *
 * This is an independent mirror of the frontend schema
 * (src/lib/validation.ts in the frontend) — the two share the same field
 * contract, but the server is the source of truth: it never trusts the
 * client and rejects category-mismatched payloads via the discriminated
 * union on `category`.
 */

const EVENT_TYPES = [
  "college-fest",
  "corporate-event",
  "wedding",
  "concert",
  "private-party",
  "festival",
  "conference",
  "other",
] as const;

const PLANNER_SERVICES = [
  "venue-coordination",
  "decoration",
  "catering",
  "logistics",
  "complete-planning",
  "other",
] as const;

const BUDGET_RANGES = [
  "under-25k",
  "25k-50k",
  "50k-1l",
  "1l-5l",
  "5l-10l",
  "10l-plus",
  "negotiable",
] as const;

const EXPERIENCE_LEVELS = [
  "no-preference",
  "beginner",
  "experienced",
  "expert",
] as const;

const PERFORMANCE_TYPES = [
  "singer",
  "dj",
  "band",
  "dancer",
  "comedian",
  "instrumentalist",
  "other",
] as const;

const CREW_ROLES = [
  "sound-engineer",
  "lighting-technician",
  "stage-manager",
  "camera-operator",
  "security",
  "event-assistant",
  "other",
] as const;

const SHIFT_DURATIONS = ["half-day", "full-day", "extended", "multi-day"] as const;

export const CATEGORIES = ["planner", "performer", "crew"] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");

/** Optional free text: null or a non-empty trimmed string, capped at `max`. */
const optStr = (max: number) =>
  z.union([
    z.null(),
    z.string().trim().min(1).max(max, `Must be under ${max} characters`),
  ]);

const intField = (label: string, max: number) =>
  z
    .number({ message: `${label} is required` })
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be at least 1`)
    .max(max, `${label} looks too large`);

const basics = {
  eventName: z
    .string()
    .trim()
    .min(2, "Event name is required")
    .max(120, "Event name must be under 120 characters"),
  eventType: z.enum(EVENT_TYPES, { message: "Invalid event type" }),
  startDate: isoDate,
  endDate: z.union([z.null(), isoDate]),
  location: z.string().trim().min(2, "Location is required").max(120),
  venue: optStr(120),
};

const plannerRequirements = z.object({
  expectedAttendees: intField("Expected attendee count", 100000),
  services: z
    .array(z.enum(PLANNER_SERVICES))
    .min(1, "Select at least one service"),
  planningScope: z
    .string()
    .trim()
    .min(10, "Planning scope must be at least 10 characters")
    .max(600),
  budgetRange: z.enum(BUDGET_RANGES, { message: "Invalid budget range" }),
  experienceLevel: z.enum(EXPERIENCE_LEVELS, {
    message: "Invalid experience level",
  }),
  additionalNotes: optStr(600),
});

const performerRequirements = z.object({
  performanceType: z.enum(PERFORMANCE_TYPES, {
    message: "Invalid performance type",
  }),
  genreOrStyle: optStr(120),
  numberOfPerformers: intField("Number of performers", 200),
  durationMinutes: z
    .number({ message: "Performance duration is required" })
    .int()
    .min(5, "Minimum duration is 5 minutes")
    .max(1440, "Maximum duration is 1 day"),
  budgetRange: z.enum(BUDGET_RANGES, { message: "Invalid budget range" }),
  technicalSetup: optStr(300),
  experienceRequirement: optStr(300),
});

const crewRequirements = z.object({
  crewRole: z.enum(CREW_ROLES, { message: "Invalid crew role" }),
  numberOfMembers: intField("Number of crew members", 200),
  requiredSkills: optStr(300),
  experienceLevel: z.enum(EXPERIENCE_LEVELS, {
    message: "Invalid experience level",
  }),
  shiftDuration: z.enum(SHIFT_DURATIONS, {
    message: "Invalid shift duration",
  }),
  budgetRange: z.enum(BUDGET_RANGES, {
    message: "Invalid compensation range",
  }),
  equipmentUniform: optStr(300),
});

const additionalDetails = z.object({
  facilities: z.array(z.string()).max(20, "Select up to 20 facilities"),
  availability: optStr(200),
  qualifications: optStr(400),
  specialInstructions: optStr(600),
  notes: optStr(800),
});

const plannerPayload = z.object({
  ...basics,
  category: z.literal("planner"),
  requirements: plannerRequirements,
  additionalDetails,
});

const performerPayload = z.object({
  ...basics,
  category: z.literal("performer"),
  requirements: performerRequirements,
  additionalDetails,
});

const crewPayload = z.object({
  ...basics,
  category: z.literal("crew"),
  requirements: crewRequirements,
  additionalDetails,
});

/**
 * Authoritative payload schema. Discriminated on `category`, so a planner
 * record can never carry performer-only (or crew-only) requirement data.
 */
export const requirementPayloadSchema = z.discriminatedUnion("category", [
  plannerPayload,
  performerPayload,
  crewPayload,
]);

export type RequirementPayload = z.infer<typeof requirementPayloadSchema>;

/** Cross-check for date ranges (kept outside the union for clarity). */
export const dateRangeError = (
  startDate: string,
  endDate: string | null,
): string | null => {
  if (endDate && endDate < startDate) {
    return "End date can't be earlier than the start date";
  }
  return null;
};
