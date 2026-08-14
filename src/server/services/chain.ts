import { createHash } from "node:crypto";
import { createPublicClient, getAddress, http, type Address } from "viem";
import { ethereumMainnet, monstersAbi, MONSTERS_CONTRACT } from "@/lib/constants";
import { parseMonsterTokenUri } from "@/lib/metadata";
import type { MonsterTraits } from "@/lib/types";
import { env } from "@/server/env";

type ChainMonster = {
  traits: MonsterTraits;
  rawSvg: string;
  rawTokenUri: string;
  tokenUriHash: string;
  blockNumber?: string;
};

const cache = new Map<string, ChainMonster>();

export function chainClient() {
  const rpc = env().ETHEREUM_RPC_URL;
  if (!rpc) throw Object.assign(new Error("Ethereum RPC is not configured."), { code: "rpc_unavailable" });
  return createPublicClient({ chain: ethereumMainnet, transport: http(rpc, { timeout: 15_000, retryCount: 2 }) });
}

export async function readMonster(tokenId: string, fresh = false): Promise<ChainMonster> {
  if (!fresh && cache.has(tokenId)) return cache.get(tokenId)!;
  const client = chainClient();
  const [tokenUri, blockNumber] = await Promise.all([
    client.readContract({ address: MONSTERS_CONTRACT, abi: monstersAbi, functionName: "tokenURI", args: [BigInt(tokenId)] }),
    client.getBlockNumber(),
  ]);
  const parsed = parseMonsterTokenUri(tokenId, tokenUri);
  const result = {
    ...parsed,
    rawTokenUri: tokenUri,
    tokenUriHash: createHash("sha256").update(tokenUri).digest("hex"),
    blockNumber: blockNumber.toString(),
  };
  cache.set(tokenId, result);
  return result;
}

export async function currentOwner(tokenId: string) {
  return chainClient().readContract({
    address: MONSTERS_CONTRACT,
    abi: monstersAbi,
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });
}

export async function readHoldings(addressInput: string) {
  const address = getAddress(addressInput);
  const client = chainClient();
  const balance = await client.readContract({
    address: MONSTERS_CONTRACT,
    abi: monstersAbi,
    functionName: "balanceOf",
    args: [address],
  });

  const tokenIds: string[] = [];
  const indexes = Array.from({ length: Number(balance) }, (_, index) => BigInt(index));
  for (let offset = 0; offset < indexes.length; offset += 50) {
    const results = await client.multicall({
      contracts: indexes.slice(offset, offset + 50).map((index) => ({
        address: MONSTERS_CONTRACT,
        abi: monstersAbi,
        functionName: "tokenOfOwnerByIndex" as const,
        args: [address, index] as const,
      })),
      allowFailure: false,
    });
    tokenIds.push(...results.map(String));
  }

  tokenIds.sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
  const monsters: ChainMonster[] = [];
  for (let offset = 0; offset < tokenIds.length; offset += 20) {
    monsters.push(...(await Promise.all(tokenIds.slice(offset, offset + 20).map((id) => readMonster(id)))));
  }
  return { address: address as Address, monsters };
}
