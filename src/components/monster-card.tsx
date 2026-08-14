"use client";

import { useState } from "react";
import type { MonsterRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MonsterCard({ monster }: { monster: MonsterRecord }) {
  const [original, setOriginal] = useState(!monster.visualization);
  const canFlip = Boolean(monster.visualization);
  return (
    <div className="monster-card-wrap">
      <div className={cn("monster-card-flip", original && "show-original")}>
        <div className="monster-card-face monster-card-front">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={monster.visualization?.cardUrl ?? monster.originalImageUrl} alt={`AI visualization of ${monster.sheetName}, ${monster.monsterName}.`} />
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
