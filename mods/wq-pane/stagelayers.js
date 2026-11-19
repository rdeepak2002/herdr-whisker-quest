// The battle stage's boxes (plan.js items: one font, place and width each, a frame per step) as colored text
// elements Herdr can draw on macOS, where a font shows in one color (its text color).
//
// Every color a sprite uses is its own glyph in the same font (build/layerfont.py, layers.js), so a sprite is a stack
// of text elements, one per color. Done box by box that is hundreds of elements, each with a frame per step: too much
// for the app's script engine to hand over on every render. So boxes of one font, row and timing that never draw over
// each other at the same step share a "lane": one element per color for the whole lane, each step's text placing the
// lane's visible boxes side by side with blank spacer glyphs. Runs when a plan is made (on the timer), not in render.
import { LAYERS } from "./layers.js";

const BLANK = " ";
const INFO = new Map();

function info(family) {
  if (INFO.has(family)) return INFO.get(family);
  const L = LAYERS[family];
  let out = null;
  if (L) {
    const used = new Map();
    for (const [cp, m] of Object.entries(L.used)) used.set(parseInt(cp, 16), parseInt(m, 16));
    const adv = new Map();
    for (const [first, n, w] of L.adv) for (let i = 0; i < n; i++) adv.set(first + i, w);
    out = { ...L, usedMap: used, advMap: adv, mapped: new Map() };
  }
  INFO.set(family, out);
  return out;
}

const spacer = (I, n) => {
  let s = "";
  for (let i = 9; i >= 0; i--) if (n & (1 << i)) s += String.fromCodePoint(I.spacer + i);
  return s;
};

// a frame's glyphs drawn in color layer k (blank, the same width, where the glyph doesn't use k)
function inLayer(I, str, k) {
  const key = `${k}|${str}`;
  let r = I.mapped.get(key);
  if (r !== undefined) return r;
  r = "";
  const off = I.layerBase + k * I.stride - I.base;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    r += cp >= I.base && cp < I.base + I.stride ? String.fromCodePoint(cp + off) : ch;
  }
  I.mapped.set(key, r);
  return r;
}

function maskOf(I, str) {
  let m = 0;
  for (const ch of str) m |= I.usedMap.get(ch.codePointAt(0)) ?? 0;
  return m;
}

function advance(I, str) {
  let a = 0;
  for (const ch of str) a += I.advMap.get(ch.codePointAt(0)) ?? 0;
  return a;
}

// items -> [{ key, family, x, y, w, rows, color, frames, ms }]: each element's text has one line per art row (the
// render sets the line height to one art pixel, so a glyph's row is its line: rows from y, `rows` of them)
export function layerStage(items) {
  const out = [];
  const groups = new Map();
  for (const it of items) {
    const g = `${it.family}|${it.ms}|${it.frames.length}`;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(it);
  }
  for (const [gkey, its] of groups) {
    const I = info(its[0].family);
    if (!I) { // not a layered font: as it was
      for (const it of its) out.push({ key: it.key, family: it.family, x: it.x, y: it.y, w: it.w, rows: 1, color: null, frames: it.frames, ms: it.ms });
      continue;
    }
    const L = its[0].frames.length;
    its.sort((a, b) => a.x - b.x);
    // lanes: boxes on the same row that overlap at the same step need their own lane
    const lanes = [];
    for (const it of its) {
      const vis = [];
      for (let t = 0; t < L; t++) if (it.frames[t] !== BLANK) vis.push(t);
      let lane = null;
      for (const l of lanes) {
        let ok = true;
        for (const t of vis) {
          const busy = l.busy[t];
          if (busy && busy.some(([y, a, b]) => y === it.y && it.x < b && it.x + it.w > a)) { ok = false; break; }
        }
        if (ok) { lane = l; break; }
      }
      if (!lane) { lane = { items: [], busy: new Array(L) }; lanes.push(lane); }
      lane.items.push(it);
      for (const t of vis) (lane.busy[t] ??= []).push([it.y, it.x, it.x + it.w]);
    }
    lanes.forEach((lane, li) => {
      const x0 = Math.min(...lane.items.map((i) => i.x));
      const x1 = Math.max(...lane.items.map((i) => i.x + i.w));
      const y0 = Math.min(...lane.items.map((i) => i.y));
      const y1 = Math.max(...lane.items.map((i) => i.y));
      // per step: its visible boxes by row (each row left to right: the lane's items are sorted by x)
      let mask = 0;
      const steps = new Array(L);
      for (let t = 0; t < L; t++) {
        let rows = null;
        for (const it of lane.items) {
          const g = it.frames[t];
          if (g === BLANK || g == null || g === "") continue;
          rows ??= new Map();
          if (!rows.has(it.y)) rows.set(it.y, []);
          rows.get(it.y).push([it.x, g]);
          mask |= maskOf(I, g);
        }
        steps[t] = rows;
      }
      for (let k = 0; k < I.colors.length; k++) {
        if (!(mask & (1 << k))) continue;
        const frames = new Array(L);
        let any = false;
        for (let t = 0; t < L; t++) {
          const rows = steps[t];
          if (!rows) { frames[t] = ""; continue; }
          let s = "", line = 0;
          for (const y of [...rows.keys()].sort((a, b) => a - b)) {
            const row = rows.get(y);
            let txt = "", cursor = x0;
            for (const [x, g] of row) {
              if (x > cursor) txt += spacer(I, x - cursor);
              txt += inLayer(I, g, k);
              cursor = Math.max(cursor, x) + advance(I, g);
            }
            s += "\n".repeat(y - y0 - line) + txt;
            line = y - y0;
          }
          frames[t] = s;
          any = true;
        }
        if (any) out.push({ key: `${gkey}|${li}|${k}`, family: its[0].family, x: x0, y: y0, w: x1 - x0, rows: y1 - y0 + 1, color: I.colors[k], frames, ms: its[0].ms });
      }
    });
  }
  return out;
}
