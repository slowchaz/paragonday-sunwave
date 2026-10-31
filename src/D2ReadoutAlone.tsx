import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {W, H, M, AX, AY, readout, caption, flat, ease, Mark, Wave, useFonts, paragon, sunTimes, clockIn, PEAKS, HALF} from './shared';

export const DURATION = 24 * 30;
// One full Paragonday: Saturday sunrise to Sunday sunrise, across the 2am fall-back.
const t0 = sunTimes(new Date('2026-10-31T16:00:00Z')).sunrise;          // Sat sunrise, Peaks Island
const t1 = sunTimes(new Date('2026-11-01T17:00:00Z')).sunrise;          // Sun sunrise
const set = sunTimes(new Date('2026-10-31T16:00:00Z')).sunset;

export const D2ReadoutAlone: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const intro = ease(f, 0, 30);
  const p = interpolate(f, [30, DURATION - 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const now = new Date(t0.getTime() + p * (t1.getTime() - t0.getTime()));
  const r = paragon(now);
  // sun position: day half from x0 to crossing, night half from crossing to x0 + 2*HALF
  const dayFrac = (set.getTime() - t0.getTime()) / (t1.getTime() - t0.getTime());
  const x0 = AX * W - HALF;
  const sunAt = now < set ? x0 + HALF * ((now.getTime() - t0.getTime()) / (set.getTime() - t0.getTime())) : AX * W + HALF * ((now.getTime() - set.getTime()) / (t1.getTime() - set.getTime()));
  const clock = clockIn(now, PEAKS.tz);
  // the moment the clock falls back: 2:00 EDT -> 1:00 EST
  const fallback = new Date('2026-11-01T06:00:00Z').getTime();
  const sinceFB = now.getTime() - fallback;
  const flash = sinceFB > 0 && sinceFB < 25 * 60000 ? 1 - sinceFB / (25 * 60000) : 0;
  const night = r.day ? 0 : 1;
  const label = ease(f, DURATION - 70, DURATION - 50);
  void dayFrac;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Wave draw={intro} sunAt={f > 30 ? sunAt : null} />
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout, opacity: intro}}>
        <div>{r.primary}</div>
        <div style={{opacity: 0.6}}>{r.secondary}</div>
      </div>
      <div style={{position: 'absolute', left: M, bottom: M, ...flat(caption), opacity: intro}}>
        <div style={{fontSize: 20, opacity: 0.55, marginBottom: 8}}>Peaks Island · clock</div>
        <div style={{...flat(readout), fontSize: 44, color: flash > 0 ? '#ffd9b0' : '#fff', transform: `translateX(${flash * (Math.sin(f * 1.7) * 6)}px)`}}>{clock}</div>
        <div style={{fontSize: 18, opacity: 0.5 + flash * 0.5, marginTop: 6, textTransform: 'none', letterSpacing: 0}}>{sinceFB > 0 ? 'Sunday · clocks fell back' : 'Saturday'}</div>
      </div>
      <div style={{position: 'absolute', left: M, right: M, top: H * 0.3 + 150, textAlign: 'right', ...flat(readout), fontSize: 36, opacity: label}}>The sun kept time.</div>
      <AbsoluteFill style={{background: '#000', opacity: night * 0.0}} />
      <Mark opacity={intro} />
      <div style={{position: 'absolute', left: M, top: M, ...flat(caption), opacity: 0.45 * intro}}>One day · Sat Oct 31 → Sun Nov 1</div>
      <div style={{position: 'absolute', left: AX * W - HALF, top: AY * H + 26, ...flat(caption), fontSize: 16, opacity: 0.4 * intro}}>sunrise</div>
      <div style={{position: 'absolute', left: AX * W - 30, top: AY * H + 26, ...flat(caption), fontSize: 16, opacity: 0.4 * intro}}>sunset</div>
    </AbsoluteFill>
  );
};
