BEGIN;
-- Nullable until the pinned result import is repeated. No inferred grid/pole
-- relationship, lap time or editorial approval is introduced by this migration.
ALTER TABLE historical_race_results
  ADD COLUMN pole_position BOOLEAN,
  ADD COLUMN fastest_lap BOOLEAN,
  ADD COLUMN flags_release_id BIGINT REFERENCES source_releases(id) ON DELETE RESTRICT,
  ADD COLUMN flags_source_locator TEXT,
  ADD COLUMN flags_content_hash TEXT,
  ADD CONSTRAINT race_result_flags_provenance CHECK (
    (pole_position IS NULL AND fastest_lap IS NULL AND flags_release_id IS NULL
      AND flags_source_locator IS NULL AND flags_content_hash IS NULL)
    OR (flags_release_id IS NOT NULL AND flags_source_locator IS NOT NULL
      AND length(btrim(flags_source_locator)) > 0 AND flags_content_hash IS NOT NULL
      AND flags_content_hash ~ '^[a-f0-9]{64}$')
  );
-- A later curated identity edit cannot retain a previous subject's source flags.
CREATE FUNCTION clear_race_result_flags_on_identity_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF ROW(NEW.race_id,NEW.position_display_order,NEW.driver_id,NEW.constructor_id)
    IS DISTINCT FROM ROW(OLD.race_id,OLD.position_display_order,OLD.driver_id,OLD.constructor_id) THEN
    NEW.pole_position := NULL;
    NEW.fastest_lap := NULL;
    NEW.flags_release_id := NULL;
    NEW.flags_source_locator := NULL;
    NEW.flags_content_hash := NULL;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER race_result_flags_identity_invalidation
BEFORE UPDATE OF race_id,position_display_order,driver_id,constructor_id
ON historical_race_results FOR EACH ROW
EXECUTE FUNCTION clear_race_result_flags_on_identity_change();
COMMIT;
