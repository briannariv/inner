// Real (not mocked) timezone resolution: hosted astrology APIs generally
// need a UTC offset in hours for the exact birth instant (not just the
// modern offset for that place), because historical DST/zone rules vary by
// date. `geo-tz` maps lat/lon to an IANA zone id with no network call and no
// external service dependency; `luxon` then resolves that zone's offset for
// the specific birth date/time, DST included.
import { find as findTimezone } from "geo-tz";
import { DateTime } from "luxon";

export interface ResolvedTimezone {
  ianaZone: string;
  utcOffsetHours: number; // e.g. 5.5 for IST, -4 for EDT
}

function localDateTime(date: string, time: string, lat: number, lon: number): DateTime {
  const zones = findTimezone(lat, lon);
  const ianaZone = zones[0];
  if (!ianaZone) {
    throw new Error(`Could not resolve a timezone for lat=${lat}, lon=${lon}`);
  }
  const dt = DateTime.fromISO(`${date}T${time}`, { zone: ianaZone });
  if (!dt.isValid) {
    throw new Error(`Could not resolve local time ${date}T${time} in zone ${ianaZone}: ${dt.invalidReason}`);
  }
  return dt;
}

export function resolveTimezone(date: string, time: string, lat: number, lon: number): ResolvedTimezone {
  const dt = localDateTime(date, time, lat, lon);
  return { ianaZone: dt.zoneName!, utcOffsetHours: dt.offset / 60 };
}

// Native Date doesn't know the birth location's timezone — `new Date(isoStringWithoutZ)`
// parses in *this process's* local time, which is wrong for a birth instant
// in another zone. Route everything that needs a real UTC instant through
// luxon's zone-aware parsing instead.
export function resolveBirthInstantUtc(date: string, time: string, lat: number, lon: number): Date {
  return localDateTime(date, time, lat, lon).toUTC().toJSDate();
}
