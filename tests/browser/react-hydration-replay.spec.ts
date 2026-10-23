import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const requireNext = createRequire(resolve('apps/web/package.json'));
const nextRoot = requireNext.resolve('next/package.json').replace(/package\.json$/, '');

for (const suffix of ['', '-experimental'] as const) {
  for (const mode of ['production', 'development'] as const) {
    const react = `react${suffix}`;
    const dom = `react-dom${suffix}`;
    const scheduler = `scheduler${suffix}`;
    test(`${mode}${suffix}: replaying a suspended host preserves the SSR node`, async ({ page }) => {
      const sources = Object.fromEntries([
        [react, `${react}/cjs/react.${mode}.js`],
        [dom, `${dom}/cjs/react-dom.${mode}.js`],
        [`${dom}/client`, `${dom}/cjs/react-dom-client.${mode}.js`],
        [scheduler, `${scheduler}/cjs/scheduler.${mode}.js`],
      ].map(([name, file]) => [`next/dist/compiled/${name}`, readFileSync(`${nextRoot}dist/compiled/${file}`, 'utf8')]));
      await page.setContent('<div id="root"><section id="target"><header>Recorded circuit</header></section></div>');
      const result = await page.evaluate(async ({ sources, mode, suffix }) => {
        const cache: Record<string, { exports: Record<string, unknown> }> = {};
        const load = (name: string) => {
          if (!cache[name]) {
            const module = { exports: {} };
            cache[name] = module;
            new Function('require', 'module', 'exports', 'process', sources[name])(load, module, module.exports, { env: { NODE_ENV: mode } });
          }
          return cache[name].exports;
        };
        // The Next App Router uses these vendored runtimes, not workspace react-dom.
        const React = load(`next/dist/compiled/react${suffix}`) as typeof import('react');
        const { hydrateRoot } = load(`next/dist/compiled/react-dom${suffix}/client`) as typeof import('react-dom/client');
        const target = document.getElementById('target');
        const errors: string[] = [];
        let initializations = 0;
        let complete: () => void;
        const hydrated = new Promise<void>(resolve => { complete = resolve; });
        const child = React.createElement('header', null, 'Recorded circuit');
        const listeners: ((value: { default: React.ReactElement }) => void)[] = [];
        const chunk = {
          status: 'pending',
          value: undefined as undefined | { default: React.ReactElement },
          then(resolve: (value: { default: React.ReactElement }) => void) { listeners.push(resolve); },
        };
        const lazyNode = React.lazy(() => {
          initializations++;
          queueMicrotask(() => {
            chunk.status = 'fulfilled';
            chunk.value = { default: child };
            listeners.forEach(resolve => resolve(chunk.value!));
          });
          return chunk as unknown as Promise<{ default: React.ComponentType }>;
        });
        function App() {
          React.useEffect(() => { complete(); }, []);
          // Flight represents deferred server content as lazy nodes in children.
          return React.createElement('section', { id: 'target' }, lazyNode as unknown as React.ReactNode);
        }
        React.startTransition(() => hydrateRoot(document.getElementById('root')!, React.createElement(App), {
          onRecoverableError(error) { errors.push((error as Error).message); },
        }));
        await hydrated;
        return { errors, initializations, reused: document.getElementById('target') === target };
      }, { sources, mode, suffix });
      expect(result).toEqual({ errors: [], initializations: 1, reused: true });
    });
  }
}
