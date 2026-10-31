import SunCalc from 'suncalc';

// Peaks Island, Maine
export const LAT = 43.6556;
export const LON = -70.1989;

export type DayTimes = {sunrise: Date; sunset: Date; nextSunrise: Date; prevSunset: Date};

export const dayTimes = (d: Date, lat = LAT, lon = LON): DayTimes => {
  const t = SunCalc.getTimes(d, lat, lon);
  const tomorrow = SunCalc.getTimes(new Date(d.getTime() + 86400000), lat, lon);
  const yesterday = SunCalc.getTimes(new Date(d.getTime() - 86400000), lat, lon);
  return {sunrise: t.sunrise, sunset: t.sunset, nextSunrise: tomorrow.sunrise, prevSunset: yesterday.sunset};
};

const pad = (n: number) => String(n).padStart(2, '0');
export const hm = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60000));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

/** Paragonday dual readout for a moment. */
export const readout = (now: Date, lat = LAT, lon = LON) => {
  const t = dayTimes(now, lat, lon);
  if (now >= t.sunrise && now < t.sunset) {
    return {til: `-${hm(t.sunset.getTime() - now.getTime())} tilset`, past: `+${hm(now.getTime() - t.sunrise.getTime())} pastrise`, day: true};
  }
  const lastSet = now >= t.sunset ? t.sunset : t.prevSunset;
  const nextRise = now >= t.sunset ? t.nextSunrise : t.sunrise;
  return {til: `-${hm(nextRise.getTime() - now.getTime())} tilrise`, past: `+${hm(now.getTime() - lastSet.getTime())} pastset`, day: false};
};

/** Clock time in local Maine time, 12h. */
export const clock = (d: Date) =>
  d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'});

/**
 * Wave y (−1..1, +1 = zenith) for a moment, per the Paragonday spec:
 * day half above the line from sunrise to sunset, night half below until next sunrise.
 */
export const waveY = (ms: number, t: DayTimes): number => {
  if (ms >= t.sunrise.getTime() && ms < t.sunset.getTime()) {
    const p = (ms - t.sunrise.getTime()) / (t.sunset.getTime() - t.sunrise.getTime());
    return Math.sin(p * Math.PI);
  }
  const set = ms >= t.sunset.getTime() ? t.sunset.getTime() : t.prevSunset.getTime();
  const rise = ms >= t.sunset.getTime() ? t.nextSunrise.getTime() : t.sunrise.getTime();
  const p = (ms - set) / (rise - set);
  return -Math.sin(p * Math.PI);
};
