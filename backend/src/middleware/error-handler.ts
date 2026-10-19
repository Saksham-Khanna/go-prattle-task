import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
};

/**
 * Centralised error handling. Only operational messages are exposed —
 * stack traces and database internals stay server-side (logged instead).
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const e = err as Error & { type?: string };

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.fieldErrors ? { errors: err.fieldErrors } : {}),
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // express.json() body-parse failure
  if (e?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Request body must be valid JSON",
    });
  }

  // CORS rejection from the origin guard in app.ts
  if (e instanceof Error && e.message.startsWith("Origin")) {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed by CORS policy",
    });
  }

  console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({
    success: false,
    message: env.isProduction
      ? "Something went wrong on our side. Please try again."
      : e?.message || "Internal server error",
  });
};
