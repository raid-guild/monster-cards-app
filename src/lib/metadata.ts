import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import type { MonsterTraits } from "@/lib/types";
import { normalizeTokenId } from "@/lib/utils";

const MAX_TOKEN_URI_BYTES = 512_000;
const MAX_SVG_BYTES = 256_000;
const DATA_JSON_PREFIX = "data:application/json;base64,";
const DATA_SVG_PREFIX = "data:image/svg+xml;base64,";

const metadataSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(4096).optional(),
  image: z.string().startsWith(DATA_SVG_PREFIX),
});

const labels = {
  Size: "size",
  Alignment: "alignment",
  Actions: "actions",
  "Special Ability": "specialAbility",
  Weakness: "weakness",
  Locomotion: "locomotion",
  Language: "languages",
} as const;

export class MetadataError extends Error {
  code = "invalid_onchain_metadata" as const;
}

function decodeBoundedBase64(value: string, maxBytes: number) {
  if (value.length > Math.ceil((maxBytes * 4) / 3) + 8) {
    throw new MetadataError("Encoded metadata is too large.");
  }
  const buffer = Buffer.from(value, "base64");
  if (buffer.byteLength > maxBytes) throw new MetadataError("Decoded metadata is too large.");
  return buffer.toString("utf8");
}

function flattenTextNodes(node: unknown, output: string[] = []): string[] {
  if (typeof node === "string" || typeof node === "number") {
    output.push(String(node));
    return output;
  }
  if (Array.isArray(node)) {
    for (const child of node) flattenTextNodes(child, output);
    return output;
  }
  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    if ("#text" in record) flattenTextNodes(record["#text"], output);
    else for (const value of Object.values(record)) flattenTextNodes(value, output);
  }
  return output;
}

export function parseMonsterTokenUri(tokenIdInput: string, tokenUri: string) {
  const tokenId = normalizeTokenId(tokenIdInput);
  if (!tokenUri.startsWith(DATA_JSON_PREFIX)) throw new MetadataError("Unsupported token URI format.");

  let metadata: z.infer<typeof metadataSchema>;
  try {
    metadata = metadataSchema.parse(
      JSON.parse(decodeBoundedBase64(tokenUri.slice(DATA_JSON_PREFIX.length), MAX_TOKEN_URI_BYTES)),
    );
  } catch (error) {
    if (error instanceof MetadataError) throw error;
    throw new MetadataError("Malformed token metadata.");
  }

  const rawSvg = decodeBoundedBase64(metadata.image.slice(DATA_SVG_PREFIX.length), MAX_SVG_BYTES);
  if (/<!DOCTYPE|<!ENTITY/i.test(rawSvg)) throw new MetadataError("Unsafe XML declaration.");

  let parsed: Record<string, unknown>;
  try {
    parsed = new XMLParser({ ignoreAttributes: false, processEntities: false, preserveOrder: false }).parse(rawSvg);
  } catch {
    throw new MetadataError("Malformed token SVG.");
  }

  const svg = parsed.svg as Record<string, unknown> | undefined;
  const textNodes = svg?.text;
  const rawLines = (Array.isArray(textNodes) ? textNodes : [textNodes])
    .filter(Boolean)
    .map((node) => flattenTextNodes(node).join("").trim())
    .filter(Boolean);

  if (rawLines.length !== 8) throw new MetadataError("Expected one name and seven trait lines.");
  const monsterName = rawLines[0];
  const found = new Map<string, string>();

  for (const line of rawLines.slice(1)) {
    const separator = line.indexOf(":");
    if (separator <= 0) throw new MetadataError(`Invalid trait line: ${line}`);
    const label = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!(label in labels) || !value || found.has(label)) throw new MetadataError(`Unexpected trait: ${label}`);
    found.set(label, value);
  }

  for (const label of Object.keys(labels)) {
    if (!found.has(label)) throw new MetadataError(`Missing trait: ${label}`);
  }

  const split = (value: string) => value.split(",").map((part) => part.trim()).filter(Boolean);
  const traits: MonsterTraits = {
    tokenId,
    sheetName: metadata.name,
    monsterName,
    size: found.get("Size")!,
    alignment: found.get("Alignment")!,
    actions: split(found.get("Actions")!),
    specialAbility: found.get("Special Ability")!,
    weakness: found.get("Weakness")!,
    locomotion: found.get("Locomotion")!,
    languages: split(found.get("Language")!),
    rawLines,
  };

  return { metadata, rawSvg, traits };
}
