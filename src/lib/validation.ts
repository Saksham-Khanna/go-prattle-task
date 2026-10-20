import { z } from "zod";
import {
  BUDGET_RANGE_OPTIONS,
  CATEGORIES,
  CREW_ROLE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  EVENT_TYPE_OPTIONS,
  FormState,
  GENRE_APPLIES_TO,
  PLANNER_SERVICE_OPTIONS,
  PERFORMANCE_TYPE_OPTIONS,
  RequirementPayload,
  SHIFT_DURATION_OPTIONS,
} from "@/types/requirement";

const values = (opts: { value: string }[]) => opts.map((o) => o.value);
const EVENT_TYPE_VALUES = values(EVENT_TYPE_OPTIONS);
const PLANNER_SERVICE_VALUES = values(PLANNER_SERVICE_OPTIONS);
const BUDGET_VALUES = values(BUDGET_RANGE_OPTIONS);
const EXPERIENCE_VALUES = values(EXPERIENCE_LEVEL_OPTIONS);
const PERFORMANCE_TYPE_VALUES = values(PERFORMANCE_TYPE_OPTIONS);
const CREW_ROLE_VALUES = values(CREW_ROLE_OPTIONS);
const SHIFT_VALUES = values(SHIFT_DURATION_OPTIONS);

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date as `yyyy-mm-dd` in the user's local calendar. */
export function todayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True for a real calendar date (`2026-02-31` is rejected). */
export function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const isoDate = z
  .string()
  .regex(ISO_DATE_RE, "Enter a valid date")
  .refine(isRealIsoDate, "Enter a real calendar date");

/** Required event date: real, and not earlier than today. */
const startDateSchema = isoDate.refine(
  (value) => value >= todayIsoDate(),
  "Event date can't be in the past",
);

/** Optional free text: null or a non-empty trimmed string, capped at `max`. */
const optStr = (max: number) =>
  z.union([
    z.null(),
    z.string().trim().min(1).max(max, `Keep it under ${max} characters`),
  ]);

const intField = (label: string, max: number) =>
  z
    .number({
      error: (issue) =>
        issue.input === undefined || issue.input === null
          ? `${label} is required`
          : `${label} must be a number`,
    })
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be at least 1`)
    .max(max, `${label} looks too large`);

/* ------------------------------- step 1: basics ---------------------------- */

export const step1Schema = z
  .object({
    eventName: z
      .string()
      .trim()
      .min(2, "Event name is required (min 2 characters)")
      .max(120, "Keep the event name under 120 characters"),
    eventType: z.enum(EVENT_TYPE_VALUES, { message: "Select an event type" }),
    startDate: startDateSchema,
    endDate: z.union([z.null(), isoDate]),
    location: z
      .string()
      .trim()
      .min(2, "Location is required")
      .max(120, "Keep the location under 120 characters"),
    venue: optStr(120),
    category: z.enum(CATEGORIES, { message: "Choose who you are looking for" }),
  })
  .superRefine((val, ctx) => {
    if (val.endDate && val.startDate && val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date can't be earlier than the start date",
      });
    }
  });

/* --------------------------- step 2: per category --------------------------- */

export const plannerRequirementsSchema = z.object({
  expectedAttendees: intField("Expected attendee count", 100000),
  services: z
    .array(z.enum(PLANNER_SERVICE_VALUES))
    .min(1, "Select at least one service"),
  planningScope: z
    .string()
    .trim()
    .min(10, "Describe the planning scope (min 10 characters)")
    .max(600, "Keep the scope under 600 characters"),
  budgetRange: z.enum(BUDGET_VALUES, { message: "Select a budget range" }),
  experienceLevel: z.enum(EXPERIENCE_VALUES, {
    message: "Select a preferred experience level",
  }),
  additionalNotes: optStr(600),
});

export const performerRequirementsSchema = z.object({
  performanceType: z.enum(PERFORMANCE_TYPE_VALUES, {
    message: "Select a performance type",
  }),
  genreOrStyle: optStr(120),
  numberOfPerformers: intField("Number of performers", 200),
  durationMinutes: z
    .number({ message: "Performance duration is required" })
    .int("Duration must be a whole number of minutes")
    .min(5, "Minimum duration is 5 minutes")
    .max(1440, "Maximum duration is 1 day"),
  budgetRange: z.enum(BUDGET_VALUES, { message: "Select a budget range" }),
  technicalSetup: optStr(300),
  experienceRequirement: optStr(300),
});

export const crewRequirementsSchema = z.object({
  crewRole: z.enum(CREW_ROLE_VALUES, { message: "Select a crew role" }),
  numberOfMembers: intField("Number of crew members", 200),
  requiredSkills: optStr(300),
  experienceLevel: z.enum(EXPERIENCE_VALUES, {
    message: "Select an experience level",
  }),
  shiftDuration: z.enum(SHIFT_VALUES, { message: "Select a shift duration" }),
  budgetRange: z.enum(BUDGET_VALUES, {
    message: "Select a compensation range",
  }),
  equipmentUniform: optStr(300),
});

/* ------------------------------- step 3: details --------------------------- */

export const additionalDetailsSchema = z.object({
  facilities: z.array(z.string()).max(20, "Select up to 20 facilities"),
  availability: optStr(200),
  qualifications: optStr(400),
  specialInstructions: optStr(600),
  notes: optStr(800),
});

/* ------------------------------ full payload ------------------------------- */

const basicsShape = {
  eventName: step1Schema.shape.eventName,
  eventType: step1Schema.shape.eventType,
  startDate: step1Schema.shape.startDate,
  endDate: step1Schema.shape.endDate,
  location: step1Schema.shape.location,
  venue: step1Schema.shape.venue,
};

const plannerPayload = z.object({
  ...basicsShape,
  category: z.literal("planner"),
  requirements: plannerRequirementsSchema,
  additionalDetails: additionalDetailsSchema,
});

const performerPayload = z.object({
  ...basicsShape,
  category: z.literal("performer"),
  requirements: performerRequirementsSchema,
  additionalDetails: additionalDetailsSchema,
});

const crewPayload = z.object({
  ...basicsShape,
  category: z.literal("crew"),
  requirements: crewRequirementsSchema,
  additionalDetails: additionalDetailsSchema,
});

/**
 * The authoritative schema for a submitted requirement. A planner record can
 * never carry performer-only fields: the union is discriminated on `category`,
 * so the `requirements` object must match the chosen category exactly.
 *
 * The date-range cross-field rule is re-applied here (composition from
 * `.shape` fragments does not carry `step1Schema`'s refinement).
 */
export const requirementPayloadSchema = z
  .discriminatedUnion("category", [plannerPayload, performerPayload, crewPayload])
  .superRefine((val, ctx) => {
    if (val.endDate && val.startDate && val.endDate < val.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date can't be earlier than the start date",
      });
    }
  });

/* ----------------------------- payload builder ----------------------------- */

const num = (v: string): number | null => {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : Number.NaN;
};
const clean = (v: string): string | null => {
  const t = v.trim();
  return t === "" ? null : t;
};

/**
 * Builds the exact payload that gets submitted. Only the draft matching the
 * selected category is included, so switching categories can never leave
 * stale, incompatible data in the payload.
 */
export function buildPayload(f: FormState): RequirementPayload {
  const category = f.category as (typeof CATEGORIES)[number];

  let requirements: RequirementPayload["requirements"];
  if (category === "planner") {
    requirements = {
      expectedAttendees: num(f.planner.expectedAttendees) as number,
      services: f.planner.services,
      planningScope: f.planner.planningScope,
      budgetRange: f.planner.budgetRange,
      experienceLevel: f.planner.experienceLevel,
      additionalNotes: clean(f.planner.additionalNotes),
    };
  } else if (category === "performer") {
    const showGenre =
      f.performer.performanceType === "" ||
      GENRE_APPLIES_TO.has(f.performer.performanceType);
    requirements = {
      performanceType: f.performer.performanceType,
      genreOrStyle: showGenre ? clean(f.performer.genreOrStyle) : null,
      numberOfPerformers: num(f.performer.numberOfPerformers) as number,
      durationMinutes: num(f.performer.durationMinutes) as number,
      budgetRange: f.performer.budgetRange,
      technicalSetup: clean(f.performer.technicalSetup),
      experienceRequirement: clean(f.performer.experienceRequirement),
    };
  } else {
    requirements = {
      crewRole: f.crew.crewRole,
      numberOfMembers: num(f.crew.numberOfMembers) as number,
      requiredSkills: clean(f.crew.requiredSkills),
      experienceLevel: f.crew.experienceLevel,
      shiftDuration: f.crew.shiftDuration,
      budgetRange: f.crew.budgetRange,
      equipmentUniform: clean(f.crew.equipmentUniform),
    };
  }

  return {
    eventName: f.eventName,
    eventType: f.eventType,
    startDate: f.startDate,
    endDate: clean(f.endDate),
    location: f.location,
    venue: clean(f.venue),
    category,
    requirements,
    additionalDetails: {
      facilities: f.details.facilities,
      availability: clean(f.details.availability),
      qualifications: clean(f.details.qualifications),
      specialInstructions: clean(f.details.specialInstructions),
      notes: clean(f.details.notes),
    },
  };
}

/* ------------------------------ error mapping ------------------------------ */

export interface FieldIssue {
  field: string;
  message: string;
}

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
  /^(Required$|Expected |Invalid input|Invalid enum value|Invalid option|Invalid discriminator value|Unrecognized key)/;

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function humanizeKey(key: string): string {
  return titleCase(key.replace(/([A-Z])/g, " $1").trim());
}

function fieldLabel(path: string): string {
  if (!path) return "Request body";
  if (FIELD_LABELS[path]) return FIELD_LABELS[path];
  return humanizeKey(path.split(".").pop() ?? path);
}

/** Turn a Zod issue into a short, field-level message safe to show users. */
export function humanizeZodIssue(issue: z.ZodIssue): string {
  const label = fieldLabel(issue.path.join("."));

  if (
    issue.code === "invalid_union" &&
    issue.path.join(".") === "category"
  ) {
    return "Choose a valid category: planner, performer, or crew.";
  }

  if (issue.code === "unrecognized_keys") {
    return "This field isn't allowed for the selected category.";
  }

  if (issue.code === "invalid_type") {
    if (issue.input === undefined) return `${label} is required.`;
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

export function issuesToFieldErrors(error: z.ZodError): FieldIssue[] {
  return error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: humanizeZodIssue(issue),
  }));
}

export function fieldErrorMap(error: z.ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in map)) map[key] = humanizeZodIssue(issue);
  }
  return map;
}

const STEP1_FIELDS = new Set([
  "eventName",
  "eventType",
  "startDate",
  "endDate",
  "location",
  "venue",
  "category",
]);

/** Which step a validation error belongs to (1-based). */
export function stepForField(field: string): 1 | 2 | 3 {
  const root = field.split(".")[0];
  if (root === "requirements") return 2;
  if (root === "additionalDetails") return 3;
  if (STEP1_FIELDS.has(root)) return 1;
  return 1;
}
