import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync('.github/workflows/commons-original-review.yml', 'utf8');
const loader = readFileSync('scripts/preview-commons-originals.mjs', 'utf8');

test('original photograph CI runs on exact evidence changes while staying isolated from public media', () => {
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /push:\s*\n\s+paths:/);
  assert.match(workflow, /docs\/media\/commons-original-evidence\.json/);
  assert.match(workflow, /docs\/media\/verified-original-observations\.json/);
  assert.doesNotMatch(workflow, /^\s+pull_request:/m);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /node scripts\/preview-commons-originals\.mjs/);
  // Keep the regression test aligned with immutable Action references.
  assert.match(workflow, /actions\/checkout@[a-f0-9]{40}\s+# v4\.3\.1/);
  assert.match(workflow, /actions\/setup-node@[a-f0-9]{40}\s+# v4\.4\.0/);
  assert.match(workflow, /actions\/upload-artifact@[a-f0-9]{40}\s+# v4\.6\.2/);
  assert.doesNotMatch(workflow, /uses:\s+actions\/[\w-]+@v\d+/);
  assert.match(workflow, /persist-credentials:\s+false/);
  assert.match(workflow, /retention-days: 7/);
  assert.match(workflow, /grid-atlas-research-photo-contact-sheet/);
  assert.match(workflow, /steps\.originals\.outcome != 'success'/);
  assert.match(loader, /\.grid-atlas', 'media-review'/);
  assert.doesNotMatch(workflow, /publication\.json|apps\/web\/public\/media/);
});
