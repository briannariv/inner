// Maps humandesignapi.nl's response onto our HDChart shape. Deliberately
// extracts only the raw gate activations (gate, line, source, activating
// body) from the vendor payload and re-derives centers/channels/Type/
// Authority/Profile ourselves via deriveHumanDesignChart — that's the one
// battle-tested, internally-consistent piece of HD logic in this codebase
// (shared with MockChartProvider), so we trust our own derivation over
// guessing how the vendor phrases "type"/"authority"/"centers" in JSON.
// See humanDesignApiClient.ts for the confidence caveat on field names.
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { HDChart, HDGateActivation, Planet } from "@inner/shared";
import { deriveHumanDesignChart } from "../../hd/derive.js";

const PLANET_NAME_MAP: Record<string, Planet> = {
  Sun: "Sun", Moon: "Moon", Mercury: "Mercury", Venus: "Venus", Mars: "Mars",
  Jupiter: "Jupiter", Saturn: "Saturn", Uranus: "Uranus", Neptune: "Neptune", Pluto: "Pluto",
  "North Node": "NorthNode", NorthNode: "NorthNode", Chiron: "Chiron",
  // "South Node"/Earth deliberately unmapped — no slot in our Planet type yet.
};

const SOURCE_ALIASES: Record<string, "personality" | "design"> = {
  personality: "personality", conscious: "personality",
  design: "design", unconscious: "design",
};

const rawActivationSchema = z
  .object({
    gate: z.number().optional(),
    number: z.number().optional(),
    gateNumber: z.number().optional(),
    line: z.number().optional(),
    lineNumber: z.number().optional(),
    planet: z.string().optional(),
    celestialBody: z.string().optional(),
    body: z.string().optional(),
    type: z.string().optional(),
    activation: z.string().optional(),
    source: z.string().optional(),
  })
  .passthrough();

// Vendors differ on whether activations live under "gates", "activations",
// or personality/design are split into separate arrays — try the plausible
// shapes and fail with a clear, actionable message if none match.
const rawResponseSchema = z
  .object({
    gates: z.array(rawActivationSchema).optional(),
    activations: z.array(rawActivationSchema).optional(),
    personality: z.object({ gates: z.array(rawActivationSchema).optional() }).passthrough().optional(),
    design: z.object({ gates: z.array(rawActivationSchema).optional() }).passthrough().optional(),
  })
  .passthrough();

function collectRawActivations(parsed: z.infer<typeof rawResponseSchema>) {
  if (parsed.gates) return parsed.gates.map((g) => ({ ...g }));
  if (parsed.activations) return parsed.activations.map((g) => ({ ...g }));
  const combined: (z.infer<typeof rawActivationSchema> & { source?: string })[] = [];
  if (parsed.personality?.gates) {
    combined.push(...parsed.personality.gates.map((g) => ({ ...g, source: g.source ?? "personality" })));
  }
  if (parsed.design?.gates) {
    combined.push(...parsed.design.gates.map((g) => ({ ...g, source: g.source ?? "design" })));
  }
  return combined;
}

export function mapHumanDesignApiResponse(raw: unknown): HDChart {
  const parsed = rawResponseSchema.safeParse(raw);
  if (!parsed.success) {
    const topLevelKeys = raw && typeof raw === "object" ? Object.keys(raw) : [];
    throw new Error(
      `humandesignapi.nl response didn't match the expected shape. ` +
        `Top-level keys received: ${topLevelKeys.join(", ") || "(none/non-object)"}. ${parsed.error.message}`
    );
  }

  const rawActivations = collectRawActivations(parsed.data);
  if (rawActivations.length === 0) {
    throw new Error(
      "humandesignapi.nl response had no usable gate activations under 'gates'/'activations'/'personality.gates'+'design.gates' " +
        "— update mapHumanDesignApiResponse.ts once you've seen a real payload."
    );
  }

  const gates: HDGateActivation[] = [];
  for (const a of rawActivations) {
    const gateNumber = a.gate ?? a.number ?? a.gateNumber;
    const line = a.line ?? a.lineNumber;
    const bodyName = a.planet ?? a.celestialBody ?? a.body;
    const sourceRaw = (a.type ?? a.activation ?? a.source ?? "").toLowerCase();
    const source = SOURCE_ALIASES[sourceRaw];

    if (typeof gateNumber !== "number" || typeof line !== "number" || !bodyName || !source) {
      throw new Error(
        `humandesignapi.nl activation entry missing an expected field — got: ${JSON.stringify(a)}. ` +
          `Update mapHumanDesignApiResponse.ts's field-name guesses once you've seen a real payload.`
      );
    }
    const planet = PLANET_NAME_MAP[bodyName];
    if (!planet) continue; // e.g. South Node — no slot in our Planet type yet

    gates.push({ gate: gateNumber, line, planet, source });
  }

  return { id: randomUUID(), ...deriveHumanDesignChart(gates) };
}
