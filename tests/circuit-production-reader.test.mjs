import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { circuitReadingModel } from '../apps/web/src/components/editorial/circuit-reader-model.ts';
import { readCircuitPublication } from '../apps/web/src/components/media/circuit-publication.ts';
import { CIRCUIT_READER_BATCH, isCircuitReaderBatch } from '../apps/web/src/components/editorial/circuit-reader-cohort.ts';
import { mediaFingerprint } from '../apps/web/src/components/media/registry.ts';
import fixture from '../apps/api/test/support/circuit-reader-media.cjs';

const layouts = [{ id: '1', external_layout_id: 'fixture-old', length_km: '4.185', turns: 14 }, { id: '2', external_layout_id: 'fixture-new', length_km: '3.1', turns: 12 }];
const history = [{ race_id: '1', season_year: 1967, round: 1, winners: [] }, { race_id: '2', season_year: 1970, round: 2, winners: [] }];
const events = [{ race_id: '1', external_race_id: 'external-1', season_year: 1967, round: 1, layout_id: '1', external_layout_id: 'fixture-old', course_length_km: '4.422', turns: 8 },
  { race_id: '2', external_race_id: 'external-2', season_year: 1970, round: 2, layout_id: '2', external_layout_id: 'fixture-new', course_length_km: '3.1', turns: 12 }];

test('reader joins exact historical events without overwriting layout/event discrepancies', () => {
  const model = circuitReadingModel(history, layouts, events, '1');
  assert.equal(model.selected.race.season_year, 1967);
  assert.equal(model.selected.layout.external_layout_id, 'fixture-old');
  assert.equal(model.selected.measurementsDiffer, true);
  assert.equal(model.selected.layout.turns, 14);
  assert.equal(model.selected.event.turns, 8);
  assert.deepEqual(model.chapters.map(chapter => chapter.layout.external_layout_id), ['fixture-old', 'fixture-new']);
  assert.deepEqual(model.years, [1967, 1970]);
});

test('wrong round/year, ambiguous technical events and missing layout never borrow another period', () => {
  for (const changed of [{ ...events[0], season_year: 1970 }, { ...events[0], round: 2 }]) {
    const model = circuitReadingModel(history, layouts, [changed, events[1]], '1');
    assert.equal(model.selected.event, null); assert.equal(model.selected.layout, null);
  }
  const missing = circuitReadingModel(history, layouts, [{ ...events[0], layout_id: null }, events[1]], '1');
  assert.equal(missing.selected.layout, null);
  assert.equal(circuitReadingModel(history, layouts, [{ ...events[0], external_layout_id: 'wrong-venue' }, events[1]], '1').selected.layout, null);
  assert.equal(circuitReadingModel(history, layouts, [events[0], events[0], events[1]], '1').selected.event, null);
  const unknown = circuitReadingModel(history, layouts, events, 'not-this-circuit');
  assert.equal(unknown.selected, null); assert.equal(unknown.unknownRace, true);
});

test('empty and single-race histories remain useful without duplicate or invented milestones', () => {
  const empty = circuitReadingModel([], layouts, []);
  assert.deepEqual(empty.journey, []); assert.deepEqual(empty.chapters, []); assert.equal(empty.selected, null);
  const one = circuitReadingModel([history[0], history[0]], layouts, [events[0]]);
  assert.equal(one.records.length, 1); assert.equal(one.journey.length, 1);
});

test('live file withdrawal, stale evidence, research lane and invalid bytes fail closed without rebuilding', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'circuit-publication-unit-'));
  const path = join(folder, 'publication.json');
  await mkdir(join(folder, 'media'));
  await writeFile(join(folder, 'media/synthetic-test.svg'), fixture.svg);
  const asset = fixture.syntheticCircuitMedia('synthetic-test', 'fixture-circuit', '/media/synthetic-test.svg');
  const write = async (record, lane = 'publication') => writeFile(path, JSON.stringify({ schema_version: 2, lane, assets: [record] }));
  const select = () => readCircuitPublication('fixture-circuit', [], [], path, '2026-11-05', folder);
  try {
    await write(asset); assert.equal((await select()).length, 1, 'prove the same real file is eligible before each negative case');
    for (const mutate of [row => { row.status = 'withdrawn'; }, row => { row.review = null; }, row => { row.caption.en += ' Changed.'; },
      row => { row.content_sha256 = null; }, row => { row.subject.id = 'wrong-venue'; }]) {
      const changed = structuredClone(asset); mutate(changed); await write(changed); assert.deepEqual(await select(), []);
      await write(asset); assert.equal((await select()).length, 1);
    }
    await write(asset, 'candidates'); assert.deepEqual(await select(), []);
    await write(asset); await writeFile(join(folder, 'media/synthetic-test.svg'), fixture.svg + 'changed bytes');
    assert.deepEqual(await select(), [], 'reviewed metadata alone cannot approve changed original bytes');
    await writeFile(join(folder, 'media/synthetic-test.svg'), fixture.svg); assert.equal((await select()).length, 1);
    await writeFile(path, '{invalid'); assert.deepEqual(await select(), []);
    const diagram = structuredClone(asset); diagram.kind = 'circuit-diagram';
    diagram.layout = { id: 'fixture-old', race_ids: ['external-1'], source_url: 'https://example.org/synthetic-mapping', source_revision: 'synthetic-v1' };
    diagram.review.payload_sha256 = mediaFingerprint(diagram);
    await write(diagram);
    assert.equal((await readCircuitPublication('fixture-circuit', layouts, events, path, '2026-11-05', folder)).length, 1);
    assert.deepEqual(await readCircuitPublication('fixture-circuit', layouts, [{ ...events[0], external_layout_id: 'wrong-venue' }], path, '2026-11-05', folder), []);
    assert.deepEqual(await readCircuitPublication('fixture-circuit', layouts, [{ ...events[0], external_race_id: '1' }], path, '2026-11-05', folder), [], 'internal IDs cannot substitute for canonical F1DB IDs');
  } finally { await rm(folder, { recursive: true, force: true }); }
});

test('approved local media works for both repository-root and apps/web production starts', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'circuit-start-directory-'));
  const web = join(folder, 'apps/web');
  try {
    await mkdir(join(web, 'src/components/media'), { recursive: true });
    await mkdir(join(web, 'public/media'), { recursive: true });
    await writeFile(join(web, 'public/media/test.svg'), fixture.svg);
    const asset = fixture.syntheticCircuitMedia('synthetic-directory-test', 'fixture-circuit', '/media/test.svg');
    await writeFile(join(web, 'src/components/media/publication.json'), JSON.stringify({ schema_version: 2, lane: 'publication', assets: [asset] }));
    const module = new URL('../apps/web/src/components/media/circuit-publication.ts', import.meta.url).href;
    const script = `import { readCircuitPublication } from ${JSON.stringify(module)}; console.log((await readCircuitPublication('fixture-circuit', [], [])).length);`;
    for (const cwd of [folder, web]) assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', script], { cwd, encoding: 'utf8' }).trim(), '1');
  } finally { await rm(folder, { recursive: true, force: true }); }
});

test('reader scope is exactly the requested twenty and does not enroll the other fifty-eight', () => {
  assert.deepEqual([...CIRCUIT_READER_BATCH], ['interlagos', 'montreal', 'hungaroring', 'zandvoort', 'melbourne', 'bahrain', 'shanghai', 'sepang', 'imola', 'spielberg', 'catalunya', 'paul-ricard', 'mexico-city', 'hockenheimring', 'nurburgring', 'magny-cours', 'watkins-glen', 'buenos-aires', 'kyalami', 'indianapolis']);
  assert.equal(CIRCUIT_READER_BATCH.every(isCircuitReaderBatch), true);
  for (const id of ['monza', 'silverstone', 'dallas', '', 'Interlagos']) assert.equal(isCircuitReaderBatch(id), false);
});
