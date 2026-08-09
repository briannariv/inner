// STARTER CONTENT — per SPEC.md §6 decision, astrology interpretation copy
// is meant to be authored/refined by the founder (this is their area of
// expertise). What's here is minimal keyword scaffolding just so the
// compose engine and the interactive chart UI have real text to render
// end-to-end; treat every string below as a placeholder to rewrite in your
// own voice, not final content.
import type { AspectType, ChartAngleName, Planet, ZodiacSign } from "@inner/shared";

export const PLANET_KEYWORDS: Record<Planet, string> = {
  Sun: "your core identity and vitality",
  Moon: "your emotional needs and instinctive reactions",
  Mercury: "how you think and communicate",
  Venus: "what you value and how you love",
  Mars: "how you assert yourself and take action",
  Jupiter: "where you seek growth and meaning",
  Saturn: "where you take on responsibility and discipline",
  Uranus: "where you seek freedom and disruption",
  Neptune: "where you dream, idealize, or dissolve boundaries",
  Pluto: "where you transform through intensity",
  NorthNode: "the direction you're growing toward this lifetime",
  Chiron: "where your deepest wound holds your greatest gift",
};

export const SIGN_KEYWORDS: Record<ZodiacSign, string> = {
  Aries: "direct, initiating energy",
  Taurus: "steady, grounded, sensory energy",
  Gemini: "curious, quick, communicative energy",
  Cancer: "protective, feeling-led energy",
  Leo: "expressive, warm, self-assured energy",
  Virgo: "precise, discerning, service-oriented energy",
  Libra: "relational, balance-seeking energy",
  Scorpio: "intense, probing, transformative energy",
  Sagittarius: "expansive, freedom-seeking, philosophical energy",
  Capricorn: "disciplined, ambitious, structure-building energy",
  Aquarius: "independent, unconventional, future-oriented energy",
  Pisces: "dreamy, empathic, boundary-dissolving energy",
};

export const HOUSE_KEYWORDS: Record<number, string> = {
  1: "how you present yourself and meet the world",
  2: "your resources, values, and sense of security",
  3: "communication, learning, and your immediate environment",
  4: "home, roots, and your inner foundation",
  5: "creativity, romance, and self-expression",
  6: "daily routine, work, and health",
  7: "one-to-one partnership",
  8: "shared resources, intimacy, and transformation",
  9: "belief, higher learning, and long-distance horizons",
  10: "career, public role, and reputation",
  11: "community, friendship, and future vision",
  12: "the unconscious, retreat, and what's hidden",
};

export const ASPECT_KEYWORDS: Record<AspectType, string> = {
  conjunction: "fuses directly with",
  trine: "flows easily with",
  sextile: "opens an opportunity with",
  square: "creates productive friction with",
  opposition: "pulls into balance against",
  quincunx: "asks for ongoing adjustment with",
};

export const ANGLE_KEYWORDS: Record<ChartAngleName, string> = {
  Ascendant: "how you meet the world on first impression — your instinctive interface, not necessarily your core identity",
  Midheaven: "your public role and the direction your life's work points toward",
  Vertex: "a point often tied to encounters and turning points that feel handed to you rather than chosen",
  AntiVertex: "the counterpart to your Vertex — points toward what grounds you after those handed-to-you turning points",
  SouthNode: "the instincts and patterns that come easily because they're familiar — comfortable, but not where your growth edge is (that's the North Node)",
};
