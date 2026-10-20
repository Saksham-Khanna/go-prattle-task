import { createApp } from "./app";
import { connectDb, disconnectDb } from "./config/db";
import { env } from "./config/env";

async function main(): Promise<void> {
  const app = createApp();

  const server = app.listen(env.port, "0.0.0.0", () => {
    console.log(
      `[server] requirements API listening on http://0.0.0.0:${env.port} (${env.nodeEnv})`,
    );
  });

  try {
    await connectDb();
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[server] MongoDB initial connection failed:", error?.message ?? error);
    console.error(
      "[server] Server is online (port open). Check MONGODB_URI and MongoDB Atlas Network Access (0.0.0.0/0).",
    );
  }

  const shutdown = (signal: string) => {
    console.log(`[server] ${signal} received — shutting down…`);
    server.close();
    disconnectDb()
      .catch(() => undefined)
      .finally(() => process.exit(0));
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    console.error("[server] unhandled rejection:", reason);
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err?.message ?? err);
  process.exit(1);
});
