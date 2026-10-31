import SunCalc from 'suncalc';

export type Place = {city: string; region: string; lat: number; lon: number; tz: string; photo: string; w: number; h: number; sun: [number, number]; horizon?: number; focus?: [number, number]};
// `sun` = sun position in the photo (fractions). `horizon` = horizon line height in the photo (fraction); the wave crosses there, under the sun.

// Stand-in photos for now: only Peaks Island is really the place it says.
export const PLACES: Place[] = [
  {city: 'Peaks Island', region: 'Maine', lat: 43.6556, lon: -70.1989, tz: 'America/New_York', photo: 'photos/IMG_0246.jpg', w: 1215, h: 1620, sun: [0.657, 0.486], horizon: 0.49},
  {city: 'Alicudi', region: 'Italy', lat: 38.5417, lon: 14.3500, tz: 'Europe/Rome', photo: 'same/23188723.jpg', w: 1500, h: 2000, sun: [0.5495, 0.4368], horizon: 0.445},
  {city: 'Capri', region: 'Italy', lat: 40.5532, lon: 14.2222, tz: 'Europe/Rome', photo: 'same/8618785.jpg', w: 1000, h: 799, sun: [0.6, 0.34], horizon: 0.34, focus: [0.5, 0.5]},
  {city: 'Tokyo', region: 'Japan', lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo', photo: 'same/47583931.jpg', w: 2000, h: 1125, sun: [0.4682, 0.3041], horizon: 0.37, focus: [0.45, 0.5]},
  {city: 'Oia', region: 'Greece', lat: 36.4618, lon: 25.3753, tz: 'Europe/Athens', photo: 'same/10333628.jpg', w: 1500, h: 2000, sun: [0.5037, 0.4931], horizon: 0.50},
  {city: 'Big Sur', region: 'California', lat: 36.2704, lon: -121.8081, tz: 'America/Los_Angeles', photo: 'same/23470430.jpg', w: 852, h: 1132, sun: [0.55, 0.384], horizon: 0.40},
  {city: 'Honolulu', region: 'Hawaiʻi', lat: 21.3069, lon: -157.8583, tz: 'Pacific/Honolulu', photo: 'same/23786343.jpg', w: 1500, h: 2000, sun: [0.445, 0.704], horizon: 0.71},
  {city: 'Lisbon', region: 'Portugal', lat: 38.7223, lon: -9.1393, tz: 'Europe/Lisbon', photo: 'same/23188736.jpg', w: 1500, h: 2000, sun: [0.3787, 0.4661], horizon: 0.47},
  {city: 'Ulaanbaatar', region: 'Mongolia', lat: 47.8864, lon: 106.9057, tz: 'Asia/Ulaanbaatar', photo: 'arena/16184804.jpg', w: 640, h: 640, sun: [0.711, 0.607], horizon: 0.62},
];

/** Local sunrise on Sat Oct 31 2026 for a place. */
export const sunriseOn = (p: Place, y = 2026, m = 9, d = 31) => {
  const localNoon = new Date(Date.UTC(y, m, d, 12) - (p.lon / 15) * 3600000);
  return SunCalc.getTimes(localNoon, p.lat, p.lon).sunrise;
};

/** Local sunset on Sat Oct 31 2026 for a place. */
export const sunsetOn = (p: Place, y = 2026, m = 9, d = 31) => {
  const localNoon = new Date(Date.UTC(y, m, d, 12) - (p.lon / 15) * 3600000);
  return SunCalc.getTimes(localNoon, p.lat, p.lon).sunset;
};

export const clockIn = (date: Date, tz: string) =>
  date.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: tz});
