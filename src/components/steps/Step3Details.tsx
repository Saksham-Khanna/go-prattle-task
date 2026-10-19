"use client";

import {
  FACILITY_OPTIONS,
  type Category,
  type FormState,
} from "@/types/requirement";
import { ChipGroup, Field, Input, Textarea } from "@/components/ui/Field";

const QUALIFICATION: Record<
  Category,
  { label: string; placeholder: string }
> = {
  planner: {
    label: "Vendor qualifications",
    placeholder: "e.g. GST-registered agency, portfolio of past college fests",
  },
  performer: {
    label: "Credentials to look for",
    placeholder: "e.g. 1+ year live experience, verifiable references",
  },
  crew: {
    label: "Required certifications",
    placeholder: "e.g. valid ID proof, safety training, driving licence",
  },
};

const INSTRUCTIONS: Record<Category, { label: string; placeholder: string }> = {
  planner: {
    label: "Instructions for the planning team",
    placeholder: "Timelines, checkpoints, escalation contact, must-dos…",
  },
  performer: {
    label: "Performance instructions",
    placeholder: "Slot timing, dress code, audience vibe, stage rules…",
  },
  crew: {
    label: "Site & safety instructions",
    placeholder: "Reporting time, site rules, PPE, conduct expectations…",
  },
};

export interface Step3DetailsProps {
  form: FormState;
  errors: Record<string, string>;
  onUpdate: (patch: Partial<FormState["details"]>) => void;
}

export function Step3Details({ form, errors, onUpdate }: Step3DetailsProps) {
  const category: Category =
    form.category === "planner" ||
    form.category === "performer" ||
    form.category === "crew"
      ? form.category
      : "planner";
  const d = form.details;

  const toggleFacility = (v: string) =>
    onUpdate({
      facilities: d.facilities.includes(v)
        ? d.facilities.filter((f) => f !== v)
        : [...d.facilities, v],
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">
          Additional details
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Everything here is optional — but sharper context gets faster, more
          accurate responses.
        </p>
      </div>

      <Field
        id="facilities"
        label="Facilities & resources they can rely on"
        error={errors["additionalDetails.facilities"]}
        hint="Pick what will be available on-site."
      >
        <ChipGroup
          options={FACILITY_OPTIONS[category]}
          selected={d.facilities}
          onToggle={toggleFacility}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="availability"
          label="Availability preference"
          error={errors["additionalDetails.availability"]}
          hint="e.g. setup from 9 AM the day before, show at 5 PM."
        >
          <Input
            id="availability"
            value={d.availability}
            maxLength={200}
            placeholder="When do they need to be available?"
            onChange={(e) => onUpdate({ availability: e.target.value })}
          />
        </Field>

        <Field
          id="qualifications"
          label={QUALIFICATION[category].label}
          error={errors["additionalDetails.qualifications"]}
        >
          <Input
            id="qualifications"
            value={d.qualifications}
            maxLength={400}
            placeholder={QUALIFICATION[category].placeholder}
            onChange={(e) => onUpdate({ qualifications: e.target.value })}
          />
        </Field>
      </div>

      <Field
        id="specialInstructions"
        label={INSTRUCTIONS[category].label}
        error={errors["additionalDetails.specialInstructions"]}
      >
        <Textarea
          id="specialInstructions"
          rows={3}
          maxLength={600}
          showCount
          value={d.specialInstructions}
          placeholder={INSTRUCTIONS[category].placeholder}
          onChange={(e) =>
            onUpdate({ specialInstructions: e.target.value })
          }
        />
      </Field>

      <Field
        id="notes"
        label="Additional notes"
        error={errors["additionalDetails.notes"]}
        hint="Anything else — parking codes, contact timing, reference links."
      >
        <Textarea
          id="notes"
          rows={4}
          maxLength={800}
          showCount
          value={d.notes}
          placeholder="Add anything that doesn't fit elsewhere…"
          onChange={(e) => onUpdate({ notes: e.target.value })}
        />
      </Field>
    </div>
  );
}
