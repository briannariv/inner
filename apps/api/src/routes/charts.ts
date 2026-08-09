import { Router } from "express";
import { z } from "zod";
import { getChartProvider } from "../providers/index.js";
import { composeInterpretation, composeTypeAndAuthoritySummary } from "../interpretation/compose.js";
import { computeAstrocartographyLines } from "../astro/astrocartography.js";
import { resolveBirthInstantUtc } from "../util/timezone.js";
import { asyncHandler } from "../util/asyncHandler.js";
import type { InterpretationRequest } from "@inner/shared";

const birthDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  location: z.object({
    name: z.string().min(1),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
});

export const chartsRouter = Router();

chartsRouter.post("/bundle", asyncHandler(async (req, res) => {
  const parsed = birthDataSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const bundle = await getChartProvider().getChartBundle(parsed.data);
  res.json(bundle);
}));

const transitsSchema = z.object({
  birthData: birthDataSchema,
  at: z.string().datetime().optional(),
});

chartsRouter.post("/transits", asyncHandler(async (req, res) => {
  const parsed = transitsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const at = parsed.data.at ?? new Date().toISOString();
  const snapshot = await getChartProvider().getTransits(parsed.data.birthData, at);
  res.json(snapshot);
}));

chartsRouter.post("/interpretation", asyncHandler(async (req, res) => {
  const body = req.body as InterpretationRequest | undefined;
  if (!body?.chart || !body?.focus) {
    return res.status(400).json({ error: "Expected { chart, focus }" });
  }
  res.json(composeInterpretation(body));
}));

chartsRouter.post("/hd-summary", asyncHandler(async (req, res) => {
  const body = req.body as { chart?: InterpretationRequest["chart"] } | undefined;
  if (!body?.chart) {
    return res.status(400).json({ error: "Expected { chart }" });
  }
  res.json(composeTypeAndAuthoritySummary(body.chart));
}));

chartsRouter.post("/astrocartography", asyncHandler(async (req, res) => {
  const parsed = birthDataSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const birthData = parsed.data;
  if (!birthData.time) {
    return res.status(400).json({ error: "Astrocartography requires a known birth time." });
  }
  const bundle = await getChartProvider().getChartBundle(birthData);
  const utcInstant = resolveBirthInstantUtc(birthData.date, birthData.time, birthData.location.lat, birthData.location.lon);
  const lines = computeAstrocartographyLines(bundle.natal.placements, utcInstant);
  res.json({ lines });
}));
