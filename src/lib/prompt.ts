import { createHash } from "node:crypto";
import type { MonsterTraits } from "@/lib/types";

export const EMBER_ARCHIVE_PROMPT = `TASK
Create a single monster illustration for the art window of a collectible field-dossier card.

MONSTER
Name: {{monsterName}}
Size: {{size}}
Alignment: {{alignment}}
Actions: {{actions}}
Special ability: {{specialAbility}}
Weakness: {{weakness}}
Locomotion: {{locomotion}}
Languages: {{languages}}

ART DIRECTION
- Early computer bestiary illustration rendered with chunky pixel/ASCII-like marks.
- Near-black background, ember-red primary linework, sparse bone highlights.
- At most one limited accent color chosen from sulfur, moss, teal, or bruise when justified.
- Strong readable silhouette, side or three-quarter creature view.
- Restrained horizontal CRT and imperfect print texture.
- Match the supplied references for palette, line weight, density, and ominous tone.
- Express traits physically. Do not add a UI or card frame.

COMPOSITION
- One complete creature centered in a landscape frame.
- One primary creature only; environmental effects are allowed.
- Keep extremities inside the safe area with breathing room.

HARD CONSTRAINTS
- No text, letters, numbers, writing-like symbols, logos, signatures, or watermarks.
- No blue/purple cyberpunk palette, glossy 3D, anime, cute mascot, painterly concept art, or photorealism.`;

export function resolvePrompt(template: string, traits: MonsterTraits) {
  const values: Record<string, string> = {
    monsterName: traits.monsterName,
    size: traits.size,
    alignment: traits.alignment,
    actions: traits.actions.join(", "),
    specialAbility: traits.specialAbility,
    weakness: traits.weakness,
    locomotion: traits.locomotion,
    languages: traits.languages.join(", "),
  };
  const prompt = template.replace(/{{(\w+)}}/g, (_, key: string) => values[key] ?? "");
  return { prompt, hash: createHash("sha256").update(prompt).digest("hex") };
}
