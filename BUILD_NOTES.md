# Build Notes — Genesys Field Cards v2

**Built:** 26 June 2026
**Project:** `/home/user/workspace/genesys-field-cards/` (parallel to v1 `genesys-agentic-cx/`, which was NOT touched)

## What was built
A flat static library mirroring the Ironclad Persona Discovery Cards pattern:
- **Masthead** with the verbatim thesis copy from brief §3 (paradox + orchestration spine), a navy "spine" aside, and two lens tiles.
- **Lens 1 — By Concept:** 10 concept cards, 3-col desktop grid / 1-col mobile. Each expands inline (full-width) with 4 fields in fixed order: The concept → Why it matters in EMEA → The Genesys angle (patina dot #18CAA8) → The pureplay angle (amber dot #F7AD00).
- **Lens 2 — By Tension:** 5 tension cards, 2-col desktop / 1-col mobile. 4 fields: The tension → Why it persists → Which concepts come into play (clickable cross-links) → How EMEA buyers reconcile it.
- **Cross-links** on tension "concepts in play" jump to the linked concept card via hash routing (`#/concept/<slug>`), switching lens automatically.
- **Glossary** drawer (right) + inline dotted-underline tooltips on every Genesys term, metric, and generic CX term (22 entries), copy inherited verbatim from `genesys_content_pack.md` §A.
- **Hash routing** with working browser back/forward. Footer on every screen: "Built by Alex Abbott for the EMEA AI Sales Director discussion."

## Content
- **All 15 cards used VERBATIM** from `genesys_field_cards_v2_content_pack.md`. No paraphrasing, expansion, or compression.
- **Nothing was missing** from the content pack — no improvised field content was required, so no fabricated copy exists in this build.

## Branding
- Genesys palette + Roboto per brief §5 (sourced from Genesys.com). Warm off-white `#F9F8F5` background, white cards, navy headings, orange used sparingly (brand-mark dot, active lens tab, thesis-card accent). No Genesys logo (typographic wordmark only). No headshot/bio/CV/role-title-in-body, no revenue figures, no Andrew quotes.

## Tech
- Plain HTML/CSS/JS, no framework, no backend, no analytics. Files: `index.html`, `styles.css`, `data.js` (verbatim content), `app.js` (render/route/tooltips).
- Glossary auto-linking wraps the first occurrence of each term per field, skipping existing tags so it never breaks `<strong>`/`<em>`/links.

## QA performed (Playwright)
- Desktop 1280px and mobile 375px screenshots of: masthead, by-concept grid, expanded Orchestration (thesis) card, by-tension grid, expanded Loyalty vs efficiency card, glossary drawer.
- Verified: cross-link click jumps to and expands the target concept across lenses; browser back restores prior card; glossary tooltip fires on hover/focus/tap; all 10+5+22 items render.

## Open items for Alex
- None blocking. The Orchestration concept card and Loyalty vs efficiency tension card are intentionally flagged as "Thesis card" (orange accent) to surface the spine.
