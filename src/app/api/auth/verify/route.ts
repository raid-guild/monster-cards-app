import { cookies } from "next/headers";
import { z } from "zod";
import { fail, ok } from "@/server/http";
import { createSession, NONCE_COOKIE, SESSION_COOKIE, verifySiwe } from "@/server/services/auth";

const bodySchema = z.object({ message: z.string().min(1).max(4096), signature: z.string().min(1).max(2048) });

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const address = await verifySiwe(body.message, body.signature);
    const session = await createSession(address);
    const store = await cookies();
    store.set(SESSION_COOKIE, session.token, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: session.expiresAt,
    });
    store.delete(NONCE_COOKIE);
    return ok({ address, expiresAt: session.expiresAt.toISOString() });
  } catch {
    (await cookies()).delete(NONCE_COOKIE);
    return fail("signature_invalid", "The signature could not be verified. No transaction was sent.", 401);
  }
}
