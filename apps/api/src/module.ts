import { Logger, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { HistoricalController } from './historical.controller';
import { ProfilesController } from './profiles.controller';
import { ExplorerController } from './explorer.controller';
import { ExplorerPagesController } from './explorer-pages.controller';
import { TimeMachineController } from './time-machine.controller';
import { EditorialController } from './editorial.controller';
import { CircuitEditorialController } from './circuit-editorial.controller';

import { DB } from './tokens';
import { apiConfig } from './config';
import { ApiRuntime, ReadinessController } from './runtime';

@Module({
  controllers: [
    ReadinessController,
    HistoricalController,
    ProfilesController,
    ExplorerController,
    ExplorerPagesController,
    TimeMachineController,
    EditorialController,
    CircuitEditorialController,
  ],
  providers: [
    {
      provide: DB,
      useFactory: () => {
        const pool = new Pool({
          connectionString: apiConfig().databaseUrl,
          max: 10,
          connectionTimeoutMillis: 5000,
        });
        pool.on('error', () => new Logger('Database').error({ event: 'database_pool_error' }));
        return pool;
      },
    },
    ApiRuntime,
  ],
})
export class AppModule {}
