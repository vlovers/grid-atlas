/* Isolated local proposal, outside the production App Router. No publication path. */
const { createServer } = require('node:http');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const next = require('next');
process.chdir(__dirname);
const dist = `.next/${process.pid}`;
process.env.CIRCUIT_MEDIA410_DIST = dist;
mkdirSync(join(__dirname, dist), { recursive: true });
writeFileSync(join(__dirname, dist, 'tsconfig.json'), JSON.stringify({ extends: resolve(__dirname, '../../../../../tsconfig.json'),
  include: [resolve(__dirname, 'app/**/*.tsx'), resolve(__dirname, 'next-env.d.ts')], exclude: ['node_modules'] }));
const app = next({ dev: true, dir: __dirname });
let server;
async function start() {
  const { loadCircuitMediaIntake, auditCircuitMediaIntake } = await import('../../../../../../../scripts/audit-circuit-media-intake.mjs');
  auditCircuitMediaIntake(loadCircuitMediaIntake());
  await app.prepare();
  const handle = app.getRequestHandler();
  server = createServer((req, res) => {
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' ws:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const path = new URL(req.url, 'http://127.0.0.1').pathname;
    if (req.headers.host !== `127.0.0.1:${server.address().port}` || req.socket.remoteAddress !== '127.0.0.1' ||
        req.headers['sec-fetch-site'] === 'cross-site' || !['GET', 'HEAD'].includes(req.method) ||
        (!/^\/(en|uk)(\/sources)?$/.test(path) && !path.startsWith('/_next/'))) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return;
    }
    handle(req, res);
  });
  server.listen(Number(process.env.PORT || 3487), '127.0.0.1', () => {
    const url = `http://127.0.0.1:${server.address().port}`;
    if (process.send) process.send({ url }); else console.log(`LOCAL CIRCUIT MEDIA PROPOSAL: ${url}/en`);
  });
}
start().catch(error => { console.error(error); process.exit(1); });
process.once('SIGTERM', () => { server?.close(); app.close().finally(() => process.exit(0)); });
