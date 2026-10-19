"""Build source-attributed career season/constructor observations from F1DB race results.

This is not an authoritative team-contract timeline: it only reports recorded race-result rows.
"""
from collections import defaultdict


def build_career_observations(results, races_by_id, constructor_names):
    grouped = defaultdict(lambda: {"race_result_rows": 0, "classified_first_rows": 0})
    for row in results:
        race_id = row["race_id"]
        if race_id not in races_by_id:
            raise ValueError(f"Unknown F1DB race ID {race_id}")
        constructor_id = row["constructor_id"]
        if constructor_id not in constructor_names:
            raise ValueError(f"Unknown F1DB constructor ID {constructor_id}")
        year = races_by_id[race_id]
        key = (year, constructor_id)
        grouped[key]["race_result_rows"] += 1
        grouped[key]["classified_first_rows"] += row["position_number"] == 1
    return [
        {"season_year": year, "constructor_id": constructor,
         "constructor_source_name": constructor_names[constructor],
         **grouped[(year, constructor)],
         "semantics": "race-result rows, not contract dates or championship classification"}
        for year, constructor in sorted(grouped)
    ]
