import React from 'react';
import {Composition} from 'remotion';
import {SunWave, FPS, DURATION} from './SunWave';
import {SameTime, DURATION as SAME_DURATION} from './SameTime';
import {ManySuns, manySunsSchema, manySunsMetadata} from './ManySuns';
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
    <Composition
      id="ManySuns"
      component={ManySuns}
      schema={manySunsSchema}
      calculateMetadata={manySunsMetadata}
      fps={FPS}
      width={1080}
      height={1350}
      durationInFrames={800}
      defaultProps={{
        pacing: {
          opener: 82,
          sunStart: 20,
          crossfade: 10,
          firstCut: 22,
          cutStep: 0.6,
          shortestCut: 12,
          holdMultiple: 2,
          tally: 120,
          tallyFadeIn: 20,
          tallyListIn: 40,
          tallyRowStagger: 4,
          close: 140,
          closeOut: 20,
        },
        text: {
          titleCaption: 'Saturday, October 31',
          titleA: 'Clocks fall back tonight,',
          titleB: 'watch the sun.',
          readout: '-00:00 tilset',
          tallyA: 'Same time,',
          tallyB: 'different horizons.',
          closeA: 'While clocks fall back,',
          closeB: 'Sunset remains -00:00 tilset.',
          closeCaption: 'paragonday.systems',
        },
        sound: {file: 'audio/dst-01.wav', volume: 1},
        look: {grain: 0.16, vignette: 1, filmOnOwnPhotos: false, paperNoise: 0.4, lineColor: '#8c8c8c', sunColor: '#118080'},
      }}
    />
    <Composition id="SameTime" component={SameTime} durationInFrames={SAME_DURATION} fps={FPS} width={1080} height={1350} />
    <Composition id="SunWave" component={SunWave} durationInFrames={DURATION} fps={FPS} width={1080} height={1350} />
  </>
);
