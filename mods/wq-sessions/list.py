"""Whisker Quest's session list: your Claude Code sessions on this Mac, newest first, as JSON.

    python3 list.py [limit]

Reads only local files, read-only: ~/.claude/projects/*/*.jsonl, and ~/.claude-<n>/projects for other logins
(the claude2, claude3 ... accounts, CLAUDE_CONFIG_DIR=~/.claude-2 ...). Nothing leaves the machine. A session's
title is its AI title or summary (else the first thing you asked, cut short), its folder the transcript's cwd.
What it learned is cached in ~/.cache/whisker-quest/sessions.json by file size and time, so later runs only read
files that changed. Prints [{id, account, cmd, title, cwd, branch, mtime}].
"""
import glob
import json
import os
import re
import sys

HOME = os.path.expanduser("~")
CACHE_DIR = os.path.join(HOME, ".cache", "whisker-quest")
CACHE = os.path.join(CACHE_DIR, "sessions.json")
HEAD = 256 * 1024     # bytes read from the start (cwd, first prompt)
TAIL = 512 * 1024     # bytes read from the end (the latest title)


def accounts():
    """(account name, its command, its projects folder)"""
    out = [("claude", "claude", os.path.join(HOME, ".claude", "projects"))]
    for d in sorted(glob.glob(os.path.join(HOME, ".claude-*"))):
        m = re.search(r"\.claude-(\d+)$", d)
        if m and os.path.isdir(os.path.join(d, "projects")):
            out.append((f"claude{m.group(1)}", f"claude{m.group(1)}", os.path.join(d, "projects")))
    return out


def lines(data):
    for raw in data.split(b"\n"):
        raw = raw.strip()
        if raw.startswith(b"{"):
            try:
                yield json.loads(raw)
            except ValueError:
                continue


def text_of(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text" and isinstance(part.get("text"), str):
                return part["text"]
    return ""


def clean(s, n=80):
    s = re.sub(r"<[^>]{1,40}>[^<]*</[^>]{1,40}>", " ", s or "")  # drop tagged system text (<command-name>...)
    s = re.sub(r"\s+", " ", s).strip()
    return s[:n - 1] + "…" if len(s) > n else s


def read(path):
    """{cwd, branch, title} from the start and the end of one transcript"""
    size = os.path.getsize(path)
    with open(path, "rb") as fh:
        head = fh.read(HEAD)
        tail = b""
        if size > HEAD:
            fh.seek(max(HEAD, size - TAIL))
            tail = fh.read()
    cwd = branch = first = title = None
    for d in lines(head):
        cwd = cwd or d.get("cwd")
        branch = branch or d.get("gitBranch")
        if first is None and d.get("type") == "user" and not d.get("isMeta") and not d.get("isSidechain"):
            t = clean(text_of((d.get("message") or {}).get("content")))
            if t and not t.startswith(("Caveat:", "[Request interrupted")):
                first = t
        if d.get("type") == "summary" and d.get("summary"):
            title = d["summary"]
        if d.get("type") == "ai-title" and d.get("aiTitle"):
            title = d["aiTitle"]
    for d in lines(tail):
        if d.get("type") == "summary" and d.get("summary"):
            title = d["summary"]
        if d.get("type") == "ai-title" and d.get("aiTitle"):
            title = d["aiTitle"]
        branch = d.get("gitBranch") or branch
    return {"cwd": cwd, "branch": branch, "title": clean(title or first or "", 80)}


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 400
    try:
        with open(CACHE, encoding="utf-8") as fh:
            cache = json.load(fh)
    except (OSError, ValueError):
        cache = {}
    found = []
    for name, cmd, root in accounts():
        for path in glob.glob(os.path.join(root, "*", "*.jsonl")):
            try:
                st = os.stat(path)
            except OSError:
                continue
            found.append((st.st_mtime, st.st_size, path, name, cmd))
    found.sort(reverse=True)
    out, fresh = [], {}
    for mtime, size, path, name, cmd in found[:limit]:
        key = f"{path}|{int(mtime)}|{size}"
        info = cache.get(key)
        if info is None:
            try:
                info = read(path)
            except OSError:
                continue
        fresh[key] = info
        if not info.get("title"):
            continue  # an empty session (opened, nothing asked)
        out.append({"id": os.path.splitext(os.path.basename(path))[0], "account": name, "cmd": cmd,
                    "title": info["title"], "cwd": info.get("cwd"), "branch": info.get("branch"),
                    "mtime": int(mtime * 1000)})
    try:
        os.makedirs(CACHE_DIR, exist_ok=True)
        tmp = CACHE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(fresh, fh)
        os.replace(tmp, CACHE)
    except OSError:
        pass
    print(json.dumps(out))


if __name__ == "__main__":
    main()
