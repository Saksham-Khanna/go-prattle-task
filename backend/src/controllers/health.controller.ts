import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";

/** GET /api/health — API health + basic service status. */
export const healthController = asyncHandler(async (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({
    success: true,
    status: "ok",
    service: "gopratle-event-requirements-api",
    database: dbState === 1 ? "connected" : "disconnected",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
