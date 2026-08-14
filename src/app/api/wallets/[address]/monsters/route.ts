import { isAddress } from "viem";
import { fail, ok } from "@/server/http";
import { joinVisualizationState } from "@/server/repositories/monsters";
import { readHoldings } from "@/server/services/chain";
import { demoMonsters } from "@/lib/fixtures";
import { env } from "@/server/env";

export async function GET(_: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  if (!isAddress(address)) return fail("invalid_address", "That wallet address is invalid.", 400);
  try {
    const holdings = await readHoldings(address);
    const tokens = await joinVisualizationState(holdings.monsters);
    return ok({ address: holdings.address, chainId: 1, readAt: new Date().toISOString(), tokens });
  } catch (error) {
    console.error("wallet_holdings_read_failed", {
      address,
      error: error instanceof Error ? error.message : String(error),
    });
    if (env().USE_DEMO_DATA) {
      return ok({ address, chainId: 1, readAt: new Date().toISOString(), tokens: demoMonsters });
    }
    return fail("rpc_unavailable", "The chain could not be read.", 503);
  }
}
