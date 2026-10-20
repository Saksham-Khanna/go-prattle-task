import { z } from "zod";

/**
 * Server-side validation for event requirements.
 *
 * This is an independent mirror of the frontend schema
 * (src/lib/validation.ts in the frontend) — the two share the same field
 * contract, but the server is the source of truth: it never trusts the
 * client and rejects category-mismatched payloads via the discriminated
 * union on `category` (plus a strict category-shape check below).
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

/* ---------------------------- date helpers -------------------------------- */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date as `yyyy-mm-dd` (UTC — the API stores date-only values in UTC). */
export function todayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** True for a real calendar date (`2026-02-31` is rejected). */
export function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

const isoDate = z
  .string()
  .regex(ISO_DATE_RE, "Enter a valid date")
  .refine(isRealIsoDate, "Enter a real calendar date");

/** Required event date: real, and not earlier than today (UTC). */
const startDate = isoDate.refine(
  (value) => value >= todayIsoDate(),
  "Event date can't be in the past",
);

/** Optional free text: null or a non-empty trimmed string, capped at `max`. */
const optStr = (max: number) =>
  z.union([
    z.null(),
    z.string().trim().min(1).max(max, `Must be under ${max} characters`),
  ]);

const intField = (label: string, max: number) =>
  z
    .number({
      required_error: `${label} is required`,
      invalid_type_error: `${label} must be a number`,
    })
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be at least 1`)
    .max(max, `${label} looks too large`);

/* ------------------------- human-readable errors --------------------------- */

const FIELD_LABELS: Record<string, string> = {
  eventName: "Event name",
  eventType: "Event type",
  startDate: "Event date",
  endDate: "End date",
  location: "Location",
  venue: "Venue",
  category: "Category",
  requirements: "Category requirements",
  "requirements.expectedAttendees": "Expected attendee count",
  "requirements.services": "At least one service",
  "requirements.planningScope": "Planning scope",
  "requirements.budgetRange": "Budget range",
  "requirements.experienceLevel": "Experience level",
  "requirements.additionalNotes": "Additional planning details",
  "requirements.performanceType": "Performance type",
  "requirements.genreOrStyle": "Genre / style",
  "requirements.numberOfPerformers": "Number of performers",
  "requirements.durationMinutes": "Performance duration",
  "requirements.technicalSetup": "Technical setup",
  "requirements.experienceRequirement": "Experience requirement",
  "requirements.crewRole": "Crew role",
  "requirements.numberOfMembers": "Number of crew members",
  "requirements.requiredSkills": "Required skills",
  "requirements.shiftDuration": "Shift duration",
  "requirements.equipmentUniform": "Equipment / uniform",
  "additionalDetails.facilities": "Facilities",
  "additionalDetails.availability": "Availability",
  "additionalDetails.qualifications": "Qualifications",
  "additionalDetails.specialInstructions": "Special instructions",
  "additionalDetails.notes": "Additional notes",
  additionalDetails: "Additional details",
};

const RAW_MESSAGE =
  /^(Required$|Expected |Invalid input|Invalid enum value|Invalid discriminator value|Unrecognized key)/;

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function humanizeKey(key: string): string {
  return titleCase(key.replace(/([A-Z])/g, " $1").trim());
}

function fieldLabel(path: string): string {
  if (!path) return "Request body";
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  const leaf = path.split(".").pop() ?? path;
  return humanizeKey(leaf);
}

/** Label for a key inside `requirements` (uses the same labels as fields). */
function requirementKeyLabel(key: string): string {
  return FIELD_LABELS[`requirements.${key}`] ?? humanizeKey(key);
}

/** Turn a Zod issue into a short, field-level message safe to show users. */
export function humanizeZodIssue(issue: z.ZodIssue): string {
  const label = fieldLabel(issue.path.join("."));

  if (issue.code === "invalid_union_discriminator") {
    return "Choose a valid category: planner, performer, or crew.";
  }

  if (issue.code === "unrecognized_keys") {
    return "This field isn't allowed for the selected category.";
  }

  if (issue.code === "invalid_type") {
    if (issue.received === "undefined") return `${label} is required.`;
    if (issue.expected === "number") return `${label} must be a number.`;
    if (issue.expected === "string") return `${label} must be text.`;
    if (issue.expected === "array") return `${label} must be a list.`;
    if (issue.expected === "object") return `${label} is required.`;
    return `${label} is invalid.`;
  }

  if (issue.code === "invalid_union") {
    return `${label} is invalid.`;
  }

  if (RAW_MESSAGE.test(issue.message)) {
    return `${label} is invalid.`;
  }

  return issue.message;
}

/**
 * Distinctive requirement keys per category. Shared keys such as
 * `budgetRange` and `experienceLevel` are intentionally omitted — they are
 * valid in more than one category and can't prove a mismatch on their own.
 */
const REQUIREMENT_KEY_OWNERS: Record<string, (typeof CATEGORIES)[number]> = {
  expectedAttendees: "planner",
  services: "planner",
  planningScope: "planner",
  additionalNotes: "planner",
  performanceType: "performer",
  genreOrStyle: "performer",
  numberOfPerformers: "performer",
  durationMinutes: "performer",
  technicalSetup: "performer",
  experienceRequirement: "performer",
  crewRole: "crew",
  numberOfMembers: "crew",
  requiredSkills: "crew",
  shiftDuration: "crew",
  equipmentUniform: "crew",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCategory(value: unknown): value is (typeof CATEGORIES)[number] {
  return (
    typeof value === "string" &&
    (CATEGORIES as readonly string[]).includes(value)
  );
}

/**
 * Detects a payload whose `requirements` object belongs to another category
 * (e.g. performer fields submitted with `category: "planner"`). Zod's
 * discriminated union alone reports a pile of "required" errors in that
 * case; this produces one clear, actionable field error instead.
 */
export function detectCategoryMismatch(input: unknown): {
  field: string;
  message: string;
} | null {
  if (!isRecord(input) || !isCategory(input.category)) return null;
  const requirements = input.requirements;
  if (!isRecord(requirements)) return null;

  for (const [key, owner] of Object.entries(REQUIREMENT_KEY_OWNERS)) {
    if (owner === input.category) continue;
    if (!Object.prototype.hasOwnProperty.call(requirements, key)) continue;

    return {
      field: `requirements.${key}`,
      message: `${requirementKeyLabel(key)} is a ${titleCase(owner)} field and isn't valid for a ${titleCase(input.category)} requirement.`,
    };
  }

  return null;
}

/** Convert Zod issues into de-duplicated `{field, message}` API errors. */
export function toFieldErrors(
  issues: readonly z.ZodIssue[],
  input?: unknown,
): Array<{ field: string; message: string }> {
  const category = isRecord(input) && isCategory(input.category)
    ? input.category
    : null;
  const errors: Array<{ field: string; message: string }> = [];
  const seen = new Set<string>();

  const push = (field: string, message: string) => {
    const key = `${field}::${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    errors.push({ field, message });
  };

  for (const issue of issues) {
    if (issue.code === "unrecognized_keys") {
      const base = issue.path.join(".");
      for (const key of issue.keys) {
        const field = base ? `${base}.${key}` : key;
        const owner = REQUIREMENT_KEY_OWNERS[key];
        const message =
          category && base.startsWith("requirements") && owner && owner !== category
            ? `${requirementKeyLabel(key)} is a ${titleCase(owner)} field and isn't valid for a ${titleCase(category)} requirement.`
            : `Unknown field "${key}" isn't allowed.`;
        push(field, message);
      }
      continue;
    }

    push(issue.path.join(".") || "body", humanizeZodIssue(issue));
  }

  return errors;
}

/* --------------------------------- schemas --------------------------------- */

const basics = {
  eventName: z
    .string({
      required_error: "Event name is required",
      invalid_type_error: "Event name must be text",
    })
    .trim()
    .min(2, "Event name is required")
    .max(120, "Event name must be under 120 characters"),
  eventType: z.enum(EVENT_TYPES, { message: "Invalid event type" }),
  startDate,
  endDate: z.union([z.null(), isoDate]),
  location: z
    .string({
      required_error: "Location is required",
      invalid_type_error: "Location must be text",
    })
    .trim()
    .min(2, "Location is required")
    .max(120, "Location must be under 120 characters"),
  venue: optStr(120),
};

const plannerRequirements = z
  .object({
    expectedAttendees: intField("Expected attendee count", 100000),
    services: z
      .array(z.enum(PLANNER_SERVICES, { message: "Invalid service" }))
      .min(1, "Select at least one service"),
    planningScope: z
      .string({
        required_error: "Planning scope is required",
        invalid_type_error: "Planning scope must be text",
      })
      .trim()
      .min(10, "Planning scope must be at least 10 characters")
      .max(600, "Planning scope must be under 600 characters"),
    budgetRange: z.enum(BUDGET_RANGES, { message: "Invalid budget range" }),
    experienceLevel: z.enum(EXPERIENCE_LEVELS, {
      message: "Invalid experience level",
    }),
    additionalNotes: optStr(600),
  })
  .strict();

const performerRequirements = z
  .object({
    performanceType: z.enum(PERFORMANCE_TYPES, {
      message: "Invalid performance type",
    }),
    genreOrStyle: optStr(120),
    numberOfPerformers: intField("Number of performers", 200),
    durationMinutes: z
      .number({
        required_error: "Performance duration is required",
        invalid_type_error: "Performance duration must be a number",
      })
      .int("Duration must be a whole number of minutes")
      .min(5, "Minimum duration is 5 minutes")
      .max(1440, "Maximum duration is 1 day"),
    budgetRange: z.enum(BUDGET_RANGES, { message: "Invalid budget range" }),
    technicalSetup: optStr(300),
    experienceRequirement: optStr(300),
  })
  .strict();

const crewRequirements = z
  .object({
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
  })
  .strict();

const additionalDetails = z
  .object({
    facilities: z
      .array(z.string({ invalid_type_error: "Facility must be text" }))
      .max(20, "Select up to 20 facilities"),
    availability: optStr(200),
    qualifications: optStr(400),
    specialInstructions: optStr(600),
    notes: optStr(800),
  })
  .strict();

const plannerPayload = z
  .object({
    ...basics,
    category: z.literal("planner"),
    requirements: plannerRequirements,
    additionalDetails,
  })
  .strict();

const performerPayload = z
  .object({
    ...basics,
    category: z.literal("performer"),
    requirements: performerRequirements,
    additionalDetails,
  })
  .strict();

const crewPayload = z
  .object({
    ...basics,
    category: z.literal("crew"),
    requirements: crewRequirements,
    additionalDetails,
  })
  .strict();

/**
 * Cross-check for date ranges (kept outside the union for clarity).
 * A multi-day event is valid as long as the end date is on/after the start.
 */
export const dateRangeError = (
  startDateValue: string,
  endDateValue: string | null,
): string | null => {
  if (endDateValue && endDateValue < startDateValue) {
    return "End date can't be earlier than the start date";
  }
  return null;
};

/**
 * Authoritative payload schema. Discriminated on `category`, so a planner
 * record can never carry performer-only (or crew-only) requirement data.
 * Strict objects reject foreign keys even when the expected keys are present.
 */
export const requirementPayloadSchema = z
  .discriminatedUnion("category", [
    plannerPayload,
    performerPayload,
    crewPayload,
  ])
  .superRefine((value, ctx) => {
    const rangeError = dateRangeError(value.startDate, value.endDate);
    if (rangeError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: rangeError,
      });
    }
  });

export type RequirementPayload = z.infer<typeof requirementPayloadSchema>;
