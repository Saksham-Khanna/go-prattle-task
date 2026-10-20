import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes";

/** Build the Express app (kept separate from server.ts for testability). */
export function createApp(): express.Express {
  const app = express();

  const configuredFrontend = env.frontendUrl.replace(/\/+$/, "");
  const allowedOrigins = [
    configuredFrontend,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server / curl / Postman (no Origin header)
        if (!origin) return cb(null, true);

        const cleanOrigin = origin.replace(/\/+$/, "");

        // Whitelisted domain
        if (allowedOrigins.includes(cleanOrigin)) return cb(null, true);

        // Allow any Vercel deployment (preview or production domains)
        if (cleanOrigin.endsWith(".vercel.app")) return cb(null, true);

        // Allow localhost on any port during development
        if (/^https?:\/\/localhost(:\d+)?$/.test(cleanOrigin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(cleanOrigin)) {
          return cb(null, true);
        }

        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "200kb" }));

  // Minimal request log (method, path, status, duration)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      console.log(
        `[http] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`,
      );
    });
    next();
  });

  // Root health ping (useful for Render web service checks & browser verification)
  app.get("/", (_req, res) => {
    res.json({
      success: true,
      service: "gopratle-event-requirements-api",
      status: "online",
      healthCheck: "/api/health",
    });
  });

  // Mount API router at both /api and root level for maximum compatibility
  app.use("/api", apiRouter);
  app.use(apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
