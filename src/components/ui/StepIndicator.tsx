import { Check } from "lucide-react";

export const STEPS = [
  { id: 1, label: "Event basics" },
  { id: 2, label: "Requirements" },
  { id: 3, label: "Details" },
  { id: 4, label: "Review" },
] as const;

export interface StepIndicatorProps {
  current: number;
  /** furthest step the user has reached (allows clicking back to it) */
  maxReached: number;
  onStepClick: (step: number) => void;
}

export function StepIndicator({
  current,
  maxReached,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <nav aria-label="Form progress" className="mb-6">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft sm:hidden">
        Step {current} of {STEPS.length}
        <span className="text-ink-faint"> · {STEPS[current - 1].label}</span>
      </p>
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((s, i) => {
          const done = s.id < current;
          const active = s.id === current;
          const clickable = s.id <= maxReached && s.id !== current;
          return (
            <li
              key={s.id}
              className={`flex min-w-0 items-center gap-2 sm:gap-3 ${
                i < STEPS.length - 1 ? "flex-1" : ""
              }`}
            >
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(s.id)}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  clickable ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold transition-all duration-200 ${
                    done
                      ? "border-accent bg-accent text-white"
                      : active
                        ? "border-accent bg-surface text-accent ring-4 ring-accent/15"
                        : "border-line-strong bg-surface text-ink-faint"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : s.id}
                </span>
                <span
                  className={`hidden truncate text-[13px] font-semibold sm:block ${
                    active
                      ? "text-ink"
                      : done
                        ? "text-ink-soft"
                        : "text-ink-faint"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`h-px min-w-3 flex-1 rounded transition-colors duration-300 ${
                    done ? "bg-accent/60" : "bg-line-strong/70"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
