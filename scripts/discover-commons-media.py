#!/usr/bin/env python3
"""Fetch metadata for 1–4 explicitly chosen Commons files. Never downloads images."""
import argparse
import datetime as dt
from html.parser import HTMLParser
import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "GridAtlasMediaResearch/0.1 (https://github.com/vlovers/grid-atlas; metadata-only pilot)"


class PlainText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.links = []

    def handle_data(self, data):
        self.parts.append(data)

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.links.extend(value for name, value in attrs if name == "href" and value.startswith("https://"))


def selected_metadata(payload, inspected_on):
    if "error" in payload or "query" not in payload:
        raise ValueError("Commons returned an error or missing query")
    output = []
    for page in payload["query"]["pages"]:
        if page.get("missing") or not page.get("imageinfo") or not page.get("revisions"):
            raise ValueError(f"File metadata missing: {page.get('title')}")
        info = page["imageinfo"][0]
        metadata = info.get("extmetadata", {})
        fields = {}
        for field in ("Artist", "Credit", "LicenseShortName", "LicenseUrl", "UsageTerms", "Restrictions"):
            parser = PlainText()
            parser.feed(metadata.get(field, {}).get("value", ""))
            fields[field] = {"text": " ".join("".join(parser.parts).split()), "https_links": parser.links}
        output.append({
            "file_title": page["title"], "file_page_url": info["descriptionurl"],
            "page_revision": page["revisions"][0]["revid"], "file_sha1": info["sha1"],
            "file_timestamp": info["timestamp"], "mime": info["mime"],
            "width": info["width"], "height": info["height"], "metadata": fields,
            "inspected_on": inspected_on, "status": "candidate", "review": None,
        })
    return sorted(output, key=lambda item: item["file_title"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--title", action="append", required=True, help="Exact File: title; supply 1–4")
    parser.add_argument("--inspected-on", required=True, help="Explicit YYYY-MM-DD for the recorded inspection")
    args = parser.parse_args()
    if not 1 <= len(args.title) <= 4 or len(set(args.title)) != len(args.title) or any(
            not title.startswith("File:") or "|" in title or len(title) > 240 for title in args.title):
        parser.error("Provide 1–4 distinct exact File: titles; category traversal is unsupported")
    try:
        if dt.date.fromisoformat(args.inspected_on).isoformat() != args.inspected_on:
            raise ValueError("Inspection date must be YYYY-MM-DD")
        params = {"action": "query", "format": "json", "formatversion": "2",
                  "prop": "imageinfo|revisions", "titles": "|".join(args.title),
                  "iiprop": "url|size|mime|sha1|timestamp|extmetadata", "rvprop": "ids|timestamp",
                  "iiextmetadatalanguage": "en", "maxlag": "5"}
        request = Request(API + "?" + urlencode(params), headers={"User-Agent": USER_AGENT})
        with urlopen(request, timeout=20) as response:
            body = response.read(1_000_001)
        if len(body) > 1_000_000:
            raise ValueError("Metadata response exceeds pilot bound")
        records = selected_metadata(json.loads(body), args.inspected_on)
    except (OSError, ValueError, KeyError) as exc:
        parser.exit(1, f"Commons discovery failed: {exc}\n")
    print(json.dumps({"api": API, "user_agent": USER_AGENT, "candidates": records}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
