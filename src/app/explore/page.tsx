import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveCard } from "@/components/archive-card";
import { getExplore } from "@/server/repositories/monsters";

export const metadata: Metadata = { title: "The Bestiary" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; cursor?: string }> }) {
  const filters = await searchParams;
  const result = await getExplore({ q: filters.q, sort: filters.sort, cursor: filters.cursor, limit: 24 });
  return <div className="page shell"><div className="page-header split-header"><div><p className="eyebrow">PUBLIC ARCHIVE // {String(result.total).padStart(4,"0")} ENTRIES</p><h1>THE BESTIARY</h1><p>Every manifested creature. Public, permanent, and bound to its sheet.</p></div><span className="live-count"><i/> {result.total} REVEALED</span></div>
    <form className="explore-controls" action="/explore"><label><span className="sr-only">Search by sheet number or monster name</span><input name="q" defaultValue={filters.q} placeholder="SEARCH NAME OR SHEET #"/></label><label><span className="sr-only">Sort bestiary</span><select name="sort" defaultValue={filters.sort ?? "newest"}><option value="newest">NEWEST REVEALED</option><option value="oldest">OLDEST REVEALED</option><option value="token_asc">SHEET NUMBER ↑</option></select></label><button className="button button-secondary" type="submit">SEARCH</button></form>
    {result.items.length ? <><div className="archive-grid explore-grid">{result.items.map((monster)=><ArchiveCard key={monster.tokenId} monster={monster}/>)}</div>{result.nextCursor && <div className="pagination"><Link className="button button-secondary" href={{ pathname: "/explore", query: { q: filters.q, sort: filters.sort, cursor: result.nextCursor } }}>NEXT ARCHIVE PAGE →</Link></div>}</> : <section className="empty-state"><span>Ø</span><h2>NO SHEETS MATCH THAT QUERY.</h2><Link className="button button-secondary" href="/explore">RESET SEARCH</Link></section>}
  </div>;
}
