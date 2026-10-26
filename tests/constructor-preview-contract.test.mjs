import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync('apps/web/src/app/[locale]/editorial/constructors/[slug]/page.tsx', 'utf8');

test('constructor preview is explicitly disabled for production and missing opt-in', () => {
  assert.match(source, /process\.env\.NODE_ENV === 'development'/);
  assert.match(source, /process\.env\.GRID_ATLAS_LOCAL_CONSTRUCTOR_PREVIEW === '1'/);
  assert.match(source, /if \(!enabled\(\)\) notFound\(\)/);
  assert.match(source, /robots: \{ index: false, follow: false \}/);
});

test('constructor preview stays behind existing publication and review barriers', () => {
  assert.match(source, /manifest\.publication_status !== 'research_only'/);
  assert.match(source, /subject\.publication !== 'blocked'/);
  assert.match(source, /subject\.human_review !== 'pending'/);
  assert.doesNotMatch(source, /fetch\(|publishApproved|approvalSubmit/);
});

test('review references remain separate from local manuscript prose', () => {
  assert.match(source, /evidenceBoundary/);
  assert.match(source, /Research locators\?/);
  assert.match(source, /return narrative\.trim\(\)/);
});

test('constructor manuscript index remains developer-only and noindex', () => {
  const index = readFileSync('apps/web/src/app/[locale]/editorial/constructors/page.tsx', 'utf8');
  assert.match(index, /process\.env\.NODE_ENV !== 'development'/);
  assert.match(index, /process\.env\.GRID_ATLAS_LOCAL_CONSTRUCTOR_PREVIEW !== '1'/);
  assert.match(index, /robots: \{ index: false, follow: false \}/);
  assert.match(index, /manifest\.subjects\.length !== 12/);
  assert.match(index, /subject\.publication !== 'blocked'/);
  assert.match(index, /subject\.human_review !== 'pending'/);
  assert.match(index, /editorial\/constructors/);
});
