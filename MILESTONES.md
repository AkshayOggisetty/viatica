# VIATICA — Prototype Build Milestones

Team S2P10 · OggyAndTheCockroaches · PS IHSIH019 · YUKTI IR2026-1042884
Demo prototype. **All data is simulated/seeded — no live APIs, no real bookings.**

**Status: complete.** Built, verified in headless Chrome across all ten routes with zero
console errors, and screenshotted. Run it with `./serve.sh` — see [README.md](README.md).

---

## M0 — Foundations
- [x] Read all source docs (PPTX, Project Brief, Presentation Script, Technical Approach Q&A)
- [x] Lock the 10 modules that make up the "one live trip record"
- [x] Choose stack: zero-build static PWA (ES modules + service worker) served on localhost
- [x] Project scaffold + run script (`npm start` / `python3 -m http.server`)

### The 10 Modules (one live trip record)
| # | Module | Pillar |
|---|--------|--------|
| 1 | Itinerary Planner (greedy-insertion solver) | Itinerary |
| 2 | Transport Compare (time / cost / CO₂ / fare band) | Transportation |
| 3 | Trip Pass — signed rotating QR ticketing | Ticketing |
| 4 | Slot Control & capacity per place | Ticketing |
| 5 | SOS & Emergency Assistance (offline SMS fallback) | Emergency |
| 6 | Guardian Live Watch + geofenced risk zones | Emergency |
| 7 | Budget & Expense Split / settle-up | Itinerary |
| 8 | Group Travel — voting, must-dos, fork & re-solve | Itinerary |
| 9 | Voice & Multilingual planning (EN/HI/KN) | Cross-cutting |
| 10 | Verified Guides + Scam Reports + Dept. Dashboard | Governance |
Plus cross-cutting: **Offline-first** service worker (plan, tickets, tiles).

---

## M1 — The Indian Atlas (visual core)
- [x] Source accurate India + state geometry, simplify to hand-drawn-feeling SVG paths
- [x] Parchment base: paper grain, ink borders, deckled edge, plate frame
- [x] Illustrated geography layer: rivers, mountain hachures, desert stipple, coastline hatching
- [x] Engraved geographic annotations (Himalayas, Thar, Deccan, Western Ghats, Bay of Bengal…)
- [x] Ornamental Indian compass rose + "Scale of the Journey" + manuscript corner motifs
- [x] State hover: illumination, border weight, elegant label + character line + regional script
- [x] Zoom levels: INDIA → STATE → DESTINATION, atlas-page transitions
- [x] Per-state palettes & motifs (Karnataka, Rajasthan, Kerala, TN, WB, HP, Goa, UP, MH, Ladakh…)
- [x] Illustrated landmark glyphs (temple, fort, houseboat, ghats, mountain, church) — no map pins
- [x] Category lens: Heritage / Nature / Beaches / Food / Adventure / Spiritual / Culture
- [x] Living map: shimmer on rivers, self-drawing routes, slow compass drift

---

## M2 — Design system
- [x] Type scale (modern serif display + clean sans UI + Devanagari/Kannada/Tamil accents)
- [x] Palette: parchment, ink, terracotta, indigo, brass, deep forest
- [x] Jaali / arch / cusped-arch component vocabulary (cards, panels, dividers, buttons)
- [x] Motion language: slow, weighted, no bounce
- [x] Single committed "aged ivory" look — *the night mode was dropped: it fought the
      parchment identity and earned nothing for a five-minute demo*

---

## M3 — Seed data (simulated)
- [x] 92 places across 24 states — 25 of them the manually-verified corridor
- [x] Travel-time / cost / CO₂ matrix between corridor places (multi-mode)
- [x] Transport legs: train, bus, cab, auto, ferry, walk — with fare bands
- [x] Demo user (Meera), group members, guardian
- [x] Guides, scam reports, incidents, footfall time series, slot inventory
- [x] Pre-built demo trip: **Bengaluru → Hampi → Chalukyan corridor** (4 days) — the
      solver chose the Badami/Aihole/Pattadakal arm over Mysuru/Coorg on its own

---

## M4 — Core engine (client-side, mirrors the real server logic)
- [x] Greedy-insertion scheduler over opening hours + visit time + travel matrix
- [x] Score function: interest match × pace × budget, honour must-dos
- [x] Re-solve on change (delay / budget edit / vote / SOS) — only remaining stops
- [x] HMAC + TOTP rotating QR (Web Crypto, real HMAC-SHA256, 30s counter)
- [x] Offline verifier that validates a code with zero network calls
- [x] Live trip state store — single object, every module reads/writes it, events broadcast

---

## M5 — Screens
- [x] Landing / Atlas (the map is the homepage)
- [x] Plan intake: days, budget, pace, interests, must-dos + **voice input**
- [x] Solving animation → day-wise itinerary board
- [x] Trip Dashboard: itinerary, map route, budget bar, group, pass, safety — one record
- [x] Transport compare sheet (time / cost / CO₂ / fare band / crowd)
- [x] Trip Pass: rotating QR, slot windows, offline badge
- [x] Gate Scanner (staff mode): offline verify demo, accept/replay-reject
- [x] SOS: hold-to-trigger, context packet, SMS fallback, responder view
- [x] Guardian Live Watch link view
- [x] Group: votes, must-dos, expense split & settle-up
- [x] Guides & marketplace + scam report flow
- [x] Department Dashboard: footfall, slots, incidents, scam heat, moderation queue
- [x] Offline mode toggle + service worker cache proof

---

## M6 — The demo narrative (matches the 5-min script)
- [x] Scripted "Demo Mode" that walks the Hampi delay scenario end-to-end
- [x] Bus delay injected → itinerary repairs itself live → tickets/slots/budget follow
- [x] Network kill switch → pass + plan + SOS still work
- [x] SOS fires with "where you were supposed to be" context
- [x] Reset button between judging rounds

---

## M7 — Polish & handover
- [x] Keyboard + reduced-motion support, no layout jank
- [x] Loading/empty/error states everywhere
- [x] Simulated-data banner so judges are never misled
- [x] README with run instructions + demo walkthrough script
- [x] Cross-check every feature in the docs against a screen (traceability table)


---

## Verification performed

- QR encoder checked module-for-module against a reference implementation, then decoded
  back with an independent decoder across 46 fuzz cases spanning versions 1–13.
  The one case the decoder refused is byte-identical to the reference, which it also refuses.
- The live QR was decoded **straight out of a screenshot of the running app**, returning
  the signed payload intact.
- All four gate paths exercised: admit, screenshot reuse, forged signature, wrong gate.
- All ten routes loaded in headless Chrome over the DevTools protocol: every view renders,
  **zero console errors**.
- The full demo scenario driven end to end (delay → offline → SOS) with no errors.
- Budget arithmetic reconciled: the figure shown to the traveller is exactly the figure
  the solver enforces, at every budget level tested.

## Known limits

- The atlas is drawn, not tiled — there is no pan or free zoom, only country → state → place.
- The travel matrix is verified for the Karnataka corridor; everywhere else it is estimated
  from distance and a road factor, and the UI labels which is which.
- Group voting is single-click rather than a real multi-user flow.
- Web Speech falls back to replaying the seeded utterance where the browser lacks the API.
