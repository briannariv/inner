// Shared domain types for Inner — used by both apps/api and apps/mobile.
// This is the contract between the chart-provider adapter and the UI, so
// changing a shape here is a breaking change on both sides.

export type ZodiacSign =
  | "Aries" | "Taurus" | "Gemini" | "Cancer" | "Leo" | "Virgo"
  | "Libra" | "Scorpio" | "Sagittarius" | "Capricorn" | "Aquarius" | "Pisces";

export type Planet =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn"
  | "Uranus" | "Neptune" | "Pluto" | "NorthNode" | "Chiron";

export type AspectType =
  | "conjunction" | "opposition" | "trine" | "square" | "sextile" | "quincunx";

export interface GeoLocation {
  name: string;
  lat: number;
  lon: number;
}

export interface BirthData {
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm, 24h — null means unknown/unrated time
  location: GeoLocation;
}

export interface PlanetPlacement {
  planet: Planet;
  sign: ZodiacSign;
  degreeInSign: number; // 0-30
  absoluteDegree: number; // 0-360, for aspect math and astrocartography
  house: number | null; // 1-12, null if birth time unknown
  retrograde: boolean;
}

export interface HouseCusp {
  house: number; // 1-12
  sign: ZodiacSign;
  degreeInSign: number;
}

export interface Aspect {
  a: Planet;
  b: Planet;
  type: AspectType;
  orb: number; // degrees off exact
}

export interface NatalChart {
  id: string;
  birthData: BirthData;
  ascendant: { sign: ZodiacSign; degreeInSign: number } | null; // null if birth time unknown
  midheaven: { sign: ZodiacSign; degreeInSign: number } | null;
  placements: PlanetPlacement[];
  houses: HouseCusp[]; // empty if birth time unknown
  aspects: Aspect[];
}

export interface TransitSnapshot {
  timestamp: string; // ISO datetime
  placements: PlanetPlacement[];
  aspectsToNatal: Aspect[];
}

// ---- Human Design ----

export type HDType =
  | "Manifestor" | "Generator" | "Manifesting Generator" | "Projector" | "Reflector";

export type HDAuthority =
  | "Emotional" | "Sacral" | "Splenic" | "Ego" | "Self-Projected" | "Mental" | "Lunar";

export type HDCenterName =
  | "Head" | "Ajna" | "Throat" | "G" | "Heart" | "Sacral" | "Spleen" | "Solar Plexus" | "Root";

export interface HDCenter {
  name: HDCenterName;
  defined: boolean;
}

export interface HDGateActivation {
  gate: number; // 1-64
  line: number; // 1-6
  planet: Planet;
  source: "personality" | "design"; // conscious (birth) vs unconscious (~88 days prior)
}

export interface HDChannel {
  gates: [number, number];
  name: string;
  defined: boolean;
}

export interface HDChart {
  id: string;
  type: HDType;
  strategy: string;
  authority: HDAuthority;
  profile: string; // e.g. "1/3"
  incarnationCross: string;
  centers: HDCenter[];
  gates: HDGateActivation[];
  channels: HDChannel[];
}

// ---- Combined chart response ----

export interface ChartBundle {
  natal: NatalChart;
  humanDesign: HDChart;
}

// ---- Interpretation ----

export interface InterpretationRequest {
  chart: ChartBundle;
  focus:
    | { kind: "planet"; planet: Planet }
    | { kind: "hdCenter"; center: HDCenterName }
    | { kind: "hdGate"; gate: number };
}

export interface InterpretationResult {
  headline: string;
  body: string;
}
