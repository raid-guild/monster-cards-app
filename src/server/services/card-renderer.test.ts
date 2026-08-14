import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { demoMonsters } from "@/lib/fixtures";
import { cardSvg, renderCard } from "@/server/services/card-renderer";

describe("card renderer", () => {
  it("preserves every exact trait string in deterministic SVG", async () => {
    const illustration = await sharp({ create: { width: 1536, height: 1024, channels: 3, background: "#080807" } }).webp().toBuffer();
    const svg = await cardSvg(demoMonsters[0], illustration);
    for (const value of [demoMonsters[0].size, demoMonsters[0].alignment, demoMonsters[0].specialAbility, demoMonsters[0].weakness, demoMonsters[0].locomotion]) expect(svg).toContain(value);
  });

  it("renders canonical and derivative dimensions", async () => {
    const illustration = await sharp({ create: { width: 1536, height: 1024, channels: 3, background: "#b83a25" } }).webp().toBuffer();
    const result = await renderCard(demoMonsters[0], illustration);
    await expect(sharp(result.cardPng).metadata()).resolves.toMatchObject({ width: 1024, height: 1536, format: "png" });
    await expect(sharp(result.thumbnail).metadata()).resolves.toMatchObject({ width: 512, height: 768, format: "webp" });
    await expect(sharp(result.social).metadata()).resolves.toMatchObject({ width: 1200, height: 630, format: "webp" });
  }, 20_000);
});
