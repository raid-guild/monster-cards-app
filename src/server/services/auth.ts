import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import { SiweMessage, generateNonce } from "siwe";
import { getAddress } from "viem";
import { db } from "@/server/db";
import { authNonces } from "@/server/db/schema";
import { env } from "@/server/env";

export const SESSION_COOKIE = "monster_session";
export const NONCE_COOKIE = "monster_nonce";
const localNonces = new Map<string, Date>();

function secret() {
  return new TextEncoder().encode(env().SESSION_SECRET);
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function issueNonce() {
  const nonce = `${generateNonce()}${randomBytes(4).toString("hex")}`;
  const expiresAt = new Date(Date.now() + 10 * 60_000);
  const database = db();
  if (database) await database.insert(authNonces).values({ nonceHash: hash(nonce), expiresAt });
  else localNonces.set(hash(nonce), expiresAt);
  return { nonce, expiresAt };
}

async function consumeNonce(nonce: string) {
  const nonceHash = hash(nonce);
  const database = db();
  if (!database) {
    const expires = localNonces.get(nonceHash);
    localNonces.delete(nonceHash);
    return Boolean(expires && expires > new Date());
  }
  const rows = await database
    .update(authNonces)
    .set({ consumedAt: new Date() })
    .where(and(eq(authNonces.nonceHash, nonceHash), isNull(authNonces.consumedAt), gt(authNonces.expiresAt, new Date())))
    .returning({ id: authNonces.id });
  return rows.length === 1;
}

export async function verifySiwe(messageInput: string, signature: string) {
  const message = new SiweMessage(messageInput);
  if (!message.nonce || !(await consumeNonce(message.nonce))) throw new Error("invalid_or_expired_nonce");
  const expectedUri = new URL(env().NEXT_PUBLIC_APP_URL).origin;
  const result = await message.verify({ signature, domain: env().SIWE_DOMAIN, nonce: message.nonce });
  if (!result.success || message.chainId !== 1 || new URL(message.uri).origin !== expectedUri) throw new Error("invalid_signature");
  return getAddress(message.address);
}

export async function createSession(address: string) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000);
  const token = await new SignJWT({ address: getAddress(address), chainId: 1 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuer("monsters")
    .setAudience("monsters-web")
    .sign(secret());
  return { token, expiresAt };
}

export async function readSession(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: "monsters", audience: "monsters-web" });
    if (typeof payload.address !== "string") return null;
    return { address: getAddress(payload.address), chainId: Number(payload.chainId) };
  } catch {
    return null;
  }
}
