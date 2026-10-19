// Shared frontend domain types + option catalogs for event requirements.
// The standalone Express backend (backend/src/validators/requirement.ts) keeps
// an equivalent, independently defined schema with the same field contract.

export const CATEGORIES = ["planner", "performer", "crew"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

export const CATEGORY_META: Record<
  Category,
  { title: string; description: string; step2Collects: string[] }
> = {
  planner: {
    title: "Event Planner",
    description: "End-to-end planning, vendors & logistics",
    step2Collects: [
      "Expected attendees",
      "Services & scope",
      "Budget & experience",
    ],
  },
  performer: {
    title: "Performer",
    description: "Singers, DJs, bands & live acts",
    step2Collects: [
      "Performance type & style",
      "Duration & headcount",
      "Budget & technical setup",
    ],
  },
  crew: {
    title: "Crew",
    description: "Sound, light, stage & support staff",
    step2Collects: [
      "Crew role & headcount",
      "Skills & experience",
      "Shift length & compensation",
    ],
  },
};

export const EVENT_TYPE_OPTIONS: Option[] = [
  { value: "college-fest", label: "College Fest" },
  { value: "corporate-event", label: "Corporate Event" },
  { value: "wedding", label: "Wedding" },
  { value: "concert", label: "Concert" },
  { value: "private-party", label: "Private Party" },
  { value: "festival", label: "Festival" },
  { value: "conference", label: "Conference" },
  { value: "other", label: "Other" },
];

export const PLANNER_SERVICE_OPTIONS: Option[] = [
  { value: "venue-coordination", label: "Venue coordination" },
  { value: "decoration", label: "Decoration" },
  { value: "catering", label: "Catering" },
  { value: "logistics", label: "Logistics" },
  { value: "complete-planning", label: "Complete planning" },
  { value: "other", label: "Other" },
];

export const BUDGET_RANGE_OPTIONS: Option[] = [
  { value: "under-25k", label: "Under ₹25,000" },
  { value: "25k-50k", label: "₹25,000 – ₹50,000" },
  { value: "50k-1l", label: "₹50,000 – ₹1,00,000" },
  { value: "1l-5l", label: "₹1,00,000 – ₹5,00,000" },
  { value: "5l-10l", label: "₹5,00,000 – ₹10,00,000" },
  { value: "10l-plus", label: "Above ₹10,00,000" },
  { value: "negotiable", label: "Negotiable" },
];

export const EXPERIENCE_LEVEL_OPTIONS: Option[] = [
  { value: "no-preference", label: "No preference" },
  { value: "beginner", label: "Beginner friendly" },
  { value: "experienced", label: "Experienced (2+ years)" },
  { value: "expert", label: "Expert (5+ years)" },
];

export const PERFORMANCE_TYPE_OPTIONS: Option[] = [
  { value: "singer", label: "Singer" },
  { value: "dj", label: "DJ" },
  { value: "band", label: "Band" },
  { value: "dancer", label: "Dancer / Choreography" },
  { value: "comedian", label: "Comedian" },
  { value: "instrumentalist", label: "Instrumentalist" },
  { value: "other", label: "Other" },
];

/** Performance types where a genre / style field is relevant. */
export const GENRE_APPLIES_TO = new Set([
  "singer",
  "dj",
  "band",
  "instrumentalist",
  "other",
]);

export const CREW_ROLE_OPTIONS: Option[] = [
  { value: "sound-engineer", label: "Sound Engineer" },
  { value: "lighting-technician", label: "Lighting Technician" },
  { value: "stage-manager", label: "Stage Manager" },
  { value: "camera-operator", label: "Camera Operator" },
  { value: "security", label: "Security" },
  { value: "event-assistant", label: "Event Assistant" },
  { value: "other", label: "Other" },
];

export const SHIFT_DURATION_OPTIONS: Option[] = [
  { value: "half-day", label: "Half day (4–6 hrs)" },
  { value: "full-day", label: "Full day (8 hrs)" },
  { value: "extended", label: "Extended (10+ hrs)" },
  { value: "multi-day", label: "Multi-day / per event day" },
];

export const FACILITY_OPTIONS: Record<Category, Option[]> = {
  planner: [
    { value: "venue-access", label: "Venue access" },
    { value: "power-backup", label: "Power backup" },
    { value: "ac-setup", label: "AC setup" },
    { value: "parking", label: "Parking" },
    { value: "guest-stay", label: "Guest stay" },
    { value: "internet", label: "Internet" },
    { value: "photo-coverage", label: "Photo coverage" },
    { value: "security", label: "On-site security" },
  ],
  performer: [
    { value: "stage", label: "Stage" },
    { value: "backdrop", label: "Backdrop" },
    { value: "backline", label: "Backline / instruments" },
    { value: "monitor-mix", label: "Monitor mix" },
    { value: "green-room", label: "Green room" },
    { value: "travel-stay", label: "Travel & stay" },
    { value: "soundcheck", label: "Soundcheck slot" },
    { value: "meals", label: "Meals" },
  ],
  crew: [
    { value: "crew-area", label: "Dedicated crew area" },
    { value: "site-access", label: "Site access / passes" },
    { value: "meals", label: "Meals" },
    { value: "travel", label: "Travel" },
    { value: "accommodation", label: "Accommodation" },
    { value: "uniform", label: "Uniform" },
    { value: "ppe", label: "PPE / safety gear" },
    { value: "parking", label: "Parking" },
  ],
};

export function labelFor(options: readonly Option[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/* ---------------------------------- shapes --------------------------------- */

export interface EventBasics {
  eventName: string;
  eventType: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string | null; // ISO yyyy-mm-dd | null
  location: string;
  venue: string | null;
  category: Category;
}

export interface PlannerRequirements {
  expectedAttendees: number;
  services: string[];
  planningScope: string;
  budgetRange: string;
  experienceLevel: string;
  additionalNotes: string | null;
}

export interface PerformerRequirements {
  performanceType: string;
  genreOrStyle: string | null;
  numberOfPerformers: number;
  durationMinutes: number;
  budgetRange: string;
  technicalSetup: string | null;
  experienceRequirement: string | null;
}

export interface CrewRequirements {
  crewRole: string;
  numberOfMembers: number;
  requiredSkills: string | null;
  experienceLevel: string;
  shiftDuration: string;
  budgetRange: string;
  equipmentUniform: string | null;
}

export type CategoryRequirements =
  | PlannerRequirements
  | PerformerRequirements
  | CrewRequirements;

export interface AdditionalDetails {
  facilities: string[];
  availability: string | null;
  qualifications: string | null;
  specialInstructions: string | null;
  notes: string | null;
}

export interface RequirementPayload {
  eventName: string;
  eventType: string;
  startDate: string;
  endDate: string | null;
  location: string;
  venue: string | null;
  category: Category;
  requirements: CategoryRequirements;
  additionalDetails: AdditionalDetails;
}

export interface RequirementRecord extends RequirementPayload {
  id: string;
  status: "submitted";
  createdAt: string;
  updatedAt: string;
}

/* ------------------------- client-side form draft -------------------------- */
// Numeric inputs are kept as strings while the user types; buildPayload()
// (in lib/validation.ts) converts them to the final submit shape.

export interface FormState {
  eventName: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  category: Category | "";

  planner: {
    expectedAttendees: string;
    services: string[];
    planningScope: string;
    budgetRange: string;
    experienceLevel: string;
    additionalNotes: string;
  };
  performer: {
    performanceType: string;
    genreOrStyle: string;
    numberOfPerformers: string;
    durationMinutes: string;
    budgetRange: string;
    technicalSetup: string;
    experienceRequirement: string;
  };
  crew: {
    crewRole: string;
    numberOfMembers: string;
    requiredSkills: string;
    experienceLevel: string;
    shiftDuration: string;
    budgetRange: string;
    equipmentUniform: string;
  };
  details: {
    facilities: string[];
    availability: string;
    qualifications: string;
    specialInstructions: string;
    notes: string;
  };
}

export const initialFormState: FormState = {
  eventName: "",
  eventType: "",
  startDate: "",
  endDate: "",
  location: "",
  venue: "",
  category: "",
  planner: {
    expectedAttendees: "",
    services: [],
    planningScope: "",
    budgetRange: "",
    experienceLevel: "",
    additionalNotes: "",
  },
  performer: {
    performanceType: "",
    genreOrStyle: "",
    numberOfPerformers: "",
    durationMinutes: "",
    budgetRange: "",
    technicalSetup: "",
    experienceRequirement: "",
  },
  crew: {
    crewRole: "",
    numberOfMembers: "",
    requiredSkills: "",
    experienceLevel: "",
    shiftDuration: "",
    budgetRange: "",
    equipmentUniform: "",
  },
  details: {
    facilities: [],
    availability: "",
    qualifications: "",
    specialInstructions: "",
    notes: "",
  },
};

export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}
