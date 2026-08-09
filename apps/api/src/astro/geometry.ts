// Real, provider-independent geometry helpers. These operate on plain
// 0-360 degree longitudes, so they work the same whether the longitude
// came from the mock provider or a real ephemeris later — nothing here
// is vendor-specific and none of it needs to change when we swap providers.
import type { ZodiacSign, AspectType, Aspect, Planet } from "@inner/shared";

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

// Equal house system from the ascendant — simplest correct house system to
// implement without an ephemeris library; production can swap in
// Placidus/Whole Sign/etc. from the hosted API's house-system option.
export function equalHouseCusps(ascendantDegree: number): number[] {
  return Array.from({ length: 12 }, (_, i) => normalizeDegree(ascendantDegree + i * 30));
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
