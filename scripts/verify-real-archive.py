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
