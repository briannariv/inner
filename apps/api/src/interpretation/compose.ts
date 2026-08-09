// The composition engine behind "tap a planet/center and get a chart-aware
// description" (SPEC.md §2.2/§2.3/§4). It reads placement + aspects (or
// center + defined-state) out of the already-computed chart and stitches
// together content-block strings — it never hard-codes per-user text.
import { getHDGateProfile } from "@inner/shared";
import type { Aspect, ChartAngle, ChartBundle, HDConnectionChannel, InterpretationRequest, InterpretationResult } from "@inner/shared";
import { ANGLE_KEYWORDS, ASPECT_KEYWORDS, HOUSE_KEYWORDS, PLANET_KEYWORDS, SIGN_KEYWORDS } from "./astrologyContent.js";
import { AUTHORITY_DESCRIPTIONS, CENTER_DESCRIPTIONS, TYPE_DESCRIPTIONS } from "./humanDesignContent.js";
import {
  chartRuler, determineSect, essentialDignity, houseAngularity, isInJoy, sectInfo,
  type Dignity, type HouseAngularity, type SectInfo,
} from "../astro/hellenistic.js";

function dignitySentence(planetName: string, dignity: Dignity | null): string | null {
  if (!dignity) return null;
  switch (dignity.type) {
    case "domicile":
      return `This is ${planetName}'s own domicile — one of the strongest essential conditions a planet can hold, acting on its own authority here rather than borrowing another planet's terms.`;
    case "exaltation":
      return `${planetName} is exalted here${dignity.note ? ` — ${dignity.note}` : ""} — elevated, operating with unusual honor and effectiveness, though (unlike domicile) still technically a guest in someone else's sign.`;
    case "detriment":
      return `${planetName} is in its detriment here — working against its own natural terrain, which tends to make its expression more effortful or erratic than a well-dignified planet's.`;
    case "fall":
      return `${planetName} is in its fall here, its weakest essential condition — it needs real support from sect, aspect, or house placement to function well.`;
    case "peregrine":
      return `${planetName} holds no essential dignity here (peregrine) — no rulership claim on this degree either way, so its behavior is better read from house, aspect, and sect than from sign alone.`;
  }
}

function angularitySentence(planetName: string, angularity: HouseAngularity): string {
  if (angularity === "angular") return `It sits in an angular house, so it acts directly and visibly — this is one of the more prominent forces in your chart.`;
  if (angularity === "succedent") return `It sits in a succedent house, so its effects build and stabilize over time rather than announcing themselves immediately.`;
  return `It sits in a cadent house, so its influence tends to work through thought, preparation, and background processing rather than visible action.`;
}

function sectSentence(planetName: string, info: SectInfo): string | null {
  const { sect, role, inSect } = info;
  if (role === "luminary") {
    return inSect
      ? `As the sect light of this ${sect} chart, ${planetName} is your single strongest significator — everything else in the chart is read in relation to it.`
      : `${planetName} is the luminary *not* governing this chart's sect (a ${sect} chart) — still central to who you are, just operating without the tradition's home-field advantage the other luminary gets here.`;
  }
  if (role === "benefic") {
    return inSect
      ? `${planetName} is the benefic of sect in this chart — its good effects are the ones the tradition trusts most fully here.`
      : `${planetName} is a benefic, but contrary to sect in this ${sect} chart — its help still works, just with more friction than it would carry in this chart's favored sect.`;
  }
  if (role === "malefic") {
    return inSect
      ? `${planetName} is the malefic of sect here — its harder edge is doctrinally expected in a chart like this, a built-in challenge rather than a wound needing explanation.`
      : `${planetName} is the malefic *contrary to* sect here — traditionally the harder of the two malefics to carry in a ${sect} chart, and worth real attention.`;
  }
  return inSect
    ? `Mercury rises in phase with this chart's sect, so it leans toward acting with the chart's benefics here.`
    : `Mercury rises out of phase with this chart's sect, so it leans slightly toward the chart's malefics here — not fixed, just its default tilt in this chart.`;
}

function composePlanet(chart: ChartBundle, planet: InterpretationRequest["focus"] & { kind: "planet" }): InterpretationResult {
  const placement = chart.natal.placements.find((p) => p.planet === planet.planet);
  if (!placement) {
    return { headline: planet.planet, body: "No placement found for this chart." };
  }

  const houseClause = placement.house ? `, in your ${HOUSE_KEYWORDS[placement.house]} (House ${placement.house})` : "";
  const sentences: string[] = [
    `${PLANET_KEYWORDS[placement.planet]}, expressed through ${SIGN_KEYWORDS[placement.sign]}${houseClause}.`,
  ];

  const dignity = essentialDignity(placement.planet, placement.sign, placement.degreeInSign);
  const dSentence = dignitySentence(placement.planet, dignity);
  if (dSentence) sentences.push(dSentence);

  if (placement.house) {
    sentences.push(angularitySentence(placement.planet, houseAngularity(placement.house)));
    if (isInJoy(placement.planet, placement.house)) {
      sentences.push(`It's also in its joy here — the one house this planet is traditionally most at ease occupying.`);
    }
  }

  const sect = determineSect(chart.natal.placements);
  if (sect) {
    const info = sectInfo(placement.planet, sect, chart.natal.placements);
    if (info) {
      const sSentence = sectSentence(placement.planet, info);
      if (sSentence) sentences.push(sSentence);
    }
  }

  const relevantAspects = chart.natal.aspects.filter((a) => a.a === placement.planet || a.b === placement.planet);
  if (relevantAspects.length > 0) {
    const aspectSentences = relevantAspects.map((a) => {
      const other = a.a === placement.planet ? a.b : a.a;
      return `${placement.planet} ${ASPECT_KEYWORDS[a.type]} your ${other}`;
    });
    sentences.push(`${aspectSentences.join("; ")}.`);
  }

  return {
    headline: `${placement.planet} in ${placement.sign}${placement.house ? ` — House ${placement.house}` : ""}`,
    body: sentences.join(" "),
  };
}

function composeHDCenter(chart: ChartBundle, focus: InterpretationRequest["focus"] & { kind: "hdCenter" }): InterpretationResult {
  const center = chart.humanDesign.centers.find((c) => c.name === focus.center);
  const defined = center?.defined ?? false;
  const desc = CENTER_DESCRIPTIONS[focus.center];
  return {
    headline: `${focus.center} Center — ${defined ? "Defined" : "Undefined/Open"}`,
    body: defined ? desc.defined : desc.undefined,
  };
}

function composeHDGate(chart: ChartBundle, focus: InterpretationRequest["focus"] & { kind: "hdGate" }): InterpretationResult {
  const profile = getHDGateProfile(focus.gate);
  const activations = chart.humanDesign.gates.filter((g) => g.gate === focus.gate);
  const headline = `Gate ${focus.gate} — ${profile?.name ?? "Unnamed"}${activations.length > 0 ? " (active)" : ""}`;

  if (!profile) {
    return { headline: `Gate ${focus.gate}`, body: "No content available for this gate yet." };
  }

  const sentences = [
    `${profile.iChingName} · ${profile.center} Center.`,
    profile.description,
    `Shadow: ${profile.shadow}`,
  ];

  if (activations.length > 0) {
    const lines = activations
      .map((a) => `${a.source === "personality" ? "conscious" : "unconscious"} (line ${a.line}, via ${a.planet})`)
      .join(" and ");
    sentences.push(`Active in this chart: ${lines}.`);
  } else {
    sentences.push("Not activated in this chart.");
  }

  return { headline, body: sentences.join(" ") };
}

function composeHDChannel(chart: ChartBundle, focus: InterpretationRequest["focus"] & { kind: "hdChannel" }): InterpretationResult {
  const [gateA, gateB] = focus.gates;
  const profileA = getHDGateProfile(gateA);
  const profileB = getHDGateProfile(gateB);
  const channel = chart.humanDesign.channels.find(
    (c) => (c.gates[0] === gateA && c.gates[1] === gateB) || (c.gates[0] === gateB && c.gates[1] === gateA)
  );
  const name = channel?.name ?? `${gateA}-${gateB}`;
  const headline = `The Channel of ${name} (${gateA}–${gateB})${channel?.defined ? " — defined" : ""}`;

  if (!profileA || !profileB) {
    return { headline, body: "No content available for this channel yet." };
  }

  const body =
    `A channel connecting Gate ${gateA} (${profileA.name}, ${profileA.center}) to Gate ${gateB} (${profileB.name}, ${profileB.center}). ` +
    `${channel?.defined ? "Defined in this chart" : "Not defined in this chart"} — ` +
    `${channel?.defined
      ? "you have consistent, reliable access to the fusion of both gates' themes, not just one or the other in isolation."
      : "you'd need both gates active (from yourself or, in relationship, from someone else) to run this channel's energy consistently."}`;

  return { headline, body };
}

function composeAngle(chart: ChartBundle, focus: InterpretationRequest["focus"] & { kind: "angle" }): InterpretationResult {
  const angleByName: Record<string, ChartAngle | null> = {
    Ascendant: chart.natal.ascendant,
    Midheaven: chart.natal.midheaven,
    Vertex: chart.natal.vertex,
    AntiVertex: chart.natal.antiVertex,
    SouthNode: chart.natal.southNode,
  };
  const point = angleByName[focus.angle];
  if (!point) {
    return { headline: focus.angle, body: "Not available for this chart (birth time may be unknown)." };
  }

  let body = `${ANGLE_KEYWORDS[focus.angle]}.`;
  if (focus.angle === "Ascendant") {
    const ruler = chartRuler(point.sign);
    const rulerPlacement = chart.natal.placements.find((p) => p.planet === ruler);
    if (rulerPlacement) {
      const rulerHouseClause = rulerPlacement.house ? ` in your House ${rulerPlacement.house}` : "";
      body += ` Your chart ruler — the traditional lord of your rising sign — is ${ruler}, placed in ${rulerPlacement.sign}${rulerHouseClause}. In Hellenistic practice this is one of the single most-consulted points for reading the native's general life and body, more than any one placement taken alone.`;
    }
  }

  return {
    headline: `${focus.angle} in ${point.sign}`,
    body,
  };
}

export function composeInterpretation(request: InterpretationRequest): InterpretationResult {
  switch (request.focus.kind) {
    case "planet":
      return composePlanet(request.chart, request.focus);
    case "hdCenter":
      return composeHDCenter(request.chart, request.focus);
    case "hdGate":
      return composeHDGate(request.chart, request.focus);
    case "hdChannel":
      return composeHDChannel(request.chart, request.focus);
    case "angle":
      return composeAngle(request.chart, request.focus);
  }
}

export function composeTypeAndAuthoritySummary(chart: ChartBundle): InterpretationResult {
  const hd = chart.humanDesign;
  return {
    headline: `${hd.type} · ${hd.profile} Profile · ${hd.authority} Authority`,
    body: `${TYPE_DESCRIPTIONS[hd.type]} ${AUTHORITY_DESCRIPTIONS[hd.authority]}`,
  };
}

// The dual-system synthesis SPEC.md §2.5 flags as the hardest content
// problem in the app — this is a v1 attempt at one narrative that actually
// ties the astrology and HD signals together, not two separate paragraphs.
export function composeCompatibilitySummary(
  nameA: string,
  nameB: string,
  chartA: ChartBundle,
  chartB: ChartBundle,
  synastryAspects: Aspect[],
  hdConnections: HDConnectionChannel[]
): InterpretationResult {
  const soft = new Set(["trine", "sextile"]);
  const hard = new Set(["square", "opposition"]);
  const harmonious = synastryAspects.filter((a) => soft.has(a.type)).length;
  const challenging = synastryAspects.filter((a) => hard.has(a.type)).length;
  const fused = synastryAspects.filter((a) => a.type === "conjunction").length;

  const electromagnetic = hdConnections.filter((c) => c.type === "electromagnetic").length;
  const companionship = hdConnections.filter((c) => c.type === "companionship").length;
  const dominance = hdConnections.filter((c) => c.type === "dominance").length;

  const parts: string[] = [
    `${nameA} and ${nameB} share ${synastryAspects.length} astrological aspects — ` +
      `${harmonious} flowing, ${challenging} friction-generating, ${fused} fused/intensified.`,
  ];

  const sectA = determineSect(chartA.natal.placements);
  const sectB = determineSect(chartB.natal.placements);
  if (sectA && sectB) {
    parts.push(
      sectA === sectB
        ? `You're both ${sectA} charts (Sun ${sectA === "day" ? "above" : "below"} the horizon at birth) — a shared basic temperament orientation in Hellenistic terms, which tends to mean your instincts about when to assert versus hold back run on similar timing.`
        : `${nameA} is a ${sectA} chart and ${nameB} is a ${sectB} chart — a real difference in basic temperament orientation (what Hellenistic astrology calls sect), which can mean your default instincts about assertion, rest, and risk run on different clocks. Worth noticing rather than assuming you're wired the same way underneath the aspects above.`
    );
  }

  if (electromagnetic > 0) {
    parts.push(
      `On the Human Design side, ${electromagnetic} channel${electromagnetic === 1 ? "" : "s"} exist only between you — ` +
        `neither of you has ${electromagnetic === 1 ? "it" : "them"} alone, the classic signature of magnetic attraction.`
    );
  }
  if (companionship > 0) {
    parts.push(`${companionship} channel${companionship === 1 ? "" : "s"} you both carry independently — real common ground, not just chemistry.`);
  }
  if (dominance > 0) {
    parts.push(
      `${dominance} channel${dominance === 1 ? "" : "s"} ${dominance === 1 ? "runs" : "run"} one-directionally — one of you consistently supplies energy the other doesn't generate on their own.`
    );
  }
  if (electromagnetic === 0 && companionship === 0 && dominance === 0) {
    parts.push("No Human Design channels connect your two charts directly — whatever pull exists here is running through the astrology layer, not the energetic one.");
  }

  return { headline: `${nameA} × ${nameB}`, body: parts.join(" ") };
}
