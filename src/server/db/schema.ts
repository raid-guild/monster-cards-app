import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const monsterApp = pgSchema("monster_app");

export const styleVersions = monsterApp.table(
  "style_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    styleSlug: text("style_slug").notNull(),
    version: integer("version").notNull(),
    label: text("label").notNull(),
    promptTemplate: text("prompt_template").notNull(),
    constraintsJson: jsonb("constraints_json").notNull().default({}),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    providerConfigJson: jsonb("provider_config_json").notNull().default({}),
    referenceAssetsJson: jsonb("reference_assets_json").notNull().default([]),
    cardTemplateVersion: text("card_template_version").notNull(),
    isActive: boolean("is_active").notNull().default(false),
    isPublic: boolean("is_public").notNull().default(false),
    operatorNote: text("operator_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.styleSlug, table.version),
    unique().on(table.styleSlug, table.id),
    uniqueIndex("style_versions_one_active_idx").on(table.styleSlug).where(sql`${table.isActive} = true`),
  ],
);

export const tokenSnapshots = monsterApp.table(
  "token_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chainId: integer("chain_id").notNull(),
    contractAddress: text("contract_address").notNull(),
    tokenId: numeric("token_id", { precision: 78, scale: 0 }).notNull(),
    tokenUriHash: text("token_uri_hash").notNull(),
    rawTokenUri: text("raw_token_uri").notNull(),
    rawSvg: text("raw_svg").notNull(),
    sheetName: text("sheet_name").notNull(),
    monsterName: text("monster_name").notNull(),
    traitsJson: jsonb("traits_json").notNull(),
    readBlockNumber: numeric("read_block_number", { precision: 78, scale: 0 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.chainId, table.contractAddress, table.tokenId, table.tokenUriHash)],
);

export const generationJobs = monsterApp.table(
  "generation_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chainId: integer("chain_id").notNull(),
    contractAddress: text("contract_address").notNull(),
    tokenId: numeric("token_id", { precision: 78, scale: 0 }).notNull(),
    styleSlug: text("style_slug").notNull(),
    styleVersionId: uuid("style_version_id").notNull().references(() => styleVersions.id),
    requestedByWallet: text("requested_by_wallet").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    jobKind: text("job_kind").notNull().default("initial"),
    replacementForVisualizationId: uuid("replacement_for_visualization_id"),
    status: text("status").notNull(),
    checkpoint: text("checkpoint"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(2),
    lockedBy: text("locked_by"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    providerRequestId: text("provider_request_id"),
    resolvedPrompt: text("resolved_prompt"),
    resolvedPromptHash: text("resolved_prompt_hash"),
    tokenSnapshotId: uuid("token_snapshot_id").references(() => tokenSnapshots.id),
    errorCode: text("error_code"),
    errorMessageSafe: text("error_message_safe"),
    errorDetailPrivate: text("error_detail_private"),
    queuedAt: timestamp("queued_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.requestedByWallet, table.idempotencyKey),
    uniqueIndex("generation_jobs_one_active_idx")
      .on(table.chainId, table.contractAddress, table.tokenId, table.styleSlug)
      .where(sql`${table.status} in ('queued', 'running')`),
    index("generation_jobs_queue_idx").on(table.status, table.queuedAt),
  ],
);

export const visualizations = monsterApp.table(
  "visualizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chainId: integer("chain_id").notNull(),
    contractAddress: text("contract_address").notNull(),
    tokenId: numeric("token_id", { precision: 78, scale: 0 }).notNull(),
    styleSlug: text("style_slug").notNull(),
    styleVersionId: uuid("style_version_id").notNull().references(() => styleVersions.id),
    generationJobId: uuid("generation_job_id").notNull().unique().references(() => generationJobs.id),
    tokenSnapshotId: uuid("token_snapshot_id").notNull().references(() => tokenSnapshots.id),
    illustrationObjectKey: text("illustration_object_key").notNull(),
    cardPngObjectKey: text("card_png_object_key").notNull(),
    cardWebpObjectKey: text("card_webp_object_key").notNull(),
    thumbnailObjectKey: text("thumbnail_object_key").notNull(),
    socialObjectKey: text("social_object_key"),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    contentHash: text("content_hash").notNull(),
    isCanonical: boolean("is_canonical").notNull().default(true),
    visibility: text("visibility").notNull().default("public"),
    hiddenReason: text("hidden_reason"),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    supersededById: uuid("superseded_by_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("visualizations_one_canonical_idx")
      .on(table.chainId, table.contractAddress, table.tokenId, table.styleSlug)
      .where(sql`${table.isCanonical} = true`),
    index("visualizations_explore_idx").on(table.visibility, table.createdAt, table.id),
  ],
);

export const authNonces = monsterApp.table(
  "auth_nonces",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nonceHash: text("nonce_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("auth_nonces_expiry_idx").on(table.expiresAt)],
);
