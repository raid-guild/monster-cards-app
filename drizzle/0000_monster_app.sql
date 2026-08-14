CREATE SCHEMA IF NOT EXISTS "monster_app";

CREATE TABLE IF NOT EXISTS "monster_app"."style_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "style_slug" text NOT NULL, "version" integer NOT NULL,
  "label" text NOT NULL, "prompt_template" text NOT NULL, "constraints_json" jsonb NOT NULL DEFAULT '{}',
  "provider" text NOT NULL, "model" text NOT NULL, "provider_config_json" jsonb NOT NULL DEFAULT '{}',
  "reference_assets_json" jsonb NOT NULL DEFAULT '[]', "card_template_version" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT false, "is_public" boolean NOT NULL DEFAULT false,
  "operator_note" text, "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("style_slug", "version"), UNIQUE("style_slug", "id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "style_versions_one_active_idx" ON "monster_app"."style_versions" ("style_slug") WHERE "is_active" = true;

CREATE TABLE IF NOT EXISTS "monster_app"."token_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "chain_id" integer NOT NULL, "contract_address" text NOT NULL,
  "token_id" numeric(78,0) NOT NULL, "token_uri_hash" text NOT NULL, "raw_token_uri" text NOT NULL,
  "raw_svg" text NOT NULL, "sheet_name" text NOT NULL, "monster_name" text NOT NULL, "traits_json" jsonb NOT NULL,
  "read_block_number" numeric(78,0), "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("chain_id", "contract_address", "token_id", "token_uri_hash")
);

CREATE TABLE IF NOT EXISTS "monster_app"."generation_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "chain_id" integer NOT NULL, "contract_address" text NOT NULL,
  "token_id" numeric(78,0) NOT NULL, "style_slug" text NOT NULL, "style_version_id" uuid NOT NULL REFERENCES "monster_app"."style_versions"("id"),
  "requested_by_wallet" text NOT NULL, "idempotency_key" text NOT NULL, "job_kind" text NOT NULL DEFAULT 'initial',
  "replacement_for_visualization_id" uuid, "status" text NOT NULL, "checkpoint" text, "attempt_count" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 2, "locked_by" text, "locked_at" timestamptz, "provider_request_id" text,
  "resolved_prompt" text, "resolved_prompt_hash" text, "token_snapshot_id" uuid REFERENCES "monster_app"."token_snapshots"("id"),
  "error_code" text, "error_message_safe" text, "error_detail_private" text, "queued_at" timestamptz NOT NULL DEFAULT now(),
  "started_at" timestamptz, "completed_at" timestamptz, "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("requested_by_wallet", "idempotency_key")
);
CREATE UNIQUE INDEX IF NOT EXISTS "generation_jobs_one_active_idx" ON "monster_app"."generation_jobs" ("chain_id", "contract_address", "token_id", "style_slug") WHERE "status" IN ('queued','running');
CREATE INDEX IF NOT EXISTS "generation_jobs_queue_idx" ON "monster_app"."generation_jobs" ("status", "queued_at");

CREATE TABLE IF NOT EXISTS "monster_app"."visualizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "chain_id" integer NOT NULL, "contract_address" text NOT NULL,
  "token_id" numeric(78,0) NOT NULL, "style_slug" text NOT NULL, "style_version_id" uuid NOT NULL REFERENCES "monster_app"."style_versions"("id"),
  "generation_job_id" uuid NOT NULL UNIQUE REFERENCES "monster_app"."generation_jobs"("id"),
  "token_snapshot_id" uuid NOT NULL REFERENCES "monster_app"."token_snapshots"("id"), "illustration_object_key" text NOT NULL,
  "card_png_object_key" text NOT NULL, "card_webp_object_key" text NOT NULL, "thumbnail_object_key" text NOT NULL,
  "social_object_key" text, "width" integer NOT NULL, "height" integer NOT NULL, "content_hash" text NOT NULL,
  "is_canonical" boolean NOT NULL DEFAULT true, "visibility" text NOT NULL DEFAULT 'public', "hidden_reason" text,
  "superseded_at" timestamptz, "superseded_by_id" uuid, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "visualizations_one_canonical_idx" ON "monster_app"."visualizations" ("chain_id", "contract_address", "token_id", "style_slug") WHERE "is_canonical" = true;
CREATE INDEX IF NOT EXISTS "visualizations_explore_idx" ON "monster_app"."visualizations" ("visibility", "created_at", "id");
ALTER TABLE "monster_app"."generation_jobs" DROP CONSTRAINT IF EXISTS "generation_jobs_replacement_for_visualization_id_fkey";
ALTER TABLE "monster_app"."generation_jobs" ADD CONSTRAINT "generation_jobs_replacement_for_visualization_id_fkey" FOREIGN KEY ("replacement_for_visualization_id") REFERENCES "monster_app"."visualizations"("id");
ALTER TABLE "monster_app"."visualizations" DROP CONSTRAINT IF EXISTS "visualizations_superseded_by_id_fkey";
ALTER TABLE "monster_app"."visualizations" ADD CONSTRAINT "visualizations_superseded_by_id_fkey" FOREIGN KEY ("superseded_by_id") REFERENCES "monster_app"."visualizations"("id");

CREATE TABLE IF NOT EXISTS "monster_app"."auth_nonces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "nonce_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL, "consumed_at" timestamptz, "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "auth_nonces_expiry_idx" ON "monster_app"."auth_nonces" ("expires_at");
