-- Read-only diagnostic query for the imported F1DB historical read model.
-- Execute in psql after applying migrations and importing the pinned release.
-- This is a source reconciliation aid, NOT an editorial verification or
-- a reconstruction of official championship scoring.
--
-- Usage: psql -X -v ON_ERROR_STOP=1 -f packages/database/scripts/senna-1988-reconciliation.sql
--
-- The current historical_race_results table contains finishing results and
-- points but NOT starting grid positions or pole-position records.
-- Do not infer pole counts from finishing order.

WITH target_drivers AS (
  SELECT d.id, d.display_name, ei.external_id
  FROM historical_drivers d
  JOIN external_identities ei ON ei.id = d.external_identity_id
  WHERE ei.entity_kind = 'driver'
    AND ei.external_id IN ('ayrton-senna', 'alain-prost')
),
race_rows AS (
  SELECT td.external_id, td.display_name, r.round, r.official_name,
         rr.position_number, rr.position_text, rr.points, rr.laps,
         rr.reason_retired, rr.shared_car,
         c.display_name AS constructor_name
  FROM target_drivers td
  JOIN historical_race_results rr ON rr.driver_id = td.id
  JOIN historical_races r ON r.id = rr.race_id
  JOIN historical_constructors c ON c.id = rr.constructor_id
  WHERE r.season_year = 1988
)
SELECT external_id, display_name, round, official_name, constructor_name,
       position_number, position_text, points, laps, reason_retired, shared_car
FROM race_rows
ORDER BY external_id, round;

WITH target_drivers AS (
  SELECT d.id, d.display_name, ei.external_id
  FROM historical_drivers d
  JOIN external_identities ei ON ei.id = d.external_identity_id
  WHERE ei.entity_kind = 'driver'
    AND ei.external_id IN ('ayrton-senna', 'alain-prost')
)
SELECT td.external_id, td.display_name,
       COUNT(DISTINCT r.id) AS recorded_race_rows,
       COUNT(*) FILTER (WHERE rr.position_number = 1) AS classified_first_rows,
       SUM(rr.points) AS summed_result_points,
       COUNT(*) FILTER (WHERE rr.points IS NULL) AS rows_without_points,
       COUNT(*) FILTER (WHERE rr.shared_car) AS shared_car_rows
FROM target_drivers td
LEFT JOIN historical_race_results rr ON rr.driver_id = td.id
LEFT JOIN historical_races r ON r.id = rr.race_id AND r.season_year = 1988
WHERE r.id IS NOT NULL
GROUP BY td.external_id, td.display_name
ORDER BY td.external_id;

-- Interpretation limitations:
-- 1. Verify that external IDs match the imported F1DB identities before
--    trusting the query. Zero rows may indicate an identity mismatch.
-- 2. SUM(points) is NOT the 1988 counted championship points (best 11
--    results) and must not be compared to 90/87 without scoring logic.
-- 3. position_number=1 is a provisional classification count, not
--    independent verification of official wins.
-- 4. There is no pole-position field in this schema.
