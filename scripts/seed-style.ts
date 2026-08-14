import { eq } from "drizzle-orm";
import { EMBER_ARCHIVE_PROMPT } from "@/lib/prompt";
import { requireDb, closeDb } from "@/server/db";
import { styleVersions } from "@/server/db/schema";

const database = requireDb();
try {
  const seed = {
    styleSlug: "ember-archive",
    version: 1,
    label: "The Ember Archive",
    promptTemplate: EMBER_ARCHIVE_PROMPT,
    provider: "openai",
    model: "gpt-image-2-2026-04-21",
    providerConfigJson: { size: "1536x1024", quality: "medium", output_format: "webp", output_compression: 90 },
    referenceAssetsJson: ["public/reference/monster-card-2.jpg", "public/reference/more-cards.png"],
    cardTemplateVersion: "ember-card-v1",
    isActive: true,
    isPublic: true,
    operatorNote: "Initial approved implementation seed.",
  };
  await database.update(styleVersions).set({ isActive: false }).where(eq(styleVersions.styleSlug, "ember-archive"));
  await database.insert(styleVersions).values(seed).onConflictDoUpdate({
    target: [styleVersions.styleSlug, styleVersions.version],
    set: seed,
  });
  console.info("Ember Archive style seed complete");
} finally {
  await closeDb();
}
