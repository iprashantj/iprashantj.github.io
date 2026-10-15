"""Video -> transparent, shot-cropped WebP frames + manifest.json"""
import json, os, sys, re
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from multiprocessing import Pool

SRC = 'full'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
W, H = 1600, 900
CUTS = [60, 120, 188]   # from ffmpeg scene scores (highest ~0.12-0.18)
N = len([f for f in os.listdir(SRC) if f.endswith('.png')])
SHOTS = [(0, CUTS[0] - 1), (CUTS[0], CUTS[1] - 1), (CUTS[1], CUTS[2] - 1), (CUTS[2], N - 1)]

_session = None
def session():
    global _session
    if _session is None:
        from rembg import new_session
        _session = new_session('u2net_human_seg')
    return _session

def matte(i):
    from rembg import remove
    im = Image.open(f'{SRC}/f{i:03d}.png').convert('RGB')
    if i >= CUTS[0]:
        # invert the generator's flat sparkle watermark overlay (bottom-right, shots 2-4)
        from wm import unwatermark
        im = Image.fromarray(unwatermark(np.asarray(im)))
    a = np.asarray(im).astype(np.float32)
    h, w = a.shape[:2]
    # background colour from the four corners
    s = 24
    corners = np.concatenate([a[:s, :s], a[:s, -s:], a[-s:, :s], a[-s:, -s:]]).reshape(-1, 3)
    bg = float(np.median(corners))

    # person mask
    pm = np.asarray(remove(im, session=session(), only_mask=True)).astype(np.float32) / 255

    # props mask: darker-than-background deviation (window light on the wall is brighter, so it's ignored)
    d = (bg - a).max(2)
    ramp = np.clip((d - 14) / (40 - 14), 0, 1)
    core = ndi.binary_opening(d > 14, structure=np.ones((3, 3)))
    lab, n = ndi.label(core)
    if n:
        sizes = ndi.sum(core, lab, range(1, n + 1))
        keep = np.isin(lab, np.where(sizes > 4000)[0] + 1)
    else:
        keep = np.zeros_like(core)
    keep = ndi.binary_dilation(keep, iterations=4)
    props = ramp * keep
    # wide furniture rows (table top + apron): the sunlit wood is close to the wall colour, so the ramp
    # leaves holes. Fill such rows solid between their outermost kept pixels.
    for y in range(h):
        xs = np.where(core[y] & keep[y])[0]
        if len(xs) and xs[-1] - xs[0] > 700 and core[y, xs[0]:xs[-1] + 1].mean() > 0.6:
            props[y, xs[0]:xs[-1] + 1] = 1.0

    alpha = np.maximum(pm, props)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255

    # un-premultiply against the background (removes white fringe)
    rgb = a.copy()
    m = alpha > 0.05
    al = alpha[..., None]
    rgb = np.where(m[..., None], (rgb - (1 - al) * bg) / np.maximum(al, 1e-3), rgb)
    rgb = np.clip(rgb, 0, 255)

    # erode alpha
    mn = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3))).astype(np.float32) / 255
    alpha = 0.35 * alpha + 0.65 * mn
    # remap
    alpha = np.clip((alpha - 0.14) / 0.86, 0, 1) ** 1.4
    # kill bright edge pixels
    lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    edge = alpha < 0.95
    alpha = np.where(edge, alpha * (1 - 0.8 * np.clip((lum - 150) / 70, 0, 1)), alpha)

    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    img = Image.fromarray(out, 'RGBA').resize((W, H), Image.LANCZOS)
    img.save(f'{OUT}/rgba/f{i:03d}.png')
    return i

def shot_of(i):
    for k, (a, b) in enumerate(SHOTS):
        if a <= i <= b:
            return k

if __name__ == '__main__':
    os.makedirs(f'{OUT}/rgba', exist_ok=True)
    os.makedirs(f'{OUT}/lg', exist_ok=True)
    os.makedirs(f'{OUT}/sm', exist_ok=True)
    todo = [i for i in range(N) if not os.path.exists(f'{OUT}/rgba/f{i:03d}.png')]
    with Pool(int(os.environ.get('P', 4))) as p:
        for i in p.imap_unordered(matte, todo):
            if i % 20 == 0: print('matted', i, flush=True)

    shots = []
    for k, (fa, fb) in enumerate(SHOTS):
        x0, y0, x1, y1 = W, H, 0, 0
        cxs = []
        for i in range(fa, fb + 1):
            al = np.asarray(Image.open(f'{OUT}/rgba/f{i:03d}.png'))[..., 3]
            ys, xs = np.where(al > 6)
            x0, y0, x1, y1 = min(x0, xs.min()), min(y0, ys.min()), max(x1, xs.max()), max(y1, ys.max())
        # person centre: alpha-weighted mean x of the top 45% of the (shot's) rows.
        # in the laptop shot, rows above the table only (the table lies below 45% anyway; we additionally
        # restrict to the person-sized band to be safe)
        mid = (fa + fb) // 2
        al = np.asarray(Image.open(f'{OUT}/rgba/f{mid:03d}.png'))[..., 3].astype(np.float64)
        top = int(y0 + (y1 - y0) * 0.45)
        band = al[y0:top]
        if k == 2:  # laptop shot: measure the head/torso only (exclude laptop + table edges)
                # person is the dominant blob in the upper band: limit to rows above the laptop screen
            band = al[y0:int(y0 + (y1 - y0) * 0.30)]
        xs = np.arange(W)
        cx_px = (band.sum(0) * xs).sum() / max(band.sum(), 1)
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        cx = (cx_px - x0) / bw  # relative to the crop box (0..1)
        shots.append({'from': fa, 'to': fb, 'box': [int(x0), int(y0), int(bw), int(bh)], 'cx': round(float(cx_px / W), 4)})
        for i in range(fa, fb + 1):
            im = Image.open(f'{OUT}/rgba/f{i:03d}.png').crop((x0, y0, x1 + 1, y1 + 1))
            im.save(f'{OUT}/lg/f{i:03d}.webp', 'WEBP', quality=80, alpha_quality=90, method=5)
            im.resize((bw // 2, bh // 2), Image.LANCZOS).save(f'{OUT}/sm/f{i:03d}.webp', 'WEBP', quality=78, alpha_quality=90, method=5)
        print('shot', k, shots[-1], flush=True)
    json.dump({'w': W, 'h': H, 'count': N, 'shots': shots}, open(f'{OUT}/manifest.json', 'w'))
