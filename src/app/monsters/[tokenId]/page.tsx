import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyLink } from "@/components/copy-link";
import { ManifestButton } from "@/components/manifest-button";
import { MonsterCard } from "@/components/monster-card";
import { TraitList } from "@/components/trait-list";
import { ETHERSCAN_CONTRACT_URL, OPENSEA_COLLECTION_URL } from "@/lib/constants";
import { getMonster } from "@/server/repositories/monsters";

export async function generateMetadata({ params }: { params: Promise<{ tokenId: string }> }): Promise<Metadata> {
  const { tokenId } = await params;
  const monster = await getMonster(tokenId);
  return monster ? { title: monster.monsterName, description: `${monster.sheetName}: ${monster.monsterName}` } : { title: "Sheet not found" };
}

export default async function MonsterPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = await params;
  const monster = await getMonster(tokenId);
  if (!monster) notFound();
  return <div className="page shell monster-detail"><section className="card-column"><MonsterCard monster={monster}/></section><section className="monster-info"><p className="status-line"><span>{monster.visualization ? "REVEALED" : monster.job ? "MANIFESTING" : "UNREVEALED"}</span>{" // "}{monster.sheetName.toUpperCase()}</p><h1>{monster.monsterName}</h1><TraitList monster={monster}/>
    {monster.visualization ? <><div className="detail-actions"><Link className="button button-primary" href={monster.visualization.downloadUrl}>DOWNLOAD PNG</Link><CopyLink/></div><div className="provenance"><p className="eyebrow">PROVENANCE</p><dl><div><dt>STYLE</dt><dd>{monster.visualization.styleLabel}{" // V"}{monster.visualization.styleVersion}</dd></div><div><dt>MODEL</dt><dd>{monster.visualization.model}</dd></div><div><dt>REVEALED</dt><dd>{new Date(monster.visualization.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"2-digit"}).toUpperCase()}</dd></div><div><dt>REQUESTER</dt><dd>{monster.visualization.requester}</dd></div></dl><p>Creature artwork was generated off-chain. Traits and identity remain exactly as written by the source NFT.</p></div></> : <ManifestButton tokenId={monster.tokenId} initialJob={monster.job}/>}<div className="external-links"><Link href={`${ETHERSCAN_CONTRACT_URL}?a=${monster.tokenId}`} target="_blank">ETHERSCAN ↗</Link><Link href={OPENSEA_COLLECTION_URL} target="_blank">OPENSEA ↗</Link></div></section></div>;
}
