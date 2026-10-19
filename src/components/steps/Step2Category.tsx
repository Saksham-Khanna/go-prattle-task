"use client";

import {
  CATEGORY_META,
  type Category,
  type FormState,
} from "@/types/requirement";
import { CategoryBadge } from "@/components/ui/Badge";
import { Step2Planner } from "./Step2Planner";
import { Step2Performer } from "./Step2Performer";
import { Step2Crew } from "./Step2Crew";

export type SectionUpdater = (
  section: Category,
  patch: Partial<FormState[Category]>,
) => void;

export interface Step2Props {
  form: FormState;
  errors: Record<string, string>;
  onUpdate: SectionUpdater;
}

export function Step2Category({ form, errors, onUpdate }: Step2Props) {
  const category = form.category;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">
            {category ? CATEGORY_META[category].title : "Requirements"} details
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {category
              ? "These fields are tailored to what you're hiring."
              : "Select a category in Step 1 first."}
          </p>
        </div>
        {category && <CategoryBadge category={category} />}
      </div>

      {category === "planner" && (
        <Step2Planner
          form={form}
          errors={errors}
          onUpdate={(patch) => onUpdate("planner", patch)}
        />
      )}
      {category === "performer" && (
        <Step2Performer
          form={form}
          errors={errors}
          onUpdate={(patch) => onUpdate("performer", patch)}
        />
      )}
      {category === "crew" && (
        <Step2Crew
          form={form}
          errors={errors}
          onUpdate={(patch) => onUpdate("crew", patch)}
        />
      )}
    </div>
  );
}
