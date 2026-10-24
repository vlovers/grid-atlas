import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../apps/web/src/lib/archive-context.ts', import.meta.url), 'utf8');
test('archive return targets only permit local profile paths', () => {
  assert.match(source, /drivers\|constructors\|circuits/);
  assert.match(source, /value\.includes\('%'\)/);
  assert.match(source, /value\.includes\('\\\\'\)/);
  assert.match(source, /value\.includes\('\/\/'\)/);
  assert.match(source, /encodeURIComponent\(returnTo\)/);
});
test('season and race dossiers expose accessible return navigation', () => {
  for (const route of ['seasons/[year]', 'races/[id]']) {
    const page = readFileSync(new URL('../apps/web/src/app/[locale]/' + route + '/page.tsx', import.meta.url), 'utf8');
    assert.match(page, /data-testid="archive-return-context"/);
    assert.match(page, /safeArchiveReturnTarget/);
  }
});
