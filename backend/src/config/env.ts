import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? "development";

const cleanUrl = (url?: string) => (url ? url.trim().replace(/\/+$/, "") : "");

/**
 * Centralised, validated access to environment variables.
 * Never read process.env directly elsewhere in the codebase.
 */
export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongodbUri: (process.env.MONGODB_URI ?? "").trim(),
  frontendUrl: cleanUrl(process.env.FRONTEND_URL) || "http://localhost:3000",
  nodeEnv,
  isProduction: nodeEnv === "production",
};
