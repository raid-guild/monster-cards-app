import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getAddress } from "viem";
import { MONSTERS_CONTRACT } from "@/lib/constants";
import type { MonsterTraits } from "@/lib/types";
import { resolvePrompt } from "@/lib/prompt";
import { closeDb, requireDb } from "@/server/db";
import { generationJobs, styleVersions, tokenSnapshots, visualizations } from "@/server/db/schema";
import { assertProductionEnv, env } from "@/server/env";
import { imageProvider } from "@/server/providers/image-provider";
import { renderCard } from "@/server/services/card-renderer";
import { currentOwner, readMonster } from "@/server/services/chain";
import { objectPrefix, putObject, tryGetObject } from "@/server/services/storage";

type ClaimedJob = typeof generationJobs.$inferSelect;
let stopping = false;

function log(level: "info" | "warn" | "error", event: string, context: Record<string, unknown> = {}) {
  console[level](JSON.stringify({ level, event, service: "monsters-worker", at: new Date().toISOString(), ...context }));
}

async function claimJob(): Promise<ClaimedJob | null> {
  const database = requireDb();
  const workerId = `worker-${process.pid}`;
  const result = await database.execute(sql`
    with next_job as (
      select id from monster_app.generation_jobs
      where status in ('queued', 'failed_retryable') and attempt_count < max_attempts
      order by queued_at asc for update skip locked limit 1
    )
    update monster_app.generation_jobs j set
      status = 'running', checkpoint = 'verifying_ownership', locked_by = ${workerId}, locked_at = now(),
      started_at = coalesce(started_at, now()), attempt_count = attempt_count + 1, updated_at = now()
    from next_job where j.id = next_job.id returning j.*
  `);
  return (result[0] as ClaimedJob | undefined) ?? null;
}

async function checkpoint(id: string, value: string, fields: Partial<typeof generationJobs.$inferInsert> = {}) {
  await requireDb().update(generationJobs).set({ checkpoint: value, updatedAt: new Date(), ...fields }).where(eq(generationJobs.id, id));
}

async function snapshot(job: ClaimedJob, chain: Awaited<ReturnType<typeof readMonster>>) {
  const database = requireDb();
  const values = {
    chainId: 1,
    contractAddress: MONSTERS_CONTRACT,
    tokenId: job.tokenId,
    tokenUriHash: chain.tokenUriHash,
    rawTokenUri: chain.rawTokenUri,
    rawSvg: chain.rawSvg,
    sheetName: chain.traits.sheetName,
    monsterName: chain.traits.monsterName,
    traitsJson: chain.traits,
    readBlockNumber: chain.blockNumber,
  };
  const inserted = await database.insert(tokenSnapshots).values(values).onConflictDoNothing().returning({ id: tokenSnapshots.id });
  if (inserted[0]) return inserted[0].id;
  const [existing] = await database.select({ id: tokenSnapshots.id }).from(tokenSnapshots).where(and(
    eq(tokenSnapshots.tokenId, job.tokenId), eq(tokenSnapshots.tokenUriHash, chain.tokenUriHash),
  )).limit(1);
  if (!existing) throw new Error("token_snapshot_failed");
  return existing.id;
}

async function processJob(job: ClaimedJob) {
  const database = requireDb();
  let stage = "verifying_ownership";
  try {
    const owner = getAddress(await currentOwner(job.tokenId));
    if (owner.toLowerCase() !== job.requestedByWallet.toLowerCase()) {
      throw Object.assign(new Error("This sheet changed owners before generation began."), { code: "ownership_changed", terminal: true });
    }

    stage = "reading_traits";
    await checkpoint(job.id, stage);
    const chain = await readMonster(job.tokenId, true);
    const snapshotId = await snapshot(job, chain);
    const [style] = await database.select().from(styleVersions).where(eq(styleVersions.id, job.styleVersionId)).limit(1);
    if (!style) throw Object.assign(new Error("Style version no longer exists."), { code: "style_missing", terminal: true });
    const resolved = resolvePrompt(style.promptTemplate, chain.traits);
    await checkpoint(job.id, stage, { tokenSnapshotId: snapshotId, resolvedPrompt: resolved.prompt, resolvedPromptHash: resolved.hash });

    stage = "generating_illustration";
    await checkpoint(job.id, stage);
    const prefix = objectPrefix(job.tokenId, job.styleSlug, style.version, job.id);
    const illustrationKey = `${prefix}/illustration.webp`;
    const existingIllustration = await tryGetObject(illustrationKey);
    let illustration: Buffer<ArrayBufferLike> | undefined = existingIllustration?.bytes;
    let providerRequestId = job.providerRequestId ?? undefined;
    if (!illustration) {
      const generated = await imageProvider().generate({
        prompt: resolved.prompt,
        model: style.model,
        referencePaths: style.referenceAssetsJson as string[],
        config: style.providerConfigJson as { size?: string; quality?: string; output_format?: string; output_compression?: number },
      });
      illustration = generated.bytes;
      providerRequestId = generated.providerRequestId;
      await putObject(illustrationKey, generated.bytes, generated.mimeType);
      await checkpoint(job.id, stage, { providerRequestId });
    }

    stage = "assembling_card";
    await checkpoint(job.id, stage);
    if (!illustration) throw new Error("illustration_missing");
    const rendered = await renderCard(chain.traits as MonsterTraits, illustration);
    const objects = {
      cardPngObjectKey: `${prefix}/card.png`,
      cardWebpObjectKey: `${prefix}/card.webp`,
      thumbnailObjectKey: `${prefix}/thumb.webp`,
      socialObjectKey: `${prefix}/social.webp`,
    };

    stage = "uploading_assets";
    await checkpoint(job.id, stage);
    await Promise.all([
      putObject(objects.cardPngObjectKey, rendered.cardPng, "image/png"),
      putObject(objects.cardWebpObjectKey, rendered.cardWebp, "image/webp"),
      putObject(objects.thumbnailObjectKey, rendered.thumbnail, "image/webp"),
      putObject(objects.socialObjectKey, rendered.social, "image/webp"),
    ]);

    stage = "publishing";
    await checkpoint(job.id, stage);
    await database.transaction(async (tx) => {
      if (job.jobKind === "quality_replacement" && job.replacementForVisualizationId) {
        await tx.update(visualizations).set({
          isCanonical: false,
          visibility: "quarantined",
          supersededAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(visualizations.id, job.replacementForVisualizationId));
      }
      await tx.insert(visualizations).values({
        id: job.id,
        chainId: 1,
        contractAddress: MONSTERS_CONTRACT,
        tokenId: job.tokenId,
        styleSlug: job.styleSlug,
        styleVersionId: job.styleVersionId,
        generationJobId: job.id,
        tokenSnapshotId: snapshotId,
        illustrationObjectKey: illustrationKey,
        ...objects,
        width: 1024,
        height: 1536,
        contentHash: createHash("sha256").update(rendered.cardPng).digest("hex"),
      });
      if (job.jobKind === "quality_replacement" && job.replacementForVisualizationId) {
        await tx.update(visualizations).set({ supersededById: job.id }).where(eq(visualizations.id, job.replacementForVisualizationId));
      }
      await tx.update(generationJobs).set({
        status: "succeeded", checkpoint: "publishing", completedAt: new Date(), updatedAt: new Date(), lockedAt: null, lockedBy: null,
      }).where(eq(generationJobs.id, job.id));
    });
    log("info", "generation_completed", { job_id: job.id, token_id: job.tokenId });
  } catch (error) {
    const detail = error as { message?: string; code?: string; status?: number; terminal?: boolean };
    const code = detail.code ?? (stage === "assembling_card" ? "composition_failed" : stage === "uploading_assets" ? "storage_failed" : "generation_failed");
    const terminal = detail.terminal || code === "moderation_blocked";
    const retryable = !terminal && job.attemptCount < job.maxAttempts && (stage === "assembling_card" || stage === "uploading_assets" || detail.status === 429 || (detail.status ?? 0) >= 500);
    await database.update(generationJobs).set({
      status: retryable ? "failed_retryable" : "failed_terminal",
      errorCode: code,
      errorMessageSafe: terminal ? "This manifestation cannot continue." : "The archive could not complete this manifestation.",
      errorDetailPrivate: detail.message?.slice(0, 2000),
      completedAt: retryable ? null : new Date(),
      updatedAt: new Date(),
      lockedAt: null,
      lockedBy: null,
    }).where(eq(generationJobs.id, job.id));
    log(retryable ? "warn" : "error", "generation_failed", { job_id: job.id, token_id: job.tokenId, checkpoint: stage, code });
  }
}

async function main() {
  assertProductionEnv();
  log("info", "worker_started", { provider: env().IMAGE_PROVIDER });
  while (!stopping) {
    const job = await claimJob();
    if (job) await processJob(job);
    else if (env().WORKER_ONCE) break;
    else await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  await closeDb();
}

process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });
main().catch(async (error) => { log("error", "worker_crashed", { error: String(error) }); await closeDb(); process.exitCode = 1; });
