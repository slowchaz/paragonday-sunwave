/**
 * Sunset by the NOAA solar equations (the ones behind NOAA's solar calculator),
 * which agree with published tables to well under a minute. `suncalc` runs about
 * a minute late at sunset, enough to flip the displayed minute.
 */
const rad = Math.PI / 180;

/** Solar declination (deg) and equation of time (minutes) for a Julian day. */
const solar = (jd: number) => {
  const t = (jd - 2451545) / 36525;
  const L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const C = Math.sin(M * rad) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * M * rad) * (0.019993 - 0.000101 * t) + Math.sin(3 * M * rad) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * rad);
  const eps = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(omega * rad);
  const decl = Math.asin(Math.sin(eps * rad) * Math.sin(lambda * rad)) / rad;
  const y = Math.tan((eps / 2) * rad) ** 2;
  const eqt = 4 * (y * Math.sin(2 * L0 * rad) - 2 * e * Math.sin(M * rad) + 4 * e * y * Math.sin(M * rad) * Math.cos(2 * L0 * rad) - 0.5 * y * y * Math.sin(4 * L0 * rad) - 1.25 * e * e * Math.sin(2 * M * rad)) / rad;
  return {decl, eqt};
};

/** Hour angle (deg) at which the sun's upper limb meets the horizon, refraction included. */
const hourAngle = (lat: number, decl: number) =>
  Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl * rad)) - Math.tan(lat * rad) * Math.tan(decl * rad)) / rad;

/** Sunset, as a UTC Date, for the UTC calendar day y-m-d (m is 1..12) at lat/lon. */
export const sunsetUtc = (lat: number, lon: number, y: number, m: number, d: number): Date => {
  const dayStart = Date.UTC(y, m - 1, d);
  const jdNoon = dayStart / 86400000 + 2440587.5 + 0.5;
  let {decl, eqt} = solar(jdNoon - lon / 360);
  let minutes = 720 - 4 * (lon - hourAngle(lat, decl)) - eqt;
  ({decl, eqt} = solar(jdNoon + minutes / 1440 - 0.5));
  minutes = 720 - 4 * (lon - hourAngle(lat, decl)) - eqt;
  return new Date(dayStart + minutes * 60000);
};

/** The sunset that falls on local date y-m-d in the given IANA zone. */
export const sunsetOn = (lat: number, lon: number, tz: string, y: number, m: number, d: number): Date => {
  const want = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  for (const off of [-1, 0, 1]) {
    const probe = new Date(Date.UTC(y, m - 1, d + off));
    const s = sunsetUtc(lat, lon, probe.getUTCFullYear(), probe.getUTCMonth() + 1, probe.getUTCDate());
    if (s.toLocaleDateString('en-CA', {timeZone: tz}) === want) return s;
  }
  return sunsetUtc(lat, lon, y, m, d);
};

/** Clock time rounded to the nearest minute, in the zone. */
export const clockIn = (d: Date, tz: string) =>
  new Date(Math.round(d.getTime() / 60000) * 60000).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: tz});
