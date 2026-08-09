import { Router } from "express";
import { z } from "zod";
import { getChartProvider } from "../providers/index.js";
import { composeInterpretation, composeTypeAndAuthoritySummary } from "../interpretation/compose.js";
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

chartsRouter.post("/bundle", async (req, res) => {
  const parsed = birthDataSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const bundle = await getChartProvider().getChartBundle(parsed.data);
  res.json(bundle);
});

const transitsSchema = z.object({
  birthData: birthDataSchema,
  at: z.string().datetime().optional(),
});

chartsRouter.post("/transits", async (req, res) => {
  const parsed = transitsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const at = parsed.data.at ?? new Date().toISOString();
  const snapshot = await getChartProvider().getTransits(parsed.data.birthData, at);
  res.json(snapshot);
});

chartsRouter.post("/interpretation", async (req, res) => {
  const body = req.body as InterpretationRequest | undefined;
  if (!body?.chart || !body?.focus) {
    return res.status(400).json({ error: "Expected { chart, focus }" });
  }
  res.json(composeInterpretation(body));
});

chartsRouter.post("/hd-summary", async (req, res) => {
  const body = req.body as { chart?: InterpretationRequest["chart"] } | undefined;
  if (!body?.chart) {
    return res.status(400).json({ error: "Expected { chart }" });
  }
  res.json(composeTypeAndAuthoritySummary(body.chart));
});
