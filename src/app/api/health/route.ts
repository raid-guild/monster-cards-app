import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { ok } from "@/server/http";

export async function GET() {
  const database = db();
  if (database) await database.execute(sql`select 1`);
  return ok({ status: "ok", database: Boolean(database), at: new Date().toISOString() });
}
