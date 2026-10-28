import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('all 33 circuits, 76 events and 10 narrative angles pass the staging audit without publication', () => {
 const result=spawnSync(process.execPath,['scripts/check-circuit-staging.mjs'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr || result.stdout);
 assert.match(result.stdout,/33 circuits; 76 events; 10 additional angles/);
 assert.match(result.stdout,/0 publishable stories/);
});
