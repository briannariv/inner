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

## 6. Open questions for you

1. MVP ephemeris approach: pay for a hosted astrology API now, or go straight to self-hosted Swiss Ephemeris + commercial license? (Cost vs. speed tradeoff above.)
2. Do you want the HD "Design" calculation and gate wheel built from first principles (I compute it from raw ephemeris data, fully under your control), or would you rather integrate a existing HD API/library for V1 and swap later? First-principles is more work up front but avoids a second vendor dependency alongside the astrology ephemeris.
3. For the Spark Audit content — do you want to hand-write/curate the interpretation templates yourself (leaning on your astrology expertise, which also solves the "your HD knowledge is still growing" problem by having you review before anything ships), or should I draft a first-pass template library for you to edit?

---

*Next step once you sign off on direction: scaffold the Expo app + API skeleton and build the thin end-to-end slice — enter birth data → see your interactive natal chart — as the first working milestone.*
