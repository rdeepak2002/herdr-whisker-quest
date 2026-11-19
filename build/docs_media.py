"""The README's still pictures: docs/cats.png (every cat in four poses), docs/monsters.png and docs/scenes.png.

    python build/docs_media.py        (after build_all.py: reads build/spr, build/spr_scene and backgrounds/)
"""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import roster  # noqa: E402

BG = (24, 30, 70)


def cats():
    poses = ['idle', 'attack', 'read', 'cheer']
    cw, ch = 82, 70
    im = Image.new('RGB', (cw * 6, ch * 2 * 2), BG)
    for n, c in enumerate(roster.CATS):
        d = np.load(f'{HERE}/spr/{c.id}.npz')
        col, row = n % 6, n // 6
        for k, p in enumerate(poses[:2]):
            spr = Image.fromarray(d[p])
            x = col * cw + (cw - spr.width) // 2
            y = (row * 2 + k) * ch + ch - spr.height - 2
            im.paste(spr, (x, y), spr)
    im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
    d = ImageDraw.Draw(im)
    for n, c in enumerate(roster.CATS):
        col, row = n % 6, n // 6
        d.text((col * cw * 2 + 6, (row * 2) * ch * 2 + 4), f'{c.name} · {c.role}', fill=c.color)
    im.save(f'{ROOT}/docs/cats.png', optimize=True)


def monsters():
    d = np.load(f'{HERE}/spr_scene/monsters.npz')
    names = ['wyvern', 'slime', 'wisp', 'wolf', 'stump', 'mimic', 'serpent', 'golem']
    sprs = [Image.fromarray(d[n]) for n in names]
    h = max(s.height for s in sprs) + 8
    im = Image.new('RGB', (sum(s.width + 12 for s in sprs) + 12, h), BG)
    x = 12
    for s in sprs:
        im.paste(s, (x, h - s.height - 4), s)
        x += s.width + 12
    im.resize((im.width * 2, im.height * 2), Image.NEAREST).save(f'{ROOT}/docs/monsters.png', optimize=True)


def scenes():
    ids = ['night', 'dawn-flowers', 'meteor-night', 'snow-north', 'autumn-road', 'mage-library', 'lakeside-town']
    w, h = 512, 288
    im = Image.new('RGB', (w * 2 + 6, (h + 6) * 4 - 6), BG)
    for i, sc in enumerate(ids):
        a = Image.open(f'{ROOT}/backgrounds/whisker-quest-{sc}.png').convert('RGB').resize((w, h), Image.NEAREST)
        im.paste(a, ((i % 2) * (w + 6), (i // 2) * (h + 6)))
    im.save(f'{ROOT}/docs/scenes.png', optimize=True)


if __name__ == '__main__':
    os.makedirs(f'{ROOT}/docs', exist_ok=True)
    cats()
    monsters()
    scenes()
    print('docs media ok')
