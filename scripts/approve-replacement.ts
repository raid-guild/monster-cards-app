import { and, eq, sql } from "drizzle-orm";
import { currentOwner } from "@/server/services/chain";
import { closeDb, requireDb } from "@/server/db";
import { generationJobs, visualizations } from "@/server/db/schema";

const id = process.argv[2];
if (!id) throw new Error("Usage: npm run operator:replace -- <visualization-id>");
const database = requireDb();
try {
  const [source] = await database.select().from(visualizations).where(and(eq(visualizations.id, id), eq(visualizations.isCanonical, true))).limit(1);
  if (!source) throw new Error("Canonical visualization not found.");
  const [used] = await database.select({ id: generationJobs.id }).from(generationJobs).where(and(
    eq(generationJobs.jobKind, "quality_replacement"), eq(generationJobs.replacementForVisualizationId, id), sql`${generationJobs.status} != 'cancelled'`,
  )).limit(1);
  if (used) throw new Error("The one quality replacement has already been used or queued.");
  const owner = await currentOwner(source.tokenId);
  const [job] = await database.insert(generationJobs).values({
    chainId: source.chainId,
    contractAddress: source.contractAddress,
    tokenId: source.tokenId,
    styleSlug: source.styleSlug,
    styleVersionId: source.styleVersionId,
    requestedByWallet: owner.toLowerCase(),
    idempotencyKey: `quality-${id}`,
    jobKind: "quality_replacement",
    replacementForVisualizationId: id,
    status: "queued",
    checkpoint: "verifying_ownership",
  }).returning({ id: generationJobs.id });
  console.info(`Queued approved quality replacement ${job.id}.`);
} finally { await closeDb(); }
