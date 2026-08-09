// Thin wrapper around the `sweph` package (Node bindings for the real
// Swiss Ephemeris library — github.com/aloistr/swisseph). Runs in Moshier
// mode (the library's built-in semi-analytic model) since no .se1 data
// files are bundled or fetched — this environment can't reach astro.com to
// download them, and Moshier is accurate to a few arcseconds across a wide
// date range, far more precision than a 0.9375°-wide HD line or a natal
// chart display needs. AGPL/commercial dual-licensed like the C library
// itself (see SPEC.md §6/§4 for the licensing note this carries into
// production).
import sweph from "sweph";
import type { HDActivationBody, Planet } from "@inner/shared";
import { normalizeDegree } from "./geometry.js";

const FLAGS = sweph.constants.SEFLG_MOSEPH | sweph.constants.SEFLG_SPEED;

export const PLANET_SE_CODE: Record<Planet, number> = {
  Sun: sweph.constants.SE_SUN,
  Moon: sweph.constants.SE_MOON,
  Mercury: sweph.constants.SE_MERCURY,
  Venus: sweph.constants.SE_VENUS,
  Mars: sweph.constants.SE_MARS,
  Jupiter: sweph.constants.SE_JUPITER,
  Saturn: sweph.constants.SE_SATURN,
  Uranus: sweph.constants.SE_URANUS,
  Neptune: sweph.constants.SE_NEPTUNE,
  Pluto: sweph.constants.SE_PLUTO,
  NorthNode: sweph.constants.SE_TRUE_NODE,
  Chiron: sweph.constants.SE_CHIRON,
};

// HD's 13 traditional measuring points (astrology's 12 minus Chiron, plus
// Earth and South Node — both derived as exact opposites, not queried
// directly) — matches the reference implementation cross-checked in
// hd/reference.ts and hd/mandala.ts.
export const HD_BODIES: HDActivationBody[] = [
  "Sun", "Earth", "Moon", "NorthNode", "SouthNode",
  "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto",
];

export function julianDayUt(date: Date): number {
  const res = sweph.utc_to_jd(
    date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds() + date.getUTCMilliseconds() / 1000,
    sweph.constants.SE_GREG_CAL
  );
  if (res.flag !== sweph.constants.OK) {
    throw new Error(`sweph.utc_to_jd failed: ${res.error}`);
  }
  return res.data[1]; // [0]=ET (for planets via calc, we use calc_ut which wants UT), [1]=UT
}

export interface BodyPosition {
  longitude: number;
  retrograde: boolean;
}

export function planetPosition(jdUt: number, planet: Planet): BodyPosition {
  const res = sweph.calc_ut(jdUt, PLANET_SE_CODE[planet], FLAGS);
  // data = [lon, lat, dist, lonSpeed, latSpeed, distSpeed] — retrograde is lonSpeed < 0.
  const [longitude, , , speedLongitude] = res.data;
  return { longitude: normalizeDegree(longitude), retrograde: speedLongitude < 0 };
}

// For the 13 HD measuring points, resolving Earth/South Node as exact
// opposites of Sun/North Node — real relationships, not approximations.
export function hdBodyPosition(jdUt: number, body: HDActivationBody): BodyPosition {
  if (body === "Earth") {
    const sun = planetPosition(jdUt, "Sun");
    return { longitude: normalizeDegree(sun.longitude + 180), retrograde: sun.retrograde };
  }
  if (body === "SouthNode") {
    const node = planetPosition(jdUt, "NorthNode");
    return { longitude: normalizeDegree(node.longitude + 180), retrograde: node.retrograde };
  }
  return planetPosition(jdUt, body as Planet);
}

// Finds the Julian day (searching backward from `beforeJdUt`) when the
// Sun's ecliptic longitude last equaled `targetLongitudeDeg` — used for the
// ~88-day-before-birth "Design" moment (Sun 88° of solar arc earlier).
// Delegates to Swiss Ephemeris's own solcross_ut rather than hand-rolling a
// root-finder.
export function findSolarLongitudeCrossing(targetLongitudeDeg: number, beforeJdUt: number): number {
  const res = sweph.solcross_ut(normalizeDegree(targetLongitudeDeg), beforeJdUt - 100, FLAGS);
  return res.date;
}

export interface RealHouseData {
  cusps: number[]; // 12 whole-sign cusps
  ascendant: number;
  midheaven: number;
  vertex: number;
}

export function wholeSignHousesAndAngles(jdUt: number, lat: number, lon: number): RealHouseData {
  const res = sweph.houses_ex2(jdUt, 0, lat, lon, "W");
  if (res.flag !== sweph.constants.OK) {
    throw new Error(`sweph.houses_ex2 failed: ${res.error}`);
  }
  const [ascendant, midheaven, , vertex] = res.data.points;
  return { cusps: [...res.data.houses], ascendant, midheaven, vertex };
}
