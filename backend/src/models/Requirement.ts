import { Schema, model, type Document } from "mongoose";
import { CATEGORIES } from "../validators/requirement";

export type Category = (typeof CATEGORIES)[number];

export interface RequirementDoc extends Document {
  eventName: string;
  eventType: string;
  startDate: Date;
  endDate: Date | null;
  location: string;
  venue: string | null;
  category: Category;
  /**
   * Category-specific requirement data. The Zod validator guarantees the
   * shape matches `category` before this is ever written, so a plain Mixed
   * type is safe here — Mongoose's own typing cannot express the
   * category-discriminated union.
   */
  requirements: Record<string, unknown>;
  additionalDetails: Record<string, unknown>;
  status: "submitted";
  createdAt: Date;
  updatedAt: Date;
}

const RequirementSchema = new Schema<RequirementDoc>(
  {
    eventName: { type: String, required: true, trim: true },
    eventType: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null },
    location: { type: String, required: true, trim: true },
    venue: { type: String, default: null, trim: true },
    category: { type: String, required: true, enum: CATEGORIES },
    requirements: { type: Schema.Types.Mixed, required: true },
    additionalDetails: { type: Schema.Types.Mixed, required: true },
    status: { type: String, enum: ["submitted"], default: "submitted" },
  },
  { timestamps: true },
);

RequirementSchema.index({ createdAt: -1 });
RequirementSchema.index({ category: 1, createdAt: -1 });

export const Requirement = model<RequirementDoc>("Requirement", RequirementSchema);
