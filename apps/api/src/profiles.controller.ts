import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';

type ProfileKind = 'driver' | 'constructor';

// Closed, internal identifiers only; request values are always query parameters.
const entities = {
  driver: { table: 'historical_drivers', column: 'driver_id', relatedTable: 'historical_constructors', relatedColumn: 'constructor_id', relatedKind: 'constructor' },
  constructor: { table: 'historical_constructors', column: 'constructor_id', relatedTable: 'historical_drivers', relatedColumn: 'driver_id', relatedKind: 'driver' },
} as const;

function profileId(id: string): string {
  if (!/^[1-9][0-9]{0,18}$/.test(id) || BigInt(id) > 9223372036854775807n) {
    throw new BadRequestException('id must be a positive PostgreSQL BIGINT');
  }
  return id;
}

function editorialLocale(value: unknown): 'uk' | 'en' {
  if (value === undefined) return 'uk';
  if (value !== 'uk' && value !== 'en') throw new BadRequestException('locale must be uk or en');
  return value;
}

@Controller()
export class ProfilesController {
  constructor(@Inject(DB) private readonly db: Pool) {}

  @Get('drivers/:id/identity')
  driverIdentity(@Param('id') id: string) { return this.identity('driver', profileId(id)); }

  @Get('constructors/:id/identity')
  constructorIdentity(@Param('id') id: string) { return this.identity('constructor', profileId(id)); }

  @Get('circuits/:id/identity')
  circuitIdentity(@Param('id') id: string) { return this.identity('circuit', profileId(id)); }

  private async identity(kind: 'driver' | 'constructor' | 'circuit', id: string) {
    const table = kind === 'circuit' ? 'historical_circuits' : entities[kind].table;
    const { rows } = await this.db.query(`SELECT h.id::text AS id, x.external_id,
      s.slug AS source_slug, s.homepage_url AS source_url, s.attribution,
      COALESCE(d.fields, '{}'::jsonb) AS fields,
      CASE WHEN d.external_identity_id IS NOT NULL THEN jsonb_build_object(
        'release_tag', r.release_tag, 'artifact_name', r.artifact_name,
        'sha256', r.sha256, 'source_locator', d.source_locator,
        'content_hash', o.content_hash, 'imported_at', o.imported_at,
        'method', 'source_reported') ELSE NULL END AS provenance
      FROM ${table} h
      JOIN external_identities x ON x.id=h.external_identity_id AND x.entity_kind=$2
      JOIN data_sources s ON s.id=x.source_id
      LEFT JOIN historical_identity_details d ON d.external_identity_id=x.id
      LEFT JOIN source_releases r ON r.id=d.release_id AND r.source_id=x.source_id
      LEFT JOIN source_observations o ON o.release_id=r.id AND o.external_identity_id=x.id
      WHERE h.id=$1`, [id, kind]);
    if (!rows.length) throw new NotFoundException('Identity not found');
    return { data: rows };
  }

  @Get('drivers/:id/career')
  driverCareer(@Param('id') id: string, @Query('locale') locale?: string) {
    return this.career('driver', profileId(id), editorialLocale(locale));
  }

  @Get('constructors/:id/career')
  constructorCareer(@Param('id') id: string, @Query('locale') locale?: string) {
    return this.career('constructor', profileId(id), editorialLocale(locale));
  }

  private async career(kind: ProfileKind, id: string, locale: 'uk' | 'en') {
    const entity = entities[kind];
    const client = await this.db.connect();
    try {
      // Keep identity, evidence and derived figures in the same import snapshot.
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const { rows: identities } = await client.query(`SELECT h.id::text AS id,
        h.display_name AS name, x.external_id, s.slug AS source_slug,
        s.homepage_url AS source_url, s.attribution,
        COALESCE((SELECT jsonb_agg(jsonb_build_object(
          'release_tag', r.release_tag, 'artifact_name', r.artifact_name,
          'sha256', r.sha256, 'content_hash', o.content_hash)
          ORDER BY r.release_tag, r.artifact_name, r.id)
          FROM source_observations o JOIN source_releases r ON r.id = o.release_id
          WHERE o.external_identity_id = x.id AND r.source_id = x.source_id), '[]'::jsonb) AS observations
        FROM ${entity.table} h
        JOIN external_identities x ON x.id = h.external_identity_id AND x.entity_kind = $2
        JOIN data_sources s ON s.id = x.source_id WHERE h.id = $1`, [id, kind]);
      if (!identities.length) throw new NotFoundException('Profile not found');

      const { rows: [summary] } = await client.query(`SELECT COUNT(*)::int AS result_entries,
        COUNT(DISTINCT rr.race_id)::int AS races,
        COUNT(DISTINCT r.season_year)::int AS seasons,
        MIN(r.season_year) AS first_season, MAX(r.season_year) AS last_season,
        COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number = 1)::int AS winning_races,
        COUNT(*) FILTER (WHERE rr.position_number BETWEEN 1 AND 3)::int AS podium_result_entries,
        SUM(rr.points)::text AS recorded_points,
        COUNT(rr.points)::int AS points_recorded,
        COUNT(*) FILTER (WHERE rr.points IS NULL)::int AS points_missing
        FROM historical_race_results rr JOIN historical_races r ON r.id = rr.race_id
        WHERE rr.${entity.column} = $1`, [id]);

      const race = `jsonb_build_object('id', r.id::text, 'year', r.season_year,
        'round', r.round, 'name', r.official_name, 'date', r.race_date::text,
        'circuit_id', r.circuit_id::text)`;
      const { rows: participation } = await client.query(`SELECT r.season_year AS year,
        related.id::text AS related_id, related.display_name AS related_name,
        x.external_id AS related_external_id, s.slug AS related_source_slug,
        COUNT(*)::int AS result_entries, COUNT(DISTINCT rr.race_id)::int AS races,
        COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number = 1)::int AS winning_races,
        COUNT(*) FILTER (WHERE rr.position_number BETWEEN 1 AND 3)::int AS podium_result_entries,
        SUM(rr.points)::text AS recorded_points, COUNT(rr.points)::int AS points_recorded,
        COUNT(*) FILTER (WHERE rr.points IS NULL)::int AS points_missing,
        (array_agg(${race} ORDER BY r.round, r.id, rr.position_display_order, rr.id))[1] AS first_race,
        (array_agg(${race} ORDER BY r.round DESC, r.id DESC, rr.position_display_order DESC, rr.id DESC))[1] AS last_race
        FROM historical_race_results rr JOIN historical_races r ON r.id = rr.race_id
        JOIN ${entity.relatedTable} related ON related.id = rr.${entity.relatedColumn}
        JOIN external_identities x ON x.id = related.external_identity_id AND x.entity_kind = $2
        JOIN data_sources s ON s.id = x.source_id
        WHERE rr.${entity.column} = $1
        GROUP BY r.season_year, related.id, related.display_name, x.external_id, s.slug
        ORDER BY r.season_year, MIN(r.round), related.id`, [id, entity.relatedKind]);

      // A driver may have multiple entries in one race (89 pairs in the pinned
      // release). Preserve each result, but choose milestones by distinct race.
      const { rows: [milestones] } = await client.query(`WITH races AS (
        SELECT r.season_year, r.round, ${race} AS race,
          bool_or(rr.position_number = 1) AS won,
          jsonb_agg(jsonb_build_object('position_display_order', rr.position_display_order,
            'position_number', rr.position_number, 'position_text', rr.position_text,
            'driver_id', rr.driver_id::text, 'constructor_id', rr.constructor_id::text,
            'points', rr.points::text, 'shared_car', rr.shared_car,
            'reason_retired', rr.reason_retired) ORDER BY rr.position_display_order) AS results
        FROM historical_race_results rr JOIN historical_races r ON r.id = rr.race_id
        WHERE rr.${entity.column} = $1 GROUP BY r.id
      ) SELECT
        (SELECT jsonb_build_object('race', race, 'results', results) FROM races
          ORDER BY season_year, round LIMIT 1) AS first_appearance,
        (SELECT jsonb_build_object('race', race, 'results', results) FROM races
          ORDER BY season_year DESC, round DESC LIMIT 1) AS last_appearance,
        (SELECT jsonb_build_object('race', race, 'results', results) FROM races WHERE won
          ORDER BY season_year, round LIMIT 1) AS first_win,
        (SELECT jsonb_build_object('race', race, 'results', results) FROM races WHERE won
          ORDER BY season_year DESC, round DESC LIMIT 1) AS last_win`, [id]);

      // These observations prove entity imports only. The current result importer
      // has no per-result release observations; never imply stronger provenance.
      await client.query('COMMIT');
      return { data: [{
        ...identities[0], entity_type: kind, summary,
        related_entity_type: entity.relatedKind, participation, milestones,
        limitations: [
          'imported_race_results_only', 'appearances_not_official_starts',
          'season_round_order_not_date_order', 'missing_points_are_unknown',
          'race_points_not_championship_standings', 'entity_observations_not_result_provenance',
          'constructor_association_not_entrant_or_legal_continuity',
        ],
        // Editorial storage/publication is deliberately separate from imported
        // facts. No reviewed biographies are available; never synthesize one.
        editorial: { locale, introduction: null, biography: null },
      }] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
