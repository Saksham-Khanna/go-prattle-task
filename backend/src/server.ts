import { createApp } from "./app";
import { connectDb, disconnectDb } from "./config/db";
import { env } from "./config/env";

async function main(): Promise<void> {
  await connectDb();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(
      `[server] requirements API listening on http://localhost:${env.port} (${env.nodeEnv})`,
    );
  });

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
