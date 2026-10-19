import { db } from "@/db";
import { requirements, RequirementRow } from "@/db/schema";
import {
  issuesToFieldErrors,
  requirementPayloadSchema,
} from "@/lib/validation";
import type { RequirementRecord } from "@/types/requirement";

export const dynamic = "force-dynamic";

function validationError(errors: { field: string; message: string }[]) {
  return Response.json(
    { success: false, message: "Validation failed", errors },
    { status: 400 },
  );
}

/**
 * POST /api/requirements
 * Validates the full payload with the category-discriminated Zod schema,
 * persists it, and returns 201 with the generated id.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError([
      { field: "body", message: "Request body must be valid JSON" },
    ]);
  }

  const result = requirementPayloadSchema.safeParse(body);
  if (!result.success) {
    return validationError(issuesToFieldErrors(result.error));
  }

  const payload = result.data;
  try {
    const [row] = await db
      .insert(requirements)
      .values({
        eventName: payload.eventName,
        eventType: payload.eventType,
        startDate: payload.startDate,
        endDate: payload.endDate,
        location: payload.location,
        venue: payload.venue,
        category: payload.category,
        requirements: payload.requirements,
        additionalDetails: payload.additionalDetails,
        status: "submitted",
      })
      .returning();

    return Response.json(
      {
        success: true,
        message: "Requirement created successfully",
        data: { id: row.id, category: row.category, status: row.status },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api] failed to create requirement:", error);
    return Response.json(
      {
        success: false,
        message:
          "Something went wrong while saving your requirement. Please try again.",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/requirements (list is not part of the assignment contract;
 * kept as a convenience for verifying saved records in the sandbox).
 */
export async function GET() {
  try {
    const rows = await db
      .select()
      .from(requirements)
      .orderBy(requirements.createdAt)
      .limit(50);
    const data = rows.map((row) => serialize(row));
    return Response.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("[api] failed to list requirements:", error);
    return Response.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

function serialize(row: RequirementRow): RequirementRecord {
  return {
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
}
