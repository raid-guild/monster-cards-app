import { cookies } from "next/headers";
import { ok } from "@/server/http";
import { issueNonce, NONCE_COOKIE } from "@/server/services/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { nonce, expiresAt } = await issueNonce();
  (await cookies()).set(NONCE_COOKIE, nonce, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
  return ok({ nonce, expiresAt: expiresAt.toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
