/* Development/test-only static React preview. No production app route is registered. */
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const { resolve, join, extname } = require('node:path');
const { createRequire } = require('node:module');
const Module = require('node:module');

const componentRoot = resolve(__dirname, '..');
const webRequire = createRequire(resolve(__dirname, '../../../../package.json'));
const ts = webRequire('typescript');
const React = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');

// Resolve only this isolated preview's TSX and CSS; no bundler or extra packages.
for (const extension of ['.ts', '.tsx']) {
  Module._extensions[extension] = (module, filename) => {
    if (!filename.startsWith(componentRoot + '/')) throw new Error('Preview loader is scoped to discovery components');
    const result = ts.transpileModule(readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
      fileName: filename,
    });
    module._compile(result.outputText, filename);
  };
}
Module._extensions['.css'] = (module, filename) => {
  if (filename !== join(componentRoot, 'discovery.module.css')) throw new Error('Unexpected preview stylesheet');
  module.exports = Object.fromEntries([...readFileSync(filename, 'utf8').matchAll(/\.([a-zA-Z][\w-]*)/g)].map(([, name]) => [name, `atlas-${name}`]));
};
const { ComponentPreview } = require('./fixtures.tsx');
const componentCss = readFileSync(join(componentRoot, 'discovery.module.css'), 'utf8').replace(/\.([a-zA-Z][\w-]*)/g, '.atlas-$1');
// Include existing app CSS to catch cascade collisions before Agent 1 integrates.
const appCss = readFileSync(resolve(componentRoot, '../../app/styles.css'), 'utf8');
const previewCss = `
  body{background:#0d1116;color:#eff2f4;margin:0;font-family:Arial,Helvetica,sans-serif;line-height:1.5}
  .preview-header,.preview-footer{padding:24px max(5vw,20px);border-bottom:1px solid #4b5864;font-size:12px;letter-spacing:.08em}
  .preview-header{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;font-weight:700}
  .preview-header nav{display:flex;flex-wrap:wrap;gap:16px}.preview-header a{display:inline-flex;align-items:center;min-height:44px}
  .preview-main{max-width:1160px;margin:auto;padding:64px max(5vw,20px)}
  .preview-kicker{font-size:11px;letter-spacing:.12em;color:#ff7968;font-weight:700}
  .preview-main h1{font-size:clamp(40px,6vw,76px);letter-spacing:-.055em;line-height:1.05;margin:20px 0}
  .preview-intro{font-size:20px;color:#b4bec8;max-width:52ch}
  .preview-section{margin-top:56px}.preview-section h2{font-size:24px;margin:0 0 20px;letter-spacing:-.025em}
  .preview-footer{color:#b4bec8;border-top:1px solid #4b5864;border-bottom:0;letter-spacing:0}
`;

const destinations = new Map([
  ['/preview/driver-a', 'Fixture Driver A'], ['/preview/constructor-a', 'Fixture Constructor A'],
  ['/preview/constructor-b', 'Fixture Constructor B'], ['/preview/season-2001', '2001 fixture season'],
  ['/preview/coverage', 'Fixture coverage note'],
]);

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const variant = url.searchParams.get('variant') || 'default';
  if (url.pathname === '/styles.css') {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    return res.end(appCss + '\n' + componentCss + '\n' + previewCss);
  }
  if (extname(url.pathname)) { res.writeHead(404); return res.end(); }
  const destination = destinations.get(url.pathname);
  if (url.pathname !== '/' && !destination) { res.writeHead(404); return res.end('Unknown fixture'); }
  const body = destination
    ? React.createElement('main', { className: 'preview-main' }, React.createElement('p', null, 'SYNTHETIC FIXTURE DESTINATION'), React.createElement('h1', null, destination), React.createElement('a', { href: '/' }, 'Back to component preview'))
    : React.createElement(ComponentPreview, { variant });
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'self'; script-src 'none'; style-src 'self'; object-src 'none'; base-uri 'none'" });
  res.end('<!doctype html>' + renderToStaticMarkup(React.createElement('html', { lang: variant === 'fr' ? 'fr' : 'en' },
    React.createElement('head', null, React.createElement('meta', { charSet: 'utf-8' }), React.createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }), React.createElement('title', null, 'Grid Atlas component preview'), React.createElement('link', { rel: 'stylesheet', href: '/styles.css' })),
    React.createElement('body', null, body))));
});

server.listen(Number(process.env.PORT || 3354), '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}`;
  if (process.send) process.send({ url });
  else console.log(`Discovery component preview: ${url}`);
});
process.on('SIGTERM', () => server.close(() => process.exit(0)));
