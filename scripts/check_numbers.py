#!/usr/bin/env python3
"""Every figure on the page must exist in the agent repository's README or eval/CHANGELOG.

The site has no measurement of its own. Run before every commit; exit 1 lists the figures
that the agent repo does not carry. The agent repo is `../Personal_Agent` unless
NOESIS_AGENT_DIR says otherwise.
"""
import html
import os
import re
import sys
from pathlib import Path

FIGURE = re.compile(r"\d+/\d+|\d+(?:\.\d+)?\s?%|\d{1,3}(?:,\d{3})+|\d+\s*(?:x|×)\s*\d+")

# Facts about the page itself, not claims about the agent: the sphere's point counts and
# the loader's starting percentage.
ALLOW = {"14,000", "7,000", "0%"}


def normalise(text: str) -> str:
    return re.sub(r"\s+", "", text).replace("×", "x")


def figures(page_text: str) -> list[str]:
    text = html.unescape(re.sub(r"<[^>]+>", " ", page_text))
    return sorted({normalise(m.group(0)) for m in FIGURE.finditer(text)})


def unmatched(page_text: str, sources: list[str]) -> list[str]:
    corpus = normalise("\n".join(sources))
    return [f for f in figures(page_text) if f not in ALLOW and f not in corpus]


def main() -> int:
    site = Path(__file__).resolve().parents[1]
    agent = Path(os.environ.get("NOESIS_AGENT_DIR", site.parent / "Personal_Agent"))
    sources = [(agent / p).read_text(encoding="utf-8") for p in ("README.md", "eval/CHANGELOG.md")]
    missing = unmatched((site / "index.html").read_text(encoding="utf-8"), sources)
    for figure in missing:
        print(f"not in the agent repo: {figure}")
    print(f"{len(missing)} unmatched figure(s)")
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
