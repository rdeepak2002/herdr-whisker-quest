"""Turns the generated art (build/gen/, see ART.md) into Whisker Quest's pixel assets.

    python cut_art.py <repo root>

- cats:        gen/<cat>.png (a 4 x 2 pose sheet on magenta) -> spr/<cat>.npz, 8 grid-snapped poses (sprites.py), at
               the art-pixel size that makes the tallest pose fit the 32-row glyphs (31 rows, a row for the shadow)
- monsters:    gen/monsters.png (8 monsters, 4 x 2) -> spr_scene/monsters.npz, at full detail (tallest 60 rows)
- props:       gen/props.png (8 camp props, 4 x 2) -> spr_scene/props.npz, likewise
- backgrounds: gen/bg_<scene>.png -> backgrounds/whisker-quest-<scene>.png: snapped to a 512 x 288 art grid (each art
               pixel the median of its cell) in at most 96 colors, shown at 5x (2560 x 1440)
"""
import os
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import sprites  # noqa: E402
import roster  # noqa: E402

GEN = f'{HERE}/gen'
OUT_TMP = f'{HERE}/.cut'
MONSTERS = ['wyvern', 'slime', 'wisp', 'wolf', 'stump', 'mimic', 'serpent', 'golem']  # stage_art.py's names
PROPS = ['logs', 'pot', 'tent', 'chest', 'chest_open', 'bedroll', 'signpost', 'backpack']
SCENES = ['night', 'dawn-flowers', 'meteor-night', 'snow-north', 'autumn-road', 'mage-library', 'lakeside-town']


def cut_poses(cid, k):
    """The 8 poses of a sheet at art-pixel size k: sprites.py's column gaps, else (when an effect bridges two poses)
    the 8 largest connected shapes."""
    try:
        sprites.detect_k = lambda a, fg: float(k)
        sprites.main(f'{GEN}/{cid}.png', OUT_TMP, cid, colors=30)
        d = np.load(f'{OUT_TMP}/{cid}.npz')
        return [d[p] for p in sprites.POSES]
    except SystemExit:
        a, objs = cells(f'{GEN}/{cid}.png', 8, dilate=4)
        poses = []
        for box, m in objs:
            x0, y0, x1, y1 = box
            sa, sf = a[y0:y1, x0:x1], m[y0:y1, x0:x1]
            poses.append(sprites.resample(a, m, k, sprites.phase(sa, sf, k, 1) + x0, sprites.phase(sa, sf, k, 0) + y0, box))
        return sprites.quantize(poses, 30)


def cut_cat(cid, out):
    """The smallest pixels (most detail) whose tallest pose still fits the glyphs: 31 art rows at anim.RES x
    (62 rows; the last art row is the ground shadow's)."""
    for k in np.arange(4.5, 16.01, 0.25):
        poses = cut_poses(cid, k)
        if max(p.shape[0] for p in poses) <= 31 * 2:
            break
    else:
        raise SystemExit(f'{cid}: no pixel size up to 16 fits its poses in 62 rows; check gen/{cid}.png')
    anchors = []
    for p in poses:  # the head: centroid of the top 35%
        top = p[: max(1, int(p.shape[0] * 0.35)), :, 3] > 0
        xs = np.nonzero(top)[1]
        anchors.append(float(xs.mean()) if len(xs) else p.shape[1] / 2)
    np.savez_compressed(f'{out}/{cid}.npz', k=k, anchors=np.array(anchors), **dict(zip(sprites.POSES, poses)))
    return k


def cells(path, n=8, dilate=14):
    """The n objects of a 4 x 2 sheet on magenta, in reading order: (image, [(box, fg mask)])."""
    a = np.asarray(Image.open(path).convert('RGB'))
    fg = ~sprites.bg_mask(a)
    fg = ndimage.binary_opening(fg, iterations=1)
    lab, cnt = ndimage.label(ndimage.binary_dilation(fg, iterations=dilate))
    boxes = []
    for sl in ndimage.find_objects(lab):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        boxes.append((x0, y0, x1, y1))
    boxes = sorted(boxes, key=lambda b: -(b[2] - b[0]) * (b[3] - b[1]))[:n]  # the n largest (drops stray specks)
    h = a.shape[0]
    top = sorted([b for b in boxes if (b[1] + b[3]) / 2 < h / 2], key=lambda b: b[0])
    bot = sorted([b for b in boxes if (b[1] + b[3]) / 2 >= h / 2], key=lambda b: b[0])
    boxes = top + bot
    if len(boxes) != n:
        raise SystemExit(f'{path}: expected {n} objects, found {len(boxes)}')
    out = []
    for x0, y0, x1, y1 in boxes:
        m = np.zeros_like(fg)
        m[y0:y1, x0:x1] = fg[y0:y1, x0:x1]
        ys, xs = np.nonzero(m)
        out.append(((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1), m))
    return a, out


def cut_sheet(path, names, k, colors=28):
    a, objs = cells(path, len(names))
    imgs = []
    for box, m in objs:
        x0, y0, x1, y1 = box
        sa, sf = a[y0:y1, x0:x1], m[y0:y1, x0:x1]
        phx = sprites.phase(sa, sf, k, 1) + x0
        phy = sprites.phase(sa, sf, k, 0) + y0
        imgs.append(sprites.resample(a, m, k, phx, phy, box))
    imgs = sprites.quantize(imgs, colors)
    return dict(zip(names, imgs))


def fit_k(path, names, rows):
    """The smallest pixels (most detail) whose tallest object fits `rows` full-detail rows."""
    for k in np.arange(4.5, 16.01, 0.25):
        objs = cut_sheet(path, names, k)
        if max(v.shape[0] for v in objs.values()) <= rows:
            return k
    raise SystemExit(f'{path}: no pixel size up to 16 fits its objects in {rows} rows')


def background(scene, root):
    im = Image.open(f'{GEN}/bg_{scene}.png').convert('RGB')
    W, H = 512, 288
    w, h = im.size
    if w < 512 or h < 288:
        raise SystemExit(f'gen/bg_{scene}.png is {w} x {h}: it needs at least 512 x 288')
    if w * 9 > h * 16:  # too wide: crop the sides to 16:9
        tw = round(h * 16 / 9)
        im = im.crop(((w - tw) // 2, 0, (w - tw) // 2 + tw, h))
    elif w * 9 < h * 16:  # too tall: crop top and bottom
        th = round(w * 9 / 16)
        im = im.crop((0, (h - th) // 2, w, (h - th) // 2 + th))
    a = np.asarray(im)
    h, w = a.shape[:2]
    out = np.zeros((H, W, 3), np.uint8)
    for y in range(H):
        y0, y1 = int(y * h / H), int((y + 1) * h / H)
        for x in range(W):
            x0, x1 = int(x * w / W), int((x + 1) * w / W)
            c = a[y0:y1, x0:x1].reshape(-1, 3)
            out[y, x] = np.median(c, axis=0)
    q = Image.fromarray(out).quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    q.resize((W * 5, H * 5), Image.NEAREST).save(f'{root}/backgrounds/whisker-quest-{scene}.png', optimize=True)
    return np.asarray(q)


if __name__ == '__main__':
    root = sys.argv[1]
    os.makedirs(f'{HERE}/spr', exist_ok=True)
    os.makedirs(OUT_TMP, exist_ok=True)
    os.makedirs(f'{HERE}/spr_scene', exist_ok=True)
    os.makedirs(f'{root}/backgrounds', exist_ok=True)
    for c in roster.CATS:
        k = cut_cat(c.id, f'{HERE}/spr')
        print('cat', c.id, 'k', k, flush=True)
    mons = cut_sheet(f'{GEN}/monsters.png', MONSTERS, fit_k(f'{GEN}/monsters.png', MONSTERS, 60), colors=40)
    np.savez_compressed(f'{HERE}/spr_scene/monsters.npz', **mons)
    print('monsters', {k: v.shape[:2] for k, v in mons.items()})
    props = cut_sheet(f'{GEN}/props.png', PROPS, fit_k(f'{GEN}/props.png', PROPS, 60), colors=40)
    np.savez_compressed(f'{HERE}/spr_scene/props.npz', **props)
    print('props', {k: v.shape[:2] for k, v in props.items()})
    for sc in SCENES:
        background(sc, root)
        print('background', sc, flush=True)
