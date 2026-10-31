import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {W, H, M, readout, caption, flat, ease, Mark, useFonts, paragon, clockIn, PEAKS, sunTimes} from './shared';

export const DURATION = 16 * 30;
// Mock of the app's time view inside a phone. Real version = screen recording of the build.
const PW = 560, PH = 1140, PX = (W - PW) / 2, PY = (H - PH) / 2 - 20;
const start = new Date('2026-11-01T02:00:00Z').getTime();   // 10pm EDT Saturday
const end = new Date('2026-11-01T12:30:00Z').getTime();     // 7:30am EST Sunday

export const D4ProductOvernight: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const intro = ease(f, 0, 20);
  const p = interpolate(f, [20, DURATION - 80], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const now = new Date(start + p * (end - start));
  const r = paragon(now);
  const clock = clockIn(now, PEAKS.tz);
  const fb = new Date('2026-11-01T06:00:00Z').getTime();
  const since = now.getTime() - fb;
  const flash = since > 0 && since < 20 * 60000 ? 1 - since / (20 * 60000) : 0;
  // in-app wave: sunset at left third, sunrise at right third; dot = now
  const set = sunTimes(new Date('2026-10-31T16:00:00Z')).sunset.getTime(), rise = sunTimes(new Date('2026-11-01T17:00:00Z')).sunrise.getTime();
  const q = (now.getTime() - set) / (rise - set);
  const wx0 = 40, wx1 = PW - 40, wy = 520, amp = 70;
  const pts: string[] = [];
  for (let x = wx0 - 60; x <= wx1 + 60; x += 4) { const u = (x - wx0) / (wx1 - wx0); pts.push(`${x},${wy + amp * Math.sin(Math.PI * u)}`); }
  const dx = wx0 + q * (wx1 - wx0), dy = wy + amp * Math.sin(Math.PI * q);
  const label = ease(f, DURATION - 70, DURATION - 50);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={{position: 'absolute', left: PX, top: PY, width: PW, height: PH, borderRadius: 54, background: '#0b0c12', border: '2px solid rgba(255,255,255,.14)', overflow: 'hidden', opacity: intro}}>
        {/* status bar: the system clock */}
        <div style={{position: 'absolute', left: 32, top: 22, ...flat(readout), fontSize: 22, color: flash ? '#ffd9b0' : '#fff', transform: `translateX(${flash * Math.sin(f * 1.9) * 4}px)`}}>{clock}</div>
        <div style={{position: 'absolute', right: 32, top: 24, ...flat(caption), fontSize: 14, opacity: 0.5}}>{since > 0 ? 'Sun' : 'Sat'}</div>
        {/* app readout */}
        <div style={{position: 'absolute', right: 36, top: 150, textAlign: 'right', ...flat(readout), fontSize: 44}}>
          <div>{r.primary}</div>
          <div style={{opacity: 0.55, fontSize: 30, marginTop: 4}}>{r.secondary}</div>
        </div>
        <div style={{position: 'absolute', left: 36, top: 160, ...flat(caption), fontSize: 16, opacity: 0.55}}>Peaks Island</div>
        <svg width={PW} height={PH} style={{position: 'absolute', inset: 0}}>
          <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.9} />
          <line x1={0} x2={PW} y1={wy} y2={wy} stroke="#fff" strokeWidth={1} opacity={0.15} />
          <circle cx={dx} cy={dy} r={9} fill="#fff" />
        </svg>
        <div style={{position: 'absolute', left: wx0 - 10, top: wy - 28, ...flat(caption), fontSize: 13, opacity: 0.45}}>sunset</div>
        <div style={{position: 'absolute', right: 30, top: wy - 28, ...flat(caption), fontSize: 13, opacity: 0.45}}>sunrise</div>
        <div style={{position: 'absolute', left: 36, right: 36, bottom: 60, ...flat(caption), fontSize: 15, opacity: 0.45, textTransform: 'none', letterSpacing: 0, lineHeight: 1.5}}>
          Night. The dot walks the trough at one speed. The clock up top is the only thing that jumps.
        </div>
      </div>
      <div style={{position: 'absolute', right: M, top: M, textAlign: 'right', ...flat(caption), opacity: 0.5 * intro}}>Saturday night → Sunday morning</div>
      <div style={{position: 'absolute', left: M, bottom: M, ...flat(readout), fontSize: 40, opacity: label}}>Your clock jumped. The app didn't.</div>
      <Mark opacity={intro} />
    </AbsoluteFill>
  );
};
