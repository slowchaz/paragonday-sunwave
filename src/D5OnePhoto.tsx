import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {W, H, M, AX, AY, readout, caption, ease, Mark, Wave, useFonts, hm} from './shared';

export const DURATION = 15 * 30;
const P = {file: 'photos/IMG_0246.jpg', w: 1215, h: 1620, sun: [0.657, 0.486] as const};
const fit = () => {
  const sw = Math.max(AX * W / P.sun[0], (1 - AX) * W / (1 - P.sun[0])), sh = Math.max(AY * H / P.sun[1], (1 - AY) * H / (1 - P.sun[1]));
  const s = Math.max(sw / P.w, sh / P.h, W / P.w, H / P.h) * 1.02;
  return {width: P.w * s, height: P.h * s, left: AX * W - P.sun[0] * P.w * s, top: AY * H - P.sun[1] * P.h * s};
};
export const D5OnePhoto: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const g = fit();
  const img = ease(f, 0, 24);
  const draw = ease(f, 20, 80);
  const mins = Math.round(interpolate(f, [60, 300], [5, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const l1 = ease(f, 320, 340), l2 = ease(f, 370, 390);
  const dim = l1 * 0.45;
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Img src={staticFile(P.file)} style={{position: 'absolute', ...g, opacity: img, transform: `scale(${1 + f * 0.00012})`, transformOrigin: `${AX * 100}% ${AY * 100}%`}} />
      <AbsoluteFill style={{background: '#000', opacity: dim}} />
      <Wave draw={draw} />
      <div style={{position: 'absolute', right: M, top: H * 0.3, textAlign: 'right', ...readout, opacity: ease(f, 40, 60)}}>
        <div>-{hm(mins * 60000)} tilset</div>
        <div>+{hm((10 * 60 + 19 - mins) * 60000)} pastrise</div>
      </div>
      <div style={{position: 'absolute', left: M, bottom: M, ...caption, opacity: ease(f, 40, 60)}}>
        <div>Peaks Island, Maine</div>
        <div style={{marginTop: 10, opacity: 0.85}}>Saturday, October 31</div>
      </div>
      <div style={{position: 'absolute', left: M, right: M, top: H * 0.66, textAlign: 'left', ...readout, fontSize: 56}}>
        <div style={{opacity: l1}}>Clocks fall back Sunday.</div>
        <div style={{opacity: l2}}>The sun doesn't.</div>
      </div>
      <Mark />
    </AbsoluteFill>
  );
};
