// Real, provider-independent geometry helpers. These operate on plain
// 0-360 degree longitudes, so they work the same whether the longitude
// came from the mock provider or a real ephemeris later — nothing here
// is vendor-specific and none of it needs to change when we swap providers.
import type { ZodiacSign, AspectType, Aspect, ChartAngle, Planet } from "@inner/shared";

const SIGNS: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export function normalizeDegree(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

export function signForDegree(absoluteDegree: number): { sign: ZodiacSign; degreeInSign: number } {
  const d = normalizeDegree(absoluteDegree);
  const index = Math.floor(d / 30);
  return { sign: SIGNS[index], degreeInSign: d - index * 30 };
}

// Same as signForDegree but for chart angles (Ascendant, MC, Vertex, ...)
// where callers also need the raw absolute degree for wheel/map math.
export function angleForDegree(absoluteDegree: number): ChartAngle {
  const d = normalizeDegree(absoluteDegree);
  return { ...signForDegree(d), absoluteDegree: d };
}

// Whole Sign houses: House 1 is the entire sign the Ascendant falls in
// (cusp = 0° of that sign, not the Ascendant's exact degree), each
// subsequent house is the next whole sign. This means the Ascendant and
// Midheaven are floating points *within* their houses rather than defining
// the House 1/10 cusps — real behavior of this system, not a bug — so
// callers should keep drawing ASC/MC from natal.ascendant/midheaven
// separately from the house cusp lines.
export function wholeSignHouseCusps(ascendantDegree: number): number[] {
  const firstHouseSignStart = Math.floor(normalizeDegree(ascendantDegree) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => normalizeDegree(firstHouseSignStart + i * 30));
}

export function houseForDegree(absoluteDegree: number, houseCusps: number[]): number {
  const d = normalizeDegree(absoluteDegree);
  for (let h = 0; h < 12; h++) {
    const start = houseCusps[h];
    const end = houseCusps[(h + 1) % 12];
    const inHouse = start < end ? d >= start && d < end : d >= start || d < end;
    if (inHouse) return h + 1;
  }
  return 12;
}

const ASPECTS: { type: AspectType; angle: number; orb: number }[] = [
  { type: "conjunction", angle: 0, orb: 8 },
  { type: "sextile", angle: 60, orb: 4 },
  { type: "square", angle: 90, orb: 6 },
  { type: "trine", angle: 120, orb: 6 },
  { type: "quincunx", angle: 150, orb: 3 },
  { type: "opposition", angle: 180, orb: 8 },
];

export function angularSeparation(a: number, b: number): number {
  const diff = Math.abs(normalizeDegree(a) - normalizeDegree(b));
  return diff > 180 ? 360 - diff : diff;
}

function bestAspect(sep: number): { type: AspectType; orb: number } | null {
  for (const candidate of ASPECTS) {
    const orb = Math.abs(sep - candidate.angle);
    if (orb <= candidate.orb) {
      return { type: candidate.type, orb: Math.round(orb * 100) / 100 };
    }
  }
  return null;
}

export function computeAspects(
  placements: { planet: Planet; absoluteDegree: number }[]
): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const sep = angularSeparation(placements[i].absoluteDegree, placements[j].absoluteDegree);
      const match = bestAspect(sep);
      if (match) aspects.push({ a: placements[i].planet, b: placements[j].planet, ...match });
    }
  }
  return aspects;
}

// Cross-set aspects (e.g. transiting planets vs. natal placements) — every
// pair is genuinely different bodies, so no same-set de-duplication is needed.
export function computeCrossAspects(
  setA: { planet: Planet; absoluteDegree: number }[],
  setB: { planet: Planet; absoluteDegree: number }[]
): Aspect[] {
  const aspects: Aspect[] = [];
  for (const p of setA) {
    for (const q of setB) {
      const sep = angularSeparation(p.absoluteDegree, q.absoluteDegree);
      const match = bestAspect(sep);
      if (match) aspects.push({ a: p.planet, b: q.planet, ...match });
    }
  }
  return aspects;
}
