// Which scene each space shows (pure; wq-chrome and wq-spaces each keep a copy: a mod can't import outside its folder).
// A space's scene is, in order: the one picked for it by clicking the quest day (shared "wq.scene.pick": space id ->
// scene), the one pinned to its name in mods/wq-spaces/places.json ({"my-project": "snow-north"}), else one its name
// prefers that no earlier space has taken, so the first seven spaces all look different.
export const SCENE_IDS = ["night", "dawn-flowers", "meteor-night", "snow-north", "autumn-road", "mage-library", "lakeside-town"];
export const SCENE_NAMES = {
  "night": "Starry Night Road", "dawn-flowers": "Catnip Meadow at Dawn", "meteor-night": "Meteor Shower",
  "snow-north": "Northern Aurora", "autumn-road": "Autumn Forest Road", "mage-library": "Whisker Library",
  "lakeside-town": "Fishing Town at Sunset",
};
const hashName = (name) => [...String(name ?? "")].reduce((n, c) => (n * 31 + c.codePointAt(0)) >>> 0, 7);

// spaces in their order -> { space id: scene id }
export function sceneMap(spaces, picks, pins) {
  const out = {};
  const taken = new Set();
  const free = (want) => {
    const n = SCENE_IDS.length;
    const i0 = SCENE_IDS.indexOf(want);
    for (let k = 0; k < n; k++) {
      const id = SCENE_IDS[(i0 + k) % n];
      if (!taken.has(id)) return id;
    }
    return want; // more spaces than scenes: they repeat
  };
  // picks and pins first, so a space someone chose for keeps its scene
  for (const sp of spaces ?? []) {
    const chosen = SCENE_IDS.includes(picks?.[sp.id]) ? picks[sp.id] : SCENE_IDS.includes(pins?.[sp.name]) ? pins[sp.name] : null;
    if (chosen) { out[sp.id] = chosen; taken.add(chosen); }
  }
  for (const sp of spaces ?? []) {
    if (out[sp.id]) continue;
    const id = taken.size >= SCENE_IDS.length ? SCENE_IDS[hashName(sp.name) % SCENE_IDS.length] : free(SCENE_IDS[hashName(sp.name) % SCENE_IDS.length]);
    out[sp.id] = id;
    taken.add(id);
  }
  return out;
}

// the scene after `id`
export const nextScene = (id) => SCENE_IDS[(SCENE_IDS.indexOf(id) + 1) % SCENE_IDS.length];
