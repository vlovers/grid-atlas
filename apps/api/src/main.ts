import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './module';

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || '3001'), process.env.HOST || '127.0.0.1');
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
