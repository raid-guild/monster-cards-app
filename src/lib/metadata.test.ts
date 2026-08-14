import { describe, expect, it } from "vitest";
import { fixtureSvg } from "@/lib/fixtures";
import { parseMonsterTokenUri } from "@/lib/metadata";

const traits = {
  tokenId: "1", sheetName: "Sheet #1", monsterName: "Acid Ant The Simian of The Village", size: "Tall",
  alignment: "Lawful Good", actions: ["Paralyzing Touch", "Magical Burble"], specialAbility: "Keen Senses",
  weakness: "Darkness", locomotion: "Slither", languages: ["Ratfolk", "Roachling", "Beast"], rawLines: [],
};

function tokenUri(svg = fixtureSvg(traits)) {
  const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  return `data:application/json;base64,${Buffer.from(JSON.stringify({ name: "Sheet #1", image })).toString("base64")}`;
}

describe("parseMonsterTokenUri", () => {
  it("normalizes the exact name and seven traits", () => {
    const result = parseMonsterTokenUri("0001", tokenUri());
    expect(result.traits).toMatchObject({ tokenId: "1", monsterName: traits.monsterName, actions: traits.actions, languages: traits.languages });
    expect(result.traits.rawLines).toHaveLength(8);
  });

  it("rejects XML entity declarations", () => {
    expect(() => parseMonsterTokenUri("1", tokenUri(`<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg/>`))).toThrow("Unsafe XML");
  });

  it("rejects missing required traits", () => {
    expect(() => parseMonsterTokenUri("1", tokenUri(fixtureSvg(traits).replace(/<text[^>]*>Language:[^<]*<\/text>/, "")))).toThrow("Expected one name and seven trait lines");
  });
});
