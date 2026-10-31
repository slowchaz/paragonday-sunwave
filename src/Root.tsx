import React from 'react';
import {Composition} from 'remotion';
import {SunWave, FPS, DURATION} from './SunWave';
import {SameTime, DURATION as SAME_DURATION} from './SameTime';
import {ManySuns, DURATION as MANY_DURATION} from './ManySuns';
import {D1MorningAfter, DURATION as D1} from './D1MorningAfter';
import {D2ReadoutAlone, DURATION as D2} from './D2ReadoutAlone';
import {D3TwoNights, DURATION as D3} from './D3TwoNights';
import {D4ProductOvernight, DURATION as D4} from './D4ProductOvernight';
import {D5OnePhoto, DURATION as D5} from './D5OnePhoto';
import {D6Globe, DURATION as D6} from './D6Globe';

export const Root: React.FC = () => (
  <>
  <Composition id="D1MorningAfter" component={D1MorningAfter} durationInFrames={D1} fps={FPS} width={1080} height={1350} />
  <Composition id="D2ReadoutAlone" component={D2ReadoutAlone} durationInFrames={D2} fps={FPS} width={1080} height={1350} />
  <Composition id="D3TwoNights" component={D3TwoNights} durationInFrames={D3} fps={FPS} width={1080} height={1350} />
  <Composition id="D4ProductOvernight" component={D4ProductOvernight} durationInFrames={D4} fps={FPS} width={1080} height={1350} />
  <Composition id="D5OnePhoto" component={D5OnePhoto} durationInFrames={D5} fps={FPS} width={1080} height={1350} />
  <Composition id="D6Globe" component={D6Globe} durationInFrames={D6} fps={FPS} width={1080} height={1350} />
  <Composition id="ManySuns" component={ManySuns} durationInFrames={MANY_DURATION} fps={FPS} width={1080} height={1350} />
  <Composition id="SameTime" component={SameTime} durationInFrames={SAME_DURATION} fps={FPS} width={1080} height={1350} />
  <Composition
    id="SunWave"
    component={SunWave}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1350}
  />
  </>
);
