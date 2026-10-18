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
            relation_type: 'driver_competed_for_constructor',
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
}
