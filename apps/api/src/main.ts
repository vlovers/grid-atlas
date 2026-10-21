import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConsoleLogger, INestApplication } from '@nestjs/common';
import { AppModule } from './module';
import { apiConfig, ConfigurationError } from './config';
import { requestLog, SafeApiErrors } from './operational-http';

async function main(): Promise<void> {
  const logger = new ConsoleLogger('Bootstrap', { json: true });
  let app: INestApplication | undefined;
  try {
    const config = apiConfig();
    // DI failures may contain driver configuration; bootstrap owns their safe log.
    app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
    app.useLogger(logger);
    app.setGlobalPrefix('api');
    app.use(requestLog);
    app.useGlobalFilters(new SafeApiErrors());
    app.enableShutdownHooks(['SIGTERM', 'SIGINT']);
    await app.listen(config.port, config.host);
    logger.log({ event: 'api_listening' });
  } catch (error: unknown) {
    logger.error({ event: 'startup_failed', reason: error instanceof ConfigurationError
      ? error.message : 'API initialization failed' });
    if (app) await app.close();
    process.exitCode = 1;
  }
}
main().catch(() => {
  new ConsoleLogger({ json: true }).error({ event: 'shutdown_failed' });
  process.exitCode = 1;
});
