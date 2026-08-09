// Single place that decides which ChartProvider implementation is live.
// Everything else in the app imports getChartProvider() and never
// instantiates a provider class directly — that's what makes the
// mock-now/hosted-API-next/self-hosted-later migration (SPEC.md §6) a
// one-file change instead of a rewrite.
import type { ChartProvider } from "./ChartProvider.js";
import { MockChartProvider } from "./MockChartProvider.js";
import { EphemerisChartProvider } from "./EphemerisChartProvider.js";
import { HostedChartProvider } from "./hosted/HostedChartProvider.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `CHART_PROVIDER=hosted requires ${name} to be set. See .env.example / README.md.`
    );
  }
  return value;
}

let cached: ChartProvider | null = null;

export function getChartProvider(): ChartProvider {
  if (!cached) {
    // Default is now "ephemeris" — real Swiss Ephemeris (sweph, Moshier
    // mode) positions and a real Human Design gate engine, no external
    // network/API keys needed. "mock" stays available for pure
    // no-native-addon dev/testing; "hosted" for the third-party vendor path.
    const kind = process.env.CHART_PROVIDER ?? "ephemeris";
    switch (kind) {
      case "ephemeris":
        cached = new EphemerisChartProvider();
        break;
      case "mock":
        cached = new MockChartProvider();
        break;
      case "hosted":
        // Vendors chosen per SPEC.md §6: astrologyapi.com (natal chart) +
        // humandesignapi.nl (bodygraph). Field-mapping confidence caveats
        // are documented in providers/hosted/*.ts — this integration hasn't
        // been exercised against a real account yet.
        cached = new HostedChartProvider(
          { userId: requireEnv("ASTROLOGY_API_USER_ID"), apiKey: requireEnv("ASTROLOGY_API_KEY") },
          { apiKey: requireEnv("HD_API_KEY") }
        );
        break;
      default:
        throw new Error(`Unknown CHART_PROVIDER "${kind}" — expected "ephemeris", "mock", or "hosted".`);
    }
  }
  return cached;
}
