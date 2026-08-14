import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { MonsterTraits } from "@/lib/types";
import { escapeXml } from "@/lib/utils";

const BONE = "#e4cf9c";
const EMBER = "#b83a25";
const FLARE = "#ee4932";
const VOID = "#080807";

async function fontData(packageName: string, filename: string) {
  return (await fs.readFile(path.resolve(`node_modules/@fontsource/${packageName}/files/${filename}`))).toString("base64");
}

function wrapWords(value: string, maxChars: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current || `${current} ${word}`.length <= maxChars) current = current ? `${current} ${word}` : word;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines;
}

function titleLayout(name: string) {
  for (const [size, chars] of [[62, 28], [54, 33], [46, 39]] as const) {
    const lines = wrapWords(name.toUpperCase(), chars);
    if (lines.length <= 2) return { size, lines };
  }
  return { size: 40, lines: wrapWords(name.toUpperCase(), 45).slice(0, 3) };
}

function traitRows(traits: MonsterTraits) {
  return [
    ["SIZE", traits.size],
    ["ALIGNMENT", traits.alignment],
    ["ACTIONS", traits.actions.join(", ")],
    ["SPECIAL ABILITY", traits.specialAbility],
    ["WEAKNESS", traits.weakness],
    ["LOCOMOTION", traits.locomotion],
    ["TONGUES", traits.languages.join(", ")],
  ];
}

export async function cardSvg(traits: MonsterTraits, illustration: Buffer) {
  const [silkscreen, plex] = await Promise.all([
    fontData("silkscreen", "silkscreen-latin-700-normal.woff2"),
    fontData("ibm-plex-mono", "ibm-plex-mono-latin-500-normal.woff2"),
  ]);
  const title = titleLayout(traits.monsterName);
  const image = illustration.toString("base64");
  let cursor = 930;
  const rows = traitRows(traits).map(([label, value], index) => {
    const maxChars = index === 2 || index === 6 ? 36 : 43;
    const lines = wrapWords(value, maxChars);
    const y = cursor;
    cursor += Math.max(54, lines.length * 42 + 12);
    return `<g><rect x="80" y="${y - 25}" width="18" height="18" fill="${index % 2 ? EMBER : BONE}"/><text x="116" y="${y}" class="trait label">${escapeXml(label)}:</text>${lines.map((line, lineIndex) => `<text x="${lineIndex ? 116 : 116 + label.length * 17 + 28}" y="${y + lineIndex * 42}" class="trait value">${escapeXml(line)}</text>`).join("")}</g>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
    <defs><style>
      @font-face{font-family:Silkscreen;src:url(data:font/woff2;base64,${silkscreen})}
      @font-face{font-family:Plex;src:url(data:font/woff2;base64,${plex})}
      .title{font-family:Silkscreen;fill:${BONE};text-anchor:middle}.trait{font:500 28px Plex}.label{fill:${BONE}}.value{fill:${EMBER}}
    </style><clipPath id="plate"><path d="M76 238H948V858H76Z"/></clipPath><pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 3.5H4" stroke="#000" stroke-opacity=".2"/></pattern></defs>
    <rect width="1024" height="1536" fill="${VOID}"/>
    <path d="M48 32H976V48H992V1488H976V1504H48V1488H32V48H48Z" fill="none" stroke="${FLARE}" stroke-width="15"/>
    <path d="M62 54H962V70H976V1466H962V1482H62V1466H48V70H62Z" fill="none" stroke="${EMBER}" stroke-width="3"/>
    ${title.lines.map((line, index) => `<text x="512" y="${112 + index * (title.size + 8)}" class="title" font-size="${title.size}">${escapeXml(line)}</text>`).join("")}
    <image href="data:image/webp;base64,${image}" x="76" y="238" width="872" height="620" preserveAspectRatio="xMidYMid slice" clip-path="url(#plate)"/>
    <rect x="76" y="238" width="872" height="620" fill="url(#scan)"/><rect x="76" y="238" width="872" height="620" fill="none" stroke="${EMBER}" stroke-width="7"/>
    ${rows}
    <text x="936" y="1460" text-anchor="end" font-family="Silkscreen" font-size="42" fill="${BONE}">SHEET #${escapeXml(traits.tokenId)}</text>
  </svg>`;
}

export async function renderCard(traits: MonsterTraits, illustration: Buffer) {
  const svg = await cardSvg(traits, illustration);
  const cardPng = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  const cardWebp = await sharp(cardPng).webp({ quality: 86 }).toBuffer();
  const thumbnail = await sharp(cardPng).resize(512, 768).webp({ quality: 84 }).toBuffer();
  const social = await sharp({ create: { width: 1200, height: 630, channels: 4, background: VOID } })
    .composite([{ input: await sharp(cardPng).resize({ height: 590 }).toBuffer(), gravity: "center" }])
    .webp({ quality: 86 }).toBuffer();
  return { svg, cardPng, cardWebp, thumbnail, social };
}
