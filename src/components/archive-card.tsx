import Link from "next/link";
import type { MonsterRecord } from "@/lib/types";

export function ArchiveCard({ monster, priority = false }: { monster: MonsterRecord; priority?: boolean }) {
  const image = monster.visualization?.thumbnailUrl ?? monster.originalImageUrl;
  return (
    <Link className="archive-card" href={`/monsters/${monster.tokenId}`} aria-label={`Open ${monster.sheetName}, ${monster.monsterName}`}>
      <div className="archive-card-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={`Visualization of ${monster.sheetName}, ${monster.monsterName}.`} loading={priority ? "eager" : "lazy"} />
        <span className="corner corner-a" aria-hidden="true" /><span className="corner corner-b" aria-hidden="true" />
      </div>
      <div className="archive-card-meta">
        <p>{monster.sheetName}</p><h3>{monster.monsterName}</h3><span>{monster.visualization ? "REVEALED" : "READY TO REVEAL"}</span>
      </div>
    </Link>
  );
}
