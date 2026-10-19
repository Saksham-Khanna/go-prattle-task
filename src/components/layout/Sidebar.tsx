"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Lightbulb,
  MapPin,
  Server,
  CircleCheck,
  CircleAlert,
  LoaderCircle,
} from "lucide-react";
import {
  CATEGORY_META,
  formatDate,
  labelFor,
  EVENT_TYPE_OPTIONS,
  type FormState,
} from "@/types/requirement";
import { checkApiHealth } from "@/lib/api";
import { CategoryBadge } from "@/components/ui/Badge";

const cardCls =
  "rounded-2xl border border-line bg-surface p-5 shadow-card";

function ApiStatusCard() {
  const [state, setState] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    let alive = true;
    checkApiHealth().then((ok) => {
      if (alive) setState(ok ? "ok" : "down");
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className={cardCls}>
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <Server className="h-4 w-4 text-ink-faint" />
        API status
      </p>
      <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-2.5">
        {state === "checking" ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-ink-faint" />
        ) : state === "ok" ? (
          <CircleCheck className="h-4 w-4 text-success" />
        ) : (
          <CircleAlert className="h-4 w-4 text-danger" />
        )}
        <p className="text-[13px] font-semibold text-ink-soft">
          {state === "checking"
            ? "Checking connection…"
            : state === "ok"
              ? "Connected — requirements are being saved"
              : "Unreachable — submissions will fail until it recovers"}
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ form }: { form: FormState }) {
  const category = form.category || null;
  const dateLabel = form.startDate
    ? form.endDate && form.endDate >= form.startDate
      ? `${formatDate(form.startDate)} – ${formatDate(form.endDate)}`
      : formatDate(form.startDate)
    : "";
  return (
    <div className={cardCls}>
      <p className="text-sm font-bold text-ink">Your requirement so far</p>
      <dl className="mt-3 space-y-2.5 text-[13px]">
        <div className="flex items-start gap-2.5">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
          <div>
            <dt className="text-ink-faint">Event</dt>
            <dd className="font-semibold text-ink">
              {form.eventName.trim() || "Not set yet"}
              {form.eventType && (
                <span className="ml-1.5 font-medium text-ink-soft">
                  · {labelFor(EVENT_TYPE_OPTIONS, form.eventType)}
                </span>
              )}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
          <div>
            <dt className="text-ink-faint">When & where</dt>
            <dd className="font-semibold text-ink">
              {dateLabel || (form.location ? "Date pending" : "Not set yet")}
              {form.location && (
                <span className="ml-1.5 font-medium text-ink-soft">
                  · {form.location}
                </span>
              )}
            </dd>
          </div>
        </div>
      </dl>
      <div className="mt-4 border-t border-line pt-4">
        {category ? (
          <>
            <CategoryBadge category={category} />
            <ul className="mt-3 space-y-1.5">
              {CATEGORY_META[category].step2Collects.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[13px] text-ink-soft"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Pick a category in Step 1 and this card will summarise what we
            capture for it.
          </p>
        )}
      </div>
    </div>
  );
}

const TIPS = [
  "Mention headcount and venue type — planners quote faster with context.",
  "A rough budget band keeps you in the right tier without committing.",
  "List non-negotiables (timings, genre, certifications) in the instructions.",
];

function TipsCard() {
  return (
    <div className={cardCls}>
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <Lightbulb className="h-4 w-4 text-accent" />
        Posting tips
      </p>
      <ul className="mt-3 space-y-2.5">
        {TIPS.map((tip) => (
          <li
            key={tip}
            className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line-strong" />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({ form }: { form: FormState }) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
      <ApiStatusCard />
      <SummaryCard form={form} />
      <TipsCard />
    </aside>
  );
}
