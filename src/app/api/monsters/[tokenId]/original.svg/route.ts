import { eq } from "drizzle-orm";
import { demoMonsters, fixtureSvg } from "@/lib/fixtures";
import { db } from "@/server/db";
import { tokenSnapshots } from "@/server/db/schema";
import { readMonster } from "@/server/services/chain";

export async function GET(_: Request, { params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  if (!/^\d+$/.test(tokenId)) return new Response("Not found", { status: 404 });
  let svg: string | undefined;
  const database = db();
  if (database) {
    const [snapshot] = await database.select({ rawSvg: tokenSnapshots.rawSvg }).from(tokenSnapshots).where(eq(tokenSnapshots.tokenId, tokenId)).limit(1);
    svg = snapshot?.rawSvg;
  }
  if (!svg) {
    try { svg = (await readMonster(tokenId)).rawSvg; }
    catch { const demo = demoMonsters.find((item) => item.tokenId === tokenId); if (demo) svg = fixtureSvg(demo); }
  }
  if (!svg) return new Response("Not found", { status: 404 });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
