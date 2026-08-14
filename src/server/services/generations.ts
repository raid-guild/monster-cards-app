import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { getAddress } from "viem";
import { DEFAULT_STYLE, MONSTERS_CHAIN_ID, MONSTERS_CONTRACT } from "@/lib/constants";
import type { PublicJob } from "@/lib/types";
import { requireDb } from "@/server/db";
import { generationJobs, styleVersions, visualizations } from "@/server/db/schema";
import { env } from "@/server/env";
import { currentOwner } from "@/server/services/chain";

export class GenerationError extends Error {
  constructor(public code: string, message: string, public status: number) { super(message); }
}

function publicJob(row: typeof generationJobs.$inferSelect): PublicJob {
  return {
    id: row.id,
    status: row.status as PublicJob["status"],
    checkpoint: row.checkpoint as PublicJob["checkpoint"],
    errorCode: row.errorCode,
    errorMessage: row.errorMessageSafe,
    queuedAt: row.queuedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createGeneration(args: { tokenId: string; style: string; wallet: string; idempotencyKey: string }) {
  const config = env();
  if (config.IMAGE_GENERATION_PAUSED) {
    throw new GenerationError("image_generation_paused", "Image generation is paused. Please check back later.", 503);
  }
  if (!config.GENERATION_ENABLED) throw new GenerationError("generation_disabled", "Manifestation is temporarily paused.", 503);
  if (args.style !== DEFAULT_STYLE) throw new GenerationError("style_unavailable", "That archive style is unavailable.", 409);
  if (!/^[0-9]+$/.test(args.tokenId)) throw new GenerationError("invalid_token_id", "Invalid sheet number.", 400);
  if (!/^[0-9a-f-]{16,64}$/i.test(args.idempotencyKey)) throw new GenerationError("invalid_idempotency_key", "Invalid request key.", 400);

  const owner = getAddress(await currentOwner(args.tokenId));
  const wallet = getAddress(args.wallet);
  if (owner !== wallet) throw new GenerationError("ownership_required", `This wallet no longer owns Sheet #${args.tokenId}.`, 403);
  const database = requireDb();

  const [existingVisualization] = await database
    .select({ id: visualizations.id })
    .from(visualizations)
    .where(and(eq(visualizations.tokenId, args.tokenId), eq(visualizations.styleSlug, args.style), eq(visualizations.isCanonical, true)))
    .limit(1);
  if (existingVisualization) return { visualizationId: existingVisualization.id, job: null, created: false };

  const [style] = await database
    .select()
    .from(styleVersions)
    .where(and(eq(styleVersions.styleSlug, args.style), eq(styleVersions.isActive, true), eq(styleVersions.isPublic, true)))
    .limit(1);
  if (!style) throw new GenerationError("style_unavailable", "That archive style is unavailable.", 409);

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const [globalCount, walletCount] = await Promise.all([
    database.select({ value: count() }).from(generationJobs).where(gte(generationJobs.queuedAt, dayStart)),
    database.select({ value: count() }).from(generationJobs).where(and(eq(generationJobs.requestedByWallet, wallet.toLowerCase()), gte(generationJobs.queuedAt, dayStart))),
  ]);
  if ((globalCount[0]?.value ?? 0) >= config.GENERATION_DAILY_LIMIT || (walletCount[0]?.value ?? 0) >= config.GENERATION_WALLET_DAILY_LIMIT) {
    throw new GenerationError("rate_limited", "The archive has reached its current manifestation limit.", 429);
  }

  const inserted = await database
    .insert(generationJobs)
    .values({
      chainId: MONSTERS_CHAIN_ID,
      contractAddress: MONSTERS_CONTRACT,
      tokenId: args.tokenId,
      styleSlug: args.style,
      styleVersionId: style.id,
      requestedByWallet: wallet.toLowerCase(),
      idempotencyKey: args.idempotencyKey,
      status: "queued",
      checkpoint: "verifying_ownership",
    })
    .onConflictDoNothing()
    .returning();

  if (inserted[0]) return { visualizationId: null, job: publicJob(inserted[0]), created: true };
  const [existing] = await database
    .select()
    .from(generationJobs)
    .where(orIdempotentOrActive(args, wallet.toLowerCase()))
    .orderBy(desc(generationJobs.queuedAt))
    .limit(1);
  if (!existing) throw new GenerationError("generation_conflict", "This sheet cannot be queued right now.", 409);
  return { visualizationId: null, job: publicJob(existing), created: false };
}

function orIdempotentOrActive(args: { tokenId: string; style: string; idempotencyKey: string }, wallet: string) {
  return sql`((${generationJobs.requestedByWallet} = ${wallet} and ${generationJobs.idempotencyKey} = ${args.idempotencyKey}) or (${generationJobs.tokenId} = ${args.tokenId} and ${generationJobs.styleSlug} = ${args.style} and ${generationJobs.status} in ('queued','running')))`;
}

export async function getGeneration(jobId: string, wallet: string) {
  const database = requireDb();
  const [job] = await database
    .select()
    .from(generationJobs)
    .where(and(eq(generationJobs.id, jobId), eq(generationJobs.requestedByWallet, getAddress(wallet).toLowerCase())))
    .limit(1);
  return job ? publicJob(job) : null;
}
