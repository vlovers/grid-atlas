import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fork } from 'node:child_process';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { driverArchiveOverview, raceMoments, teamEras, seasonMilestones, seasonPoints, timeMachinePath } from '../apps/web/src/components/driver/showcase-model.ts';
import { showcaseCopy } from '../apps/web/src/components/driver/showcase-copy.ts';
import { renderReview, reviewChapters, startReview } from '../scripts/preview-story-review.mjs';

const race = (id, year, round) => ({ id, year, round, date: null, circuit_id: null, name: `Synthetic race ${id}` });
const row = (year, related_id = '10', round = 1) => ({ year, related_id, related_name: `Constructor ${related_id}`,
  first_race: race(`${year}1`, year, round), last_race: race(`${year}2`, year, round + 1),
  result_entries: 2, races: 2, winning_races: 0, recorded_points: null, points_missing: 2 });

test('team eras preserve gaps, returns and multiple constructors in the same season', () => {
  const rows = [row(1954), row(1950), row(1951), row(1954, '20', 3), row(1956), row(1957)];
  const before = JSON.stringify(rows);
  const eras = teamEras(rows);
  assert.deepEqual(eras.map(e => [e.id, e.years]), [['10', [1950, 1951]], ['10', [1954]], ['20', [1954]], ['10', [1956, 1957]]]);
  assert.equal(JSON.stringify(rows), before);
  assert.equal(eras[0].rows[0].first_race.id, '19501');
});

test('same-year team ordering follows observed rounds rather than constructor IDs', () => {
  assert.deepEqual(teamEras([row(1950, '1', 7), row(1950, '99', 1)]).map(e => e.id), ['99', '1']);
  assert.deepEqual(teamEras([]), []);
});

test('race cards deduplicate milestones, preserve all result entries, and use season/round rather than ID or nullable date', () => {
  const first = { race: race('999', 1950, 1), results: [{ position_text: '1', shared_car: true }, { position_text: 'DNS', shared_car: false }] };
  const last = { race: race('1', 1951, 2), results: [{ position_text: 'DNF', shared_car: false }] };
  const moments = raceMoments({ first_appearance: first, first_win: first, last_win: first, last_appearance: last });
  assert.equal(moments.length, 2);
  assert.deepEqual(moments[0].labels, ['first_appearance', 'first_win', 'last_win']);
  assert.equal(moments[0].results.length, 2);
  assert.equal(moments[1].race.id, '1');
  assert.deepEqual(raceMoments({ first_appearance: null, first_win: null, last_win: null, last_appearance: null }), []);
});

test('season highlights rank observed winning entries without inferring championships or sorting by points', () => {
  const seasons = [{ year: 1953, wins: 3, points: '200' }, { year: 1950, wins: 3, points: '4' },
    { year: 1952, wins: 4, points: '1' }, { year: 1951, wins: 0, points: '1000' }, { year: 1954, wins: 2, points: '9' }];
  assert.deepEqual(seasonMilestones(seasons).map(s => s.year), [1952, 1950, 1953]);
  assert.equal(seasons[0].year, 1953);
  assert.deepEqual(seasonMilestones([{ year: 1950, wins: 0 }]), []);
});

test('Time Machine uses actual distinct recorded years and exact driver ID; one-year careers have no invalid comparison', () => {
  assert.equal(timeMachinePath('9007199254740993', [1960, 1950, 1960]), '/time-machine?kind=driver&id=9007199254740993&from=1950&to=1960');
  assert.equal(timeMachinePath('1', [1950, 1950]), null);
  assert.equal(timeMachinePath('1', []), null);
});

test('all-missing points remain unknown instead of the legacy season aggregate zero, and partial sums are labeled', () => {
  assert.deepEqual(seasonPoints({ year: 1950, points: '0' }, [row(1950)]), { value: null, partial: true });
  const partial = { ...row(1950), recorded_points: '4.50', points_missing: 1 };
  assert.deepEqual(seasonPoints({ year: 1950, points: '4.50' }, [partial]), { value: '4.50', partial: true });
  assert.deepEqual(seasonPoints({ year: 1950, points: '0.00' }, [{ ...partial, recorded_points: '0.00', points_missing: 0 }]), { value: '0.00', partial: false });
});

test('UK/EN copy has matching nonempty keys and retains explicit championship, contract and publication limits', () => {
  assert.deepEqual(Object.keys(showcaseCopy.uk).sort(), Object.keys(showcaseCopy.en).sort());
  for (const copy of Object.values(showcaseCopy)) assert.ok(Object.values(copy).every(v => typeof v === 'string' && v.trim()));
  assert.match(showcaseCopy.en.titleGapNote, /not available.*cannot establish/);
  assert.match(showcaseCopy.uk.unpublishedNote, /чернетки залишаються приватними/);
  assert.match(showcaseCopy.en.teamNote, /not contract or entrant histories/);
});

test('public driver implementation imports neither research/candidate manifests nor a fake story adapter', () => {
  const sources = ['apps/web/src/app/[locale]/drivers/[id]/page.tsx', 'apps/web/src/components/driver/driver-showcase.tsx']
    .map(path => readFileSync(path, 'utf8')).join('\n');
  assert.doesNotMatch(sources, /docs\/editorial|candidates\.json|readFileSync|ApprovedStory|status:\s*['"]published|ayrton-senna|drivers\/72/);
  assert.match(sources, /getPublishedArticle/);
  assert.match(sources, /media\/publication\.json/);
});

const manuscript = readFileSync('docs/editorial/stories/senna-prost-rivalry.en-uk.draft.md', 'utf8');
test('local research reader keeps six locale-specific chapters and escapes manuscript markup and unresolved links', () => {
  for (const locale of ['uk', 'en']) assert.equal(reviewChapters(manuscript, locale).length, 6);
  const html = renderReview('## EN — test\n### Chapter\n<script>alert(1)</script> [Unresolved](/en/drivers/guess)\n## Source and claim register\nEvidence', 'en', '/review/token');
  assert.match(html, /UNPUBLISHED RESEARCH DRAFT · NOT APPROVED/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|href="\/en\/drivers\/guess"/);
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.throws(() => startReview(), /acknowledge-unreviewed-draft/);
  assert.throws(() => startReview({ acknowledged: true, port: -1 }), /Port/);
});

test('local preview requires its ephemeral path, rejects foreign Host and public paths, and never caches drafts', { timeout: 10000 }, async t => {
  const child = fork('scripts/preview-story-review.mjs', ['--acknowledge-unreviewed-draft', '--port', '0'], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  t.after(async () => { if (child.exitCode === null) { const closed = once(child, 'exit'); child.kill('SIGTERM'); await closed; } });
  const [{ url }] = await once(child, 'message');
  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
  assert.match(await response.text(), /UNPUBLISHED RESEARCH DRAFT/);
  const origin = new URL(url).origin;
  for (const path of ['/', '/sitemap.xml', '/review/wrong/en', '/api/stories', '/en/stories/senna-prost'])
    assert.equal((await fetch(origin + path)).status, 404);
  const foreignHostStatus = await new Promise((resolve, reject) => {
    const request = httpRequest(url, { headers: { Host: 'attacker.example' } }, response => {
      response.resume(); resolve(response.statusCode);
    });
    request.on('error', reject); request.end();
  });
  assert.equal(foreignHostStatus, 404);
  assert.equal((await fetch(url, { method: 'POST' })).status, 404);
});

test('archive synopsis generates bilingual verified-result descriptions, not championship claims', () => {
  const driver = { id:'72', name:'Test Driver', external_id:'test-driver' };
  const first = {race: race('100',1980,1),results:[]};
  const winning = {race: race('101',1981,2),results:[]};
  const career = {
    summary:{races:3,first_season:1980,last_season:1982,winning_races:1,podium_result_entries:2},
    participation:[row(1980,'1'),row(1981,'1'),row(1982,'2')],
    milestones:{first_appearance:first,first_win:winning}
  };
  const before=JSON.stringify(career);
  const en=driverArchiveOverview(driver,career,'en');
  const uk=driverArchiveOverview(driver,career,'uk');
  assert.match(en.paragraphs[0],/3 distinct races.*1980–1982/);
  assert.match(en.paragraphs[1],/Constructor 1, Constructor 2/);
  assert.match(uk.paragraphs[0],/3 окремих гонок/);
  assert.equal(en.firstRace.race.id,'100');
  assert.equal(en.firstWin.race.id,'101');
  assert.equal(JSON.stringify(career),before);
  assert.ok(!en.paragraphs.join(' ').includes('champion'));
  assert.equal(driverArchiveOverview(driver,null,'en'),null);
  assert.equal(driverArchiveOverview(driver,{...career,summary:{...career.summary,races:0}},'en'),null);
});
