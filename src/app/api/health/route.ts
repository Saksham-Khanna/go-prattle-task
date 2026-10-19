import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * API health + basic service status (same contract as the standalone
 * Express backend's GET /api/health).
 */
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({
      success: true,
      status: "ok",
      service: "event-requirements-api",
      database: "connected",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        success: false,
        status: "degraded",
        service: "event-requirements-api",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
