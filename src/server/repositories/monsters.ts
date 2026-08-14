import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { DEFAULT_STYLE, MONSTERS_CHAIN_ID, MONSTERS_CONTRACT } from "@/lib/constants";
import { demoMonsters } from "@/lib/fixtures";
import type { MonsterRecord, PublicJob, PublicVisualization } from "@/lib/types";
import { abbreviateAddress } from "@/lib/utils";
import { db } from "@/server/db";
import { generationJobs, styleVersions, tokenSnapshots, visualizations } from "@/server/db/schema";
import { env } from "@/server/env";
import { readMonster } from "@/server/services/chain";

const mediaUrl = (id: string, variant: string) => `/media/${id}/${variant}`;

function mapVisualization(row: {
  id: string;
  tokenId: string;
  styleSlug: string;
  styleLabel: string;
  styleVersion: number;
  model: string;
  createdAt: Date;
  requester: string;
}): PublicVisualization {
  return {
    ...row,
    tokenId: String(row.tokenId),
    createdAt: row.createdAt.toISOString(),
    requester: abbreviateAddress(row.requester),
    cardUrl: mediaUrl(row.id, "card.webp"),
    thumbnailUrl: mediaUrl(row.id, "thumb.webp"),
    downloadUrl: mediaUrl(row.id, "card.png"),
  };
}

export async function getExplore(options: { q?: string; sort?: string; limit?: number; cursor?: string } = {}) {
  const database = db();
  const limit = Math.min(Math.max(options.limit ?? 24, 1), 48);
  let offset = 0;
  if (options.cursor) {
    try { offset = Math.max(0, Number(JSON.parse(Buffer.from(options.cursor, "base64url").toString()).offset) || 0); }
    catch { offset = 0; }
  }
  if (!database) {
    const needle = options.q?.trim().toLowerCase();
    let items = demoMonsters.filter((monster) => monster.visualization);
    if (needle) items = items.filter((monster) => monster.tokenId === needle || monster.monsterName.toLowerCase().includes(needle));
    if (options.sort === "oldest") items.reverse();
    if (options.sort === "token_asc") items.sort((a, b) => Number(a.tokenId) - Number(b.tokenId));
    const page = items.slice(offset, offset + limit);
    return { items: page, nextCursor: offset + limit < items.length ? Buffer.from(JSON.stringify({ offset: offset + limit })).toString("base64url") : null, total: items.length };
  }

  const conditions = [
    eq(visualizations.visibility, "public"),
    eq(visualizations.isCanonical, true),
    options.q
      ? or(
          ilike(tokenSnapshots.monsterName, `%${options.q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`),
          eq(sql`${visualizations.tokenId}::text`, options.q.replace(/^#/, "")),
        )
      : undefined,
  ].filter(Boolean);
  const order = options.sort === "oldest"
    ? asc(visualizations.createdAt)
    : options.sort === "token_asc"
      ? asc(visualizations.tokenId)
      : desc(visualizations.createdAt);
  const rows = await database
    .select({
      id: visualizations.id,
      tokenId: visualizations.tokenId,
      styleSlug: visualizations.styleSlug,
      styleLabel: styleVersions.label,
      styleVersion: styleVersions.version,
      model: styleVersions.model,
      createdAt: visualizations.createdAt,
      requester: generationJobs.requestedByWallet,
      sheetName: tokenSnapshots.sheetName,
      monsterName: tokenSnapshots.monsterName,
      traits: tokenSnapshots.traitsJson,
    })
    .from(visualizations)
    .innerJoin(styleVersions, eq(styleVersions.id, visualizations.styleVersionId))
    .innerJoin(generationJobs, eq(generationJobs.id, visualizations.generationJobId))
    .innerJoin(tokenSnapshots, eq(tokenSnapshots.id, visualizations.tokenSnapshotId))
    .where(and(...conditions))
    .orderBy(order)
    .offset(offset)
    .limit(limit + 1);
  const totalRows = await database
    .select({ total: sql<number>`count(*)::int` })
    .from(visualizations)
    .where(and(eq(visualizations.visibility, "public"), eq(visualizations.isCanonical, true)));
  const items = rows.slice(0, limit).map((row) => ({
    ...(row.traits as MonsterRecord),
    tokenId: String(row.tokenId),
    sheetName: row.sheetName,
    monsterName: row.monsterName,
    originalImageUrl: `/api/monsters/${row.tokenId}/original.svg`,
    visualization: mapVisualization(row),
    job: null,
  }));
  return { items, nextCursor: rows.length > limit ? Buffer.from(JSON.stringify({ offset: offset + limit })).toString("base64url") : null, total: totalRows[0]?.total ?? 0 };
}

export async function findVisualization(tokenId: string) {
  const database = db();
  if (!database) return demoMonsters.find((item) => item.tokenId === tokenId)?.visualization ?? null;
  const [row] = await database
    .select({
      id: visualizations.id,
      tokenId: visualizations.tokenId,
      styleSlug: visualizations.styleSlug,
      styleLabel: styleVersions.label,
      styleVersion: styleVersions.version,
      model: styleVersions.model,
      createdAt: visualizations.createdAt,
      requester: generationJobs.requestedByWallet,
    })
    .from(visualizations)
    .innerJoin(styleVersions, eq(styleVersions.id, visualizations.styleVersionId))
    .innerJoin(generationJobs, eq(generationJobs.id, visualizations.generationJobId))
    .where(and(
      eq(visualizations.chainId, MONSTERS_CHAIN_ID),
      eq(visualizations.contractAddress, MONSTERS_CONTRACT),
      eq(visualizations.tokenId, tokenId),
      eq(visualizations.styleSlug, DEFAULT_STYLE),
      eq(visualizations.isCanonical, true),
      eq(visualizations.visibility, "public"),
    ))
    .limit(1);
  return row ? mapVisualization(row) : null;
}

export async function findActiveJob(tokenId: string): Promise<PublicJob | null> {
  const database = db();
  if (!database) return null;
  const [row] = await database
    .select()
    .from(generationJobs)
    .where(and(eq(generationJobs.tokenId, tokenId), sql`${generationJobs.status} in ('queued','running')`))
    .orderBy(desc(generationJobs.queuedAt))
    .limit(1);
  return row ? {
    id: row.id,
    status: row.status as PublicJob["status"],
    checkpoint: row.checkpoint as PublicJob["checkpoint"],
    errorCode: row.errorCode,
    errorMessage: row.errorMessageSafe,
    queuedAt: row.queuedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } : null;
}

export async function getMonster(tokenId: string): Promise<MonsterRecord | null> {
  const demo = env().USE_DEMO_DATA ? demoMonsters.find((item) => item.tokenId === tokenId) : undefined;
  const visualization = await findVisualization(tokenId);
  try {
    const chain = await readMonster(tokenId);
    return {
      ...chain.traits,
      originalImageUrl: `/api/monsters/${tokenId}/original.svg`,
      visualization,
      job: visualization ? null : await findActiveJob(tokenId),
    };
  } catch (error) {
    if (demo) return demo;
    if ((error as { code?: string }).code === "rpc_unavailable") return null;
    throw error;
  }
}

export async function joinVisualizationState<T extends { traits: MonsterRecord | Omit<MonsterRecord, "visualization" | "job" | "originalImageUrl"> }>(items: T[]) {
  return Promise.all(items.map(async ({ traits }) => ({
    ...traits,
    originalImageUrl: `/api/monsters/${traits.tokenId}/original.svg`,
    visualization: await findVisualization(traits.tokenId),
    job: await findActiveJob(traits.tokenId),
  })));
}
