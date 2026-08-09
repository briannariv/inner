// Dev-only ChartProvider: generates deterministic, structurally-plausible
// chart data with no external calls, so the UI/interaction model can be
// built and reviewed before a hosted API vendor (see SPEC.md §6) is
// contracted. Swap this out in providers/index.ts once a vendor is chosen —
// nothing outside this file should need to change.
import { randomUUID } from "node:crypto";
import type {
  BirthData, ChartBundle, HDChart, HDGateActivation,
  HouseCusp, NatalChart, Planet, PlanetPlacement, TransitSnapshot,
} from "@inner/shared";
import { computeAspects, computeCrossAspects, equalHouseCusps, houseForDegree, normalizeDegree, signForDegree } from "../astro/geometry.js";
import { GATE_CENTER } from "../hd/reference.js";
import { deriveHumanDesignChart } from "../hd/derive.js";
import { SeededRandom } from "../util/seededRandom.js";
import type { ChartProvider } from "./ChartProvider.js";

const PLANETS: Planet[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
  "Uranus", "Neptune", "Pluto", "NorthNode", "Chiron",
];

// Real (if simplified) astronomical approximation of the Sun's tropical
// ecliptic longitude from the calendar date — accurate to roughly a degree,
// which is plenty for mock UI data. Everything else in this file is random.
function approxSunLongitude(dateStr: string): number {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const year = date.getUTCFullYear();
  let equinox = Date.UTC(year, 2, 20); // March 20, approximate spring equinox
  if (date.getTime() < equinox) equinox = Date.UTC(year - 1, 2, 20);
  const days = (date.getTime() - equinox) / 86_400_000;
  return normalizeDegree(days * (360 / 365.25));
}

function birthDataKey(birthData: BirthData): string {
  return JSON.stringify(birthData);
}

function buildPlacements(rand: SeededRandom, sunDegree: number): PlanetPlacement[] {
  return PLANETS.map((planet) => {
    let absoluteDegree: number;
    let retrogradeProbability = 0.35;
    switch (planet) {
      case "Sun":
        absoluteDegree = sunDegree;
        retrogradeProbability = 0; // Sun is never retrograde
        break;
      case "Moon":
        absoluteDegree = rand.next() * 360; // moves ~13deg/day, not worth approximating
        retrogradeProbability = 0;
        break;
      case "Mercury":
        absoluteDegree = normalizeDegree(sunDegree + rand.int(-28, 28)); // stays near Sun
        retrogradeProbability = 0.18;
        break;
      case "Venus":
        absoluteDegree = normalizeDegree(sunDegree + rand.int(-46, 46)); // stays near Sun
        retrogradeProbability = 0.08;
        break;
      default:
        absoluteDegree = rand.next() * 360;
    }
    const { sign, degreeInSign } = signForDegree(absoluteDegree);
    return {
      planet,
      sign,
      degreeInSign: Math.round(degreeInSign * 100) / 100,
      absoluteDegree,
      house: null, // filled in later once we know if birth time/houses exist
      retrograde: rand.bool(retrogradeProbability),
    };
  });
}

function buildHouses(cusps: number[]): HouseCusp[] {
  return cusps.map((deg, i) => {
    const { sign, degreeInSign } = signForDegree(deg);
    return { house: i + 1, sign, degreeInSign: Math.round(degreeInSign * 100) / 100 };
  });
}

function buildHumanDesign(rand: SeededRandom): HDChart {
  const gateNumbers = Object.keys(GATE_CENTER).map(Number);
  const activatedCount = rand.int(22, 30); // real charts typically activate ~26 of 64 gates
  const shuffled = [...gateNumbers].sort(() => rand.next() - 0.5);
  const activatedGates = shuffled.slice(0, activatedCount);

  // Force a Sun activation on both sides so Profile (derived from the Sun's
  // personality/design line) is always resolvable, then fill in the rest.
  const gates: HDGateActivation[] = [
    { gate: activatedGates[0], line: rand.int(1, 6), planet: "Sun", source: "personality" },
    { gate: activatedGates[1], line: rand.int(1, 6), planet: "Sun", source: "design" },
    // Real charts activate each planet's gate exactly once per side — exclude
    // Sun here since it's already forced above, so the UI doesn't show two
    // "Sun" gates on the same side (Profile derivation still only reads the
    // forced pair, but duplicate Sun gates would be a confusing mock artifact).
    ...activatedGates.slice(2).map((gate, i): HDGateActivation => ({
      gate,
      line: rand.int(1, 6),
      planet: rand.pick(PLANETS.filter((p) => p !== "Sun")),
      source: i % 2 === 0 ? "personality" : "design",
    })),
  ];

  return { id: randomUUID(), ...deriveHumanDesignChart(gates) };
}

export class MockChartProvider implements ChartProvider {
  readonly name = "mock";

  async getChartBundle(birthData: BirthData): Promise<ChartBundle> {
    const rand = new SeededRandom(birthDataKey(birthData));
    const sunDegree = approxSunLongitude(birthData.date);
    const placements = buildPlacements(rand, sunDegree);

    const hasTime = birthData.time !== null;
    // NOT a real ascendant calculation (that needs sidereal time + obliquity
    // + latitude) — a labeled placeholder so the UI has something to render
    // and click on before a hosted API supplies the real value.
    const ascendantDegree = hasTime ? rand.next() * 360 : null;
    const midheavenDegree = ascendantDegree !== null ? normalizeDegree(ascendantDegree - 90) : null;

    let houses: HouseCusp[] = [];
    if (ascendantDegree !== null) {
      const cusps = equalHouseCusps(ascendantDegree);
      houses = buildHouses(cusps);
      for (const p of placements) p.house = houseForDegree(p.absoluteDegree, cusps);
    }

    const natal: NatalChart = {
      id: randomUUID(),
      birthData,
      ascendant: ascendantDegree !== null ? signForDegree(ascendantDegree) : null,
      midheaven: midheavenDegree !== null ? signForDegree(midheavenDegree) : null,
      placements,
      houses,
      aspects: computeAspects(placements),
    };

    return { natal, humanDesign: buildHumanDesign(rand) };
  }

  async getTransits(birthData: BirthData, atIso: string): Promise<TransitSnapshot> {
    const natalRand = new SeededRandom(birthDataKey(birthData));
    const natalPlacements = buildPlacements(natalRand, approxSunLongitude(birthData.date));

    const transitRand = new SeededRandom(atIso);
    const transitSunDegree = approxSunLongitude(atIso.slice(0, 10));
    const transitPlacements = buildPlacements(transitRand, transitSunDegree);

    return {
      timestamp: atIso,
      placements: transitPlacements,
      aspectsToNatal: computeCrossAspects(transitPlacements, natalPlacements),
    };
  }
}
