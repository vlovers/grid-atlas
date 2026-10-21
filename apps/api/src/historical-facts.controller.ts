import { Controller, Get, Inject, NotFoundException, Param, Query, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { DB } from './tokens';

// No public facts route: this controller exposes a fixed empty collection while
// the research table is explicitly unpublished. It never queries draft/reviewed
// records, preventing accidental publication of source claims.
@Controller('historical-facts')
export class HistoricalFactsController {
  constructor(@Inject(DB) private readonly db: Pool) {
    void this.db;
  }

  @Get(':kind/:id')
  async publicFacts(@Param('kind') kind: string, @Param('id') id: string,
                    @Query('year') year?: string) {
    if (!['driver_season', 'constructor_season', 'circuit_layout', 'race_event'].includes(kind)) {
      throw new NotFoundException('Fact category not found');
    }
    if (!/^[1-9][0-9]*$/.test(id) || Number(id) > 2147483647) {
      throw new BadRequestException('Invalid entity ID');
    }
    if (year !== undefined && (!/^[0-9]{4}$/.test(year) || Number(year) < 1950 || Number(year) > 2100)) {
      throw new BadRequestException('Invalid season');
    }
    return { data: [], publication: 'unavailable', reason: 'Technical facts are awaiting independent publication approval' };
  }
}
