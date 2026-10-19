"use client";

import { AlertCircle, Check } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_META,
  EVENT_TYPE_OPTIONS,
  type Category,
  type FormState,
} from "@/types/requirement";
import { Field, Input, Select } from "@/components/ui/Field";
import { CATEGORY_ICONS } from "@/components/ui/Badge";

const cardSelected: Record<Category, string> = {
  planner: "border-planner/60 bg-planner-soft/70 shadow-card",
  performer: "border-performer/55 bg-performer-soft/70 shadow-card",
  crew: "border-crew/60 bg-crew-soft/70 shadow-card",
};
const cardCheck: Record<Category, string> = {
  planner: "bg-planner",
  performer: "bg-performer",
  crew: "bg-crew",
};
const cardTile: Record<Category, string> = {
  planner: "bg-planner-soft text-planner",
  performer: "bg-performer-soft text-performer",
  crew: "bg-crew-soft text-crew",
};

export interface Step1Props {
  form: FormState;
  errors: Record<string, string>;
  onChange: (patch: Partial<FormState>) => void;
}

export function Step1Basics({ form, errors, onChange }: Step1Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">
          Event basics
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Start with the essentials — what the event is and when it happens.
        </p>
      </div>

      <Field
        id="eventName"
        label="Event name"
        required
        error={errors.eventName}
        hint="Something recognisable, e.g. “Circuitry — Annual Tech Fest 2026”."
      >
        <Input
          id="eventName"
          value={form.eventName}
          invalid={!!errors.eventName}
          maxLength={120}
          placeholder="e.g. Circuitry — Annual Tech Fest 2026"
          onChange={(e) => onChange({ eventName: e.target.value })}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="eventType"
          label="Event type"
          required
          error={errors.eventType}
        >
          <Select
            id="eventType"
            value={form.eventType}
            invalid={!!errors.eventType}
            onChange={(e) => onChange({ eventType: e.target.value })}
          >
            <option value="" disabled>
              Select event type…
            </option>
            {EVENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="location"
          label="Location"
          required
          error={errors.location}
          hint="City or town where the event happens."
        >
          <Input
            id="location"
            value={form.location}
            invalid={!!errors.location}
            maxLength={120}
            placeholder="e.g. Pune"
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="startDate"
          label="Event date"
          required
          error={errors.startDate}
        >
          <Input
            id="startDate"
            type="date"
            value={form.startDate}
            invalid={!!errors.startDate}
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </Field>

        <Field
          id="endDate"
          label="Event end date"
          error={errors.endDate}
          hint="Only if the event spans multiple days."
        >
          <Input
            id="endDate"
            type="date"
            value={form.endDate}
            min={form.startDate || undefined}
            invalid={!!errors.endDate}
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
        </Field>
      </div>

      <Field
        id="venue"
        label="Venue"
        error={errors.venue}
        hint="Optional — the specific venue or campus hall."
      >
        <Input
          id="venue"
          value={form.venue}
          invalid={!!errors.venue}
          maxLength={120}
          placeholder="e.g. Central auditorium, Sector 62"
          onChange={(e) => onChange({ venue: e.target.value })}
        />
      </Field>

      <fieldset>
        <legend className="mb-2 flex items-baseline gap-1.5 text-sm font-semibold text-ink">
          Who are you looking for?
          <span className="text-accent" aria-hidden>
            *
          </span>
        </legend>
        <div
          role="radiogroup"
          aria-label="Requirement category"
          className="grid gap-3 sm:grid-cols-3"
        >
          {CATEGORIES.map((c) => {
            const meta = CATEGORY_META[c];
            const Icon = CATEGORY_ICONS[c];
            const sel = form.category === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => onChange({ category: c })}
                className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  sel
                    ? cardSelected[c]
                    : "border-line bg-surface hover:border-line-strong hover:shadow-card"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${cardTile[c]}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-3 block text-sm font-bold text-ink">
                  {meta.title}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                  {meta.description}
                </span>
                {sel && (
                  <span
                    className={`absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-white ${cardCheck[c]}`}
                    aria-hidden
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {errors.category ? (
          <p
            className="mt-2 flex items-start gap-1.5 text-[13px] font-medium text-danger"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {errors.category}
          </p>
        ) : (
          <p className="mt-2 text-[13px] text-ink-faint">
            You can change this later — everything you've typed is kept.
          </p>
        )}
      </fieldset>
    </div>
  );
}
