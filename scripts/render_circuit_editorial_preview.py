#!/usr/bin/env python3
"""Render an offline, clearly unpublished bilingual circuit manuscript preview."""
import argparse
import html
import json
from pathlib import Path
from prepare_circuit_editorial_candidate import SOURCE, EVIDENCE, build_candidate

STYLE = """
:root{font-family:system-ui,-apple-system,sans-serif;color:#f2f0e8;background:#0d1015}
*{box-sizing:border-box}body{margin:0}.masthead{padding:4rem max(24px,calc((100vw - 1150px)/2));border-bottom:1px solid #353b40;background:#171c22}
.eyebrow{color:#d4a276;text-transform:uppercase;letter-spacing:.18em;font-weight:700;font-size:.75rem}
h1{font-size:clamp(2.2rem,5vw,4.5rem);line-height:1.05;font-weight:600;max-width:12ch;margin:.65rem 0 1rem}
.masthead p{color:#b7bbc3;max-width:65ch;line-height:1.6}
main{max-width:1150px;margin:auto;padding:2rem 24px 6rem}.note{border:1px solid #75604e;background:#262019;color:#eacbb5;padding:1rem 1.25rem;border-radius:4px;margin:1rem 0 3rem}
article{border-top:1px solid #47505a;padding:3rem 0}article h2{font-size:clamp(2rem,4vw,3.3rem);margin:.3rem 0 1.8rem}
.row{display:grid;grid-template-columns:1fr 1fr;gap:clamp(1rem,4vw,4rem)}section{min-width:0}section h3{color:#f6d2b1;font-size:1.25rem;margin:0 0 1rem}
section p{font-size:1.03rem;line-height:1.8;color:#d3d5d8;margin:0 0 1.2rem}
.events{font-size:.85rem;color:#a3adb8;margin-top:2rem}.events code{color:#d7a77d}small{color:#939ca7}
@media(max-width:750px){.row{grid-template-columns:1fr}.masthead{padding:3rem 24px}}
@media(prefers-reduced-motion:no-preference){article{animation:arrive .5s ease-out both}@keyframes arrive{from{opacity:.5;transform:translateY(10px)}to{opacity:1;transform:none}}}
"""


def render(candidate):
    if (candidate.get("stage"), candidate.get("publication_status"),
            candidate.get("approved_revision"), candidate.get("reviewed_by")) != (
            "draft", "unpublished", None, None):
        raise ValueError("Offline preview refuses non-draft or review-stamped content")
    esc = html.escape
    elements = []
    for circuit in candidate["circuits"]:
        languages = []
        for locale, label in (("uk", "Українська"), ("en", "English")):
            entry = circuit["locales"][locale]
            text = "".join(f"<p>{esc(paragraph)}</p>" for paragraph in entry["paragraphs"])
            languages.append(f'<section lang="{locale}"><h3>{esc(label)} · {esc(entry["title"])}</h3>{text}</section>')
        tags = " · ".join(f'{int(item["year"])}: <code>{esc(item["source_layout_id"])}</code>'
                          for item in circuit["events"])
        elements.append(f'<article><div class="eyebrow">Circuit / {esc(circuit["external_id"])}</div>'
                        f'<h2>{esc(circuit["name"])}</h2><div class="row">{"".join(languages)}</div>'
                        f'<p class="events">Pinned F1DB source layout references · {tags}</p></article>')
    return ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta name="robots" content="noindex,nofollow">'
            '<title>Grid Atlas · Editorial review only</title>'
            f'<style>{STYLE}</style></head><body>'
            '<header class="masthead"><div class="eyebrow">Grid Atlas / Editorial Research</div>'
            '<h1>Five circuits. Two languages.</h1><p>A reading preview for independent '
            'historical and linguistic review. This is not a public release.</p></header>'
            '<main><aside class="note"><strong>Draft · Unpublished.</strong> Historical claims '
            'and translations still require human approval; source layout IDs are F1DB '
            'observations, not surveyed circuit geometry. No photos are licensed or shown.</aside>'
            f'{"".join(elements)}<small>Offline review build. No network requests, no publication '
            'credentials or database changes.</small></main></body></html>')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    if args.output.resolve().is_relative_to(Path(__file__).resolve().parents[1]):
        parser.error("Preview output must remain outside the repository")
    candidate = build_candidate(SOURCE.read_text(encoding="utf-8"), EVIDENCE.read_text(encoding="utf-8"))
    args.output.write_text(render(candidate), encoding="utf-8")
    print(f"Unpublished preview written to {args.output}")


if __name__ == "__main__":
    main()
