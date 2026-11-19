// Whisker Quest sessions: your Claude Code sessions on this Mac (every login: claude, claude2, ...), newest first,
// grouped by day, in the sidebar under the party. Click one to continue it in a new tab, in its folder, with the
// account that made it (`claude --resume <id>`); if a tab already runs it, that tab gets focus. Right-click a row
// to copy its resume command. Filters: All · 7d · 30d.
// Reads only transcripts, through list.py (python3, read-only; see its docstring): this Mac's, and on each connected
// SSH machine that machine's own (through herdr-core, like everything Herdr does there). No other network use.
import { View, div, svg } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { exec, appHome, theme, run, terminals, checking, notify, machines, spaces, readTextFile } from "herdr";

const LIST = () => `${appHome()}/mods/wq-sessions/list.py`;
const ICON = (n) => `mods/wq-chrome/icons/${n}.svg`;
const DAY = 86400000;
const FILTERS = [["all", "All", Infinity], ["7d", "7d", 7 * DAY], ["30d", "30d", 30 * DAY]];
const alpha = (c, a) => `${String(c ?? "#000000").slice(0, 7)}${a}`;
const startOfDay = (ms) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };

function groupOf(ms, now) {
  const today = startOfDay(now);
  if (ms >= today) return "Today";
  if (ms >= today - DAY) return "Yesterday";
  if (ms >= today - 7 * DAY) return "Last 7 days";
  if (ms >= today - 30 * DAY) return "Last 30 days";
  return "Older";
}

function ago(ms, now) {
  const m = Math.max(0, Math.round((now - ms) / 60000));
  if (m < 60) return `${m}m`;
  if (m < 24 * 60) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / (24 * 60))}d`;
}

const shortPath = (p) => String(p ?? "").replace(/^\/Users\/[^/]+/, "~");
const quote = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;

export default class WqSessions extends View {
  init(_props, cx) {
    this.list = null;
    this.error = null;
    this.filter = "all";
    this.loading = false;
    if (checking()) return;
    this.load(cx);
    cx.timer.every(30000, (cx) => this.load(cx));
  }

  // This Mac's sessions, and each connected SSH machine's (list.py's source runs on that machine's python3, so it
  // lists the transcripts there; a machine that can't be asked keeps what it showed last).
  load(cx) {
    if (this.loading) return;
    this.loading = true;
    cx.spawn(async (cx) => {
      const remote = machines().filter((m) => m.name && m.layout === "ready" && !m.temporary).map((m) => m.name);
      this.remote ??= {};
      try {
        const r = await exec("python3", [LIST()], { timeout: 20000 });
        const list = JSON.parse(r.stdout || "[]");
        if (Array.isArray(list)) {
          this.local = list;
          this.error = null;
        }
      } catch (e) {
        this.error = String(e?.message ?? e).split("\n")[0];
      }
      if (remote.length) {
        this.src ??= await readTextFile(LIST()).catch(() => null);
        await Promise.all(remote.map(async (m) => {
          try {
            const r = await exec("python3", ["-c", this.src, "200"], { on: m, timeout: 30000 });
            const list = JSON.parse(r.stdout || "[]");
            if (Array.isArray(list)) this.remote[m] = list.map((x) => ({ ...x, machine: m }));
          } catch {} // the machine is away or has no python3: keep its last list
        }));
      }
      for (const m of Object.keys(this.remote)) if (!remote.includes(m) && !machines().some((k) => k.name === m)) delete this.remote[m];
      this.list = [...(this.local ?? []), ...Object.values(this.remote).flat()].sort((a, b) => b.mtime - a.mtime);
      this.loading = false;
      cx.notify();
    });
  }

  // session id -> the terminal running it (started with `--resume <id>` / `-r <id>`)
  running() {
    const out = new Map();
    for (const t of terminals()) {
      const argv = (t.argv ?? []).map(String);
      argv.forEach((a, i) => {
        if ((a === "--resume" || a === "-r") && argv[i + 1]) out.set(argv[i + 1], t);
        else if (a.startsWith("--resume=")) out.set(a.slice(9), t);
      });
    }
    return out;
  }

  openIn(s) {
    return this.running().get(s.id) ?? null;
  }

  open(s) {
    const t = this.openIn(s);
    if (t) {
      run("pane.focus", { terminal: t.address });
      return;
    }
    const args = { name: s.title.slice(0, 28), argv: [s.cmd, "--resume", s.id] };
    if (s.cwd) args.folder = s.cwd;
    if (s.machine) {
      // on its own machine: a new tab in a space there, or a new space there
      const sp = spaces().find((x) => x.machine === s.machine && x.active) ?? spaces().find((x) => x.machine === s.machine);
      if (sp) run("tab.new", { ...args, space: sp.id });
      else run("space.new", { ...args, machine: s.machine, tab: args.name });
      return;
    }
    run("tab.new", args);
  }

  copy(s) {
    const cmd = `${s.machine ? `ssh ${s.machine} -t ` : ""}${s.cwd ? `cd ${quote(s.cwd)} && ` : ""}${s.cmd} --resume ${s.id}`;
    exec("python3", ["-c", "import subprocess, sys; subprocess.run(['pbcopy'], input=sys.argv[1].encode(), check=True)", cmd]).then(() => notify({ title: "Resume command copied", body: cmd, timeout: 3000 }))
      .catch(() => notify({ title: "Resume command", body: cmd, timeout: 8000 }));
  }

  row(s, now, t, run) {
    const live = run.get(s.id) ?? null;
    return h_flex().id(`s-${s.id}`).w_full().min_w(0).h(24).px(8).gap(6).items_center().flex_none()
      .cursor_pointer().hover((st) => st.bg(t.hover))
      .tooltip(`${s.title}\n${shortPath(s.cwd)}${s.branch ? ` · ${s.branch}` : ""}\n${s.account} · ${new Date(s.mtime).toLocaleString()}\n${live ? "Open in a tab: click to go there" : "Click: continue in a new tab · right-click: copy the resume command"}`)
      .on_click(() => this.open(s))
      .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); this.copy(s); })
      .child(div().size(5).flex_none().bg(live ? t.working : "#00000000"))
      .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(live ? t.foreground : t.muted).child(s.title))
      .when(Boolean(s.machine), (el) => el.child(div().flex_none().font_family("Galmuri9").text_size(10).text_color(t.accent).child(s.machine)))
      .when(s.account !== "claude", (el) => el.child(div().flex_none().font_family("Galmuri9").text_size(10).text_color(t.dim).child(s.account)))
      .child(div().flex_none().font_family("Galmuri9").text_size(10).text_color(t.dim).child(ago(s.mtime, now)));
  }

  render() {
    const t = theme();
    const now = Date.now();
    const live = this.running();
    const all = this.list ?? [];
    const counts = Object.fromEntries(FILTERS.map(([k, , span]) => [k, all.filter((s) => now - s.mtime <= span).length]));
    const span = FILTERS.find(([k]) => k === this.filter)?.[2] ?? Infinity;
    const shown = all.filter((s) => now - s.mtime <= span);
    const groups = [];
    for (const s of shown) {
      const g = groupOf(s.mtime, now);
      if (!groups.length || groups[groups.length - 1].name !== g) groups.push({ name: g, items: [] });
      groups[groups.length - 1].items.push(s);
    }
    const header = h_flex().w_full().h(28).px(8).gap(6).items_center().flex_none()
      .child(svg(ICON("grimoire")).size(12).flex_none().text_color(t.accent))
      .child(div().flex_1().min_w(0).truncate().text_size(13).text_color(t.foreground).child("Quest log"))
      .child(div().font_family("Galmuri9").text_size(10).text_color(t.dim).child("Claude sessions"))
      .child(div().id("refresh").size(20).flex().items_center().justify_center().text_color(t.dim)
        .hover((st) => st.text_color(t.accent)).tooltip("Refresh")
        .on_click((_e, cx) => this.load(cx)).child(div().font_family("Galmuri9").text_size(11).child(this.loading ? "…" : "↻")));
    const filters = h_flex().w_full().px(8).gap(8).items_center().flex_none().font_family("Galmuri9").text_size(10)
      .children(FILTERS.map(([k, label]) => div().id(`f-${k}`).cursor_pointer()
        .text_color(this.filter === k ? t.accent : t.dim).hover((st) => st.text_color(t.foreground))
        .on_click((_e, cx) => { this.filter = k; cx.notify(); })
        .child(`${label} ${counts[k]}`)));
    let body;
    if (this.error && !this.list) {
      body = div().p(10).text_size(11).text_color(t.blocked).child(`Couldn't read sessions: ${this.error}`);
    } else if (!this.list) {
      body = div().p(10).text_size(11).text_color(t.dim).child("Reading your quest log…");
    } else if (!shown.length) {
      body = div().p(10).text_size(11).text_color(t.dim).child(all.length ? "Nothing in this range." : "No Claude Code sessions yet. Start one and it shows up here.");
    } else {
      body = v_flex().id("sessions-scroll").w_full().flex_1().min_h(0).overflow_y_scrollbar().pb(4)
        .children(groups.flatMap((g) => [
          div().px(8).pt(6).pb(2).font_family("Galmuri9").text_size(10).text_color(t.accent).child(g.name),
          ...g.items.map((s) => this.row(s, now, t, live)),
        ]));
    }
    return v_flex().id("wq-sessions").size_full().min_h(0).text_color(t.foreground)
      .child(header)
      .child(filters)
      .child(div().w_full().h(1).my(4).bg(alpha(t.border, "60")).flex_none())
      .child(body);
  }
}
