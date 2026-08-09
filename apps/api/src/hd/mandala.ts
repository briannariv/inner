// The Rave Mandala: which of the 64 gates occupies each 5.625° slot around
// the zodiac. Sourced by cross-checking against dturkuler/humandesign_api
// (independent AGPL/commercial-dual-licensed open-source implementation,
// itself citing Ra Uru Hu's original Black Book) rather than reconstructed
// from memory — this table is the single highest-risk-of-error piece of the
// whole HD engine (get one entry wrong and every chart is subtly wrong), so
// it's sourced, not guessed.
//
// The formula: shift ecliptic longitude by +58° before dividing into 64
// slots of 5.625° each. That 58° offset is what actually pins Gate 41 (slot
// 0) to its fixed zodiac position — solving it out: slot 0 covers shifted
// longitude [0, 5.625), i.e. raw longitude [-58, -52.375), i.e. 302°-307.625°
// absolute, which is 2°-7.625° into Aquarius. So Gate 41 begins at 2°
// Aquarius by this reference's convention (not exactly 0° Aquarius as
// sometimes loosely stated) — verified by running the actual formula below,
// not asserted from a secondary description.
const IGING_OFFSET_DEG = 58;
const GATE_SPAN_DEG = 5.625; // 360 / 64
const LINE_SPAN_DEG = GATE_SPAN_DEG / 6; // 0.9375

const RAVE_MANDALA_GATE_ORDER: number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8,
  20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6,
  46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

export interface GateLine {
  gate: number;
  line: number;
}

export function longitudeToGateLine(eclipticLongitudeDeg: number): GateLine {
  const shifted = ((eclipticLongitudeDeg + IGING_OFFSET_DEG) % 360 + 360) % 360;
  const gateIndex = Math.floor(shifted / GATE_SPAN_DEG);
  const withinGate = shifted - gateIndex * GATE_SPAN_DEG;
  const line = Math.floor(withinGate / LINE_SPAN_DEG) + 1;
  return { gate: RAVE_MANDALA_GATE_ORDER[gateIndex], line };
}
