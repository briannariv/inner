// The composition engine behind "tap a planet/center and get a chart-aware
// description" (SPEC.md §2.2/§2.3/§4). It reads placement + aspects (or
// center + defined-state) out of the already-computed chart and stitches
// together content-block strings — it never hard-codes per-user text.
import type { Aspect, ChartAngle, ChartBundle, HDConnectionChannel, InterpretationRequest, InterpretationResult } from "@inner/shared";
import { ANGLE_KEYWORDS, ASPECT_KEYWORDS, HOUSE_KEYWORDS, PLANET_KEYWORDS, SIGN_KEYWORDS } from "./astrologyContent.js";
import { AUTHORITY_DESCRIPTIONS, CENTER_DESCRIPTIONS, TYPE_DESCRIPTIONS } from "./humanDesignContent.js";

function composePlanet(chart: ChartBundle, planet: InterpretationRequest["focus"] & { kind: "planet" }): InterpretationResult {
  const placement = chart.natal.placements.find((p) => p.planet === planet.planet);
  if (!placement) {
    return { headline: planet.planet, body: "No placement found for this chart." };
  }

  const houseClause = placement.house ? `, in your ${HOUSE_KEYWORDS[placement.house]} (House ${placement.house})` : "";
  let body = `${PLANET_KEYWORDS[placement.planet]}, expressed through ${SIGN_KEYWORDS[placement.sign]}${houseClause}.`;

  const relevantAspects = chart.natal.aspects.filter((a) => a.a === placement.planet || a.b === placement.planet);
  if (relevantAspects.length > 0) {
    const aspectSentences = relevantAspects.map((a) => {
      const other = a.a === placement.planet ? a.b : a.a;
      return `${placement.planet} ${ASPECT_KEYWORDS[a.type]} your ${other}`;
    });
    body += ` ${aspectSentences.join("; ")}.`;
  }

  return {
    headline: `${placement.planet} in ${placement.sign}${placement.house ? ` — House ${placement.house}` : ""}`,
    body,
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
  const activations = chart.humanDesign.gates.filter((g) => g.gate === focus.gate);
  if (activations.length === 0) {
    return {
      headline: `Gate ${focus.gate}`,
      body: "This gate is not activated in this chart. (Gate-level teaching content is a follow-up content task — see SPEC.md.)",
    };
  }
  const lines = activations.map((a) => `${a.source} Sun-cycle, line ${a.line} (via ${a.planet})`).join("; ");
  return {
    headline: `Gate ${focus.gate} — active`,
    body: `Activated in this chart: ${lines}. (Gate-level teaching content is a follow-up content task — see SPEC.md §2.7 Education section.)`,
  };
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
  return {
    headline: `${focus.angle} in ${point.sign}`,
    body: `${ANGLE_KEYWORDS[focus.angle]}.`,
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
