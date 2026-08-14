import Link from "next/link";
import Image from "next/image";
import { ArchiveCard } from "@/components/archive-card";
import { WalletControl } from "@/components/wallet-control";
import { getExplore } from "@/server/repositories/monsters";

export const revalidate = 60;

export default async function HomePage() {
  const latest = await getExplore({ limit: 6 });
  return <>
    <section className="hero shell">
      <div className="hero-gridlines" aria-hidden="true"/>
      <div className="hero-copy"><p className="eyebrow">MONSTERS // ETHEREUM MAINNET</p><h1>THE CHAIN WROTE<br/>THE MONSTER.</h1><p className="hero-lede">Reveal the creature hidden inside your on-chain traits.</p><div className="hero-actions"><WalletControl/><Link className="text-link" href="/explore">ENTER THE BESTIARY <span>→</span></Link></div><p className="hero-index">ARCHIVE INDEX // 0xECB9…413E</p></div>
      <div className="hero-specimen"><div className="specimen-behind" aria-hidden="true"/><div className="specimen-card"><Image src="/reference/monster-card-2.jpg" width={853} height={1280} priority alt="Manticore manifestation card specimen."/><span className="specimen-tag">SPECIMEN // 2630</span></div></div>
    </section>
    <section className="process-section shell"><p className="section-index">PROTOCOL // 03 STEPS</p><div className="process-grid">{[["01","CONNECT","Read your Monsters holdings."],["02","CHOOSE","Select an on-chain sheet."],["03","MANIFEST","Reveal its singular form."]].map(([number,title,text])=><div key={number}><span>{number}</span><h2>{title}</h2><p>{text}</p></div>)}</div></section>
    <section className="latest-section shell"><div className="section-heading"><div><p className="eyebrow">PUBLIC ARCHIVE</p><h2>LATEST MANIFESTATIONS</h2></div><Link className="text-link" href="/explore">VIEW ALL {latest.total} →</Link></div><div className="archive-grid">{latest.items.map((monster,index)=><ArchiveCard key={monster.tokenId} monster={monster} priority={index<2}/>)}</div></section>
  </>;
}
