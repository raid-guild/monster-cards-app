import { eq } from "drizzle-orm";
import { closeDb, requireDb } from "@/server/db";
import { visualizations } from "@/server/db/schema";

const id = process.argv[2];
const reason = process.argv.slice(3).join(" ");
if (!id || !reason) throw new Error("Usage: npm run operator:hide -- <visualization-id> <reason>");
try {
  const rows = await requireDb().update(visualizations).set({ visibility: "hidden", hiddenReason: reason, updatedAt: new Date() }).where(eq(visualizations.id, id)).returning({ id: visualizations.id });
  if (!rows.length) throw new Error("Visualization not found.");
  console.info(`Hidden visualization ${id}. This action is reversible in the database.`);
} finally { await closeDb(); }
