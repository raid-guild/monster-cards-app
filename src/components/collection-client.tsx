"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { ArchiveCard } from "@/components/archive-card";
import { WalletControl } from "@/components/wallet-control";
import { OPENSEA_COLLECTION_URL } from "@/lib/constants";
import type { ApiEnvelope, MonsterRecord } from "@/lib/types";
import { abbreviateAddress } from "@/lib/utils";

type HoldingResponse = { address: string; chainId: number; readAt: string; tokens: MonsterRecord[] };

export function CollectionClient() {
  const { address, isConnected } = useAccount();
  const query = useQuery({
    queryKey: ["monster-holdings", address],
    enabled: Boolean(address),
    queryFn: async () => {
      const response = await fetch(`/api/wallets/${address}/monsters`, { cache: "no-store" });
      const body = await response.json() as ApiEnvelope<HoldingResponse>;
      if (!body.data) throw new Error(body.error.message);
      return body.data;
    },
    staleTime: 15_000,
  });
  const data = query.data ?? null;
  const loading = query.isFetching;
  const error = query.error instanceof Error ? query.error.message : null;
  const load = () => { void query.refetch(); };

  const currentData = data && address && data.address.toLowerCase() === address.toLowerCase() ? data : null;

  if (!isConnected) return <section className="empty-state"><span>00</span><h2>CONNECT A WALLET TO READ YOUR SHEETS.</h2><p>Holdings discovery is read-only. No signature is required.</p><WalletControl /></section>;
  if (error) return <section className="empty-state error-state"><span>ERR</span><h2>THE CHAIN COULD NOT BE READ.</h2><p>{error}</p><button className="button button-secondary" onClick={load}>RETRY</button></section>;
  if (loading && !currentData) return <div className="collection-skeleton" aria-label="Reading Monsters holdings"><div/><div/><div/></div>;
  if (currentData && currentData.tokens.length === 0) return <section className="empty-state"><span>00</span><h2>NO MONSTERS FOUND IN THIS WALLET.</h2><div className="inline-actions"><Link className="button button-secondary" href="/explore">ENTER THE BESTIARY</Link><Link className="text-link" href={OPENSEA_COLLECTION_URL} target="_blank">VIEW COLLECTION ↗</Link></div></section>;

  return <>{currentData && <div className="collection-summary"><div><p>{abbreviateAddress(currentData.address)}{" // "}{currentData.tokens.length} {currentData.tokens.length === 1 ? "SHEET" : "SHEETS"}</p><small>READ {new Date(currentData.readAt).toLocaleTimeString()}</small></div><button className="icon-button" onClick={load} aria-label="Refresh holdings" disabled={loading}><RefreshCw className={loading ? "spin" : ""}/></button></div>}<div className="archive-grid collection-grid">{currentData?.tokens.map((monster) => <ArchiveCard key={monster.tokenId} monster={monster}/>)}</div></>;
}
