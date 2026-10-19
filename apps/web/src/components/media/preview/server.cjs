/* Local-only interactive Next.js component preview. Not a public application route. */
const { createServer } = require('node:http');
const { mkdirSync, writeFileSync } = require('node:fs');
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
app.prepare().then(() => {
  server = createServer(app.getRequestHandler());
  server.listen(Number(process.env.PORT || 3358), '127.0.0.1', () => {
    const url = `http://127.0.0.1:${server.address().port}`;
    if (process.send) process.send({ url }); else console.log(`Media component preview: ${url}/en`);
  });
}).catch(error => { console.error('Media preview failed to start:', error); process.exit(1); });
process.on('SIGTERM', () => {
  server?.close();
  app.close().finally(() => process.exit(0));
});
