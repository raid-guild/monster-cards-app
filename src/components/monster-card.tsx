"use client";

import { useState } from "react";
import type { MonsterRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MonsterCard({ monster }: { monster: MonsterRecord }) {
  const [original, setOriginal] = useState(!monster.visualization);
  const canFlip = Boolean(monster.visualization);
  const frontImage = monster.visualization?.cardUrl ?? monster.originalImageUrl;
  const frontAlt = monster.visualization
    ? `AI visualization of ${monster.sheetName}, ${monster.monsterName}.`
    : `Original on-chain trait sheet for ${monster.monsterName}.`;

  return (
    <div className="monster-card-wrap">
      <div className={cn("monster-card-flip", original && "show-original")}>
        <div className={cn("monster-card-face monster-card-front", !monster.visualization && "monster-card-original-front")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={frontImage} alt={frontAlt} />
        </div>
        <div className="monster-card-face monster-card-back">
          <p>ORIGINAL ON-CHAIN SHEET</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={monster.originalImageUrl} alt={`Original on-chain trait sheet for ${monster.monsterName}.`} />
          <span>{monster.sheetName}</span>
        </div>
      </div>
      {canFlip && <><button className="button button-secondary flip-control" onClick={() => setOriginal(!original)} aria-pressed={original}>{original ? "VIEW MANIFESTATION" : "VIEW ORIGINAL"}</button><span className="sr-only" aria-live="polite">{original ? "Showing original on-chain sheet" : "Showing manifested card"}</span></>}
    </div>
  );
}
