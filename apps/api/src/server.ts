import cors from "cors";
import express from "express";
import { chartsRouter } from "./routes/charts.js";
import { compatibilityRouter } from "./routes/compatibility.js";

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/charts", chartsRouter);
  app.use("/compatibility", compatibilityRouter);

  // Centralized error handler — every route uses asyncHandler() to funnel
  // rejected promises here instead of hanging the request. 4-arg signature
  // is required by Express to recognize this as error middleware.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    res.status(502).json({ error: message });
  });

  return app;
}
