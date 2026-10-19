"use client";

import {
  BUDGET_RANGE_OPTIONS,
  GENRE_APPLIES_TO,
  PERFORMANCE_TYPE_OPTIONS,
  type FormState,
} from "@/types/requirement";
import { Field, Input, Select } from "@/components/ui/Field";

const GENRE_LABEL: Record<string, string> = {
  singer: "Music genre",
  dj: "Music genre",
  band: "Music genre",
  instrumentalist: "Music genre",
  other: "Performance type / style",
};

const GENRE_PLACEHOLDER: Record<string, string> = {
  singer: "e.g. Bollywood, EDM, acoustic, K-pop",
  dj: "e.g. EDM, Hip-hop, Bollywood",
  band: "e.g. Rock, Metal, Indie pop",
  instrumentalist: "e.g. Jazz, Sufi, Classical fusion",
  other: "e.g. Mime, magic, classical dance",
};

export interface Step2PerformerProps {
  form: FormState;
  errors: Record<string, string>;
  onUpdate: (patch: Partial<FormState["performer"]>) => void;
}

export function Step2Performer({
  form,
  errors,
  onUpdate,
}: Step2PerformerProps) {
  const f = form.performer;
  const isDancer = f.performanceType === "dancer";
  const showGenre =
    f.performanceType === "" ||
    isDancer ||
    GENRE_APPLIES_TO.has(f.performanceType);
  const genreLabel = isDancer ? "Choreography style" : GENRE_LABEL[f.performanceType] ?? "Performance style";

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="performanceType"
          label="Performance type"
          required
          error={errors.performanceType}
        >
          <Select
            id="performanceType"
            value={f.performanceType}
            invalid={!!errors.performanceType}
            onChange={(e) => onUpdate({ performanceType: e.target.value })}
          >
            <option value="" disabled>
              Select performance type…
            </option>
            {PERFORMANCE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="numberOfPerformers"
          label="Number of performers"
          required
          error={errors.numberOfPerformers}
          hint="Include the lead artist / act."
        >
          <Input
            id="numberOfPerformers"
            type="number"
            inputMode="numeric"
            min={1}
            value={f.numberOfPerformers}
            invalid={!!errors.numberOfPerformers}
            placeholder="e.g. 4"
            onChange={(e) => onUpdate({ numberOfPerformers: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {showGenre && (
          <Field
            id="genreOrStyle"
            label={genreLabel}
            error={errors.genreOrStyle}
            hint="Helps the right act find this requirement."
          >
            <Input
              id="genreOrStyle"
              value={f.genreOrStyle}
              invalid={!!errors.genreOrStyle}
              maxLength={120}
              placeholder={
                GENRE_PLACEHOLDER[f.performanceType] ?? "e.g. Stand-up"
              }
              onChange={(e) => onUpdate({ genreOrStyle: e.target.value })}
            />
          </Field>
        )}

        <Field
          id="durationMinutes"
          label="Performance duration"
          required
          error={errors.durationMinutes}
          hint="In minutes, e.g. 45 for a main-stage slot."
        >
          <div className="relative">
            <Input
              id="durationMinutes"
              type="number"
              inputMode="numeric"
              min={5}
              className="pr-14"
              value={f.durationMinutes}
              invalid={!!errors.durationMinutes}
              placeholder="e.g. 45"
              onChange={(e) => onUpdate({ durationMinutes: e.target.value })}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-faint">
              min
            </span>
          </div>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="performerBudget"
          label="Budget range"
          required
          error={errors.budgetRange}
        >
          <Select
            id="performerBudget"
            value={f.budgetRange}
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

        <Field
          id="technicalSetup"
          label="Equipment / technical setup"
          error={errors.technicalSetup}
          hint="Mics, DJ booth, backline, lighting package…"
        >
          <Input
            id="technicalSetup"
            value={f.technicalSetup}
            invalid={!!errors.technicalSetup}
            maxLength={300}
            placeholder="e.g. 2 vocal mics, DJ booth, PA for 500"
            onChange={(e) => onUpdate({ technicalSetup: e.target.value })}
          />
        </Field>
      </div>

      <Field
        id="experienceRequirement"
        label="Relevant experience requirements"
        error={errors.experienceRequirement}
        hint="e.g. at least 2 college performances, past festival headliner."
      >
        <Input
          id="experienceRequirement"
          value={f.experienceRequirement}
          invalid={!!errors.experienceRequirement}
          maxLength={300}
          placeholder="What experience should the act have?"
          onChange={(e) => onUpdate({ experienceRequirement: e.target.value })}
        />
      </Field>
    </div>
  );
}
