// Single place that decides which ChartProvider implementation is live.
// Everything else in the app imports getChartProvider() and never
// instantiates a provider class directly — that's what makes the
// mock-now/hosted-API-next/self-hosted-later migration (SPEC.md §6) a
// one-file change instead of a rewrite.
import type { ChartProvider } from "./ChartProvider.js";
import { MockChartProvider } from "./MockChartProvider.js";

// TODO once a vendor from SPEC.md §6 is contracted:
//   - Add `HostedAstrologyApiProvider implements ChartProvider` here, calling
//     out to the chosen astrology + HD hosted APIs and mapping their
//     response shapes onto ChartBundle/TransitSnapshot.
//   - Read the vendor API key from process.env, fail fast at startup if
//     CHART_PROVIDER=hosted but the key is missing.
//   - Swap the branch below; no route/interpretation/mobile code changes.

let cached: ChartProvider | null = null;

export function getChartProvider(): ChartProvider {
  if (!cached) {
    const kind = process.env.CHART_PROVIDER ?? "mock";
    switch (kind) {
      case "mock":
        cached = new MockChartProvider();
        break;
      default:
        throw new Error(`Unknown CHART_PROVIDER "${kind}" — only "mock" is implemented so far.`);
    }
  }
  return cached;
}
