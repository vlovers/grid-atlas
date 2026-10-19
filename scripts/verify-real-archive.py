#!/usr/bin/env python3
"""Real pinned-archive smoke: SQL and HTTP must agree on an observed result pair.

Uses a disposable CI PostgreSQL database. It is NOT a verification of historical
truth, official starts, biographical assertions or legal team succession.
"""
import json
import os
import subprocess
import sys
import time
from urllib.error import URLError
from urllib.request import urlopen

BASE = os.getenv("SMOKE_API_URL", "http://127.0.0.1:3001/api")
DB = os.environ["DATABASE_URL"]

def sql(statement):
    value = subprocess.check_output(
        ["psql", DB, "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", statement],
        text=True, stderr=subprocess.PIPE,
    ).strip()
    return value

def get(path):
    with urlopen(BASE + path, timeout=12) as response:
        assert response.status == 200, (path, response.status)
        return json.load(response)["data"]

def main():
    counts = sql("""SELECT CONCAT_WS('|',
      (SELECT count(*) FROM historical_seasons),
      (SELECT count(*) FROM historical_drivers),
      (SELECT count(*) FROM historical_constructors),
      (SELECT count(*) FROM historical_entrants),
      (SELECT count(*) FROM historical_circuits),
      (SELECT count(*) FROM historical_races),
      (SELECT count(*) FROM historical_race_results))""")
    expected = "77|917|187|830|78|1172|27665"
    assert counts == expected, f"Unexpected pinned-release counts: {counts} != {expected}"

    # Derive one verified-in-DB example, never assume local auto-increment IDs
    # or hard-code a real person's name/affiliation.
    pair = sql("""SELECT CONCAT_WS('|', r.season_year, rr.driver_id, rr.constructor_id,
       COUNT(*), COUNT(DISTINCT rr.race_id),
       COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number=1))
      FROM historical_race_results rr JOIN historical_races r ON r.id=rr.race_id
      GROUP BY r.season_year, rr.driver_id, rr.constructor_id
      ORDER BY r.season_year, rr.driver_id, rr.constructor_id LIMIT 1""")
    year, driver, constructor, entries, races, wins = pair.split("|")
    expected_edge = dict(result_entries=int(entries), races=int(races), winning_races=int(wins))
    for attempt in range(40):
        try:
            with urlopen(BASE + "/health", timeout=12) as response:
                assert response.status == 200
            break
        except (OSError, URLError):
            if attempt == 39:
                raise
            time.sleep(0.5)

    driver_graph = get(f"/explorer/drivers/{driver}/connections?year={year}")
    assert driver_graph["focus"] == f"driver:{driver}"
    assert driver_graph["year"] == int(year)
    driver_edge = next(edge for edge in driver_graph["edges"]
                       if edge["to"] == f"constructor:{constructor}")
    assert all(driver_edge[k] == v for k, v in expected_edge.items()), driver_edge

    constructor_graph = get(f"/explorer/constructors/{constructor}/connections?year={year}")
    assert constructor_graph["focus"] == f"constructor:{constructor}"
    constructor_edge = next(edge for edge in constructor_graph["edges"]
                            if edge["to"] == f"driver:{driver}")
    assert all(constructor_edge[k] == v for k, v in expected_edge.items()), constructor_edge

    evidence = get(f"/explorer/drivers/{driver}/constructors/{constructor}/races?year={year}")
    assert evidence["year"] == int(year)
    assert evidence["driver"]["id"] == driver
    assert evidence["constructor"]["id"] == constructor
    assert len(evidence["races"]) == int(races), evidence
    assert sum(item["result_entries"] for item in evidence["races"]) == int(entries)
    assert sum(item["winning_result_entries"] for item in evidence["races"]) >= int(wins)
    assert evidence["provenance"] == "imported-main-race-results"
    # Verify distinct eras and a multi-result-row historical pair, not only
    # the first selected 1950 association. All samples are derived from the
    # pinned import. They do not assert the historical truth of F1DB records.
    samples = [
        ("early", 1950, 1979),
        ("middle", 1980, 2009),
        ("modern", 2010, 2026),
    ]
    for label, start, end in samples:
        sample = sql(f"""SELECT CONCAT_WS('|', r.season_year, rr.driver_id,
          rr.constructor_id, COUNT(*), COUNT(DISTINCT rr.race_id),
          COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number = 1))
          FROM historical_race_results rr JOIN historical_races r ON r.id = rr.race_id
          WHERE r.season_year BETWEEN {start} AND {end}
          GROUP BY r.season_year, rr.driver_id, rr.constructor_id
          ORDER BY r.season_year, MIN(r.round), rr.driver_id, rr.constructor_id
          LIMIT 1""")
        assert sample, f"Missing real result sample for {label}"
        sample_year, sample_driver, sample_constructor, nrows, nraces, nwins = sample.split("|")
        expected_sample = dict(result_entries=int(nrows), races=int(nraces),
                               winning_races=int(nwins))
        dgraph = get(f"/explorer/drivers/{sample_driver}/connections?year={sample_year}")
        cgraph = get(f"/explorer/constructors/{sample_constructor}/connections?year={sample_year}")
        match_d = next((e for e in dgraph["edges"]
                        if e["to"] == f"constructor:{sample_constructor}"), None)
        match_c = next((e for e in cgraph["edges"]
                        if e["to"] == f"driver:{sample_driver}"), None)
        assert match_d and match_c, (label, "Missing reciprocal edge")
        for metric, expected_value in expected_sample.items():
            assert match_d[metric] == match_c[metric] == expected_value, (
                label, metric, expected_value, match_d, match_c)
        rows = get(f"/explorer/drivers/{sample_driver}/constructors/{sample_constructor}/races?year={sample_year}")
        assert not rows["truncated"], (label, "Race evidence unexpectedly truncated")
        assert len(rows["races"]) == int(nraces), (label, rows)
        assert sum(r["result_entries"] for r in rows["races"]) == int(nrows), label
        print(f"PASS {label} SQL/API evidence:", sample)

    repeated = sql("""SELECT CONCAT_WS('|', r.season_year, rr.driver_id,
      rr.constructor_id, COUNT(*), COUNT(DISTINCT rr.race_id))
      FROM historical_race_results rr JOIN historical_races r ON r.id = rr.race_id
      GROUP BY r.season_year, rr.driver_id, rr.constructor_id
      HAVING COUNT(*) > COUNT(DISTINCT rr.race_id)
      ORDER BY r.season_year, MIN(r.round), rr.driver_id, rr.constructor_id
      LIMIT 1""")
    assert repeated, "Pinned dataset has no repeated result-row pair"
    repeated_year, repeated_driver, repeated_constructor, repeated_rows, repeated_races = repeated.split("|")
    repeated_data = get(f"/explorer/drivers/{repeated_driver}/constructors/{repeated_constructor}/races?year={repeated_year}")
    assert not repeated_data["truncated"]
    assert len(repeated_data["races"]) == int(repeated_races)
    assert sum(r["result_entries"] for r in repeated_data["races"]) == int(repeated_rows)
    assert int(repeated_rows) > int(repeated_races)
    print("PASS shared/repeated result rows counted as distinct races:", repeated)

    # The supported future calendar bound is not proof of a future season:
    # observed edges must be empty, not back-filled or invented.
    empty = get(f"/explorer/drivers/{driver}/connections?year=2200")
    assert empty["focus"] == f"driver:{driver}" and empty["edges"] == []
    assert len(empty["nodes"]) == 1
    print("PASS no-data season: empty edge list (not inferred participation)")

    print("PASS pinned release counts:", counts)
    print("PASS reciprocal real-archive graph + race evidence SQL parity:",
          {"year": year, "driver_id": driver, "constructor_id": constructor, **expected_edge})
    print("LIMIT: database consistency tested; independent historical provenance not validated")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Real archive smoke FAILED: {error}", file=sys.stderr)
        raise
