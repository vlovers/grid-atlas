import { BadRequestException, Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';

const PAGE_SIZE = 25;
function validateId(raw: string): string {
  if (!/^[1-9][0-9]{0,18}$/.test(raw) || BigInt(raw) > 9223372036854775807n)
    throw new BadRequestException('id must be a positive PostgreSQL BIGINT');
  return raw;
}
function validateYear(raw: unknown): number {
  if (typeof raw !== 'string' || !/^[0-9]{4}$/.test(raw) ||
      Number(raw) < 1950 || Number(raw) > 2200)
    throw new BadRequestException('year must be between 1950 and 2200');
  return Number(raw);
}
function validateOffset(raw: unknown): number {
  if (raw === undefined) return 0;
  if (typeof raw !== 'string' || !/^(0|[1-9][0-9]{0,5})$/.test(raw) ||
      !Number.isSafeInteger(Number(raw)) || Number(raw) > 100000)
    throw new BadRequestException('offset must be an integer from 0 to 100000');
  return Number(raw);
}

/** Standalone, bounded complete-list endpoint: existing radial graph stays capped. */
@Controller('explorer')
export class ExplorerPagesController {
  constructor(@Inject(DB) private readonly db: Pool) {}

  @Get('drivers/:id/connections/page')
  drivers(@Param('id') id: string, @Query('year') year: unknown, @Query('offset') offset: unknown) {
    return this.page('driver', id, year, offset);
  }
  @Get('constructors/:id/connections/page')
  constructors(@Param('id') id: string, @Query('year') year: unknown, @Query('offset') offset: unknown) {
    return this.page('constructor', id, year, offset);
  }

  private async page(kind: 'driver' | 'constructor', rawId: string, rawYear: unknown, rawOffset: unknown) {
    const id = validateId(rawId);
    const year = validateYear(rawYear);
    const offset = validateOffset(rawOffset);
    const focusTable = kind === 'driver' ? 'historical_drivers' : 'historical_constructors';
    const neighborTable = kind === 'driver' ? 'historical_constructors' : 'historical_drivers';
    const focusCol = kind === 'driver' ? 'driver_id' : 'constructor_id';
    const neighborCol = kind === 'driver' ? 'constructor_id' : 'driver_id';
    const client = await this.db.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const focus = await client.query<{ id: string; name: string }>(
        `SELECT id::text AS id, display_name AS name FROM ${focusTable} WHERE id=$1`, [id]);
      if (!focus.rows.length) throw new NotFoundException('Focus entity not found');
      const count = await client.query<{ total: number }>(
        `SELECT COUNT(DISTINCT rr.${neighborCol})::int AS total
         FROM historical_race_results rr JOIN historical_races r ON r.id=rr.race_id
         WHERE rr.${focusCol}=$1 AND r.season_year=$2`, [id, year]);
      const total = count.rows[0].total;
      // ORDER BY must match the initial graph's first 25 rows exactly.
      const rows = await client.query<{ id: string; name: string;
        races: number; result_entries: number; winning_races: number }>(
        `SELECT n.id::text AS id, n.display_name AS name,
           COUNT(*)::int AS result_entries,
           COUNT(DISTINCT rr.race_id)::int AS races,
           COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number=1)::int AS winning_races
         FROM historical_race_results rr
         JOIN historical_races r ON r.id=rr.race_id
         JOIN ${neighborTable} n ON n.id=rr.${neighborCol}
         WHERE rr.${focusCol}=$1 AND r.season_year=$2
         GROUP BY n.id,n.display_name
         ORDER BY MIN(r.round),n.id
         LIMIT $3 OFFSET $4`, [id, year, PAGE_SIZE, offset]);
      await client.query('COMMIT');
      return { data: {
        focus: { entity_type: kind, entity_id: id, name: focus.rows[0].name },
        neighbor_type: kind === 'driver' ? 'constructor' : 'driver',
        year, offset, limit: PAGE_SIZE, total,
        next_offset: offset + rows.rows.length < total ? offset + rows.rows.length : null,
        neighbors: rows.rows.map(row => ({
          entity_id: row.id, name: row.name,
          races: row.races, result_entries: row.result_entries, winning_races: row.winning_races,
        })),
        provenance: 'imported-main-race-results',
        limitations: ['observed_results_not_official_starts_or_contracts',
          'entity_source_not_individual_result_evidence'],
      } };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
