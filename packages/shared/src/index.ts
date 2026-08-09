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

export interface GeoPoint {
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

export interface ChartAngle {
  sign: ZodiacSign;
  degreeInSign: number;
  absoluteDegree: number;
}

export interface NatalChart {
  id: string;
  birthData: BirthData;
  ascendant: ChartAngle | null; // null if birth time unknown
  midheaven: ChartAngle | null;
  // Vertex/Anti-Vertex — placeholder points pending a real ephemeris (see
  // MockChartProvider), same caveat as ascendant/midheaven. South Node is
  // exact opposite of the North Node placement — real math, not mock.
  vertex: ChartAngle | null;
  antiVertex: ChartAngle | null;
  southNode: ChartAngle | null;
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

// HD's 13 traditional measuring points are astrology's 12 planets/nodes
// minus Chiron, plus Earth (always exactly opposite the Sun) and South Node
// (always exactly opposite North Node) — neither is a real astrology
// placement, so neither belongs in the Planet union used for the chart wheel.
export type HDActivationBody = Planet | "Earth" | "SouthNode";

export interface HDGateActivation {
  gate: number; // 1-64
  line: number; // 1-6
  planet: HDActivationBody;
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

// ---- Astrocartography ----

export interface AstrocartographyLine {
  planet: Planet;
  mcLongitude: number; // signed, -180..180 — a full meridian, valid at every latitude
  icLongitude: number;
  acPoints: GeoPoint[]; // sampled curve; gaps where the body never rises/sets at that latitude
  dcPoints: GeoPoint[];
}

export interface AstrocartographyResult {
  lines: AstrocartographyLine[];
}

// ---- Interpretation ----

export type ChartAngleName = "Ascendant" | "Midheaven" | "Vertex" | "AntiVertex" | "SouthNode";

export interface InterpretationRequest {
  chart: ChartBundle;
  focus:
    | { kind: "planet"; planet: Planet }
    | { kind: "hdCenter"; center: HDCenterName }
    | { kind: "hdGate"; gate: number }
    | { kind: "angle"; angle: ChartAngleName };
}

export interface InterpretationResult {
  headline: string;
  body: string;
}

// ---- Education / reference content ----

export type ZodiacElement = "fire" | "earth" | "air" | "water";
export type ZodiacModality = "cardinal" | "fixed" | "mutable";

// Shape modeled on RoxyAPI's GET /astrology/signs/{id} response
// (roxyapi.com/api-reference#tag/western-astrology/GET/astrology/signs) —
// same field names/structure, our own content. See zodiacSignContent.ts for
// the sourcing note on which entries are adapted from their published
// example vs. written fresh.
export interface ZodiacSignProfile {
  sign: ZodiacSign;
  symbol: string;
  symbolName: string;
  element: ZodiacElement;
  modality: ZodiacModality;
  rulingPlanet: Planet;
  dates: { start: string; end: string };
  keywords: string[];
  description: { short: string; long: string };
  strengths: string[];
  motto: string;
  gifts: string;
  challenges: string;
  compatibleSigns: ZodiacSign[];
}

// STARTER CONTENT — per SPEC.md §6's content-authoring split, astrology
// copy is the founder's to own/refine; this is a first pass so the Learn
// tab has real, tappable content instead of a teaser stub.
//
// Shape modeled on RoxyAPI's GET /astrology/signs/{id} response
// (roxyapi.com/api-reference#tag/western-astrology/GET/astrology/signs).
// The Aries entry below is adapted (rewritten in our own words, not copied)
// from the worked example in their published API reference docs, which is
// the one sign we had real reference prose for; the other eleven were
// written fresh in matching structure/tone to keep the set consistent.
// Rulerships use modern rulers where astrology has split from traditional
// ones (Scorpio/Pluto, Aquarius/Uranus, Pisces/Neptune) since that's the
// more common convention today — flag if the founder prefers traditional.
//
// Kept in this file (not a separate module) deliberately: packages/shared
// has no build step and is source-imported directly by both apps/api
// (NodeNext resolution, requires explicit .js extensions on relative
// imports) and apps/mobile's Metro bundler (which can't resolve a .js
// specifier to a sibling .ts file) — a relative import between two files
// in this package satisfies neither consistently, so the content lives
// here instead of splitting it out.
export const ZODIAC_SIGN_PROFILES: ZodiacSignProfile[] = [
  {
    sign: "Aries", symbol: "♈", symbolName: "The Ram", element: "fire", modality: "cardinal",
    rulingPlanet: "Mars", dates: { start: "Mar 21", end: "Apr 19" },
    keywords: ["ambitious", "courageous", "energetic"],
    description: {
      short: "Ambitious, independent, impatient",
      long: "Aries opens the zodiac, and it shows — born trailblazers, Aries would rather start something imperfect than wait for permission to start it right. Passionate and independent, an Aries rarely does something just because everyone else is doing it. Turn anything into a contest and you'll have their full attention.",
    },
    strengths: [
      "The most courageous and ambitious sign, often the one who gets the group moving.",
      "Determination that doesn't fade when things get hard.",
      "Brings energy into any room — works hard, plays hard.",
    ],
    motto: "I am.",
    gifts: "Whether it's a new business, a half-marathon, or a spontaneous trip, once an Aries sets a goal they chase it down. They're comfortable being their own plus-one.",
    challenges: "An Aries' certainty can crowd out other people's points of view, and slowing down doesn't come naturally — maintaining relationships means learning to meet others at their pace sometimes.",
    compatibleSigns: ["Leo", "Sagittarius", "Gemini"],
  },
  {
    sign: "Taurus", symbol: "♉", symbolName: "The Bull", element: "earth", modality: "fixed",
    rulingPlanet: "Venus", dates: { start: "Apr 20", end: "May 20" },
    keywords: ["steady", "sensual", "stubborn"],
    description: {
      short: "Grounded, patient, pleasure-loving",
      long: "Taurus moves at its own pace, and that pace is unhurried. Ruled by Venus, Taurus wants life to feel good — good food, good textures, good company — and builds toward that steadily rather than chasing shortcuts. What a Taurus commits to, they tend to see all the way through.",
    },
    strengths: [
      "Reliability that others build plans around.",
      "A genuine gift for enjoying life's physical pleasures without guilt.",
      "Patience that outlasts almost anyone else's.",
    ],
    motto: "I have.",
    gifts: "Taurus builds things that last — a garden, a savings account, a decades-long friendship — through consistency most signs don't have the patience for.",
    challenges: "Comfort can tip into resistance to change, and stubbornness can calcify into refusing a better way just because it's a different way.",
    compatibleSigns: ["Virgo", "Capricorn", "Cancer"],
  },
  {
    sign: "Gemini", symbol: "♊", symbolName: "The Twins", element: "air", modality: "mutable",
    rulingPlanet: "Mercury", dates: { start: "May 21", end: "Jun 20" },
    keywords: ["curious", "quick-witted", "restless"],
    description: {
      short: "Curious, communicative, versatile",
      long: "Gemini's mind moves faster than most conversations can keep up with. Ruled by Mercury, Gemini collects ideas, people, and half-finished projects with equal enthusiasm — the throughline isn't any one interest, it's the appetite for more of them.",
    },
    strengths: [
      "Can talk to anyone about almost anything, and actually mean it.",
      "Adapts to new situations faster than most signs notice they've changed.",
      "A real gift for connecting ideas (and people) that wouldn't otherwise meet.",
    ],
    motto: "I think.",
    gifts: "Gemini's range makes them the person who can bridge two completely different rooms at a party, or two completely different fields in a career.",
    challenges: "Depth can lose out to breadth — Gemini sometimes has to consciously choose to finish something rather than move on to the next interesting thing.",
    compatibleSigns: ["Libra", "Aquarius", "Aries"],
  },
  {
    sign: "Cancer", symbol: "♋", symbolName: "The Crab", element: "water", modality: "cardinal",
    rulingPlanet: "Moon", dates: { start: "Jun 21", end: "Jul 22" },
    keywords: ["nurturing", "intuitive", "protective"],
    description: {
      short: "Nurturing, intuitive, deeply loyal",
      long: "Cancer feels the room before it understands the room. Ruled by the Moon, Cancer's instinct is to protect — home, family, the people it's decided are its people — and that protection runs deep even when the crab's hard shell makes it look guarded from the outside.",
    },
    strengths: [
      "Emotional intelligence that picks up what's unsaid.",
      "A loyalty that doesn't waver once it's given.",
      "A genuine talent for making a space feel like home.",
    ],
    motto: "I feel.",
    gifts: "Cancer builds the kind of close-knit circle other signs envy, because they invest in people the way Taurus invests in things — steadily, and for the long run.",
    challenges: "Sensitivity can turn into taking things personally that weren't personal, and the same protective shell that keeps Cancer safe can also keep it too guarded to be vulnerable when it matters.",
    compatibleSigns: ["Scorpio", "Pisces", "Taurus"],
  },
  {
    sign: "Leo", symbol: "♌", symbolName: "The Lion", element: "fire", modality: "fixed",
    rulingPlanet: "Sun", dates: { start: "Jul 23", end: "Aug 22" },
    keywords: ["confident", "generous", "dramatic"],
    description: {
      short: "Warm, expressive, natural performer",
      long: "Leo is ruled by the Sun for a reason — this is a sign built to be seen. Warm, generous, and unmistakably present, Leo wants life lived vividly, and tends to make the people around them feel more vivid too. Underneath the flair is a genuine need to be recognized for who they actually are, not just the performance.",
    },
    strengths: [
      "A warmth that makes people feel welcome the moment they walk in.",
      "Generosity — with attention, credit, and resources alike.",
      "Real courage in front of an audience, literal or otherwise.",
    ],
    motto: "I will.",
    gifts: "Leo turns ordinary moments into occasions, and has a rare ability to make the people around them feel like main characters too.",
    challenges: "The need for recognition can tip into needing to be the center of every room, and pride can make it hard to admit a misstep out loud.",
    compatibleSigns: ["Aries", "Sagittarius", "Gemini"],
  },
  {
    sign: "Virgo", symbol: "♍", symbolName: "The Maiden", element: "earth", modality: "mutable",
    rulingPlanet: "Mercury", dates: { start: "Aug 23", end: "Sep 22" },
    keywords: ["precise", "practical", "discerning"],
    description: {
      short: "Analytical, helpful, quietly exacting",
      long: "Virgo notices what everyone else missed. Ruled by Mercury, Virgo's mind is built for refinement — taking something good and making it work better, cleaner, more correctly. That precision often shows up as service: Virgo tends to express care by fixing things, not just naming them.",
    },
    strengths: [
      "An eye for detail that catches what others overlook.",
      "Genuinely useful in a crisis — practical, calm, and prepared.",
      "High personal standards that push quality up around them.",
    ],
    motto: "I analyze.",
    gifts: "Virgo makes things actually work — the plan that survives contact with reality, the system that holds up under pressure.",
    challenges: "The same standards that produce good work can turn inward as self-criticism, and 'helpful' can tip into correcting people who didn't ask to be corrected.",
    compatibleSigns: ["Taurus", "Capricorn", "Cancer"],
  },
  {
    sign: "Libra", symbol: "♎", symbolName: "The Scales", element: "air", modality: "cardinal",
    rulingPlanet: "Venus", dates: { start: "Sep 23", end: "Oct 22" },
    keywords: ["diplomatic", "harmonious", "indecisive"],
    description: {
      short: "Fair-minded, relational, seeks balance",
      long: "Libra thinks in terms of pairs — this and that, self and other, what's fair to both sides. Ruled by Venus, Libra is genuinely happiest in good company and works hard, sometimes invisibly hard, to keep relationships and rooms in balance.",
    },
    strengths: [
      "A real gift for seeing every side of a disagreement.",
      "Natural diplomacy that de-escalates tension before it boils over.",
      "An aesthetic sense that makes things (and relationships) feel considered.",
    ],
    motto: "I balance.",
    gifts: "Libra is the person who makes a room, a partnership, or a negotiation feel fair — genuinely, not performatively.",
    challenges: "Weighing every side can turn into never landing on one, and the drive for harmony can mean avoiding a necessary conflict for too long.",
    compatibleSigns: ["Gemini", "Aquarius", "Leo"],
  },
  {
    sign: "Scorpio", symbol: "♏", symbolName: "The Scorpion", element: "water", modality: "fixed",
    rulingPlanet: "Pluto", dates: { start: "Oct 23", end: "Nov 21" },
    keywords: ["intense", "perceptive", "transformative"],
    description: {
      short: "Intense, perceptive, all-or-nothing",
      long: "Scorpio doesn't do surface-level. Ruled by Pluto, Scorpio is drawn to what's underneath — the real motive, the hidden pattern, the thing nobody's saying out loud — and brings a level of focus to relationships and goals that can feel like gravity.",
    },
    strengths: [
      "Perceptiveness that reads a room's real dynamics, not just its surface.",
      "A resilience forged by actually going through hard things.",
      "Loyalty that's absolute once trust is earned.",
    ],
    motto: "I desire.",
    gifts: "Scorpio can sit with intensity — grief, transformation, hard truths — that other signs instinctively look away from, and come out the other side of it.",
    challenges: "Trust, once broken, is hard to rebuild, and Scorpio's instinct toward control can crowd out the vulnerability that real intimacy needs.",
    compatibleSigns: ["Cancer", "Pisces", "Virgo"],
  },
  {
    sign: "Sagittarius", symbol: "♐", symbolName: "The Archer", element: "fire", modality: "mutable",
    rulingPlanet: "Jupiter", dates: { start: "Nov 22", end: "Dec 21" },
    keywords: ["adventurous", "optimistic", "blunt"],
    description: {
      short: "Adventurous, philosophical, freedom-loving",
      long: "Sagittarius is always looking at the horizon. Ruled by Jupiter, Sagittarius wants more — more places, more ideas, more of the big picture — and says exactly what it thinks along the way, for better and occasionally for worse.",
    },
    strengths: [
      "An optimism that's earned, not naive — Sagittarius has usually seen enough to know things work out.",
      "Genuine intellectual curiosity that ranges wide.",
      "Honesty that people learn to actually trust.",
    ],
    motto: "I see.",
    gifts: "Sagittarius brings perspective — the reminder that the current problem is one part of a much bigger picture, which is often exactly what's needed.",
    challenges: "Bluntness can land as tactlessness, and the hunger for the next horizon can make it hard to stay committed to what's already in front of them.",
    compatibleSigns: ["Aries", "Leo", "Aquarius"],
  },
  {
    sign: "Capricorn", symbol: "♑", symbolName: "The Sea-Goat", element: "earth", modality: "cardinal",
    rulingPlanet: "Saturn", dates: { start: "Dec 22", end: "Jan 19" },
    keywords: ["disciplined", "ambitious", "responsible"],
    description: {
      short: "Disciplined, ambitious, quietly patient",
      long: "Capricorn plays the long game. Ruled by Saturn, Capricorn is comfortable doing the unglamorous work now for a payoff that might be years out — climbing steadily, the way its sea-goat symbol suggests, rather than sprinting and burning out.",
    },
    strengths: [
      "A work ethic that holds up when motivation doesn't.",
      "Genuine reliability — Capricorn does what it says it will.",
      "A dry sense of humor that surprises people who only see the discipline.",
    ],
    motto: "I use.",
    gifts: "Capricorn builds things that outlast a trend — a career, an institution, a reputation — through the kind of patience most signs run out of.",
    challenges: "Discipline can tip into being too hard on themselves (and others), and the instinct to handle everything alone can shut out help that was actually available.",
    compatibleSigns: ["Taurus", "Virgo", "Scorpio"],
  },
  {
    sign: "Aquarius", symbol: "♒", symbolName: "The Water-Bearer", element: "air", modality: "fixed",
    rulingPlanet: "Uranus", dates: { start: "Jan 20", end: "Feb 18" },
    keywords: ["independent", "inventive", "detached"],
    description: {
      short: "Independent, inventive, community-minded",
      long: "Aquarius thinks about the group even while insisting on its own individuality. Ruled by Uranus, Aquarius tends to see the system everyone else takes for granted and ask why it has to be that way — future-facing by instinct, sometimes at the cost of feeling fully present.",
    },
    strengths: [
      "Original thinking that isn't performed for effect — Aquarius genuinely sees things differently.",
      "A real commitment to fairness at the group/community level.",
      "Comfortable being the only one who disagrees.",
    ],
    motto: "I know.",
    gifts: "Aquarius pushes groups and systems toward what they could be, not just what they've always been — the person who asks the question nobody else thought to ask.",
    challenges: "Intellectual detachment can read as emotional distance, and the commitment to independence can make it hard to lean on other people.",
    compatibleSigns: ["Gemini", "Libra", "Sagittarius"],
  },
  {
    sign: "Pisces", symbol: "♓", symbolName: "The Fish", element: "water", modality: "mutable",
    rulingPlanet: "Neptune", dates: { start: "Feb 19", end: "Mar 20" },
    keywords: ["empathic", "imaginative", "dreamy"],
    description: {
      short: "Empathic, imaginative, boundary-dissolving",
      long: "Pisces closes the zodiac by dissolving its edges. Ruled by Neptune, Pisces absorbs the emotional weather of whatever room it's in, and channels that sensitivity into imagination, art, or a compassion that doesn't ask who deserves it first.",
    },
    strengths: [
      "Empathy deep enough to genuinely understand what someone else is feeling.",
      "An imagination that produces real creative work, not just daydreams.",
      "A forgiving nature that doesn't hold grudges the way other signs do.",
    ],
    motto: "I believe.",
    gifts: "Pisces brings compassion and imagination into spaces that badly need both, and often senses what's needed before anyone says it out loud.",
    challenges: "Absorbing everyone else's emotions can blur where Pisces ends and other people begin, and escapism can become a habit when reality gets to be too much.",
    compatibleSigns: ["Cancer", "Scorpio", "Taurus"],
  },
];

export function getZodiacSignProfile(sign: ZodiacSign): ZodiacSignProfile {
  const profile = ZODIAC_SIGN_PROFILES.find((p) => p.sign === sign);
  if (!profile) throw new Error(`No sign profile for ${sign}`);
  return profile;
}
