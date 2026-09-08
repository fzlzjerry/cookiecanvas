# CookieCanvas design specification

## Product surface

CookieCanvas is a collaborative 16 x 16 mural whose paint events are submitted to
Cookie Chain and can be independently verified in CookieScan. The primary screen
must make the mural the focal point while keeping signing, confirmation, and chain
evidence explicit.

## Concept source

The accepted implementation reference is `cookiecanvas-concept.png`, generated for
this bounty workspace. It defines the desktop composition, information hierarchy,
and visual direction.

## Design system

- **Background:** cocoa black (`#0d0c0a`) with true-black depth, never purple.
- **Surface:** charcoal (`#181612`) with warm borders (`#3c3021`).
- **Primary text:** parchment (`#f5ead7`); secondary text (`#b8aa96`).
- **Accent:** cookie orange (`#ed9229`); success green (`#6fcf8b`); danger red
  (`#ef6b5f`).
- **Typography:** Fraunces for the wordmark and display numerals; Inter for UI;
  JetBrains Mono for addresses, coordinates, signatures, and chain evidence.
- **Geometry:** 8-12 px control radii; panels use borders rather than heavy shadows;
  the mural remains a square, open canvas rather than a floating card.
- **Motion:** short 160-240 ms state transitions and a single confirmation pulse;
  all motion is disabled under `prefers-reduced-motion`.

## Component families

1. Header: wordmark, two documentation links, network health, wallet control.
2. Pixel mural: 16 x 16 accessible button grid, axis labels, selection outline.
3. Paint composer: coordinate readout, palette, alias and note inputs, fee preview,
   submit button.
4. Confirmation rail: preparing, wallet approval, submitted, confirmed/failed.
5. Evidence band: recent paints table, activity sparkline, color distribution.
6. Responsive shell: on narrow screens the composer follows the mural and evidence
   becomes a vertical stack; no horizontal page overflow.

## Allowed first-viewport copy

- CookieCanvas
- How it works
- Bridge
- Live on Cookie Chain
- Connect Nightly
- Paint on-chain
- Selected pixel
- Choose color
- Your alias
- Note (optional)
- Network fee only

## Core workflow

1. Verify RPC health and Cookie Chain genesis hash.
2. Detect Nightly; connect and request the Cookie Chain custom network when needed.
3. Select one pixel, color, alias, and optional note.
4. Encode a versioned paint instruction, show the exact byte footprint and fee model,
   and ask Nightly to sign.
5. Submit through the public Cookie Chain RPC, confirm against the returned blockhash,
   then expose a CookieScan signature link.
6. Refresh program history and rebuild the mural deterministically from confirmed
   instructions.

## Fidelity ledger template

| Comparison point | Concept | Render | Resolution |
| --- | --- | --- | --- |
| Primary composition | Mural left, composer right | `cookiecanvas-desktop.png` preserves the split and first-viewport proportions | Matched; working grid uses true coordinate labels and slightly more regular geometry |
| Typography | Warm product wordmark and disciplined UI/mono | Fraunces display, Inter UI, JetBrains Mono evidence | Matched hierarchy with a more editorial display face |
| Palette | Cocoa black, parchment, orange accent | Sampled token system in `src/styles.css` | Matched without purple or excess glass effects |
| Transaction clarity | Four-stage rail beside primary action | Prepared, wallet approval, submitted, confirmed, plus explicit failure | Matched and strengthened semantically |
| Evidence density | Table and two concise charts below | Evidence band begins at the same first-viewport depth | Matched; empty chain state is factual rather than seeded with fake transactions |
| Mobile behavior | Not shown; preserve hierarchy vertically | `cookiecanvas-mobile.png` at 390 px | Intentional responsive extension; mural, composer, evidence, and proof stack with no page overflow |

The final desktop screenshot was captured at the concept's native 1536 × 1024 viewport.
The visible above-the-fold differences are functional: live events are not fabricated, and
the paint action remains deployment-gated until the program account is observed as
executable. No decorative components or product claims were added to fill those states.
