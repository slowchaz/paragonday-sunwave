import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import {useFonts} from './SunWave';
import {PLACES, sunsetOn, sunriseOn, clockIn, Place} from './places';

export const FPS = 30;
const W = 1080, H = 1350;
const OPEN = 54;
const HOLDS = PLACES.map((_, i) => (i === 0 ? 78 : i < 4 ? 50 : 44));
const STARTS = HOLDS.map((_, i) => OPEN + HOLDS.slice(0, i).reduce((a, b) => a + b, 0));
const CUTS_END = OPEN + HOLDS.reduce((a, b) => a + b, 0);
const LIST = 140, CLOSE_A = 84, CLOSE_B = 120;
export const DURATION = CUTS_END + LIST + CLOSE_A + CLOSE_B;

// --- type, matched to the Peaks Island still ---
const M = 56;
const shadow = '0 1px 14px rgba(0,0,0,.35), 0 0 2px rgba(0,0,0,.25)';
const readout: React.CSSProperties = {fontFamily: 'Plantin', color: '#fff', fontSize: 52, lineHeight: 1.16, WebkitTextStroke: '0.7px #fff', textShadow: shadow, fontVariantNumeric: 'tabular-nums'};
const caption: React.CSSProperties = {fontFamily: 'Plantin', color: '#fff', fontSize: 25, letterSpacing: '0.2em', textTransform: 'uppercase', WebkitTextStroke: '0.6px #fff', textShadow: shadow};
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
const pad = (n: number) => String(n).padStart(2, '0');
const hm = (ms: number) => `${pad(Math.floor(ms / 3600000))}:${pad(Math.round((ms % 3600000) / 60000))}`;

/** Where the wave crosses: the photo's horizon, directly under its sun, after object-fit: cover. */
const sunOnScreen = (p: Place) => {
  const s = Math.max(W / p.w, H / p.h);
  const [fx, fy] = p.focus ?? [0.5, 0.5];
  const left = (W - p.w * s) * fx, top = (H - p.h * s) * fy;
  return {x: left + p.sun[0] * p.w * s, y: top + (p.horizon ?? p.sun[1]) * p.h * s};
};

/** The thin wave from the still: crest to the left, crossing the horizon at the sun, trough to the right. */
const Wave: React.FC<{x: number; y: number}> = ({x, y}) => {
  const amp = H * 0.06, half = W * 0.72;
  const pts: string[] = [];
  for (let px = -10; px <= W + 10; px += 6) pts.push(`${px},${y + amp * Math.sin((Math.PI * (px - x)) / half)}`);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={5} opacity={0.28} style={{filter: 'blur(2px)'}} />
      <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={2} opacity={0.95} />
    </svg>
  );
};

const Mark: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <Img src={staticFile('logo.png')} style={{position: 'absolute', right: M, bottom: M - 2, width: 96, opacity, filter: 'brightness(0) invert(1) drop-shadow(0 1px 8px rgba(0,0,0,.35))'}} />
);

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const o = Math.min(ease(f, 0, 14), 1 - ease(f, OPEN - 10, OPEN));
  return (
    <AbsoluteFill style={{background: '#000', opacity: o}}>
      <div style={{position: 'absolute', left: M, bottom: M, ...caption}}>Saturday, October 31</div>
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout}}>Nine sunsets.</div>
    </AbsoluteFill>
  );
};

const Frame: React.FC<{place: Place; i: number}> = ({place, i}) => {
  const f = useCurrentFrame();
  const set = sunsetOn(place), rise = sunriseOn(place);
  const t = clockIn(set, place.tz);
  const a = i === 0 ? ease(f, 0, 14) : 1;
  const [fx, fy] = place.focus ?? [0.5, 0.5];
  const s = sunOnScreen(place);
  // Readout sits at 0.3H like the still, unless the wave runs through that zone; then it drops under the wave.
  const crestTop = s.y - H * 0.06, troughBottom = s.y + H * 0.06;
  const readoutTop = crestTop > H * 0.3 + 130 ? H * 0.3 : troughBottom + 28;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Img src={staticFile(place.photo)} style={{position: 'absolute', inset: 0, width: W, height: H, objectFit: 'cover', objectPosition: `${fx * 100}% ${fy * 100}%`, opacity: a}} />
      <Wave x={s.x} y={s.y} />
      <div style={{position: 'absolute', right: M, top: readoutTop, textAlign: 'right', ...readout}}>
        <div>-00:00 tilset</div>
        <div>+{hm(set.getTime() - rise.getTime())} pastrise</div>
      </div>
      <div style={{position: 'absolute', left: M, bottom: M, ...caption}}>
        <div>{place.city}, {place.region}</div>
        <div style={{marginTop: 10, opacity: 0.85}}>{t}</div>
      </div>
      <Mark />
    </AbsoluteFill>
  );
};

const Tally: React.FC = () => {
  const f = useCurrentFrame();
  const rowH = 84, top = (H - PLACES.length * rowH) / 2;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {PLACES.map((p, i) => {
        const a = ease(f, i * 6, i * 6 + 10);
        return (
          <div key={p.city} style={{position: 'absolute', left: M, right: M, top: top + i * rowH, height: rowH, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', opacity: a, borderBottom: '1px solid rgba(255,255,255,.14)'}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 20}}>
              <span style={{...readout, fontSize: 40, textShadow: 'none', minWidth: 190}}>{clockIn(sunsetOn(p), p.tz)}</span>
              <span style={{...caption, fontSize: 17, textShadow: 'none', opacity: 0.7}}>{p.city}</span>
            </div>
            <span style={{...readout, fontSize: 40, textShadow: 'none'}}>-00:00 tilset</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const CloseA: React.FC = () => {
  const f = useCurrentFrame();
  const o = Math.min(ease(f, 0, 16), 1 - ease(f, CLOSE_A - 10, CLOSE_A));
  return (
    <AbsoluteFill style={{background: '#000', opacity: o}}>
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout, fontSize: 64}}>Same time,<br />everywhere.</div>
    </AbsoluteFill>
  );
};

const CloseB: React.FC = () => {
  const f = useCurrentFrame();
  const a = ease(f, 0, 16), b = ease(f, 30, 46), c = ease(f, 62, 78);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout, fontSize: 52}}>
        <div style={{opacity: a}}>Clocks fall back Sunday.</div>
        <div style={{opacity: b}}>Sunset stays at -00:00.</div>
      </div>
      <div style={{position: 'absolute', left: M, bottom: M, ...caption, opacity: c}}>paragonday.systems</div>
      <Mark opacity={c} />
    </AbsoluteFill>
  );
};

export const SameTime: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={0} durationInFrames={OPEN}><Title /></Sequence>
      {PLACES.map((p, i) => (
        <Sequence key={p.city} from={STARTS[i]} durationInFrames={HOLDS[i]}><Frame place={p} i={i} /></Sequence>
      ))}
      <Sequence from={CUTS_END} durationInFrames={LIST}><Tally /></Sequence>
      <Sequence from={CUTS_END + LIST} durationInFrames={CLOSE_A}><CloseA /></Sequence>
      <Sequence from={CUTS_END + LIST + CLOSE_A} durationInFrames={CLOSE_B}><CloseB /></Sequence>
    </AbsoluteFill>
  );
};
