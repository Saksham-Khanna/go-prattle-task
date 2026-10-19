import type { ReactNode } from "react";
import {
  ClipboardList,
  Mic2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_META, type Category } from "@/types/requirement";

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  planner: ClipboardList,
  performer: Mic2,
  crew: Users,
};

const tones = {
  neutral: "bg-ink/5 text-ink-soft border-ink/10",
  accent: "bg-accent-soft text-accent-deep border-accent/20",
  planner: "bg-planner-soft text-planner border-planner/25",
  performer: "bg-performer-soft text-performer border-performer/25",
  crew: "bg-crew-soft text-crew border-crew/25",
  success: "bg-success-soft text-success border-success/25",
  danger: "bg-danger-soft text-danger border-danger/25",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  icon: Icon,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${tones[tone]} ${className}`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

export function CategoryBadge({
  category,
  size = "md",
}: {
  category: Category;
  size?: "md" | "lg";
}) {
  return (
    <Badge
      tone={category}
      icon={CATEGORY_ICONS[category]}
      className={size === "lg" ? "px-3.5 py-1.5 text-sm" : undefined}
    >
      {CATEGORY_META[category].title}
    </Badge>
  );
}
