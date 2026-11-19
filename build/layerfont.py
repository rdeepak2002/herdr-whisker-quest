"""Pixel-art glyph fonts that draw in full color on macOS.

Herdr on macOS draws a COLR color font in one color (the text color), so a sprite is built as one monochrome font
whose glyph for color layer k of frame cp sits at code point  LAYER_BASE + k * stride + (cp - BASE).  The mods stack
one text element per color layer, each in its own text color, all switching frames on Herdr's one shared clock.

Every font also maps printable ASCII to blank glyphs: macOS text layout measures a font with ordinary characters
before it uses it, and a font without them is skipped (its glyphs show as boxes).

build(path, family, glyphs, H, max_colors) -> {"family", "base", "stride", "colors": ["#rrggbbaa"], "used": {cp: mask}}
glyphs: [(code point, width in art pixels, RGBA frame of H rows)]
"""
import numpy as np
from PIL import Image
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

U = 32                 # font units per art pixel
BASE = 0xE000          # the frames' own code points start here (what the mods' tables list)
LAYER_BASE = 0xF0000   # supplementary private use planes 15 and 16
SPACER = 0xF8F0        # blank glyphs 1, 2, 4 ... 512 art pixels wide: they place glyphs side by side in one text


def rects_glyph(cells, H, unit=U):
    """cells: (x, y) pixels, y = 0 at the top, `unit` font units each -> a glyph of merged rectangles."""
    rows = {}
    for x, y in cells:
        rows.setdefault(y, []).append(x)
    runs_by_row = {}
    for y, xs in rows.items():
        xs = sorted(set(xs))
        runs, start, prev = [], xs[0], xs[0]
        for x in xs[1:]:
            if x == prev + 1:
                prev = x
                continue
            runs.append((start, prev))
            start = prev = x
        runs.append((start, prev))
        runs_by_row[y] = runs
    rects, open_ = [], {}
    for y in range(0, H + 1):
        cur = set(runs_by_row.get(y, []))
        for run in list(open_):
            if run not in cur:
                rects.append((run[0], open_[run], run[1], y - 1))
                del open_[run]
        for run in cur:
            if run not in open_:
                open_[run] = y
    pen = TTGlyphPen(None)
    for x0, y0, x1, y1 in rects:
        X0, X1 = x0 * unit, (x1 + 1) * unit
        Y1, Y0 = (H - y0) * unit, (H - y1 - 1) * unit
        pen.moveTo((X0, Y0))
        pen.lineTo((X0, Y1))
        pen.lineTo((X1, Y1))
        pen.lineTo((X1, Y0))
        pen.closePath()
    return pen.glyph()


def palette_of(frames, max_colors):
    """The colors every frame is drawn in: alpha snapped to 16 steps, merged down to max_colors when there are more."""
    drawn = [f[f[..., 3] > 0].reshape(-1, 4) for f in frames if (f[..., 3] > 0).any()]
    if not drawn:
        raise SystemExit('layerfont: every frame is empty (check the cut art)')
    allpx = np.concatenate(drawn)
    allpx = allpx.copy()
    allpx[:, 3] = (np.round(allpx[:, 3] / 17) * 17).astype(np.uint8)
    uniq, counts = np.unique(allpx, axis=0, return_counts=True)
    if len(uniq) <= max_colors:
        return uniq
    # Merge: start from the most used colors, then k-means in RGBA (alpha weighted more, so glows stay glows)
    wts = np.array([1, 1, 1, 2.0])
    order = np.argsort(-counts)
    cent = uniq[order[:max_colors]].astype(np.float64)
    X = uniq.astype(np.float64)
    for _ in range(12):
        d = (((X[:, None, :] - cent[None, :, :]) * wts) ** 2).sum(2)
        lab = d.argmin(1)
        for k in range(max_colors):
            m = lab == k
            if m.any():
                cent[k] = np.average(X[m], axis=0, weights=counts[m])
    return np.unique(np.clip(np.round(cent), 0, 255).astype(np.uint8), axis=0)


def build(path, family, glyphs, H, max_colors=32):
    pal = palette_of([f for _, _, f in glyphs], max_colors)
    res = glyphs[0][2].shape[0] // H  # frames drawn RES x finer than art pixels
    pal_f = pal.astype(np.int32)
    lut = {tuple(c): i for i, c in enumerate(pal)}
    cps = [cp for cp, _, _ in glyphs]
    span = max(cps) - BASE + 1
    stride = 1
    while stride < span:
        stride *= 2
    L = len(pal)
    assert LAYER_BASE + L * stride <= 0x10FFFD, (family, L, stride)

    names = ['.notdef', 'space']
    gl = {'.notdef': TTGlyphPen(None).glyph(), 'space': TTGlyphPen(None).glyph()}
    metrics = {'.notdef': (8 * U, 0), 'space': (8 * U, 0)}
    cmap = {0x20: 'space'}
    blanks = {}
    used = {}

    def blank(w):
        n = f'blank{w}'
        if n not in blanks:
            blanks[n] = True
            names.append(n)
            gl[n] = TTGlyphPen(None).glyph()
            metrics[n] = (w * U, 0)
        return n

    for cp, w, f in glyphs:
        cells = {}
        ys, xs = np.nonzero(f[..., 3] > 0)
        for y, x in zip(ys, xs):
            c = f[y, x].astype(np.int32)
            c[3] = int(round(c[3] / 17) * 17)
            k = lut.get(tuple(np.uint8(v) for v in c))
            if k is None:
                k = int((((pal_f - c) * np.array([1, 1, 1, 2])) ** 2).sum(1).argmin())
            cells.setdefault(k, set()).add((int(x), int(y)))
        mask = 0
        b = blank(w)
        cmap[cp] = b  # the frame's own code point: blank, the right width (for measuring)
        for k in range(L):
            lcp = LAYER_BASE + k * stride + (cp - BASE)
            if k in cells:
                n = f'g{cp:04X}_{k}'
                names.append(n)
                gl[n] = rects_glyph(cells[k], H * res, U // res)
                metrics[n] = (w * U, 0)
                cmap[lcp] = n
                mask |= 1 << k
            else:
                cmap[lcp] = b
        used[cp] = mask
    for cp in range(0x21, 0x7F):
        cmap.setdefault(cp, blank(8))
    for i in range(10):
        cmap[SPACER + i] = blank(1 << i)

    UPM = H * U
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(names)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(gl)
    glyf = fb.font['glyf']
    for n in names:
        g = glyf[n]
        g.recalcBounds(glyf)
        metrics[n] = (metrics[n][0], getattr(g, 'xMin', 0) if g.numberOfContours else 0)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=UPM, descent=0)
    ps = family.replace(' ', '')
    fb.setupNameTable({'familyName': family, 'styleName': 'Regular', 'uniqueFontIdentifier': ps + '-Regular',
                       'fullName': family + ' Regular', 'psName': ps + '-Regular', 'version': 'Version 1.000'})
    fb.setupOS2(sTypoAscender=UPM, sTypoDescender=0, sTypoLineGap=0, usWinAscent=UPM, usWinDescent=0, fsType=0)
    fb.setupPost()
    fb.save(path)
    colors = ['#%02x%02x%02x%02x' % tuple(int(v) for v in c) for c in pal]
    return {'family': family, 'base': BASE, 'layerBase': LAYER_BASE, 'stride': stride, 'colors': colors,
            'used': {str(cp): m for cp, m in used.items()}, 'adv': {str(cp): w for cp, w, _ in glyphs}, 'spacer': SPACER}
