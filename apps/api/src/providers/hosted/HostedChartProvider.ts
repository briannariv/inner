import type { BirthData, ChartBundle, TransitSnapshot } from "@inner/shared";
import { resolveTimezone } from "../../util/timezone.js";
import type { ChartProvider } from "../ChartProvider.js";
import { fetchWesternHoroscope, type AstrologyApiCredentials } from "./astrologyApiClient.js";
import { mapAstrologyApiResponse } from "./mapAstrologyApiResponse.js";
import { fetchHumanDesignChart, type HumanDesignApiCredentials } from "./humanDesignApiClient.js";
import { mapHumanDesignApiResponse } from "./mapHumanDesignApiResponse.js";
import { computeCrossAspects } from "../../astro/geometry.js";

// Planetary longitudes are geocentric and location-independent — only
// houses/ascendant depend on where you are. For a "now" transit snapshot we
// don't need the birth location's timezone resolved at all: the ISO instant
// IS already a UTC moment, so we hand it to astrologyapi.com as
// hour/min + tzone=0 directly rather than re-deriving a local timezone for it.
function utcInstantToWesternHoroscopeFields(atIso: string) {
  const d = new Date(atIso);
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth() + 1,
    year: d.getUTCFullYear(),
    hour: d.getUTCHours(),
    min: d.getUTCMinutes(),
    tzone: 0,
  };
}

export class HostedChartProvider implements ChartProvider {
  readonly name = "hosted";

  constructor(
    private readonly astrologyCreds: AstrologyApiCredentials,
    private readonly hdCreds: HumanDesignApiCredentials
  ) {}

  async getChartBundle(birthData: BirthData): Promise<ChartBundle> {
    if (!birthData.time) {
      throw new Error(
        "HostedChartProvider requires a known birth time — astrologyapi.com/humandesignapi.nl both need it for houses/gates. " +
          "The 'unknown time' fallback (Sun-only chart) isn't implemented for the hosted path yet."
      );
    }

    const tz = resolveTimezone(birthData.date, birthData.time, birthData.location.lat, birthData.location.lon);
    const [year, month, day] = birthData.date.split("-").map(Number);
    const [hour, min] = birthData.time.split(":").map(Number);

    const [astrologyRaw, hdRaw] = await Promise.all([
      fetchWesternHoroscope(this.astrologyCreds, {
        day, month, year, hour, min,
        lat: birthData.location.lat,
        lon: birthData.location.lon,
        tzone: tz.utcOffsetHours,
      }),
      fetchHumanDesignChart(this.hdCreds, {
        birthdate: birthData.date,
        birthtime: birthData.time,
        latitude: birthData.location.lat,
        longitude: birthData.location.lon,
        timezone: tz.ianaZone,
      }),
    ]);

    const mappedNatal = mapAstrologyApiResponse(astrologyRaw);
    const humanDesign = mapHumanDesignApiResponse(hdRaw);

    return {
      natal: {
        id: crypto.randomUUID(),
        birthData,
        ascendant: mappedNatal.ascendant,
        midheaven: mappedNatal.midheaven,
        vertex: mappedNatal.vertex,
        antiVertex: mappedNatal.antiVertex,
        southNode: mappedNatal.southNode,
        placements: mappedNatal.placements,
        houses: mappedNatal.houses,
        aspects: mappedNatal.aspects,
      },
      humanDesign,
    };
  }

  async getTransits(birthData: BirthData, atIso: string): Promise<TransitSnapshot> {
    const natalBundle = await this.getChartBundle(birthData);
    const fields = utcInstantToWesternHoroscopeFields(atIso);
    const raw = await fetchWesternHoroscope(this.astrologyCreds, {
      ...fields,
      lat: birthData.location.lat,
      lon: birthData.location.lon,
    });
    const mapped = mapAstrologyApiResponse(raw);
    return {
      timestamp: atIso,
      placements: mapped.placements,
      aspectsToNatal: computeCrossAspects(mapped.placements, natalBundle.natal.placements),
    };
  }
}
