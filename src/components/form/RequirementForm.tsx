"use client";

import { useCallback, useRef, useState } from "react";
import type { ZodIssue } from "zod";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import {
  type Category,
  type FormState,
  initialFormState,
} from "@/types/requirement";
import {
  buildPayload,
  humanizeZodIssue,
  requirementPayloadSchema,
  stepForField,
} from "@/lib/validation";
import { ApiRequestError, requirementsApi } from "@/lib/api";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Step1Basics } from "@/components/steps/Step1Basics";
import { Step2Category } from "@/components/steps/Step2Category";
import { Step3Details } from "@/components/steps/Step3Details";
import { Step4Review } from "@/components/steps/Step4Review";
import { SuccessScreen } from "@/components/SuccessScreen";

/**
 * Maps validation issues to display keys, scoped to one step.
 * step <= 0 means "all steps".
 */
function mapIssuesToStep(issues: ZodIssue[], step: number): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of issues) {
    const root = String(issue.path[0] ?? "");
    const inStep =
      step <= 0
        ? true
        : step === 1
          ? root !== "requirements" && root !== "additionalDetails"
          : step === 2
            ? root === "requirements"
            : true;
    if (!inStep) continue;
    const key =
      root === "requirements" ? issue.path.slice(1).join(".") : issue.path.join(".");
    if (!(key in map)) map[key] = humanizeZodIssue(issue);
  }
  return map;
}

/** Server errors use the wire field path; form fields drop the `requirements.` root. */
function formKeyForServerField(field: string): string {
  return field.startsWith("requirements.")
    ? field.slice("requirements.".length)
    : field;
}

export function RequirementForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<ApiRequestError | null>(null);
  const [submitted, setSubmitted] = useState<{
    id: string;
    category: Category;
  } | null>(null);
  const submittingRef = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  /** Removes only the errors for fields the user just edited. */
  const clearFieldErrors = useCallback((keys: string[]) => {
    setErrors((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of keys) {
        if (key in next) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, []);

  const update = useCallback(
    (patch: Partial<FormState>) => {
      setForm((f) => ({ ...f, ...patch }));
      // Switching category invalidates every Step 2 error from the old draft.
      if ("category" in patch) setErrors({});
      else clearFieldErrors(Object.keys(patch));
      setSubmitError(null);
    },
    [clearFieldErrors],
  );
  const updateSection = useCallback(
    (section: Category, patch: Partial<FormState[Category]>) => {
      setForm((f) => ({ ...f, [section]: { ...f[section], ...patch } }));
      clearFieldErrors(Object.keys(patch));
      setSubmitError(null);
    },
    [clearFieldErrors],
  );
  const updateDetails = useCallback(
    (patch: Partial<FormState["details"]>) => {
      setForm((f) => ({ ...f, details: { ...f.details, ...patch } }));
      clearFieldErrors(
        Object.keys(patch).map((key) => `additionalDetails.${key}`),
      );
      setSubmitError(null);
    },
    [clearFieldErrors],
  );

  const scrollToTop = () =>
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  /** Validates only the fields belonging to step `n` (1-based). */
  const validateStep = (n: number): boolean => {
    if (form.category === "" && n > 1) {
      setErrors({ category: "Choose a category in Step 1 first." });
      setStep(1);
      return false;
    }
    const res = requirementPayloadSchema.safeParse(buildPayload(form));
    if (!res.success) {
      const map = mapIssuesToStep(res.error.issues, n);
      if (Object.keys(map).length > 0) {
        setErrors(map);
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    const next = Math.min(4, step + 1);
    setStep(next);
    setMaxReached((m) => Math.max(m, next));
    setErrors({});
    setSubmitError(null);
    scrollToTop();
  };

  const goBack = () => {
    if (submittingRef.current) return;
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
      setSubmitError(null);
      scrollToTop();
    }
  };

  const jumpTo = (target: number) => {
    if (submittingRef.current) return;
    if (target >= 1 && target <= maxReached && target !== step) {
      setStep(target);
      setErrors({});
      setSubmitError(null);
      scrollToTop();
    }
  };

  /**
   * Applies server-side field errors to the matching form fields and jumps to
   * the first affected step. Returns false when there is nothing field-level
   * to show (the caller then displays a general submission banner).
   */
  const applyServerFieldErrors = (error: ApiRequestError): boolean => {
    const map: Record<string, string> = {};
    let firstStep = 4;

    for (const issue of error.errors) {
      const key = formKeyForServerField(issue.field);
      if (
        !key ||
        key === "body" ||
        key === "requirements" ||
        key === "additionalDetails"
      ) {
        continue;
      }
      if (!(key in map)) map[key] = issue.message;
      firstStep = Math.min(firstStep, stepForField(issue.field));
    }

    if (Object.keys(map).length === 0) return false;
    setErrors(map);
    setStep(firstStep);
    setMaxReached((m) => Math.max(m, firstStep));
    scrollToTop();
    return true;
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return; // guard against double submission
    setErrors({});
    const res = requirementPayloadSchema.safeParse(buildPayload(form));
    if (!res.success) {
      const firstBad =
        res.error.issues
          .map((i) => stepForField(i.path.join(".")))
          .sort((a, b) => a - b)[0] ?? 1;
      setErrors(mapIssuesToStep(res.error.issues, 0));
      setStep(firstBad);
      setMaxReached((m) => Math.max(m, firstBad));
      scrollToTop();
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await requirementsApi.create(res.data);
      setSubmitted({ id: created.data.id, category: created.data.category });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const apiError =
        err instanceof ApiRequestError
          ? err
          : new ApiRequestError(
              "Something went wrong. Please try again.",
              0,
              [],
              "server",
            );

      // The server rejected specific fields: show them next to the inputs
      // instead of hiding a raw validation payload in a generic banner.
      const applied =
        apiError.kind === "validation" &&
        applyServerFieldErrors(apiError);

      setSubmitError(applied ? null : apiError);
      if (!applied) window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const reset = () => {
    setForm(initialFormState);
    setStep(1);
    setMaxReached(1);
    setErrors({});
    setSubmitError(null);
    setSubmitted(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      <Header step={submitted ? 4 : step} />

      <div ref={topRef} className="h-8" aria-hidden />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {submitted ? "All done — it's saved" : "Post an event requirement"}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">
              {submitted
                ? "A copy is in the database. Start another requirement any time."
                : "Tell the planning, performance and crew community exactly what your event needs. Four quick steps — everything you type is kept."}
            </p>
          </div>

          {submitted ? (
            <SuccessScreen
              id={submitted.id}
              category={submitted.category}
              onReset={reset}
            />
          ) : (
            <>
              <StepIndicator
                current={step}
                maxReached={maxReached}
                onStepClick={jumpTo}
              />
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step < 4) goNext();
                  else void handleSubmit();
                }}
                className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-8"
              >
                {Object.keys(errors).length > 0 && (
                  <div
                    className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-[13px] font-medium text-danger"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    A few fields need attention before you can continue.
                  </div>
                )}

                <div key={step} className="animate-step-in">
                  {step === 1 && (
                    <Step1Basics form={form} errors={errors} onChange={update} />
                  )}
                  {step === 2 && (
                    <Step2Category
                      form={form}
                      errors={errors}
                      onUpdate={updateSection}
                    />
                  )}
                  {step === 3 && (
                    <Step3Details
                      form={form}
                      errors={errors}
                      onUpdate={updateDetails}
                    />
                  )}
                  {step === 4 && (
                    <Step4Review
                      form={form}
                      submitError={submitError}
                      onEdit={jumpTo}
                    />
                  )}
                </div>

                <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="secondary"
                    icon={<ArrowLeft className="h-4 w-4" />}
                    onClick={goBack}
                    disabled={step === 1 || submitting}
                  >
                    Back
                  </Button>
                  {step < 4 ? (
                    <Button type="submit" size="lg">
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" size="lg" loading={submitting}>
                      {submitting ? "Submitting…" : "Submit requirement"}
                    </Button>
                  )}
                </div>
              </form>
              <p className="mt-4 text-xs text-ink-faint">
                Submissions are validated and saved by the requirements API —
                nothing leaves your browser until you press Submit.
              </p>
            </>
          )}
        </div>

        <Sidebar form={form} />
      </main>

      <footer className="border-t border-line py-6">
        <p className="mx-auto max-w-6xl px-4 text-xs text-ink-faint sm:px-6">
          Candidate assignment implementation for GoPratle · Not an official
          GoPratle product.
        </p>
      </footer>
    </div>
  );
}
