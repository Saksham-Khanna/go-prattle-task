import {
  date,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  AdditionalDetails,
  Category,
  CategoryRequirements,
} from "../types/requirement";

/**
 * Requirements table for the embedded API.
 *
 * Mirrors the standalone Express backend's Mongoose model
 * (backend/src/models/Requirement.ts) 1:1 so both implementations share the
 * same field contract. `requirements` is a structured JSONB document whose
 * shape depends on `category` and is validated with a category-discriminated
 * Zod schema before insert (src/app/api/requirements/route.ts).
 */
export const requirements = pgTable("requirements", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventName: text("event_name").notNull(),
  eventType: text("event_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  location: text("location").notNull(),
  venue: text("venue"),
  category: text("category").$type<Category>().notNull(),
  requirements: jsonb("requirements").$type<CategoryRequirements>().notNull(),
  additionalDetails: jsonb("additional_details")
    .$type<AdditionalDetails>()
    .notNull(),
  status: text("status").notNull().default("submitted"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type RequirementRow = typeof requirements.$inferSelect;
