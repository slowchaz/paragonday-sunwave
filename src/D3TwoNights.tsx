import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import {W, H, M, readout, caption, flat, ease, Mark, Wave, useFonts} from './shared';

export const DURATION = 16 * 30;
// Stand-ins: two near-identical Peaks Island frames. Real version = one locked camera, two evenings.
type Night = {file: string; sun: readonly [number, number]; clock: string; day: string};
const SAT: Night = {file: 'photos/IMG_0246.jpg', sun: [0.657, 0.486], clock: '5:34 PM', day: 'Saturday, October 31'};
const SUN: Night = {file: 'photos/IMG_0245.jpg', sun: [0.652, 0.524], clock: '4:33 PM', day: 'Sunday, November 1'};
const fit = (sun: readonly [number, number], w: number, h: number, box: {w: number; h: number}, ax: number, ay: number) => {
  const sw = Math.max(ax * box.w / sun[0], (1 - ax) * box.w / (1 - sun[0])), sh = Math.max(ay * box.h / sun[1], (1 - ay) * box.h / (1 - sun[1]));
  const s = Math.max(sw / w, sh / h, box.w / w, box.h / h) * 1.02;
  return {width: w * s, height: h * s, left: ax * box.w - sun[0] * w * s, top: ay * box.h - sun[1] * h * s};
};
const Half: React.FC<{p: Night; top: number; i: number}> = ({p, top, i}) => {
  const f = useCurrentFrame();
  const a = ease(f, 10 + i * 40, 30 + i * 40);
  const box = {w: W, h: H / 2};
  const g = fit(p.sun, 1215, 1620, box, 0.65, 0.5);
  return (
    <div style={{position: 'absolute', left: 0, top, width: W, height: H / 2, overflow: 'hidden', opacity: a}}>
      <Img src={staticFile(p.file)} style={{position: 'absolute', ...g}} />
      <div style={{position: 'absolute', left: M, top: 40, ...caption}}>{p.day}</div>
      <div style={{position: 'absolute', left: M, bottom: 40, ...readout, fontSize: 60}}>{p.clock}</div>
      <div style={{position: 'absolute', right: M, bottom: 40, textAlign: 'right', ...readout, fontSize: 44}}>-00:00 tilset</div>
    </div>
  );
};
export const D3TwoNights: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const line = ease(f, 300, 320);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Half p={SAT} top={0} i={0} />
      <Half p={SUN} top={H / 2} i={1} />
      <div style={{position: 'absolute', left: 0, right: 0, top: H / 2 - 1, height: 2, background: '#000'}} />
      <AbsoluteFill style={{background: 'rgba(0,0,0,.72)', opacity: line}}>
        <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout}}>
          <div>Same window. Same sunset.</div>
          <div style={{opacity: 0.7}}>Only the clock moved.</div>
        </div>
        <div style={{position: 'absolute', left: M, bottom: M, ...caption}}>paragonday.systems</div>
        <Mark />
      </AbsoluteFill>
      <Wave y={H / 2} amp={H * 0.03} opacity={0.5 * (1 - line)} />
    </AbsoluteFill>
  );
};
