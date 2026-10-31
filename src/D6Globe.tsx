import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {geoOrthographic, geoPath, geoCircle, geoGraticule10} from 'd3-geo';
import {feature} from 'topojson-client';
import type {Topology, GeometryCollection} from 'topojson-specification';
import land50 from './land-50m.json';
import {W, H, M, readout, caption, flat, ease, Mark, useFonts} from './shared';
import rows from './manyplaces_all.json';

export const DURATION = 26 * 30;
const R = 440, CX = W / 2, CY = H * 0.45;
const DECL = -14.3;                                 // solar declination, Oct 31
const TILT = 16;
const topo = land50 as unknown as Topology<{land: GeometryCollection}>;
const LAND = feature(topo, topo.objects.land);
const GRAT = geoGraticule10();
const uniq = (() => { const s = new Set<string>(); return (rows as {city: string; lat: number; lon: number}[]).filter(r => !s.has(r.city) && s.add(r.city)); })();
const EXTRA: [number, number, string][] = [[40.7,-74,'New York'],[51.5,-0.1,'London'],[48.9,2.3,'Paris'],[55.8,37.6,'Moscow'],[28.6,77.2,'Delhi'],[39.9,116.4,'Beijing'],[1.3,103.8,'Singapore'],[-23.5,-46.6,'São Paulo'],[19.4,-99.1,'Mexico City'],[30,31.2,'Cairo'],[-26.2,28,'Johannesburg'],[41.9,12.5,'Rome'],[35.7,51.4,'Tehran'],[13.8,100.5,'Bangkok'],[22.3,114.2,'Hong Kong'],[-37.8,145,'Melbourne'],[49.3,-123.1,'Vancouver'],[25.8,-80.2,'Miami'],[6.5,3.4,'Lagos'],[24.7,46.7,'Riyadh'],[43.7,-79.4,'Toronto'],[47.6,-122.3,'Seattle'],[34.1,-118.2,'Los Angeles'],[41.9,-87.6,'Chicago'],[-12,-77,'Lima'],[4.7,-74.1,'Bogotá'],[64.1,-21.9,'Reykjavík'],[59.3,18.1,'Stockholm'],[-33.9,151.2,'Sydney'],[35.7,139.7,'Tokyo']];
const CITIES = [...uniq.map(r => ({lat: r.lat, lon: r.lon, city: r.city})), ...EXTRA.map(([lat, lon, city]) => ({lat, lon, city}))];
const d2r = (d: number) => d * Math.PI / 180;

export const D6Globe: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const intro = ease(f, 0, 30);
  const p = interpolate(f, [30, DURATION - 70], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const subLon = 180 - p * 360;                     // subsolar longitude, degrees, sweeping west
  const lon0 = subLon + 90;                         // sunset meridian (90° east of the subsolar point) faces the viewer
  const proj = useMemo(() => geoOrthographic().translate([CX, CY]).scale(R).clipAngle(90), []);
  proj.rotate([-lon0, -TILT]);
  const path = geoPath(proj);
  const nightCircle = geoCircle().center([subLon + 180, -DECL]).radius(90)();
  const landD = path(LAND) ?? '', gratD = path(GRAT) ?? '', nightD = path(nightCircle) ?? '';
  // cities: nearest-to-sunset gets the label
  let best: {x: number; y: number; city: string; g: number} | null = null;
  const marks: JSX.Element[] = [];
  // cumulative: a city's sunset happens when the subsolar point is 90° west of it; count those already passed in this sweep
  let setCount = 0;
  for (const c of CITIES) { const at = (((180 - (c.lon - 90)) % 360) + 360) % 360; if (at <= p * 360) setCount++; }
  for (const c of CITIES) {
    const pt = proj([c.lon, c.lat]); if (!pt) continue;
    const cosz = Math.sin(d2r(c.lat)) * Math.sin(d2r(DECL)) + Math.cos(d2r(c.lat)) * Math.cos(d2r(DECL)) * Math.cos(d2r(c.lon - subLon));
    const z = Math.acos(Math.max(-1, Math.min(1, cosz))) * 180 / Math.PI;
    const evening = Math.sin(d2r(c.lon - subLon)) > 0;
    const g = evening ? Math.max(0, 1 - Math.abs(z - 90) / 4) : 0;
    marks.push(<circle key={c.city + c.lat} cx={pt[0]} cy={pt[1]} r={2.6 + g * 7} fill="#fff" opacity={0.6 + g * 0.4} />);
    if (g > 0 && (!best || g > best.g)) best = {x: pt[0], y: pt[1], city: c.city, g};
  }
  const end = ease(f, DURATION - 60, DURATION - 40);
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: intro}}>
        <defs><clipPath id="disc"><circle cx={CX} cy={CY} r={R} /></clipPath></defs>
        <circle cx={CX} cy={CY} r={R} fill="#07080c" stroke="#fff" strokeWidth={1} strokeOpacity={0.25} />
        <g clipPath="url(#disc)">
          <path d={gratD} fill="none" stroke="#fff" strokeWidth={0.6} opacity={0.10} />
          <path d={landD} fill="#fff" fillOpacity={0.16} stroke="#fff" strokeWidth={0.8} strokeOpacity={0.5} />
          <path d={nightD} fill="#000" fillOpacity={0.62} />
          <line x1={CX} x2={CX} y1={CY - R} y2={CY + R} stroke="#fff" strokeWidth={1.4} opacity={0.55} />
        </g>
        {marks}
        {best && (
          <g opacity={best.g}>
            <line x1={best.x} y1={best.y} x2={best.x + 22} y2={best.y - 22} stroke="#fff" strokeWidth={1} opacity={0.6} />
            <text x={best.x + 28} y={best.y - 26} fill="#fff" fontFamily="Plantin" fontSize={22} letterSpacing={3}>{best.city.toUpperCase()}</text>
            <text x={best.x + 28} y={best.y + 6} fill="#fff" fontFamily="Plantin" fontSize={30}>-00:00 tilset</text>
          </g>
        )}
      </svg>
      <div style={{position: 'absolute', left: M, top: M, ...flat(caption), opacity: 0.5 * intro}}>Saturday, October 31 · one turn</div>
      <div style={{position: 'absolute', right: M, top: M - 4, textAlign: 'right', ...flat(readout), fontSize: 40, opacity: intro}}>-00:00 tilset</div>
      <div style={{position: 'absolute', left: M, bottom: M, ...flat(caption), opacity: intro * (1 - end)}}>
        <div style={{...flat(readout), fontSize: 56}}>{setCount}</div>
        <div style={{marginTop: 6, opacity: 0.7}}>sunsets so far</div>
      </div>
      <div style={{position: 'absolute', left: M, bottom: M, ...flat(readout), fontSize: 44, opacity: end}}>Every place. Once a day. Same reading.</div>
      <Mark opacity={intro} />
    </AbsoluteFill>
  );
};
