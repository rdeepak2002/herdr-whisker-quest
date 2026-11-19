#!/bin/sh
# Installs Whisker Quest into the Herdr app's home (~/.config/herdr-app, or $HERDR_APP_HOME) and switches to it.
#
#   ./install.sh            install; stops if a file or mod of the same name is already there
#   ./install.sh --update   replace an earlier Whisker Quest install (only its own files: wq-* mods, whisker-quest-*)
#   ./install.sh --remove   delete everything Whisker Quest installed
#
# Copies files only: no downloads, nothing leaves your machine.
set -eu

SRC=$(cd "$(dirname "$0")" && pwd)
HOME_DIR=${HERDR_APP_HOME:-$HOME/.config/herdr-app}
MODE=${1:-install}
MODS="wq-chrome wq-spaces wq-party wq-tabs wq-pane wq-new-menu wq-sessions"

if [ ! -d "$HOME_DIR" ]; then
  echo "No Herdr app home at $HOME_DIR. Start Herdr once first (https://herdr.dev)." >&2
  exit 1
fi

remove() {
  for m in $MODS; do rm -rf "$HOME_DIR/mods/$m"; done
  rm -f "$HOME_DIR/layouts/whisker-quest.json" "$HOME_DIR/layouts/whisker-quest.png" "$HOME_DIR/themes/whisker-quest.json"
  rm -f "$HOME_DIR"/backgrounds/whisker-quest-*.png
}

case "$MODE" in
  --remove)
    if command -v herdr-app >/dev/null 2>&1; then herdr-app do layout.switch --name main >/dev/null 2>&1 || true; fi
    remove
    echo "Whisker Quest removed. (Your own layouts, mods and keys were not touched.)"
    exit 0 ;;
  --update) ;;
  install)
    taken=""
    for m in $MODS; do [ -e "$HOME_DIR/mods/$m" ] && taken="$taken mods/$m"; done
    for f in layouts/whisker-quest.json themes/whisker-quest.json; do [ -e "$HOME_DIR/$f" ] && taken="$taken $f"; done
    if [ -n "$taken" ]; then
      echo "Already there:$taken" >&2
      echo "Run ./install.sh --update to replace an earlier Whisker Quest install." >&2
      exit 1
    fi ;;
  *) echo "usage: ./install.sh [--update | --remove]" >&2; exit 2 ;;
esac

# Everything is copied into a staging folder first and checked; only then does it replace what's installed, so a
# failed copy (a missing file, a full disk) leaves the installed version working.
for f in layouts/whisker-quest.json themes/whisker-quest.json; do [ -f "$SRC/$f" ] || { echo "Missing $f in $SRC" >&2; exit 1; }; done
for m in $MODS; do [ -f "$SRC/mods/$m/main.js" ] || { echo "Missing mods/$m in $SRC" >&2; exit 1; }; done
STAGE=$(mktemp -d "$HOME_DIR/.whisker-quest-install.XXXXXX")
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/mods" "$STAGE/backgrounds"
for m in $MODS; do
  mkdir "$STAGE/mods/$m"
  (cd "$SRC/mods/$m" && find . -type f ! -name '*.test.mjs' | while read -r f; do
    mkdir -p "$STAGE/mods/$m/$(dirname "$f")"
    cp "$f" "$STAGE/mods/$m/$f"
  done)
done
cp "$SRC"/backgrounds/whisker-quest-*.png "$STAGE/backgrounds/"

[ "$MODE" = "--update" ] && remove
mkdir -p "$HOME_DIR/mods" "$HOME_DIR/layouts" "$HOME_DIR/themes" "$HOME_DIR/backgrounds"
for m in $MODS; do
  # mod.json first, so Herdr doesn't dock the mod into the layout you're looking at
  mkdir "$HOME_DIR/mods/$m"
  cp "$STAGE/mods/$m/mod.json" "$HOME_DIR/mods/$m/"
  rm "$STAGE/mods/$m/mod.json"
  (cd "$STAGE/mods/$m" && tar cf - .) | (cd "$HOME_DIR/mods/$m" && tar xf -)
done
cp "$STAGE"/backgrounds/whisker-quest-*.png "$HOME_DIR/backgrounds/"
cp "$SRC/themes/whisker-quest.json" "$HOME_DIR/themes/"
[ -f "$SRC/layouts/whisker-quest.png" ] && cp "$SRC/layouts/whisker-quest.png" "$HOME_DIR/layouts/"
cp "$SRC/layouts/whisker-quest.json" "$HOME_DIR/layouts/"

if command -v herdr-app >/dev/null 2>&1; then
  for m in $MODS; do herdr-app check "$HOME_DIR/mods/$m" >/dev/null 2>&1 || { echo "check failed: $m" >&2; herdr-app check "$HOME_DIR/mods/$m" >&2 || true; }; done
  herdr-app do layout.switch --name whisker-quest >/dev/null 2>&1 || true
  echo "Whisker Quest installed. Herdr loads new fonts when it starts: quit and reopen Herdr once to see the cats."
else
  echo "Whisker Quest installed into $HOME_DIR. Pick it in Herdr: Settings > Look > Layout (then restart Herdr once)."
fi
