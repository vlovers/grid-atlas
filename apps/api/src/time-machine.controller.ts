import {
  BadRequestException, Controller, Get, Inject, NotFoundException,
  Param, Query, UnprocessableEntityException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';

type FocusKind = 'driver' | 'constructor';
type CountRow = { result_entries: number; races: number; winning_races: number };
type YearRow = CountRow & { id: string; name: string; year: number };

const MAX_NEIGHBORS = 500;

function positiveId(raw: string): string {
  if (!/^[1-9][0-9]{0,18}$/.test(raw) || BigInt(raw) > 9223372036854775807n) {
    throw new BadRequestException('id must be a positive PostgreSQL BIGINT');
  }
  return raw;
}
function year(raw: unknown): number {
  if (typeof raw !== 'string' || !/^[0-9]{4}$/.test(raw) ||
      Number(raw) < 1950 || Number(raw) > 2200) {
    throw new BadRequestException('year must be within 1950–2200');
  }
  return Number(raw);
}

@Controller('explorer')
export class TimeMachineController {
  constructor(@Inject(DB) private readonly db: Pool) {}

  @Get('drivers/:id/compare')
  driver(@Param('id') id: string, @Query('fromYear') from: unknown, @Query('toYear') to: unknown) {
    return this.compare('driver', id, from, to);
  }

  @Get('constructors/:id/compare')
  constructorFocus(@Param('id') id: string, @Query('fromYear') from: unknown, @Query('toYear') to: unknown) {
    return this.compare('constructor', id, from, to);
  }

  private async compare(kind: FocusKind, rawId: string, rawFrom: unknown, rawTo: unknown) {
    const id = positiveId(rawId);
    const fromYear = year(rawFrom);
    const toYear = year(rawTo);
    if (fromYear === toYear) throw new BadRequestException('comparison years must differ');

    // Identifiers below are selected solely by server-controlled kind, never
    // populated from user input. Result rows are observations, not contracts.
    const focusTable = kind === 'driver' ? 'historical_drivers' : 'historical_constructors';
    const relatedTable = kind === 'driver' ? 'historical_constructors' : 'historical_drivers';
    const focusColumn = kind === 'driver' ? 'driver_id' : 'constructor_id';
    const relatedColumn = kind === 'driver' ? 'constructor_id' : 'driver_id';
    const relatedType = kind === 'driver' ? 'constructor' : 'driver';
    const client = await this.db.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const focus = await client.query<{ id: string; name: string }>(
        `SELECT id::text AS id, display_name AS name FROM ${focusTable} WHERE id=$1`, [id]);
      if (!focus.rows.length) throw new NotFoundException('Focus entity not found');

      const result = await client.query<YearRow>(`
        SELECT neighbor.id::text AS id, neighbor.display_name AS name,
          race.season_year AS year,
          COUNT(*)::int AS result_entries,
          COUNT(DISTINCT rr.race_id)::int AS races,
          COUNT(DISTINCT rr.race_id) FILTER (WHERE rr.position_number=1)::int AS winning_races
        FROM historical_race_results rr
        JOIN historical_races race ON race.id = rr.race_id
        JOIN ${relatedTable} neighbor ON neighbor.id = rr.${relatedColumn}
        WHERE rr.${focusColumn}=$1 AND race.season_year IN ($2,$3)
        GROUP BY neighbor.id, neighbor.display_name, race.season_year
        ORDER BY neighbor.id, race.season_year
        LIMIT $4
      `, [id, fromYear, toYear, MAX_NEIGHBORS * 2 + 1]);
      // Do not silently misclassify omitted neighbors as absent.
      if (result.rows.length > MAX_NEIGHBORS * 2) {
        throw new UnprocessableEntityException('comparison exceeds bounded record limit');
      }

      const pairs = new Map<string, { id: string; name: string; from: CountRow | null; to: CountRow | null }>();
      for (const row of result.rows) {
        const entry: { id: string; name: string; from: CountRow | null; to: CountRow | null } =
          pairs.get(row.id) ?? { id: row.id, name: row.name, from: null, to: null };
        const values = { result_entries: row.result_entries, races: row.races, winning_races: row.winning_races };
        if (row.year === fromYear) entry.from = values;
        else entry.to = values;
        pairs.set(row.id, entry);
      }
      if (pairs.size > MAX_NEIGHBORS) {
        throw new UnprocessableEntityException('comparison exceeds bounded neighbor limit');
      }
      const added = [], removed = [], unchanged = [];
      for (const entry of pairs.values()) {
        const item = { entity_type: relatedType, entity_id: entry.id, name: entry.name,
          from: entry.from, to: entry.to };
        if (!entry.from) added.push(item);
        else if (!entry.to) removed.push(item);
        else unchanged.push(item);
      }
      await client.query('COMMIT');
      return { data: {
        focus: { entity_type: kind, entity_id: id, name: focus.rows[0].name },
        from_year: fromYear, to_year: toYear,
        added, removed, unchanged,
        provenance: 'imported-main-race-results',
        limitations: [
          'seasonal_observations_not_contracts_or_transfers',
          'absence_of_record_not_proof_of_absence',
          'race_results_not_official_starts',
          'constructor_identity_not_entrant_or_legal_continuity',
          'no_individual_result_row_provenance',
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
