#!/usr/bin/env python3
"""Read-only audit of tracked Markdown file links. Run from any directory."""
import argparse
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"!?\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)")
REFERENCE = re.compile(r"^\s*\[[^]]+\]:\s*(<[^>]+>|\S+)", re.MULTILINE)


def targets(text):
    clean = []
    fence = None
    for line in text.splitlines():
        marker = re.match(r"^\s*(" + chr(96) + r"{3,}|~{3,})", line)
        if marker:
            token = marker.group(1)
            if fence is None:
                fence = (token[0], len(token))
            elif token[0] == fence[0] and len(token) >= fence[1]:
                fence = None
            clean.append("")
        else:
            clean.append("" if fence else line)
    source = "\n".join(clean)
    for match in sorted(
        [*LINK.finditer(source), *REFERENCE.finditer(source)],
        key=lambda item: item.start()
    ):
        yield source.count("\n", 0, match.start()) + 1, match.group(1).strip("<>")


def tracked_paths():
    raw = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT)
    return {p.decode("utf-8") for p in raw.split(b"\0") if p}


def audit():
    tracked = tracked_paths()
    failures = []
    for file in sorted(p for p in tracked if p.endswith(".md") and (p.startswith("docs/") or p == "README.md")):
        for line, target in targets((ROOT / file).read_text(encoding="utf-8")):
            if not target or target.startswith(("#", "//", "{")):
                continue
            url = urlsplit(target)
            if url.scheme or not url.path or url.path.startswith("/"):
                continue
            resolved = (ROOT / file).parent.joinpath(unquote(url.path)).resolve()
            try:
                relative = resolved.relative_to(ROOT).as_posix()
            except ValueError:
                failures.append({"file": file, "line": line, "target": target, "reason": "outside repository"})
                continue
            if relative not in tracked and not any(p.startswith(relative.rstrip("/") + "/") for p in tracked):
                failures.append({"file": file, "line": line, "target": target, "reason": "missing tracked path"})
    return failures


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    failures = audit()
    if args.json:
        print(json.dumps({"broken": len(failures), "findings": failures}, indent=2))
    else:
        for item in failures:
            print(f"{item['file']}:{item['line']}: {item['reason']}: {item['target']}")
        print(f"Documentation audit: {len(failures)} unresolved local link(s)")
    return int(bool(failures))


if __name__ == "__main__":
    raise SystemExit(main())
