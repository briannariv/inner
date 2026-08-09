// Real ChartProvider: astrology from actual Swiss Ephemeris positions
// (via sweph, Moshier mode — see astro/ephemeris.ts), Human Design from the
// documented gate/line formula run against those same real positions. The
// only thing "mock" about this provider is nothing — it's the real engine,
// promoted from MockChartProvider's placeholder role once ephemeris access
// became available. See providers/index.ts for how it's selected.
import { randomUUID } from "node:crypto";
import type {
  BirthData, ChartBundle, HouseCusp, NatalChart, Planet, PlanetPlacement, TransitSnapshot,
} from "@inner/shared";
import { angleForDegree, computeAspects, computeCrossAspects, houseForDegree, normalizeDegree, signForDegree } from "../astro/geometry.js";
import { findSolarLongitudeCrossing, julianDayUt, planetPosition, wholeSignHousesAndAngles } from "../astro/ephemeris.js";
import { computeGateActivations } from "../hd/computeGateActivations.js";
import { deriveHumanDesignChart } from "../hd/derive.js";
import { resolveBirthInstantUtc } from "../util/timezone.js";
import type { ChartProvider } from "./ChartProvider.js";

const PLANETS: Planet[] = [
  "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
  "Uranus", "Neptune", "Pluto", "NorthNode", "Chiron",
];

function computePlacements(jdUt: number): PlanetPlacement[] {
  return PLANETS.map((planet) => {
    const pos = planetPosition(jdUt, planet);
    const { sign, degreeInSign } = signForDegree(pos.longitude);
    return {
      planet,
      sign,
      degreeInSign: Math.round(degreeInSign * 100) / 100,
      absoluteDegree: pos.longitude,
      house: null,
      retrograde: pos.retrograde,
    };
  });
}

export class EphemerisChartProvider implements ChartProvider {
  readonly name = "ephemeris";

  async getChartBundle(birthData: BirthData): Promise<ChartBundle> {
    if (!birthData.time) {
      throw new Error(
        "EphemerisChartProvider requires a known birth time for houses/angles/HD gates. " +
          "The 'unknown time' Sun-only fallback isn't implemented for this provider yet."
      );
    }

    const utcInstant = resolveBirthInstantUtc(birthData.date, birthData.time, birthData.location.lat, birthData.location.lon);
    const jdUt = julianDayUt(utcInstant);

    const placements = computePlacements(jdUt);
    const houseData = wholeSignHousesAndAngles(jdUt, birthData.location.lat, birthData.location.lon);
    for (const p of placements) p.house = houseForDegree(p.absoluteDegree, houseData.cusps);

    const houses: HouseCusp[] = houseData.cusps.map((deg, i) => {
      const { sign, degreeInSign } = signForDegree(deg);
      return { house: i + 1, sign, degreeInSign: Math.round(degreeInSign * 100) / 100 };
    });

    const northNode = placements.find((p) => p.planet === "NorthNode")!;
    const southNodeDegree = normalizeDegree(northNode.absoluteDegree + 180);
    const antiVertexDegree = normalizeDegree(houseData.vertex + 180);

    const natal: NatalChart = {
      id: randomUUID(),
      birthData,
      ascendant: angleForDegree(houseData.ascendant),
      midheaven: angleForDegree(houseData.midheaven),
      vertex: angleForDegree(houseData.vertex),
      antiVertex: angleForDegree(antiVertexDegree),
      southNode: angleForDegree(southNodeDegree),
      placements,
      houses,
      aspects: computeAspects(placements),
    };

    // Design instant: the moment the Sun was exactly 88° of solar arc
    // earlier than its birth longitude — a root-finding problem, solved by
    // Swiss Ephemeris's own solcross_ut rather than a hand-rolled search.
    const sunLongitude = placements.find((p) => p.planet === "Sun")!.absoluteDegree;
    const designTargetLongitude = normalizeDegree(sunLongitude - 88);
    const designJdUt = findSolarLongitudeCrossing(designTargetLongitude, jdUt);

    const gates = computeGateActivations(jdUt, designJdUt);
    const humanDesign = { id: randomUUID(), ...deriveHumanDesignChart(gates) };

    return { natal, humanDesign };
  }

  async getTransits(birthData: BirthData, atIso: string): Promise<TransitSnapshot> {
    const natalBundle = await this.getChartBundle(birthData);
    const transitJdUt = julianDayUt(new Date(atIso));
    const transitPlacements = computePlacements(transitJdUt);
    return {
      timestamp: atIso,
      placements: transitPlacements,
      aspectsToNatal: computeCrossAspects(transitPlacements, natalBundle.natal.placements),
    };
  }
}
