# Monsters — Visualization Web App Build Spec

Status: detailed draft for product, design, and engineering review  
Date: August 14, 2026  
Source brief: `monster-lore.md`  
Visual references: `monster-card-2.jpg`, `more-cards.png`

## 1. Product Summary

Build a polished web app that turns the text-only traits of an on-chain Monsters NFT into a collectible illustrated monster card.

A visitor can browse previously visualized monsters without connecting a wallet. A holder connects a wallet, sees every Monsters NFT owned by that address, selects one, signs in with the wallet, and starts a one-time AI visualization. The app generates the creature artwork, assembles an exact card from the NFT's traits, stores the result, and publishes it to the public Explore gallery. The finished card can be flipped to reveal the original on-chain trait sheet.

The product should feel like a forbidden bestiary recovered from an old computer terminal—not like a generic NFT dashboard, a conventional fantasy game UI, or a shadcn demo with a dark theme applied.

### Working product promise

> The chain wrote the monster. You reveal its form.

### App name

Use **Monsters** for the MVP. “The Bestiary” remains the Explore destination, and `MANIFEST` is the primary generation action.

## 2. Confirmed Product Decisions

These decisions were confirmed on August 14, 2026:

- Ethereum mainnet only in the MVP.
- Monsters contract: `0xecb9b2ea457740fbde58c758e4c574834224413e`.
- Public Explore gallery requires no wallet connection.
- A connected wallet may view holdings without signing a message.
- A valid wallet signature and current token ownership are required only when the holder presses `MANIFEST`; ordinary browsing and holdings discovery do not require authentication.
- Use a lightweight SIWE challenge through RainbowKit for that signature because the project-funded generation endpoint must verify control of the connected address server-side.
- One canonical visualization per token and style in the MVP; no user-initiated rerolls.
- Generated visualizations stay attached to the token ID when ownership changes.
- The generated result is public once complete.
- The project pays generation costs in the MVP. Access is limited to current Monsters holders, with conservative per-wallet and global limits.
- AI generates the creature illustration only. The app renders all words, icons, framing, and layout so on-chain traits remain exact.
- Use `gpt-image-2` for the initial generation evaluation and launch configuration if the evaluation passes.
- A separate Railway worker handles generation jobs; the browser polls job state.
- Deploy the app and a new Storage Bucket in the existing Railway project; use the existing Railway Postgres database with full schema permissions.
- Use the existing Alchemy Ethereum RPC account and keys.
- Use an immutable, versioned style and prompt configuration so the visual direction can evolve without changing old cards.
- The visual direction is “The Ember Archive,” with restrained CRT texture, warm ember rather than pink as the core signal color, and limited approved accent colors in creature illustrations.
- Use Silkscreen and IBM Plex Mono unless prototype testing reveals a legibility problem.
- Use `MANIFEST` as the primary CTA and `MANIFESTING` as the active generation state.
- Dark fantasy horror, gore, and body-horror details are allowed within provider policy; one primary creature and environmental effects are permitted.
- Completed cards offer PNG download and Copy link. No native share flow is required.
- The downloadable card does not include an AI-generation disclosure.
- The requesting wallet is shown publicly only in abbreviated form.
- Explore does not need owner or ENS filtering.
- Successful results publish directly to Explore without human approval.
- No admin UI, IPFS publication, or historical visualization import is required for MVP.

Remaining implementation choices are collected in [Decision Log and Remaining Open Questions](#25-decision-log-and-remaining-open-questions).

## 3. Goals

### MVP goals

- Make wallet connection and owned-token discovery feel immediate and trustworthy.
- Render every Monsters NFT held by the connected address, including already visualized and not-yet-visualized states.
- Turn one eligible NFT into one stable, high-quality illustrated card.
- Preserve the exact on-chain monster name and traits in the final card.
- Give generation a durable queued/running/succeeded/failed lifecycle.
- Avoid duplicate generations and duplicate provider charges.
- Let anyone browse completed cards in a responsive Explore gallery.
- Let users flip a generated card to see its original on-chain trait sheet.
- Establish a distinctive, accessible visual system derived from the supplied artwork.
- Store prompt version, model, trait snapshot, and render provenance so results can be audited and reproduced as closely as the provider allows.
- Leave clean extension points for alternate visual styles, Maps NFTs, Monster + Map stories, and an optional derivative NFT mint using the converted artwork.

### Success signals

Instrument these events even if the MVP initially stores only aggregate server logs:

- `wallet_connected`
- `wallet_has_monsters`
- `wallet_has_no_monsters`
- `monster_selected`
- `sign_in_completed`
- `generation_requested`
- `generation_completed`
- `generation_failed`
- `card_flipped`
- `card_downloaded`
- `explore_card_opened`

Initial product metrics:

- Wallet-to-generation conversion rate.
- Successful generation rate.
- Median and p95 generation duration.
- Duplicate-charge count; target: zero.
- Generation moderation/refusal rate.
- Explore-to-wallet-connect conversion rate.
- Share/download rate for completed cards.

## 4. Non-Goals for MVP

- Minting a new NFT or changing the existing NFT's metadata. A separate derivative mint is a recorded future path.
- Writing generated art on-chain.
- Transferring, listing, buying, or selling NFTs.
- Supporting contracts other than the specified Monsters collection.
- Supporting chains other than Ethereum mainnet.
- A user-editable prompt box.
- Multiple selectable art styles in the public UI.
- Unlimited regeneration or variant generation.
- AI-written stories or narrative card backs.
- Maps NFT visualization.
- Monster + Map combined generation.
- Social accounts, profiles, follows, likes, or comments.
- A full CMS or general-purpose admin platform.
- Perfect character consistency across unrelated token IDs.

## 5. Users and Permissions

### Visitor

- Browse Explore.
- Open a generated monster detail page.
- Flip a generated card.
- View exact traits and the original on-chain sheet.
- Download the public card as a PNG.
- Connect a wallet.

### Connected wallet

- Everything a visitor can do.
- View Monsters NFTs held by the connected address.
- See eligibility and visualization state for each held token.
- Does not yet have authority to spend an app-funded generation merely by connecting.

### Signed-in holder

- Has completed a valid SIWE challenge for the connected wallet.
- May request generation only for a token currently owned by that wallet.
- May retry a failed job when the failure is marked retryable.
- May report a technically successful but clearly broken render for one operator-approved quality replacement; this is not a discretionary reroll.

### Operator/admin

- Inspect failed jobs and provider request IDs.
- Retry or cancel safe-to-retry jobs.
- Hide a broken or inappropriate visualization from Explore without deleting its audit record.
- Create and activate prompt/style versions through a controlled operational workflow.
- No admin UI is required for MVP; use protected scripts and Railway/database inspection.

## 6. Information Architecture

### Public routes

| Route | Purpose |
| --- | --- |
| `/` | Product introduction, wallet entry point, and a small featured/latest gallery |
| `/collection` | Connected wallet's Monsters holdings and generation entry point |
| `/explore` | Public, paginated gallery of completed visualizations |
| `/monsters/[tokenId]` | Canonical detail page for a token and its visualization state |
| `/about` | Short explanation of the on-chain project, visualization process, contract, and provenance |

`/collection` redirects or presents a connect state when no wallet is connected. It must never show a blank grid as the only indication that a wallet is missing.

### Primary navigation

- Wordmark: Monsters; returns to `/`.
- Explore.
- My Monsters; routes to `/collection` and prompts wallet connection when necessary.
- About.
- Wallet control at the far right on desktop and inside the menu on small screens.

Use the product's own wallet button built on RainbowKit hooks. The default RainbowKit button styling should not appear in the final branded interface.

### Site footer

- Include a persistent `Built By RaidGuild` link on every public route.
- Link target: `https://www.raidguild.org/`.
- Place the supplied RaidGuild crossed-swords icon immediately before the text.
- The icon is decorative when adjacent to the text and should use `aria-hidden="true"`; the anchor's accessible name comes from `Built By RaidGuild`.
- Open the external link in a new tab with `rel="noopener noreferrer"`.
- Style it as quiet maker-credit metadata in bone/ash, with an ember hover/focus state. It must remain legible and keyboard accessible.
- Use the real supplied icon asset when available; do not approximate or redraw the RaidGuild mark.

## 7. Core User Flows

### 7.1 Browse without a wallet

1. Visitor opens `/` or `/explore`.
2. Completed cards load from the application database, not from an exhaustive chain scan.
3. Visitor opens a card.
4. Detail view presents the illustrated front.
5. Visitor activates “View original” or flips the card to see the on-chain trait sheet.
6. The same trait data is available as semantic text below the visual card.

Acceptance criteria:

- No wallet modal appears automatically.
- Gallery content is crawlable and server-rendered where practical.
- Every public card has a stable `/monsters/[tokenId]` URL.
- Hidden, failed, and in-progress jobs never appear in Explore.

### 7.2 Connect and discover holdings

1. User selects “Connect wallet.”
2. RainbowKit presents supported wallets.
3. On connection, the app confirms Ethereum mainnet for collection reads. The wallet does not need to switch networks for read-only discovery if the application RPC is used.
4. Server reads `balanceOf(address)` from the Monsters contract.
5. If balance is greater than zero, server reads `tokenOfOwnerByIndex(address, index)` for every index in bounded multicall batches.
6. Server reads `tokenURI(tokenId)` for the returned IDs and normalizes the embedded JSON/SVG traits.
7. Application joins token IDs against stored visualization/job records.
8. Collection grid renders one item per owned NFT.

Acceptance criteria:

- Zero balance gets a designed empty state with Explore and OpenSea links.
- A chain/RPC failure is not presented as “you own no monsters.”
- Holdings refresh after wallet or account changes.
- Token ordering is stable, defaulting to ascending token ID.
- Large holdings are processed in bounded batches and progressively displayed or skeletonized.

### 7.3 Manifest an eligible monster

1. Holder opens an unvisualized token.
2. Detail view shows the original sheet, normalized traits, and `MANIFEST MONSTER`.
3. If no valid SIWE session exists, pressing `MANIFEST MONSTER` first requests one wallet signature. Explain that signing is free, proves control of the wallet for this project-funded action, and does not submit a transaction.
4. Client posts the token ID, style slug, and idempotency key.
5. Server validates session wallet, chain, token existence, current `ownerOf(tokenId)`, style availability, generation policy, and rate limits.
6. In one database transaction, server returns an existing job or creates one queued job protected by a unique constraint.
7. Client routes to or remains on `/monsters/[tokenId]` and displays durable progress.
8. Worker claims the job, rechecks ownership, reads a fresh trait snapshot, builds the versioned prompt, generates the illustration, assembles derivatives, uploads media, and commits success.
9. UI transitions to the completed card and offers flip, Download PNG, and Copy link actions.

Acceptance criteria:

- Repeated clicks or network retries return the same job.
- Refreshing or closing the tab does not cancel generation.
- Generation cost is never incurred before server-side authentication and ownership checks.
- Ownership is checked again immediately before the provider call.
- Exact normalized traits in the final card match the stored chain snapshot.
- Provider output cannot alter the visible trait text.

### 7.4 Transfer behavior

- Completed visualization belongs to `(chain, contract, token ID, style)`, not permanently to the wallet that requested it.
- A later owner sees the existing visualization and cannot create a duplicate canonical render in the same style.
- `requested_by_wallet` remains in the audit record and is shown publicly only in abbreviated form, e.g. `0x12ab…90ef`.
- If a transfer occurs while queued, the pre-provider ownership check fails the job as `ownership_changed` without incurring generation cost.
- If a transfer occurs after the provider call begins, finish and attach the visualization to the token. This edge case must be stated in product terms.

## 8. Screen Specifications

### 8.1 Home `/`

Purpose: establish the concept in one screen and direct holders toward the core action.

Desktop composition:

- Top navigation on the dark field.
- Hero occupies roughly 70–85% of the first viewport.
- Left column: eyebrow `ON-CHAIN BESTIARY`, H1, one-sentence explanation, primary wallet CTA, secondary Explore link.
- Right column: one large, slightly rotated card specimen with a second card edge behind it. Keep rotation under 2 degrees so the UI stays disciplined.
- A subtle red grid or map-line field may sit behind the specimen at very low opacity.
- Below the fold: three terse process steps—`CONNECT`, `CHOOSE`, `MANIFEST`—then six latest cards.

Suggested copy:

- Eyebrow: `MONSTERS // ETHEREUM MAINNET`
- H1: `THE CHAIN WROTE THE MONSTER.`
- Supporting line: `Reveal the creature hidden inside your on-chain traits.`
- Primary CTA disconnected: `CONNECT WALLET`
- Primary CTA connected with holdings: `VIEW MY MONSTERS`
- Secondary CTA: `ENTER THE BESTIARY`

Mobile:

- Card specimen follows the copy instead of sitting beside it.
- Hero card is no wider than `min(82vw, 360px)`.
- Keep primary action visible without horizontal scrolling.

### 8.2 My Monsters `/collection`

Header:

- Title `MY MONSTERS`.
- Connected address/ENS and count, e.g. `0x12ab…90ef // 3 SHEETS`.
- Refresh control with last-read timestamp.

Grid cards have four states:

- `READY TO REVEAL`: original sheet thumbnail plus primary action.
- `QUEUED`: original thumbnail plus queue glyph and status.
- `MANIFESTING`: animated generation state and elapsed time, without a fake percentage.
- `REVEALED`: final card thumbnail and link.
- `FAILED`: original thumbnail, concise error, and retry if allowed.

Do not put all traits on collection thumbnails. Show monster name, sheet number, and status. Preserve visual rhythm.

Empty states:

- Disconnected: `CONNECT A WALLET TO READ YOUR SHEETS.`
- Connected, zero holdings: `NO MONSTERS FOUND IN THIS WALLET.` plus Explore and collection marketplace links.
- RPC unavailable: `THE CHAIN COULD NOT BE READ.` plus Retry; never reuse the zero-holdings copy.

### 8.3 Monster detail `/monsters/[tokenId]`

Desktop uses a two-column layout:

- Left: large interactive card, sticky while the right column content is in view.
- Right: status, exact name, sheet number, semantic trait list, provenance, and available actions.

Before generation:

- Original token sheet is the main card face.
- Eligible holder sees `MANIFEST MONSTER`.
- Non-owner sees `UNREVEALED` and can inspect traits but not generate.
- Existing visualization always wins over current ownership and is public.

During generation:

- Keep the original visible behind a scan/reconstruction treatment.
- Show truthful stages only: `QUEUED`, `READING TRAITS`, `GENERATING CREATURE`, `ASSEMBLING CARD`, `ARCHIVING`.
- These are job states/checkpoints, not simulated timers.
- Copy: `THIS MAY TAKE UP TO TWO MINUTES. YOU MAY LEAVE THIS PAGE.`

After generation:

- Illustrated front is default.
- `VIEW ORIGINAL` flips to the raw on-chain sheet inside the same outer card footprint.
- Controls: `VIEW ORIGINAL`, `DOWNLOAD PNG`, `COPY LINK`.
- External links: Etherscan token/contract context and OpenSea collection/item when a stable item URL is available.
- Web-only provenance disclosure: model label, style name/version, generation timestamp, and abbreviated requester address. Do not place the AI-generation disclosure on the downloadable PNG.

Card interaction:

- Entire card is not a button. Use a visible flip control and optionally allow card click as a redundant pointer shortcut.
- Keyboard: Enter/Space on the flip control.
- Maintain front/back state in the URL query (`?side=original`) only if shareable back links are desired; otherwise local component state is sufficient.
- Announce side changes in an `aria-live="polite"` region.

### 8.4 Explore `/explore`

Header: `THE BESTIARY` and a live completed-card count.

MVP controls:

- Sort: newest revealed, oldest revealed, sheet number ascending.
- Search by exact sheet number or monster-name substring.
- Style filter should exist in the URL/data contract but remain hidden while only one style is public.

Grid:

- 4 columns at wide desktop, 3 at laptop, 2 at tablet, 1 or 2 on phone depending on the tested minimum card width.
- Card ratio is fixed to prevent layout shift.
- Use cursor pagination; 24 results per page/request is the initial default.
- Thumbnails use optimized WebP/AVIF delivery where the image layer supports it.
- No autoplay animation on every card. Hover may increase red edge glow and lift by 2px.

Empty search: `NO SHEETS MATCH THAT QUERY.` with a reset action.

### 8.5 About `/about`

Keep this concise:

- What Monsters are.
- What is on-chain versus generated off-chain.
- How the app reads traits.
- Contract address and verified source link.
- That the visualization does not modify or mint the original NFT.
- Generation/model disclosure on the web experience.
- Links to the original collection and project resources.
- `Built By RaidGuild` credit and link.

## 9. Brand and Visual Style

This section is a **working art direction and explicit review gate**. It should be refined before high-fidelity implementation, while the token structure below can be used for an initial prototype.

### 9.1 Creative direction: “The Ember Archive”

The supplied references combine early computer graphics, dungeon bestiaries, photocopied field manuals, and occult instrumentation. The interface should feel unearthed rather than nostalgic for nostalgia's sake.

Core attributes:

- Severe, mysterious, tactile.
- Technical enough to feel on-chain; mythic enough to feel alive.
- Low-color, high-contrast, line-driven.
- Carefully typeset despite the distressed surface.
- Dense on cards; spacious in application chrome.

Avoid:

- Purple/blue Web3 gradients.
- Neon cyberpunk rainbows.
- Parchment, leather, rivets, beveled fantasy panels, or faux-medieval UI.
- Cartoon RPG inventory styling.
- Rounded SaaS cards, pill overload, glassmorphism, and default shadcn radii.
- Heavy glitch animation that makes content difficult to read.
- Using red for paragraphs of small body copy.

### 9.2 Visual reference reading

`monster-card-2.jpg` contributes:

- A disciplined 2:3 collectible-card silhouette.
- Double ember border and clipped/pixel-notched corners.
- Large centered uppercase monster name.
- A framed monochrome creature plate.
- Bone labels, red values, small pictographic trait markers.
- Fine horizontal scan texture and slightly imperfect print registration.
- Sheet number as an archival index.

`more-cards.png` contributes:

- Dense layout and mood exploration for future Map/story generation surfaces.
- Diagrammatic branches connecting traits.
- A possible narrative back/card mode for later Monster + Map stories.
- Brighter signal red and bolder interior geometry.

The MVP should take its primary layout from `monster-card-2.jpg`; the denser treatments in `more-cards.png` are style influence only, not alternate selectable Monster card layouts. They may inform future Map/story cards.

### 9.3 Color system

Initial tokens to tune against an in-browser prototype:

```css
--color-void: #080807;
--color-ink: #0f0e0c;
--color-panel: #171310;
--color-panel-raised: #211915;
--color-ember-deep: #6f1f17;
--color-ember: #b83a25;
--color-flare: #ee4932;
--color-bone: #e4cf9c;
--color-bone-bright: #f1dfae;
--color-ash: #9c8b6d;
--color-muted: #665a49;
--color-error: #ff6247;
--color-focus: #ffd782;
--color-accent-sulfur: #c8aa43;
--color-accent-moss: #667a48;
--color-accent-teal: #4f8077;
--color-accent-bruise: #705369;
```

Usage rules:

- `void` is the page field; `ink` and `panel` establish shallow depth.
- `bone` is the primary readable foreground.
- `ember` carries borders, selected states, icons, trait values, and graphic linework.
- `flare` is scarce: primary action, active focus accents, and generation energy.
- A creature illustration may use at most one approved accent—sulfur, moss, teal, or bruise—in addition to void/ember/bone. Accent coverage should remain below roughly 15% of the illustration so the collection still reads as one system.
- Accent selection should respond to the monster's traits and environment rather than token ID randomness. The card frame and application chrome remain ember/bone/black.
- Do not use the original on-chain SVG's bright pink as a new primary brand color.
- `ash` is metadata. Do not use it below the tested contrast threshold.
- Success should not introduce bright green. Use bone plus a distinct check glyph and label. Status may not depend on color alone.
- Error can use flare/error with plain-language text and an icon.

Before locking the palette, run automated contrast checks and visual tests on low-quality displays. Body text and interactive labels must meet WCAG AA; decorative border lines need not.

### 9.4 Typography

Recommended open-font pairing:

- Display and short labels: **Silkscreen**, 400/700.
- UI, body, traits, and metadata: **IBM Plex Mono**, 400/500/600.
- Numeric fallback: IBM Plex Mono with tabular numerals.

Rules:

- Self-host pinned WOFF2 font files; do not depend on a runtime Google Fonts request.
- Use Silkscreen only for headings, buttons, short status labels, and card titles. Long paragraphs in a pixel display face become exhausting.
- Uppercase display copy with considered tracking; normal sentence case for explanations.
- UI body minimum: 16px desktop and mobile.
- Metadata minimum: 13px only when contrast is strong and the content is supplementary.
- Trait labels use weight/contrast, not a smaller size than their values.
- Long monster names may wrap to two lines. Never ellipsize the name on the full card.

Suggested type scale:

| Token | Desktop | Mobile | Use |
| --- | ---: | ---: | --- |
| `display-xl` | 72/0.95 | 44/1.0 | Home hero |
| `display-lg` | 48/1.0 | 34/1.05 | Page titles |
| `display-md` | 28/1.1 | 24/1.1 | Card/list headings |
| `body-lg` | 18/1.55 | 17/1.5 | Intro copy |
| `body` | 16/1.55 | 16/1.5 | Standard UI copy |
| `meta` | 13/1.4 | 13/1.4 | Timestamps/provenance |

### 9.5 Geometry and spacing

- Base spacing unit: 4px.
- Main content max-width: 1440px.
- Page gutters: 24px mobile, 40px tablet, 64px desktop.
- Default vertical section gap: 96px desktop, 64px mobile.
- UI corners: 0–4px; use square or clipped corners as the dominant geometry.
- Card corners use pixel-stepped notches implemented with `clip-path` or layered pseudo-elements.
- Borders are usually 1px for UI and visually heavier inside collectible cards.
- Use empty space around dense cards. Do not make the whole application equally dense.

### 9.6 Texture and effects

- Add a fixed, pointer-events-none noise layer at 1.5–2.5% opacity.
- Fine scanlines may appear inside generated cards and hero artwork; they should be barely visible on normal UI panels.
- Use CSS gradients/noise or a tiny locally hosted tile; avoid loading large texture images.
- Primary card shadow: black occlusion plus a restrained ember edge glow, not a soft floating SaaS shadow.
- Minor print misregistration may offset a decorative red line by 1px. Never offset live text.
- Keep background patterns below 6% opacity.

### 9.7 Iconography

Create a small 16×16 or 20×20 pixel icon set for:

- Size.
- Alignment.
- Actions.
- Special ability.
- Weakness.
- Locomotion.
- Language/tongues.
- Sheet/token number.
- Original on-chain data.

Icons should be single-color SVGs drawn on an integer grid. The card may alternate bone and ember icons as in the reference. Use Lucide only for generic utility actions outside the branded card (copy, external link, refresh) and tune its stroke width to the rest of the UI.

### 9.8 Motion

- Standard UI transition: 120–180ms.
- Card hover: 180ms, translateY(-2px), slight ember-border lift.
- Card flip: 420–520ms with real front/back faces and preserved perspective.
- Generation motif: a scanning line, progressive pixel reveal, or tracing contour. It must represent activity without implying a percent complete.
- Respect `prefers-reduced-motion`: replace flip with an immediate side swap/crossfade and remove scanning motion.
- No flicker, random jitter, or continuous page-wide glitching.

### 9.9 Voice and microcopy

Voice is terse, confident, and archival. Fantasy language should flavor actions, not obscure meaning.

Preferred terms:

- `Manifest` for the primary product action and CTA.
- `Reveal` for occasional campaign or descriptive copy.
- `Manifesting` for the generation state, paired with a plain-language explanation.
- `Sheet #2630` for the NFT index.
- `Original on-chain sheet` for the reverse.
- `Bestiary` for Explore.

Do not call a wallet signature a transaction. Do not claim art is stored on-chain. Do not say a job is “almost done” unless the worker has reached a defined final stage.

### 9.10 Component styling

- Buttons: rectangular, 44px minimum hit height, 1px ember border. Primary is flare/ember fill with ink text; secondary is transparent with bone text.
- Inputs: panel background, square corners, bone text, visible focus ring in `focus` token.
- Dialogs: near-black full-border panels with a simple title bar. Wallet provider dialog may retain RainbowKit behavior but must use a matching custom theme.
- Toasts: use only for transient confirmation such as copied links. Durable job state belongs in-page.
- Skeletons: dark panels with a subtle left-to-right ember trace; static under reduced motion.
- Badges: compact rectangles, not pills. Always include text.

## 10. The Collectible Card System

### 10.1 Final artifact

- Canonical front render: 1024×1536 (2:3 portrait).
- Canonical lossless archival output: PNG.
- Delivery output: WebP at approximately 82–88 quality, adjusted after visual testing.
- Gallery thumbnail: 512×768 WebP.
- Social preview: 1200×630 composition generated from the canonical card, not a stretched card.
- Keep illustration source separately from composed card so typography/layout can be rerendered without another provider charge.

### 10.2 Front layout

Reference coordinate system: 1024×1536.

- Outer safe area: 32px.
- Pixel-notched outer frame: x=32, y=32, w=960, h=1472.
- Inner frame inset: 16px.
- Title region: x=76, y=76, w=872, approximate h=150.
- Creature plate: x=76, y=238, w=872, h=620.
- Trait region: x=76, y=900, w=872, h up to 492.
- Sheet number baseline: near y=1450, right aligned.

These coordinates are a starting grid. Final values require a design prototype with the longest real names and trait values in the collection.

Title fitting:

- Uppercase visual treatment without mutating the stored display name.
- Maximum two lines.
- Deterministic font-size steps rather than arbitrary browser shrinking.
- If a name still exceeds bounds at the minimum size, tighten tracking modestly before allowing a third line.

Trait fitting:

- Exact order: Size, Alignment, Actions, Special Ability, Weakness, Locomotion, Language.
- Show all available fields; `Actions` and `Language` may wrap.
- Use hanging indents so wrapped values align with the value start.
- The reference omits locomotion in one sample composition; the MVP card must include it because it exists on-chain.
- Never truncate exact values in the canonical card.
- Use deterministic layout tests against every minted token's trait lengths before launch.

### 10.3 Original/reverse

- Preserve the original decoded SVG returned by `tokenURI` as the canonical source.
- Display it in an `<img>` or server-rasterized safe image surface, never by injecting raw SVG markup into application HTML.
- Place it within a styled reverse that labels it `ORIGINAL ON-CHAIN SHEET` and preserves the Sheet number.
- Also render normalized traits as HTML adjacent to/below the card for accessibility and copyability.
- The reverse is an app interaction, not necessarily a second downloadable 1024×1536 asset in MVP.

### 10.4 Card rendering implementation

Recommended pipeline:

1. Build the card frame and exact text as a local SVG template.
2. Embed self-hosted fonts and custom trait icon SVG paths.
3. Place the generated illustration inside a clipped image window.
4. Render the SVG to canonical PNG with `sharp`/libvips in the worker.
5. Derive WebP thumbnail and delivery sizes from the canonical render.
6. Snapshot-test the SVG and image dimensions.

Do not use DOM screenshots for canonical rendering. They are harder to reproduce across runtime/font changes.

## 11. On-Chain Data Integration

### 11.1 Contract facts

- Network: Ethereum mainnet, chain ID `1`.
- Contract implements ERC-721 Enumerable.
- `balanceOf(owner)` returns the wallet's count.
- `tokenOfOwnerByIndex(owner, index)` enumerates owned token IDs.
- `tokenURI(tokenId)` returns a base64 `data:application/json` URI.
- The JSON `image` is a base64 `data:image/svg+xml` URI.
- The SVG contains the generated monster name and seven labeled trait lines.
- The JSON name (`Sheet #N`) is not the monster's generated name; the first SVG `<text>` node is.

The verified source and current token overview are available on [Etherscan](https://etherscan.io/token/0xecb9b2ea457740fbde58c758e4c574834224413e).

### 11.2 Minimal ABI

```ts
export const monstersAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenOfOwnerByIndex",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "uri", type: "string" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "owner", type: "address" }],
  },
] as const;
```

Use viem server-side with the project's Alchemy Ethereum RPC. Batch enumerable/tokenURI reads with multicall in chunks; viem documents that multicall batches multiple contract reads into one call. Do not expose the Alchemy key in browser code.

### 11.3 Metadata normalization

Normalized type:

```ts
type MonsterTraits = {
  tokenId: string;
  sheetName: string;
  monsterName: string;
  size: string;
  alignment: string;
  actions: [string, string] | string[];
  specialAbility: string;
  weakness: string;
  locomotion: string;
  languages: string[];
  rawLines: string[];
};
```

Parser requirements:

- Accept the known base64 JSON data URI format.
- Enforce an upper decoded-size bound before allocation.
- Validate the JSON shape with zod.
- Decode the SVG and parse XML with external entities/network access disabled.
- Extract `<text>` contents in document order.
- Validate expected labels instead of trusting fixed indexes alone.
- Split Actions and Language only on the delimiter used by the contract output.
- Preserve original line strings in `rawLines`.
- Reject missing, duplicate, or unrecognized required fields as `invalid_onchain_metadata`.
- Store a hash of the raw token URI and the normalized trait snapshot used for generation.

Because the contract is fixed and verified, do not build a general remote NFT metadata fetcher in MVP. Future IPFS/HTTP support must include SSRF, MIME, timeout, and size protections.

### 11.4 Caching

- Token traits are deterministic for this contract; cache normalized token metadata indefinitely keyed by contract + token ID + raw URI hash.
- Wallet ownership is mutable; cache holdings for no more than 15–30 seconds and provide manual refresh.
- Always bypass ownership cache for generation authorization and the worker's pre-provider check.
- Completed public visualization records may use normal CDN/ISR caching with targeted invalidation on completion/hide.

## 12. Authentication and Authorization

RainbowKit wallet connection remains client-side and is sufficient for browsing, reading holdings, and selecting a monster. It is not sufficient by itself to authorize the server to spend the project's image-generation budget: an attacker could otherwise call the generation endpoint with any holder's public address.

Do not force a full login when the wallet connects. Use a just-in-time, lightweight Sign-In with Ethereum challenge only after the holder presses `MANIFEST MONSTER`. This produces one normal free wallet-signature prompt, not an on-chain transaction. RainbowKit provides first-class SIWE support, so the standardized message is preferable to inventing a custom nonce/signature format.

This does **not** require user profiles, passwords, social login, or a persistent users table. A nonce endpoint, signature verification, and a short signed session cookie are sufficient. NextAuth may be used if it reduces implementation risk, but it is not a product requirement.

### Just-in-time SIWE flow

1. Client requests a single-use nonce.
2. Client constructs a domain-bound SIWE message containing URI, chain ID, nonce, issued-at, and expiration.
3. User signs the message in the connected wallet; no gas transaction is sent.
4. Server verifies signature/message fields and issues a signed, `HttpOnly`, `Secure`, `SameSite=Lax` session cookie.
5. Session is bound to the wallet address and expires after 24 hours initially.
6. Nonce is consumed once and expires quickly.
7. Disconnect clears local wallet state; explicit sign-out or wallet-account change clears the server session.

Use RainbowKit's authentication adapter or a small audited SIWE integration. MVP support is limited to EOAs that can complete the normal RainbowKit message-signing flow; EIP-1271 smart-contract-wallet support is not a launch requirement.

### Generation authorization

`POST /api/generations` must verify all of the following server-side:

- Valid SIWE session.
- Session address matches the submitted/connected address; preferably do not accept an address in the body at all.
- Requested chain/contract equal the server's allowlisted values.
- Token exists.
- `ownerOf(tokenId)` equals the session wallet at a fresh block.
- Requested style is active and public.
- No canonical completed visualization or active job already exists for token + style.
- Wallet and IP rate limits are not exceeded.
- Idempotency key is valid and within length limits.

Server-side authentication and fresh `ownerOf` verification apply only to the paid mutation. They do not prevent the connected client from using RainbowKit/wagmi normally for wallet UX.

## 13. Image Generation and Composition

### 13.1 Provider recommendation

Use OpenAI's Image API with `gpt-image-2` as the initial provider/model behind an internal adapter. It currently supports reference-image editing, common portrait/landscape sizes, configurable quality, and base64 image output. Complex generations can take up to two minutes, which is why generation belongs in a durable worker rather than a request tied to the page.

Initial generation settings:

```ts
{
  provider: "openai",
  model: "gpt-image-2",
  endpoint: "images.edits",
  size: "1536x1024",
  quality: "medium",
  output_format: "webp",
  output_compression: 90,
  n: 1
}
```

Use the supplied artwork as style references for the edit/reference workflow. Prepare reference assets deliberately:

- A crop emphasizing the creature plate from `monster-card-2.jpg`.
- One crop from `more-cards.png` emphasizing line weight and iconographic geometry.
- Avoid over-weighting reference text/layout because the model is not responsible for the final card typography.
- Store reference asset hashes in the style version.

OpenAI's current docs call `gpt-image-2` the latest GPT Image model, state that single-prompt generation/editing is suited to the Image API, and note remaining text-rendering/consistency limitations. The hybrid illustration + deterministic composition approach is therefore a core quality requirement, not an optimization. See the [image generation guide](https://developers.openai.com/api/docs/guides/image-generation).

### 13.2 Prompt contract

Prompts are server-owned and immutable once a version has produced a public card.

Prompt structure:

```text
TASK
Create a single monster illustration for the art window of a collectible field-dossier card.

MONSTER
Name: {{monsterName}}
Size: {{size}}
Alignment: {{alignment}}
Actions: {{actions}}
Special ability: {{specialAbility}}
Weakness: {{weakness}}
Locomotion: {{locomotion}}
Languages: {{languages}}

ART DIRECTION
- Early computer bestiary illustration rendered with chunky pixel/ASCII-like marks.
- Near-black background, ember-red primary linework, sparse bone highlights.
- At most one limited accent color chosen from the approved sulfur, moss, teal, or bruise palette when the traits justify it.
- Strong readable silhouette, side or three-quarter creature view.
- Restrained horizontal CRT texture and imperfect print texture.
- Match the supplied references for palette, line weight, density, and ominous tone.
- Use physical features and pose to express the traits; do not add a UI or card frame.
- Let alignment materially influence posture, expression, contrast, and lighting without reducing it to a halo/devil-horn cliché.
- Dark fantasy horror, gore, strange anatomy, and body-horror detail are allowed when they serve this creature.

COMPOSITION
- One complete creature centered in a landscape frame.
- One primary creature only; atmospheric and environmental effects are allowed.
- Keep extremities inside the safe area.
- Leave breathing room around the silhouette.
- No foreground border; no title block; no trait list.

HARD CONSTRAINTS
- No text, letters, numbers, symbols that resemble writing, logos, signatures, or watermarks.
- No gradients outside subtle texture; no blue/purple cyberpunk palette.
- No glossy 3D render, anime, cute mascot, painterly fantasy concept art, or photorealism.
```

Trait-to-visual guidance should remain interpretive, not a rigid lookup table. Resolve abstract or competing traits with this priority:

1. Name/type/location establish anatomy, habitat, and overall silhouette.
2. Size and locomotion establish scale, weight distribution, and pose.
3. Alignment materially changes demeanor, lighting direction, contrast, and spatial tension without simplistic moral symbols.
4. Choose the most visually legible Action as the primary environmental effect or active pose. Suggest the second Action through anatomy, residue, or a quieter secondary cue rather than staging two competing scenes.
5. Special Ability becomes a distinctive anatomical feature, aura, or interaction.
6. Weakness appears only as a subtle environmental counterpoint when it improves the image; it should not make the monster look already defeated.
7. Languages are lowest priority and may influence cultural texture or creature relationships, but must never introduce written glyphs or stereotypes.

Gore/body horror may include blood, exposed nonhuman anatomy, wounds, mutation, and macabre environmental detail. Exclude sexualized violence, real-person likenesses, hateful imagery, and explicit torture tableaux; provider policy remains the hard outer boundary.

### 13.3 Style/version model

Each style version stores:

- Stable style slug, e.g. `ember-archive`.
- Integer version.
- Human label.
- Prompt template.
- Negative/hard constraints.
- Provider/model settings.
- Reference asset keys and SHA-256 hashes.
- Card-template version.
- Font/icon asset versions.
- Active/public flags.
- Created timestamp and operator note.

Old style versions are never edited after use. Create version `N+1`, test it, then activate it for new generations. The public “style” identity may remain `ember-archive` across prompt refinements, but each render retains its exact internal version.

### 13.4 Quality controls

Before public launch, run a curated evaluation set of at least 30 tokens covering:

- Short and very long names.
- Every size and alignment category.
- Unusual locomotion.
- Long action/special-ability strings.
- Humanoid, animal-like, amorphous, tiny, and colossal implied forms.
- Light and dark weakness/action combinations.

Score each output on:

- Trait expression.
- Silhouette clarity at thumbnail size.
- Palette/style adherence.
- Absence of text/gibberish.
- Absence of unintended card borders/UI.
- Creature contained in safe crop.
- Collection-level coherence without identical compositions.

Successful results publish automatically without human approval. MVP operator scripts must support hiding a failed-quality render and granting **one** quality replacement when the result clearly violates the prompt/layout criteria. This exception is not a user-selectable reroll: the original is retained in the audit trail, marked quarantined/superseded when the replacement succeeds, and cannot consume more than one additional provider generation for the token/style.

### 13.5 Cost guardrails

As of this spec date, OpenAI lists a 1536×1024 medium `gpt-image-2` output at approximately **$0.041 plus input token costs**. Prices and model availability can change; confirm immediately before implementation and launch.

Guardrails:

- One active/canonical job per token + style.
- Idempotency on create.
- Per-wallet and per-IP quotas.
- Conservative daily global job/spend ceiling configured before launch, plus a `GENERATION_ENABLED` kill switch. Start with a low cap and raise it only after observing real holder usage.
- Emit structured warning/error logs when failure rate, queue age, or spend approaches its threshold. No external paging integration is required for MVP.
- No automatic provider retry after an ambiguous network timeout until request outcome is reconciled where possible.
- Maximum attempts default: 2 for clearly retryable pre-result failures, 1 for moderation/policy refusal.

## 14. Application Architecture

### 14.1 Recommended stack

- Next.js App Router with TypeScript.
- React.
- Tailwind CSS.
- shadcn/ui primitives, restyled to the brand system.
- RainbowKit for wallet connection.
- wagmi + viem for Ethereum reads and wallet state.
- SIWE-compatible authentication adapter.
- Drizzle ORM and SQL migrations.
- Existing Railway Postgres, isolated in a `monster_app` database schema if permitted.
- Separate Node.js worker service deployed on Railway from the same repository.
- Railway Storage Bucket using its S3-compatible API.
- OpenAI Node SDK behind an `ImageProvider` interface.
- `sharp` for deterministic card composition and derivatives.
- zod for environment, API, token metadata, and job payload validation.
- Vitest for unit/integration tests and Playwright for end-to-end flows.

### 14.2 Runtime topology

```text
Browser
  ├─ Next.js pages / Route Handlers
  │    ├─ SIWE session verification
  │    ├─ viem → Ethereum RPC → Monsters contract
  │    ├─ Drizzle → shared Railway Postgres / monster_app schema
  │    └─ media proxy/cache → Railway Storage Bucket
  │
  └─ polls generation state

Railway worker
  ├─ claims Postgres generation jobs with row locking
  ├─ verifies owner + reads tokenURI through Ethereum RPC
  ├─ OpenAI Image API → illustration bytes
  ├─ sharp/SVG → canonical card + derivatives
  ├─ uploads objects to Railway Storage Bucket
  └─ commits visualization/job state to Postgres
```

### 14.3 Queue design

Avoid adding Redis for MVP. Use Postgres as a durable low-throughput queue:

1. Worker starts a short transaction.
2. Select oldest queued/retryable row with `FOR UPDATE SKIP LOCKED`.
3. Mark it `running`, assign `locked_by`, `locked_at`, increment attempt count, and commit.
4. Perform external chain/provider/storage work outside the transaction.
5. Write checkpoints to the job row.
6. Commit success or structured failure.
7. A reaper moves jobs with stale locks to retry review; it does not blindly regenerate after a possible provider result.

One worker process/concurrency of 1 is the safest launch default. Raise concurrency only after rate-limit and spend behavior are observed.

### 14.4 Rendering boundaries

- Server Components: home latest gallery, Explore results, monster public detail, About.
- Client Components: wallet connection, collection refresh state, flip interaction, copy/download controls, job polling.
- Route Handlers: auth, wallet holdings, generation create/status, public search, media delivery.
- Worker: all provider calls and canonical file rendering.

## 15. Data Model

Use the Postgres schema `monster_app` if the shared Railway database user has permission. Otherwise prefix every table with `monster_` and keep a dedicated Drizzle migration journal.

### 15.1 `style_versions`

```sql
create table monster_app.style_versions (
  id uuid primary key,
  style_slug text not null,
  version integer not null,
  label text not null,
  prompt_template text not null,
  constraints_json jsonb not null default '{}'::jsonb,
  provider text not null,
  model text not null,
  provider_config_json jsonb not null default '{}'::jsonb,
  reference_assets_json jsonb not null default '[]'::jsonb,
  card_template_version text not null,
  is_active boolean not null default false,
  is_public boolean not null default false,
  operator_note text,
  created_at timestamptz not null default now(),
  unique (style_slug, version),
  unique (style_slug, id)
);
```

Enforce only one active version per style with a partial unique index.

### 15.2 `token_snapshots`

```sql
create table monster_app.token_snapshots (
  id uuid primary key,
  chain_id integer not null,
  contract_address text not null,
  token_id numeric(78, 0) not null,
  token_uri_hash text not null,
  raw_token_uri text not null,
  raw_svg text not null,
  sheet_name text not null,
  monster_name text not null,
  traits_json jsonb not null,
  read_block_number numeric(78, 0),
  created_at timestamptz not null default now(),
  unique (chain_id, contract_address, token_id, token_uri_hash)
);
```

Normalize `contract_address` to lowercase for storage and compare addresses with proper Ethereum address parsing.

### 15.3 `generation_jobs`

```sql
create table monster_app.generation_jobs (
  id uuid primary key,
  chain_id integer not null,
  contract_address text not null,
  token_id numeric(78, 0) not null,
  style_slug text not null,
  style_version_id uuid not null,
  requested_by_wallet text not null,
  idempotency_key text not null,
  job_kind text not null default 'initial',
  replacement_for_visualization_id uuid,
  status text not null,
  checkpoint text,
  attempt_count integer not null default 0,
  max_attempts integer not null default 2,
  locked_by text,
  locked_at timestamptz,
  provider_request_id text,
  resolved_prompt text,
  resolved_prompt_hash text,
  token_snapshot_id uuid references monster_app.token_snapshots(id),
  error_code text,
  error_message_safe text,
  error_detail_private text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (requested_by_wallet, idempotency_key),
  foreign key (style_slug, style_version_id)
    references monster_app.style_versions(style_slug, id)
);
```

Add a partial unique index preventing more than one `queued` or `running` job for `(chain_id, contract_address, token_id, style_slug)`. The slug is the user-visible style identity; `style_version_id` records the immutable implementation version selected for that job. Activating prompt version `N+1` must not make an already visualized token eligible for a second canonical render of the same style.

`job_kind` is `initial` or `quality_replacement`. A replacement requires an operator-issued authorization tied to `replacement_for_visualization_id`, and the service must verify that no prior quality replacement has been used for that token/style. Add the foreign key to `visualizations(id)` after both tables exist in the migration.

Statuses:

```ts
type GenerationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed_retryable"
  | "failed_terminal"
  | "cancelled";
```

Checkpoints:

```ts
type GenerationCheckpoint =
  | "verifying_ownership"
  | "reading_traits"
  | "generating_illustration"
  | "assembling_card"
  | "uploading_assets"
  | "publishing";
```

### 15.4 `visualizations`

```sql
create table monster_app.visualizations (
  id uuid primary key,
  chain_id integer not null,
  contract_address text not null,
  token_id numeric(78, 0) not null,
  style_slug text not null,
  style_version_id uuid not null,
  generation_job_id uuid not null unique references monster_app.generation_jobs(id),
  token_snapshot_id uuid not null references monster_app.token_snapshots(id),
  illustration_object_key text not null,
  card_png_object_key text not null,
  card_webp_object_key text not null,
  thumbnail_object_key text not null,
  social_object_key text,
  width integer not null,
  height integer not null,
  content_hash text not null,
  is_canonical boolean not null default true,
  visibility text not null default 'public',
  hidden_reason text,
  superseded_at timestamptz,
  superseded_by_id uuid references monster_app.visualizations(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (style_slug, style_version_id)
    references monster_app.style_versions(style_slug, id)
);
```

Add a partial unique index on `(chain_id, contract_address, token_id, style_slug) where is_canonical = true`. This allows an audited failed-quality artifact and its one approved replacement to coexist while guaranteeing one canonical result.

Visibility values: `public`, `hidden`, `quarantined`. Never hard-delete media from routine operator actions; hiding should be reversible. When a quality replacement succeeds, update the former record to `is_canonical = false`, `visibility = 'quarantined'`, and set the supersession fields in the same transaction that publishes the replacement as canonical.

### 15.5 Auth/rate-limit data

Depending on the chosen SIWE/session library, add:

- Single-use nonce storage with expiration/consumed timestamp.
- Optional session revocation table.
- Rate-limit counters keyed by hashed IP and normalized wallet.

Do not store full IP addresses longer than operationally necessary. Document retention before launch.

## 16. API Contract

All JSON responses use a consistent envelope:

```json
{
  "data": {},
  "error": null
}
```

Errors:

```json
{
  "data": null,
  "error": {
    "code": "ownership_required",
    "message": "This wallet no longer owns Sheet #2630.",
    "requestId": "req_..."
  }
}
```

Never return provider prompts, internal stack traces, RPC URLs, object-storage credentials, or private error detail to the client.

### `GET /api/auth/nonce`

- Creates a short-lived, single-use nonce.
- Response is not cacheable.

### `POST /api/auth/verify`

Body contains SIWE message and signature. On success, sets session cookie and returns normalized wallet address plus expiration.

### `POST /api/auth/logout`

Clears/revokes session.

### `GET /api/wallets/[address]/monsters`

Public read; validates address.

Response:

```json
{
  "data": {
    "address": "0x...",
    "chainId": 1,
    "readAt": "2026-08-14T18:00:00.000Z",
    "tokens": [
      {
        "tokenId": "2630",
        "sheetName": "Sheet #2630",
        "monsterName": "Manticore The Monstrosity of The Sea",
        "traits": {},
        "originalImageUrl": "/api/monsters/2630/original.svg",
        "visualization": null,
        "job": null
      }
    ]
  },
  "error": null
}
```

Cache privately/briefly. Never equate RPC error with an empty token array.

### `GET /api/monsters/[tokenId]`

Returns normalized public token data plus public visualization/job summary. A queued job requested by another wallet may expose only a generic in-progress state, not requester identity.

### `GET /api/monsters/[tokenId]/original.svg`

- Serves the decoded known-contract SVG with explicit `Content-Type: image/svg+xml` and restrictive content security headers.
- Prefer a server-rasterized PNG route if browser/security testing reveals unsafe behavior.
- Never accept an arbitrary contract or upstream URL in this route.

### `POST /api/generations`

Requires SIWE session.

Headers:

```http
Idempotency-Key: <uuid>
Content-Type: application/json
```

Body:

```json
{
  "tokenId": "2630",
  "style": "ember-archive"
}
```

Responses:

- `202` newly queued or existing active job.
- `200` canonical visualization already exists.
- `401` no/invalid session.
- `403` wallet does not own token.
- `409` policy conflict such as style unavailable, canonical visualization already present, replacement already consumed, or terminal job requiring operator review.
- `429` rate/spend limit.
- `503` global generation kill switch/provider temporarily unavailable.

### `GET /api/generations/[jobId]`

Returns public-safe state for the signed-in requester. Client polling schedule: 2 seconds for first 20 seconds, 5 seconds thereafter, stop on terminal state or page background where appropriate.

### `GET /api/explore`

Query:

- `cursor`
- `limit` maximum 48, default 24.
- `sort=newest|oldest|token_asc`
- `q`
- `style` reserved.

Returns only `public` completed visualizations and a next cursor.

### `GET /media/[visualizationId]/[variant]`

- Allowlisted variants: `card.png`, `card.webp`, `thumb.webp`, `social.webp`.
- Resolves object key from the database; never treats route input as a raw bucket key.
- Public immutable variants get `Cache-Control: public, max-age=31536000, immutable` because a new render/version receives a new visualization URL.
- Hidden/quarantined records return `404` publicly.
- `DOWNLOAD PNG` always resolves the canonical public `card.png`; WebP remains an internal delivery optimization rather than a second user-facing download option.

## 17. Storage Design

Use a Railway Storage Bucket for MVP because it is durable, S3-compatible, and colocated with the Railway project. Railway buckets are private, so public delivery should use the application media route or a later CDN layer. Railway documents presigned URLs and backend proxying as supported access patterns: [Railway Storage Buckets](https://docs.railway.com/storage-buckets).

Object key pattern:

```text
monsters/
  chain-1/
    0xecb9...413e/
      token-2630/
        ember-archive/v1/
          <visualization-uuid>/
            illustration.webp
            card.png
            card.webp
            thumb.webp
            social.webp
```

Rules:

- Keys are immutable after a visualization is published.
- Store content hashes and verify upload byte counts.
- Database commit to `succeeded` happens only after every required object upload succeeds.
- Orphan cleanup may delete objects for jobs never published after a retention window, but must run in report/dry-run mode first.
- Set lifecycle/backup policies explicitly; do not assume the shared database backup covers object storage.
- Do not add IPFS pinning or CID fields in MVP. Revisit durable public metadata/art storage only if the derivative-mint path proceeds.

### MVP retention defaults

Use these conservative defaults unless Railway/provider policy requires a shorter period:

- Successful canonical/superseded visualization files, trait snapshots, prompt version/hash, and provenance: retain indefinitely.
- Quarantined quality-failure artifacts: retain indefinitely for audit until a deliberate deletion policy is approved.
- Failed-job private error detail and resolved prompts: 30 days; retain safe error code and aggregate timing indefinitely.
- Unpublished orphan objects: eligible for cleanup after 7 days, beginning with a dry-run report.
- Application/worker logs: 30 days.
- Hashed IP rate-limit records: 7 days.
- Consumed/expired SIWE nonces: purge after 24 hours.
- Session lifetime: 24 hours; do not persist the wallet signature after successful verification.

## 18. Error and Edge States

| Code/state | User-facing behavior | Retry policy |
| --- | --- | --- |
| `rpc_unavailable` | “The chain could not be read.” | Manual/automatic read retry |
| `wallet_empty` | Designed zero-holdings state | No error retry |
| `wrong_network` | Explain Ethereum mainnet; reads can still use server RPC | Prompt switch only if required for signing flow |
| `signature_rejected` | “Signature cancelled. No transaction was sent.” | User may retry |
| `session_expired` | Re-authenticate, preserve intended token | User may retry |
| `ownership_required` | Wallet no longer owns this sheet | Terminal for that wallet |
| `already_visualized` | Route to canonical completed card | No regeneration |
| `already_queued` | Resume existing job page/state | No duplicate job |
| `moderation_blocked` | Neutral provider-safe message | Terminal unless operator reviews prompt |
| `provider_rate_limited` | Keep/requeue with bounded backoff | Retryable |
| `provider_timeout_unknown` | “Generation outcome is being reconciled.” | Operator/reconciliation, not blind retry |
| `composition_failed` | Illustration retained; card assembly retry | Retry worker without provider call |
| `storage_failed` | Generated bytes retained only if durable temp strategy exists | Retry upload/composition, not provider call |
| `invalid_onchain_metadata` | Original remains viewable; generation disabled | Operator investigation |
| `hidden_visualization` | Public 404; owner sees unavailable notice if policy allows | Operator reversible |

Separate provider generation, composition, and upload checkpoints so downstream retries do not pay for a second illustration.

## 19. Accessibility

- Target WCAG 2.2 AA for application UI.
- Every visual trait is also rendered as semantic text.
- Card flip has a labeled button, keyboard support, and screen-reader state.
- Focus order follows visible layout; focus ring is always visible on keyboard navigation.
- Minimum interactive target is 44×44 CSS pixels.
- Status does not rely on red/bone color alone.
- Scanlines/noise may not reduce body-text legibility.
- Generated illustration receives alt text derived from exact traits without claiming unverified visual details, e.g. `AI visualization of Sheet #2630, Manticore The Monstrosity of The Sea.`
- Original SVG has equivalent normalized trait text.
- Respect reduced motion for card flip, hover lift, skeletons, and generation scans.
- Test 200% zoom, high-contrast mode, keyboard-only flow, VoiceOver/Safari, and NVDA/Firefox or Chrome.

## 20. Performance and Reliability

Initial targets:

- Public page LCP under 2.5 seconds at p75 on a representative mobile connection, excluding uncached third-party wallet modal assets.
- CLS below 0.1 by reserving card aspect ratios.
- Public API p95 under 500ms for cached Explore/detail reads.
- Wallet holdings p95 under 4 seconds for typical wallets; expose progressive loading for larger balances.
- Generation job success above 95% excluding moderation/ownership failures.
- Worker recovery after restart without lost queued jobs.

Implementation notes:

- Use image derivatives rather than shipping the 1024×1536 PNG into gallery cards.
- Lazy-load below-fold cards and the RainbowKit modal bundle where practical.
- Preload only essential fonts; subset display font if licensing/tooling allow.
- Do not inline large original data URIs in page HTML.
- Use a database index aligned to Explore cursor ordering and visibility filters.
- Use structured logs with `request_id`, `job_id`, `token_id`, checkpoint, duration, and provider request ID.
- Add health endpoints for web, database connectivity, and worker liveness; provider health belongs in diagnostics, not the basic liveness probe.

## 21. Security and Privacy

- Keep `OPENAI_API_KEY`, RPC credentials, bucket credentials, session secrets, and admin credentials server-only.
- Validate every environment variable at process startup.
- Use strict CSP, `frame-ancestors`, `nosniff`, referrer policy, and secure cookies.
- Do not inject decoded SVG or any on-chain strings with `dangerouslySetInnerHTML`.
- Escape all trait values in SVG template generation.
- Restrict media route variants and derive bucket keys from database records.
- Rate-limit nonce, auth verify, holdings, generation create, and job polling endpoints separately.
- Bind SIWE to the production domain/URI and validate nonce/expiration/chain.
- Do not trust a client claim of token ownership.
- Hash IPs used for abuse controls with a rotating secret; set a retention window.
- Do not log signatures, session cookies, full provider payloads containing credentials, or bucket presigned URLs.
- Run dependency and secret scanning in CI.
- Back up the shared DB before the first migration and verify schema isolation.
- The project confirms rights to use the supplied reference artwork. Publish concise generated-image usage terms and privacy copy before launch.

## 22. Testing and QA

### Unit tests

- Data URI and base64 decoding.
- SVG text extraction and label validation.
- Action/language splitting.
- Ethereum address and token ID normalization.
- Prompt interpolation/escaping and prompt hash stability.
- Title/trait layout fitting helpers.
- Job state transition rules.
- Idempotency and retry classification.
- Media key construction.

### Contract integration tests

- Read known token from Ethereum mainnet through configured RPC in a non-CI smoke suite.
- Fixture-based tests use captured tokenURI strings so CI does not depend on mainnet.
- Wallet with zero, one, and multiple tokens.
- Multicall chunking and partial RPC failures.
- Ownership change between API request and worker processing.

### Rendering tests

- Snapshot canonical SVG markup.
- Assert output dimensions and MIME.
- Render fixture cards for shortest/longest names and traits.
- Pixel-diff a small approved golden set with an intentional update process.
- Verify fonts are embedded and no system-font substitution occurs.
- Verify exact trait strings appear in rendered SVG source before rasterization.

### API/integration tests

- SIWE nonce replay rejection.
- Session/address mismatch.
- Non-owner generation rejection.
- Duplicate click/idempotency behavior.
- Concurrent requests against unique indexes.
- Worker restart and stale lock handling.
- Composition/storage retry without a second provider call.
- Hidden visualization excluded from Explore/media.
- One operator-approved quality replacement supersedes the original without allowing a second replacement.
- Cursor pagination stability.

### End-to-end tests

- Browse Explore without wallet.
- Connect a test wallet and view holdings using mocked chain responses.
- Sign and request generation using mocked provider/storage.
- Refresh during generation and resume status.
- Complete, flip, copy link, and download PNG.
- Verify `DOWNLOAD PNG` returns PNG and no native share control is present.
- Signature rejection and RPC failure states.
- Mobile navigation and keyboard card controls.
- Verify the footer's supplied crossed-swords icon and `Built By RaidGuild` link on every public route.

Do not call the paid image provider in normal CI. Provide a recorded/fake `ImageProvider` implementation and a manual staging smoke command.

## 23. Deployment and Operations

### Railway services

- `monsters-web`: Next.js application.
- `monsters-worker`: Node worker from the same image/repository, separate start command.
- Existing shared Postgres service.
- New private Storage Bucket.

### Environment variables

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

DATABASE_URL=postgresql://...
SESSION_SECRET=...
SIWE_DOMAIN=...

ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/...
MONSTERS_CHAIN_ID=1
MONSTERS_CONTRACT_ADDRESS=0xecb9b2ea457740fbde58c758e4c574834224413e

OPENAI_API_KEY=...
IMAGE_PROVIDER=openai
ACTIVE_STYLE_SLUG=ember-archive
GENERATION_ENABLED=true
GENERATION_DAILY_LIMIT=...

BUCKET_ENDPOINT=...
BUCKET_REGION=...
BUCKET_NAME=...
BUCKET_ACCESS_KEY_ID=...
BUCKET_SECRET_ACCESS_KEY=...

LOG_LEVEL=info
IP_HASH_SECRET=...
```

Do not expose contract/RPC configuration as public variables unless the client genuinely needs them. The server owns canonical reads.

### Migration/release process

1. Confirm shared database backup and schema permissions.
2. Run Drizzle migrations as a one-off release step, not concurrently in every web/worker replica.
3. Seed inactive style version and reference hashes.
4. Run parser/render fixture suite.
5. Run staging generation eval with a capped budget.
6. Approve and activate the style version.
7. Deploy web with generation disabled.
8. Verify reads, auth, storage delivery, and worker health.
9. Start worker and enable generation with concurrency 1 and a low daily limit.
10. Monitor first jobs manually before raising the cap.

### Observability

No external paging/alerting service is required for MVP. Emit structured warning/error logs for:

- Worker has no heartbeat for 5 minutes while queued jobs exist.
- Oldest queued job exceeds 5 minutes.
- Running job exceeds expected maximum.
- Generation failure rate exceeds 10% over a meaningful sample.
- Daily job/spend cap reaches 80%; reject new jobs at 100%.
- Database or bucket errors persist.
- Public media 5xx rate rises.

Railway logs are the MVP operational surface. The hard daily cap and `GENERATION_ENABLED` switch provide budget protection even when nobody is actively watching logs.

## 24. Delivery Plan and Definition of Done

### Phase 0 — Decisions and visual prototype

- Resolve the remaining launch variables in Section 25.
- Build one responsive home/detail prototype with real reference art.
- Build deterministic card SVG with real traits and long-content fixtures.
- Generate/evaluate at least 30 illustration samples before committing to the provider settings.
- Confirm DB schema privileges, Railway bucket, RPC, SIWE domain, and provider account verification.

### Phase 1 — Foundation and reads

- Next.js app, theme tokens, fonts, nav, responsive shell.
- Contract ABI, RPC client, token parser, fixtures.
- Public Explore/detail queries and media abstraction.
- RainbowKit connection and collection holdings.
- Designed loading/empty/error states.

### Phase 2 — Auth and generation pipeline

- SIWE sessions.
- Generation API with ownership, idempotency, uniqueness, rate/spend limits.
- Postgres job worker and state machine.
- Image provider adapter and prompt versioning.
- Deterministic composition and bucket upload.
- Durable progress UI.

### Phase 3 — Public polish and launch

- Explore search/sort/pagination.
- Flip/original view, download, copy link, social preview.
- Accessibility and responsive QA.
- Security, load, failure-recovery, and migration rehearsal.
- About/provenance/terms copy.
- Capped production rollout.

### MVP definition of done

- A holder can connect, discover all owned Monsters tokens, sign in, and request one eligible visualization.
- Duplicate requests cannot create duplicate paid generations.
- A worker can recover across restarts and expose truthful progress.
- Final card text exactly matches normalized on-chain traits.
- Completed cards persist in object storage and database records.
- Anyone can browse/open completed public cards without a wallet.
- Card front/reverse is accessible by pointer, keyboard, and reduced-motion users.
- All named error states have deliberate UI.
- Brand tokens and key screens have design approval at mobile and desktop widths.
- Test suite covers parser, auth, job uniqueness/transitions, renderer, APIs, and primary E2E flow.
- The supplied RaidGuild footer icon/link is present and accessible on every public route.
- Secrets, backups, structured warning logs, generation cap, and kill switch are verified in production.

## 25. Decision Log and Remaining Open Questions

### Confirmed product decisions

- Product name: **Monsters** for MVP.
- One canonical manifestation per token/style; no discretionary rerolls.
- One operator-approved replacement is allowed only for a clearly failed-quality result.
- Every successful canonical result is public and publishes directly to Explore.
- The project pays for MVP generation; only a current holder may initiate it.
- The requester is displayed only as an abbreviated wallet address.
- If the token transfers after the provider call starts, finish and attach the result to the token.
- PNG download and Copy link are required; native share is not.
- Explore search is by name/sheet only; no owner or ENS filter.
- Do not show estimated project cost before confirmation.
- No historical generated results need import.

### Confirmed brand/content decisions

- “The Ember Archive” direction is approved.
- Use restrained accent colors inside illustrations while keeping application/card chrome ember/bone/black.
- Keep CRT/noise treatment subtle.
- Use Silkscreen + IBM Plex Mono.
- Prefer the warm ember palette; do not make the on-chain SVG pink a primary brand color.
- Use `The chain wrote the monster. You reveal its form.`
- Primary action: `MANIFEST`; active state: `MANIFESTING`.
- `more-cards.png` is a style/mood reference only for MVP and may influence future Map/story generations.
- The downloadable card needs its Sheet number/token ID, but no additional collection logo or AI-disclosure mark.
- Dark fantasy horror/gore is allowed within the constraints in Section 13.
- One primary creature is required; environmental effects are allowed.
- Alignment materially changes posture and lighting.
- Abstract Actions follow the visual-priority rules in Section 13 rather than being represented literally as labels or multiple competing scenes.
- The project has rights to use the supplied reference artwork.
- Footer credit: supplied crossed-swords icon plus `Built By RaidGuild`, linked to `https://www.raidguild.org/`.

### Confirmed technical/operational decisions

- Start with `gpt-image-2` and validate it with the pre-launch evaluation set.
- RainbowKit handles client-side connection. A just-in-time SIWE signature is required only for `MANIFEST` so the server can authorize project-funded generation.
- MVP wallet auth targets normal EOA message signing; EIP-1271 support is not required.
- Use the existing Railway Postgres database with full permissions and deploy web/worker/new bucket in the same Railway project.
- Use the existing Alchemy Ethereum RPC account.
- Use structured Railway logs, hard budget caps, and the kill switch; no external alerting or admin UI is required.
- Use the Section 17 retention defaults until operating experience justifies a change.
- No IPFS work is required for MVP.

### Remaining launch questions

1. What are the production and staging domains for SIWE domain binding and generated canonical URLs?
2. What exact initial limits should be configured for generations per wallet/day, total jobs/day, and monthly project spend? Recommendation: start lower than expected demand and raise after the first observed cohort.
3. Please provide the official RaidGuild crossed-swords asset, preferably as SVG; PNG is acceptable if a vector is unavailable.
4. How should a holder report a failed-quality result in MVP, and who runs the protected approval/replacement script? A simple support link/address is sufficient; no admin UI is needed.
5. What concise download/usage license should accompany generated cards? Artwork-reference rights are confirmed, but holder reuse rights still need user-facing language.
6. Confirm the Alchemy plan's production rate limits during implementation so multicall batch size and caching can be tuned.

## 26. Future Extension Hooks

### Multiple visual styles

- `style_versions` and token/style uniqueness already support more than one style.
- Reveal a style chooser only when at least two approved styles exist.
- Treat a style as a product/art package: prompt, references, frame, fonts, icons, and model settings—not just prompt text.

### Maps visualization

- Introduce a generic `source_assets` layer or parallel `map_*` tables only after the Maps contract/token format is inspected.
- Reuse wallet auth, job queue, provider adapter, versioning, storage, and public gallery patterns.
- Do not prematurely force Monsters and Maps into one trait schema.

### Monster + Map stories

- Eligibility requires verified current ownership of both token IDs at request time.
- Store both chain snapshots and both ownership checks in a composite generation record.
- The narrative card treatment in `more-cards.png` is a strong reference for this path.
- Story text must be generated and rendered as deterministic typography, just like traits; never rely on image-model text.

### Derivative visualization NFT mint

A future product state may let the current holder mint a **new derivative NFT containing the manifested artwork**. This would not modify, wrap, or burn the original Monsters NFT.

Potential flow:

1. Holder opens a completed canonical visualization.
2. App verifies current ownership of the source Monsters token.
3. `MINT MANIFESTATION` presents the target chain, gas/payment terms, metadata permanence, and derivative-transfer rules.
4. Holder submits an explicit on-chain transaction.
5. A dedicated derivative ERC-721 contract mints a token whose metadata references the canonical manifested PNG/artwork plus source provenance.
6. The web detail page displays the derivative contract/token link without implying that the original Monsters metadata changed.

Technical preparation already present in MVP:

- Immutable visualization ID, object keys, and SHA-256 content hash.
- Exact source chain, contract, token ID, trait snapshot, prompt/style version, and requester provenance.
- Canonical/superseded status so only the accepted result is mintable.
- Fresh `ownerOf` checks and wallet-signature/transaction UX patterns.

Future mint requirements:

- Use a new contract with an explicit link to the source Monsters contract and token ID.
- Enforce at most one derivative mint per source token/style unless a later product decision says otherwise.
- Only the current source-token holder may initiate minting; recheck ownership in the mint transaction/contract, not only in the web app.
- Pin artwork and metadata to an approved durable public store before mint, likely IPFS or an equivalent content-addressed system; the private Railway media proxy alone is not adequate permanent NFT metadata.
- Include image/content hash, style identifier/version, and source token reference in metadata.
- A quarantined or superseded visualization is never mintable.
- Make the wallet transaction and any gas/fee explicit; never present it as the free `MANIFEST` signature.

Future decisions before this work is scoped:

- Target chain and contract ownership/upgradability model.
- Whether mint gas is holder-paid or project-sponsored.
- Whether the derivative is freely transferable and whether it remains valid after the original transfers.
- Metadata storage/pinning provider and permanence commitment.
- Royalties, mint price, supply, and any project treasury split.
- Whether the one quality replacement remains available after a derivative has been minted. Recommendation: no replacement after mint because the minted artifact establishes the canonical result.

Any claim that a visualization is “on-chain” must wait for an actual on-chain write. IPFS-hosted artwork is content-addressed storage, not itself on-chain.

## 27. Reference Links

- [Monsters contract/token on Etherscan](https://etherscan.io/token/0xecb9b2ea457740fbde58c758e4c574834224413e)
- [Monsters collection on OpenSea](https://opensea.io/collection/monsters-7vx3cc5ojl)
- [RainbowKit documentation](https://rainbowkit.com/docs/introduction)
- [RainbowKit authentication/SIWE documentation](https://rainbowkit.com/docs/authentication)
- [viem multicall documentation](https://viem.sh/docs/contract/multicall)
- [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation)
- [Railway Storage Buckets](https://docs.railway.com/storage-buckets)
- [RaidGuild](https://www.raidguild.org/)
