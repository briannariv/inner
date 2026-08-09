# Inner — Product Spec (v0.1)

**One-line pitch:** The all-in-one self-knowledge app — natal astrology, Human Design, and Astrocartography in a single interactive experience, with a synastry engine that reads both systems together, and a paid tier built around a signature "Spark Audit" life-direction reading.

**Positioning vs. The Pattern:** The Pattern nails personality-description astrology and social bonds, but stops there — no Human Design, no Astrocartography (users bounce to a browser for both), and its insights describe who you are rather than where to go. Inner keeps The Pattern's best mechanic (interactive chart → plain-language insight → bonds with real people) and extends it in three directions competitors haven't combined: a second symbolic system (HD) read *jointly* with astrology, a locations layer (Astrocartography) telling you *where* life flows differently, and a synthesis layer (the Spark Audit) telling you *what direction to grow in* — not just what you already are.

---

## 1. Target user

Astrology-literate, self-development-oriented adults (skews 22–40, skews female but not exclusively) who already use The Pattern, Co–Star, or Human Design sites, are willing to pay for depth, and are frustrated by having to stitch together 3–4 different apps/browser tools to get a full picture of themselves.

---

## 2. Core feature pillars

### 2.1 Profile & chart creation
- Sign up → enter birth date/time/place (with a "I don't know my exact time" fallback: solar chart + a note that Rodden-rating-sensitive features like houses/HD gates degrade gracefully).
- One primary chart per user, unlimited saved charts for other people ("Friends" — mirrors The Pattern's custom-chart contacts).
- Every saved chart gets both a natal astrology chart **and** a Human Design chart computed automatically from the same birth data — this dual computation from one input is the app's structural core, not a bolt-on.

### 2.2 Interactive natal chart (astrology)
- Tappable wheel: tap a planet → plain-language interpretation of that placement *in relation to the rest of the chart* (sign + house + major aspects to it), not a generic "Mars in Aries means..." blurb. Interpretation text is templated/composed from placement + aspect data, not one static paragraph per planet.
- Toggle layer: current transits overlaid on the natal wheel, with the same tap-for-explanation interaction on transiting bodies (transiting Saturn conjunct natal Sun, etc.).
- Aspect grid + a written "chart summary" view for users who prefer text to the wheel.

### 2.3 Human Design chart
- Bodygraph (the 9-center chart) computed from birth data, generated automatically alongside the astrology chart.
- Same interactive philosophy as the astrology wheel: tap a center/gate/channel → explanation in context (defined vs. undefined centers, active channels, your Type/Strategy/Authority/Profile), not just a dictionary lookup.
- Because this is the founder's weaker area (per your note), the **Education section is the anchor for HD accuracy** — the app should teach the system properly (Type, Strategy, Authority, Profile, Centers, Gates, Channels, Not-Self theme) so both you and users can trust the outputs while you're still building fluency.

### 2.4 Astrocartography
- World map view: your natal planetary lines (AC/DC/MC/IC lines for each planet) projected globally.
- Tap a line or a location → plain-language "what this line means for you if you live/travel there," pulling from the same interpretation engine as the natal chart (same planet, now read through place instead of house).
- Search/pin any city to see a localized reading (relocated chart) rather than only global lines — this is the "clean, dedicated section" gap you flagged in the market.

### 2.5 Compatibility / combined synastry ("Bonds," but dual-system)
- Pick any connected user or saved Friend → run compatibility.
- Astrology layer: synastry (planet-to-planet cross-aspects) + composite chart.
- HD layer: HD "Connection Analysis" — electromagnetic, compromise, dominance, and companionship channels between the two bodygraphs.
- Output is a **single synthesized bond report**, not two disconnected reports bolted together — e.g. "astrology says you strengthen his identity (Sun trine Sun), and HD confirms you complete an electromagnetic channel that pulls you together the same way" is the kind of unified sentence this feature has to be able to produce. This is the single hardest content-design problem in the app and should be prototyped early.
- Social layer: users can connect as friends, both must consent to share chart data before compatibility can run.

### 2.6 Electional astrology (one/two-click chart generation)
- "New chart for a moment" flow: pick a date/time (default: now) + location → instant chart, saved to a lightweight history, taggable ("wedding date option A," "contract signing").
- V1: show the chart + auto-flag major caveats (void-of-course Moon, retrogrades active). Full electional scoring/recommendation ("best windows this month for X") is a V2 feature — don't over-promise it in v1.

### 2.7 Education section
- Two parallel tracks: **Astrology 101→advanced** and **Human Design 101→advanced**, written as real curriculum (not just a glossary), because it has to double as your own HD learning tool while you build.
- Every glossary term used anywhere in the app (a planet, a gate, a house, a center) should deep-link to its education entry — the chart and the classroom are the same content, referenced two ways.

### 2.8 The Spark Audit (signature paid feature)
- A synthesized, consultation-style report combining astrology + HD (+ astrocartography where relevant) into a directional life reading: likely-fit careers/directions, where your "spark" (natural energy/talent) shows up across all systems, and concrete next steps — explicitly positioned as *"here's a direction to grow toward,"* not *"here's a description of you."*
- Structurally this is a **long-form generated report**, not an interactive chart screen — plan for a report template with sections (e.g. Core Nature, Where You're Blocked, Where You Flow, Career/Direction Signals, Places That Support You, This Season's Move) populated by pulling the strongest, most decision-relevant signals across the two systems + astrocartography, rather than dumping every placement.
- This is the flagship reason to pay — it should feel like a $150 professional reading, not a premium unlock of existing UI.

---

## 3. Monetization

| | Free | Paid |
|---|---|---|
| Natal chart (astrology + HD) | ✅ full, interactive | ✅ |
| Transits overlay | ✅ | ✅ |
| Astrocartography (global lines) | ✅ | ✅ deeper/relocated readings |
| Friends / saved charts | ✅ (capped, e.g. 3) | ✅ unlimited |
| Compatibility / Bonds | ✅ 1 per month or basic summary | ✅ unlimited + full dual-system report |
| Education section | ✅ full access | ✅ (this stays free — it builds trust and habit) |
| Electional chart generator | ✅ | ✅ history + tagging |
| Spark Audit | ❌ locked, teaser preview only | ✅ full report |
| Ads | none, ever | none |

No ads at any tier — the free tier has to feel generous on its own (this is a trust/retention bet, matching how The Pattern's free tier works). The paywall is depth + the Spark Audit, not access.

---

## 4. Technical architecture (recommended)

**Platform:** React Native (Expo) for iOS + Android from one codebase, matching your mobile-first decision. Expo also gets you OTA updates and a faster path to a native calendar/notifications integration later.

**Backend:** Node.js/TypeScript API (NestJS or a lean Express/Fastify service), PostgreSQL for user/chart/connection data, Redis for caching computed chart data (ephemeris lookups are cheap to cache per birth-datetime+location).

**Chart engine — the one architectural decision that needs a real choice now:**

- **Astrology + Human Design math both need an ephemeris** (planetary positions for a given date/time/place). HD is computed the same way as astrology, just twice: once for the birth moment, once for "Design" (~88 degrees of solar arc before birth, ≈88–89 days earlier), then mapped onto the 64 gates via the I Ching wheel instead of zodiac signs.
- **Recommended: Swiss Ephemeris**, via a Node binding (`swisseph`) or a small internal microservice — it's the de facto standard, used by nearly every serious astrology app including likely The Pattern itself, and is accurate enough for HD's precision requirements too.
  - ⚠️ **Licensing flag:** Swiss Ephemeris is dual-licensed AGPL / commercial (Astrodienst). AGPL would obligate you to open-source the service that calls it if distributed over a network as-is. For a commercial paid app, budget for **Astrodienst's commercial license** — this is a real line-item to plan for before launch, not an afterthought.
  - Alternative if you want to defer that cost: a hosted astrology API (e.g. one with an ephemeris + houses + aspects endpoint) for V1, then migrate to self-hosted Swiss Ephemeris once volume/cost justifies owning it. Flagging as a real tradeoff since you asked me to decide — I'd start there for MVP speed and cost control, and own the ephemeris once the app has traction.
- **Human Design specifics:** no ephemeris API gives you HD gates/lines natively — you'll compute planetary longitudes yourself (from the ephemeris) and map degrees onto the 64-gate/384-line wheel using the standard HD gate-wheel mapping. This mapping is public/derivable but the "Human Design System" brand and some proprietary chart-art are IP of Jovian Archive/Ra Uru Hu's estate — **use only the underlying I Ching/gate logic (which is not proprietary), avoid copying their specific chart artwork or "Rave" trademarked terminology verbatim in marketing.** Worth a real legal check before launch, not urgent for a spec-stage build.
- **Astrocartography:** computed from the same natal ephemeris data — AC/DC/MC/IC lines are a geodesic projection problem, not a new data source. Render with MapLibre GL (open-source, no Google Maps licensing fees) so map costs don't scale awkwardly with users.

**Interpretation content layer:** template-and-compose, not one static blurb per placement — a rules engine that takes (placement + house + aspects) or (gate + channel + center state) and composes interpretation text from smaller reusable content blocks. This is what makes "click a planet, get a chart-aware description" possible instead of a lookup table, and it's the same engine the Spark Audit draws from.

**Calendar integration (Google Calendar, roadmap item):** noted as a later phase — natural fit once electional charts + transits exist, low priority for MVP.

---

## 5. Suggested phasing

**MVP (prove the core loop):** profile + birth data entry → interactive natal astrology chart → interactive HD bodygraph → transits overlay → education section (enough to be genuinely useful, not exhaustive) → free/paid gate scaffolding (even if Spark Audit is a stub).

**V1:** Astrocartography, Friends/connections + basic compatibility (astrology-only synastry first — it's the well-understood half), Spark Audit v1.

**V2:** dual-system synthesized Bonds reports (the hardest content problem — give it real time), electional astrology history/tagging, Spark Audit v2 with astrocartography woven in, Google Calendar integration.

---

## 6. Decisions (locked in)

1. **Ephemeris/chart data — hosted API for MVP, self-host later.** Both astrology and Human Design chart math will come from third-party hosted APIs at MVP, called through a swappable provider adapter in the backend so we can migrate to a self-hosted Swiss Ephemeris service (with an Astrodienst commercial license) once volume/cost justifies owning it, without touching app code above the adapter.
2. **Human Design also comes from a hosted API for MVP** (not built from first principles yet) — consistent with the astrology decision, same migration path later.
3. **Content authoring is split by expertise:** the founder drafts/curates astrology interpretation content (chart-click descriptions, Spark Audit astrology sections) directly, since that's the founder's strength; Human Design interpretation templates get a first-pass draft written up front (by me, using solid general HD reference knowledge) for the founder to review and correct — this unblocks building the interactive HD UI now while HD fluency is still being built, with review as a gate before anything ships to users.

### Candidate hosted providers (researched, not yet contracted)

**Astrology:**
- [astrologyapi.com](https://astrologyapi.com/) — planetary positions, house cusps, aspects, synastry/composite charts, clean JSON.
- [RoxyAPI](https://roxyapi.com/products/astrology-api) — natal charts, 4 house systems, aspect-pattern detection, synastry compatibility scores.
- [Astrologer API](https://github.com/g-battaglia/Astrologer-API) (Kerykeion-based, open source) — natal/synastry/transits/composites/returns as SVG+JSON; notable as a possible *self-hosted* fallback too since it's open source, worth a closer look before committing to a paid vendor.
- [DivineAPI](https://divineapi.com/) — broad endpoint catalog (300+), includes Vedic in addition to Western.

**Human Design:**
- [Human Design Hub](https://humandesignhub.app/) — REST API, full bodygraph JSON (type, strategy, authority, profile, centers, gates, channels, circuits).
- [Human Design Core](https://www.humandesigncore.com/en) — free tier (50 req/mo) to start, paid tiers scale — good fit for early dev/testing without committing spend.
- [Bodygraph.com](https://bodygraph.com/human-design-api/) — chart data + rendered bodygraph images.
- [dturkuler/humandesign_api](https://github.com/dturkuler/humandesign_api) (GitHub, Swiss-Ephemeris-based, open source) — another possible self-hosted fallback later, worth keeping on the radar for the post-MVP migration.

**Update: wired in.** `astrologyapi.com` (astrology) and `humandesignapi.nl` (Human Design) are now implemented behind `HostedChartProvider` (`apps/api/src/providers/hosted/`), selected via `CHART_PROVIDER=hosted`. This was built without live docs access (blocked by this environment's network policy) or API credentials, so the request shapes are solid but response field-mapping is best-effort and unverified — see the README's integration-status note. Still open before this can be trusted in production: real API keys, a live test call to confirm/patch the field mapping, and the pricing/rate-limit comparison below.

Pricing at expected volume, data completeness (lines/profile/incarnation cross vs. just gates), and rate limits across alternatives — not compared yet, flagging as a pre-launch task.

**Update: superseded as the default.** The self-host-later plan happened sooner than expected — `sweph` (real Swiss Ephemeris Node bindings) installs cleanly and runs in Moshier mode (its built-in analytic model) with no ephemeris data files and no network calls at runtime, so there's no cost/ops reason left to start on a paid hosted API. `EphemerisChartProvider` (`apps/api/src/providers/EphemerisChartProvider.ts`) is now the default `CHART_PROVIDER`: real planetary positions, real Whole Sign houses/Ascendant/MC/Vertex (via Swiss Ephemeris's own `houses_ex2`, not hand-derived spherical trig), and a Human Design engine built from scratch against the documented gate/line formula (`apps/api/src/hd/mandala.ts`, `computeGateActivations.ts`) — cross-checked gate-by-gate against `dturkuler/humandesign_api` (the self-hosted HD fallback already listed above) and matched exactly. `hosted` (the vendor APIs above) and `mock` (deterministic placeholder) both stay available via `CHART_PROVIDER`, but neither is the default anymore.

⚠️ **This reopens the AGPL licensing flag from §4** — `sweph`/Swiss Ephemeris is AGPL/commercial dual-licensed, same as noted there. Fine for continued prototyping; needs Astrodienst's commercial license (or open-sourcing the service) before this ships to real users. Not resolved, just now actually relevant since it's live rather than hypothetical.

The remaining honest caveat is precision-class, not correctness-class: Moshier mode is accurate to a few arcseconds, more than enough for chart display and HD's 0.9375°-wide lines, but Astrodienst's full .se1 data files (blocked from download in this sandbox — astro.com isn't reachable here) would be the eventual production-grade step up.

---

*Current state: the thin end-to-end slice from the original plan — enter birth data → see your interactive natal chart and HD bodygraph — is done, now backed by the real engine instead of a mock. Astrocartography has a first real screen too (SPEC.md's V1 phasing, pulled forward). Remaining phasing: Friends/connections, compatibility, Spark Audit, education section, and mobile-side work to catch up with what the API now supports (Vertex/Anti-Vertex/South Node, astrocartography, Whole Sign houses).*
