import cors from "cors";
import express from "express";
import { chartsRouter } from "./routes/charts.js";

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/charts", chartsRouter);

  return app;
}
