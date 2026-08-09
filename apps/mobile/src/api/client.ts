import type {
  AstrocartographyResult, BirthData, ChartBundle, CompatibilityRequest, CompatibilityResult,
  InterpretationRequest, InterpretationResult, TransitSnapshot,
} from "@inner/shared";
import { API_BASE_URL } from "../config";

async function post<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<TResponse>;
}

export function getChartBundle(birthData: BirthData): Promise<ChartBundle> {
  return post<ChartBundle>("/charts/bundle", birthData);
}

export function getTransits(birthData: BirthData, at?: string): Promise<TransitSnapshot> {
  return post<TransitSnapshot>("/charts/transits", { birthData, at });
}

export function getInterpretation(request: InterpretationRequest): Promise<InterpretationResult> {
  return post<InterpretationResult>("/charts/interpretation", request);
}

export function getHdSummary(chart: ChartBundle): Promise<InterpretationResult> {
  return post<InterpretationResult>("/charts/hd-summary", { chart });
}

export function getAstrocartography(birthData: BirthData): Promise<AstrocartographyResult> {
  return post<AstrocartographyResult>("/charts/astrocartography", birthData);
}

export function getCompatibility(request: CompatibilityRequest): Promise<CompatibilityResult> {
  return post<CompatibilityResult>("/compatibility/synastry", request);
}
