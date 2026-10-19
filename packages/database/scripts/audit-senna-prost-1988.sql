-- Read-only 1988 driver results audit against imported F1DB historical rows.
-- Usage: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f packages/database/scripts/audit-senna-prost-1988.sql
-- Run only after the pinned F1DB release is imported into the target database.
-- Race wins are derived from position_number=1, not championship standing.
-- Does NOT establish pole positions, dropped-score totals, or championship points.
BEGIN READ ONLY;
WITH selected AS (
  SELECT d.id AS driver_id, d.display_name,
         e.external_id, s.slug AS source_slug
  FROM historical_drivers d
  JOIN external_identities e ON e.id = d.external_identity_id
  JOIN data_sources s ON s.id = e.source_id
  WHERE e.entity_kind = 'driver'
    AND e.external_id IN ('senna', 'prost')
),
per_race AS (
  SELECT d.display_name, d.external_id, d.source_slug,
         r.round, r.official_name, r.race_date,
         rr.position_number, rr.position_text, rr.points, rr.shared_car,
         c.display_name AS constructor
  FROM selected d
  JOIN historical_race_results rr ON rr.driver_id = d.driver_id
  JOIN historical_races r ON r.id = rr.race_id AND r.season_year = 1988
  JOIN historical_constructors c ON c.id = rr.constructor_id
)
SELECT source_slug, external_id, display_name, round, official_name,
       race_date, constructor, position_number, position_text,
       points, shared_car
FROM per_race
ORDER BY external_id, round;
WITH selected AS (
  SELECT d.id, e.external_id
  FROM historical_drivers d
  JOIN external_identities e ON e.id = d.external_identity_id
  WHERE e.entity_kind='driver' AND e.external_id IN ('senna','prost')
),
stats AS (
  SELECT s.external_id, COUNT(*) AS result_rows,
         COUNT(DISTINCT r.round) AS distinct_rounds,
         COUNT(*) FILTER (WHERE rr.position_number=1) AS position_one_rows,
         COALESCE(SUM(rr.points),0) AS sum_imported_race_points,
         COUNT(*) FILTER (WHERE rr.shared_car) AS shared_car_rows
  FROM selected s
  LEFT JOIN historical_race_results rr ON rr.driver_id=s.id
  LEFT JOIN historical_races r ON r.id=rr.race_id AND r.season_year=1988
  WHERE r.season_year=1988
  GROUP BY s.external_id
)
SELECT * FROM stats ORDER BY external_id;
ROLLBACK;
