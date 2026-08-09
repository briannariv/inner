// Client for astrologyapi.com's `western_horoscope` endpoint.
//
// CONFIDENCE NOTE: this session's network policy blocks fetching
// astrologyapi.com's docs directly (egress restricted to an allowlist), and
// no API credentials were available to make a real test call. The request
// shape below (Basic Auth with userId:apiKey, POST body of
// day/month/year/hour/min/lat/lon/tzone) is corroborated by multiple
// independent public sources, so confidence there is reasonably high. The
// exact *response* field names are lower-confidence best-effort — see
// mapAstrologyApiResponse.ts, which validates strictly and fails with a
// descriptive error (dumping the actual top-level keys received) rather
// than silently mis-mapping if the real shape differs. First real API call
// should be treated as "verify + patch the mapper," not "should just work."
const BASE_URL = "https://json.astrologyapi.com/v1";

export interface AstrologyApiCredentials {
  userId: string;
  apiKey: string;
}

export interface WesternHoroscopeRequest {
  day: number;
  month: number;
  year: number;
  hour: number;
  min: number;
  lat: number;
  lon: number;
  tzone: number; // UTC offset in hours, e.g. 5.5
}

export async function fetchWesternHoroscope(
  creds: AstrologyApiCredentials,
  body: WesternHoroscopeRequest
): Promise<unknown> {
  const auth = Buffer.from(`${creds.userId}:${creds.apiKey}`).toString("base64");
  const res = await fetch(`${BASE_URL}/western_horoscope`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      "Accept-Language": "en",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`astrologyapi.com western_horoscope failed (${res.status}): ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`astrologyapi.com western_horoscope returned non-JSON: ${text.slice(0, 500)}`);
  }
}
