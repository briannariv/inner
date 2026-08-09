// Human Design structural reference data (centers, the 64 gates, the 36
// channels connecting them). This is public-domain system structure
// (I Ching gate numbers and center names), not Jovian Archive's proprietary
// chart artwork or trademarked terminology — safe to encode directly.
//
// IMPORTANT: this mapping is reconstructed from general HD knowledge for
// the purposes of this MVP mock provider ONLY. It has NOT been cross-checked
// against an authoritative source or the hosted HD APIs evaluated in
// SPEC.md §6. Treat every gate/channel/center assignment below as
// "needs verification" before any of this powers a real user-facing chart —
// once a hosted HD API is contracted, this file's job (fabricating gate
// data) goes away entirely and only the HDCenterName/gate-number types
// downstream keep being used.
import type { HDCenterName } from "@inner/shared";

export const CENTERS: HDCenterName[] = [
  "Head", "Ajna", "Throat", "G", "Heart", "Sacral", "Spleen", "Solar Plexus", "Root",
];

export const GATE_CENTER: Record<number, HDCenterName> = {
  1: "G", 8: "Throat", 2: "G", 14: "Sacral", 3: "Sacral", 60: "Root",
  4: "Ajna", 63: "Head", 5: "Sacral", 15: "G", 6: "Solar Plexus", 59: "Sacral",
  7: "G", 31: "Throat", 9: "Sacral", 52: "Root", 10: "G", 20: "Throat",
  34: "Sacral", 57: "Spleen", 11: "Ajna", 56: "Throat", 12: "Throat", 22: "Solar Plexus",
  13: "G", 33: "Throat", 16: "Throat", 48: "Spleen", 17: "Ajna", 62: "Throat",
  18: "Spleen", 58: "Root", 19: "Root", 49: "Solar Plexus", 21: "Heart", 45: "Throat",
  23: "Throat", 43: "Ajna", 24: "Ajna", 61: "Head", 25: "G", 51: "Heart",
  26: "Heart", 44: "Spleen", 27: "Sacral", 50: "Spleen", 28: "Spleen", 38: "Root",
  29: "Sacral", 46: "G", 30: "Solar Plexus", 41: "Root", 32: "Spleen", 54: "Root",
  35: "Throat", 36: "Solar Plexus", 37: "Solar Plexus", 40: "Heart", 39: "Root", 55: "Solar Plexus",
  42: "Root", 53: "Sacral", 47: "Ajna", 64: "Head",
};

export interface ChannelDef {
  gates: [number, number];
  name: string;
}

export const CHANNELS: ChannelDef[] = [
  { gates: [1, 8], name: "Inspiration" },
  { gates: [2, 14], name: "The Beat" },
  { gates: [3, 60], name: "Mutation" },
  { gates: [4, 63], name: "Logic" },
  { gates: [5, 15], name: "Rhythm" },
  { gates: [6, 59], name: "Mating" },
  { gates: [7, 31], name: "The Alpha" },
  { gates: [9, 52], name: "Concentration" },
  { gates: [10, 20], name: "Awakening" },
  { gates: [10, 34], name: "Exploration" },
  { gates: [10, 57], name: "Perfected Form" },
  { gates: [11, 56], name: "Curiosity" },
  { gates: [12, 22], name: "Openness" },
  { gates: [13, 33], name: "The Prodigal" },
  { gates: [16, 48], name: "The Wavelength" },
  { gates: [17, 62], name: "Acceptance" },
  { gates: [18, 58], name: "Judgment" },
  { gates: [19, 49], name: "Synthesis" },
  { gates: [20, 34], name: "Charisma" },
  { gates: [20, 57], name: "The Brainwave" },
  { gates: [21, 45], name: "Money" },
  { gates: [23, 43], name: "Structuring" },
  { gates: [24, 61], name: "Awareness" },
  { gates: [25, 51], name: "Initiation" },
  { gates: [26, 44], name: "Surrender" },
  { gates: [27, 50], name: "Preservation" },
  { gates: [28, 38], name: "Struggle" },
  { gates: [29, 46], name: "Discovery" },
  { gates: [30, 41], name: "Recognition" },
  { gates: [32, 54], name: "Transformation" },
  { gates: [34, 57], name: "Power" },
  { gates: [35, 36], name: "Transitoriness" },
  { gates: [37, 40], name: "Community" },
  { gates: [39, 55], name: "Emoting" },
  { gates: [42, 53], name: "Maturation" },
  { gates: [47, 64], name: "Abstraction" },
];

export const MOTOR_CENTERS: HDCenterName[] = ["Heart", "Solar Plexus", "Root", "Sacral"];
