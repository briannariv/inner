# Inner

All-in-one astrology, Human Design, and Astrocartography app. See [`SPEC.md`](./SPEC.md) for the full product spec, architecture decisions, and roadmap.

This repo is an npm-workspaces monorepo:

```
apps/api/       Node/TypeScript backend (Express) — chart provider adapter + interpretation engine
apps/mobile/    Expo (React Native) app — birth data entry, interactive natal chart + HD bodygraph
packages/shared/ Shared TypeScript types used by both apps
```

## Status

First working end-to-end slice per the SPEC.md roadmap: enter birth data → generate a chart → interactive natal wheel (tap a planet for a chart-aware description) and Human Design bodygraph (tap a center) → toggle today's transits on the wheel.

**All chart data right now comes from `MockChartProvider`** (`apps/api/src/providers/MockChartProvider.ts`) — deterministic, structurally-plausible data with no external calls, built specifically so the UI/interaction model could be built and reviewed before a hosted API vendor is contracted (see SPEC.md §6 for candidate vendors). Astrology aspect/house/sign math in `apps/api/src/astro/geometry.ts` is real and provider-independent; the Human Design gate/channel reference table in `apps/api/src/hd/reference.ts` is a labeled best-effort placeholder pending verification. Swapping in a real provider later is meant to be a one-file change in `apps/api/src/providers/index.ts`.

Interpretation copy is split per SPEC.md §6: astrology content (`apps/api/src/interpretation/astrologyContent.ts`) is minimal starter keywords for the founder to rewrite in their own voice; Human Design content (`apps/api/src/interpretation/humanDesignContent.ts`) is a first-pass draft that needs founder review before shipping to real users.

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

Everything past the first slice in SPEC.md's phasing: Astrocartography, Friends/connections + compatibility, the Spark Audit, education section, electional astrology history, and the real ephemeris/HD vendor integration.
