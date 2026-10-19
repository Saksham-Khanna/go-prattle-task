"use client";

import {
  BUDGET_RANGE_OPTIONS,
  CREW_ROLE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  SHIFT_DURATION_OPTIONS,
  type FormState,
} from "@/types/requirement";
import { Field, Input, Select } from "@/components/ui/Field";

export interface Step2CrewProps {
  form: FormState;
  errors: Record<string, string>;
  onUpdate: (patch: Partial<FormState["crew"]>) => void;
}

export function Step2Crew({ form, errors, onUpdate }: Step2CrewProps) {
  const c = form.crew;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="crewRole"
          label="Crew role"
          required
          error={errors.crewRole}
        >
          <Select
            id="crewRole"
            value={c.crewRole}
            invalid={!!errors.crewRole}
            onChange={(e) => onUpdate({ crewRole: e.target.value })}
          >
            <option value="" disabled>
              Select crew role…
            </option>
            {CREW_ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="numberOfMembers"
          label="Crew members required"
          required
          error={errors.numberOfMembers}
        >
          <Input
            id="numberOfMembers"
            type="number"
            inputMode="numeric"
            min={1}
            value={c.numberOfMembers}
            invalid={!!errors.numberOfMembers}
            placeholder="e.g. 3"
            onChange={(e) => onUpdate({ numberOfMembers: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="shiftDuration"
          label="Shift duration / working hours"
          required
          error={errors.shiftDuration}
        >
          <Select
            id="shiftDuration"
            value={c.shiftDuration}
            invalid={!!errors.shiftDuration}
            onChange={(e) => onUpdate({ shiftDuration: e.target.value })}
          >
            <option value="" disabled>
              Select shift duration…
            </option>
            {SHIFT_DURATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="crewExperience"
          label="Experience level"
          required
          error={errors.experienceLevel}
        >
          <Select
            id="crewExperience"
            value={c.experienceLevel}
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
      </div>

      <Field
        id="requiredSkills"
        label="Required skills"
        error={errors.requiredSkills}
        hint="e.g. mixing on QSC, DMX lighting control, event coordination."
      >
        <Input
          id="requiredSkills"
          value={c.requiredSkills}
          invalid={!!errors.requiredSkills}
          maxLength={300}
          placeholder="Which skills must the crew have?"
          onChange={(e) => onUpdate({ requiredSkills: e.target.value })}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="crewBudget"
          label="Compensation range"
          required
          error={errors.budgetRange}
        >
          <Select
            id="crewBudget"
            value={c.budgetRange}
            invalid={!!errors.budgetRange}
            onChange={(e) => onUpdate({ budgetRange: e.target.value })}
          >
            <option value="" disabled>
              Select compensation range…
            </option>
            {BUDGET_RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="equipmentUniform"
          label="Equipment / uniform requirements"
          error={errors.equipmentUniform}
          hint="e.g. branded crew T-shirts, own laptop, safety gear."
        >
          <Input
            id="equipmentUniform"
            value={c.equipmentUniform}
            invalid={!!errors.equipmentUniform}
            maxLength={300}
            placeholder="Anything to bring or to be provided"
            onChange={(e) => onUpdate({ equipmentUniform: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}
