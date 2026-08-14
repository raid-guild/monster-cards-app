import { fail, ok } from "@/server/http";
import { getMonster } from "@/server/repositories/monsters";

export async function GET(_: Request, { params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  if (!/^\d+$/.test(tokenId)) return fail("invalid_token_id", "Invalid sheet number.", 400);
  const monster = await getMonster(tokenId);
  return monster ? ok(monster) : fail("not_found", "That sheet could not be found.", 404);
}
