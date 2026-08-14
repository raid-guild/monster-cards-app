import { describe, expect, it } from "vitest";
import { EMBER_ARCHIVE_PROMPT, resolvePrompt } from "@/lib/prompt";
import { demoMonsters } from "@/lib/fixtures";

describe("resolvePrompt", () => {
  it("interpolates exact traits and produces a stable hash", () => {
    const first = resolvePrompt(EMBER_ARCHIVE_PROMPT, demoMonsters[0]);
    const second = resolvePrompt(EMBER_ARCHIVE_PROMPT, demoMonsters[0]);
    expect(first.prompt).toContain(demoMonsters[0].monsterName);
    expect(first.prompt).not.toContain("{{");
    expect(first.hash).toBe(second.hash);
    expect(first.hash).toHaveLength(64);
  });
});
