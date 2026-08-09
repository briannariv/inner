// Maps astrologyapi.com's western_horoscope response onto our own
// NatalChart shape. See astrologyApiClient.ts for the confidence caveat —
// this schema is intentionally loose (passthrough + optional alternates)
// and every extraction step throws a specific, debuggable error instead of
// guessing, so a real test call surfaces exactly what needs adjusting.
import { z } from "zod";
import type { ChartAngle, HouseCusp, Planet, PlanetPlacement, ZodiacSign } from "@inner/shared";
import { angleForDegree, computeAspects, normalizeDegree, signForDegree } from "../../astro/geometry.js";

const PLANET_NAME_MAP: Record<string, Planet> = {
  Sun: "Sun", Moon: "Moon", Mercury: "Mercury", Venus: "Venus", Mars: "Mars",
  Jupiter: "Jupiter", Saturn: "Saturn", Uranus: "Uranus", Neptune: "Neptune", Pluto: "Pluto",
  Rahu: "NorthNode", "North Node": "NorthNode", Chiron: "Chiron",
  // Deliberately unmapped (no home in our Planet type yet): Ketu (South Node), Ascendant, Midheaven —
  // those are handled separately as chart angles, not planet placements.
};

const rawPlanetSchema = z
  .object({
    name: z.string(),
    full_degree: z.number().optional(),
    norm_degree: z.number().optional(),
    sign: z.string().optional(),
    house: z.number().optional(),
    is_retro: z.union([z.boolean(), z.string()]).optional(),
  })
  .passthrough();

const rawHouseSchema = z
  .object({
    house: z.number().optional(),
    house_number: z.number().optional(),
    degree: z.number().optional(),
    start_degree: z.number().optional(),
    sign: z.string().optional(),
  })
  .passthrough();

const rawResponseSchema = z
  .object({
    planets: z.array(rawPlanetSchema).optional(),
    houses: z.array(rawHouseSchema).optional(),
  })
  .passthrough();

function absoluteDegreeOf(entry: { full_degree?: number; norm_degree?: number; sign?: string }, context: string): number {
  if (typeof entry.full_degree === "number") return normalizeDegree(entry.full_degree);
  if (typeof entry.norm_degree === "number" && entry.sign) {
    const signIndex = ZODIAC_ORDER.indexOf(entry.sign as ZodiacSign);
    if (signIndex >= 0) return normalizeDegree(signIndex * 30 + entry.norm_degree);
  }
  throw new Error(
    `astrologyapi.com response: couldn't determine absolute degree for ${context} — ` +
      `expected "full_degree" or "norm_degree"+"sign", got keys: ${Object.keys(entry).join(", ")}. ` +
      `Update mapAstrologyApiResponse.ts once you've seen a real payload.`
  );
}

const ZODIAC_ORDER: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export interface MappedNatalData {
  placements: PlanetPlacement[];
  houses: HouseCusp[];
  ascendant: ChartAngle | null;
  midheaven: ChartAngle | null;
  // Neither point is in astrologyapi.com's western_horoscope response —
  // Vertex/Anti-Vertex stay null here until a provider that supplies them is
  // wired in; South Node is derived for real from the North Node (Rahu)
  // placement whenever one is present.
  vertex: ChartAngle | null;
  antiVertex: ChartAngle | null;
  southNode: ChartAngle | null;
  aspects: ReturnType<typeof computeAspects>;
}

export function mapAstrologyApiResponse(raw: unknown): MappedNatalData {
  const parsed = rawResponseSchema.safeParse(raw);
  if (!parsed.success) {
    const topLevelKeys = raw && typeof raw === "object" ? Object.keys(raw) : [];
    throw new Error(
      `astrologyapi.com western_horoscope response didn't match the expected shape. ` +
        `Top-level keys received: ${topLevelKeys.join(", ") || "(none/non-object)"}. ` +
        `${parsed.error.message}`
    );
  }
  const { planets = [], houses: rawHouses = [] } = parsed.data;
  if (planets.length === 0) {
    throw new Error("astrologyapi.com response had no usable 'planets' array — check the raw response shape.");
  }

  const placements: PlanetPlacement[] = [];
  let ascendantDegree: number | null = null;

  for (const p of planets) {
    if (p.name === "Ascendant") {
      ascendantDegree = absoluteDegreeOf(p, "Ascendant");
      continue;
    }
    const planet = PLANET_NAME_MAP[p.name];
    if (!planet) continue; // e.g. Ketu — no slot in our Planet type yet
    const absoluteDegree = absoluteDegreeOf(p, `planet "${p.name}"`);
    const { sign, degreeInSign } = signForDegree(absoluteDegree);
    placements.push({
      planet,
      sign,
      degreeInSign: Math.round(degreeInSign * 100) / 100,
      absoluteDegree,
      house: typeof p.house === "number" ? p.house : null,
      retrograde: p.is_retro === true || p.is_retro === "true",
    });
  }

  const houses: HouseCusp[] = rawHouses.map((h, i) => {
    const houseNumber = h.house ?? h.house_number ?? i + 1;
    const degree = h.degree ?? h.start_degree;
    if (typeof degree !== "number") {
      throw new Error(
        `astrologyapi.com response: house ${houseNumber} has no "degree"/"start_degree" — got keys: ${Object.keys(h).join(", ")}.`
      );
    }
    const { sign, degreeInSign } = signForDegree(degree);
    return { house: houseNumber, sign, degreeInSign: Math.round(degreeInSign * 100) / 100 };
  });

  if (ascendantDegree === null && houses[0]) {
    // Ascendant == 1st house cusp — true regardless of house system, used as
    // a fallback when the API doesn't include an explicit "Ascendant" entry.
    const h1 = rawHouses.find((h) => (h.house ?? h.house_number) === 1) ?? rawHouses[0];
    ascendantDegree = h1?.degree ?? h1?.start_degree ?? null;
  }
  const midheavenDegree =
    rawHouses.find((h) => (h.house ?? h.house_number) === 10)?.degree ??
    rawHouses.find((h) => (h.house ?? h.house_number) === 10)?.start_degree ??
    null;

  const northNode = placements.find((p) => p.planet === "NorthNode");
  const southNodeDegree = northNode ? normalizeDegree(northNode.absoluteDegree + 180) : null;

  return {
    placements,
    houses,
    ascendant: ascendantDegree !== null ? angleForDegree(ascendantDegree) : null,
    midheaven: midheavenDegree !== null ? angleForDegree(midheavenDegree) : null,
    vertex: null,
    antiVertex: null,
    southNode: southNodeDegree !== null ? angleForDegree(southNodeDegree) : null,
    aspects: computeAspects(placements),
  };
}
