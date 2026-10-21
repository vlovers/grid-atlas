import {
  Controller, Get, Header, Inject, Injectable, Logger,
  OnApplicationShutdown, OnModuleDestroy, ServiceUnavailableException,
} from '@nestjs/common';
import { Pool, QueryConfig } from 'pg';
import { DB } from './tokens';

@Injectable()
export class ApiRuntime implements OnModuleDestroy, OnApplicationShutdown {
  private readonly logger = new Logger('ApiRuntime');
  private draining = false;
  private lastReady: boolean | undefined;
  private shutdownDeadline?: NodeJS.Timeout;

  constructor(@Inject(DB) private readonly pool: Pool) {}

  async ready(): Promise<boolean> {
    let ready = false;
    if (!this.draining) {
      try {
        // Pool acquisition is bounded by connectionTimeoutMillis (5s); query by 2s.
        await this.pool.query({ text: 'SELECT 1', query_timeout: 2000 } as QueryConfig & { query_timeout: number });
        ready = !this.draining;
      } catch { /* No database error, SQL or connection details in public responses/logs. */ }
    }
    if (ready !== this.lastReady) {
      this.logger.log({ event: 'readiness_changed', ready });
      this.lastReady = ready;
    }
    return ready;
  }

  onModuleDestroy(): void {
    this.draining = true;
    this.logger.log({ event: 'shutdown_started' });
    // Bound HTTP drain + pool.end(); an external supervisor must still allow >10s.
    this.shutdownDeadline = setTimeout(() => {
      this.logger.error({ event: 'shutdown_deadline_exceeded' });
      process.exit(1);
    }, 10000);
    this.shutdownDeadline.unref();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
    clearTimeout(this.shutdownDeadline);
    this.logger.log({ event: 'shutdown_completed' });
  }
}

@Controller()
export class ReadinessController {
  constructor(private readonly runtime: ApiRuntime) {}

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  async ready() {
    if (!await this.runtime.ready()) throw new ServiceUnavailableException({ status: 'not_ready' });
    return { status: 'ready' };
  }
}
