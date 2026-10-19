import { Sparkles } from "lucide-react";
import { STEPS } from "@/components/ui/StepIndicator";

function LogoMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-[#ff8149] shadow-sm shadow-accent/30">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M3 10h18" />
        <path d="M8 3v4M16 3v4" />
        <path d="m9 15.5 2 2 4-4" />
      </svg>
    </span>
  );
}

export function Header({ step }: { step: number }) {
  const pct = Math.round((step / STEPS.length) * 100);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold tracking-tight text-ink">
              Pratle Events
            </p>
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint xs:block sm:block">
              Requirement desk
            </p>
          </div>
          <span className="ml-1 hidden items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-bold text-ink-soft md:inline-flex">
            <Sparkles className="h-3 w-3 text-accent" />
            Candidate build
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden text-sm font-semibold text-ink-soft lg:block">
            Post a Requirement
          </span>
          <div className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pl-3.5 pr-2 shadow-sm">
            <span className="text-xs font-bold text-ink">
              Step {step}
              <span className="text-ink-faint"> / {STEPS.length}</span>
            </span>
            <span
              className="h-1.5 w-14 overflow-hidden rounded-full bg-line sm:w-20"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Form completion"
            >
              <span
                className="block h-full rounded-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
