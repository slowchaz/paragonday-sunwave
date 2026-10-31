# Six directions — prototypes 4a–4f (current round)

All in `sunwave/src/D1…D6*.tsx` on a shared brand layer (`shared.tsx`: Plantin readout and caption, the wave, the mark, real suncalc readouts). Renders in `sunwave/out/D*.mp4`, 1080×1350, no sound.

| # | id | what it is | what's stand-in |
|---|---|---|---|
| 1 | D1MorningAfter | Six full-bleed sunrise frames, each a text as received (name, place, phone clock, one line) with `+HH:MM pastrise` in the brand position; ends "Clocks fell back at 2am. Sunrise didn't." | Names, times and messages are placeholders; photos are yours. The real one is built from friends' actual Sunday texts. |
| 2 | D2ReadoutAlone | No photos. One Paragonday (Sat sunrise → Sun sunrise) in 24s: the sun walks the wave, readout runs on real sun math, a small clock in the corner jumps 1:59 → 1:00 at the real fall-back instant. | Nothing. Fully code. |
| 3 | D3TwoNights | Split screen, Saturday over Sunday, same window: clock 5:34 then 4:33, readout -00:00 both. | Two near-identical Peaks frames stand in for a locked camera on two evenings. |
| 4 | D4ProductOvernight | Phone mock of the app through the night: status-bar clock jumps at 2am, the in-app dot walks the trough at one speed. | The app UI is a mock, not a recording. |
| 5 | D5OnePhoto | The Peaks Island still as a 15s piece: wave draws, readout counts the last five minutes, two lines, the mark. | Nothing. |
| 6 | D6Globe | Orthographic globe with real coastlines (world-atlas 50m via d3-geo), night hemisphere from the subsolar point, the world turning through a fixed sunset meridian; the city nearest sunset gets the `-00:00 tilset` label; a cumulative sunset counter. | City set is the stand-in list plus 30 majors. |

---

# Many Suns — prototype 3 (current): the match cut

Render: `sunwave/out/manysuns.mp4` (1080×1350, 30fps, ~32s). Recut after a watch-back: 20 frames instead of 39 (full list kept in `manyplaces_all.json`), nothing shorter than 12 frames so every clock time is readable; overlay reduced to big clock time, place, and the one constant `-00:00 tilset`; travelling light and `pastrise` line removed; opener is now the question ("Clocks fall back tonight. Watch the sun."); tally slowed and enlarged as the climax, with the clock column dimming so the constant column locks. Composition `ManySuns` in `sunwave/src/ManySuns.tsx`; shots and places in `sunwave/src/manyplaces.json`.

The technique is a match cut (graphic match): the sun is held at one screen position, 65% across and 47% down, exactly where it sits in the Peaks Island still. The wave is drawn once through that point and never moves. Each photo is scaled and shifted so its sun lands on that point while still covering the frame; anything needing more than ~2.6× crop is rejected. 39 cuts shortening from 0.8s to 0.1s, landing on your Peaks Island frame.

Wave animation (Remotion interpolation only): the wave is taught once in the opener and then never moves. It draws on left to right; a sun disc rides it from sunrise over the crest down to the crossing and stops there; the first photo cuts in with its real sun on that exact point. During the cuts and the hold nothing about the wave changes, which is the message. The earlier slide-under-a-fixed-sun during the hold was removed: the wave read "past sunset" while the photo still showed sunset.

End: a dense tally of every place's sunset clock time against `-00:00 tilset`, then "Same time, everywhere." and the DST line.

Verification: every cut's midpoint is rendered with a marker on the anchor (`sunwave/out/verify/sheet.jpg`) and checked by eye. Frames without a sun disc under the marker were dropped. Brightness-based detection misses red suns in grey haze (the Tokyo boats) and gets fooled by blown highlights; those need a hand-set `sunX`/`sunY`.

Getting to ~90: the limit is photos with a visible sun disc, not photos of sunsets. The 715 "sunset"/"sunrise" search thumbnails and the 1,440 curated-channel thumbnails in the scratch folders have only been skimmed for that; a second pass picking strictly for a visible disc near a horizon, plus any of your own sun shots, is the way to double the count.

Place labels remain stand-ins assigned from a city list with real coordinates and time zones; Peaks Island frames are labelled truthfully.

---

# Same Time, Everywhere — prototype 2 (held frames)

Render: `sunwave/out/sametime.mp4` (1080×1350, 30fps, ~28s). Composition `SameTime` in `sunwave/src/SameTime.tsx`; places and photos in `sunwave/src/places.ts`.

Layout matches the Peaks Island still: two-line readout top-right in Plantin (lining figures; the "GLC Plantin" face in the repo has old-style figures and is not the one in the still), caps caption bottom-left, the mark bottom-right, and the thin wave crossing the horizon at each photo's sun.

Title card ("Saturday, October 31 / Nine sunsets."), then nine full-bleed stills, the first held 2.6s and the rest 1.5–1.7s. Each reads `-00:00 tilset` and that place's real day length as `+HH:MM pastrise`; the caption gives the place and its local clock time at sunset. Then a tally of nine clocks against nine identical readouts, "Same time, everywhere.", and the DST beat: "Clocks fall back Sunday. Sunset stays at -00:00."

The wave crosses at each photo's horizon line, directly under its sun (`horizon` in `places.ts`, set by eye). Anchoring at the sun itself only works when the sun is on the horizon, as in the still.

## Photos in this cut
Peaks Island is your own. The rest are stand-ins from curated Are.na channels and are **not** really from the places they are labelled with (Alicudi and Jökulsárlón are the exceptions: those photos are from those places). Prototype only; clear or replace before publishing.

| labelled as | title | user | channel | block |
|---|---|---|---|---|
| Capri (real) | e306a31c97ed4ccbb40a217967da518a.png | @maty-sumika-ikeda | magic-hour | https://www.are.na/block/8618785 |
| Big Sur | A SUSNET with JADE JOLLIVET & TADDEO REI | @sebastian-clark | alicudi-sunsets | https://www.are.na/block/23470430 |
| Honolulu | A SUNSET with GAIA | @luca-mantero | alicudi-sunsets | https://www.are.na/block/23786343 |
| Ulaanbaatar | (horsemen, 640px) | search "sunset" | — | https://www.are.na/block/16184804 |
| Tokyo | 605A140D-0241-46A1-B8C4-F9843B692585 | @armadilo-d | secret-sunsets | https://www.are.na/block/47583931 |
| Alicudi | (untitled) | @sebastian-clark | alicudi-sunsets | https://www.are.na/block/23188723 |
| Lisbon | img_3060.jpg | @sebastian-clark | alicudi-sunsets | https://www.are.na/block/23188736 |
| Oia | Clouds as eyes | @yatu | in-defense-of-sunsets | https://www.are.na/block/10333628 |
| (dropped) Atlanta | 3c527552-630e-45e9-b060-40f178820bee.jpg | @matthew-denisenko | in-defense-of-sunsets | https://www.are.na/block/12929141 |
| (dropped) Honolulu | 0f7e20f701e78f6db65215474d620ebe.png | @maty-sumika-ikeda | magic-hour | https://www.are.na/block/8618810 |
| (dropped) Uyuni | D1A3912B-5FB4-4DAB-91B9-C3857A62B393.jpg | @micah-schippa-wildfong | sunset-hsvcmto_rm0 | https://www.are.na/block/1649872 |
| (dropped) Jökulsárlón | iceland-1-2010-635.jpg | @sarah-wedge | dusked | https://www.are.na/block/286504 |

## Where the better photos came from
Curated channels found via `arena search "<term>" --type Channel --sort connections_count_desc`, then `arena channel contents <slug> --per 100 --json`:
alicudi-sunsets (real sunsets from one island, 452 blocks), dusked (434), magic-hour (312), in-defense-of-sunsets (190), secret-sunsets (132), gloam, summer-spent-in-blue-hour, SUNSET (alessandra-peralta). Tulsa Sky (15k blocks) is generative colour swatches, not photos. About 1,150 thumbnails reviewed; 24 pulled at full size (`sunwave/public/same/`), 8 used.

Sunrise is the same move: `arena search "sunrise" --type Channel` gives Sunrise 23, Loop de loop Sunrise, Sunrise to Sunrise; nothing pulled yet.

---

# Sun Wave — prototype 1 (parked): sources & notes

Prototype for the Paragonday daylight-saving-time spot. Built with Remotion in `sunwave/`.
Render: `sunwave/out/sunwave.mp4` (1080×1350, 30fps, ~20s). Run `npm run studio` inside `sunwave/` to scrub it.

## Structure

1. **Montage (≈11s)** — about 24 accelerating cuts that walk the sun along the wave through one day: dawn at the left, high sun at the crest, down to the Peaks Island sunset at the crossing. Each shot is auto-shifted and scaled so its sun lands exactly where the wave's sun is at that moment, so the wave runs unbroken and the sun visibly travels across the cuts. The `tilset` / `pastrise` readout counts through the whole day using real sun math for Peaks Island (43.6556, −70.1989) on Sat Oct 31 2026.
2. **Hold (5s)** — your Peaks Island still. A muted clock reads 5:29 PM, the date flips to Sun Nov 1, the clock glitches to 4:28 PM. The Horizon Time readout does not move. Caption: *Clocks fall back Sunday. The sun doesn't.*
3. **End card (4s)** — fully code-drawn horizon (gradient sky keyed to sun height, sun disc, reflection, wave) with the Paragonday mark and URL. Zero footage, so it is a safe fallback look for any beat.

Everything on top of the photos is vector: wave, labels (Plantin from the calendar repo), clock, grain.

## Footage used

### Your photos (from the three Downloads zips)
Peaks Island set: IMG_0230, 0232, 0235, 0236, 0237, 0245, 0246 (hero), 0247, 0248; plus DSCF3304 (Fuji), IMG_1547, IMG_0833 (foggy field), IMG_7633 and IMG_3145 (high sun, used mid-day), and the 2018-12-02 shot.
IMG_0231 and 0234 are skipped automatically: the sun sits too close to the frame edge to land on the wave without a brutal crop.
The two 4K .MOV clips (IMG_5009/5011) are sun-through-sunroof in a car; usable as a texture insert, not used yet.

### Are.na (search "sunset" / "sunrise", sorted by connections)
**Prototype use only.** These are other people's blocks; none are cleared for a published spot. Each needs permission or replacing before this goes out.

| file | title | user | block |
|---|---|---|---|
| `27791983.jpg` | tnf_ss24_soukuu_d2_trail_kolsch_4840.jpg?format=2500w | @addie-glass | https://www.are.na/block/27791983 |
| `38315612.jpg` | 2fd8a455-1aae-438c-aeaf-129c210488e4.jpg | @hunter-shires | https://www.are.na/block/38315612 |
| `539041.jpg` | kju_srfcbmd_rs300614b.jpg | @daniel-pianetti | https://www.are.na/block/539041 |
| `12421893.jpg` | 46243999_231342731117072_5112567446809279423_n.jpg | @marcelo-de-costa | https://www.are.na/block/12421893 |
| `35371483.jpg` | gj7otsqx0aayqso?format=jpg-name=small | @natalie-patane | https://www.are.na/block/35371483 |
| `15315661.jpg` | sunrise_hr_web.jpg | @beth | https://www.are.na/block/15315661 |
| `5711119.jpg` | 2001-a-space-odyssey-1968-014-monolith-sun-1000x750.jpg | @alexander-ablola | https://www.are.na/block/5711119 |
| `14861172.jpg` | sunrise_hr-640x512.jpg | @aaliyeh-afshar | https://www.are.na/block/14861172 |
| `86531.jpg` | 120-600x800.jpg | @chris-sherron | https://www.are.na/block/86531 |
| `16184804.jpg` | 273947402_1565681513815999_3049242861532212015_n.jpg?stp=c343.0.753.753a_dst-jpg_e35_s640x640_sh0.08-_nc_ht=scontent-yyz1-1.... | @emily-nabnian | https://www.are.na/block/16184804 |
| `3825128.jpg` | tumblr_phctxvooem1r1yy45o1_1280.jpg | @lil-miggi | https://www.are.na/block/3825128 |
| `4070220.jpg` | thelma001.jpg?bwg=1551292735 | @luke-harris | https://www.are.na/block/4070220 |
| `13494802.jpg` | Negligee, 1962 | Ikko Narahara | @tess-murdoch | https://www.are.na/block/13494802 |

### Your Are.na channel (teal/paragonday, 309 blocks)
Sun photos there worth pulling at full size: the NYC skyline sunset, the "time didn't change for us" sun-through-trees post, the sunrise-over-hills shot with the e-ink clock, and the Peaks Island still itself. The rest is process material (sketches, devices, screenshots).

### Public-domain options (parked, per your note)
- NOAA GOES-19 full-disk GEOCOLOR: ten days of 10-minute frames are on the CDN; a one-day timelapse of Oct 27 is in `sunwave/public/goes_day300.mp4`. The day/night line sweeping the Earth is the sun wave in reality. Off by default (`HAS_GOES = false`).
- NASA SDO HMI continuum: a clean orange solar disc, updated every few minutes, same colour as the Peaks Island sun.

## How to add a shot
Drop a JPEG in `sunwave/public/photos/` and add a line to `src/photos.json` with the sun position as fractions of width and height. Then put its id in `ORDER` in `src/SunWave.tsx` at the right time of day (low-sun shots at the ends, high-sun shots in the middle). The montage code does the alignment and skips anything that would need more than ~2.6× crop at its slot.

## Open decisions
- Format: this is 4:5. Switching to 9:16 is a two-constant change (`W`, `H`), but tighter frames will reject more shots.
- Stance: the video says Paragonday ignores DST. The research doc still lists that as an open question.
- Music / sound: none yet.
