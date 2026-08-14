import { and, eq } from "drizzle-orm";
import { requireDb } from "@/server/db";
import { visualizations } from "@/server/db/schema";
import { getObject } from "@/server/services/storage";

const variants = {
  "card.png": ["cardPngObjectKey", "image/png"],
  "card.webp": ["cardWebpObjectKey", "image/webp"],
  "thumb.webp": ["thumbnailObjectKey", "image/webp"],
  "social.webp": ["socialObjectKey", "image/webp"],
} as const;

export async function GET(_: Request, { params }: { params: Promise<{ visualizationId: string; variant: string }> }) {
  const { visualizationId, variant } = await params;
  const entry = variants[variant as keyof typeof variants];
  if (!entry) return new Response("Not found", { status: 404 });
  try {
    const [record] = await requireDb().select().from(visualizations).where(and(
      eq(visualizations.id, visualizationId), eq(visualizations.visibility, "public"), eq(visualizations.isCanonical, true),
    )).limit(1);
    if (!record) return new Response("Not found", { status: 404 });
    const key = record[entry[0]];
    if (!key) return new Response("Not found", { status: 404 });
    const object = await getObject(key);
    return new Response(new Uint8Array(object.bytes), {
      headers: {
        "Content-Type": entry[1],
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(variant === "card.png" ? { "Content-Disposition": `attachment; filename="monster-sheet-${record.tokenId}.png"` } : {}),
      },
    });
  } catch { return new Response("Not found", { status: 404 }); }
}
