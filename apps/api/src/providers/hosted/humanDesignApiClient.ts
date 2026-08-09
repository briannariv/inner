// Client for humandesignapi.nl's v2 chart endpoint.
//
// CONFIDENCE NOTE: same caveat as astrologyApiClient.ts — this sandbox
// can't reach humandesignapi.nl's docs directly, and there's no API key to
// test against. Bearer-token auth and a POST to /v2/charts/coordinates with
// birthdate/birthtime/latitude/longitude in the body is corroborated by
// public sources; exact response field names are best-effort (see
// mapHumanDesignApiResponse.ts).
const BASE_URL = "https://api.humandesignapi.nl/v2";

export interface HumanDesignApiCredentials {
  apiKey: string;
}

export interface HumanDesignChartRequest {
  birthdate: string; // YYYY-MM-DD
  birthtime: string; // HH:mm
  latitude: number;
  longitude: number;
  timezone?: string; // IANA zone, included defensively in case it's required/preferred over lat/lon-derived resolution
}

export async function fetchHumanDesignChart(
  creds: HumanDesignApiCredentials,
  body: HumanDesignChartRequest
): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/charts/coordinates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`humandesignapi.nl charts/coordinates failed (${res.status}): ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`humandesignapi.nl charts/coordinates returned non-JSON: ${text.slice(0, 500)}`);
  }
}
