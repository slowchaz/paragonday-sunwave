import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, Easing, CalculateMetadataFunction} from 'remotion';
import {z} from 'zod';
import {sunsetOn, clockIn} from './noaa';
import {useFonts} from './SunWave';
import rows from './manyplaces.json';

export const FPS = 30;
const W = 1080, H = 1350;
const AX = 0.65, AY = 0.47;             // the fixed crossing: sun on the horizon, as in the still
const M = 56;
type Row = typeof rows[number];

// ---------------------------------------------------------------------------
// Studio controls. Every number here is in frames at 30fps unless it says otherwise.
// Edit them in the right-hand panel of Remotion Studio and press Save to write them back to Root.tsx.
// ---------------------------------------------------------------------------
export const manySunsSchema = z.object({
  pacing: z.object({
    opener: z.number().min(30).max(400).step(1).describe('Title card length: the sun lands on the anchor at this frame'),
    sunStart: z.number().min(0).max(200).step(1).describe('Frame the sun starts travelling on the title card'),
    crossfade: z.number().min(0).max(120).step(1).describe('Frames before the opener ends during which the first photo fades in'),
    firstCut: z.number().min(6).max(90).step(1).describe('Length of the first photo (frames)'),
    cutStep: z.number().min(0).max(3).step(0.1).describe('How much shorter each next cut gets (frames)'),
    shortestCut: z.number().min(3).max(60).step(1).describe('Floor for cut length (frames)'),
    holdMultiple: z.number().min(1).max(6).step(0.5).describe('Hold on the last photo, as a multiple of the first cut'),
    tally: z.number().min(60).max(600).step(1).describe('Tally screen length (frames)'),
    tallyFadeIn: z.number().min(0).max(90).step(1).describe('Frames the white fades in over the last photo'),
    tallyListIn: z.number().min(0).max(300).step(1).describe('Delay before the list starts (frames)'),
    tallyRowStagger: z.number().min(0).max(20).step(1).describe('Frames between rows appearing'),
    close: z.number().min(30).max(400).step(1).describe('Closing card length (frames)'),
    closeOut: z.number().min(0).max(120).step(1).describe('Frames the closing card takes to fade to white at the end'),
  }),
  text: z.object({
    titleCaption: z.string().describe('Bottom-left caption on the title card'),
    titleA: z.string(),
    titleB: z.string(),
    readout: z.string().describe('The constant readout'),
    tallyA: z.string(),
    tallyB: z.string(),
    closeA: z.string(),
    closeB: z.string(),
    closeCaption: z.string().describe('Bottom-left caption on the closing card'),
  }),
  look: z.object({
    grain: z.number().min(0).max(0.6).step(0.01).describe('Grain strength on borrowed photos'),
    vignette: z.number().min(0).max(1).step(0.05).describe('Vignette strength on borrowed photos'),
    filmOnOwnPhotos: z.boolean().describe('Also apply the film look to our own photos'),
    paperNoise: z.number().min(0).max(0.5).step(0.01).describe('Noise strength on the white cards'),
    lineColor: z.string().describe('Wave colour on the white cards (over photos it is white)'),
    sunColor: z.string().describe('The travelling sun on the title card'),
  }),
  sound: z.object({
    file: z.string().describe('Soundtrack under public/, empty for none'),
    volume: z.number().min(0).max(1).step(0.05),
  }),
});
export type ManySunsProps = z.infer<typeof manySunsSchema>;

/** Where every beat starts and how long it runs, from the pacing controls. */
const plan = (p: ManySunsProps['pacing']) => {
  const lens = rows.map((_, i) => (i === rows.length - 1 ? Math.round(p.firstCut * p.holdMultiple) : Math.max(p.shortestCut, Math.round(p.firstCut - i * p.cutStep))));
  const starts = lens.map((_, i) => p.opener + lens.slice(0, i).reduce((a, b) => a + b, 0));
  const cutsEnd = p.opener + lens.reduce((a, b) => a + b, 0);
  const crossfade = Math.min(p.crossfade, p.opener), fadeIn = Math.min(p.tallyFadeIn, lens[lens.length - 1]);
  return {open: p.opener, sunStart: Math.min(p.sunStart, p.opener - 1), crossfade, lens, starts, cutsEnd, list: p.tally, fadeIn, listIn: p.tallyListIn, stagger: p.tallyRowStagger, closeB: p.close, closeOut: Math.min(p.closeOut, p.close), duration: cutsEnd + p.tally + p.close};
};
type Plan = ReturnType<typeof plan>;

export const manySunsMetadata: CalculateMetadataFunction<ManySunsProps> = ({props}) => ({durationInFrames: plan(props.pacing).duration});

const shadow = '0 1px 14px rgba(0,0,0,.35), 0 0 2px rgba(0,0,0,.25)';
const readout: React.CSSProperties = {fontFamily: 'Plantin', color: '#fff', fontSize: 52, lineHeight: 1.16, WebkitTextStroke: '0.7px #fff', textShadow: shadow, fontVariantNumeric: 'tabular-nums'};
const caption: React.CSSProperties = {fontFamily: 'Plantin', color: '#fff', fontSize: 25, letterSpacing: '0.2em', textTransform: 'uppercase', WebkitTextStroke: '0.6px #fff', textShadow: shadow};
const ink = (st: React.CSSProperties): React.CSSProperties => ({...st, color: '#000', WebkitTextStroke: '0.5px #000', textShadow: 'none'});
const readoutInk = ink(readout), captionInk = ink(caption);
const ease = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});

/** Sunset on Saturday October 31 2026, local to the place, to the nearest minute. */
const times = (r: Row) => {
  const set = sunsetOn(r.lat, r.lon, r.tz, 2026, 10, 31);
  return {set, clock: clockIn(set, r.tz)};
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
const Wave: React.FC<{draw?: number; shift?: number; light?: number; color?: string; sunColor?: string; textured?: boolean}> = ({draw = 1, shift = 0, light, color = '#fff', sunColor = '#fff', textured = false}) => {
  const f = useCurrentFrame();
  const pts: string[] = [];
  for (let px = -10; px <= W + 10; px += 6) pts.push(`${px},${waveY(px, shift)}`);
  const total = (W + 20) * 1.08;            // path length estimate, enough for dash tricks
  const dash = `${total * draw} ${total}`;
  // a sun travelling the day: from sunrise, one span left of the crossing, to the crossing itself
  const lx = light === undefined ? null : AX * W + shift - HALF * (1 - light);
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
      <defs>
        {/* the sun: a soft-edged disc, no halo */}
        <filter id="sunsoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" /></filter>
        {/* a live pencil texture: the stroke wobbles a little and breaks up into grain, re-seeded every frame */}
        <filter id="linetex" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.3" numOctaves="2" seed={f % 97} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" result="wobbly" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={(f * 7) % 97} result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.2 -0.4" result="grainA" />
          <feComposite in="wobbly" in2="grainA" operator="in" />
        </filter>
      </defs>
      {textured ? (
        <g filter="url(#linetex)">
          <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={4} opacity={0.35} strokeDasharray={dash} />
          <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2.4} opacity={0.95} strokeDasharray={dash} />
        </g>
      ) : (
        <>
          <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={5} opacity={0.28} style={{filter: 'blur(2px)'}} strokeDasharray={dash} />
          <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={2} opacity={0.95} strokeDasharray={dash} />
        </>
      )}
      {lx !== null && lx > -40 && (
        <circle cx={lx} cy={waveY(lx, shift)} r={20} fill={sunColor} filter="url(#sunsoft)" />
      )}
    </svg>
  );
};

/** The card ground: white paper with a live noise texture. */
const Paper: React.FC<{noise: number}> = ({noise}) => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: '#fff'}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: noise, mixBlendMode: 'multiply'}}>
        <filter id="papernoise"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" seed={f % 97} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#papernoise)" />
      </svg>
    </>
  );
};

const Mark: React.FC<{opacity?: number; ink?: boolean; tint?: string}> = ({opacity = 1, ink, tint}) => {
  const base: React.CSSProperties = {position: 'absolute', right: M, bottom: M - 2, width: 96, opacity};
  if (tint) {
    const mask = `url(${staticFile('logo.png')}) center / contain no-repeat`;
    return <div style={{...base, aspectRatio: '99 / 50', background: tint, WebkitMask: mask, mask}} />;
  }
  return <Img src={staticFile('logo.png')} style={{...base, filter: ink ? 'brightness(0)' : 'brightness(0) invert(1) drop-shadow(0 1px 8px rgba(0,0,0,.35))'}} />;
};

const Title: React.FC<{p: Plan; text: ManySunsProps['text']; look: ManySunsProps['look']}> = ({p, text, look}) => {
  const f = useCurrentFrame();
  const o = ease(f, 0, 14);
  // the words step aside as the first photo rises; paper, wave and sun stay until the sun lands
  const words = 1 - ease(f, p.open - p.crossfade, p.open - p.crossfade / 2);   // gone before the readout rises
  const a = ease(f, 6, 22) * words, b = ease(f, 30, 46) * words;
  const draw = ease(f, 4, 40);
  // the sun sets off as the second line lands and reaches the anchor on the opener's last frame, where the first photo's sun takes over
  const sun = interpolate(f, [p.sunStart, p.open - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  return (
    <AbsoluteFill style={{background: '#fff', opacity: o}}>
      <Paper noise={look.paperNoise} />
      <Wave draw={draw} light={f >= p.sunStart ? sun : undefined} color={look.lineColor} sunColor={look.sunColor} textured />
      <div style={{position: 'absolute', left: M, bottom: M, ...captionInk, opacity: words}}>{text.titleCaption}</div>
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readoutInk}}>
        <div style={{opacity: a}}>{text.titleA}</div>
        <div style={{opacity: b}}>{text.titleB}</div>
      </div>
    </AbsoluteFill>
  );
};

/** Film look for the borrowed photos: softer blacks, less saturation, a warm wash, vignette, moving grain. */
const Film: React.FC<{look: ManySunsProps['look']}> = ({look}) => {
  const f = useCurrentFrame();
  return (
    <>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.38 * look.vignette}) 100%)`}} />
      <div style={{position: 'absolute', inset: 0, background: 'rgba(255,196,120,0.06)', mixBlendMode: 'screen'}} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: look.grain, mixBlendMode: 'overlay'}}>
        <filter id="filmgrain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 97} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="100%" height="100%" filter="url(#filmgrain)" />
      </svg>
    </>
  );
};

const Shot: React.FC<{r: Row; look: ManySunsProps['look']}> = ({r, look}) => {
  const g = fit(r);
  const film = look.filmOnOwnPhotos || !r.file.startsWith('photos/');   // our own Peaks Island frames stay clean by default
  return (
    <>
      <Img src={staticFile(r.file)} style={{position: 'absolute', width: g.width, height: g.height, left: g.left, top: g.top, filter: film ? 'contrast(1.06) saturate(0.8) sepia(0.2) brightness(0.97)' : undefined}} />
      {film && <Film look={look} />}
    </>
  );
};

/** Everything that is not the photo: wave, readout, caption, mark. Rendered once over all cuts. */
const Overlay: React.FC<{p: Plan; text: ManySunsProps['text']; force?: number}> = ({p, text, force}) => {
  const f = useCurrentFrame();
  const i = force ?? Math.max(0, p.starts.findIndex((s, k) => f >= s - p.open && f < s - p.open + p.lens[k]));
  const r = rows[i] ?? rows[rows.length - 1];
  const t = times(r);
  return (
    <>
      <Wave />
      {/* the constant: drawn once, never re-keyed, never moves */}
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout}}>{text.readout}</div>
      {/* the variable: a fresh element per cut */}
      <div key={i} style={{position: 'absolute', left: M, bottom: M, ...caption}}>
        <div style={{...readout, fontSize: 64, marginBottom: 10, textTransform: 'none', letterSpacing: 0}}>{t.clock}</div>
        <div>{r.city}, {r.region}</div>
      </div>
      <Mark />
    </>
  );
};

/** "Same time, everywhere." lands first, up top; then every place's clock time against the one reading, ending at the bottom edge. */
const Tally: React.FC<{p: Plan; text: ManySunsProps['text']; look: ManySunsProps['look']}> = ({p, text, look}) => {
  const f = useCurrentFrame() - p.fadeIn;          // 0 = the first frame on white
  const paper = ease(f + p.fadeIn, 0, p.fadeIn);   // white rises over the last photo
  const uniq: Row[] = [];
  const seenCity = new Set<string>();
  for (const r of rows) { const k = r.city + r.region; if (!seenCity.has(k)) { seenCity.add(k); uniq.push(r); } }
  const lineTop = H * 0.3;
  const rowH = Math.min(62, (H - M - lineTop - 200) / uniq.length);
  const fs = Math.min(42, rowH * 0.68);
  const top = H - M - uniq.length * rowH;          // the list ends on the bottom margin
  const out = 1 - ease(f, p.list - 10, p.list);
  const la = ease(f, 0, 16), lb = ease(f, 30, 46);  // the line, staggered
  const lock = ease(f, p.listIn + uniq.length * p.stagger + 20, p.listIn + uniq.length * p.stagger + 40);   // the right column settles brighter
  return (
    <AbsoluteFill style={{opacity: paper}}>
      <Paper noise={look.paperNoise} />
      <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', right: M, top: lineTop, textAlign: 'right', ...readoutInk, fontSize: 64}}>
        <div style={{opacity: la}}>{text.tallyA}</div>
        <div style={{opacity: lb}}>{text.tallyB}</div>
      </div>
      {uniq.map((r, i) => {
        const a = ease(f, p.listIn + i * p.stagger, p.listIn + i * p.stagger + 8);
        const t = times(r);
        return (
          <div key={r.city + i} style={{position: 'absolute', left: M, right: M, top: top + i * rowH, height: rowH, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', opacity: a, borderBottom: '1px solid rgba(0,0,0,.12)'}}>
            <div style={{display: 'flex', alignItems: 'baseline', gap: 18}}>
              <span style={{...readoutInk, fontSize: fs, minWidth: fs * 4.4, opacity: 1 - lock * 0.45}}>{t.clock}</span>
              <span style={{...captionInk, fontSize: fs * 0.56, opacity: 0.6 - lock * 0.25}}>{r.city}</span>
            </div>
            <span style={{...readoutInk, fontSize: fs}}>{text.readout}</span>
          </div>
        );
      })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CloseB: React.FC<{p: Plan; text: ManySunsProps['text']; look: ManySunsProps['look']}> = ({p, text, look}) => {
  const f = useCurrentFrame();
  const a = ease(f, 0, 16), b = ease(f, 30, 46), c = ease(f, 62, 78);
  const out = 1 - ease(f, p.closeB - p.closeOut, p.closeB);   // everything but the paper fades to white
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      <Paper noise={look.paperNoise} />
      <AbsoluteFill style={{opacity: out}}>
        <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readoutInk, fontSize: 52}}>
          <div style={{opacity: a}}>{text.closeA}</div>
          <div style={{opacity: b}}>{text.closeB}</div>
        </div>
        <div style={{position: 'absolute', left: M, bottom: M, ...captionInk, opacity: c}}>{text.closeCaption}</div>
        <Mark opacity={c} tint={look.sunColor} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const CrossIn: React.FC<{p: Plan; text: ManySunsProps['text']; look: ManySunsProps['look']}> = ({p, text, look}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: interpolate(f, [0, p.crossfade - 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)})}}>
      <Shot r={rows[0]} look={look} />
      <Overlay p={p} text={text} force={0} />
    </AbsoluteFill>
  );
};

export const ManySuns: React.FC<ManySunsProps> = ({pacing, text, look, sound}) => {
  useFonts();
  const p = plan(pacing);
  return (
    <AbsoluteFill style={{background: '#fff'}}>
      {sound.file && <Audio src={staticFile(sound.file)} volume={sound.volume} />}
      <Sequence from={0} durationInFrames={p.open}><Title p={p} text={text} look={look} /></Sequence>
      {/* the first photo, its wave and its readout rise over the title card while the sun closes in; full by the frame it lands */}
      {p.crossfade > 0 && (
        <Sequence from={p.open - p.crossfade} durationInFrames={p.crossfade}><CrossIn p={p} text={text} look={look} /></Sequence>
      )}
      {rows.map((r, i) => (
        <Sequence key={r.id + i} from={p.starts[i]} durationInFrames={p.lens[i]} layout="none"><Shot r={r} look={look} /></Sequence>
      ))}
      <Sequence from={p.open} durationInFrames={p.cutsEnd - p.open} layout="none"><Overlay p={p} text={text} /></Sequence>
      <Sequence from={p.cutsEnd - p.fadeIn} durationInFrames={p.fadeIn + p.list}><Tally p={p} text={text} look={look} /></Sequence>
      <Sequence from={p.cutsEnd + p.list} durationInFrames={p.closeB}><CloseB p={p} text={text} look={look} /></Sequence>
    </AbsoluteFill>
  );
};
