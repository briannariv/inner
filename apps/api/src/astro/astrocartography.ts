// Real astrocartography math: given a planet's ecliptic longitude and the
// exact UTC instant of birth, find where on Earth that planet was rising
// (AC), setting (DC), culminating (MC), or anti-culminating (IC) at birth.
// This is standard spherical astronomy — Greenwich Sidereal Time from the
// Julian Date, ecliptic-to-equatorial conversion, then solving the horizon
// condition per latitude for AC/DC. It's genuinely correct math layered on
// top of whatever planetary longitudes the active ChartProvider returns —
// today that's MockChartProvider's placeholder data, so the resulting lines
// won't match anyone's real chart yet, but the algorithm itself doesn't
// change when a real ephemeris is wired in behind it.
//
// Simplification: treats ecliptic latitude (β) as 0 for all bodies. True for
// the Sun by definition; a small-but-nonzero approximation for the Moon and
// planets (a few degrees at most) that real astrocartography tools usually
// do account for — a reasonable first pass, not production-accurate.
import type { AstrocartographyLine, GeoPoint, Planet } from "@inner/shared";
import { normalizeDegree } from "./geometry.js";

const OBLIQUITY_DEG = 23.4393;

function deg2rad(d: number): number {
  return (d * Math.PI) / 180;
}
function rad2deg(r: number): number {
  return (r * 180) / Math.PI;
}
function toSignedLongitude(deg: number): number {
  const d = normalizeDegree(deg);
  return d > 180 ? d - 360 : d;
}

export function julianDate(date: Date): number {
  return date.getTime() / 86_400_000 + 2440587.5;
}

// IAU 1982 GMST formula.
export function greenwichSiderealTimeDegrees(date: Date): number {
  const jd = julianDate(date);
  const daysSinceJ2000 = jd - 2451545.0;
  const centuriesSinceJ2000 = daysSinceJ2000 / 36525;
  const gmst =
    280.46061837 +
    360.98564736629 * daysSinceJ2000 +
    0.000387933 * centuriesSinceJ2000 ** 2 -
    centuriesSinceJ2000 ** 3 / 38710000;
  return normalizeDegree(gmst);
}

export function eclipticToEquatorial(
  eclipticLongitudeDeg: number,
  obliquityDeg = OBLIQUITY_DEG
): { rightAscensionDeg: number; declinationDeg: number } {
  const lambda = deg2rad(eclipticLongitudeDeg);
  const eps = deg2rad(obliquityDeg);
  const decRad = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const raRad = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  return { rightAscensionDeg: normalizeDegree(rad2deg(raRad)), declinationDeg: rad2deg(decRad) };
}

const LATITUDE_STEP_DEG = 3;
const LATITUDE_LIMIT_DEG = 66; // stop short of the poles, where the geometry degenerates

export function computeAstrocartographyLines(
  placements: { planet: Planet; absoluteDegree: number }[],
  birthInstantUtc: Date
): AstrocartographyLine[] {
  const gst = greenwichSiderealTimeDegrees(birthInstantUtc);

  return placements.map(({ planet, absoluteDegree }) => {
    const { rightAscensionDeg, declinationDeg } = eclipticToEquatorial(absoluteDegree);
    const decRad = deg2rad(declinationDeg);

    const mcLongitude = toSignedLongitude(rightAscensionDeg - gst);
    const icLongitude = toSignedLongitude(mcLongitude + 180);

    const acPoints: GeoPoint[] = [];
    const dcPoints: GeoPoint[] = [];
    for (let lat = -LATITUDE_LIMIT_DEG; lat <= LATITUDE_LIMIT_DEG; lat += LATITUDE_STEP_DEG) {
      const latRad = deg2rad(lat);
      const cosH = -Math.tan(latRad) * Math.tan(decRad);
      if (cosH < -1 || cosH > 1) continue; // circumpolar or never-rises at this latitude for this declination
      const hourAngleDeg = rad2deg(Math.acos(cosH));
      acPoints.push({ lat, lon: toSignedLongitude(-hourAngleDeg + rightAscensionDeg - gst) });
      dcPoints.push({ lat, lon: toSignedLongitude(hourAngleDeg + rightAscensionDeg - gst) });
    }

    return { planet, mcLongitude, icLongitude, acPoints, dcPoints };
  });
}
