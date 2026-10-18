import { BadRequestException, Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';

function integer(value: string | undefined, fallback: number, min: number, max: number, label: string): number {
  if (value === undefined) return fallback;
  if (!/^(0|[1-9][0-9]*)$/.test(value)) throw new BadRequestException(label + ' must be an integer');
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw new BadRequestException(label + ' out of bounds');
  return n;
}

@Controller()
export class HistoricalController {
  constructor(@Inject(DB) private readonly db: Pool) {}

  @Get('health')
  health() { return { status: 'ok' }; }

  @Get('seasons')
  async seasons() {
    const { rows } = await this.db.query('SELECT year FROM historical_seasons ORDER BY year DESC');
    return { data: rows };
  }

  @Get('seasons/:year/races')
  async races(@Param('year') year: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const y = integer(year, 1950, 1950, 2200, 'year');
    const l = integer(limit, 50, 1, 100, 'limit');
    const o = integer(offset, 0, 0, 100000, 'offset');
    const { rows } = await this.db.query(`SELECT r.id::text AS id, r.round, r.race_date, r.official_name,
      c.display_name AS circuit_name FROM historical_races r
      LEFT JOIN historical_circuits c ON c.id = r.circuit_id
      WHERE r.season_year = $1 ORDER BY r.round LIMIT $2 OFFSET $3`, [y, l, o]);
    return { data: rows, limit: l, offset: o };
  }

  @Get('drivers')
  async drivers(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const l = integer(limit, 50, 1, 100, 'limit');
    const o = integer(offset, 0, 0, 100000, 'offset');
    const { rows } = await this.db.query(`SELECT d.id::text AS id, d.display_name AS name, e.external_id
      FROM historical_drivers d JOIN external_identities e ON e.id = d.external_identity_id
      ORDER BY d.display_name, d.id LIMIT $1 OFFSET $2`, [l, o]);
    return { data: rows, limit: l, offset: o };
  }

  @Get('races/:id/results')
  async results(@Param('id') id: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const race = integer(id, 0, 1, 2147483647, 'id');
    const l = integer(limit, 50, 1, 100, 'limit');
    const o = integer(offset, 0, 0, 100000, 'offset');
    const { rows } = await this.db.query(`SELECT rr.position_display_order, rr.position_number, rr.position_text,
      d.display_name AS driver, c.display_name AS constructor, rr.points::text AS points,
      rr.laps, rr.reason_retired, rr.shared_car
      FROM historical_race_results rr
      JOIN historical_drivers d ON d.id = rr.driver_id
      JOIN historical_constructors c ON c.id = rr.constructor_id
      WHERE rr.race_id = $1 ORDER BY rr.position_display_order LIMIT $2 OFFSET $3`, [race, l, o]);
    return { data: rows, limit: l, offset: o };
  }
}
