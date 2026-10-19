"use client";

import {
  BUDGET_RANGE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  PLANNER_SERVICE_OPTIONS,
  type FormState,
} from "@/types/requirement";
import { ChipGroup, Field, Input, Select, Textarea } from "@/components/ui/Field";

export interface Step2PlannerProps {
  form: FormState;
  errors: Record<string, string>;
  onUpdate: (patch: Partial<FormState["planner"]>) => void;
}

export function Step2Planner({ form, errors, onUpdate }: Step2PlannerProps) {
  const p = form.planner;
  const toggleService = (v: string) =>
    onUpdate({
      services: p.services.includes(v)
        ? p.services.filter((s) => s !== v)
        : [...p.services, v],
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="expectedAttendees"
          label="Expected attendees"
          required
          error={errors.expectedAttendees}
          hint="A rough estimate is fine."
        >
          <Input
            id="expectedAttendees"
            type="number"
            inputMode="numeric"
            min={1}
            value={p.expectedAttendees}
            invalid={!!errors.expectedAttendees}
            placeholder="e.g. 800"
            onChange={(e) => onUpdate({ expectedAttendees: e.target.value })}
          />
        </Field>

        <Field
          id="plannerBudget"
          label="Budget range"
          required
          error={errors.budgetRange}
        >
          <Select
            id="plannerBudget"
            value={p.budgetRange}
            invalid={!!errors.budgetRange}
            onChange={(e) => onUpdate({ budgetRange: e.target.value })}
          >
            <option value="" disabled>
              Select budget range…
            </option>
            {BUDGET_RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        id="services"
        label="Services required"
        required
        error={errors.services}
        hint="Select everything the planner should handle."
      >
        <ChipGroup
          options={PLANNER_SERVICE_OPTIONS}
          selected={p.services}
          onToggle={toggleService}
          invalid={!!errors.services}
        />
      </Field>

      <Field
        id="planningScope"
        label="Planning scope"
        required
        error={errors.planningScope}
        hint="What should they take care of end to end?"
      >
        <Textarea
          id="planningScope"
          rows={3}
          maxLength={600}
          showCount
          value={p.planningScope}
          invalid={!!errors.planningScope}
          placeholder="e.g. Stage & booth setup, vendor hiring, guest management, programme flow for a 2-day fest…"
          onChange={(e) => onUpdate({ planningScope: e.target.value })}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="experienceLevel"
          label="Preferred experience level"
          required
          error={errors.experienceLevel}
        >
          <Select
            id="experienceLevel"
            value={p.experienceLevel}
            invalid={!!errors.experienceLevel}
            onChange={(e) => onUpdate({ experienceLevel: e.target.value })}
          >
            <option value="" disabled>
              Select experience level…
            </option>
            {EXPERIENCE_LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="plannerNotes"
          label="Additional planning details"
          error={errors.additionalNotes}
        >
          <Textarea
            id="plannerNotes"
            rows={3}
            maxLength={600}
            showCount
            value={p.additionalNotes}
            invalid={!!errors.additionalNotes}
            placeholder="Sponsorships, tie-ups, timelines, past references…"
            onChange={(e) => onUpdate({ additionalNotes: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}
