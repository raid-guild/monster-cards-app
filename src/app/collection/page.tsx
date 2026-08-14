import type { Metadata } from "next";
import { CollectionClient } from "@/components/collection-client";

export const metadata: Metadata = { title: "My Monsters" };

export default function CollectionPage() {
  return <div className="page shell"><div className="page-header"><p className="eyebrow">CONNECTED HOLDINGS</p><h1>MY MONSTERS</h1><p>Choose an on-chain sheet and reveal the form encoded in its traits.</p></div><CollectionClient/></div>;
}
