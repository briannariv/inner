// Hellenistic technique layer — the delineation methods actually used by
// the tradition's core surviving authors (Vettius Valens' Anthology,
// Dorotheus of Sidon's Carmen Astrologicum, Ptolemy's Tetrabiblos, and the
// anonymous Hermetic material collected in the Project Hindsight/ARHAT
// translations), as synthesized in modern scholarship — chiefly Chris
// Brennan's "Hellenistic Astrology: The Study of Fate and Fortune" (2017),
// which is this file's primary structural reference, and Demetra George's
// "Ancient Astrology in Theory and Practice" for the essential-dignity and
// sect tables specifically. Whole Sign houses (astro/geometry.ts) are
// already this tradition's own house system, not a modern add-on.
//
// None of this is proprietary content — domicile/exaltation/joy tables and
// sect rules are >1800 years old and reproduced in any traditional
// astrology textbook — but the specific technique *selection* (which
// factors get surfaced to a user, in what order) reflects Brennan's
// synthesis, so it's credited above rather than presented as if reinvented
// from the primary sources directly.
import type { Planet, PlanetPlacement, ZodiacSign } from "@inner/shared";
import { normalizeDegree } from "./geometry.js";

export type Sect = "day" | "night";

// Diurnal (above-horizon) houses in Whole Sign practice: 7 through 12,
// the hemisphere containing the Midheaven (10th). A chart is a "day chart"
// if the Sun falls there — genuinely above the horizon at birth — and a
// "night chart" otherwise. This is the single most load-bearing
// distinction in Hellenistic delineation: it decides which planets act as
// benefics/malefics *for this specific chart*, not just in the abstract.
const DIURNAL_HOUSES = new Set([7, 8, 9, 10, 11, 12]);

export function determineSect(placements: Pick<PlanetPlacement, "planet" | "house">[]): Sect | null {
  const sun = placements.find((p) => p.planet === "Sun");
  if (!sun || sun.house == null) return null;
  return DIURNAL_HOUSES.has(sun.house) ? "day" : "night";
}

// Traditional (not modern) domicile rulers — the system Hellenistic
// astrologers actually worked with, before Uranus/Neptune/Pluto were
// assigned co-rulerships in the 20th century. Two signs per classical
// planet except the luminaries.
export const DOMICILE_RULER: Record<ZodiacSign, Planet> = {
  Aries: "Mars", Scorpio: "Mars",
  Taurus: "Venus", Libra: "Venus",
  Gemini: "Mercury", Virgo: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Sagittarius: "Jupiter", Pisces: "Jupiter",
  Capricorn: "Saturn", Aquarius: "Saturn",
};

const PLANET_DOMICILES: Partial<Record<Planet, ZodiacSign[]>> = {
  Sun: ["Leo"],
  Moon: ["Cancer"],
  Mercury: ["Gemini", "Virgo"],
  Venus: ["Taurus", "Libra"],
  Mars: ["Aries", "Scorpio"],
  Jupiter: ["Sagittarius", "Pisces"],
  Saturn: ["Capricorn", "Aquarius"],
};

// Exaltation sign + traditional exact degree. Detriment/fall are simply
// the opposite sign of domicile/exaltation — no separate table needed.
const PLANET_EXALTATION: Partial<Record<Planet, { sign: ZodiacSign; degree: number }>> = {
  Sun: { sign: "Aries", degree: 19 },
  Moon: { sign: "Taurus", degree: 3 },
  Mercury: { sign: "Virgo", degree: 15 },
  Venus: { sign: "Pisces", degree: 27 },
  Mars: { sign: "Capricorn", degree: 28 },
  Jupiter: { sign: "Cancer", degree: 15 },
  Saturn: { sign: "Libra", degree: 21 },
};

const SIGNS: ZodiacSign[] = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
function oppositeSign(sign: ZodiacSign): ZodiacSign {
  return SIGNS[(SIGNS.indexOf(sign) + 6) % 12];
}

export type DignityType = "domicile" | "exaltation" | "detriment" | "fall" | "peregrine";

export interface Dignity {
  type: DignityType;
  note?: string; // e.g. proximity to exact exaltation degree
}

// Only the 7 classical (visible-to-the-ancients) planets carry essential
// dignity in this tradition — Uranus/Neptune/Pluto/nodes/Chiron return null,
// which callers should treat as "this concept doesn't apply," not "unknown."
export function essentialDignity(planet: Planet, sign: ZodiacSign, degreeInSign?: number): Dignity | null {
  const domiciles = PLANET_DOMICILES[planet];
  if (!domiciles) return null;

  if (domiciles.includes(sign)) return { type: "domicile" };

  const exaltation = PLANET_EXALTATION[planet];
  if (exaltation && exaltation.sign === sign) {
    const near = degreeInSign != null && Math.abs(degreeInSign - exaltation.degree) <= 2;
    return { type: "exaltation", note: near ? `near its exact degree (${exaltation.degree}°) — unusually potent placement` : undefined };
  }

  if (domiciles.some((d) => oppositeSign(d) === sign)) return { type: "detriment" };
  if (exaltation && oppositeSign(exaltation.sign) === sign) return { type: "fall" };

  return { type: "peregrine" };
}

export type HouseAngularity = "angular" | "succedent" | "cadent";

export function houseAngularity(house: number): HouseAngularity {
  if ([1, 4, 7, 10].includes(house)) return "angular";
  if ([2, 5, 8, 11].includes(house)) return "succedent";
  return "cadent";
}

// Planetary joy: the one house (of the 12) each classical planet is said to
// operate with the least friction in, independent of sign. A different axis
// of strength from dignity/angularity — a planet can be peregrine and
// cadent yet still "at home" by joy, or vice versa.
const JOY_HOUSE: Partial<Record<Planet, number>> = {
  Mercury: 1, Moon: 3, Venus: 5, Mars: 6, Sun: 9, Jupiter: 11, Saturn: 12,
};

export function isInJoy(planet: Planet, house: number): boolean {
  return JOY_HOUSE[planet] === house;
}

export type SectRole = "luminary" | "benefic" | "malefic" | "neutral";

export interface SectInfo {
  sect: Sect;
  role: SectRole;
  inSect: boolean; // aligned with this chart's sect (day planets in a day chart, etc.)
}

// Mercury is the one classical planet without a fixed sect allegiance — it
// joins whichever sect it rises in phase with (oriental/morning-star in a
// day chart, occidental/evening-star in a night chart), per Valens.
// Determining oriental/occidental precisely requires declination; this uses
// the standard simplified ecliptic-longitude approximation most
// non-specialist traditional software also uses, which is right for the
// vast majority of charts but can disagree with a rigorous calculation very
// close to Mercury's stationary points.
function mercuryJoinsSect(sect: Sect, placements: Pick<PlanetPlacement, "planet" | "absoluteDegree">[]): boolean {
  const sun = placements.find((p) => p.planet === "Sun");
  const mercury = placements.find((p) => p.planet === "Mercury");
  if (!sun || !mercury) return false;
  const sunMinusMercury = normalizeDegree(sun.absoluteDegree - mercury.absoluteDegree);
  const oriental = sunMinusMercury > 0 && sunMinusMercury <= 180; // rises before the Sun
  return sect === "day" ? oriental : !oriental;
}

export function sectInfo(
  planet: Planet,
  sect: Sect,
  placements: Pick<PlanetPlacement, "planet" | "absoluteDegree">[]
): SectInfo | null {
  switch (planet) {
    case "Sun":
      return { sect, role: "luminary", inSect: sect === "day" };
    case "Moon":
      return { sect, role: "luminary", inSect: sect === "night" };
    case "Jupiter":
      return { sect, role: "benefic", inSect: sect === "day" };
    case "Venus":
      return { sect, role: "benefic", inSect: sect === "night" };
    case "Saturn":
      return { sect, role: "malefic", inSect: sect === "day" };
    case "Mars":
      return { sect, role: "malefic", inSect: sect === "night" };
    case "Mercury":
      return { sect, role: "neutral", inSect: mercuryJoinsSect(sect, placements) };
    default:
      return null; // outer planets, nodes, Chiron: no sect role in this tradition
  }
}

// Traditional chart ruler — the domicile lord of the Ascendant sign, the
// single most-referenced significator of the native's life/body/general
// affairs in Hellenistic delineation (Valens leans on it constantly).
export function chartRuler(ascendantSign: ZodiacSign): Planet {
  return DOMICILE_RULER[ascendantSign];
}
