// Human Design "Connection Analysis" — the standard three-way
// classification of how two people's gate activations connect across each
// of the 36 channels:
//  - companionship: both people independently have the full channel
//    (shared, comfortable — "same wavelength")
//  - electromagnetic: neither has the full channel alone, but one has gate
//    A and the other has gate B, completing it together (attraction/
//    completion — the connection literally doesn't exist without both people)
//  - dominance: one person has the full channel on their own, the other has
//    neither gate (the energy is supplied by one person to the pair)
// Real, provider-independent math on top of whichever provider's gate
// activations it's fed — same design as astro/geometry.ts.
import type { HDConnectionChannel, HDGateActivation } from "@inner/shared";
import { CHANNELS } from "./reference.js";

export function computeHDConnections(
  gatesA: HDGateActivation[],
  gatesB: HDGateActivation[]
): HDConnectionChannel[] {
  const aGates = new Set(gatesA.map((g) => g.gate));
  const bGates = new Set(gatesB.map((g) => g.gate));

  const connections: HDConnectionChannel[] = [];
  for (const channel of CHANNELS) {
    const [g1, g2] = channel.gates;
    const aComplete = aGates.has(g1) && aGates.has(g2);
    const bComplete = bGates.has(g1) && bGates.has(g2);
    const aHasNeither = !aGates.has(g1) && !aGates.has(g2);
    const bHasNeither = !bGates.has(g1) && !bGates.has(g2);

    if (aComplete && bComplete) {
      connections.push({ gates: channel.gates, name: channel.name, type: "companionship" });
    } else if (aComplete && bHasNeither) {
      connections.push({ gates: channel.gates, name: channel.name, type: "dominance", dominantPerson: "A" });
    } else if (bComplete && aHasNeither) {
      connections.push({ gates: channel.gates, name: channel.name, type: "dominance", dominantPerson: "B" });
    } else {
      const aHasG1Only = aGates.has(g1) && !aGates.has(g2);
      const aHasG2Only = aGates.has(g2) && !aGates.has(g1);
      const bHasG1Only = bGates.has(g1) && !bGates.has(g2);
      const bHasG2Only = bGates.has(g2) && !bGates.has(g1);
      if ((aHasG1Only && bHasG2Only) || (aHasG2Only && bHasG1Only)) {
        connections.push({ gates: channel.gates, name: channel.name, type: "electromagnetic" });
      }
    }
  }
  return connections;
}
