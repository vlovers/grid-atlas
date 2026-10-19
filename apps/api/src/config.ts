export class ConfigurationError extends Error {}

/** Validate shape only; never include environment values in errors. */
export function apiConfig(env: NodeJS.ProcessEnv = process.env) {
  const databaseUrl = env.DATABASE_URL;
  try {
    if (!databaseUrl || /\s/.test(databaseUrl)) throw new Error();
    const url = new URL(databaseUrl);
    decodeURIComponent(url.username);
    decodeURIComponent(url.password);
    decodeURIComponent(url.pathname);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !url.hostname ||
        url.pathname.length < 2 || url.hash || url.port === '0') throw new Error();
  } catch {
    throw new ConfigurationError('DATABASE_URL must be a PostgreSQL URL with a host and database name');
  }
  const port = env.PORT ?? '3001';
  if (!/^[1-9][0-9]*$/.test(port) || Number(port) > 65535) {
    throw new ConfigurationError('PORT must be an integer from 1 to 65535');
  }
  const host = env.HOST ?? '127.0.0.1';
  const hostname = /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*\.?$/i;
  if (!host || host.length > 253 || (!isIP(host) && !hostname.test(host))) {
    throw new ConfigurationError('HOST must be an IP address or hostname');
  }
  return { databaseUrl, port: Number(port), host };
}
import { isIP } from 'node:net';
