import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";

/** GET /api/health — API health + database status (503 while disconnected). */
export const healthController = asyncHandler(async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const connected = dbState === 1;

  res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? "ok" : "degraded",
    service: "gopratle-event-requirements-api",
    database: connected ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
