#!/usr/bin/env python3
"""Text extraction for cited PDF sources (FIA circuit maps, event notes, media kits).

Read-only and polite: honours robots.txt, identifies itself, spaces requests per host.
Extracted text is stored only in the git-ignored snapshot store, with explicit page markers
("[[page N]]") so evidence can cite a page. The committed status file records hashes, page
counts and outcome only; never document text or titles.

Outcomes: live_pdf_text (text extracted), live_pdf_image_only (no extractable text: a scanned
or vector-outline map whose labels are not text; nothing is inferred from the drawing),
pdf_unreadable, plus the HTTP outcomes used by scripts/source-fetch.mjs.

Requires pypdf (local tooling only): python3 -m venv .venv && .venv/bin/pip install pypdf==5.1.0
Usage: .venv/bin/python scripts/source-fetch-pdf.py [--only-outcome=live_pdf_no_text]
"""
import hashlib, io, json, sys, time, urllib.error, urllib.request, urllib.robotparser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
STATUS = ROOT / 'docs/editorial/circuit-evidence/source-status.json'
SNAPSHOTS = ROOT / '.grid-atlas/source-snapshots'
UA = 'GridAtlasSourceCheck/0.1 (+https://github.com/vlovers/grid-atlas; read-only citation check)'
SPACING = 2.0
MIN_TEXT = 40  # characters per document below which the PDF is treated as image-only

def sha256(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

_robots: dict = {}
def allowed(url: str) -> bool:
    origin = '{0.scheme}://{0.netloc}'.format(urlparse(url))
    if origin not in _robots:
        # Fetch robots.txt with our own user agent: RobotFileParser.read() uses urllib's default
        # agent, which some hosts (e.g. fia.com) refuse, and it then disallows everything.
        rp = urllib.robotparser.RobotFileParser(origin + '/robots.txt')
        try:
            req = urllib.request.Request(origin + '/robots.txt', headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=20) as resp:
                rp.parse(resp.read().decode('utf-8', 'replace').splitlines())
        except urllib.error.HTTPError as error:
            if 400 <= error.code < 500 and error.code != 429:
                rp.parse([])  # no robots.txt (4xx): no restrictions
            else:
                rp = None  # 5xx / 429: treat as disallow (RFC 9309)
        except Exception:
            rp = None  # unreachable: treat as disallow (RFC 9309)
        _robots[origin] = rp
    rp = _robots[origin]
    return bool(rp) and rp.can_fetch(UA, url)

_last: dict = {}
def fetch(url: str) -> bytes:
    host = urlparse(url).netloc
    wait = _last.get(host, 0) + SPACING - time.time()
    if wait > 0:
        time.sleep(wait)
    _last[host] = time.time()
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/pdf'})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()

def extract(data: bytes) -> tuple[str, int]:
    reader = PdfReader(io.BytesIO(data))
    pages = []
    for number, page in enumerate(reader.pages, start=1):
        text = ' '.join((page.extract_text() or '').split())
        pages.append(f'[[page {number}]]\n{text}')
    return '\n\n'.join(pages).strip(), len(reader.pages)

def main() -> None:
    only = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--only-outcome=')), 'live_pdf_no_text')
    status = json.loads(STATUS.read_text())
    SNAPSHOTS.mkdir(parents=True, exist_ok=True)
    todo = [row for row in status.values() if row.get('outcome') == only and (only == 'live_pdf_no_text' or '.pdf' in row['url'].lower())]
    tally: dict = {}
    for row in todo:
        url = row['url']
        out = {'url': url, 'source_id': row['source_id'], 'checked_at': datetime.now(timezone.utc).isoformat()}
        try:
            if not allowed(url):
                out['outcome'] = 'robots_disallowed'
            else:
                data = fetch(url)
                out['bytes_sha256'] = hashlib.sha256(data).hexdigest()
                out['bytes'] = len(data)
                try:
                    text, pages = extract(data)
                    out['pages'] = pages
                    body = text.replace('[[page', '').strip()
                    if len(''.join(ch for ch in body if ch.isalpha())) < MIN_TEXT:
                        out['outcome'] = 'live_pdf_image_only'
                    else:
                        digest = sha256(text)
                        (SNAPSHOTS / f'{digest}.txt').write_text(text, encoding='utf-8')
                        out.update(outcome='live_pdf_text', text_sha256=digest, text_chars=len(text))
                except Exception as error:  # malformed or encrypted PDF
                    out.update(outcome='pdf_unreadable', error=type(error).__name__)
        except Exception as error:
            code = getattr(error, 'code', None)
            out.update(outcome='access_denied' if code in (401, 403) else 'rate_limited' if code == 429 else 'gone' if code in (404, 410) else 'unreachable',
                       http_status=code, error=type(error).__name__)
        status[row['source_id']] = out
        tally[out['outcome']] = tally.get(out['outcome'], 0) + 1
        print(f"{out['outcome']:<22} {url[:100]}", flush=True)
    STATUS.write_text(json.dumps(dict(sorted(status.items())), indent=1, ensure_ascii=False) + '\n')
    print(json.dumps({'processed': len(todo), 'tally': tally}))

if __name__ == '__main__':
    main()
