import { BadRequestException, NotFoundException, Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';

function integer(value: string | undefined, fallback: number, min: number, max: number, label: string): number {
  if (value === undefined) return fallback;
  if (!/^(0|[1-9][0-9]*)$/.test(value)) throw new BadRequestException(label + ' must be an integer');
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new BadRequestException(label + ' out of bounds');
  return n;
}

function searchTerm(value: string | undefined): string {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.length > 100) throw new BadRequestException('q must be a string of at most 100 characters');
  return value.trim();
}

@Controller()
export class HistoricalController {
  constructor(@Inject(DB) private readonly db: Pool) {}

  @Get('health')
  health() { return { status: 'ok' }; }

  @Get('sources')
  async sources() {
    const { rows } = await this.db.query(`SELECT s.slug, s.homepage_url, s.attribution,
      r.release_tag, r.artifact_name, r.sha256 FROM source_releases r
      JOIN data_sources s ON s.id = r.source_id ORDER BY s.slug, r.created_at DESC, r.id DESC`);
    return { data: rows };
  }

  @Get('seasons')
  async seasons() {
    const { rows } = await this.db.query('SELECT year FROM historical_seasons ORDER BY year DESC');
    return { data: rows };
  }

  @Get('seasons/:year')
  async season(@Param('year') year: string) {
    const y = integer(year, 1950, 1950, 2200, 'year');
    const { rows } = await this.db.query('SELECT year FROM historical_seasons WHERE year = $1', [y]);
    if (!rows.length) throw new NotFoundException('Season not found');
    return { data: rows };
  }

  @Get('seasons/:year/races')
  async races(@Param('year') year: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const y = integer(year, 1950, 1950, 2200, 'year');
    const l = integer(limit, 50, 1, 100, 'limit');
    const o = integer(offset, 0, 0, 100000, 'offset');
    const { rows } = await this.db.query(`SELECT r.id::text AS id, r.round, r.race_date::text, r.official_name,
      c.id::text AS circuit_id, c.display_name AS circuit_name FROM historical_races r
      LEFT JOIN historical_circuits c ON c.id = r.circuit_id
      WHERE r.season_year = $1 ORDER BY r.round LIMIT $2 OFFSET $3`, [y, l, o]);
    return { data: rows, limit: l, offset: o };
  }

  @Get('seasons/:year/lineups')
  async seasonLineups(@Param('year') year: string) {
    const y = integer(year, 1950, 1950, 2200, 'year');
    const { rows } = await this.db.query(`SELECT c.id::text AS constructor_id, c.display_name AS constructor_name,
      d.id::text AS driver_id, d.display_name AS driver_name,
      COUNT(DISTINCT rr.race_id)::int AS races,
      COUNT(*) FILTER (WHERE rr.position_number = 1)::int AS wins
      FROM historical_race_results rr
      JOIN historical_races r ON r.id = rr.race_id
      JOIN historical_constructors c ON c.id = rr.constructor_id
      JOIN historical_drivers d ON d.id = rr.driver_id
      WHERE r.season_year = $1
      GROUP BY c.id, c.display_name, d.id, d.display_name
      ORDER BY c.display_name, d.display_name`, [y]);
    return { data: rows };
  }

  @Get('drivers')
  async drivers(@Query('limit') limit?: string, @Query('offset') offset?: string, @Query('q') query?: string) {
    const l = integer(limit, 50, 1, 100, 'limit');
    const o = integer(offset, 0, 0, 100000, 'offset');
    const q = searchTerm(query);
    const { rows } = await this.db.query(`SELECT d.id::text AS id, d.display_name AS name, e.external_id
      FROM historical_drivers d JOIN external_identities e ON e.id = d.external_identity_id
      WHERE strpos(lower(d.display_name), lower($3)) > 0 OR strpos(lower(e.external_id), lower($3)) > 0
      ORDER BY d.display_name, d.id LIMIT $1 OFFSET $2`, [l, o, q]);
    return { data: rows, limit: l, offset: o };
  }

  @Get('drivers/:id')
  async driverProfile(@Param('id') id: string) {
    const driverId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT d.id::text AS id, d.display_name AS name, e.external_id,
      COUNT(rr.id)::int AS starts,
      COUNT(DISTINCT r.season_year)::int AS seasons,
      MIN(r.season_year) AS first_season,
      MAX(r.season_year) AS last_season,
      COUNT(*) FILTER (WHERE rr.position_number = 1)::int AS wins,
      COUNT(*) FILTER (WHERE rr.position_number BETWEEN 1 AND 3)::int AS podiums,
      SUM(rr.points)::text AS points,
      COUNT(rr.id) FILTER (WHERE rr.points IS NULL)::int AS points_missing
      FROM historical_drivers d
      JOIN external_identities e ON e.id = d.external_identity_id
      LEFT JOIN historical_race_results rr ON rr.driver_id = d.id
      LEFT JOIN historical_races r ON r.id = rr.race_id
      WHERE d.id = $1
      GROUP BY d.id, d.display_name, e.external_id`, [driverId]);
    if (!rows.length) throw new NotFoundException('Driver not found');
    return { data: rows };
  }

  @Get('drivers/:id/seasons')
  async driverSeasons(@Param('id') id: string) {
    const driverId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT r.season_year AS year,
      COUNT(rr.id)::int AS starts,
      COUNT(*) FILTER (WHERE rr.position_number = 1)::int AS wins,
      COUNT(*) FILTER (WHERE rr.position_number BETWEEN 1 AND 3)::int AS podiums,
      SUM(rr.points)::text AS points,
      COUNT(rr.id) FILTER (WHERE rr.points IS NULL)::int AS points_missing
      FROM historical_race_results rr
      JOIN historical_races r ON r.id = rr.race_id
      WHERE rr.driver_id = $1
      GROUP BY r.season_year ORDER BY r.season_year DESC`, [driverId]);
    return { data: rows };
  }

  @Get('drivers/:id/seasons/:year/results')
  async driverSeasonResults(@Param('id') id: string, @Param('year') year: string) {
    const driverId = integer(id, 0, 1, 2147483647, 'id');
    const seasonYear = integer(year, 1950, 1950, 2200, 'year');
    const { rows } = await this.db.query(`SELECT r.id::text AS race_id, r.round,
      r.race_date::text AS race_date, r.official_name AS race_name,
      c.id::text AS constructor_id, c.display_name AS constructor_name,
      rr.position_display_order, rr.position_number, rr.position_text,
      rr.points::text AS points, rr.driver_number, rr.laps, rr.reason_retired, rr.shared_car
      FROM historical_race_results rr
      JOIN historical_races r ON r.id = rr.race_id
      JOIN historical_constructors c ON c.id = rr.constructor_id
      WHERE rr.driver_id = $1 AND r.season_year = $2
      ORDER BY r.round, r.race_date NULLS LAST, r.id, rr.position_display_order, rr.id`,
      [driverId, seasonYear]);
    return { data: rows };
  }

  @Get('drivers/:id/teams')
  async driverTeams(@Param('id') id: string) {
    const driverId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT r.season_year AS year,
      c.id::text AS constructor_id, c.display_name AS constructor_name,
      COUNT(DISTINCT rr.race_id)::int AS races,
      COUNT(*) FILTER (WHERE rr.position_number = 1)::int AS wins
      FROM historical_race_results rr
      JOIN historical_races r ON r.id = rr.race_id
      JOIN historical_constructors c ON c.id = rr.constructor_id
      WHERE rr.driver_id = $1
      GROUP BY r.season_year, c.id, c.display_name
      ORDER BY r.season_year DESC, c.display_name`, [driverId]);
    return { data: rows };
  }

  @Get('lineage/network')
  async lineageNetwork() {
    const { rows } = await this.db.query(`SELECT 'constructor' AS entity_type,
      lc.id::text AS id, lc.subject_constructor_id::text AS subject_id,
      a.display_name AS subject_name, lc.object_constructor_id::text AS object_id,
      b.display_name AS object_name, lc.relation_type, lc.effective_year,
      lc.source_url, lc.source_title, lc.source_publisher
      FROM historical_lineage_claims lc
      JOIN historical_constructors a ON a.id = lc.subject_constructor_id
      JOIN historical_constructors b ON b.id = lc.object_constructor_id
      WHERE lc.review_status = 'verified'
      UNION ALL
      SELECT 'entrant' AS entity_type,
      ec.id::text AS id, ec.subject_entrant_id::text AS subject_id,
      a.display_name AS subject_name, ec.object_entrant_id::text AS object_id,
      b.display_name AS object_name, ec.relation_type, ec.effective_year,
      ec.source_url, ec.source_title, ec.source_publisher
      FROM historical_entrant_lineage_claims ec
      JOIN historical_entrants a ON a.id = ec.subject_entrant_id
      JOIN historical_entrants b ON b.id = ec.object_entrant_id
      WHERE ec.review_status = 'verified'
      ORDER BY effective_year NULLS LAST, entity_type, id
      LIMIT 500`);
    return { data: rows };
  }

  @Get('entrants/:id/lineage')
  async entrantLineage(@Param('id') id: string) {
    const entrantId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT lc.id::text AS id,
      lc.subject_entrant_id::text AS subject_id, source_team.display_name AS subject_name,
      lc.object_entrant_id::text AS object_id, target_team.display_name AS object_name,
      lc.relation_type, lc.effective_year, lc.source_url, lc.source_title,
      lc.source_publisher, lc.evidence_note
      FROM historical_entrant_lineage_claims lc
      JOIN historical_entrants source_team ON source_team.id = lc.subject_entrant_id
      JOIN historical_entrants target_team ON target_team.id = lc.object_entrant_id
      WHERE lc.review_status = 'verified'
        AND (lc.subject_entrant_id = $1 OR lc.object_entrant_id = $1)
      ORDER BY lc.effective_year NULLS LAST, lc.id`, [entrantId]);
    return { data: rows };
  }

  @Get('entrants/:id')
  async entrantProfile(@Param('id') id: string) {
    const entrantId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT e.id::text AS id, e.display_name AS name, x.external_id
      FROM historical_entrants e JOIN external_identities x ON x.id = e.external_identity_id
      WHERE e.id = $1`, [entrantId]);
    if (!rows.length) throw new NotFoundException('Entrant not found');
    return { data: rows };
  }

  @Get('constructors')
  async constructors(@Query('limit') limit?: string, @Query('offset') offset?: string, @Query('q') query?: string) {
    const l = integer(limit, 50, 1, 100, 'limit');
    const o = integer(offset, 0, 0, 100000, 'offset');
    const q = searchTerm(query);
    const { rows } = await this.db.query(`SELECT c.id::text AS id, c.display_name AS name, e.external_id
      FROM historical_constructors c JOIN external_identities e ON e.id = c.external_identity_id
      WHERE strpos(lower(c.display_name), lower($3)) > 0 OR strpos(lower(e.external_id), lower($3)) > 0
      ORDER BY c.display_name, c.id LIMIT $1 OFFSET $2`, [l, o, q]);
    return { data: rows, limit: l, offset: o };
  }

  @Get('constructors/:id')
  async constructorProfile(@Param('id') id: string) {
    const constructorId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT c.id::text AS id, c.display_name AS name, e.external_id,
      COUNT(rr.id)::int AS result_entries,
      COUNT(DISTINCT rr.race_id)::int AS races,
      COUNT(DISTINCT r.season_year)::int AS seasons,
      MIN(r.season_year) AS first_season, MAX(r.season_year) AS last_season,
      COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number = 1)::int AS wins,
      COUNT(*) FILTER (WHERE rr.position_number BETWEEN 1 AND 3)::int AS podium_finishes,
      SUM(rr.points)::text AS driver_points,
      COUNT(rr.id) FILTER (WHERE rr.points IS NULL)::int AS points_missing
      FROM historical_constructors c
      JOIN external_identities e ON e.id = c.external_identity_id
      LEFT JOIN historical_race_results rr ON rr.constructor_id = c.id
      LEFT JOIN historical_races r ON r.id = rr.race_id
      WHERE c.id = $1
      GROUP BY c.id, c.display_name, e.external_id`, [constructorId]);
    if (!rows.length) throw new NotFoundException('Constructor not found');
    return { data: rows };
  }

  @Get('constructors/:id/lineage')
  async constructorLineage(@Param('id') id: string) {
    const constructorId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT lc.id::text AS id,
      lc.subject_constructor_id::text AS subject_id, source_team.display_name AS subject_name,
      lc.object_constructor_id::text AS object_id, target_team.display_name AS object_name,
      lc.relation_type, lc.effective_year, lc.source_url, lc.source_title,
      lc.source_publisher, lc.evidence_note
      FROM historical_lineage_claims lc
      JOIN historical_constructors source_team ON source_team.id = lc.subject_constructor_id
      JOIN historical_constructors target_team ON target_team.id = lc.object_constructor_id
      WHERE lc.review_status = 'verified'
        AND (lc.subject_constructor_id = $1 OR lc.object_constructor_id = $1)
      ORDER BY lc.effective_year NULLS LAST, lc.id`, [constructorId]);
    return { data: rows };
  }

  @Get('constructors/:id/seasons')
  async constructorSeasons(@Param('id') id: string) {
    const constructorId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT r.season_year AS year,
      COUNT(DISTINCT rr.race_id)::int AS races,
      COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number = 1)::int AS wins,
      COUNT(*) FILTER (WHERE rr.position_number BETWEEN 1 AND 3)::int AS podium_finishes,
      SUM(rr.points)::text AS driver_points,
      COUNT(rr.id) FILTER (WHERE rr.points IS NULL)::int AS points_missing
      FROM historical_race_results rr
      JOIN historical_races r ON r.id = rr.race_id
      WHERE rr.constructor_id = $1
      GROUP BY r.season_year ORDER BY r.season_year DESC`, [constructorId]);
    return { data: rows };
  }

  @Get('constructors/:id/seasons/:year/drivers')
  async constructorSeasonDrivers(@Param('id') id: string, @Param('year') year: string) {
    const constructorId = integer(id, 0, 1, 2147483647, 'id');
    const seasonYear = integer(year, 1950, 1950, 2200, 'year');
    const { rows } = await this.db.query(`SELECT d.id::text AS driver_id, d.display_name AS driver_name,
      COUNT(DISTINCT rr.race_id)::int AS races,
      COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number = 1)::int AS wins
      FROM historical_race_results rr
      JOIN historical_races r ON r.id = rr.race_id
      JOIN historical_drivers d ON d.id = rr.driver_id
      WHERE rr.constructor_id = $1 AND r.season_year = $2
      GROUP BY d.id, d.display_name ORDER BY races DESC, d.display_name, d.id`,
      [constructorId, seasonYear]);
    return { data: rows };
  }

  @Get('circuits')
  async circuits(@Query('limit') limit?: string, @Query('offset') offset?: string, @Query('q') query?: string) {
    const l = integer(limit, 50, 1, 100, 'limit');
    const o = integer(offset, 0, 0, 100000, 'offset');
    const q = searchTerm(query);
    const { rows } = await this.db.query(`SELECT c.id::text AS id, c.display_name AS name, e.external_id
      FROM historical_circuits c JOIN external_identities e ON e.id = c.external_identity_id
      WHERE strpos(lower(c.display_name), lower($3)) > 0 OR strpos(lower(e.external_id), lower($3)) > 0
      ORDER BY c.display_name, c.id LIMIT $1 OFFSET $2`, [l, o, q]);
    return { data: rows, limit: l, offset: o };
  }

  @Get('circuits/:id')
  async circuitProfile(@Param('id') id: string) {
    const circuitId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT c.id::text AS id, c.display_name AS name, e.external_id,
      COUNT(r.id)::int AS races, MIN(r.season_year) AS first_season, MAX(r.season_year) AS last_season
      FROM historical_circuits c JOIN external_identities e ON e.id = c.external_identity_id
      LEFT JOIN historical_races r ON r.circuit_id = c.id
      WHERE c.id = $1 GROUP BY c.id, c.display_name, e.external_id`, [circuitId]);
    if (!rows.length) throw new NotFoundException('Circuit not found');
    return { data: rows };
  }

  @Get('circuits/:id/history')
  async circuitHistory(@Param('id') id: string) {
    const circuitId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT r.id::text AS race_id, r.season_year,
      r.round, r.race_date::text AS race_date, r.official_name AS race_name,
      COUNT(DISTINCT rr.driver_id)::int AS recorded_drivers,
      COUNT(DISTINCT rr.constructor_id)::int AS recorded_constructors,
      COUNT(DISTINCT rr.driver_id) FILTER (WHERE rr.position_number = 1)::int AS winner_entries,
      COALESCE(json_agg(DISTINCT jsonb_build_object(
        'driver_id', d.id::text, 'driver_name', d.display_name,
        'constructor_id', c.id::text, 'constructor_name', c.display_name
      )) FILTER (WHERE rr.position_number = 1), '[]'::json) AS winners
      FROM historical_races r
      LEFT JOIN historical_race_results rr ON rr.race_id = r.id
      LEFT JOIN historical_drivers d ON d.id = rr.driver_id
      LEFT JOIN historical_constructors c ON c.id = rr.constructor_id
      WHERE r.circuit_id = $1
      GROUP BY r.id, r.season_year, r.round, r.race_date, r.official_name
      ORDER BY r.season_year DESC, r.round DESC, r.id DESC`, [circuitId]);
    return { data: rows };
  }

  @Get('circuits/:id/races')
  async circuitRaces(@Param('id') id: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const circuitId = integer(id, 0, 1, 2147483647, 'id');
    const l = integer(limit, 50, 1, 100, 'limit');
    const o = integer(offset, 0, 0, 100000, 'offset');
    const { rows } = await this.db.query(`SELECT r.id::text AS id, r.season_year, r.round,
      r.race_date::text, r.official_name FROM historical_races r
      WHERE r.circuit_id = $1 ORDER BY r.season_year DESC, r.round DESC LIMIT $2 OFFSET $3`, [circuitId, l, o]);
    return { data: rows, limit: l, offset: o };
  }

  @Get('races/:id')
  async raceProfile(@Param('id') id: string) {
    const raceId = integer(id, 0, 1, 2147483647, 'id');
    const { rows } = await this.db.query(`SELECT r.id::text AS id, r.season_year, r.round,
      r.race_date::text, r.official_name, c.id::text AS circuit_id, c.display_name AS circuit_name,
      e.external_id FROM historical_races r
      JOIN external_identities e ON e.id = r.external_identity_id
      LEFT JOIN historical_circuits c ON c.id = r.circuit_id WHERE r.id = $1`, [raceId]);
    if (!rows.length) throw new NotFoundException('Race not found');
    return { data: rows };
  }

  @Get('races/:id/results')
  async results(@Param('id') id: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const race = integer(id, 0, 1, 2147483647, 'id');
    const l = integer(limit, 50, 1, 100, 'limit');
    const o = integer(offset, 0, 0, 100000, 'offset');
    const { rows } = await this.db.query(`SELECT rr.position_display_order, rr.position_number, rr.position_text,
      d.id::text AS driver_id, d.display_name AS driver,
      c.id::text AS constructor_id, c.display_name AS constructor, rr.points::text AS points,
      rr.laps, rr.reason_retired, rr.shared_car
      FROM historical_race_results rr
      JOIN historical_drivers d ON d.id = rr.driver_id
      JOIN historical_constructors c ON c.id = rr.constructor_id
      WHERE rr.race_id = $1 ORDER BY rr.position_display_order LIMIT $2 OFFSET $3`, [race, l, o]);
    return { data: rows, limit: l, offset: o };
  }
}
