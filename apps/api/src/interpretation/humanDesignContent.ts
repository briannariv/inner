// DRAFT CONTENT — per SPEC.md §6 decision, this is a first-pass Human
// Design template library written by Claude using general reference
// knowledge, specifically so the founder (whose HD fluency is still
// growing) has something concrete to review, correct, and approve before
// any of it reaches real users. Do not treat this as authoritative HD
// teaching until it's been reviewed.
import type { HDAuthority, HDCenterName, HDType } from "@inner/shared";

export const TYPE_DESCRIPTIONS: Record<HDType, string> = {
  Generator:
    "Your Sacral Center is defined — you have consistent, sustainable life-force energy available " +
    "when you're doing work that lights you up. Your strategy is to respond rather than initiate: " +
    "wait for something in your environment to react to, and let your gut (a felt 'yes' or 'no' in the body) guide you.",
  "Manifesting Generator":
    "Like a Generator, you have a defined Sacral and thrive by responding — but your energy also moves in " +
    "quick, multi-track bursts, often skipping steps others assume are necessary. Respond first, then inform " +
    "people before you pivot, so your speed doesn't read as unpredictability to others.",
  Manifestor:
    "You're built to initiate — you have a defined motor center (Heart, Solar Plexus, or Root) connected to " +
    "your Throat, giving you the power to act independently. Your strategy is to inform those affected before " +
    "you act, which lowers resistance without asking permission.",
  Projector:
    "You don't have consistent sacral energy, so pacing yourself matters more for you than for most types. " +
    "Your gift is seeing systems and people clearly. Your strategy is to wait for recognition and invitation " +
    "before stepping into major roles, relationships, or direction — being invited in is what makes your " +
    "insight land instead of being resisted.",
  Reflector:
    "You have no centers consistently defined, which makes you a sensitive mirror of the people and " +
    "environment around you. Your strategy is to wait a full lunar cycle (about 28 days) before major " +
    "decisions, sampling how a choice feels across different days rather than deciding in the moment.",
};

export const AUTHORITY_DESCRIPTIONS: Record<HDAuthority, string> = {
  Emotional:
    "Your Solar Plexus is defined, which means clarity comes in waves, not instantly. There is no true 'now' " +
    "for you on important decisions — ride the emotional wave and decide once it settles, not at a high or a low.",
  Sacral:
    "Your gut response is your compass. In-the-moment body 'yes/no' reactions (often heard as sounds more " +
    "than words) are more trustworthy for you than mentally reasoning a decision out.",
  Splenic:
    "Your authority is a quiet, in-the-moment instinct — a single quiet signal about safety or fit that " +
    "doesn't repeat itself. It speaks once, softly, and is easy to talk yourself out of if you overthink it.",
  Ego:
    "Your authority runs through willpower and what you have the heart/drive to commit to — a valid 'I want this " +
    "and I'll make good on it' carries real weight for you, more than what merely seems logical.",
  "Self-Projected":
    "Clarity comes through hearing yourself talk it out loud, ideally with a trusted listener rather than a " +
    "silent thinker — you find your truth in your own voice, not before you speak.",
  Mental:
    "You process best externally, by talking things through with the right sounding boards, rather than by " +
    "an internal bodily signal — the absence of an inner authority is itself the design, not a gap to fix.",
  Lunar:
    "As a Reflector your authority is the full lunar cycle itself — no single moment or person gives you a " +
    "reliable answer; the pattern across roughly a month does.",
};

export const CENTER_DESCRIPTIONS: Record<HDCenterName, { defined: string; undefined: string }> = {
  Head: {
    defined: "You have consistent mental pressure and inspiration — questions and ideas that press outward reliably.",
    undefined: "You take in and amplify the questions and inspiration of others rather than generating your own pressure to think — open to many perspectives, but can spiral in others' mental pressure if not aware.",
  },
  Ajna: {
    defined: "You process and form opinions in a fixed, consistent way — your way of making sense of things is reliable and doesn't need outside validation.",
    undefined: "You're flexible and open-minded about how to think and understand — able to see many logics as valid, but vulnerable to feeling pressured into certainty you don't actually have.",
  },
  Throat: {
    defined: "You have a reliable, consistent way of expressing and acting in the world — your voice and action naturally translate other definition into the world.",
    undefined: "You're adaptable in how you communicate and act, picking up others' styles of expression — powerful when timing is right, but can lead to talking just to be seen if not aware.",
  },
  G: {
    defined: "You have a fixed sense of identity, direction, and who you love — a stable inner compass for who you are and where you're going.",
    undefined: "Your sense of identity and direction is more fluid, shifting with the people and environments around you — able to adapt into many roles, but can lose your own thread if not anchored by other defined centers.",
  },
  Heart: {
    defined: "You have consistent willpower and the drive to prove yourself through commitment — your word and your effort are dependable currency.",
    undefined: "Your willpower is inconsistent — capable of great drive in bursts, but not built to constantly prove your worth; the not-self trap here is over-promising to feel valuable.",
  },
  Sacral: {
    defined: "You carry a steady well of life-force/work energy — the capacity to sustain effort day after day when the work is right for you.",
    undefined: "You don't have consistent access to that sustained work-energy — you can access powerful bursts by amplifying others' sacral energy, but need real rest, which not-self conditioning often overrides.",
  },
  Spleen: {
    defined: "You have a consistent, instinctual sense of what's safe, healthy, and right-timed for you — a quiet, reliable radar for well-being.",
    undefined: "Your sense of safety and well-being is more responsive to your environment — sensitive to others' fear and anxiety, and prone to holding onto things (people, habits) past their healthy point.",
  },
  "Solar Plexus": {
    defined: "You run on an emotional wave — your feelings move through highs and lows and clarity comes from riding that wave over time, not in the moment.",
    undefined: "You're emotionally sensitive to others' feelings without generating a consistent wave of your own — deeply empathic, but prone to conflict-avoidance or absorbing others' emotional weather as your own.",
  },
  Root: {
    defined: "You have a consistent source of drive and pressure to get things done — a reliable engine for handling stress and adrenaline.",
    undefined: "Pressure and urgency come and go for you rather than running constantly — you can handle bursts of pressure well, but chronic stress/rushing (often absorbed from others) wears on you more than it does on those with this center defined.",
  },
};
