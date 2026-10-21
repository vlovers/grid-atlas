#!/usr/bin/env python3
"""Read-only five-driver release audit. This never signs, exports or publishes content."""
import argparse
import json
from pathlib import Path
import sys

if __package__ in (None, ''):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.editorial_dossiers import load_json, iso_date, read_drivers, require, keys
from scripts.editorial_review import validate_review

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/editorial/releases/v1/manifest.json'
PILOTS = {'ayrton-senna', 'alain-prost', 'michael-schumacher', 'lewis-hamilton', 'max-verstappen'}


def repository_path(value, root=ROOT):
    require(isinstance(value, str), 'manifest path: expected repository-relative string')
    path = (root / value).resolve()
    require(not Path(value).is_absolute() and path.is_relative_to(root / 'docs/editorial'),
            'manifest path: must remain within docs/editorial')
    return path


def audit_release(manifest, canonical_ids, root=ROOT):
    keys(manifest, 'schema_version release_id as_of status drivers', 'release')
    require(type(manifest['schema_version']) is int and manifest['schema_version'] == 1 and manifest['release_id'] == 'editorial-content-v1', 'release: unsupported schema or ID')
    require(manifest['status'] == 'research_only', 'release: must not imply publication')
    as_of = iso_date(manifest['as_of'])
    require(isinstance(manifest['drivers'], list) and len(manifest['drivers']) == 5, 'release: five pilots required')
    seen = set()
    reports = []
    paths = set()
    for entry in manifest['drivers']:
        keys(entry, 'driver_id locales', 'driver')
        slug = entry['driver_id']
        require(isinstance(slug, str) and slug in PILOTS and slug not in seen, 'release: unknown or duplicate pilot')
        seen.add(slug)
        require(isinstance(entry['locales'], dict) and set(entry['locales']) == {'uk', 'en'}, f'{slug}: both locales required')
        locale_claims = []
        for locale, refs in entry['locales'].items():
            keys(refs, 'dossier review attributed_interpretation_claims', f'{slug}.{locale}')
            dossier_path, review_path = (repository_path(refs[k], root) for k in ('dossier', 'review'))
            require(dossier_path not in paths and review_path not in paths, 'release: duplicate content/review path')
            paths.update([dossier_path, review_path])
            dossier, review = load_json(dossier_path), load_json(review_path)
            require(dossier['driver_id'] == slug and dossier['locale'] == locale, 'release: subject/locale mismatch')
            interpretation = {c['claim_id'] for c in dossier['claims'] if c['topic'] in ('driving_style', 'significance')}
            require(isinstance(refs['attributed_interpretation_claims'], list) and
                    set(refs['attributed_interpretation_claims']) == interpretation and
                    len(refs['attributed_interpretation_claims']) == len(interpretation),
                    'release: attributed interpretations must be explicit and exact')
            report = validate_review(dossier, review, canonical_ids, as_of)
            report.update(claims=len(dossier['claims']), sections=len(dossier['sections']),
                          sources=len(dossier['sources']), dossier=refs['dossier'], review=refs['review'])
            reports.append(report)
            locale_claims.append({c['claim_id'] for c in dossier['claims']})
        require(locale_claims[0] == locale_claims[1], f'{slug}: locale claim coverage differs')
    return {'release_id': manifest['release_id'], 'as_of': manifest['as_of'],
            'ready_locales': sum(r['ready_for_publication'] for r in reports),
            'public_content_written': False, 'profiles': reports}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    parser.add_argument('--require-ready', action='store_true')
    args = parser.parse_args()
    try:
        drivers, checksum = read_drivers(args.archive, args.checksums)
        report = audit_release(load_json(MANIFEST), {d[0] for d in drivers})
        report['archive_sha256'] = checksum
        print(json.dumps(report, ensure_ascii=False, indent=2))
        if args.require_ready and report['ready_locales'] != 10:
            parser.exit(1, 'Publication blocked: human approval/evidence work remains.\n')
    except (OSError, ValueError) as error:
        parser.exit(1, f'Editorial release audit failed: {error}\n')


if __name__ == '__main__':
    main()
