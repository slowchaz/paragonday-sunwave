#!/usr/bin/env python3
"""
Pull licence-filtered, geotagged sunset photos from Flickr, find the sun disc,
keep the ones that can be match-cut onto the ManySuns anchor, and lay them out
on contact sheets for picking.

    python3 -I scripts/flickr_pull.py OUT_DIR [--per-box 80] [--text sunset]

Reads FLICKR_API_KEY from .env. Writes to OUT_DIR:
    cand/<id>.jpg      500px thumbnails of every candidate (untrusted downloads)
    candidates.json    every photo that passed detection, with sun position,
                       crop factor, licence, place and time zone
    sheet_<n>.jpg      contact sheets of the keepers, numbered to match the json

Licences kept: CC BY (4), no known restrictions (7), US Gov (8), CC0 (9), PDM (10).
"""
import json, os, sys, time, math, argparse
from pathlib import Path
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from io import BytesIO
import ssl
import numpy as np
from PIL import Image, ImageDraw

REST = 'https://www.flickr.com/services/rest/'

def ssl_context():
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        for f in ('/etc/ssl/cert.pem', '/opt/homebrew/etc/openssl@3/cert.pem', '/usr/local/etc/openssl@3/cert.pem'):
            if os.path.exists(f):
                return ssl.create_default_context(cafile=f)
    return ssl.create_default_context()

CTX = ssl_context()
LICENSES = {4: 'CC BY', 7: 'No known restrictions', 8: 'US Gov', 9: 'CC0', 10: 'Public Domain'}
# ManySuns anchor and frame
AX, AY, W, H = 0.65, 0.47, 1080, 1350
MAX_OVER = 2.6

def load_env():
    for line in Path('.env').read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1); os.environ.setdefault(k.strip(), v.strip())

def api(method, **params):
    params.update(method=method, api_key=os.environ['FLICKR_API_KEY'], format='json', nojsoncallback=1)
    for attempt in range(4):
        try:
            with urlopen(REST + '?' + urlencode(params), timeout=30, context=CTX) as r:
                d = json.load(r)
            if d.get('stat') != 'ok':
                raise RuntimeError(d.get('message'))
            return d
        except Exception as e:
            if attempt == 3: raise
            time.sleep(1.5 * (attempt + 1))

def fetch(url):
    req = Request(url, headers={'User-Agent': 'sunwave-proto/0.1'})
    with urlopen(req, timeout=40, context=CTX) as r:
        return r.read()

# ---------- search ----------

def boxes():
    """Longitude bands x two latitude bands, so results spread over the globe."""
    for lat0 in (-60, 0):
        for lon0 in range(-180, 180, 30):
            yield f'{lon0},{lat0},{lon0 + 30},{lat0 + 60}'

def search(text, per_box):
    seen, out = set(), []
    for bbox in boxes():
        page, got = 1, 0
        while got < per_box:
            d = api('flickr.photos.search', text=text, bbox=bbox, has_geo=1, license='4,7,8,9,10',
                    content_types=0, media='photos', sort='interestingness-desc', accuracy=6,
                    extras='geo,license,url_m,url_l,url_o,owner_name,date_taken,o_dims,path_alias',
                    per_page=min(250, per_box), page=page)
            photos = d['photos']['photo']
            for p in photos:
                if p['id'] in seen or 'url_m' not in p: continue
                seen.add(p['id']); out.append(p); got += 1
                if got >= per_box: break
            if page >= int(d['photos']['pages']) or not photos: break
            page += 1
        print(f'  bbox {bbox:>22}: {got}', file=sys.stderr)
    return out

# ---------- sun detection ----------

def components(mask):
    h, w = mask.shape
    ys, xs = np.nonzero(mask)
    todo = set(zip(ys.tolist(), xs.tolist()))
    comps = []
    while todo:
        seed = todo.pop(); q = deque([seed]); pts = [seed]
        while q:
            y, x = q.popleft()
            for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1),(y-1,x-1),(y-1,x+1),(y+1,x-1),(y+1,x+1)):
                if (ny, nx) in todo:
                    todo.remove((ny, nx)); q.append((ny, nx)); pts.append((ny, nx))
        comps.append(np.array(pts))
    return comps

def detect(im):
    """Return (sunX, sunY, diameter_frac, glow) or None.

    A sun disc is a compact, roundish, near-saturated blob with a smooth glow
    around it (brightness falls off gradually with radius). Water glitter and
    blown-out cloud edges are bright but ragged, with dark noisy surroundings.
    When two candidates sit vertically in line, the upper one is the sun and
    the lower one its reflection.
    """
    w, h = im.size
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    lum = a.mean(axis=2)
    thr = max(222.0, float(lum.max()) - 14)
    mask = lum >= thr
    if mask.mean() > 0.08 or mask.sum() < 5:
        return None
    yy, xx = np.ogrid[:h, :w]
    cands = []
    for pts in components(mask):
        n = len(pts)
        y0, x0 = pts.min(axis=0); y1, x1 = pts.max(axis=0)
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        diam = max(bw, bh) / w
        if not (0.006 <= diam <= 0.2): continue
        if n / (bw * bh) < 0.5: continue
        if not (0.6 <= bw / bh <= 1.7): continue
        cy, cx = pts.mean(axis=0)
        if cx < 0.04 * w or cx > 0.96 * w or cy < 0.04 * h or cy > 0.96 * h: continue
        r = max(bw, bh) / 2
        dist = np.hypot(yy - cy, xx - cx)
        rings = []
        for lo, hi in ((1.3, 2.0), (2.0, 3.0), (3.0, 4.5)):
            sel = lum[(dist > lo * r) & (dist < hi * r)]
            if sel.size == 0: break
            rings.append((float(sel.mean()), float(sel.std())))
        if len(rings) < 3: continue
        m1, m2, m3 = (m for m, _ in rings)
        # glow: bright immediately outside the disc, falling off, and not ragged
        if m1 < 120 or m1 < m2 - 5 or m2 < m3 - 5: continue
        if rings[0][1] > 70: continue
        # warmth: a low sun sits in warm sky; a lit cloud edge sits in blue
        ring1 = a[(dist > 1.3 * r) & (dist < 2.0 * r)]
        if float((ring1[:, 0] - ring1[:, 2]).mean()) < 8: continue
        glow = (m1 - m3) / 255
        score = n * (0.5 + glow) * (m1 / 255)
        cands.append((score, cx, cy, r, diam, glow))
    if not cands: return None
    cands.sort(reverse=True)
    # drop reflections: a candidate below another, in the same column
    kept = []
    for c in cands:
        _, cx, cy, r, *_ = c
        if any(abs(cx - kx) < 2.5 * max(r, kr) and cy > ky for _, kx, ky, kr, *_ in kept): continue
        kept.append(c)
    # sort again with a bias toward the upper candidate
    kept.sort(key=lambda c: c[0] * (1.4 - 0.8 * c[2] / h), reverse=True)
    _, cx, cy, r, diam, glow = kept[0]
    return cx / w, cy / h, diam, glow

def over_factor(sunX, sunY, w, h):
    sw = max(AX * W / sunX, (1 - AX) * W / (1 - sunX))
    sh = max(AY * H / sunY, (1 - AY) * H / (1 - sunY))
    cover = max(W / w, H / h)
    s = max(sw / w, sh / h, cover)
    return s / cover

# ---------- place lookup ----------

def place(photo_id):
    try:
        loc = api('flickr.photos.geo.getLocation', photo_id=photo_id)['photo']['location']
    except Exception:
        return {}
    name = lambda k: (loc.get(k) or {}).get('_content', '')
    # Flickr no longer returns a time zone for places; set `tz` by hand for the picks.
    return {'locality': name('locality'), 'region': name('region'), 'country': name('country')}

# ---------- main ----------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('out'); ap.add_argument('--per-box', type=int, default=80); ap.add_argument('--text', default='sunset')
    ap.add_argument('--workers', type=int, default=12)
    args = ap.parse_args()
    load_env()
    out = Path(args.out); cand = out / 'cand'; cand.mkdir(parents=True, exist_ok=True)

    print('searching…', file=sys.stderr)
    photos = search(args.text, args.per_box)
    print(f'{len(photos)} candidates', file=sys.stderr)

    def work(p):
        f = cand / f"{p['id']}.jpg"
        try:
            if not f.exists():
                f.write_bytes(fetch(p['url_m']))
            im = Image.open(f); im.load()
        except Exception as e:
            return None
        det = detect(im)
        if det is None: return None
        sunX, sunY, diam, contrast = det
        if not (0.15 <= sunY <= 0.88): return None
        ow, oh = int(p.get('o_width') or p.get('width_l') or im.width), int(p.get('o_height') or p.get('height_l') or im.height)
        over = over_factor(sunX, sunY, ow, oh)
        if over > MAX_OVER: return None
        return {
            'id': p['id'], 'thumb': str(f), 'url_l': p.get('url_l') or p['url_m'], 'url_o': p.get('url_o'),
            'page': f"https://www.flickr.com/photos/{p.get('path_alias') or p['owner']}/{p['id']}",
            'owner': p.get('ownername'), 'license': LICENSES.get(int(p['license']), p['license']),
            'taken': p.get('datetaken'), 'lat': float(p['latitude']), 'lon': float(p['longitude']),
            'w': ow, 'h': oh, 'sunX': round(sunX, 4), 'sunY': round(sunY, 4), 'diam': round(diam, 3),
            'glow': round(contrast, 2), 'over': round(over, 2),
        }

    print('downloading + detecting…', file=sys.stderr)
    with ThreadPoolExecutor(args.workers) as ex:
        keep = [r for r in ex.map(work, photos) if r]
    print(f'{len(keep)} pass detection', file=sys.stderr)

    print('looking up places…', file=sys.stderr)
    with ThreadPoolExecutor(4) as ex:
        for r, pl in zip(keep, ex.map(lambda r: place(r['id']), keep)):
            r.update(pl)
    keep.sort(key=lambda r: (r.get('country', ''), r.get('locality', '')))
    for i, r in enumerate(keep): r['n'] = i
    (out / 'candidates.json').write_text(json.dumps(keep, indent=1, ensure_ascii=False))

    # contact sheets: 5 x 6 per sheet, each tile 360px, sun marked
    T, COLS, ROWS = 360, 5, 6
    for s in range(0, len(keep), COLS * ROWS):
        chunk = keep[s:s + COLS * ROWS]
        sheet = Image.new('RGB', (COLS * T, ROWS * T), (30, 30, 30)); d = ImageDraw.Draw(sheet)
        for k, r in enumerate(chunk):
            im = Image.open(r['thumb']).convert('RGB'); sc = min(T / im.width, T / im.height)
            im = im.resize((max(1, int(im.width * sc)), max(1, int(im.height * sc))))
            x, y = (k % COLS) * T, (k // COLS) * T
            sheet.paste(im, (x, y))
            sx, sy = x + r['sunX'] * im.width, y + r['sunY'] * im.height
            d.ellipse([sx - 7, sy - 7, sx + 7, sy + 7], outline=(0, 255, 0), width=2)
            d.rectangle([x, y + T - 36, x + T, y + T], fill=(0, 0, 0))
            where = ', '.join(v for v in (r.get('locality'), r.get('country')) if v) or f"{r['lat']:.2f},{r['lon']:.2f}"
            d.text((x + 4, y + T - 34), f"#{r['n']} {where}"[:52], fill=(255, 255, 255))
            d.text((x + 4, y + T - 18), f"{r['license']} | x{r['over']} | {r['taken'][:10] if r['taken'] else ''}", fill=(180, 180, 180))
        sheet.save(out / f'sheet_{s // (COLS * ROWS):02d}.jpg', quality=85)
    print(f'wrote {out}/candidates.json and {math.ceil(len(keep) / (COLS * ROWS))} sheets', file=sys.stderr)

if __name__ == '__main__':
    main()
