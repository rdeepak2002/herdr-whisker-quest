"""The place tiles of the spaces panel (wq-spaces): 32 x 32 art pixels cut from the backgrounds, saved at 2x.

    python tiles.py <repo root>
"""
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# place id (wq-spaces PLACES) -> (scene, left, top) of its 32 x 32 cut
TILES = {
    'capital': ('lakeside-town', 256, 128), 'ruins': ('night', 432, 58), 'meadow': ('dawn-flowers', 452, 120),
    'camp': ('autumn-road', 90, 110), 'tower': ('meteor-night', 410, 92), 'street': ('lakeside-town', 410, 112),
    'tree': ('night', 336, 60), 'moon': ('mage-library', 420, 28),
}


if __name__ == '__main__':
    root = sys.argv[1]
    out = f'{root}/mods/wq-spaces/art'
    os.makedirs(out, exist_ok=True)
    cache = {}
    for pid, (sc, x, y) in TILES.items():
        if sc not in cache:  # the background's art pixels (it is saved at 5x)
            cache[sc] = np.asarray(Image.open(f'{root}/backgrounds/whisker-quest-{sc}.png').convert('RGB'))[2::5, 2::5]
        tile = cache[sc][y:y + 32, x:x + 32]
        Image.fromarray(tile).resize((64, 64), Image.NEAREST).save(f'{out}/{pid}.png')
    print('tiles', len(TILES))
