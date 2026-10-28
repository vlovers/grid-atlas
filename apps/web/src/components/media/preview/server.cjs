/* Local-only interactive Next.js component preview. Not a public application route. */
const { createServer } = require('node:http');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const next = require('next');

process.chdir(__dirname);
const dist = `.next/${process.pid}`;
process.env.MEDIA_PREVIEW_DIST = dist;
mkdirSync(join(__dirname, dist), { recursive: true });
writeFileSync(join(__dirname, dist, 'tsconfig.json'), JSON.stringify({
  extends: resolve(__dirname, '../../../../tsconfig.json'),
  include: [resolve(__dirname, 'app/**/*.tsx'), resolve(__dirname, 'next-env.d.ts')], exclude: ['node_modules'],
}));
const app = next({ dev: true, dir: __dirname });
let server;
app.prepare().then(async () => {
  const { loadBatch, readPrivateOriginal } = await import('../../../../../../scripts/media-batch-290.mjs');
  const available = [];
  if (process.env.MEDIA_REVIEW_ORIGINALS) for (const { candidate } of loadBatch()) {
    const id = candidate.id.startsWith('research-') ? candidate.id : 'research-' + candidate.id;
    try { readPrivateOriginal(id, process.env.MEDIA_REVIEW_ORIGINALS); available.push(candidate.id); } catch { /* Fail closed. */ }
  }
  process.env.MEDIA_REVIEW_AVAILABLE_IDS = JSON.stringify(available);
  const handle = app.getRequestHandler();
  server = createServer(async (req, res) => {
    if (req.headers.host !== `127.0.0.1:${server.address().port}`) { res.writeHead(403, { 'Cache-Control': 'no-store' }); res.end(); return; }
    const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
    if (pathname.startsWith('/research-originals/')) {
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (!['GET', 'HEAD'].includes(req.method) || !process.env.MEDIA_REVIEW_ORIGINALS || req.headers['sec-fetch-site'] === 'cross-site') { res.writeHead(404); res.end(); return; }
      try {
        const match = /^\/research-originals\/(research-[a-z0-9-]+)\.jpg$/.exec(pathname);
        if (!match) throw Error('Unknown original');
        const bytes = readPrivateOriginal(match[1], process.env.MEDIA_REVIEW_ORIGINALS);
        res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': bytes.length });
        res.end(req.method === 'HEAD' ? undefined : bytes);
      } catch { res.writeHead(404); res.end(); }
      return;
    }
    if (/^\/fonts\/[a-z-]+\.woff2$/.test(pathname)) {
      try { const bytes = readFileSync(resolve(__dirname, '../../../../public', pathname.slice(1))); res.writeHead(200, { 'Content-Type': 'font/woff2' }); res.end(bytes); }
      catch { res.writeHead(404); res.end(); }
      return;
    }
    handle(req, res);
  });
  server.listen(Number(process.env.PORT || 3358), '127.0.0.1', () => {
    const url = `http://127.0.0.1:${server.address().port}`;
    if (process.send) process.send({ url }); else console.log(`Media component preview: ${url}/en`);
  });
}).catch(error => { console.error('Media preview failed to start:', error); process.exit(1); });
process.on('SIGTERM', () => {
  server?.close();
  app.close().finally(() => process.exit(0));
});
