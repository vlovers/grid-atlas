import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';

const MAX_CONSTRUCTORS = 25;

function positiveBigint(value: string): string {
  if (!/^[1-9][0-9]{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) {
    throw new BadRequestException('id must be a positive PostgreSQL BIGINT');
  }
  return value;
}

function seasonYear(value: unknown): number {
  if (typeof value !== 'string' || !/^[0-9]{4}$/.test(value)) {
    throw new BadRequestException('year must be a four-digit season year');
  }
  const year = Number(value);
  if (year < 1950 || year > 2200) throw new BadRequestException('year is outside supported season bounds');
  return year;
}

/**
 * A bounded one-hop read of imported result associations.
 * This endpoint does NOT assert contracts, entrant identity, rivalry, lineage or official starts.
 */
@Controller('explorer')
export class ExplorerController {
  constructor(@Inject(DB) private readonly db: Pool) {}

  @Get('drivers/:id/connections')
  async driverConnections(@Param('id') rawId: string, @Query('year') rawYear: unknown) {
    const id = positiveBigint(rawId);
    const year = seasonYear(rawYear);
    const client = await this.db.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const { rows: drivers } = await client.query(`SELECT d.id::text AS id, d.display_name AS name,
        s.slug AS source_slug, s.homepage_url AS source_url, s.attribution
        FROM historical_drivers d
        JOIN external_identities x ON x.id = d.external_identity_id AND x.entity_kind = 'driver'
        JOIN data_sources s ON s.id = x.source_id
        WHERE d.id = $1`, [id]);
      if (!drivers.length) throw new NotFoundException('Driver not found');

      // Fetch one extra row so truncation is explicit. Group by canonical identity,
      // not name, and count distinct races separately from result entries.
      const { rows } = await client.query(`SELECT c.id::text AS id, c.display_name AS name,
        COUNT(*)::int AS result_entries,
        COUNT(DISTINCT rr.race_id)::int AS races,
        COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number = 1)::int AS winning_races
        FROM historical_race_results rr
        JOIN historical_races r ON r.id = rr.race_id
        JOIN historical_constructors c ON c.id = rr.constructor_id
        WHERE rr.driver_id = $1 AND r.season_year = $2
        GROUP BY c.id, c.display_name
        ORDER BY MIN(r.round), c.id
        LIMIT $3`, [id, year, MAX_CONSTRUCTORS + 1]);
      const truncated = rows.length > MAX_CONSTRUCTORS;
      const related = rows.slice(0, MAX_CONSTRUCTORS);
      await client.query('COMMIT');
      return {
        data: {
          focus: `driver:${id}`,
          year,
          nodes: [
            { key: `driver:${id}`, type: 'driver', entity_id: id, name: drivers[0].name },
            ...related.map(row => ({
              key: `constructor:${row.id}`, type: 'constructor', entity_id: row.id, name: row.name,
            })),
          ],
          edges: related.map(row => ({
            key: `driver:${id}:constructor:${row.id}:year:${year}`,
            from: `driver:${id}`,
            to: `constructor:${row.id}`,
            relation_type: 'driver_recorded_result_for_constructor',
            year,
            result_entries: row.result_entries,
            races: row.races,
            winning_races: row.winning_races,
            provenance: 'imported-result-association',
          })),
          truncated,
          limit: MAX_CONSTRUCTORS,
          source: {
            slug: drivers[0].source_slug,
            homepage_url: drivers[0].source_url,
            attribution: drivers[0].attribution,
          },
          limitations: [
            'result_association_not_official_starts',
            'entity_source_not_per_result_provenance',
            'constructor_not_entrant_or_legal_continuity',
            'imported_main_race_results_only',
          ],
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reciprocal, bounded constructor → driver result associations for one season.
   * Constructor identity is independent of entrants or legal successors.
   */
  @Get('constructors/:id/connections')
  async constructorConnections(@Param('id') rawId: string, @Query('year') rawYear: unknown) {
    const id = positiveBigint(rawId);
    const year = seasonYear(rawYear);
    const client = await this.db.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const { rows: constructors } = await client.query(`SELECT c.id::text AS id, c.display_name AS name,
        s.slug AS source_slug, s.homepage_url AS source_url, s.attribution
        FROM historical_constructors c
        JOIN external_identities x ON x.id = c.external_identity_id AND x.entity_kind = 'constructor'
        JOIN data_sources s ON s.id = x.source_id
        WHERE c.id = $1`, [id]);
      if (!constructors.length) throw new NotFoundException('Constructor not found');
      const { rows } = await client.query(`SELECT d.id::text AS id, d.display_name AS name,
        COUNT(*)::int AS result_entries,
        COUNT(DISTINCT rr.race_id)::int AS races,
        COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number = 1)::int AS winning_races
        FROM historical_race_results rr
        JOIN historical_races r ON r.id = rr.race_id
        JOIN historical_drivers d ON d.id = rr.driver_id
        WHERE rr.constructor_id = $1 AND r.season_year = $2
        GROUP BY d.id, d.display_name
        ORDER BY MIN(r.round), d.id
        LIMIT $3`, [id, year, MAX_CONSTRUCTORS + 1]);
      const truncated = rows.length > MAX_CONSTRUCTORS;
      const related = rows.slice(0, MAX_CONSTRUCTORS);
      await client.query('COMMIT');
      return {
        data: {
          focus: `constructor:${id}`,
          year,
          nodes: [
            { key: `constructor:${id}`, type: 'constructor', entity_id: id, name: constructors[0].name },
            ...related.map(row => ({
              key: `driver:${row.id}`, type: 'driver', entity_id: row.id, name: row.name,
            })),
          ],
          edges: related.map(row => ({
            key: `constructor:${id}:driver:${row.id}:year:${year}`,
            from: `constructor:${id}`,
            to: `driver:${row.id}`,
            relation_type: 'constructor_recorded_result_with_driver',
            year,
            result_entries: row.result_entries,
            races: row.races,
            winning_races: row.winning_races,
            provenance: 'imported-result-association',
          })),
          truncated,
          limit: MAX_CONSTRUCTORS,
          source: {
            slug: constructors[0].source_slug,
            homepage_url: constructors[0].source_url,
            attribution: constructors[0].attribution,
          },
          limitations: [
            'result_association_not_official_starts',
            'entity_source_not_per_result_provenance',
            'constructor_not_entrant_or_legal_continuity',
            'imported_main_race_results_only',
          ],
        },
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Evidence drilldown for one observed driver/constructor association.
   * Returned items describe imported main-race result rows only, not official starts.
   */
  @Get('drivers/:id/constructors/:constructorId/races')
  async connectionRaces(@Param('id') rawDriverId: string,
    @Param('constructorId') rawConstructorId: string, @Query('year') rawYear: unknown) {
    const driverId = positiveBigint(rawDriverId);
    const constructorId = positiveBigint(rawConstructorId);
    const year = seasonYear(rawYear);
    const client = await this.db.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const { rows: identities } = await client.query(`SELECT
        (SELECT display_name FROM historical_drivers WHERE id = $1) AS driver_name,
        (SELECT display_name FROM historical_constructors WHERE id = $2) AS constructor_name`,
        [driverId, constructorId]);
      if (!identities[0]?.driver_name || !identities[0]?.constructor_name) {
        throw new NotFoundException('Driver or constructor not found');
      }
      // MAX 100 distinct races. Multiple result rows in one race stay visible
      // as an entry count instead of being silently labeled separate starts.
      const { rows } = await client.query(`SELECT r.id::text AS race_id,
        r.round, r.race_date::text AS race_date, r.official_name,
        COUNT(*)::int AS result_entries,
        COUNT(*) FILTER (WHERE rr.position_number = 1)::int AS winning_result_entries
        FROM historical_race_results rr
        JOIN historical_races r ON r.id = rr.race_id
        WHERE rr.driver_id = $1 AND rr.constructor_id = $2 AND r.season_year = $3
        GROUP BY r.id, r.round, r.race_date, r.official_name
        ORDER BY r.round, r.id
        LIMIT 101`, [driverId, constructorId, year]);
      const truncated = rows.length > 100;
      await client.query('COMMIT');
      return { data: {
        driver: { id: driverId, name: identities[0].driver_name },
        constructor: { id: constructorId, name: identities[0].constructor_name },
        year,
        races: rows.slice(0, 100),
        truncated,
        limit: 100,
        provenance: 'imported-main-race-results',
        limitations: [
          'result_association_not_official_starts',
          'result_rows_not_per_row_source_provenance',
          'constructor_not_entrant_or_legal_continuity',
        ],
      } };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
