import { cookies } from "next/headers";
import { ok } from "@/server/http";
import { NONCE_COOKIE, SESSION_COOKIE } from "@/server/services/auth";

export async function POST() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(NONCE_COOKIE);
  return ok({ signedOut: true });
}
