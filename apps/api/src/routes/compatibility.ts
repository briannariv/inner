import { Router } from "express";
import { z } from "zod";
import { getChartProvider } from "../providers/index.js";
import { computeCrossAspects } from "../astro/geometry.js";
import { computeHDConnections } from "../hd/connection.js";
import { composeCompatibilitySummary } from "../interpretation/compose.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { birthDataSchema } from "./schemas.js";
import type { CompatibilityResult } from "@inner/shared";

const personSchema = z.object({
  name: z.string().min(1),
  birthData: birthDataSchema,
});

const compatibilitySchema = z.object({
  personA: personSchema,
  personB: personSchema,
});

export const compatibilityRouter = Router();

compatibilityRouter.post("/synastry", asyncHandler(async (req, res) => {
  const parsed = compatibilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { personA, personB } = parsed.data;
  const provider = getChartProvider();

  const [chartA, chartB] = await Promise.all([
    provider.getChartBundle(personA.birthData),
    provider.getChartBundle(personB.birthData),
  ]);

  const synastryAspects = computeCrossAspects(chartA.natal.placements, chartB.natal.placements);
  const hdConnections = computeHDConnections(chartA.humanDesign.gates, chartB.humanDesign.gates);
  const summary = composeCompatibilitySummary(personA.name, personB.name, chartA, chartB, synastryAspects, hdConnections);

  const result: CompatibilityResult = {
    personA: { name: personA.name, chart: chartA },
    personB: { name: personB.name, chart: chartB },
    synastryAspects,
    hdConnections,
    summary,
  };
  res.json(result);
}));
