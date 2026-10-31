import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, random, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import photosJson from './photos.json';
import arenaJson from './arena.json';
import {dayTimes, readout, clock, waveY, DayTimes} from './sun';

export const FPS = 30;
const W = 1080, H = 1350;
// Sunset point on screen (fraction of frame); the wave crosses the horizon here.
const AX = 0.65, AY = 0.47;
const AMP = H * 0.14;        // wave height
const X0 = 40;               // sunrise x
const T_SAT = dayTimes(SAT0());
function SAT0() { return new Date('2026-10-31T21:00:00Z'); }
/** Screen position of the sun on the wave at a moment (sunrise at X0, sunset at AX). */
const sunPoint = (ms: number, t: DayTimes = T_SAT) => {
  const day = t.sunset.getTime() - t.sunrise.getTime();
  const x = X0 + (ms - t.sunrise.getTime()) * ((AX * W - X0) / day);
  return {x: x / W, y: (AY * H - waveY(ms, t) * AMP) / H};
};
const HAS_GOES = false;

// --- scenes (frames) ---
const OPEN = HAS_GOES ? 60 : 0;          // cold open: Earth terminator
const P0 = 0.02, P1 = 0.995;  // fraction of daylight covered by the montage
const HOLD = 150;                         // the clock beat
const END = 120;                          // end card

// Dates: the evening before clocks fall back, and the evening after.
const SAT = SAT0();
const SUN = new Date('2026-11-01T21:00:00Z');

type Photo = {id: string; file: string; w: number; h: number; sunX: number; sunY: number};
const ALL = [...(photosJson as Photo[]), ...(arenaJson as Photo[])];

/** Scale/offset that puts the photo's sun on the anchor while covering the frame. */
const fit = (p: Photo, zoom = 1, ax = AX, ay = AY) => {
  const sw = Math.max(ax * W / p.sunX, (1 - ax) * W / (1 - p.sunX));
  const sh = Math.max(ay * H / p.sunY, (1 - ay) * H / (1 - p.sunY));
  const cover = Math.max(W / p.w, H / p.h);
  const s = Math.max(sw / p.w, sh / p.h, cover) * 1.03 * zoom;
  return {s, over: s / cover, width: p.w * s, height: p.h * s, left: ax * W - p.sunX * p.w * s, top: ay * H - p.sunY * p.h * s};
};
// Ordered by sun height: dawn, climbing, high, descending, Peaks Island sunset.
const ORDER = [
  'arena_12421893', 'IMG_0833', 'arena_35371483', 'arena_3825128', 'arena_38315612',
  'IMG_7633', 'IMG_3145', '2018-12-02_16_11_32_468', 'arena_4070220', 'arena_539041',
  'arena_15315661', 'arena_14861172', 'arena_5711119', 'arena_86531', 'DSCF3304', 'IMG_1547',
  'arena_16184804', 'arena_13494802', 'IMG_0230', 'IMG_0237', 'IMG_0232', 'IMG_0236', 'IMG_0235',
  'IMG_0247', 'IMG_0248', 'IMG_0245',
];
const dayMs = (p: number) => T_SAT.sunrise.getTime() + p * (T_SAT.sunset.getTime() - T_SAT.sunrise.getTime());
// Pass 1: where along the day each candidate would land, and whether it fits there.
const CANDIDATES = ORDER.map((id) => ALL.find((p) => p.id === id)).filter(Boolean) as Photo[];
const SEQ = CANDIDATES.filter((p, i) => {
  const prog = P0 + (P1 - P0) * ((i + 0.5) / CANDIDATES.length);
  const a = sunPoint(dayMs(prog));
  return fit(p, 1, a.x, a.y).over < 2.6;
});
// Cuts accelerate toward sunset; the last one holds a touch longer.
const CUT_LENGTHS = SEQ.map((_, i) => (i === SEQ.length - 1 ? 16 : Math.max(7, Math.round(26 - i * 0.95))));
const CUTS = CUT_LENGTHS.reduce((a, b) => a + b, 0);
export const DURATION = OPEN + CUTS + HOLD + END;
const HERO = ALL.find((p) => p.id === 'IMG_0246')!;

export const useFonts = () => {
  const [handle] = useState(() => delayRender('fonts'));
  useEffect(() => {
    const faces = [
      new FontFace('Plantin', `url(${staticFile('fonts/plantin-regular.otf')})`),
      new FontFace('Plantin', `url(${staticFile('fonts/plantin-italic.otf')})`, {style: 'italic'}),
      new FontFace('Plantin', `url(${staticFile('fonts/plantin-bold-italic.otf')})`, {style: 'italic', weight: '700'}),
    ];
    Promise.all(faces.map((f) => f.load())).then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    });
  }, [handle]);
};

const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay'}}>
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 97} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  );
};

/** The sun wave: sunrise at the left edge, sunset on the anchor, night to the right. */
const Wave: React.FC<{t: DayTimes; nowMs: number; opacity?: number; dot?: boolean}> = ({t, nowMs, opacity = 0.9, dot}) => {
  const pts: string[] = [];
  const day = t.sunset.getTime() - t.sunrise.getTime();
  const x2t = (x: number) => t.sunrise.getTime() + (x - X0) * (day / (AX * W - X0));
  for (let x = -20; x <= W + 20; x += 6) pts.push(`${x},${AY * H - waveY(x2t(x), t) * AMP}`);
  const n = sunPoint(nowMs, t);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity}}>
      <defs><filter id="glow"><feGaussianBlur stdDeviation="3" /></filter></defs>
      <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={6} opacity={0.35} filter="url(#glow)" />
      <polyline points={pts.join(' ')} fill="none" stroke="#fff" strokeWidth={2.2} />
      {dot && <circle cx={n.x * W} cy={n.y * H} r={18} fill="#fff" />}
    </svg>
  );
};

const Readout: React.FC<{now: Date; clockText?: string; clockStyle?: React.CSSProperties}> = ({now, clockText, clockStyle}) => {
  const r = readout(now);
  return (
    <div style={{position: 'absolute', right: 64, top: H * 0.3, textAlign: 'right', color: '#fff', fontFamily: 'Plantin', fontSize: 50, lineHeight: 1.18, textShadow: '0 2px 18px rgba(0,0,0,.35)'}}>
      <div>{r.til}</div>
      <div>{r.past}</div>
      {clockText && <div style={{marginTop: 18, fontSize: 34, opacity: 0.6, fontVariantNumeric: 'tabular-nums', ...clockStyle}}>{clockText}</div>}
    </div>
  );
};

const Caption: React.FC<{text: string}> = ({text}) => (
  <div style={{position: 'absolute', left: 56, bottom: 64, color: '#fff', fontFamily: 'Plantin', fontSize: 26, letterSpacing: '0.22em', textTransform: 'uppercase'}}>{text}</div>
);

const Shot: React.FC<{p: Photo; len: number; zoomTo?: number; anchor: {x: number; y: number}}> = ({p, len, zoomTo = 1.05, anchor}) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [0, len], [1, zoomTo], {extrapolateRight: 'clamp'});
  const g = fit(p, z, anchor.x, anchor.y);
  return <Img src={staticFile(p.file)} style={{position: 'absolute', width: g.width, height: g.height, left: g.left, top: g.top, filter: 'contrast(1.04) saturate(1.08)'}} />;
};

// ---------- scenes ----------
const Open: React.FC = () => {
  const f = useCurrentFrame();
  const t = dayTimes(SAT);
  const o = interpolate(f, [0, 12, OPEN - 14, OPEN], [0, 1, 1, 0]);
  const now = new Date(t.sunset.getTime() - 5 * 60000);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <OffthreadVideo src={staticFile('goes_day300.mp4')} muted style={{position: 'absolute', width: H * 1.15, height: H * 1.15, left: (W - H * 1.15) / 2, top: -H * 0.075}} />
      <AbsoluteFill style={{opacity: o}}>
        <Wave t={t} nowMs={now.getTime()} opacity={0.75} />
        <Readout now={now} />
        <Caption text="Horizon time · Peaks Island, Maine" />
      </AbsoluteFill>
      <Grain />
    </AbsoluteFill>
  );
};

const Cuts: React.FC = () => {
  const f = useCurrentFrame();
  const t = T_SAT;
  const prog = interpolate(f, [0, CUTS], [P0, P1], {extrapolateRight: 'clamp'});
  const now = new Date(dayMs(prog));
  const anchor = sunPoint(now.getTime(), t);
  let start = 0;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {SEQ.map((p, i) => {
        const len = CUT_LENGTHS[i];
        const s = start; start += len;
        return (
          <Sequence key={p.id} from={s} durationInFrames={len} layout="none">
            <Shot p={p} len={len} anchor={anchor} zoomTo={1 + 0.02 * (i % 3) + 0.03} />
          </Sequence>
        );
      })}
      <Wave t={t} nowMs={now.getTime()} />
      <Readout now={now} />
      <Grain />
    </AbsoluteFill>
  );
};

const Hold: React.FC = () => {
  const f = useCurrentFrame();
  const flip = 55; // frame where the clocks fall back
  const sat = dayTimes(SAT), sun = dayTimes(SUN);
  const t = f < flip ? sat : sun;
  const now = new Date(t.sunset.getTime() - 5 * 60000);
  const glitch = f >= flip && f < flip + 10;
  const jitter = glitch ? (random(f) - 0.5) * 10 : 0;
  const line1 = interpolate(f, [flip + 18, flip + 32], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const line2 = interpolate(f, [flip + 48, flip + 62], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const g = fit(HERO, interpolate(f, [0, HOLD], [1.0, 1.08]));
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Img src={staticFile(HERO.file)} style={{position: 'absolute', width: g.width, height: g.height, left: g.left, top: g.top, filter: 'contrast(1.04) saturate(1.08)'}} />
      <AbsoluteFill style={{background: `linear-gradient(to top, rgba(0,0,0,${0.55 * line1}) 0%, rgba(0,0,0,0) 45%)`}} />
      <Wave t={t} nowMs={now.getTime()} />
      <Caption text="Peaks Island, Maine" />
      <Readout now={now} clockText={clock(now)} clockStyle={{transform: `translateX(${jitter}px)`, opacity: glitch ? 0.95 : 0.6, color: glitch ? '#ffd9b0' : '#fff'}} />
      <div style={{position: 'absolute', right: 64, top: H * 0.3 + 185, color: '#fff', fontFamily: 'Plantin', fontSize: 22, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55, textAlign: 'right'}}>
        {f < flip ? 'Sat · Oct 31' : 'Sun · Nov 1'}
      </div>
      <div style={{position: 'absolute', left: 56, right: 56, bottom: 110, color: '#fff', fontFamily: 'Plantin', fontStyle: 'italic', fontSize: 74, lineHeight: 1.08}}>
        <div style={{opacity: line1, transform: `translateY(${(1 - line1) * 20}px)`}}>Clocks fall back Sunday.</div>
        <div style={{opacity: line2, transform: `translateY(${(1 - line2) * 20}px)`}}>The sun doesn't.</div>
      </div>
      <Grain />
    </AbsoluteFill>
  );
};

/** Code-drawn horizon: sky gradient keyed to the sun's height, sun disc, wave. */
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const t = dayTimes(SUN);
  // the sun slides from just above the horizon to below it over the card
  const mins = interpolate(f, [0, END], [6, -14]);
  const now = new Date(t.sunset.getTime() - mins * 60000);
  const elev = mins / 6; // 1 = up, negative = set
  const sky = `linear-gradient(to bottom,
    rgb(${38 + 10 * elev},${40 + 18 * elev},${78 + 30 * elev}) 0%,
    rgb(${120 + 60 * elev},${70 + 40 * elev},${90}) ${AY * 100 - 8}%,
    rgb(${235},${120 + 20 * elev},${60}) ${AY * 100}%,
    rgb(${20},${18},${30}) ${AY * 100 + 0.2}%,
    rgb(${12},${12},${20}) 100%)`;
  const sunY = AY * H - elev * 120;
  const fade = interpolate(f, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  const logo = interpolate(f, [30, 50], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: sky, opacity: fade}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="halo"><stop offset="0" stopColor="#fff2c8" stopOpacity="0.9" /><stop offset="0.35" stopColor="#ffb14a" stopOpacity="0.55" /><stop offset="1" stopColor="#ff7a2a" stopOpacity="0" /></radialGradient>
          <clipPath id="sky"><rect x="0" y="0" width={W} height={AY * H} /></clipPath>
        </defs>
        <g clipPath="url(#sky)">
          <circle cx={AX * W} cy={sunY} r={300} fill="url(#halo)" />
          <circle cx={AX * W} cy={sunY} r={34} fill="#fff4d6" />
        </g>
        {/* sea reflection */}
        <rect x={AX * W - 60} y={AY * H} width={120} height={H * 0.3} fill="url(#halo)" opacity={0.35 + 0.3 * Math.max(0, elev)} />
      </svg>
      <Wave t={t} nowMs={now.getTime()} opacity={0.85} />
      <Readout now={now} />
      <div style={{position: 'absolute', left: 56, right: 56, bottom: 150, color: '#fff', fontFamily: 'Plantin', fontStyle: 'italic', fontSize: 64, lineHeight: 1.1, opacity: logo}}>
        Time that belongs to where you are.
      </div>
      <div style={{position: 'absolute', left: 56, bottom: 64, color: '#fff', fontFamily: 'Plantin', fontSize: 26, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: logo}}>paragonday.systems</div>
      <Img src={staticFile('logo.png')} style={{position: 'absolute', right: 56, bottom: 56, width: 110, opacity: logo, filter: 'brightness(0) invert(1)'}} />
      <Grain opacity={0.12} />
    </AbsoluteFill>
  );
};

export const SunWave: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      {HAS_GOES && <Sequence from={0} durationInFrames={OPEN}><Open /></Sequence>}
      <Sequence from={OPEN} durationInFrames={CUTS}><Cuts /></Sequence>
      <Sequence from={OPEN + CUTS} durationInFrames={HOLD}><Hold /></Sequence>
      <Sequence from={OPEN + CUTS + HOLD} durationInFrames={END}><EndCard /></Sequence>
    </AbsoluteFill>
  );
};
