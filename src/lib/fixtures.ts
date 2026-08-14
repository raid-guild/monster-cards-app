import type { MonsterRecord, MonsterTraits, PublicVisualization } from "@/lib/types";

const first: MonsterTraits = {
  tokenId: "2630",
  sheetName: "Sheet #2630",
  monsterName: "Manticore The Monstrosity of The Sea",
  size: "Crawling",
  alignment: "Chaotic Evil",
  actions: ["Enforced Diplomacy", "Lightning Breath"],
  specialAbility: "Hellish Rejuvenation",
  weakness: "Breeze",
  locomotion: "Burrow",
  languages: ["Bearfolk", "Beast", "Burrowing", "Telepathy"],
  rawLines: [],
};

const second: MonsterTraits = {
  tokenId: "8750",
  sheetName: "Sheet #8750",
  monsterName: "Ravenfolk Doom Croaker The Undead of The Village",
  size: "Tiny",
  alignment: "Neutral Evil",
  actions: ["Blinding Gaze", "Ethereal Lure"],
  specialAbility: "Deadly Precision",
  weakness: "Magic",
  locomotion: "Leap",
  languages: ["Loc Dragon", "Aberration", "Merfolk", "Simian"],
  rawLines: [],
};

const unrevealed: MonsterTraits = {
  tokenId: "1",
  sheetName: "Sheet #1",
  monsterName: "Acid Ant The Simian of The Village",
  size: "Tall",
  alignment: "Lawful Good",
  actions: ["Paralyzing Touch", "Magical Burble"],
  specialAbility: "Keen Senses",
  weakness: "Darkness",
  locomotion: "Slither",
  languages: ["Ratfolk", "Roachling", "Beast", "Shoth", "Kryt"],
  rawLines: [],
};

function visualization(tokenId: string, requester: string): PublicVisualization {
  return {
    id: `demo-${tokenId}`,
    tokenId,
    styleSlug: "ember-archive",
    styleLabel: "The Ember Archive",
    styleVersion: 1,
    model: "gpt-image-2",
    cardUrl: tokenId === "2630" ? "/reference/monster-card-2.jpg" : "/reference/more-cards.png",
    thumbnailUrl: tokenId === "2630" ? "/reference/monster-card-2.jpg" : "/reference/more-cards.png",
    downloadUrl: tokenId === "2630" ? "/reference/monster-card-2.png" : "/reference/more-cards.png",
    createdAt: tokenId === "2630" ? "2026-08-14T16:42:00.000Z" : "2026-08-12T19:10:00.000Z",
    requester,
  };
}

export const demoMonsters: MonsterRecord[] = [
  {
    ...unrevealed,
    originalImageUrl: "/api/monsters/1/original.svg",
    visualization: null,
    job: null,
  },
  {
    ...first,
    originalImageUrl: "/api/monsters/2630/original.svg",
    visualization: visualization("2630", "0x12ab…90ef"),
    job: null,
  },
  {
    ...second,
    originalImageUrl: "/api/monsters/8750/original.svg",
    visualization: visualization("8750", "0x8ed1…44ca"),
    job: null,
  },
];

export function fixtureSvg(monster: MonsterTraits) {
  const lines = [
    monster.monsterName,
    `Size: ${monster.size}`,
    `Alignment: ${monster.alignment}`,
    `Actions: ${monster.actions.join(", ")}`,
    `Special Ability: ${monster.specialAbility}`,
    `Weakness: ${monster.weakness}`,
    `Locomotion: ${monster.locomotion}`,
    `Language: ${monster.languages.join(", ")}`,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700"><rect width="700" height="700" fill="#080807"/><style>text{fill:#ee4932;font:26px monospace}</style>${lines.map((line, index) => `<text x="28" y="${56 + index * 70}">${line.replaceAll("&", "&amp;")}</text>`).join("")}</svg>`;
}
