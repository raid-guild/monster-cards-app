import { ok } from "@/server/http";
import { getExplore } from "@/server/repositories/monsters";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await getExplore({
    q: url.searchParams.get("q") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 24),
  });
  return ok(result);
}
