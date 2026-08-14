import { isAddress } from "viem";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function abbreviateAddress(address: string) {
  return isAddress(address) ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export function normalizeTokenId(value: string) {
  if (!/^\d+$/.test(value)) throw new Error("invalid_token_id");
  return BigInt(value).toString();
}

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function safeRequestId() {
  return `req_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
}
