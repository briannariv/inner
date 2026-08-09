// The composition engine behind "tap a planet/center and get a chart-aware
// description" (SPEC.md §2.2/§2.3/§4). It reads placement + aspects (or
// center + defined-state) out of the already-computed chart and stitches
// together content-block strings — it never hard-codes per-user text.
import type { ChartBundle, InterpretationRequest, InterpretationResult } from "@inner/shared";
import { ASPECT_KEYWORDS, HOUSE_KEYWORDS, PLANET_KEYWORDS, SIGN_KEYWORDS } from "./astrologyContent.js";
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

export function composeInterpretation(request: InterpretationRequest): InterpretationResult {
  switch (request.focus.kind) {
    case "planet":
      return composePlanet(request.chart, request.focus);
    case "hdCenter":
      return composeHDCenter(request.chart, request.focus);
    case "hdGate":
      return composeHDGate(request.chart, request.focus);
  }
}

export function composeTypeAndAuthoritySummary(chart: ChartBundle): InterpretationResult {
  const hd = chart.humanDesign;
  return {
    headline: `${hd.type} · ${hd.profile} Profile · ${hd.authority} Authority`,
    body: `${TYPE_DESCRIPTIONS[hd.type]} ${AUTHORITY_DESCRIPTIONS[hd.authority]}`,
  };
}
