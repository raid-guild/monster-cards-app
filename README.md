# Monsters — The Ember Archive

A production-oriented MVP for manifesting the text traits of an on-chain Monsters NFT as a deterministic collectible card. The Next.js app serves the public Bestiary, wallet holdings, SIWE authorization, and job APIs. A separate Node worker reads PostgreSQL jobs, verifies ownership, generates only the creature plate, composes exact card text with Sharp, and archives immutable derivatives in S3-compatible storage.

## Local review

```bash
cp .env.example .env.local
npm install
npm run dev
```

`USE_DEMO_DATA=true` makes the supplied reference cards available on `/`, `/explore`, `/monsters/2630`, and `/monsters/8750`. `/monsters/1` demonstrates an unrevealed sheet. A connected wallet receives fixture holdings if no RPC is configured. Demo mode never fakes a successful paid generation; `GENERATION_ENABLED` remains false.

## Production setup

1. Create a Railway Storage Bucket and add the variables in `.env.example` to web and worker services.
2. Back up the shared Postgres database and run `npm run db:migrate` once as a release command.
3. Run `npm run db:seed` to install immutable Ember Archive v1. Inspect the seeded record before activating production.
4. Deploy the web service with `npm run start` and worker with `npm run worker`. Start with one worker replica.
5. Keep `GENERATION_ENABLED=false` until chain reads, SIWE domain binding, bucket delivery, OpenAI account verification, and a capped 30-token visual evaluation have passed.
6. Set `USE_DEMO_DATA=false` in staging and production.

Set `IMAGE_GENERATION_PAUSED=true` to quickly pause new image generation requests without changing launch readiness settings. Users will see “Image generation is paused. Please check back later.”

The OpenAI adapter uses `gpt-image-2-2026-04-21`, the snapshot corresponding to the explicitly selected `gpt-image-2` model. It uses the Image API edit endpoint with the two supplied art references. Per the [official OpenAI image guide](https://developers.openai.com/api/docs/guides/image-generation), the Image API is appropriate for one-shot image generation/editing, returns base64 image data, and supports the selected landscape size, WebP format, and compression controls.

## Commands

- `npm run test` — parser, prompt, and deterministic render tests.
- `npm run lint` / `npm run typecheck` / `npm run build` — release checks.
- `npm run worker:once` — claim at most one eligible job, useful for staging.
- `npm run operator:hide -- <id> <reason>` — reversibly hide a visualization.
- `npm run operator:replace -- <id>` — grant the one audited quality replacement.

## Launch inputs still required

The code uses conservative local defaults, but deployment needs the final production/staging domains, WalletConnect project ID, Alchemy RPC URL and known rate limits, Postgres and bucket credentials, OpenAI API key/account verification, initial daily/monthly budget policy, support contact for quality reports, and the generated-card reuse/license copy. The supplied crossed-swords SVG is already used for the persistent RaidGuild credit.
