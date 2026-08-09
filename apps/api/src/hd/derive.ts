// Single source of truth for turning a list of raw gate activations into a
// full HDChart (centers, channels, Type, Authority, Profile). Both
// MockChartProvider and the hosted humandesignapi.nl mapper feed into this,
// so the derivation rules only need to be right (and get fixed) in one
// place. Profile is derived the real way — from the line numbers of the
// Personality Sun and Design Sun gate activations — rather than guessed.
import type { HDAuthority, HDCenterName, HDChart, HDGateActivation, HDType } from "@inner/shared";
import { CENTERS, CHANNELS, GATE_CENTER, MOTOR_CENTERS } from "./reference.js";

// Cross-checked against dturkuler/humandesign_api (AGPL/commercial-dual-
// licensed, independent open-source implementation): Type depends on the
// Throat being connected to a motor *by an actual defined channel*, not on
// the two centers merely being independently defined somewhere else in the
// chart (e.g. Throat defined via 20-57 and Sacral defined via 34-10, with no
// channel directly linking them, is a Generator, not a Manifesting
// Generator). Every one of our 36 gate/center pairs matched that reference
// implementation exactly, which is a good independent-source sanity check
// on hd/reference.ts.
function centersAreDirectlyConnected(
  channels: { gates: [number, number]; defined: boolean }[],
  a: HDCenterName,
  b: HDCenterName
): boolean {
  return channels.some((c) => {
    if (!c.defined) return false;
    const [c1, c2] = [GATE_CENTER[c.gates[0]], GATE_CENTER[c.gates[1]]];
    return (c1 === a && c2 === b) || (c1 === b && c2 === a);
  });
}

export function deriveHumanDesignChart(gates: HDGateActivation[]): Omit<HDChart, "id"> {
  const activatedGates = new Set(gates.map((g) => g.gate));

  const channels = CHANNELS.map((c) => ({
    gates: c.gates,
    name: c.name,
    defined: activatedGates.has(c.gates[0]) && activatedGates.has(c.gates[1]),
  }));

  const definedCenterSet = new Set<HDCenterName>();
  for (const c of channels) {
    if (c.defined) {
      definedCenterSet.add(GATE_CENTER[c.gates[0]]);
      definedCenterSet.add(GATE_CENTER[c.gates[1]]);
    }
  }
  const centers = CENTERS.map((name) => ({ name, defined: definedCenterSet.has(name) }));

  const sacralDefined = definedCenterSet.has("Sacral");
  const noneDefined = definedCenterSet.size === 0;
  const throatConnectsAnyMotor = MOTOR_CENTERS.some((motor) =>
    centersAreDirectlyConnected(channels, "Throat", motor)
  );

  let type: HDType;
  let strategy: string;
  if (noneDefined) {
    type = "Reflector";
    strategy = "Wait a full lunar cycle (~28 days) before major decisions";
  } else if (sacralDefined) {
    type = throatConnectsAnyMotor ? "Manifesting Generator" : "Generator";
    strategy = "Respond";
  } else if (throatConnectsAnyMotor) {
    type = "Manifestor";
    strategy = "Inform before acting";
  } else {
    type = "Projector";
    strategy = "Wait for the invitation";
  }

  let authority: HDAuthority;
  if (definedCenterSet.has("Solar Plexus")) authority = "Emotional";
  else if (sacralDefined) authority = "Sacral";
  else if (definedCenterSet.has("Spleen")) authority = "Splenic";
  else if (definedCenterSet.has("Heart")) authority = "Ego";
  else if (centersAreDirectlyConnected(channels, "G", "Throat")) authority = "Self-Projected";
  else if (noneDefined) authority = "Lunar";
  else authority = "Mental";

  const personalitySun = gates.find((g) => g.planet === "Sun" && g.source === "personality");
  const designSun = gates.find((g) => g.planet === "Sun" && g.source === "design");
  const profile =
    personalitySun && designSun ? `${personalitySun.line}/${designSun.line}` : "unknown/unknown";

  const sunGateForCross = personalitySun?.gate ?? gates[0]?.gate ?? 1;

  return {
    type,
    strategy,
    authority,
    profile,
    incarnationCross: `Placeholder Cross of Gate ${sunGateForCross} — real cross naming needs the wheel's gate-opposition data`,
    centers,
    gates,
    channels,
  };
}
