import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {W, H, M, readout, caption, flat, ease, Mark, useFonts, paragon, clockIn} from './shared';

// Stand-in thread. Photos are yours; names, places, times and lines are placeholders for the real Sunday texts.
type Msg = {who: string; photo: string; text: string; place: string; lat: number; lon: number; tz: string; local: string; focus?: string};
const MSGS: Msg[] = [
  {who: 'B.', photo: 'photos/IMG_7633.jpg', text: 'time didn’t change for us.', place: 'Oakland', lat: 37.8, lon: -122.27, tz: 'America/Los_Angeles', local: '2026-11-01T06:38:00-08:00'},
  {who: 'M.', photo: 'photos/IMG_0833.jpg', text: 'foggy. still on time.', place: 'Peaks Island', lat: 43.6556, lon: -70.1989, tz: 'America/New_York', local: '2026-11-01T06:21:00-05:00'},
  {who: 'K.', photo: 'photos/IMG_3145.jpg', text: 'phone says 6:10. sun says +00:04.', place: 'Atlanta', lat: 33.75, lon: -84.39, tz: 'America/New_York', local: '2026-11-01T07:01:00-05:00'},
  {who: 'J.', photo: 'photos/DSCF3335.jpg', text: 'nobody told the sun.', place: 'Marfa', lat: 30.31, lon: -104.02, tz: 'America/Chicago', local: '2026-11-01T07:10:00-06:00'},
  {who: 'A.', photo: 'photos/2018-12-02_16_11_32_468.jpg', text: 'up before the alarm. alarm was wrong anyway.', place: 'Portland', lat: 43.66, lon: -70.26, tz: 'America/New_York', local: '2026-11-01T06:24:00-05:00'},
  {who: 'R.', photo: 'photos/IMG_4192.jpg', text: 'same spot as yesterday. same reading.', place: 'Atlanta', lat: 33.75, lon: -84.39, tz: 'America/New_York', local: '2026-11-01T07:06:00-05:00'},
];
const LEN = 78, GAP = 0;
export const DURATION = 40 + MSGS.length * (LEN + GAP) + 140;

const Frame: React.FC<{m: Msg; i: number}> = ({m, i}) => {
  const f = useCurrentFrame();
  const a = ease(f, 0, 10);
  const b = ease(f, 14, 26);
  const now = new Date(m.local);
  const p = paragon(now, m.lat, m.lon);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Img src={staticFile(m.photo)} style={{position: 'absolute', inset: 0, width: W, height: H, objectFit: 'cover', opacity: a, transform: `scale(${1 + f * 0.0004})`}} />
      <AbsoluteFill style={{background: 'linear-gradient(to top, rgba(0,0,0,.62) 0%, rgba(0,0,0,0) 40%)'}} />
      {/* the constant, brand position */}
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout}}>{p.secondary}</div>
      {/* the text as received */}
      <div style={{position: 'absolute', left: M, bottom: M + 10, maxWidth: W - 2 * M - 120, opacity: b, transform: `translateY(${(1 - b) * 10}px)`}}>
        <div style={{...caption, fontSize: 19, opacity: 0.7, marginBottom: 12}}>{m.who} · {m.place} · {clockIn(now, m.tz)}</div>
        <div style={{fontFamily: 'Plantin', color: '#fff', fontSize: 40, lineHeight: 1.2, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(8px)', padding: '16px 22px', borderRadius: 22, display: 'inline-block', textShadow: '0 1px 10px rgba(0,0,0,.4)'}}>{m.text}</div>
      </div>
      <div style={{position: 'absolute', right: M, top: M, ...flat(caption), fontSize: 18, opacity: 0.5}}>{String(i + 1).padStart(2, '0')} / {String(MSGS.length).padStart(2, '0')}</div>
    </AbsoluteFill>
  );
};

export const D1MorningAfter: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const title = Math.min(ease(f, 0, 12), 1 - ease(f, 32, 40));
  const endAt = 40 + MSGS.length * (LEN + GAP);
  const end = ease(f, endAt, endAt + 16), l2 = ease(f, endAt + 40, endAt + 56), url = ease(f, endAt + 80, endAt + 96);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <AbsoluteFill style={{opacity: title}}>
        <div style={{position: 'absolute', left: M, bottom: M, ...caption}}>Sunday, November 1</div>
        <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout}}>The morning after.</div>
      </AbsoluteFill>
      {MSGS.map((m, i) => (
        <Sequence key={m.who + i} from={40 + i * (LEN + GAP)} durationInFrames={LEN}><Frame m={m} i={i} /></Sequence>
      ))}
      <AbsoluteFill style={{background: '#000', opacity: end}}>
        <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout}}>
          <div>Clocks fell back at 2am.</div>
          <div style={{opacity: l2}}>Sunrise didn’t.</div>
        </div>
        <div style={{position: 'absolute', left: M, bottom: M, ...caption, opacity: url}}>paragonday.systems</div>
        <Mark opacity={url} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
