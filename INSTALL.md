# Installing Whisker Quest (instructions for an AI agent)

You are an AI coding agent (Claude Code, Codex, …) on a Mac. Follow these steps in order to give this Mac the
same Whisker Quest setup as the original one. Each step says how to check it worked. Stop and tell the person if a
check fails; don't improvise around it.

**Rules while you do this**
- Don't install anything except what step 1 says. Don't use `sudo`.
- Don't touch the person's other Herdr files: their own layouts, mods, themes, `keys.json`, `settings.json`.
- The only network use is `git clone` / `git pull` of this repository. Whisker Quest itself never uses the network.
- If you are running inside a Herdr terminal (the environment variable `HC_TERMINAL_ID` is set), never quit Herdr
  yourself; ask the person to.

## 1. Check the prerequisites

Run each command; every one must succeed:

```sh
uname -s                 # must print: Darwin   (macOS)
uname -m                 # should print: arm64  (Herdr's Mac app needs Apple Silicon)
ls ~/.config/herdr-app   # must exist: Herdr has been installed and opened at least once
herdr-app --version      # Herdr's command-line tool (installed by Herdr into ~/.local/bin)
hc --version             # herdr-core's command-line tool
python3 --version        # 3.9 or newer
git --version
```

If `herdr-app` or `hc` is "command not found" but `~/.local/bin/herdr-app` exists, use the full path
(`~/.local/bin/herdr-app`, `~/.local/bin/hc`) in every step below. If Herdr isn't installed at all, tell the person
to install it from https://herdr.dev and open it once, then stop.

## 2. Get the repository

```sh
if [ -d ~/herdr-whisker-quest/.git ]; then git -C ~/herdr-whisker-quest pull --ff-only; else git clone https://github.com/rdeepak2002/herdr-whisker-quest ~/herdr-whisker-quest; fi
cd ~/herdr-whisker-quest
```

Check: `ls install.sh layouts/whisker-quest.json mods/wq-party/fonts | head` lists files.

## 3. Tell the person what it will run

Say this to the person in one or two lines before installing (from README.md → "Privacy and safety"): the mods run
`python3` (two small scripts in the repo), `hc` (to read what each agent's terminal shows), `git status`, `ps` and
`pbcopy`; they read Claude Code's local transcripts (`~/.claude*/projects`) for the session list; they write only the
layout file and `~/.cache/whisker-quest/`; nothing uses the network.

## 4. Install

```sh
./install.sh
```

- If it prints `Already there: …`, an earlier Whisker Quest is installed: run `./install.sh --update` instead (it
  replaces only Whisker Quest's own files: the `wq-*` mods, `layouts/whisker-quest.json`, `themes/whisker-quest.json`,
  `backgrounds/whisker-quest-*.png`).
- It must not print `check failed`. If it does, show the person the full output and stop.

Check:

```sh
ls ~/.config/herdr-app/mods | grep '^wq-'      # 7 mods: wq-chrome wq-new-menu wq-pane wq-party wq-sessions wq-spaces wq-tabs
herdr-app status                               # "layout": "whisker-quest", "errors": []
```

If `"layout"` isn't `"whisker-quest"`, run `herdr-app do layout.switch --name whisker-quest`.

## 5. Restart Herdr once

Herdr loads the sprite fonts only when it starts. Ask the person: "Please quit Herdr (Cmd+Q) and open it again."
If you are **not** inside a Herdr terminal, you may do it yourself:

```sh
osascript -e 'quit app "Herdr"'; sleep 3; open -a Herdr; sleep 8
```

## 6. Check it looks right

```sh
herdr-app shot ~/whisker-quest-check.png
```

Open the picture and check:
- the top-left corner shows a cat's face, `HERDR` and `Quest · Day 1`;
- the band above the terminals shows a pixel landscape with at least one cat in it;
- the left sidebar has `JOURNEYS`, `PARTY` and `Quest log` panels.

If you see `?` boxes instead of cats, Herdr wasn't restarted: ask the person to quit and reopen it again.
`herdr-app status` must still show `"errors": []`.

## 7. Tell the person how to use it

- Every agent (Claude Code, Codex) becomes a cat; while it works, the cats fight on the stage above the terminals.
- Each space has its own scene; click `Quest · Day N` (top left) to give the current space the next scene.
- `Ctrl+Shift+L` switches back to their own layout; `./install.sh --remove` uninstalls.

## Updating later

```sh
cd ~/herdr-whisker-quest && git pull --ff-only && ./install.sh --update
```

Then restart Herdr once (step 5) if the fonts changed (`git log -1 --stat` mentions `mods/wq-party/fonts`).
