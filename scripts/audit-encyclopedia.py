#!/usr/bin/env python3
"""Exhaustive pinned F1DB -> imported DB -> public API/profile coverage.

Read-only. Failures include entity/path and expected/actual values. Optional web
checks inspect both locales for every canonical profile and all rendered archive
links. This verifies archive consistency, not independent historical truth.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import threading
from urllib.parse import urlparse, parse_qs
from urllib.error import HTTPError
from urllib.request import urlopen
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'packages/data-importer'))
from import_identity_details import read_details
from import_seasons import RELEASE


class ProfileHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.markers, self.links, self.canonical = set(), set(), None
        self.noindex = False
        self.in_script, self.rsc = False, []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script':
            self.in_script = True
        if attrs.get('data-testid'):
            self.markers.add(attrs['data-testid'])
        if tag == 'a' and attrs.get('href'):
            self.links.add(attrs['href'])
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')
        if tag == 'meta' and attrs.get('name') == 'robots':
            self.noindex |= 'noindex' in attrs.get('content', '')

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False

    def handle_data(self, data):
        if not self.in_script:
            return
        for part in data.split('self.__next_f.push(')[1:]:
            try:
                value, _ = json.JSONDecoder().raw_decode(part)
                if value[0] == 1 and isinstance(value[1], str):
                    self.rsc.append(value[1])
            except (ValueError, IndexError, TypeError):
                continue

    def streamed_markers(self):
        markers = set()
        def walk(value):
            if isinstance(value, dict):
                if isinstance(value.get('data-testid'), str):
                    markers.add(value['data-testid'])
                for item in value.values():
                    walk(item)
            elif isinstance(value, list):
                for item in value:
                    walk(item)
        # Missing-state UI may be an RSC fallback hydrated by Next, rather than
        # literal HTML. Parse element props, never arbitrary matching text.
        for line in ''.join(self.rsc).splitlines():
            try:
                walk(json.loads(line.split(':', 1)[1]))
            except (ValueError, IndexError):
                continue
        return markers


def audit(args):
    details, digest = read_details(args.archive, args.checksums)
    def sql(statement):
        return json.loads(subprocess.check_output(
            ['psql', os.environ['DATABASE_URL'], '-XAt', '-v', 'ON_ERROR_STOP=1', '-c', statement],
            text=True))
    tables = {'drivers': 'historical_drivers', 'constructors': 'historical_constructors',
              'circuits': 'historical_circuits', 'races': 'historical_races', 'entrants': 'historical_entrants'}
    db = {}
    for plural, table in tables.items():
        db[plural] = sql(f"""SELECT COALESCE(json_agg(t), '[]') FROM (
          SELECT h.id::text AS id, x.external_id, h.external_identity_id::text,
            s.slug AS source_slug FROM {table} h
          JOIN external_identities x ON x.id=h.external_identity_id
          JOIN data_sources s ON s.id=x.source_id WHERE s.slug='f1db'
        ) t""")
    seasons = sql('SELECT json_agg(year ORDER BY year) FROM historical_seasons')
    valid = {kind: {r['id'] for r in rows} for kind, rows in db.items()}
    valid['seasons'] = {str(y) for y in seasons}
    report = {'release': RELEASE, 'sha256': digest, 'entities': {}, 'rows': {},
              'api_requests': 0, 'web_profiles': 0, 'web_pages': 0, 'rendered_archive_links': 0, 'failures': []}
    lock = threading.Lock()
    def check(condition, context, expected=None, actual=None):
        if not condition:
            with lock:
                report['failures'].append({'context': context, 'expected': expected, 'actual': actual})
    def get(path):
        with lock:
            report['api_requests'] += 1
        with urlopen(args.api_url.rstrip('/') + path, timeout=30) as response:
            return json.load(response)['data']
    with zipfile.ZipFile(args.archive) as archive:
        def archive_rows(filename):
            return json.loads(archive.read(next(n for n in archive.namelist() if Path(n).name == filename)))
        for kind in tables:
            expected = {str(row['id']) for row in archive_rows(f'f1db-{kind}.json')}
            actual = {row['external_id'] for row in db[kind]}
            check(actual == expected, f'{kind}: identity set', sorted(expected - actual), sorted(actual - expected))
            report['rows'][kind] = len(db[kind])
        expected_seasons = sorted(row['year'] for row in archive_rows('f1db-seasons.json'))
        check(seasons == expected_seasons, 'season set', expected_seasons, seasons)
        result_rows = archive_rows('f1db-races-race-results.json')
        expected_results = len(result_rows)
        archive_races = {str(r['id']): r for r in archive_rows('f1db-races.json')}
    report['rows'].update(sql("""SELECT json_build_object('seasons', (SELECT count(*) FROM historical_seasons),
      'entrants', (SELECT count(*) FROM historical_entrants),
      'result_entries', (SELECT count(*) FROM historical_race_results))"""))
    check(report['rows']['result_entries'] == expected_results, 'result row count', expected_results, report['rows']['result_entries'])
    # Compare all imported result fields against the archive, rather than only
    # checking totals which could conceal a missing row and a spurious extra row.
    imported_results = sql("""SELECT json_agg(json_build_array(rx.external_id,
      rr.position_display_order,dx.external_id,cx.external_id,rr.position_number,
      rr.position_text,rr.driver_number,rr.laps,rr.points::text,rr.reason_retired,rr.shared_car))
      FROM historical_race_results rr JOIN historical_races r ON r.id=rr.race_id
      JOIN external_identities rx ON rx.id=r.external_identity_id
      JOIN historical_drivers d ON d.id=rr.driver_id JOIN external_identities dx ON dx.id=d.external_identity_id
      JOIN historical_constructors c ON c.id=rr.constructor_id JOIN external_identities cx ON cx.id=c.external_identity_id""")
    actual_results = {(r[0], r[1]): r for r in imported_results}
    check(len(actual_results) == expected_results, 'unique result identities', expected_results, len(actual_results))
    for r in result_rows:
        expected = [str(r['raceId']), r['positionDisplayOrder'], r['driverId'], r['constructorId'],
                    r.get('positionNumber'), r['positionText'], r['driverNumber'], r.get('laps'),
                    None if r.get('points') is None else Decimal(str(r['points'])), r.get('reasonRetired'), r['sharedCar']]
        actual = list(actual_results.get((expected[0], expected[1]), []))
        if actual and actual[8] is not None:
            actual[8] = Decimal(actual[8])
        check(actual == expected, f'result {expected[0]}/{expected[1]}: archive/DB fields', str(expected), str(actual))
    imported_races = sql("""SELECT json_agg(json_build_object('external_id',x.external_id,
      'year',r.season_year,'round',r.round,'date',r.race_date::text,'circuit',cx.external_id))
      FROM historical_races r JOIN external_identities x ON x.id=r.external_identity_id
      LEFT JOIN historical_circuits c ON c.id=r.circuit_id LEFT JOIN external_identities cx ON cx.id=c.external_identity_id""")
    for r in imported_races:
        expected = archive_races.get(r['external_id'], {})
        check([r['year'], r['round'], r['date'], r['circuit']] ==
              [expected.get('year'), expected.get('round'), expected.get('date'), expected.get('circuitId')],
              f"race {r['external_id']}: year/round/date/circuit", expected, r)
    report['archive_result_rows_compared'] = len(result_rows)
    report['archive_race_rows_compared'] = len(imported_races)
    stored_details = sql("""SELECT COALESCE(json_agg(t), '[]') FROM (
      SELECT x.entity_kind AS kind,x.external_id,d.fields,d.source_locator,o.content_hash,
        r.release_tag,r.sha256 FROM historical_identity_details d
      JOIN external_identities x ON x.id=d.external_identity_id
      JOIN data_sources s ON s.id=x.source_id AND s.slug='f1db'
      JOIN source_releases r ON r.id=d.release_id
      JOIN source_observations o ON o.release_id=r.id AND o.external_identity_id=x.id) t""")
    stored = {(r['kind'], r['external_id']): r for r in stored_details}
    expected_details = {(kind, key): (content_hash, locator, json.loads(fields))
                        for kind, key, content_hash, locator, fields in details}
    check(set(stored) == set(expected_details), 'identity detail coverage', len(expected_details), len(stored))
    for key, (content_hash, locator, fields) in expected_details.items():
        row = stored.get(key, {})
        check(row.get('fields') == fields and row.get('content_hash') == content_hash
              and row.get('source_locator') == locator and row.get('sha256') == digest
              and row.get('release_tag') == RELEASE, f'{key}: stored detail/provenance', fields, row)

    # Independently aggregate every result, including empty careers and shared cars.
    summaries = {}
    for kind, column in [('drivers', 'driver_id'), ('constructors', 'constructor_id')]:
        rows = sql(f"""SELECT json_agg(t) FROM (SELECT h.id::text AS id,
          count(rr.id)::int AS result_entries, count(DISTINCT rr.race_id)::int AS races,
          count(DISTINCT r.season_year)::int AS seasons, min(r.season_year) AS first_season,
          max(r.season_year) AS last_season,
          count(DISTINCT rr.race_id) FILTER (WHERE rr.position_number=1)::int AS winning_races,
          count(rr.id) FILTER (WHERE rr.position_number BETWEEN 1 AND 3)::int AS podium_result_entries,
          sum(rr.points)::text AS recorded_points, count(rr.points)::int AS points_recorded,
          count(rr.id) FILTER (WHERE rr.points IS NULL)::int AS points_missing
          FROM {tables[kind]} h LEFT JOIN historical_race_results rr ON rr.{column}=h.id
          LEFT JOIN historical_races r ON r.id=rr.race_id GROUP BY h.id) t""")
        summaries[kind] = {row.pop('id'): row for row in rows}
    circuits = sql("""SELECT json_agg(t) FROM (SELECT c.id::text AS id,
      count(r.id)::int AS races, min(r.season_year) AS first_season,max(r.season_year) AS last_season
      FROM historical_circuits c LEFT JOIN historical_races r ON r.circuit_id=c.id GROUP BY c.id) t""")
    summaries['circuits'] = {row.pop('id'): row for row in circuits}

    # Exhaust pagination, including the final empty page, instead of sampling IDs.
    for kind in ('drivers', 'constructors', 'circuits'):
        listed, offset = [], 0
        while True:
            page = get(f'/{kind}?limit=100&offset={offset}')
            listed.extend(row['id'] for row in page)
            if len(page) < 100:
                break
            offset += 100
            if offset > 100000:
                raise ValueError(f'{kind}: catalogue did not terminate')
        check(set(listed) == valid[kind] and len(listed) == len(set(listed)), f'{kind}: catalogue pagination', len(valid[kind]), len(listed))

    def profile(job):
        kind, row = job
        path = f"/{kind}/{row['id']}"
        try:
            [entity] = get(path)
            check(entity['external_id'] == row['external_id'] and bool(entity['name'].strip()), path + ': canonical identity', row['external_id'], entity.get('external_id'))
            [identity] = get(path + '/identity')
            key = (kind[:-1], row['external_id'])
            check(identity['fields'] == expected_details[key][2], path + ': API identity fields', expected_details[key][2], identity['fields'])
            check(identity['provenance'] is not None and identity['provenance']['sha256'] == digest, path + ': API provenance')
            if kind != 'circuits':
                [career] = get(path + '/career')
                check(career['summary'] == summaries[kind][row['id']], path + ': SQL/API summary', summaries[kind][row['id']], career['summary'])
                season_rows = get(path + '/seasons')
                check({s['year'] for s in season_rows} == {p['year'] for p in career['participation']}, path + ': season coverage')
                related_kind = 'constructors' if kind == 'drivers' else 'drivers'
                for participation in career['participation']:
                    check(participation['related_id'] in valid[related_kind], path + ': related link', related_kind, participation['related_id'])
                    for boundary in ('first_race', 'last_race'):
                        check(participation[boundary]['id'] in valid['races'], path + ': race boundary link', boundary, participation[boundary]['id'])
                for milestone in career['milestones'].values():
                    if milestone:
                        check(milestone['race']['id'] in valid['races'], path + ': milestone link')
                # All season-specific result/roster endpoints must be reachable.
                for season in season_rows:
                    suffix = 'results' if kind == 'drivers' else 'drivers'
                    evidence = get(f"{path}/seasons/{season['year']}/{suffix}")
                    if kind == 'drivers':
                        check(len(evidence) == season['starts'], f"{path}/{season['year']}: result coverage", season['starts'], len(evidence))
                        for item in evidence:
                            check(item['race_id'] in valid['races'] and item['constructor_id'] in valid['constructors'], path + ': season result links')
                    else:
                        expected_roster = {p['related_id'] for p in career['participation'] if p['year'] == season['year']}
                        check({d['driver_id'] for d in evidence} == expected_roster, f"{path}/{season['year']}: roster coverage")
            else:
                for field, value in summaries[kind][row['id']].items():
                    check(entity[field] == value, path + ': ' + field, value, entity[field])
                history = get(path + '/history')
                check(len(history) == entity['races'], path + ': history coverage', entity['races'], len(history))
                paged = []
                for offset in range(0, entity['races'] + 1, 100):
                    paged.extend(get(path + f'/races?limit=100&offset={offset}'))
                check([r['id'] for r in paged] == [r['race_id'] for r in history], path + ': race pagination')
                for race in history:
                    check(race['race_id'] in valid['races'], path + ': history race link')
                    for winner in race['winners']:
                        check(winner['driver_id'] in valid['drivers'] and winner['constructor_id'] in valid['constructors'], path + ': winner links')
            if args.web_url:
                marker = {'drivers': 'driver-showcase', 'constructors': 'constructor-archive-portrait', 'circuits': 'circuit-result-legends'}[kind]
                for locale in ('uk', 'en'):
                    web_path = '/' + locale + path
                    queue, visited = [web_path], set()
                    while queue:
                        current = queue.pop(0)
                        if current in visited:
                            continue
                        visited.add(current)
                        with urlopen(args.web_url.rstrip('/') + current, timeout=60) as response:
                            document = ProfileHTML()
                            document.feed(response.read().decode())
                        check(marker in document.markers and 'identity-facts' in document.markers, current + ': rendered profile markers')
                        canonical = urlparse(document.canonical or '')
                        check(not document.noindex and canonical.path == web_path and canonical.query == urlparse(current).query,
                              current + ': canonical/indexability')
                        for link in document.links:
                            target = urlparse(link)
                            match = re.fullmatch(r'/(uk|en)/(drivers|constructors|circuits|races|seasons)/([^/]+)', target.path)
                            if match:
                                check(match[3] in valid[match[2]], current + ': dead archive link', None, link)
                                with lock:
                                    report['rendered_archive_links'] += 1
                            if kind == 'circuits' and target.path == web_path and parse_qs(target.query).get('page'):
                                queue.append(target.path + '?' + target.query)
                        check(len(visited) <= 1001, current + ': circuit pagination terminated')
                        if len(visited) > 1001:
                            break
                        with lock:
                            report['web_pages'] += 1
                    with lock:
                        report['web_profiles'] += 1
        except Exception as error:
            check(False, path, 'Successful DB/API/web checks', str(error))

    jobs = [(kind, row) for kind in ('drivers', 'constructors', 'circuits') for row in db[kind]]
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        list(pool.map(profile, jobs))
    def race_api(row):
        path = f"/races/{row['id']}"
        try:
            [race] = get(path)
            expected = archive_races[row['external_id']]
            check(race['external_id'] == row['external_id'] and race['season_year'] == expected['year']
                  and race['round'] == expected['round'] and race['circuit_id'] in valid['circuits'], path + ': race API identity/links')
            results = get(path + '/results?limit=100')
            expected_rows = [r for (external_id, _), r in actual_results.items() if external_id == row['external_id']]
            check(len(results) == len(expected_rows), path + ': result API coverage', len(expected_rows), len(results))
            for result in results:
                check(result['driver_id'] in valid['drivers'] and result['constructor_id'] in valid['constructors'], path + ': result API links')
        except Exception as error:
            check(False, path, 'Successful race/result API checks', str(error))
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        list(pool.map(race_api, db['races']))
    for year in seasons:
        try:
            check(get(f'/seasons/{year}') == [{'year': year}], f'/seasons/{year}: API identity')
        except Exception as error:
            check(False, f'/seasons/{year}', 'Successful season API', str(error))
    if args.web_url:
        report['missing_state_responses'] = []
        for kind in ('drivers', 'constructors', 'circuits'):
            for locale in ('uk', 'en'):
                for identifier in ('not-a-valid-id', '01', '999999'):
                    path = f'/{locale}/{kind}/{identifier}'
                    request = args.web_url.rstrip('/') + path
                    try:
                        response = urlopen(request, timeout=30)
                    except HTTPError as error:
                        response = error
                    with response:
                        document = ProfileHTML()
                        document.feed(response.read().decode())
                        markers = document.markers | document.streamed_markers()
                        report['missing_state_responses'].append({'path': path, 'status': response.status,
                            'missing_in_html': 'missing-entity' in document.markers,
                            'missing_in_stream': 'missing-entity' in document.streamed_markers()})
                    check(response.status in (200, 404) and document.noindex
                          and 'missing-entity' in markers
                          and 'identity-facts' not in markers, path + ': missing UI payload and noindex',
                          'noindex and missing fallback without profile', {'noindex': document.noindex, 'markers': sorted(markers)})
    for kind in ('drivers', 'constructors', 'circuits'):
        report['entities'][kind] = {'checked': len(db[kind]), 'without_recorded_races': sum(s['races'] == 0 for s in summaries[kind].values())}
    report['identity_field_coverage'] = {
        kind: {field: sum(field in f for f in fields) for field in sorted({k for f in fields for k in f})}
        for kind in ('driver', 'constructor', 'circuit')
        for fields in [[r['fields'] for r in stored_details if r['kind'] == kind]]}
    report['passed'] = not report['failures']
    report['limits'] = ['Archive consistency, not independent historical verification',
                        'No official standings, year-specific technical measurements or image rights inferred',
                        'HTTP rendering for every profile; interactive browser journeys are a separate suite']
    Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'failures'}, indent=2))
    for failure in report['failures'][:20]:
        print(json.dumps(failure, ensure_ascii=False), file=sys.stderr)
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', required=True)
    parser.add_argument('--checksums', required=True)
    parser.add_argument('--api-url', default='http://127.0.0.1:3001/api')
    parser.add_argument('--web-url')
    parser.add_argument('--workers', type=int, choices=range(1, 9), default=4)
    parser.add_argument('--output', default='/tmp/encyclopedia-coverage.json')
    sys.exit(audit(parser.parse_args()))
