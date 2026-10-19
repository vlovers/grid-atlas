#!/usr/bin/env python3
"""Choose stable high-degree and long-name cases from the actual imported archive."""
import os
import subprocess

def one(query):
    return subprocess.check_output(
        ["psql", os.environ["DATABASE_URL"], "-X", "-A", "-t",
         "-v", "ON_ERROR_STOP=1", "-c", query],
        text=True,
    ).strip().split("|")

busy = one("""SELECT concat_ws('|', r.season_year, rr.constructor_id,
 count(DISTINCT rr.driver_id))
 FROM historical_race_results rr
 JOIN historical_races r ON r.id=rr.race_id
 GROUP BY r.season_year, rr.constructor_id
 ORDER BY count(DISTINCT rr.driver_id) DESC, r.season_year, rr.constructor_id
 LIMIT 1""")
longest = one("""SELECT concat_ws('|', r.season_year, rr.driver_id, rr.constructor_id)
 FROM historical_race_results rr
 JOIN historical_races r ON r.id=rr.race_id
 JOIN historical_drivers d ON d.id=rr.driver_id
 GROUP BY r.season_year, rr.driver_id, rr.constructor_id, d.display_name
 ORDER BY length(d.display_name) DESC, r.season_year, rr.driver_id, rr.constructor_id
 LIMIT 1""")
assert len(busy) == 3 and len(longest) == 3
assert all(v.isdigit() and int(v) > 0 for v in busy + longest)
fields = {
    "SMOKE_BUSY_YEAR": busy[0],
    "SMOKE_BUSY_CONSTRUCTOR": busy[1],
    "SMOKE_BUSY_DEGREE": busy[2],
    "SMOKE_LONG_YEAR": longest[0],
    "SMOKE_LONG_DRIVER": longest[1],
    "SMOKE_LONG_CONSTRUCTOR": longest[2],
}
with open(os.environ["GITHUB_ENV"], "a", encoding="utf-8") as output:
    for name, value in fields.items():
        output.write(f"{name}={value}\n")
print("Real F1DB stress samples:", fields)
