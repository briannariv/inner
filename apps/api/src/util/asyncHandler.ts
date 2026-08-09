import type { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 doesn't forward a rejected promise from an async handler to
// error middleware — an unhandled rejection just hangs the request with no
// response. Wrap every async route with this so failures (e.g. a hosted
// provider's fetch throwing) reliably reach the error handler.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
