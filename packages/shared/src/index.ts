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
    | { kind: "hdChannel"; gates: [number, number] }
    | { kind: "angle"; angle: ChartAngleName };
}

export interface InterpretationResult {
  headline: string;
  body: string;
}

// ---- Compatibility / synastry ----

// Which of the 36 HD channels connect two people, and how:
//  - companionship: both people independently have the full channel
//  - electromagnetic: neither has it alone, but together the two gates complete it
//  - dominance: one person has the full channel, the other has neither gate
export type HDConnectionType = "companionship" | "electromagnetic" | "dominance";

export interface HDConnectionChannel {
  gates: [number, number];
  name: string;
  type: HDConnectionType;
  dominantPerson?: "A" | "B"; // set only when type is "dominance"
}

export interface CompatibilityPerson {
  name: string;
  birthData: BirthData;
}

export interface CompatibilityRequest {
  personA: CompatibilityPerson;
  personB: CompatibilityPerson;
}

export interface CompatibilityResult {
  personA: { name: string; chart: ChartBundle };
  personB: { name: string; chart: ChartBundle };
  // Cross-chart aspects — by convention `a` is always personA's planet,
  // `b` is always personB's planet (matches computeCrossAspects(A, B)).
  synastryAspects: Aspect[];
  hdConnections: HDConnectionChannel[];
  summary: InterpretationResult;
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

// ---- Methodology & sources ----
// A single tappable answer to "where does this come from" — surfaced from
// the Learn tab. Kept as one formatted string (not structured data) since
// its only consumer is the same headline/body interpretation panel every
// other tap-to-learn interaction in the app already uses.
export const METHODOLOGY_SOURCES_HEADLINE = "Sources & methodology";

export const METHODOLOGY_SOURCES_BODY =
  "ASTROLOGY METHODOLOGY\n" +
  "Interpretations use Hellenistic technique, not modern psychological astrology: Whole Sign houses, " +
  "sect (day/night chart), essential dignity (domicile / exaltation / detriment / fall), planetary joy, " +
  "and house angularity, plus the traditional chart ruler. Primary references: Chris Brennan, " +
  "\"Hellenistic Astrology: The Study of Fate and Fortune\" (Amor Fati Publications, 2017); Demetra " +
  "George, \"Ancient Astrology in Theory and Practice\"; Vettius Valens' Anthology (2nd c. CE, Riley/" +
  "Schmidt translations); Dorotheus of Sidon's Carmen Astrologicum (trans. Benjamin Dykes); Ptolemy's " +
  "Tetrabiblos. Sign/planet/house keyword copy is the founder's own writing, refined against these " +
  "sources.\n\n" +
  "CHART MATH\n" +
  "Planetary positions come from the Swiss Ephemeris (Astrodienst AG), via the open-source `sweph` " +
  "Node bindings running in Moshier analytic mode — no external API calls at request time. Validated " +
  "against NASA JPL Horizons: 0.22 arcsecond mean deviation across a 210-position/21-chart sample. " +
  "Birth-instant timezone resolution uses the IANA tz database (`geo-tz` + `luxon`), not server-local " +
  "time. Astrocartography lines are computed directly from these same ephemeris positions via " +
  "spherical astronomy, not a third-party astrocartography API.\n\n" +
  "HUMAN DESIGN\n" +
  "System structure (centers, the 64 gates, the 36 channels, Type/Authority/Profile mechanics) follows " +
  "Ra Uru Hu's original Human Design System teaching. Gate activations use the documented Rave Mandala " +
  "formula: ecliptic longitude to gate/line (58° offset, 5.625° per gate, 0.9375° per line), with the " +
  "unconscious/\"Design\" activations computed at the Sun's -88° solar arc via root-finding, not a fixed " +
  "88-day approximation. Gate-center and channel assignments were cross-checked against " +
  "dturkuler/humandesign_api, an independent open-source implementation, and matched on all 36 " +
  "channels and 64 gate-center pairs. Gate keynote names combine the traditional I Ching hexagram name " +
  "(Wilhelm/Baynes translation lineage, public domain) with the short HD keynote phrase used across " +
  "independent HD literature — system nomenclature, not one author's proprietary text. Gate/channel/" +
  "center/Type/Authority descriptive copy is a first-pass draft written for founder review, not yet " +
  "final content; astrology copy is the founder's own.\n\n" +
  "COMPATIBILITY\n" +
  "Synastry aspects reuse the same aspect-orb math as the natal chart, applied cross-chart. Human " +
  "Design connections (companionship / electromagnetic / dominance) are computed from both charts' raw " +
  "gate activations, not a third-party synastry API.";
// Full 64-gate content library for the "tap a gate, learn what it means"
// feature. Gate numbers and center placements are the public-domain
// structure of the system (see hd/reference.ts's sourcing note); the
// keynote names below combine each gate's traditional I Ching hexagram name
// (the Wilhelm/Baynes translation lineage, itself a 3,000-year-old public
// domain text) with the short HD "keynote" phrase Ra Uru Hu's original
// Human Design teaching attached to each gate — these keynote pairings are
// system nomenclature repeated across virtually every independent HD book
// and course (Ra Uru Hu, Lynda Bunnell, Chetan Parkyn, Karen Curry Parker),
// the way "Aries the Ram" is repeated across every astrology book, not a
// single author's proprietary text.
//
// The description/shadow prose in every entry below is original writing,
// not copied or paraphrased from any single source — it's a first-pass
// draft (same status as humanDesignContent.ts's center/type/authority
// copy: Claude-authored for founder review, not yet final content) aiming
// to compress each gate's well-established thematic territory into a
// couple of honest, non-mystical sentences.

export interface HDGateProfile {
  gate: number;
  name: string; // short HD keynote
  iChingName: string; // traditional hexagram name
  center: HDCenterName;
  description: string;
  shadow: string;
}

export const HD_GATE_PROFILES: HDGateProfile[] = [
  { gate: 1, name: "Creative self-expression", iChingName: "The Creative", center: "G",
    description: "The drive to express something uniquely your own — an original creative impulse that doesn't wait for consensus before it moves. Genuine, it invites the world to witness a personal signature, not a copy of anyone else's.",
    shadow: "Under pressure it can tip into needing to be different for its own sake, rather than trusting what naturally wants to come through." },
  { gate: 2, name: "Innate direction", iChingName: "The Receptive", center: "G",
    description: "A deep, quiet knowing of the direction a life is meant to move in — receptive rather than willful. It doesn't push; it orients, the way a compass doesn't create north but points toward it.",
    shadow: "Cut off from that inner sense of direction, it can default to wandering or letting other people's agendas set the course." },
  { gate: 3, name: "Ordering out of chaos", iChingName: "Difficulty at the Beginning", center: "Sacral",
    description: "The energy of genuine new beginnings — sorting real order out of the mess any true start involves, mutating old forms into workable new ones through trial and error.",
    shadow: "Impatience with the mess of a real beginning can push toward forcing premature order before a workable form has actually emerged." },
  { gate: 4, name: "Answers and formulas", iChingName: "Youthful Folly", center: "Ajna",
    description: "A mind that wants to turn confusion into a workable answer — formulating logical explanations for how things fit together, even while the true cause is still genuinely uncertain.",
    shadow: "The pressure to have an answer can produce a confident-sounding formula that's actually just a guess mistaken for certainty." },
  { gate: 5, name: "Natural rhythm", iChingName: "Waiting", center: "Sacral",
    description: "A body that runs on a steady, patient internal rhythm and does best when life is allowed to unfold at that pace rather than being rushed.",
    shadow: "Life rarely cooperates with anyone's fixed rhythm, and the frustration of a broken pattern can read as rigidity to people who don't share it." },
  { gate: 6, name: "Intimacy through friction", iChingName: "Conflict", center: "Solar Plexus",
    description: "The gate of friction as a gateway to intimacy — conflict here isn't dysfunction, it's often the actual mechanism through which real closeness gets negotiated and tested.",
    shadow: "Without emotional clarity, friction can escalate for its own sake instead of doing the bonding work it's actually for." },
  { gate: 7, name: "Leadership through example", iChingName: "The Army", center: "G",
    description: "A quiet, non-authoritarian style of leadership — setting direction by example and interaction rather than command, shaping the larger pattern a group or era moves toward.",
    shadow: "Leadership offered before it's recognized or invited can be ignored, or worse, resented as presumption." },
  { gate: 8, name: "Individual contribution", iChingName: "Holding Together", center: "Throat",
    description: "The urge to contribute something genuinely your own to a shared creative direction — style and originality offered in service of a larger pattern, not performed in isolation.",
    shadow: "Contribution can curdle into needing credit or applause for it, rather than caring whether it actually served the group." },
  { gate: 9, name: "Focused energy for detail", iChingName: "The Taming Power of the Small", center: "Sacral",
    description: "The capacity to concentrate scattered energy into small, precise, patient effort — the discipline that finishes the detail everyone else skipped.",
    shadow: "Concentration under pressure can tip into fixation, unable to let a small detail go even once it's no longer useful." },
  { gate: 10, name: "Self-love and authentic behavior", iChingName: "Treading", center: "G",
    description: "The foundation gate of self-love — behaving in a way that's authentically your own, which naturally earns real respect rather than requiring you to adjust to be liked.",
    shadow: "Without real self-acceptance, this can flip into either rigid self-righteousness or people-pleasing self-erasure." },
  { gate: 11, name: "Ideas seeking expression", iChingName: "Peace", center: "Ajna",
    description: "A steady stream of ideas and possibilities generated for the pleasure of sharing them — the storyteller's gate, more interested in an idea's beauty than in whether it gets acted on.",
    shadow: "Not every idea is meant to become action; the shadow here is mistaking every appealing idea for a mandate to pursue it." },
  { gate: 12, name: "Cautious articulation", iChingName: "Standstill", center: "Throat",
    description: "A voice that needs the right emotional moment to speak truly — when timing is right, this gate produces genuinely moving, articulate expression; forced, it goes silent or garbled.",
    shadow: "Social anxiety or self-consciousness can silence real expression even when the underlying feeling is worth voicing." },
  { gate: 13, name: "The listener, keeper of secrets", iChingName: "Fellowship with Men", center: "G",
    description: "A natural confidant others bring their private histories to — this gate listens for the patterns underneath individual stories, gathering a wide view of the human condition over time.",
    shadow: "Holding everyone's secrets can tip into either gossip, or the private frustration of a witness nobody actually asks to lead." },
  { gate: 14, name: "Resources through competence", iChingName: "Possession in Great Measure", center: "Sacral",
    description: "Sacral power directed by skill into real material resources — the capacity to generate wealth by being genuinely excellent at what you do.",
    shadow: "Success built on skill can slide into being defined entirely by output and possessions rather than by the competence underneath them." },
  { gate: 15, name: "The rhythm of extremes", iChingName: "Modesty", center: "G",
    description: "A love of humanity in all its variety, expressed through swings between extremes of activity and rest, engagement and withdrawal — embracing very different people and moods without judgment.",
    shadow: "Unchecked, its natural extremity can read as erratic or unreliable to people expecting steadier rhythms." },
  { gate: 16, name: "Enthusiasm and mastery through practice", iChingName: "Enthusiasm", center: "Throat",
    description: "Talent developed into real skill through genuine enthusiasm and repeated practice — this gate believes competence is earned by doing something again and again until it's real.",
    shadow: "Enthusiasm without the follow-through of actual practice can produce overconfidence that outruns real skill." },
  { gate: 17, name: "Opinions and logical patterns", iChingName: "Following", center: "Ajna",
    description: "A mind that organizes experience into clear opinions and logical patterns, useful for planning and organizing — most valuable offered as one perspective among others, not the final word.",
    shadow: "Certainty in an opinion can outpace the evidence for it, especially when it isn't tested against other views." },
  { gate: 18, name: "Correction toward a better standard", iChingName: "Work on What Has Been Spoiled", center: "Spleen",
    description: "An instinct for spotting what's flawed or could be improved, driven by a felt sense of a better standard — genuinely useful for fixing what's broken, in a person, a system, or a habit.",
    shadow: "The eye for flaws can turn into chronic criticism, of others or of yourself, disconnected from any actual plan to fix anything." },
  { gate: 19, name: "Sensitivity to what's needed", iChingName: "Approach", center: "Root",
    description: "A fine sensitivity to what others need and a drive to secure resources for the group — attuned to the emotional and material requirements of belonging.",
    shadow: "That sensitivity can turn into anxious neediness — seeking approval or inclusion rather than trusting that connection is already secure." },
  { gate: 20, name: "Presence and spontaneous action", iChingName: "Contemplation", center: "Throat",
    description: "The gate of the present moment — awareness and action arising together, without the delay of extended deliberation, translating what's true right now directly into speech or action.",
    shadow: "Acting purely in the now, without waiting for real clarity, can produce reactive words or choices that don't hold up in hindsight." },
  { gate: 21, name: "Control over material resources", iChingName: "Biting Through", center: "Heart",
    description: "A drive to take control of one's own material domain — managing resources, territory, or people with a hunter's directness, most effective when the domain is genuinely one's own to run.",
    shadow: "That same drive misapplied to someone else's domain reads as controlling rather than capable." },
  { gate: 22, name: "Emotional grace in social spaces", iChingName: "Grace", center: "Solar Plexus",
    description: "Social charisma powered by emotional depth — when the mood is genuinely right, this gate brings a warmth and grace to a room that people feel and remember.",
    shadow: "The same emotional dependency means a bad mood can just as easily sour a room, since the charisma isn't separable from the underlying wave." },
  { gate: 23, name: "Individual insight, simply spoken", iChingName: "Splitting Apart", center: "Throat",
    description: "Genuinely original insight that's ahead of what the room is ready to hear — the art of this gate is finding simple enough language that the insight can actually be assimilated, not dismissed as strange.",
    shadow: "Insight delivered at the wrong moment or in the wrong words gets written off as eccentric rather than valuable." },
  { gate: 24, name: "Returning to an idea until it resolves", iChingName: "Return", center: "Ajna",
    description: "A mind that circles back to the same question or realization repeatedly, each pass refining it further — real insight often does arrive this way, through return rather than a single flash.",
    shadow: "The same circling can become rumination, replaying a thought without ever actually landing on the resolution it's chasing." },
  { gate: 25, name: "Universal love, innocent of agenda", iChingName: "Innocence", center: "G",
    description: "A love that includes the self as part of a larger whole — not romantic or personal love, but something closer to spiritual acceptance, offered without needing anything back.",
    shadow: "Life inevitably tests that innocence, and the wound here often looks like feeling singled out or unfairly treated by fate." },
  { gate: 26, name: "Persuasion and the art of the story", iChingName: "The Taming Power of the Great", center: "Heart",
    description: "The gift of the salesperson and storyteller — willpower channeled into persuasion, often through a slightly embellished but essentially true version of events that makes the message land.",
    shadow: "The embellishment can shade into outright manipulation or false confidence when the willpower outruns the honesty." },
  { gate: 27, name: "Caretaking and responsible nourishment", iChingName: "Nourishment", center: "Sacral",
    description: "A sacral instinct oriented toward caretaking — nourishing and looking after others (and yourself), attentive to what a person or situation actually needs in order to thrive.",
    shadow: "Caretaking directed outward without limits can become self-neglect, or inadvertently foster dependency instead of real strength in the people cared for." },
  { gate: 28, name: "The search for a meaningful risk", iChingName: "Preponderance of the Great", center: "Spleen",
    description: "A drive to find what makes life worth the risk — willing to gamble, even with mortality itself, in pursuit of something that feels genuinely meaningful rather than merely safe.",
    shadow: "Without a cause that actually matters, the same appetite for risk can turn reckless or purposeless." },
  { gate: 29, name: "Commitment and the power of yes", iChingName: "The Abysmal (Water)", center: "Sacral",
    description: "The Sacral's power to commit — saying a full-bodied yes to an experience and following it all the way through, even into real difficulty, because persistence itself is the gift.",
    shadow: "The habit of saying yes can outrun discernment, committing to things that were never worth the follow-through." },
  { gate: 30, name: "Desire and the fire of feeling", iChingName: "The Clinging Fire", center: "Solar Plexus",
    description: "Intense emotional desire and the fantasies that come with it — a fire that seeks new experience and meaning, often ahead of any concrete plan for how to get there.",
    shadow: "Desire without the emotional clarity to act on it can burn as restlessness, a longing that never resolves into anything real." },
  { gate: 31, name: "Leadership by consensus", iChingName: "Influence", center: "Throat",
    description: "A voice built to lead — but this leadership only lands when it's actually recognized and given by the group, not seized on the leader's own initiative.",
    shadow: "Leading without that collective recognition, however well-intentioned, tends to be experienced as imposition rather than guidance." },
  { gate: 32, name: "Instinct for what will last", iChingName: "Duration", center: "Spleen",
    description: "A gut-level sense for which ventures, relationships, or ideas have the staying power to endure, paired with a fear of failure that — used well — is actually useful risk-sensing.",
    shadow: "That fear of failure, unmanaged, can calcify into avoiding change altogether, even change that was clearly needed." },
  { gate: 33, name: "Retreat, reflection, and eventual telling", iChingName: "Retreat", center: "Throat",
    description: "The wisdom that comes from stepping back from experience and reflecting on it privately before speaking — this gate's stories and insights are worth the wait for real processing time.",
    shadow: "Retreat can tip into isolation or secrecy that outlasts its usefulness, withholding a story long after the reflection is done." },
  { gate: 34, name: "Raw, self-sufficient power", iChingName: "The Power of the Great", center: "Sacral",
    description: "Pure, undirected sacral power — the single biggest reservoir of raw life-force energy in the whole system, most effective simply responding to what's already in motion rather than initiating on its own.",
    shadow: "That much power self-directed instead of responsive can dominate a room without ever checking whether it should." },
  { gate: 35, name: "Hunger for new experience", iChingName: "Progress", center: "Throat",
    description: "An appetite for progress through varied experience — this gate wants to feel like it's moving forward, collecting a breadth of life it can later draw on and recount.",
    shadow: "The hunger for the next new thing can leave experiences half-digested, chased for novelty rather than actually metabolized into wisdom." },
  { gate: 36, name: "Emotional experience through crisis", iChingName: "Darkening of the Light", center: "Solar Plexus",
    description: "A drive toward new emotional experience, often arriving through turbulence or crisis rather than calm — this gate learns humanity's more intense territory firsthand.",
    shadow: "Chasing the intensity itself, rather than the growth it can produce, can manufacture unnecessary crisis." },
  { gate: 37, name: "The glue of community and family", iChingName: "The Family", center: "Solar Plexus",
    description: "The bonding gate — built on mutual agreements, tradition, and the warmth of shared meals and shared history, this is what holds families, friend groups, and communities together over time.",
    shadow: "The need for harmony and reciprocity can slide into keeping score, or avoiding the honest friction real intimacy sometimes needs." },
  { gate: 38, name: "The fight for what matters", iChingName: "Opposition", center: "Root",
    description: "A willingness to oppose and struggle for something that's genuinely worth fighting for — purpose found through resistance, not despite it.",
    shadow: "Without a cause that actually matters, this gate can pick fights simply because opposition itself has become the habit." },
  { gate: 39, name: "Provocation that reveals what's real", iChingName: "Obstruction", center: "Root",
    description: "A gift for provoking — deliberately or not — the emotional or spiritual reactions that separate what's genuinely nourishing for someone from what only looks that way.",
    shadow: "The provocation can be received as simple negativity or contrarianism if the deeper point it's testing for goes unrecognized." },
  { gate: 40, name: "Working hard, then resting alone", iChingName: "Deliverance", center: "Heart",
    description: "Willpower that delivers real value to a community, paired with a genuine need for solitude afterward to recover — this gate needs alone time as much as it needs to contribute.",
    shadow: "Guilt about needing that solitude can push toward overcommitting past the point of actually being able to deliver." },
  { gate: 41, name: "The pressure to begin something new", iChingName: "Decrease", center: "Root",
    description: "The starting gate of the whole Human Design wheel — a felt pressure of longing and imagination, contracting current resources in anticipation of a new cycle of experience about to begin.",
    shadow: "That longing, before it has a real direction, can feel like restless dissatisfaction with no clear object." },
  { gate: 42, name: "Completion and closing a cycle well", iChingName: "Increase", center: "Root",
    description: "The gate that closes out a cycle of experience properly, extracting the growth from what was just lived through before moving on to whatever's next.",
    shadow: "Rushing past an ending without actually processing it can mean repeating the same cycle again, having skipped the growth it offered." },
  { gate: 43, name: "Sudden, individual insight", iChingName: "Breakthrough", center: "Ajna",
    description: "Insight that arrives all at once, from an internal, non-linear process that doesn't announce its reasoning — genuinely original, but hard to explain in the moment it lands.",
    shadow: "Unexplainable certainty can come across as stubbornness or arrogance to people who expect to see the reasoning behind it." },
  { gate: 44, name: "Instinct for people and patterns", iChingName: "Coming to Meet", center: "Spleen",
    description: "A sharp instinctive memory for people and situations — recognizing patterns from the past well enough to sense, almost immediately, whether someone or something is a good fit.",
    shadow: "That fast pattern-matching can also default to old prejudice, mistaking a surface resemblance for the real thing." },
  { gate: 45, name: "The gate of the tribal king or queen", iChingName: "Gathering Together", center: "Throat",
    description: "A natural sense of ownership over shared resources and a voice built to gather and direct a community's material wealth toward its collective good.",
    shadow: "That sense of ownership can tip into hoarding, or a top-down bossiness that stops feeling like stewardship and starts feeling like control." },
  { gate: 46, name: "Love of the physical body, and right timing", iChingName: "Pushing Upward", center: "G",
    description: "A deep, embodied love of being alive in a physical body, and a knack for ending up in the right place at the right time through sheer determination rather than planning.",
    shadow: "Disconnected from the body, this can show up as either body-image struggle or a restless sense of always being in the wrong place." },
  { gate: 47, name: "Making sense of the past", iChingName: "Oppression", center: "Ajna",
    description: "A mind that gathers fragments of past experience and eventually — sometimes after real mental pressure — assembles them into a realization that clarifies the whole picture.",
    shadow: "Before the realization arrives, the accumulated confusion can feel genuinely oppressive, like a puzzle with no visible solution." },
  { gate: 48, name: "Depth of knowledge, and the fear of inadequacy", iChingName: "The Well", center: "Spleen",
    description: "A well of natural depth and talent to draw from when a real problem shows up — this gate's fear (whether the well is actually deep enough) is often what drives it to keep developing real expertise.",
    shadow: "That fear can also produce chronic self-doubt that undersells genuinely adequate depth and talent." },
  { gate: 49, name: "Principles for relationship and belonging", iChingName: "Revolution", center: "Solar Plexus",
    description: "Strong emotional principles about what makes a relationship or community fair — willing to revolt against or exit an arrangement that violates them, in defense of a better one.",
    shadow: "Rigid application of those principles, without room for context, can end relationships that might have survived a little more flexibility." },
  { gate: 50, name: "The values that hold a community together", iChingName: "The Cauldron", center: "Spleen",
    description: "An instinctive sense of the values and norms that keep a group healthy — this gate is often the one that notices, and enforces, when something in the tribe's basic fairness is off.",
    shadow: "Enforcing values can slide into rigid moralizing that polices others more than it actually nurtures the group." },
  { gate: 51, name: "Competitive shock that wakes you up", iChingName: "The Arousing (Shock)", center: "Heart",
    description: "A taste for sudden shock and competition as a way of testing and awakening the self — this gate wants to be first, and treats disruption as a legitimate path to growth.",
    shadow: "Chasing shock for its own sake, without a real growth purpose behind it, can just as easily read as recklessness or one-upmanship." },
  { gate: 52, name: "Focused stillness", iChingName: "Keeping Still, Mountain", center: "Root",
    description: "The capacity for real, mountain-like stillness — restraining scattered motion long enough to concentrate fully on one thing, a discipline that underlies serious focused work.",
    shadow: "Forced stillness (rather than genuine focus) can just as easily read as restless frustration or repressed tension." },
  { gate: 53, name: "The urge to start, not finish", iChingName: "Development", center: "Sacral",
    description: "The energy to begin new cycles of experience — this gate is genuinely gifted at starting things, though finishing them is usually someone else's job in the larger process.",
    shadow: "Restlessly starting one thing after another, without seeing enough through, can leave a trail of unfinished beginnings." },
  { gate: 54, name: "Ambition to rise through legitimate means", iChingName: "The Marrying Maiden", center: "Root",
    description: "A drive to rise — materially, socially, spiritually — that works best channeled through legitimate relationships and established structures rather than shortcuts.",
    shadow: "Naked ambition, stripped of the relationships that were supposed to carry it, can look transactional or purely self-serving." },
  { gate: 55, name: "The freedom to feel the full emotional range", iChingName: "Abundance", center: "Solar Plexus",
    description: "A wide emotional range, moving between real highs and real lows — this gate's abundance is spirit itself, and its work is trusting the wave rather than needing to feel good all the time.",
    shadow: "Resisting the lows, or being ashamed of them, cuts off the very emotional range this gate is actually built to hold." },
  { gate: 56, name: "The storyteller's restless curiosity", iChingName: "The Wanderer", center: "Throat",
    description: "A restless appetite for new stimulation and experience, turned into stories that entertain and stimulate other people in turn — the gate of the wanderer who comes home with something worth telling.",
    shadow: "The restlessness can outrun the storytelling, chasing the next stimulation before the last experience is even digested." },
  { gate: 57, name: "In-the-moment intuitive clarity", iChingName: "The Gentle, Penetrating (Wind)", center: "Spleen",
    description: "Sharp, present-tense intuition — a clear instinctive read on what's safe and right-timed right now, arriving instantly rather than through reasoning.",
    shadow: "Fear or noise can drown out that quiet intuitive signal, especially since it only ever speaks once, softly, in the moment." },
  { gate: 58, name: "Joyful vitality and the drive to improve", iChingName: "The Joyous (Lake)", center: "Root",
    description: "A restless, joyful vitality — dissatisfaction used productively, always looking for what could be better and genuinely energized by improving it.",
    shadow: "Unchecked, the same restlessness can read as never being satisfied with anything as it actually is." },
  { gate: 59, name: "Breaking down barriers for intimate bonding", iChingName: "Dispersion", center: "Sacral",
    description: "A sacral drive toward intimacy — breaking down the social barriers between people in service of bonding, reproduction, and genuine closeness.",
    shadow: "That same barrier-breaking instinct, without real intimacy behind it, can read as manipulative or purely strategic." },
  { gate: 60, name: "Accepting limitation as the seed of innovation", iChingName: "Limitation", center: "Root",
    description: "The gate of accepting real limits — not as defeat, but as the actual constraint that forces genuine innovation, the way a river's banks are what give it force and direction.",
    shadow: "Resisting limitation altogether, rather than working within it, can waste the very pressure that would have produced something new." },
  { gate: 61, name: "The pressure to know", iChingName: "Inner Truth", center: "Head",
    description: "A mental pressure to know — to understand the deepest, most unprovable truths — that drives genuine inspiration even though the answers, by nature, stay partly mysterious.",
    shadow: "Needing a final, certain answer to fundamentally unanswerable questions can produce anxious, circular overthinking." },
  { gate: 62, name: "Precise, factual expression", iChingName: "Preponderance of the Small", center: "Throat",
    description: "A gift for precise, detailed, factual expression — this gate translates a felt sense or intuition into concrete words and specifics other people can actually act on.",
    shadow: "Over-focus on detail can bury the larger point, or substitute precision for the courage to say something less certain but more essential." },
  { gate: 63, name: "Doubt that sharpens the mind", iChingName: "After Completion", center: "Head",
    description: "A mental pressure toward doubt and questioning, testing patterns and past experience for what's actually reliable — a healthy skepticism that keeps thinking honest.",
    shadow: "Unchecked, that doubt can undermine trust in things (or people) that were genuinely trustworthy, out of sheer habit of questioning." },
  { gate: 64, name: "Confusion before a new pattern crystallizes", iChingName: "Before Completion", center: "Head",
    description: "A mental pressure of confusion — the buzz of unprocessed past impressions waiting to resolve into a new, coherent pattern of understanding, arriving only after the confusion is genuinely sat with.",
    shadow: "Rushing to resolve the confusion prematurely can produce a pattern that looks tidy but doesn't actually hold up." },
];

const BY_GATE = new Map(HD_GATE_PROFILES.map((g) => [g.gate, g]));

export function getHDGateProfile(gate: number): HDGateProfile | undefined {
  return BY_GATE.get(gate);
}
