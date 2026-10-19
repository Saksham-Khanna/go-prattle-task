import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config for the embedded PostgreSQL API.
 *
 * `npm run db:push` reads `DATABASE_URL` (from `.env.local` locally, or from
 * the shell env in CI) and creates/updates the `requirements` table.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  },
});
