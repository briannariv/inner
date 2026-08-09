import type { HDGateActivation } from "@inner/shared";
import { HD_BODIES, hdBodyPosition } from "../astro/ephemeris.js";
import { longitudeToGateLine } from "./mandala.js";

// The 13 measuring points, run twice — once at birth (Personality/
// conscious) and once at the Design instant (~88° of solar arc earlier,
// Unconscious) — for up to 26 total gate activations, per Step 3/4 of the
// documented HD calculation.
export function computeGateActivations(personalityJdUt: number, designJdUt: number): HDGateActivation[] {
  const activations: HDGateActivation[] = [];
  for (const body of HD_BODIES) {
    const personality = longitudeToGateLine(hdBodyPosition(personalityJdUt, body).longitude);
    activations.push({ gate: personality.gate, line: personality.line, planet: body, source: "personality" });

    const design = longitudeToGateLine(hdBodyPosition(designJdUt, body).longitude);
    activations.push({ gate: design.gate, line: design.line, planet: body, source: "design" });
  }
  return activations;
}
