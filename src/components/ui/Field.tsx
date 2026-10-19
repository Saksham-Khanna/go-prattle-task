"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import type { Option } from "@/types/requirement";

/** Shared visual language for text inputs, selects and textareas. */
export function inputCls(invalid?: boolean) {
  return [
    "w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-surface",
    invalid
      ? "border-danger/70 focus:border-danger focus:ring-danger/25"
      : "border-line-strong/70 hover:border-line-strong focus:border-accent/70 focus:ring-accent/25",
  ].join(" ");
}

export interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
  className = "",
}: FieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline gap-1.5 text-sm font-semibold text-ink"
      >
        {label}
        {required ? (
          <span className="text-accent" aria-hidden>
            *
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            optional
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p
          className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-danger"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-ink-faint">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, className = "", ...rest }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`${inputCls(invalid)} ${className}`}
      {...rest}
    />
  ),
);
Input.displayName = "Input";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};
export function Select({
  invalid,
  className = "",
  children,
  ...rest
}: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={`${inputCls(invalid)} appearance-none pr-10 ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
  showCount?: boolean;
};
export function Textarea({
  invalid,
  showCount,
  className = "",
  value,
  rows = 3,
  ...rest
}: TextareaProps) {
  const len = typeof value === "string" ? value.length : 0;
  return (
    <div>
      <textarea
        value={value}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={`${inputCls(invalid)} resize-y ${className}`}
        {...rest}
      />
      {showCount && rest.maxLength ? (
        <p className="mt-1 text-right text-[11px] tabular-nums text-ink-faint">
          {len}/{rest.maxLength}
        </p>
      ) : null}
    </div>
  );
}

export interface ChipGroupProps {
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  invalid?: boolean;
  error?: string;
}

/** Multi-select pill group used for services & facilities. */
export function ChipGroup({
  options,
  selected,
  onToggle,
  invalid,
  error,
}: ChipGroupProps) {
  return (
    <div>
      <div role="group" className="flex flex-wrap gap-2">
        {options.map((o) => {
          const isSel = selected.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={isSel}
              onClick={() => onToggle(o.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                isSel
                  ? "border-accent/70 bg-accent-soft text-accent-deep shadow-sm"
                  : "border-line-strong/70 bg-surface text-ink-soft hover:border-accent/40 hover:text-ink"
              }`}
            >
              {isSel && <Check className="h-3.5 w-3.5" />}
              {o.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p
          className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium text-danger"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {invalid && !error ? null : null}
    </div>
  );
}
