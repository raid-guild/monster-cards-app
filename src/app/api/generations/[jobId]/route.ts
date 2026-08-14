import { cookies } from "next/headers";
import { fail, ok } from "@/server/http";
import { readSession, SESSION_COOKIE } from "@/server/services/auth";
import { getGeneration } from "@/server/services/generations";

export async function GET(_: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return fail("session_required", "Your archive session has expired.", 401);
  const { jobId } = await params;
  const job = await getGeneration(jobId, session.address);
  return job ? ok(job) : fail("not_found", "That manifestation job was not found.", 404);
}
