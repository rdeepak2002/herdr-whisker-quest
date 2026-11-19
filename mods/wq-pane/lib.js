// Whisker Quest party: pure functions only (no herdr / gpui-kit calls).
import { LAYERS } from "./layers.js";
// wq-party, wq-tabs and wq-pane each keep a copy of this file (a mod can't import outside its folder). Change all three.
// Character picks are shared between the Whisker Quest mods (shared "wq.party", wq-party/jobs.json), so a tab keeps its cat.

export const ROSTER = [
  { id: "mochi", name: "Mochi", role: "Wizard", color: "#ffb070", style: "bolt" },
  { id: "tiger", name: "Tiger", role: "Warrior", color: "#ffb24a", style: "slash" },
  { id: "earl", name: "Earl Grey", role: "Knight", color: "#86b4ff", style: "slash" },
  { id: "butter", name: "Butter", role: "Cleric", color: "#ffe27a", style: "holy" },
  { id: "hazel", name: "Hazel", role: "Ranger", color: "#8fe39b", style: "bolt" },
  { id: "shadow", name: "Shadow", role: "Rogue", color: "#80e3d3", style: "slash" },
  { id: "sakura", name: "Sakura", role: "Samurai", color: "#ffb0dc", style: "slash" },
  { id: "pumpkin", name: "Pumpkin", role: "Witch", color: "#ffc25c", style: "bolt" },
  { id: "pudding", name: "Pudding", role: "Monk", color: "#ffa070", style: "slash" },
  { id: "pepper", name: "Pepper", role: "Storm Mage", color: "#fff27a", style: "bolt" },
  { id: "biscuit", name: "Biscuit", role: "Frost Mage", color: "#a8f2ff", style: "bolt" },
  { id: "nori", name: "Nori", role: "Pirate", color: "#7cc4ff", style: "slash" },
];
const BY_ID = new Map(ROSTER.map((c) => [c.id, c]));
export const character = (id) => BY_ID.get(id) ?? null;
export const facePath = (c) => (c ? `mods/wq-party/faces/${c.id}.png` : null);
// Each cat's animations live in its own pixel font (mods/wq-party/fonts/WhiskerDot<v>-<id>.ttf), one glyph per frame
// and color layer (build/layerfont.py). The version is in the family name: Herdr keeps a loaded family in memory, so a
// rebuilt font needs a new name.
export const FONT_VERSION = 1;
export const familyOf = (c) => `WhiskerDot${FONT_VERSION} ${c.name}`;

// Herdr on macOS draws a font in one color, so a sprite is one text element per color layer, stacked: layersOf
// splits an animation (a list of frames, each a string of glyphs) into [{ k, color, list }], one per color layer its
// glyphs use; layer k of glyph cp is at layerBase + k * stride + (cp - base) in the same font.
const LAYER_CACHE = new Map();
export function layersOf(family, list) {
  const L = LAYERS[family];
  if (!L) return [{ k: 0, color: null, list }];
  const key = `${family}\u0000${list.join("\u0001")}`;
  const hit = LAYER_CACHE.get(key);
  if (hit) return hit;
  let mask = 0;
  for (const s of list) for (const ch of s) {
    const m = L.used[ch.codePointAt(0).toString(16)];
    if (m) mask |= parseInt(m, 16);
  }
  const out = [];
  for (let k = 0; k < L.colors.length; k++) {
    if (!(mask & (1 << k))) continue;
    const off = L.layerBase + k * L.stride - L.base;
    const map = (s) => {
      let r = "";
      for (const ch of s) {
        const cp = ch.codePointAt(0);
        r += cp >= L.base && cp < L.base + L.stride ? String.fromCodePoint(cp + off) : ch;
      }
      return r;
    };
    out.push({ k, color: L.colors[k], list: list.map(map) });
  }
  if (LAYER_CACHE.size > 400) LAYER_CACHE.clear();
  LAYER_CACHE.set(key, out);
  return out;
}

// Sprite animations: one glyph per frame. Stage glyphs are 80x32 art pixels (the session header), solo glyphs 36x32
// (the party card). Shown at text_size 64 with line_height 1, so one art pixel is 2x2 screen pixels.
const ANIMS = {
  rest: [0xe000, 4, 450],
  stand: [0xe004, 2, 650],
  think: [0xe006, 4, 170],
  cast: [0xe00a, 12, 90],
  read: [0xe016, 6, 220],
  write: [0xe01c, 8, 150],
  fly: [0xe024, 6, 140],
  summon: [0xe02a, 8, 130],
  alert: [0xe032, 2, 380],
  victory: [0xe034, 8, 170],
  // v4, for the session header's scene (wq-pane): a meal at the campfire, and facing left (the fire's far side)
  eat: [0xe03c, 4, 320],
  eat_l: [0xe040, 4, 320],
  rest_l: [0xe044, 4, 450],
  stand_l: [0xe048, 2, 650],
  alert_l: [0xe04a, 2, 380],
};
// The finer kinds of work (classify below) borrow a sprite motion for the cards; the battle stage gives each its own scene.
const LOOKS = { test: "cast", build: "write", git: "cast", install: "read", delete: "cast", search: "read", plan: "read", wait: "stand", media: "summon" };
export const ART = { height: 32, stage: 80, solo: 36, scale: 2 };
export function frames(anim, solo) {
  const [base, n, ms] = ANIMS[anim] ?? ANIMS[LOOKS[anim]] ?? ANIMS.stand;
  const first = base + (solo ? 0x400 : 0);
  return { list: Array.from({ length: n }, (_, i) => String.fromCodePoint(first + i)), ms };
}

// Colors follow the background scene: wq-chrome writes the scene's theme overrides into the layout ("colors"), so
// mods take theme() colors, with these for an alpha or a lighter tint. The stage behind a sprite has one picture per
// scene (shared "wq.scene"; mods/wq-party/backdrops/<scene>-stage.png and -solo.png).
export const alpha = (c, a) => `${String(c ?? "#000000").slice(0, 7)}${a}`;
export function mix(a, b, k) {
  const ch = (c, i) => parseInt(String(c).slice(1 + i * 2, 3 + i * 2), 16) || 0;
  return `#${[0, 1, 2].map((i) => Math.round(ch(a, i) * (1 - k) + ch(b, i) * k).toString(16).padStart(2, "0")).join("")}`;
}
const SCENE_IDS = ["night", "dawn-flowers", "meteor-night", "snow-north", "autumn-road", "mage-library", "lakeside-town"];
export const backdrop = (scene, solo) => (SCENE_IDS.includes(scene)
  ? `mods/wq-party/backdrops/${scene}-${solo ? "solo" : "stage"}.png`
  : `mods/wq-party/backdrop-${solo ? "solo" : "stage"}.png`);

// What a status and the current activity look like.
export function animFor(status, activity) {
  if (status === "blocked") return "alert";
  if (status === "done") return "victory";
  if (status === "working") return activity?.kind ?? "think";
  if (status === "idle") return "rest";
  return "stand";
}

const ATTACK = { bolt: "casts a spell", slash: "strikes", holy: "casts holy light" };
// The RPG battle line for a header or card: "Mochi casts a spell!  npm test"
export function battleLine(ch, status, activity) {
  const anim = animFor(status, activity);
  const who = ch.name;
  const lines = {
    alert: `${who} calls for help! Needs your answer`,
    victory: `Quest complete!`,
    rest: `${who} is resting… Zzz`,
    stand: `${who} · standing by`,
    think: `${who} walks on, thinking…`,
    cast: `${who} ${ATTACK[ch.style] ?? ATTACK.bolt}!`,
    read: `${who} reads the grimoire`,
    write: `${who} carves runes`,
    fly: `${who} scouts with flight magic`,
    summon: `${who} summons an ally!`,
    test: `${who} unleashes a combo!`,
    build: `${who} forges at the anvil`,
    git: `${who} raises the banner`,
    install: `${who} restocks supplies`,
    delete: `${who} calls a firestorm!`,
    search: `${who} tracks the trail`,
    plan: `${who} studies the map`,
    wait: `${who} stands guard`,
    media: `${who} conjures an illusion`,
  };
  return { anim, text: lines[anim] ?? lines.stand, detail: anim === "think" || anim === "rest" || anim === "stand" ? null : activity?.detail ?? null };
}
// What the card says while it works
export const ACTING = { think: "Thinking", cast: "Casting", read: "Reading", write: "Writing", fly: "Scouting", summon: "Summoning",
  test: "Testing", build: "Forging", git: "Rallying", install: "Supplying", delete: "Burning", search: "Tracking", plan: "Planning",
  wait: "Guarding", media: "Conjuring" };

// ----- reading what an agent is doing from its screen (`hc read <terminal>`) -----
// Claude Code shows each tool as a top-level line (indent ≤ 2) whose ● blinks while it runs, so it may be missing:
//   "● Update(src/x.ts)", "● Web Search(...)", "● Fetch(...)", "● Explore(...)"/"● Agent(...)"   a tool call
//   "  <description>" + "  ⎿  $ npm test"                                                     a shell command running
//   "  Reading 1 file… (ctrl+o to expand)", "  Searching for 2 patterns, reading 1 file…"      a read/search group running
//   "  Read 1 file, ran 2 shell commands"                                                      a finished group: thinking again
//   "● <prose>"                                                                                the model talking: thinking
// Codex: "• Running npm test", "• Ran ...", "• Explored", "• Edited x.ts", "• Searched the web".
// The lowest such line above the prompt is the current activity.
const SKIP = /esc to interrupt|⏵⏵|shift\+tab|^\s*[│╭╰─┌└]|^\s*[❯›>](?:\s|$)|^\s*$/;
const SPINNER = /^\s*[^\w\s●⏺•⎿]\s+\S+…/; // "✶ Working… (31m · ↓ 23k tokens)"
const TOP = /^(\s{0,2})([●⏺•]\s+)?(\S.*)$/;
const RULES = [
  ["summon", /^(?:Agent|Task|Explore|Spawn(?:ed|ing)?|Launch(?:ed|ing)? \S+ agents?)\b|sub-?agent/i],
  ["plan", /^(?:Plan|Update(?:d)? Todos|TodoWrite|Todos?|Updat(?:e|ed|ing) (?:the )?plan|Planning)\b/i],
  ["fly", /^(?:Web ?Search(?:ed|ing)?|Web ?Fetch|Fetch(?:ed|ing)?|Search(?:ed|ing)? the web|Brows(?:e|ed|ing)|web\.run)\b/i],
  ["write", /^(?:Update[d]?|Updating|Edit(?:ed|ing)?|MultiEdit|Write|Wrote|Writing|Creat(?:e|ed|ing)|NotebookEdit|Added|Deleted|Patch(?:ed|ing)?|Made \d+ \S*\s*edits?)\b|apply_patch/i],
  ["search", /^(?:Search(?:ed|ing)?|Grep|Glob|List(?:ed|ing)?|Explor(?:e|ed|ing)|Found|Scann(?:ed|ing))\b/i],
  ["read", /^(?:Read(?:ing)?|Skill|Look(?:ed|ing) at|View(?:ed|ing)?)\b/i],
  ["wait", /^(?:Monitor|Wait(?:ed|ing)?|Sleep(?:ing)?|BashOutput|Polling)\b/i],
  ["cast", /^(?:Bash|PowerShell|Shell|Run(?:ning)?|Ran|Exec(?:ut(?:ed|ing))?)\b/i],
];
// A shell command, by what it does
const COMMANDS = [
  ["test", /\b(?:test|tests|pytest|jest|vitest|mocha|spec|lint|eslint|ruff|mypy|tsc --noEmit|check)\b/i],
  ["git", /^(?:git|gh)\b/i],
  ["install", /\b(?:install|i|add|upgrade|update)\b.*|^(?:pip|pipx|uv|npm|pnpm|yarn|winget|choco|scoop|cargo add)\b.*\b(?:install|add|i|upgrade)\b/i],
  ["delete", /^(?:rm|del|rmdir|rd|Remove-Item|unlink|shred)\b|\b(?:clean|prune|purge|uninstall)\b/i],
  ["media", /\b(?:gen_image|image|img|tts|speech|voice|video|grok|dall-?e|imagine|katana|fish)\w*/i],
  ["build", /\b(?:build|compile|make|cmake|bundle|webpack|vite|rollup|esbuild|tsc|cargo|gradle|msbuild|dotnet|render|ffmpeg|encode|export|pack)\w*/i],
  ["wait", /^(?:sleep|Start-Sleep|timeout|wait|Wait-Job|Get-Content .* -Wait|tail -f)\b/i],
  ["fly", /^(?:curl|wget|Invoke-WebRequest|Invoke-RestMethod|iwr|irm|http|ssh|scp|ping)\b/i],
  ["search", /^(?:grep|rg|find|fd|Select-String|Get-ChildItem|ls|dir|gci|where|which|tree)\b/i],
  ["read", /^(?:cat|type|Get-Content|gc|head|tail|less|more|bat)\b/i],
];
const commandKind = (cmd) => {
  const c = String(cmd ?? "").trim().replace(/^(?:\$\s*|cd [^;&]+(?:&&|;)\s*)/, "");
  if (/^git\b/i.test(c) || /^gh\b/i.test(c)) return "git";
  return COMMANDS.find(([, re]) => re.test(c))?.[0] ?? "cast";
};
const clean = (s) => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "").replace(/\(ctrl\+o to expand\)/g, "").replace(/\s+/g, " ").trim();
const kindOf = (text) => RULES.find(([, re]) => re.test(text))?.[0] ?? null;
const refine = (kind, cmd) => (kind === "cast" ? commandKind(cmd) : kind);
export function classify(screen) {
  const lines = String(screen ?? "").split(/\r?\n/).slice(-80);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (SKIP.test(line) || SPINNER.test(line)) continue;
    const m = line.match(TOP);
    if (!m) continue; // deeper lines: a diff, a tool's output
    const bullet = Boolean(m[2]);
    const head = clean(m[3]).replace(/\s·\s\d+(?:\.\d+)?m?s$/, "").replace(/\s·\ssummary$/, "");
    if (/^⎿/.test(head)) continue; // a tool's result line
    if (/^(?:Working|Thinking)\b.*\(/.test(head)) continue; // a Codex spinner
    // a shell command running under this line
    const cmd = lines.slice(i + 1, i + 4).map(clean).map((l) => l.match(/^⎿\s*\$\s*(.+)$/)).find(Boolean);
    if (cmd) return { kind: commandKind(cmd[1]), detail: cut(/^\w[\w ]*\(.*\)$/.test(head) ? cmd[1] : head) };
    // a tool call: Name(args)
    const call = head.match(/^(\w[\w ]*?)\s*\((.*)\)$/);
    if (call && kindOf(call[1])) return { kind: refine(kindOf(call[1]), call[2]), detail: cut(call[2]) };
    // a group of tools: the last part is what runs now; finished groups (no "…") mean it's thinking again
    if (/…$/.test(head)) {
      const part = head.replace(/…$/, "").split(/,\s*/).pop();
      const k = kindOf(part);
      if (k) return { kind: k, detail: cut(head), count: Number(head.match(/(\d+)\s+(?:\S+\s+)?agents?/i)?.[1]) || undefined };
    }
    if (!bullet) {
      if (/^(?:Read|Searched|Ran|Listed|Found|Fetched|Wrote|Edited|Made|Updated|Created)\b.*\d/.test(head)) return { kind: "think", detail: null };
      continue; // a wrapped line of prose, or a blinking ● — keep looking up
    }
    const k = kindOf(head); // Codex: "• Running npm test", "• Explored"
    if (!k) return { kind: "think", detail: null };
    const rest = head.replace(RULES.find(([n]) => n === k)[1], "").replace(/^[\s:·-]+/, "");
    return { kind: refine(k, rest), detail: cut(rest || head) };
  }
  return { kind: "think", detail: null };
}
// What an agent's screen says about it, for an agent that reports no status to Herdr (a Claude Code background job):
// a permission question is "blocked", the spinner or "esc to interrupt" is "working", else "idle".
export function screenStatus(screen) {
  const lines = String(screen ?? "").split(/\r?\n/).slice(-30);
  const tail = lines.join("\n");
  if (/Do you want to (?:proceed|make this edit|create|allow|run)|Allow (?:once|always)|❯\s*1\.\s*Yes\b/i.test(tail)) return "blocked";
  if (/esc to interrupt/i.test(tail) || lines.some((l) => SPINNER.test(l))) return "working";
  return "idle";
}
export const isAgentPane = (q) => /claude|codex/i.test(`${q?.app ?? ""} ${q?.program?.key ?? ""}`);
const pick = (s) => [...String(s)].reduce((h, c) => (Math.imul(h, 31) + c.codePointAt(0)) >>> 0, 7);

// A tab's party: one member per terminal pane (qs: its panes() in order), each a different character. A pane whose
// character another pane already has gets one nobody in the tab has (the same one each time, by its pane id).
// all: agents(); picks: shared("wq.party"); acts: shared("wq.activity") (its status covers agents that report none)
export function partyFor(qs, all, picks, acts, ownPane, max = 4, who = null) {
  const used = new Set();
  let out = qs.filter((q) => q.terminal).map((q) => {
    const ag = all.find((a) => a.address === q.terminal) ?? null;
    // the party list's cat for this terminal first (wq-party "wq.who": it also knows agents read from the screen)
    let c = character(who?.[q.terminal]) ?? character(picks?.[ag ? agentKey(ag, all) : `tab:${q.tab}`]) ?? ROSTER[0];
    if (used.has(c.id)) {
      const pool = ROSTER.filter((r) => !used.has(r.id));
      c = pool[pick(q.pane) % pool.length] ?? c;
    }
    used.add(c.id);
    const act = acts?.[q.terminal] ?? null;
    const st = ag?.status ?? q.status ?? (isAgentPane(q) ? act?.status ?? null : null);
    return { pane: q.pane, terminal: q.terminal, ch: c, st, act, anim: animFor(st, act), own: q.pane === ownPane, key: q.pane, summons: act?.count };
  });
  if (out.length > max) out = out.filter((m, i) => i < max - 1 || m.own).slice(0, max);
  return out;
}

function cut(s, max = 60) {
  const t = clean(String(s ?? ""));
  return [...t].length > max ? [...t].slice(0, max - 1).join("") + "…" : t;
}

// ----- shared between the Whisker Quest mods -----
const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");

// Tab name → character: jobs.json first, then a tab named after a character gets that character.
export function characterFor(name, jobs) {
  const wanted = norm(name);
  if (!wanted) return null;
  if (jobs && typeof jobs === "object" && !Array.isArray(jobs)) {
    for (const key of Object.keys(jobs)) {
      if (norm(key) !== wanted) continue;
      const c = BY_ID.get(norm(jobs[key]));
      if (c) return c.id;
    }
  }
  const named = ROSTER.find((c) => norm(c.name) === wanted || c.id === wanted || c.ko === wanted);
  return named ? named.id : null;
}

// Slots that get a character: tabs with an agent first (screen order), then shell-only tabs, last a tab's second and
// later agents. Keys are tab ids / terminal addresses, so a renamed tab keeps its character.
export function entriesFor(spaces, agents) {
  const withAgent = new Set((agents ?? []).map((a) => a.tab));
  const tabs = (spaces ?? []).flatMap((s) => s.tabs ?? []);
  const entries = [
    ...tabs.filter((t) => withAgent.has(t.id)).map((t) => ({ key: `tab:${t.id}`, name: t.name })),
    ...tabs.filter((t) => !withAgent.has(t.id)).map((t) => ({ key: `tab:${t.id}`, name: t.name })),
  ];
  const first = new Map();
  for (const a of agents ?? []) {
    if (!first.has(a.tab)) first.set(a.tab, a.address);
    else entries.push({ key: `agent:${a.address}`, name: null });
  }
  return entries;
}

export function agentKey(a, agents) {
  const first = (agents ?? []).find((x) => x.tab === a.tab);
  return first && first.address !== a.address ? `agent:${a.address}` : `tab:${a.tab}`;
}

// jobs.json and name matches win, characters already given stay, new slots take the next free one (repeat after 16).
export function settle(prev, entries, jobs) {
  const next = {};
  const used = new Set();
  for (const e of entries) {
    const c = characterFor(e.name, jobs);
    if (c && !used.has(c)) { next[e.key] = c; used.add(c); }
  }
  for (const e of entries) {
    if (next[e.key]) continue;
    const c = prev?.[e.key];
    if (BY_ID.has(c) && !used.has(c)) { next[e.key] = c; used.add(c); }
  }
  for (const e of entries) {
    if (next[e.key]) continue;
    if (used.size >= ROSTER.length) used.clear();
    const c = ROSTER.find((r) => !used.has(r.id)).id;
    next[e.key] = c;
    used.add(c);
  }
  return next;
}

function words(argv) {
  return (argv ?? []).flatMap((a) => String(a).match(/'[^']*'|"[^"]*"|\S+/g) ?? []).map((w) => w.replace(/^['"]|['"]$/g, ""));
}

// The account, model and resumed session an agent tab started with. null for an agent typed by hand.
export function launched(argv) {
  const w = words(argv);
  const at = w.findIndex((x) => /^(claude|codex)\d*(\.cmd|\.exe)?$/i.test(x.split(/[\\/]/).pop()));
  if (at < 0) return null;
  const after = (...names) => {
    const i = w.findIndex((x, n) => n > at && names.includes(x));
    return i >= 0 ? w[i + 1] ?? null : null;
  };
  const account = w[at].split(/[\\/]/).pop().replace(/\.(cmd|exe)$/i, "").toLowerCase();
  return { account, model: after("--model", "-m"), resume: after("--resume", "resume") };
}

// claude-opus-5-5 → Opus 5.5, opus → Opus, anything else as is.
export function modelName(m) {
  if (typeof m !== "string" || !m.trim()) return null;
  const s = m.trim();
  const full = s.match(/^claude-([a-z]+)-(\d+)-(\d+)/);
  if (full) return `${full[1][0].toUpperCase()}${full[1].slice(1)} ${full[2]}.${full[3]}`;
  if (/^(opus|sonnet|haiku|fable)$/i.test(s)) return s[0].toUpperCase() + s.slice(1).toLowerCase();
  return s;
}

const BAD_CHARS = new RegExp("[" + [[0x00, 0x1f], [0x7f, 0x9f], [0x2028, 0x2029], [0x202a, 0x202e], [0x2066, 0x2069]].map(([a, b]) => String.fromCharCode(a) + "-" + String.fromCharCode(b)).join("") + "]", "g");
export function cleanText(value, max = 80) {
  if (typeof value !== "string") return null;
  const s = value.replace(BAD_CHARS, "").replace(/\s+/g, " ").trim();
  return s === "" ? null : [...s].slice(0, max).join("");
}

// One account in usage.json → what's left of HP (the short window, e.g. 5h) and MP (weekly, else the longest).
export function gauges(acc, now) {
  const ws = (acc?.windows ?? []).map((w) => (acc.stale && w.resets != null && w.resets <= now ? { ...w, used: null } : w));
  const short = ws.find((w) => /^\d+h$/.test(w.label ?? "")) ?? null;
  const long = ws.find((w) => w.label === "weekly") ?? ws.filter((w) => w !== short).at(-1) ?? null;
  const one = (w, what) => {
    if (!w) return { pct: null, text: "—", tip: `${what}: this account has no such limit.` };
    if (w.used == null) return { pct: null, text: "—", tip: `${what} (${w.label}): not known yet` };
    const left = Math.max(0, Math.min(100, 100 - w.used));
    return { pct: left, text: `${left}%`, tip: `${what} (${w.label}): ${left}% left · ${w.used}% used${w.resets ? ` · resets ${until(w.resets, now)}` : ""}`, stale: Boolean(acc.stale) };
  };
  return { hp: one(short, "HP"), mp: one(long, "MP") };
}

export function until(ms, now) {
  const m = Math.max(0, Math.round((ms - now) / 60000));
  if (m < 60) return `in ${m}m`;
  if (m < 24 * 60) return `in ${Math.floor(m / 60)}h ${m % 60}m`;
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
