import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? "development";

/**
 * Centralised, validated access to environment variables.
 * Never read process.env directly elsewhere in the codebase.
 */
export const env = {
  port: Number(process.env.PORT ?? 5000),
  mongodbUri: process.env.MONGODB_URI ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  nodeEnv,
  isProduction: nodeEnv === "production",
};
