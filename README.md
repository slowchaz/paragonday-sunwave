# Paragonday sun wave — Remotion prototypes

Video prototypes for Paragonday / Horizon Time around the US clocks falling back (Sun Nov 1 2026). Everything is code: the wave, the readouts, the sun math. Photos are the only assets.

## Run it

```bash
npm install
npm run studio
```

Remotion Studio opens in the browser with every composition in the left sidebar. Scrub, change code, it hot-reloads.

Render one:

```bash
npx remotion render ManySuns out/manysuns.mp4
```

## Compositions

| id | what it is |
|---|---|
| `ManySuns` | Current cut. 19 sunsets match-cut on the sun, one constant readout, tally, DST line. |
| `SameTime` | Nine held sunsets with clock times, the earlier version of the same idea. |
| `SunWave` | First prototype: the sun travels the wave through a day. Parked. |
| `D1MorningAfter` … `D6Globe` | Six alternate directions, sketched with stand-in assets. Headers in each file say what the real version needs. |

## Tuning ManySuns in Studio

`ManySuns` exposes its pacing, copy, and film look as controls. In Remotion Studio, select `ManySuns`, open the **Props** panel on the right, and drag or type. The preview updates live, and the composition's length follows the pacing. Press **Save** in that panel to write the values back into `src/Root.tsx`, which is what `npx remotion render ManySuns` uses.

- **pacing**: title card length, first cut length, how much shorter each cut gets, the floor, the hold on the last photo, tally length, delay before the list, row stagger, closing card length. All in frames at 30 fps.
- **text**: every line on screen.
- **look**: grain and vignette strength on the borrowed photos, a switch to apply the film look to our own photos too, the noise on the white cards, the wave colour on the cards (over photos it is always white), and the colour of the travelling sun.

Save needs Prettier, which is a dev dependency; `npm install` brings it in.

## How the match cut works

Each photo in `src/manyplaces.json` carries `sunX`/`sunY` (fractions of the image). `ManySuns.tsx` scales and shifts every photo so its sun lands on one screen point (65% across, 47% down) while still covering the frame. The wave is drawn once through that point. To add a shot: drop a JPEG in `public/many/`, add a row with its sun position, put it in order.

Sun times are real: `suncalc` for each place's lat/lon on Oct 31 2026, shown in that place's time zone.

## Type

Plantin (`public/fonts/`), matched to the original Peaks Island still: two-line readout top right, caps caption bottom left, mark bottom right.

## Photos and rights

Peaks Island photos are ours. Most others are pulled from Are.na for prototyping and are **not cleared**; each one's block URL and user is in `SOURCES.md`. Replace or clear before anything goes public.

## Notes

`SOURCES.md` has the full history: what was tried, why it changed, where every image came from.
