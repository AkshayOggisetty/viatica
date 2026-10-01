# VIATICA

Team OggyAndTheCockroaches
Theme: Tourism · Category: Software
Prototype developer: **Ishita Choudhary**

An interactive prototype of *Viatica* — an integrated smart tourism platform where
itinerary, transport, tickets, budget, group and safety live in **one live trip record**.
Change one part and the rest repairs itself.

> **All data on screen is simulated.** Places, fares, footfall, incidents, guides and
> reports are seeded fixtures for demonstration. Nothing is booked, charged or sent
> anywhere. The scheduler, the HMAC/TOTP ticket signing, the QR encoding and the
> offline cache are real and run entirely in your browser.

---

## Run it

```bash
cd viatica && ./serve.sh
```

Then open **http://localhost:8080**. Pass a port to use a different one: `./serve.sh 3000`.

No build step, no `npm install`, no network access required after the first load.
Node 18+ is the only requirement (for the tiny static server in `server.mjs`).

---

## The five-minute demo

Use the **Demo scenario** button in the top bar. It drives the same story as the pitch.

| Step | What to say | What to show |
|------|-------------|--------------|
| 1 | "One record, four pillars." | **Atlas** → hover states, click **Karnataka**, click a landmark, add it to the trip |
| 2 | "The solver works over hours, visit times and a travel matrix." | **Plan** → speak or set constraints → *Solve itinerary* |
| 3 | "Here is the whole trip as one state." | **Trip** → the five pillars, day-wise timeline, *Solver trace* |
| 4 | "Before you agree a price." | **Trip** → click any travel leg → time / cost / CO₂ / fare band |
| 5 | **"Halfway through day two, the bus is delayed."** | Demo scenario → *1 · Bus delayed 90 minutes*. Watch the log: the day re-opens later, stops move between days, slots are re-held, the budget moves |
| 6 | "Hampi's ruins have no signal." | Demo scenario → *5 · Lose the network*. The **Pass** still mints a code |
| 7 | "The gate verifies it offline." | **Pass** → *Scan the live code* (admit), then *screenshot*, *forged*, *wrong gate* (all refused) |
| 8 | "And the SOS already knows where you were supposed to be." | Demo scenario → *6 · Raise an SOS offline* → the context packet, sent as SMS |
| 9 | "Departments get a reason to join." | **Desk** → footfall against hourly caps, slot control, moderated scam queue |

**Reset** returns everything to the seeded state between judging rounds.

Any screen is directly linkable: `#/trip`, `#/pass`, `#/desk`, `#/atlas/Rajasthan`.

---

## The ten modules

| # | Module | Where |
|---|--------|-------|
| 01 | Itinerary planning — greedy-insertion solver | Plan · Trip |
| 02 | Transportation — time / cost / CO₂ + fare band | Trip → any leg |
| 03 | Digital ticketing — signed, rotating QR, offline verify | Pass |
| 04 | Slot control — capacity per place per hour | Pass · Desk |
| 05 | Emergency assistance — SOS with trip context, SMS fallback | Safety |
| 06 | Guardian & geofencing — live watch, route advisories | Safety |
| 07 | Budget — projected per traveller, re-solved on change | Trip |
| 08 | Group travel — votes, must-dos, expense split, settle-up | Group |
| 09 | Voice & multilingual — Web Speech in EN / हिन्दी / ಕನ್ನಡ | Plan |
| 10 | Governance — footfall, incidents, guides, scam queue | Desk |

Cross-cutting: **offline-first**, via a real service worker.

---

## What is genuinely implemented

| Real | Simulated |
|------|-----------|
| Greedy-insertion scheduler (opening hours, visit time, travel matrix, budget, day windows, overnight legs) | Place, fare, footfall, incident and guide data |
| HMAC-SHA256 signing via Web Crypto (RFC 2104) | Firebase phone OTP |
| TOTP rotation on a 30-second step (RFC 6238) | Device SMS dispatch |
| QR encoding from the ISO/IEC 18004 tables — the code on screen really scans | UPI payment (the deep link is generated; nothing is charged) |
| Offline verification with no network call, including replay and wrong-gate rejection | OSM map tiles (the atlas is drawn, not tiled) |
| Service-worker cache of shell, plan and pass | Socket.io live dispatch |
| Web Speech recognition where the browser supports it | |

The QR encoder was verified module-for-module against a reference implementation and
decoded back with an independent decoder, including straight off a screenshot of the
running app.

---

## Layout

```
viatica/
  index.html            entry point
  server.mjs            dependency-free static server
  serve.sh              ./serve.sh [port]
  sw.js                 service worker — offline plan, pass and shell
  css/
    theme.css           tokens and primitives — including the whole atlas palette,
                        so a contrast pass is one edit rather than thirty
    atlas.css           the map plate
    app.css             shell and screens
  js/
    core/
      scheduler.js      greedy-insertion solver
      ticket.js         HMAC + TOTP Trip Pass, offline verifier, UPI deep link
      qr.js             QR encoder (byte mode, EC level M, versions 1–13)
      store.js          THE ONE LIVE TRIP RECORD — every action cascades here
    data/
      india-geo.js      state geometry, dissolved and projected
      geography.js      rivers, ranges, engraved annotations
      places.js         92 destinations, 25 in the verified corridor
      transport.js      travel matrix, fare bands, carbon
      seed.js           group, guardian, guides, reports, footfall, slots
    ui/
      atlas.js          the illustrated map
      glyphs.js         landmark line-art, compass rose, ornament
      views-plan.js     Plan and Trip
      views-ops.js      Pass, Safety, Group, Desk, About
    app.js              shell, rail, routing, demo controls
```

## Notes on the palette

The colour system is calibrated for a **projector in a lit room**, not a laptop at
arm's length: sage sea → parchment land → sepia borders → ink geography → terracotta
journey, each a clear value step from the one before. Contrast comes from value rather
than saturation, so it still reads as an antique sheet. Map lettering carries a halo of
its own ground (`paint-order: stroke fill`) — the cartographer's trick for legibility
over busy geography without reaching for bold. Every map colour lives in `:root` in
[theme.css](css/theme.css) under "The atlas plate"; the `--sheet-shift` token recentres
India on wide 16:9 displays.

## Notes on the atlas

State outlines come from public-domain Census district boundaries, dissolved to state
level, simplified, and projected equirectangularly at 23°N. Rivers, mountain ranges and
the engraved annotations are hand-authored in latitude/longitude and projected the same
way, so every layer registers with every other. Marker and label sizes are counter-scaled
against the zoom, and labels are laid out with a greedy de-collision pass — suppressed
names still appear on hover.

## Credits

**Prototype developed by Ishita Choudhary.**
The interactive prototype in this repository — the atlas, the ten modules, the solver,
the Trip Pass and the demo narrative — was built by Ishita Choudhary.

Team S2P10 · *OggyAndTheCockroaches* · Smart India Hackathon 2026
PS ID IHSIH019 · YUKTI ID IR2026-1042884 · Theme: Tourism · Category: Software

---

## Attribution

Base geometry derived from Census of India 2011 district boundaries (public domain).
Everything else — illustration, glyphs, ornament, code — was written for this prototype.
