import { Module, OnApplicationShutdown, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { HistoricalController } from './historical.controller';
import { ProfilesController } from './profiles.controller';
import { ExplorerController } from './explorer.controller';

import { DB } from './tokens';
@Injectable()
export class PoolShutdown implements OnApplicationShutdown {
  constructor(@Inject(DB) private readonly pool: Pool) {}
  async onApplicationShutdown(): Promise<void> { await this.pool.end(); }
}
@Module({
  controllers: [HistoricalController, ProfilesController, ExplorerController],
  providers: [
    { provide: DB, useFactory: () => {
      if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
      return new Pool({ connectionString: process.env.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });
    }},
    PoolShutdown,
  ],
})
export class AppModule {}
