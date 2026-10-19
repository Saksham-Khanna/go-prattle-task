import { db } from "@/db";
import { eq } from "drizzle-orm";
import { requirements } from "@/db/schema";
import type { RequirementRecord } from "@/types/requirement";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/requirements/:id
 * Returns the saved requirement or 404. Invalid id shapes get 400.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;

  if (!UUID_RE.test(id)) {
    return Response.json(
      { success: false, message: "Invalid requirement ID format" },
      { status: 400 },
    );
  }

  let rows;
  try {
    rows = await db
      .select()
      .from(requirements)
      .where(eq(requirements.id, id))
      .limit(1);
  } catch (error) {
    console.error("[api] failed to fetch requirement:", error);
    return Response.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }

  const row = rows[0];
  if (!row) {
    return Response.json(
      { success: false, message: "Requirement not found" },
      { status: 404 },
    );
  }

  const record: RequirementRecord = {
    id: row.id,
    eventName: row.eventName,
    eventType: row.eventType,
    startDate: row.startDate,
    endDate: row.endDate,
    location: row.location,
    venue: row.venue,
    category: row.category,
    requirements: row.requirements,
    additionalDetails: row.additionalDetails,
    status: (row.status ?? "submitted") as "submitted",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };

  return Response.json({ success: true, data: record });
}
