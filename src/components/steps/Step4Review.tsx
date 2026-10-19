"use client";

import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import {
  BUDGET_RANGE_OPTIONS,
  CATEGORY_META,
  CREW_ROLE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  FACILITY_OPTIONS,
  GENRE_APPLIES_TO,
  PERFORMANCE_TYPE_OPTIONS,
  PLANNER_SERVICE_OPTIONS,
  SHIFT_DURATION_OPTIONS,
  EVENT_TYPE_OPTIONS,
  formatDate,
  labelFor,
  type Category,
  type FormState,
} from "@/types/requirement";
import { ApiRequestError } from "@/lib/api";
import { CATEGORY_ICONS } from "@/components/ui/Badge";

function Section({
  title,
  icon: Icon,
  onEdit,
  children,
}: {
  title: string;
  icon: LucideIcon;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-paper/60 p-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
          <Icon className="h-4 w-4 text-ink-faint" />
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </header>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Row({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold text-ink-faint">{label}</dt>
      <dd
        className={`mt-0.5 text-sm font-medium leading-relaxed ${
          value ? "text-ink" : "text-ink-faint"
        }`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}

function RequirementsRows({ form }: { form: FormState }) {
  const category = form.category as Category;
  if (category === "planner") {
    const p = form.planner;
    return (
      <>
        <Row label="Expected attendees" value={p.expectedAttendees} />
        <Row
          label="Budget range"
          value={labelFor(BUDGET_RANGE_OPTIONS, p.budgetRange)}
        />
        <Row
          label="Services required"
          full
          value={p.services
            .map((s) => labelFor(PLANNER_SERVICE_OPTIONS, s))
            .join(", ")}
        />
        <Row label="Planning scope" full value={p.planningScope} />
        <Row
          label="Preferred experience"
          value={labelFor(EXPERIENCE_LEVEL_OPTIONS, p.experienceLevel)}
        />
        <Row label="Additional details" value={p.additionalNotes} />
      </>
    );
  }
  if (category === "performer") {
    const f = form.performer;
    const showGenre =
      f.performanceType === "" ||
      f.performanceType === "dancer" ||
      GENRE_APPLIES_TO.has(f.performanceType);
    return (
      <>
        <Row
          label="Performance type"
          value={labelFor(PERFORMANCE_TYPE_OPTIONS, f.performanceType)}
        />
        <Row label="Number of performers" value={f.numberOfPerformers} />
        {showGenre && (
          <Row label="Genre / style" value={f.genreOrStyle} />
        )}
        <Row
          label="Performance duration"
          value={f.durationMinutes ? `${f.durationMinutes} min` : ""}
        />
        <Row
          label="Budget range"
          value={labelFor(BUDGET_RANGE_OPTIONS, f.budgetRange)}
        />
        <Row label="Technical setup" value={f.technicalSetup} />
        <Row
          label="Experience requirement"
          full
          value={f.experienceRequirement}
        />
      </>
    );
  }
  const c = form.crew;
  return (
    <>
      <Row label="Crew role" value={labelFor(CREW_ROLE_OPTIONS, c.crewRole)} />
      <Row label="Crew members" value={c.numberOfMembers} />
      <Row
        label="Shift duration"
        value={labelFor(SHIFT_DURATION_OPTIONS, c.shiftDuration)}
      />
      <Row
        label="Experience level"
        value={labelFor(EXPERIENCE_LEVEL_OPTIONS, c.experienceLevel)}
      />
      <Row
        label="Compensation range"
        value={labelFor(BUDGET_RANGE_OPTIONS, c.budgetRange)}
      />
      <Row label="Required skills" value={c.requiredSkills} />
      <Row
        label="Equipment / uniform"
        full
        value={c.equipmentUniform}
      />
    </>
  );
}

export interface Step4ReviewProps {
  form: FormState;
  submitError: ApiRequestError | null;
  onEdit: (step: number) => void;
}

export function Step4Review({
  form,
  submitError,
  onEdit,
}: Step4ReviewProps) {
  const category = form.category as Category;
  const meta = CATEGORY_META[category];
  const Icon = CATEGORY_ICONS[category];
  const d = form.details;
  const dateLabel = form.startDate
    ? form.endDate && form.endDate >= form.startDate
      ? `${formatDate(form.startDate)} – ${formatDate(form.endDate)}`
      : formatDate(form.startDate)
    : "";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">
          Review & submit
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          One last look — use Edit to jump back to any section without losing
          data.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-accent to-[#ff7a3d] p-5 text-white shadow-lift">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/75">
              Looking for
            </p>
            <p className="font-display text-lg font-semibold">{meta.title}</p>
          </div>
        </div>
        <p className="text-sm font-medium text-white/85">{meta.description}</p>
      </div>

      {submitError && submitError.kind !== "validation" && (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3.5"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <div className="text-[13px] leading-relaxed text-danger">
            <p className="font-bold">Submission failed</p>
            <p className="mt-0.5">{submitError.message}</p>
            {submitError.kind === "network" && (
              <p className="mt-1 font-medium text-danger/80">
                Your entries are safe — fix the connection and press Submit
                again.
              </p>
            )}
          </div>
        </div>
      )}

      <Section title="Event basics" icon={CalendarDays} onEdit={() => onEdit(1)}>
        <Row label="Event name" value={form.eventName} />
        <Row
          label="Event type"
          value={labelFor(EVENT_TYPE_OPTIONS, form.eventType)}
        />
        <Row label="Date" value={dateLabel} />
        <Row label="Location" value={form.location} />
        <Row label="Venue" value={form.venue} />
      </Section>

      <Section
        title={`${meta.title} requirements`}
        icon={Icon}
        onEdit={() => onEdit(2)}
      >
        <RequirementsRows form={form} />
      </Section>

      <Section
        title="Additional details"
        icon={FileText}
        onEdit={() => onEdit(3)}
      >
        {d.facilities.length > 0 && (
          <Row
            label="Facilities"
            full
            value={d.facilities
              .map((f) =>
                labelFor(FACILITY_OPTIONS[category], f),
              )
              .join(", ")}
          />
        )}
        <Row label="Availability" full value={d.availability} />
        <Row label="Qualifications" full value={d.qualifications} />
        <Row
          label="Special instructions"
          full
          value={d.specialInstructions}
        />
        <Row label="Notes" full value={d.notes} />
      </Section>

      <p className="flex items-center gap-2 text-xs text-ink-faint">
        <ClipboardCheck className="h-4 w-4 shrink-0" />
        Submitting validates the full payload and saves it to the requirements
        database. You'll get a requirement ID on success.
      </p>
    </div>
  );
}
