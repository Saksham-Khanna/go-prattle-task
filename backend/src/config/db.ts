import mongoose from "mongoose";
import { env } from "./env";

/** Connect to MongoDB. Fails fast with a clear message when unconfigured. */
export async function connectDb(): Promise<void> {
  if (!env.mongodbUri) {
    throw new Error(
      "MONGODB_URI is not set. Copy backend/.env.example to backend/.env and add your MongoDB (or Atlas) connection string.",
    );
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10000 });
  console.log(
    `[db] connected to MongoDB at ${mongoose.connection.host}/${mongoose.connection.name}`,
  );
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
