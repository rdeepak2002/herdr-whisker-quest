"""Which account a hand-started agent runs on (macOS / Linux).

    python3 who.py <terminal address>

Herdr only knows a terminal's shell argv, so an agent typed into the shell ("claude", "claude2", "codex")
leaves the pane header without an account. This finds the shell's claude / codex child process and reads, with
`ps` (your own processes only, nothing leaves the machine), its command line and the variable that picks the
account: CLAUDE_CONFIG_DIR (claude2 = ~/.claude-2) or CODEX_HOME (codexN = ~/.local/share/codex-accounts/codexN).
Prints {"account", "agent", "model", "pid"} as JSON, or {"error"} with exit code 1.
"""

import json
import os
import re
import subprocess
import sys

AGENTS = ("claude", "codex")
WRAPPERS = ("sh", "bash", "zsh", "fish", "dash", "node", "bun", "env", "login", "python", "python3")


def processes():
    """{pid: (parent pid, program name)} for every process of this user now."""
    r = subprocess.run(["ps", "-axo", "pid=,ppid=,comm="], capture_output=True, text=True)
    out = {}
    for line in r.stdout.splitlines():
        parts = line.strip().split(None, 2)
        if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit():
            out[int(parts[0])] = (int(parts[1]), os.path.basename(parts[2]).lstrip("-").lower())
    return out


def args_of(pid):
    r = subprocess.run(["ps", "-o", "args=", "-p", str(pid)], capture_output=True, text=True)
    return r.stdout.strip()


def env_of(pid):
    """The process's environment, from `ps eww` (macOS appends it to the command line; Linux: /proc)."""
    try:
        with open(f"/proc/{pid}/environ", "rb") as f:
            return dict(item.split("=", 1) for item in f.read().decode("utf-8", "replace").split("\0") if "=" in item)
    except OSError:
        pass
    r = subprocess.run(["ps", "eww", "-o", "command=", "-p", str(pid)], capture_output=True, text=True)
    env = {}
    for key in ("CLAUDE_CONFIG_DIR", "CODEX_HOME"):
        m = re.search(r"(?:^|\s)" + key + r"=(.*?)(?=\s[A-Za-z_][A-Za-z0-9_]*=|$)", r.stdout.strip())
        if m:
            env[key] = m.group(1).strip()
    return env


def agent_name(name, args):
    """claude / codex when this process is one (a native binary, or node running the CLI), else None."""
    if name in AGENTS:
        return name
    if name in ("node", "bun"):
        for a in args.split()[1:3]:
            base = os.path.basename(a)
            for ag in AGENTS:
                if base == ag or f"/{ag}" in a and ("cli" in base or base == ag):
                    return ag
    return None


def norm(path):
    return os.path.normpath(os.path.expanduser(os.path.expandvars(path))) if path else ""


def account_for(agent, env, home):
    """The account name from the variable that picked it, else None."""
    if agent == "claude":
        cfg = norm(env.get("CLAUDE_CONFIG_DIR", ""))
        if not cfg or cfg == norm(os.path.join(home, ".claude")):
            return "claude"
        m = re.search(r"\.claude-(\d+)$", cfg)
        return f"claude{m.group(1)}" if m else os.path.basename(cfg).lstrip(".") or None
    cdx = norm(env.get("CODEX_HOME", ""))
    if not cdx or cdx == norm(os.path.join(home, ".codex")):
        return "codex"
    m = re.search(r"codex-accounts/(codex\d*)$", cdx)
    return m.group(1) if m else None


def model_flag(cmd):
    words = [w.strip("'\"") for w in re.findall(r"'[^']*'|\"[^\"]*\"|\S+", cmd)]
    for i, w in enumerate(words[:-1]):
        if w in ("--model", "-m"):
            return words[i + 1]
        if w.startswith("--model="):
            return w.split("=", 1)[1]
    return None


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "usage: who.py <terminal>"}))
        return 1
    home = os.path.expanduser("~")
    r = subprocess.run(["hc", "get", sys.argv[1], "--json"], capture_output=True, text=True)
    try:
        shell = int(json.loads(r.stdout)["pid"])
    except Exception:
        print(json.dumps({"error": f"no pid for {sys.argv[1]}"}))
        return 1

    procs = processes()
    kids = {}
    for pid, (ppid, _name) in procs.items():
        kids.setdefault(ppid, []).append(pid)
    # Breadth first under the shell: the nearest claude / codex (wrapper scripts and node in between).
    queue, seen, found = [(shell, 0)], set(), None
    while queue and not found:
        pid, depth = queue.pop(0)
        for c in sorted(kids.get(pid, [])):
            if c in seen:
                continue
            seen.add(c)
            name = procs[c][1]
            ag = agent_name(name, args_of(c) if name in ("node", "bun") else "")
            if ag:
                found = (c, ag)
                break
            if depth < 3 and name in WRAPPERS:
                queue.append((c, depth + 1))
    if not found:
        print(json.dumps({"error": "no claude / codex under this shell"}))
        return 1

    pid, agent = found
    cmd = args_of(pid)
    account = account_for(agent, env_of(pid), home)
    if not account:
        print(json.dumps({"error": "unknown account folder", "agent": agent, "pid": pid}))
        return 1
    print(json.dumps({"account": account, "agent": agent, "model": model_flag(cmd), "pid": pid}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
