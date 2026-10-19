import unittest
from scripts.editorial_career import build_career_observations


class CareerChronologyTests(unittest.TestCase):
    def test_groups_result_rows_by_year_and_constructor(self):
        results = [
            {"race_id": 1, "constructor_id": "mclaren", "position_number": 1},
            {"race_id": 2, "constructor_id": "mclaren", "position_number": None},
            {"race_id": 3, "constructor_id": "williams", "position_number": 2},
        ]
        rows = build_career_observations(results, {1: 1988, 2: 1988, 3: 1994},
                                         {"mclaren": "McLaren", "williams": "Williams"})
        self.assertEqual([(r["season_year"], r["race_result_rows"]) for r in rows], [(1988, 2), (1994, 1)])
        self.assertEqual(rows[0]["classified_first_rows"], 1)
        self.assertIn("not contract dates", rows[0]["semantics"])

    def test_duplicate_race_rows_fail_closed(self):
        duplicate = {"race_id": 1, "constructor_id": "mclaren", "position_number": 1}
        with self.assertRaisesRegex(ValueError, "Duplicate race-result"):
            build_career_observations([duplicate, duplicate], {1: 1988}, {"mclaren": "McLaren"})

    def test_unknown_race_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "Unknown F1DB race"):
            build_career_observations([{"race_id": 4, "constructor_id": "x", "position_number": 1}], {}, {"x": "X"})


if __name__ == "__main__":
    unittest.main()
