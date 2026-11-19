"""The place tiles of the spaces panel (wq-spaces): 32 x 32 art pixels cut from the backgrounds, saved at 2x.

    python tiles.py <repo root>
"""
import os
import sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# place id (wq-spaces PLACES) -> (scene, left, top) of its 32 x 32 cut
TILES = {  # scene id -> (scene, left, top): a space's tile is its scene
    'lakeside-town': ('lakeside-town', 410, 112), 'night': ('night', 432, 58), 'dawn-flowers': ('dawn-flowers', 452, 120),
    'autumn-road': ('autumn-road', 90, 110), 'meteor-night': ('meteor-night', 410, 92), 'snow-north': ('snow-north', 430, 150),
    'mage-library': ('mage-library', 420, 28),
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
