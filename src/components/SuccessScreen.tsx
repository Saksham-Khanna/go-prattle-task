"use client";

import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  CircleAlert,
  Copy,
  LoaderCircle,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { requirementsApi } from "@/lib/api";
import {
  CATEGORY_META,
  type Category,
  type RequirementRecord,
} from "@/types/requirement";
import { Button } from "@/components/ui/Button";
import { CategoryBadge } from "@/components/ui/Badge";

type VerifyState = "checking" | "ok" | "error";

export function SuccessScreen({
  id,
  category,
  onReset,
}: {
  id: string;
  category: Category;
  onReset: () => void;
}) {
  const [verify, setVerify] = useState<VerifyState>("checking");
  const [record, setRecord] = useState<RequirementRecord | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    requirementsApi
      .getById(id)
      .then((res) => {
        if (!alive) return;
        setRecord(res.data);
        setVerify("ok");
      })
      .catch(() => {
        if (alive) setVerify("error");
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const copyId = () => {
    navigator.clipboard
      ?.writeText(id)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => undefined);
  };

  return (
    <div className="animate-pop-in rounded-3xl border border-line bg-surface p-8 text-center shadow-card sm:p-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
        <CheckCircle2 className="h-8 w-8 text-success" />
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold text-ink">
        Requirement submitted
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
        Your {CATEGORY_META[category].title.toLowerCase()} requirement was
        confirmed by the API and saved. Keep this ID to reference it later.
      </p>

      <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-dashed border-line-strong/70 bg-paper px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-faint">
          Requirement ID
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-2">
          <code className="break-all font-mono text-[13px] font-semibold text-ink">
            {id}
          </code>
          <button
            type="button"
            onClick={copyId}
            aria-label="Copy requirement ID"
            className="rounded-lg border border-line bg-surface p-1.5 text-ink-soft transition-colors hover:border-accent/40 hover:text-accent"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <CategoryBadge category={category} size="lg" />
      </div>

      <div
        className="mx-auto mt-5 flex max-w-md items-start gap-2.5 rounded-xl border border-line bg-paper px-4 py-3 text-left"
        aria-live="polite"
      >
        {verify === "checking" && (
          <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-ink-faint" />
        )}
        {verify === "ok" && <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />}
        {verify === "error" && (
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        )}
        <p className="text-[13px] leading-relaxed text-ink-soft">
          {verify === "checking" && "Verifying the saved record…"}
          {verify === "ok" && record && (
            <>
              <span className="font-bold text-ink">
                {record.eventName}
              </span>{" "}
              verified in the database · saved{" "}
              {new Date(record.createdAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </>
          )}
          {verify === "error" &&
            "Saved — but live verification of the record is currently unavailable."}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" icon={<Plus className="h-4 w-4" />} onClick={onReset}>
          Post another requirement
        </Button>
      </div>
    </div>
  );
}
