// The swappable boundary described in SPEC.md §4/§6: everything above this
// interface (routes, interpretation engine, mobile app) talks to a
// ChartProvider and must never know whether the data came from a mock, a
// hosted API, or a self-hosted ephemeris service. Migrating providers later
// means writing one new class here — nothing else in the app should change.
import type { BirthData, ChartBundle, TransitSnapshot } from "@inner/shared";

export interface ChartProvider {
  readonly name: string;
  getChartBundle(birthData: BirthData): Promise<ChartBundle>;
  getTransits(birthData: BirthData, atIso: string): Promise<TransitSnapshot>;
}
