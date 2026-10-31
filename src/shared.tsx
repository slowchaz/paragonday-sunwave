import React from 'react';
import {Img, interpolate, staticFile, Easing} from 'remotion';
import SunCalc from 'suncalc';
export {useFonts} from './SunWave';

export const W = 1080, H = 1350, M = 56, FPS = 30;
export const AX = 0.65, AY = 0.47;
const shadow = '0 1px 14px rgba(0,0,0,.35), 0 0 2px rgba(0,0,0,.25)';
export const readout: React.CSSProperties = {fontFamily: 'Plantin', color: '#fff', fontSize: 52, lineHeight: 1.16, WebkitTextStroke: '0.7px #fff', textShadow: shadow, fontVariantNumeric: 'tabular-nums'};
export const caption: React.CSSProperties = {fontFamily: 'Plantin', color: '#fff', fontSize: 25, letterSpacing: '0.2em', textTransform: 'uppercase', WebkitTextStroke: '0.6px #fff', textShadow: shadow};
export const flat = (s: React.CSSProperties): React.CSSProperties => ({...s, textShadow: 'none'});
export const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
export const lin = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
const pad = (n: number) => String(n).padStart(2, '0');
export const hm = (ms: number) => { const m = Math.max(0, Math.round(ms / 60000)); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };
export const clockIn = (d: Date, tz: string) => d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: tz});

export const PEAKS = {lat: 43.6556, lon: -70.1989, tz: 'America/New_York'};
export const sunTimes = (d: Date, lat = PEAKS.lat, lon = PEAKS.lon) => SunCalc.getTimes(d, lat, lon);

/** Paragonday readout for an instant at a place. */
export const paragon = (now: Date, lat = PEAKS.lat, lon = PEAKS.lon) => {
  const t = sunTimes(now, lat, lon);
  const y = sunTimes(new Date(now.getTime() - 86400000), lat, lon);
  const n = sunTimes(new Date(now.getTime() + 86400000), lat, lon);
  if (now >= t.sunrise && now < t.sunset) return {primary: `-${hm(t.sunset.getTime() - now.getTime())} tilset`, secondary: `+${hm(now.getTime() - t.sunrise.getTime())} pastrise`, day: true};
  const lastSet = now >= t.sunset ? t.sunset : y.sunset;
  const nextRise = now >= t.sunset ? n.sunrise : t.sunrise;
  return {primary: `-${hm(nextRise.getTime() - now.getTime())} tilrise`, secondary: `+${hm(now.getTime() - lastSet.getTime())} pastset`, day: false};
};

export const AMP = H * 0.06, HALF = W * 0.72;
export const waveY = (px: number, x = AX * W, y = AY * H, amp = AMP, half = HALF) => y + amp * Math.sin((Math.PI * (px - x)) / half);

/** The brand wave through (x,y). draw 0..1 draws it on; sunAt (px) places a drawn sun on it. */
export const Wave: React.FC<{x?: number; y?: number; draw?: number; sunAt?: number | null; amp?: number; half?: number; opacity?: number}> = ({x = AX * W, y = AY * H, draw = 1, sunAt = null, amp = AMP, half = HALF, opacity = 1}) => {
  const pts: string[] = [];
  for (let px = -10; px <= W + 10; px += 6) pts.push(`${px},${waveY(px, x, y, amp, half)}`);
  const total = (W + 20) * 1.08;
  const dash = `${total * draw} ${total}`;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <defs><radialGradient id="sg"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient></defs>
      <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={5} opacity={0.28} style={{filter: 'blur(2px)'}} strokeDasharray={dash} />
      <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={2} opacity={0.95} strokeDasharray={dash} />
      {sunAt !== null && <><circle cx={sunAt} cy={waveY(sunAt, x, y, amp, half)} r={64} fill="url(#sg)" opacity={0.55} /><circle cx={sunAt} cy={waveY(sunAt, x, y, amp, half)} r={13} fill="#fff" /></>}
    </svg>
  );
};

export const Mark: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <Img src={staticFile('logo.png')} style={{position: 'absolute', right: M, bottom: M - 2, width: 96, opacity, filter: 'brightness(0) invert(1) drop-shadow(0 1px 8px rgba(0,0,0,.35))'}} />
);
