"""The little stage behind each card's sprite: a cut of its scene's stage strip (the ground and its edge).

usage: python backdrop.py <pixel-party dir> [sheet.png]
  writes backdrop-stage.png / backdrop-solo.png (night, the default) and backdrops/<scene>-stage.png / -solo.png
"""
import sys, os, math, random
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from palettes import STAGES  # noqa: E402


def hx(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def backdrop(W, seed=3, st=STAGES['night']):
    random.seed(seed)
    H = 32
    im = Image.new('RGB', (W, H))
    p = im.load()
    sky1, sky2, sky3 = map(hx, st['sky'])
    glow, hill, ridge_top = hx(st['glow']), hx(st['hill']), hx(st['ridge'])
    grass, grass2 = map(hx, st['ground'])
    tuft = hx(st['tuft'])
    for y in range(H):
        for x in range(W):
            if y < 9: c = sky1
            elif y < 14: c = sky2 if (x + y) % 2 == 0 or y >= 12 else sky1
            elif y < 18: c = sky3 if (x + y) % 2 == 0 or y >= 16 else sky2
            elif y == 18: c = glow
            else: c = sky3
            p[x, y] = c
    for k in range(W // 9):  # stars (the same random draws in every scene, so the tufts land alike)
        x, y = random.randrange(W), random.randrange(8)
        if st.get('star'):
            p[x, y] = hx(st['star'])
    if st.get('extra') == 'aurora':  # a rippling band high in the sky
        a1, a2 = map(hx, st['aurora'])
        for x in range(W):
            y = 3 + round(1.6 * math.sin(x / 5.0 + 0.7))
            p[x, y] = a1
            if (x + y) % 2 == 0:
                p[x, y + 1] = a2
            if x % 3 == 0 and y > 0:
                p[x, y - 1] = a2
    if st.get('extra') == 'meteors':  # falling stars, head bottom-left, trail up-right
        for k, (hx0, hy0) in enumerate(((W - 14, 5), (W // 2 - 4, 3), (W // 4, 7))[:max(1, W // 30)]):
            for i in range(9):
                x, y = hx0 + i, hy0 - i // 2
                if 0 <= x < W and 0 <= y < H:
                    p[x, y] = hx('#ffffff') if i < 2 else hx(st['star']) if i < 5 else hx('#a9a6ec') if i < 7 else sky2
    # far hills: bumpy ridge
    ridge = [19 + int(2.2 * (1 + math.sin(x / 6.0 + 1.3)) + (1 if (x // 5) % 3 == 0 else 0)) for x in range(W)]
    for x in range(W):
        for y in range(ridge[x], 25):
            p[x, y] = hill if y > ridge[x] else ridge_top
    # ground
    for y in range(25, H):
        for x in range(W):
            p[x, y] = grass2 if y == 25 else (grass if (x + y) % 3 else grass2)
    for k in range(W // 4):
        x = random.randrange(W); y = random.randrange(26, H)
        p[x, y] = tuft
    for k in range(W // 10):
        x = random.randrange(1, W - 1); y = random.randrange(27, H - 1)
        p[x, y] = hx(random.choice(st['flowers']))
    return im


def from_scene(root, scene, W, x_frac):
    """A W x 32 cut of the scene's stage strip (stage_art.band: its ground and what stands at its edge)."""
    import stage_art
    band = stage_art.band(root, scene)  # 512 x 36
    x0 = int((band.width - W) * x_frac)
    return band.crop((x0, 4, x0 + W, 36))


if __name__ == '__main__':
    out = sys.argv[1]
    root = os.path.dirname(os.path.dirname(os.path.abspath(out)))
    os.makedirs(f'{out}/backdrops', exist_ok=True)
    # each scene's card stages are cut from its own picture; the fallbacks (no scene known yet) are the night's
    for sc in STAGES:
        from_scene(root, sc, 80, 0.3).resize((160, 64), Image.NEAREST).save(f'{out}/backdrops/{sc}-stage.png')
        from_scene(root, sc, 36, 0.12).resize((72, 64), Image.NEAREST).save(f'{out}/backdrops/{sc}-solo.png')
    from_scene(root, 'night', 80, 0.3).resize((160, 64), Image.NEAREST).save(f'{out}/backdrop-stage.png')
    from_scene(root, 'night', 36, 0.12).resize((72, 64), Image.NEAREST).save(f'{out}/backdrop-solo.png')
