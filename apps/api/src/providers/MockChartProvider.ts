// Dev-only ChartProvider: generates deterministic, structurally-plausible
// chart data with no external calls, so the UI/interaction model can be
// built and reviewed before a hosted API vendor (see SPEC.md §6) is
// contracted. Swap this out in providers/index.ts once a vendor is chosen —
// nothing outside this file should need to change.
import { randomUUID } from "node:crypto";
import type {
  BirthData, ChartBundle, HDAuthority, HDCenterName, HDChart, HDGateActivation, HDType,
  HouseCusp, NatalChart, Planet, PlanetPlacement, TransitSnapshot,
} from "@inner/shared";
import { computeAspects, computeCrossAspects, equalHouseCusps, houseForDegree, normalizeDegree, signForDegree } from "../astro/geometry.js";
import { CENTERS, CHANNELS, GATE_CENTER, MOTOR_CENTERS } from "../hd/reference.js";
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

const PROFILES = ["1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3"];

function buildHumanDesign(rand: SeededRandom): HDChart {
  const gateNumbers = Object.keys(GATE_CENTER).map(Number);
  const activatedCount = rand.int(22, 30); // real charts typically activate ~26 of 64 gates
  const shuffled = [...gateNumbers].sort(() => rand.next() - 0.5);
  const activatedGates = new Set(shuffled.slice(0, activatedCount));

  const gates: HDGateActivation[] = [...activatedGates].map((gate, i) => ({
    gate,
    line: rand.int(1, 6),
    planet: rand.pick(PLANETS),
    source: i % 2 === 0 ? "personality" : "design",
  }));

  const channels = CHANNELS.map((c) => ({
    gates: c.gates,
    name: c.name,
    defined: activatedGates.has(c.gates[0]) && activatedGates.has(c.gates[1]),
  }));

  const definedCenterSet = new Set<HDCenterName>();
  for (const c of channels) {
    if (c.defined) {
      definedCenterSet.add(GATE_CENTER[c.gates[0]]);
      definedCenterSet.add(GATE_CENTER[c.gates[1]]);
    }
  }
  const centers = CENTERS.map((name) => ({ name, defined: definedCenterSet.has(name) }));

  const sacralDefined = definedCenterSet.has("Sacral");
  const throatDefined = definedCenterSet.has("Throat");
  const otherMotorDefined = MOTOR_CENTERS.some((c) => c !== "Sacral" && definedCenterSet.has(c));
  const noneDefined = definedCenterSet.size === 0;

  let type: HDType;
  let strategy: string;
  if (noneDefined) {
    type = "Reflector";
    strategy = "Wait a full lunar cycle (~28 days) before major decisions";
  } else if (sacralDefined) {
    type = throatDefined ? "Manifesting Generator" : "Generator";
    strategy = "Respond";
  } else if (throatDefined && otherMotorDefined) {
    type = "Manifestor";
    strategy = "Inform before acting";
  } else {
    type = "Projector";
    strategy = "Wait for the invitation";
  }

  let authority: HDAuthority;
  if (definedCenterSet.has("Solar Plexus")) authority = "Emotional";
  else if (sacralDefined) authority = "Sacral";
  else if (definedCenterSet.has("Spleen")) authority = "Splenic";
  else if (definedCenterSet.has("Heart")) authority = "Ego";
  else if (definedCenterSet.has("G") && throatDefined) authority = "Self-Projected";
  else if (noneDefined) authority = "Lunar";
  else authority = "Mental";

  const sunPersonalityGate = gates.find((g) => g.planet === "Sun" && g.source === "personality")?.gate
    ?? gates[0]?.gate ?? 1;

  return {
    id: randomUUID(),
    type,
    strategy,
    authority,
    profile: rand.pick(PROFILES),
    incarnationCross: `Placeholder Cross of Gate ${sunPersonalityGate} — real cross naming requires the hosted HD API`,
    centers,
    gates,
    channels,
  };
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
