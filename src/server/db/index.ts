import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/server/env";
import * as schema from "@/server/db/schema";

let client: ReturnType<typeof postgres> | undefined;
let database: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function db() {
  const url = env().DATABASE_URL;
  if (!url) return null;
  client ??= postgres(url, { max: 10, prepare: false });
  database ??= drizzle(client, { schema });
  return database;
}

export function requireDb() {
  const database = db();
  if (!database) throw new Error("DATABASE_URL is required for this operation.");
  return database;
}

export async function closeDb() {
  await client?.end();
  client = undefined;
  database = undefined;
}
