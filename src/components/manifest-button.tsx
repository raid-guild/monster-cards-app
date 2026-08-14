"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";
import { useAccount, useSignMessage } from "wagmi";
import type { ApiEnvelope, PublicJob } from "@/lib/types";

export function ManifestButton({ tokenId, initialJob }: { tokenId: string; initialJob?: PublicJob | null }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const [job, setJob] = useState(initialJob ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!job || !["queued", "running"].includes(job.status)) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/generations/${job.id}`, { cache: "no-store" });
      const envelope = await response.json() as ApiEnvelope<PublicJob>;
      if (envelope.data) {
        setJob(envelope.data);
        if (!["queued", "running"].includes(envelope.data.status)) router.refresh();
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [job, router]);

  async function manifest() {
    if (!isConnected || !address) { openConnectModal?.(); return; }
    setBusy(true); setError(null);
    try {
      const nonceResponse = await fetch("/api/auth/nonce", { cache: "no-store" });
      const nonceEnvelope = await nonceResponse.json() as ApiEnvelope<{ nonce: string }>;
      if (!nonceEnvelope.data) throw new Error(nonceEnvelope.error.message);
      const now = new Date();
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Authorize one project-funded Monsters manifestation. This is free and sends no transaction.",
        uri: window.location.origin,
        version: "1",
        chainId: 1,
        nonce: nonceEnvelope.data.nonce,
        issuedAt: now.toISOString(),
        expirationTime: new Date(now.getTime() + 10 * 60_000).toISOString(),
      }).prepareMessage();
      const signature = await signMessageAsync({ message });
      const verify = await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, signature }) });
      const verified = await verify.json() as ApiEnvelope<{ address: string }>;
      if (!verified.data) throw new Error(verified.error.message);
      const generation = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ tokenId, style: "ember-archive" }),
      });
      const result = await generation.json() as ApiEnvelope<{ job: PublicJob | null; visualizationId: string | null }>;
      if (!result.data) throw new Error(result.error.message);
      if (result.data.job) setJob(result.data.job);
      else router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The signature was cancelled. No transaction was sent.";
      setError(message.includes("User rejected") ? "Signature cancelled. No transaction was sent." : message);
    } finally { setBusy(false); }
  }

  if (job && ["queued", "running"].includes(job.status)) {
    const labels: Record<string, string> = {
      verifying_ownership: "VERIFYING OWNERSHIP", reading_traits: "READING TRAITS", generating_illustration: "GENERATING CREATURE",
      assembling_card: "ASSEMBLING CARD", uploading_assets: "ARCHIVING", publishing: "PUBLISHING",
    };
    return <div className="generation-state" role="status"><span className="scan-glyph" aria-hidden="true" /><div><strong>{job.status === "queued" ? "QUEUED" : "MANIFESTING"}</strong><p>{labels[job.checkpoint ?? ""] ?? "AWAITING THE ARCHIVE"}</p><small>This may take up to two minutes. You may leave this page.</small></div></div>;
  }

  return <div className="manifest-control"><button className="button button-primary button-large" onClick={manifest} disabled={busy}>{busy ? "REQUESTING SIGNATURE…" : "MANIFEST MONSTER"}</button><p>Signing is free. It proves wallet control and sends no transaction.</p>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}
