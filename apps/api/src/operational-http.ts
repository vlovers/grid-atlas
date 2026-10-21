import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';

// Minimal adapter types keep operational code independent of Express internals.
type Response = {
  statusCode: number;
  once(event: 'finish', callback: () => void): void;
  status(code: number): Response;
  json(body: unknown): void;
};
type Request = { method: string; route?: { path?: unknown } };
const logger = new Logger('HTTP');

export function requestLog(request: Request, response: Response, next: () => void): void {
  const started = performance.now();
  response.once('finish', () => logger.log({
    event: 'http_request', method: request.method,
    route: typeof request.route?.path === 'string' ? request.route.path : 'unmatched',
    status: response.statusCode, duration_ms: Math.round(performance.now() - started),
  }));
  next();
}

@Catch()
export class SafeApiErrors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (error instanceof HttpException && error.getStatus() < 500) {
      const body = error.getResponse();
      response.status(error.getStatus()).json(typeof body === 'string'
        ? { statusCode: error.getStatus(), message: body } : body);
      return;
    }
    if (error instanceof HttpException && error.getStatus() === 503) {
      response.status(503).json({ status: 'not_ready' });
      return;
    }
    logger.error({ event: 'request_failed' });
    response.status(500).json({ statusCode: 500, message: 'Internal server error' });
  }
}
