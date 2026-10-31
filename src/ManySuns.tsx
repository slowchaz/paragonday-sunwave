import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, Easing} from 'remotion';
import SunCalc from 'suncalc';
import {useFonts} from './SunWave';
import rows from './manyplaces.json';

export const FPS = 30;
const W = 1080, H = 1350;
const AX = 0.65, AY = 0.47;             // the fixed crossing: sun on the horizon, as in the still
const M = 56;
type Row = typeof rows[number];

// --- pacing: cuts shorten toward the end, the last frame holds ---
const OPEN = 132;
const HOLD = 90;
const LENS = rows.map((_, i) => (i === rows.length - 1 ? HOLD : Math.max(12, Math.round(22 - i * 0.6))));
const STARTS = LENS.map((_, i) => OPEN + LENS.slice(0, i).reduce((a, b) => a + b, 0));
const CUTS_END = OPEN + LENS.reduce((a, b) => a + b, 0);
const LIST = 230, CLOSE_A = 84, CLOSE_B = 120;
export const DURATION = CUTS_END + LIST + CLOSE_A + CLOSE_B;

const shadow = '0 1px 14px rgba(0,0,0,.35), 0 0 2px rgba(0,0,0,.25)';
const readout: React.CSSProperties = {fontFamily: 'Plantin', color: '#fff', fontSize: 52, lineHeight: 1.16, WebkitTextStroke: '0.7px #fff', textShadow: shadow, fontVariantNumeric: 'tabular-nums'};
const caption: React.CSSProperties = {fontFamily: 'Plantin', color: '#fff', fontSize: 25, letterSpacing: '0.2em', textTransform: 'uppercase', WebkitTextStroke: '0.6px #fff', textShadow: shadow};
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
const pad = (n: number) => String(n).padStart(2, '0');
const hm = (ms: number) => `${pad(Math.floor(ms / 3600000))}:${pad(Math.round((ms % 3600000) / 60000))}`;

const times = (r: Row) => {
  const localNoon = new Date(Date.UTC(2026, 9, 31, 12) - (r.lon / 15) * 3600000);
  const t = SunCalc.getTimes(localNoon, r.lat, r.lon);
  return {set: t.sunset, rise: t.sunrise, clock: t.sunset.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', timeZone: r.tz})};
};

/** Match cut: scale and offset so the photo's sun lands exactly on (AX, AY) while covering the frame. */
const fit = (r: Row) => {
  const sw = Math.max(AX * W / r.sunX, (1 - AX) * W / (1 - r.sunX));
  const sh = Math.max(AY * H / r.sunY, (1 - AY) * H / (1 - r.sunY));
  const cover = Math.max(W / r.w, H / r.h);
  const s = Math.max(sw / r.w, sh / r.h, cover) * 1.02;
  return {width: r.w * s, height: r.h * s, left: AX * W - r.sunX * r.w * s, top: AY * H - r.sunY * r.h * s};
};

const AMP = H * 0.06, HALF = W * 0.72;   // half-wavelength = one daylight span
const waveY = (px: number, shift: number) => AY * H + AMP * Math.sin((Math.PI * (px - (AX * W + shift))) / HALF);

/**
 * The wave. `draw` 0..1 draws it on left to right. `shift` (px) slides it so the sunset crossing moves
 * left of the sun once the sun has set. `light` 0..1 is a point of light travelling the day's path toward the sun.
 */
const Wave: React.FC<{draw?: number; shift?: number; light?: number}> = ({draw = 1, shift = 0, light}) => {
  const pts: string[] = [];
  for (let px = -10; px <= W + 10; px += 6) pts.push(`${px},${waveY(px, shift)}`);
  const total = (W + 20) * 1.08;            // path length estimate, enough for dash tricks
  const dash = `${total * draw} ${total}`;
  // a sun travelling the day: from sunrise, one span left of the crossing, to the crossing itself
  const lx = light === undefined ? null : AX * W + shift - HALF * (1 - light);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        <radialGradient id="lightglow"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={5} opacity={0.28} style={{filter: 'blur(2px)'}} strokeDasharray={dash} />
      <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={2} opacity={0.95} strokeDasharray={dash} />
      {lx !== null && lx > -40 && (
        <>
          <circle cx={lx} cy={waveY(lx, shift)} r={64} fill="url(#lightglow)" opacity={0.55} />
          <circle cx={lx} cy={waveY(lx, shift)} r={13} fill="#fff" />
        </>
      )}
    </svg>
  );
};

const Mark: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <Img src={staticFile('logo.png')} style={{position: 'absolute', right: M, bottom: M - 2, width: 96, opacity, filter: 'brightness(0) invert(1) drop-shadow(0 1px 8px rgba(0,0,0,.35))'}} />
);

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const o = Math.min(ease(f, 0, 14), 1 - ease(f, OPEN - 8, OPEN));
  const a = ease(f, 6, 22), b = ease(f, 30, 46);
  const draw = ease(f, 4, 40);
  const sun = interpolate(f, [44, OPEN - 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  return (
    <AbsoluteFill style={{background: '#000', opacity: o}}>
      <Wave draw={draw} light={f >= 44 ? sun : undefined} />
      <div style={{position: 'absolute', left: M, bottom: M, ...caption}}>Saturday, October 31</div>
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout}}>
        <div style={{opacity: a}}>Clocks fall back tonight.</div>
        <div style={{opacity: b}}>Watch the sun.</div>
      </div>
    </AbsoluteFill>
  );
};

const Shot: React.FC<{r: Row}> = ({r}) => {
  const g = fit(r);
  return <Img src={staticFile(r.file)} style={{position: 'absolute', width: g.width, height: g.height, left: g.left, top: g.top}} />;
};

/** Everything that is not the photo: wave, readout, caption, mark. Rendered once over all cuts. */
const Overlay: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(0, STARTS.findIndex((s, k) => f >= s - OPEN && f < s - OPEN + LENS[k]));
  const r = rows[i] ?? rows[rows.length - 1];
  const t = times(r);
  return (
    <>
      <Wave />
      {/* the constant: drawn once, never re-keyed, never moves */}
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout}}>-00:00 tilset</div>
      {/* the variable: a fresh element per cut */}
      <div key={i} style={{position: 'absolute', left: M, bottom: M, ...caption}}>
        <div style={{...readout, fontSize: 64, marginBottom: 10, textTransform: 'none', letterSpacing: 0}}>{t.clock}</div>
        <div>{r.city}, {r.region}</div>
      </div>
      <Mark />
    </>
  );
};

/** Every place's clock time at sunset against the one Horizon Time reading. */
const Tally: React.FC = () => {
  const f = useCurrentFrame();
  const uniq: Row[] = [];
  const seenCity = new Set<string>();
  for (const r of rows) { const k = r.city + r.region; if (!seenCity.has(k)) { seenCity.add(k); uniq.push(r); } }
  const rowH = Math.min(52, (H - 2 * M - 80) / uniq.length);
  const fs = Math.min(34, rowH * 0.66);
  const top = (H - uniq.length * rowH) / 2;
  const out = 1 - ease(f, LIST - 10, LIST);
  const lock = ease(f, uniq.length * 4 + 20, uniq.length * 4 + 40);   // the right column settles brighter
  return (
    <AbsoluteFill style={{background: '#000', opacity: out}}>
      {uniq.map((r, i) => {
        const a = ease(f, i * 4, i * 4 + 8);
        const t = times(r);
        return (
          <div key={r.city + i} style={{position: 'absolute', left: M, right: M, top: top + i * rowH, height: rowH, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', opacity: a, borderBottom: '1px solid rgba(255,255,255,.10)'}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
              <span style={{...readout, fontSize: fs, textShadow: 'none', minWidth: fs * 4.4, opacity: 1 - lock * 0.45}}>{t.clock}</span>
              <span style={{...caption, fontSize: fs * 0.56, textShadow: 'none', opacity: 0.6 - lock * 0.25}}>{r.city}</span>
            </div>
            <span style={{...readout, fontSize: fs, textShadow: 'none'}}>-00:00 tilset</span>
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

export const ManySuns: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence from={0} durationInFrames={OPEN}><Title /></Sequence>
      {rows.map((r, i) => (
        <Sequence key={r.id + i} from={STARTS[i]} durationInFrames={LENS[i]} layout="none"><Shot r={r} /></Sequence>
      ))}
      <Sequence from={OPEN} durationInFrames={CUTS_END - OPEN} layout="none"><Overlay /></Sequence>
      <Sequence from={CUTS_END} durationInFrames={LIST}><Tally /></Sequence>
      <Sequence from={CUTS_END + LIST} durationInFrames={CLOSE_A}><CloseA /></Sequence>
      <Sequence from={CUTS_END + LIST + CLOSE_A} durationInFrames={CLOSE_B}><CloseB /></Sequence>
    </AbsoluteFill>
  );
};
