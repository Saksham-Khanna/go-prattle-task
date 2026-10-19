import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { apiRouter } from "./routes";

/** Build the Express app (kept separate from server.ts for testability). */
export function createApp(): express.Express {
  const app = express();

  const allowedOrigins = Array.from(
    new Set([env.frontendUrl, "http://localhost:3000", "http://127.0.0.1:3000"]),
  );

  app.use(
    cors({
      origin(origin, cb) {
        // Allow same-origin / server-to-server requests (no Origin header)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed by CORS`));
      },
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

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
