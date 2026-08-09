# Inner

All-in-one astrology, Human Design, and Astrocartography app. See [`SPEC.md`](./SPEC.md) for the full product spec, architecture decisions, and roadmap.

This repo is an npm-workspaces monorepo:

```
apps/api/       Node/TypeScript backend (Express) — chart provider adapter + interpretation engine
apps/mobile/    Expo (React Native) app — birth data entry, interactive natal chart + HD bodygraph
packages/shared/ Shared TypeScript types used by both apps
```

## Status

End-to-end slice per the SPEC.md roadmap: enter birth data → generate a chart → interactive natal wheel (tap any planet or chart angle for a chart-aware description) and Human Design bodygraph (tap a center) → toggle today's transits → astrocartography lines.

**Chart data now defaults to `EphemerisChartProvider`** (`apps/api/src/providers/EphemerisChartProvider.ts`) — real Swiss Ephemeris positions via the `sweph` bindings (Moshier analytic mode: no `.se1` data files, no network calls at runtime) and a Human Design engine built from the documented gate/line formula. `CHART_PROVIDER=mock` and `CHART_PROVIDER=hosted` (see `.env.example`) are still available for deterministic-placeholder or third-party-vendor testing, but neither is the default anymore.

⚠️ **Licensing:** Swiss Ephemeris (and `sweph`) is AGPL/commercial dual-licensed. Fine for prototyping; needs Astrodienst's commercial license (or open-sourcing this service) before shipping to real users — flagged in SPEC.md §4/§6, now actually relevant since it's wired in rather than hypothetical.

**What's real vs. sourced-not-verified:**
- Planetary positions, Whole Sign houses, Ascendant/Midheaven/Vertex — real, computed by Swiss Ephemeris itself (`houses_ex2`), not hand-derived formulas.
- Human Design gate/line mapping (`apps/api/src/hd/mandala.ts`) and the gate→center table (`apps/api/src/hd/reference.ts`) — cross-checked byte-for-byte against `dturkuler/humandesign_api`, an independent open-source implementation, and matched exactly on all 36 channels. Good corroboration, but still one secondary source rather than a direct astro.com/Jovian Archive reference — worth a final check against a known published chart before this powers a real product.
- Astrocartography lines (`apps/api/src/astro/astrocartography.ts`) — real spherical astronomy (Julian date → GMST → ecliptic-to-equatorial → MC/IC/AC/DC solutions), sanity-checked against a real birth instant (Sun's MC line landed almost exactly on the birth longitude for a birth near local solar noon, as it should).
- Design (~88° solar arc) calculation — delegates to Swiss Ephemeris's own `solcross_ut` root-finder rather than a hand-rolled one.

The old hosted-vendor integration (`apps/api/src/providers/hosted/`, astrologyapi.com + humandesignapi.nl) is still there and still unverified against live accounts — see the comments in that directory if picking that path back up.

Human Design centers/channels/Type/Authority/Profile are derived from raw gate activations by `apps/api/src/hd/derive.ts` (shared by all three providers). Interpretation copy is split per SPEC.md §6: astrology content (`apps/api/src/interpretation/astrologyContent.ts`) is minimal starter keywords for the founder to rewrite in their own voice; Human Design content (`apps/api/src/interpretation/humanDesignContent.ts`) is a first-pass draft that needs founder review before shipping to real users.

## Running it

```bash
npm install   # from repo root — installs all workspaces

# backend
npm run dev --workspace=@inner/api        # http://localhost:4000

# mobile (in a second terminal)
npm run start --workspace=@inner/mobile   # opens Expo dev tools
```

Before running on a physical device or Android emulator, update `apps/mobile/src/config.ts` — `API_BASE_URL` defaults to `localhost`, which only resolves from a simulator/web context sharing the host's network stack.

## Not yet built

Astrocartography/mobile UI (API is ready, mobile screen isn't), Friends/connections + compatibility, the Spark Audit, education section, electional astrology history, and the AGPL commercial license this now actually needs before real users touch it.
