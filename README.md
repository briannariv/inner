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

**Chart data defaults to `MockChartProvider`** (`apps/api/src/providers/MockChartProvider.ts`) — deterministic, structurally-plausible data with no external calls. Set `CHART_PROVIDER=hosted` (see `.env.example`) to switch to `HostedChartProvider` (`apps/api/src/providers/hosted/`), which calls astrologyapi.com for the natal chart and humandesignapi.nl for the Human Design bodygraph.

**⚠️ The hosted integration is unverified against live accounts.** This sandbox's network policy blocks fetching either vendor's docs directly, and no API keys were available to test a real call. The request shapes (auth method, endpoint URLs, body fields) are corroborated by public sources; the *response* field names in `mapAstrologyApiResponse.ts` / `mapHumanDesignApiResponse.ts` are best-effort guesses that validate strictly and throw a descriptive error (dumping the actual keys received) on any mismatch, rather than silently mis-mapping. Get API keys for both vendors, set them in `apps/api/.env`, and run one real request — whatever error comes back will point at exactly which field-name guess to fix.

Astrology aspect/house/sign math in `apps/api/src/astro/geometry.ts` is real and provider-independent — it's applied identically whether placements come from the mock or a vendor. Human Design centers/channels/Type/Authority/Profile are derived from raw gate activations by `apps/api/src/hd/derive.ts` (shared by both providers) rather than trusted from vendor-phrased fields, using the reference table in `apps/api/src/hd/reference.ts` (labeled best-effort, pending verification). Swapping providers is a one-file change in `apps/api/src/providers/index.ts`.

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
