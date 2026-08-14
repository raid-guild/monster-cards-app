import { cookies } from "next/headers";
import { z } from "zod";
import { fail, ok } from "@/server/http";
import { readSession, SESSION_COOKIE } from "@/server/services/auth";
import { createGeneration, GenerationError } from "@/server/services/generations";

const bodySchema = z.object({ tokenId: z.string().regex(/^\d+$/), style: z.string().min(1).max(64) });

export async function POST(request: Request) {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return fail("session_required", "Sign a free wallet message to manifest this monster.", 401);
  try {
    const body = bodySchema.parse(await request.json());
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? "";
    const result = await createGeneration({ ...body, wallet: session.address, idempotencyKey });
    return ok(result, { status: result.visualizationId ? 200 : 202 });
  } catch (error) {
    if (error instanceof GenerationError) return fail(error.code, error.message, error.status);
    return fail("invalid_request", "The archive could not accept that request.", 400);
  }
}
