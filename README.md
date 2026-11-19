# Whisker Quest 🐾

A cozy pixel-art RPG layout for the [Herdr](https://herdr.dev) desktop app **on macOS**. Every coding agent you run
(Claude Code, Codex) becomes a little pixel cat adventurer: the wizard casts when your agent runs commands, the
knight charges when it runs tests, the cleric heals the party, and the whole party fights cucumber slimes, box
mimics and the dreaded **Vacuum Golem** on a battle stage above your terminals. Each Herdr space has its own scene,
so switching spaces takes you somewhere new.

![Whisker Quest in Herdr: four cats fight the Vacuum Golem above four Claude Code panes](docs/hero.png)

![The battle stage, recorded live: the party fights, Tiger uses TIGER CLAW, the cleric heals, the Vacuum Golem falls, and a treasure chest appears](docs/battle.gif)

**Twelve cats**, each with its own weapon, magic and special move:

![The twelve cats, idle and attacking](docs/cats.png)

**Eight monsters**, one per scene, and the boss:

![Night Crow, Cucumber Slime, Laser Wisp, Snow Hound, Jack-o'-Gourd, Box Mimic, Bath Kraken, Vacuum Golem](docs/monsters.png)

**Seven scenes**; the background, the colors of the whole window, the battle stage and its monster follow the
space you're in:

![Starry Night Road, Catnip Meadow at Dawn, Meteor Shower, Northern Aurora, Autumn Forest Road, Whisker Library, Fishing Town at Sunset](docs/scenes.png)

> [!WARNING]
> **This project is 100% vibe coded.** Every line of code, every build script and every doc here was written by an
> AI coding agent (Claude Code), and the art was made with an AI image model. It was tested by running it in Herdr,
> not by careful human review. Use it for fun, read the code before you trust it, and expect rough edges.

> [!NOTE]
> **Whisker Quest is a fork of [CHO-kr/frieren](https://github.com/CHO-kr/frieren)**, the wonderful Frieren
> layouts for Herdr. The idea, the layout, the mods and the battle choreography are theirs; Whisker Quest ports the
> Frieren Pixel layout to macOS, makes it run fully offline, and swaps the Frieren cast for cats. All credit for the
> original goes to its author. See [NOTICE](NOTICE).

## What you get

- **A party member per agent.** Every Claude Code / Codex agent (and agents typed by hand into a shell) is a cat.
  Its card in the sidebar shows its face, tab, model and what it is doing right now, read from its screen every
  1.5 seconds: `Tiger strikes!  npm test`, `Mochi reads the grimoire`, `Butter calls for help! Needs your answer`.
- **The battle stage** above the terminals shows the shown tab's party (up to four cats, one per pane) in one
  scene. While an agent works they fight a long battle in three waves (the scene's monster, another one, then the
  Vacuum Golem as the boss), and each cat's turns follow the kinds of work its agent did lately: tests become a
  combo, builds forge a blade at an anvil, `git` raises a banner, installs drink a potion, deletes call a meteor
  storm, searches follow footprints, the web makes it fly. Full SP gauges trigger a special move with a banner:
  COSMIC MEOW, TIGER CLAW, SKY POUNCE, HOLY PURR, ARROW RAIN, NINE LIVES, PETAL FLASH, CATNIP STORM, HAIRBALL QUAKE,
  THUNDERPAW, ICE WHISKERS, FISH TIDE. When nobody works the party camps: meals by the cooking pot, training,
  studying, fishing, naps (and a watch under shooting stars at night). Done agents open a treasure chest.
- **A scene per space.** Each space gets its own of the seven scenes (different ones for your first seven spaces),
  and the whole window follows it: the wallpaper, every panel's colors, the battle stage, its monster and the cards'
  little stages. Click **Quest · Day N** in the top-left corner to give the current space the next scene (it is
  remembered), or pin one by name in `mods/wq-spaces/places.json`: `{ "my-project": "snow-north" }`.
- **Quest log**: your Claude Code sessions on this Mac (every login: `claude`, `claude2`, …), grouped by day.
  Click one to continue it in a new tab in its folder, or to jump to the tab already running it. Right-click to copy
  its `claude --resume` command.
- **Pixel everything**: tabs as inventory slots with each cat's face, spaces as scene tiles with their git state,
  pixel pane headers with a battle line, a pixel font (Galmuri), a foldable sidebar rail.
- **Fully local.** No network calls, no telemetry of its own, no accounts. It reads only local files and asks
  `hc`, `git` and `ps` about your own terminals. Safe for a work laptop (read [Privacy](#privacy-and-safety)).

## Requirements

| What | Why |
|---|---|
| macOS on Apple Silicon | Herdr's macOS app needs it; Whisker Quest is built and tested on macOS |
| [Herdr](https://herdr.dev) desktop app, with `herdr-app` and `hc` on your PATH | the app itself (it installs both into `~/.local/bin`) |
| `python3` (3.9+) | the Quest log and the account lookup (standard library only) |
| `git` | the git summary on each space tile |
| Claude Code and/or Codex | optional: the agents your cats represent |

Rebuilding the art (not needed to use it) also needs `pip install pillow numpy scipy fonttools`.

## Install

### By hand

```sh
git clone <this repo> ~/herdr-whisker-quest
cd ~/herdr-whisker-quest
./install.sh
```

Then **quit Herdr and open it again once**: Herdr loads a layout's sprite fonts only when it starts. Switch layouts
any time with `Ctrl+Shift+L` or **Settings → Look → Layout**. `./install.sh --update` replaces an earlier install,
`./install.sh --remove` takes it all out.

### Ask your AI agent to install it (works on a work laptop)

Paste this into Claude Code, Codex or any coding agent on the Mac where Herdr is installed. It's written so an
agent can follow it step by step:

```text
Install the Whisker Quest layout for the Herdr desktop app from <URL of this repo>. Follow these steps exactly:

1. Check the prerequisites, and stop and tell me if one is missing:
   - macOS: `uname -s` prints Darwin.
   - Herdr is installed and has been started at least once: the folder ~/.config/herdr-app exists,
     and `herdr-app --version` and `hc --version` both work.
   - `python3 --version` prints 3.9 or newer, and `git --version` works.
2. Clone the repository into a new folder: `git clone <URL> ~/herdr-whisker-quest`.
   If that folder exists, `cd` into it and `git pull` instead.
3. Read README.md (the "Privacy and safety" section) and tell me in one line what the mods run and read.
4. From the repository folder, run `./install.sh`.
   - If it says "Already there", run `./install.sh --update` (it replaces only Whisker Quest's own files:
     the mods named wq-*, layouts/whisker-quest.json, themes/whisker-quest.json, backgrounds/whisker-quest-*).
   - It must not print "check failed". If it does, show me the output and stop.
5. Run `herdr-app status` and confirm "layout" is "whisker-quest" and "errors" is empty.
   If the layout is not active, run `herdr-app do layout.switch --name whisker-quest`.
6. Tell me to quit Herdr (Cmd+Q) and open it again once, so it loads the sprite fonts.
   Do not quit Herdr yourself if you are running inside a Herdr terminal.
7. After I reopen it, run `herdr-app shot ~/whisker-quest-check.png` and look at the picture: the sidebar's
   top-left shows a cat face and "Quest · Day 1", and the stage above the terminals shows a cat in a scene.
   If you see "?" boxes instead of cats, Herdr was not restarted: ask me to restart it again.
Do not install anything else, do not change my keys.json or other layouts, and do not use the network
beyond the git clone.
```

### Files it installs

Into `~/.config/herdr-app` (or `$HERDR_APP_HOME`): `layouts/whisker-quest.json` (+ its preview), `themes/whisker-quest.json`,
`backgrounds/whisker-quest-*.png` (7 scenes) and seven mods: `wq-chrome`, `wq-spaces`, `wq-party`, `wq-tabs`,
`wq-pane`, `wq-new-menu`, `wq-sessions`. It never overwrites a file it didn't install, and leaves your own layouts,
mods and `keys.json` alone.

## Quick start

| Do this | What happens |
|---|---|
| Start Claude Code or Codex in a tab | a cat joins the party; its card and the stage show what it does |
| Split a tab into panes with agents | up to four cats fight together on the stage |
| Rename a tab to `Mochi`, `Tiger`, `Earl Grey`, … | that tab's agent becomes that cat |
| Switch spaces | the scene (and the window's colors) changes with the space |
| Click **Quest · Day N** (top left) | this space gets the next scene (hover it to see the scene's name) |
| Click a party card | focus that agent's terminal |
| Click a session in the **Quest log** | continue it in a new tab (or jump to the tab running it); right-click copies the resume command |
| `Ctrl+Shift+L` | cycle layouts (back to your own and here again) |
| `Ctrl+Shift+B` | hide the sidebar; the button in the top-left corner folds it into a rail |

**Pick who plays whom**: name a tab after a cat, or map tab names in `mods/wq-party/jobs.json`:
`{ "api": "earl", "docs": "mochi" }`. Cat ids: `mochi`, `tiger`, `earl`, `butter`, `hazel`, `shadow`, `sakura`,
`pumpkin`, `pudding`, `pepper`, `biscuit`, `nori`.

**Pin a scene to a space** in `mods/wq-spaces/places.json` by the space's name: `night`, `dawn-flowers`,
`meteor-night`, `snow-north`, `autumn-road`, `mage-library`, `lakeside-town`.

**More than one Claude login**: run each with its own config folder (`CLAUDE_CONFIG_DIR=~/.claude-2`, typically a
`claude2` wrapper script in `~/.local/bin`); the Quest log lists `~/.claude-N` logins and the pane headers name the
account.

## How it works

```mermaid
flowchart LR
  subgraph build["build/ (offline, run once: python3 build/build_all.py)"]
    gen["gen/*.png<br/>AI-generated sheets<br/>(12 cats, monsters,<br/>props, 7 scenes)"] --> cut["cut_art.py<br/>pixel-snap to the art grid,<br/>remove magenta,<br/>pick pixel size"]
    cut --> anim["anim.py<br/>every cat animation<br/>+ magic effects<br/>(2x detail canvas)"]
    cut --> stage["stage_art.py + special_art.py<br/>monsters, fx, props,<br/>specials, stage strips"]
    anim --> lf["layerfont.py<br/>one glyph per frame<br/>per color layer"]
    stage --> lf
    lf --> fonts["wq-party/fonts/*.ttf<br/>+ layers.js<br/>(colors, used layers,<br/>widths)"]
    cut --> bg["backgrounds/*.png<br/>tiles, card stages"]
    pal["palettes.py"] --> scenesjs["wq-chrome/scenes.js<br/>UI colors per scene"]
  end

  subgraph herdr["Herdr app (GPUI, runs the mods)"]
    chrome["wq-chrome<br/>brand row, scene per space:<br/>rewrites the layout's<br/>background + colors"]
    party["wq-party<br/>party cards; reads agent<br/>screens (hc read) every 1.5 s;<br/>shares wq.activity, wq.who"]
    pane["wq-pane<br/>battle stage + pane headers;<br/>plan.js choreography,<br/>stagelayers.js packing"]
    tabs["wq-tabs"]
    spacesm["wq-spaces"]
    sess["wq-sessions<br/>Quest log (list.py reads<br/>~/.claude*/projects)"]
    menu["wq-new-menu"]
  end

  fonts --> party
  fonts --> pane
  bg --> chrome
  scenesjs --> chrome
  party -- "shared state" --> pane
  chrome -- "wq.scene" --> pane
  chrome -- "wq.scene" --> party
  spacesm -. "same scene rule<br/>(spacescene.js)" .- chrome
```

What's custom in Whisker Quest (beyond the original's design):

- **Color sprites on macOS.** Herdr draws mod text with GPUI, and on macOS GPUI draws a COLR color font in one color
  (only Apple's own emoji font gets color, and naming a font like it hides real emoji). So a sprite is built as one
  monochrome glyph per color (`build/layerfont.py`): the glyph for color *k* of frame *cp* sits at
  `U+F0000 + k·stride + (cp − U+E000)`, and the mods stack one text element per color, each in its own text color,
  all switching frames on Herdr's one shared animation clock. Every font also maps blank ASCII glyphs: macOS skips a
  font without them.
- **Double-detail cats.** The cats are drawn at 2× the stage's art resolution (`anim.RES`): effects keep their
  chunky 2×2 pixels while each cat shows its whiskers and eye highlights.
- **A battle stage that fits the render budget.** Herdr cuts off a render that runs too long, and stacking colors
  multiplies the work. `wq-pane/stagelayers.js` runs when a battle is planned (on a timer), not in render: boxes of
  one font share elements where they never draw over each other, glyphs are placed side by side with spacer glyphs
  (1, 2, 4 … 512 px wide), and each element's text has **one line per art row** (`line_height` = one art pixel), so
  a sprite's height on the stage is just which line it's on. Four fighting cats went from 757 elements and 520k frame
  strings to 290 and 200k.
- **A scene per space** (`spacescene.js` in `wq-chrome` and `wq-spaces`): the shown space's scene is painted into the
  layout file (background picture, theme colors, panel gradients), and the stage, the card stages and the space tiles
  follow it.
- **One cat per agent everywhere.** `wq-party` publishes which cat each terminal is (`wq.who`), including agents it
  only reads from the screen, so the cards, the stage, the headers and the tabs agree; cats stay with their agent
  when other tabs open or close.
- **The Quest log** (`wq-sessions`) and **macOS process lookups** (`wq-pane/who.py`, with `ps`) replace the
  original's Windows-only session panels, PowerShell scripts and Windows API calls.
- **The art pipeline**: `build/cut_art.py` turns the generated sheets into grid-snapped sprites (choosing the pixel
  size that fits each sheet), backgrounds, stage strips, card stages and tiles. See [build/ART.md](build/ART.md).

## Customize

- **Scenes**: their palettes are in `build/palettes.py` (→ `mods/wq-chrome/scenes.js`), the stage strip rows and the
  monster of each scene in `build/stage_art.py` (`SCENES`, `MONSTERS`).
- **The battle**: turns, waves, specials, pastimes and victories are in `mods/wq-pane/plan.js`; which kind of work a
  screen line is (`RULES`, `COMMANDS`) in `classify` of `mods/wq-party/lib.js` (three copies: wq-party, wq-tabs,
  wq-pane).
- **Terminal see-through**: `terminal_opacity` in `layouts/whisker-quest.json` (`0.55`; `1` is solid).
- **New art**: replace a sheet in `build/gen/` (same layout: 4 × 2 poses on magenta), run
  `python3 build/build_all.py`, raise `FONT_VERSION` in `build/anim.py` and in each `lib.js` (Herdr keeps a loaded
  font family in memory), then `./install.sh --update` and restart Herdr.

## Privacy and safety

Mods are trusted code that runs on your machine. Whisker Quest's:

- **run programs**: `python3` (its own `list.py` and `who.py`), `hc` (`hc read` on each agent's terminal to see what
  it's doing, `hc get` / `hc ls`), `git status` / `git rev-parse` in each space's folder, `ps` (your own processes,
  to name the account of an agent typed by hand), `pbcopy` (when you right-click a session).
- **read files outside their folder**: Claude Code transcripts in `~/.claude/projects` and `~/.claude-N/projects`
  (only the session's title, first prompt, folder and branch are kept), and the layout file they paint.
- **write**: the shown layout's file (background and colors, when the scene changes) and a cache at
  `~/.cache/whisker-quest/sessions.json`.
- **never use the network**: no `fetch`, no API calls, no telemetry, no Remote Control. Nothing leaves your machine.

## What's different from the original

Ported: the Pixel layout, its party, stage, tabs, spaces, pane headers and + menu. Replaced: the session lists
(the Quest log), the Windows account lookup (`ps`). Not included, because they're Windows-only or use the network:
the usage gauges (they called Anthropic's and OpenAI's APIs; HP/MP bars now show only if some other mod shares
`usage.accounts`), the Codex and Claude-desktop session lists, the results panel, smart paste and the Frieren
Journey layout.

## Known limits

- Herdr loads a layout's fonts only at start: restart Herdr after installing or rebuilding.
- The motions come from reading each agent's screen, so a tool the screen doesn't show reads as thinking.
- With more than seven spaces, scenes repeat.
- macOS only (the original is for Windows).

## Uninstall

`./install.sh --remove` (switches back to Herdr's own layout and deletes only Whisker Quest's files).

## Credits

- **[CHO-kr/frieren](https://github.com/CHO-kr/frieren)**, the original Frieren layouts for Herdr this is forked from,
  and in turn [herdr-traveler](https://github.com/franky5440-afk/herdr-traveler) (Apache 2.0) and Herdr's built-in
  mods (Apache 2.0). See [NOTICE](NOTICE) and `LICENSES/`.
- **[Galmuri](https://github.com/quiple/galmuri)** pixel font by Lee Minseo (quiple), SIL Open Font License 1.1.
- **Art**: generated for this project with an AI image model (OpenAI gpt-image through Figma AI), then pixel-snapped
  and cleaned by code; prompts in [build/ART.md](build/ART.md).
- **Code**: written by Claude Code (see the warning above).
