import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const component = readFileSync(new URL('../apps/web/src/components/editorial/circuit-narrative.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../apps/web/src/components/editorial/circuit-history-stories.module.css', import.meta.url), 'utf8');
test('single-featured public histories use a readable full-width evidence layout', () => {
  assert.match(component, /moments\.length === 1 \? styles\.singleMomentGrid/);
  assert.match(styles, /\.singleMomentGrid\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(component, /styles\.momentMeta/);
  assert.match(styles, /\.momentMeta\s*\{/);
});
test('source context stays accessible, bilingual and visible on narrow screens', () => {
  assert.match(component, /styles\.momentEvidence/);
  assert.match(component, /Джерела та контекст/);
  assert.match(component, /Sources and context/);
  assert.match(styles, /\.momentEvidence summary\s*\{[^}]*min-height: 44px/);
  assert.match(styles, /@media \(max-width: 650px\)/);
});
