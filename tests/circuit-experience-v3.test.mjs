import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateCornerGuides, candidateCircuitNarratives } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { cornerGuideFor, numberedCorners } from '../apps/web/src/components/editorial/circuit-corner-model.ts';
import { isCircuitEditionApproved, circuitEditionDigest } from '../apps/web/src/components/editorial/circuit-release.ts';
import { renderCircuitReview, startCircuitReview } from '../scripts/preview-circuit-v3.mjs';

test('numbered turns are complete and never confused with distinct named sections', () => {
  assert.ok(candidateCornerGuides.length >= 16, 'do not regress already sourced circuit guides');
  assert.equal(new Set(candidateCornerGuides.map(guide => guide.circuit_id)).size, candidateCornerGuides.length, 'no duplicate circuit guides');
  for (const guide of candidateCornerGuides) {
    const turns = numberedCorners(guide);
    assert.deepEqual(turns.map(turn => turn.number),Array.from({length:guide.numbered_turns},(_,index)=>index+1));
    assert.ok(turns.every(turn => turn.layout_id === guide.layout_id && turn.sources.length >= 2));
  }
  for (const id of ['austin','bahrain','interlagos','monaco','monza','silverstone','spa-francorchamps','suzuka']) {
    assert.ok(candidateCornerGuides.some(guide => guide.circuit_id === id), id + ': legacy guide missing');
  }
  const monaco = candidateCornerGuides.find(guide=>guide.circuit_id==='monaco');
  const turns = numberedCorners(monaco);
  assert.equal(turns.length,19);
  assert.equal(turns.find(turn=>turn.number===17).name,null);
  // Shared complex names must remain shared, but each bend now has its own focus target and copy.
  assert.equal(turns[9].name, turns[10].name);
  assert.equal(turns[12].name, turns[15].name);
  assert.notEqual(turns[9].section_id, turns[10].section_id);
  assert.notEqual(turns[12].section_id, turns[15].section_id);
  assert.equal(new Set(turns.map(turn => turn.section_id)).size, 19);
  const spa = candidateCornerGuides.find(guide => guide.circuit_id === 'spa-francorchamps');
  assert.equal(new Set(numberedCorners(spa).map(turn => turn.section_id)).size, 19);
});

test('pending research cannot appear through matching layouts or a fabricated runtime flag', () => {
  process.env.GRID_ATLAS_CIRCUIT_PREVIEW='true';
  try {
    for(const guide of candidateCornerGuides) {
      assert.equal(isCircuitEditionApproved(guide.circuit_id),false);
      assert.equal(cornerGuideFor(guide.circuit_id,[guide.layout_id]),null);
      assert.equal(cornerGuideFor(guide.circuit_id,['monaco-1']),null);
      assert.match(circuitEditionDigest(guide.circuit_id),/^[a-f0-9]{64}$/);
    }
  } finally { delete process.env.GRID_ATLAS_CIRCUIT_PREVIEW; }
});

test('original five collections keep five sourced stories while new historical guides add two or more', () => {
  const original = new Set(['monaco','spa-francorchamps','monza','suzuka','silverstone']);
  assert.ok(candidateCircuitNarratives.length>=11);
  for(const circuit of candidateCircuitNarratives) {
    assert.ok(circuit.moments.length >= (original.has(circuit.circuit_id) ? 5 : 2), circuit.circuit_id);
    assert.equal(new Set(circuit.moments.map(moment=>moment.id)).size,circuit.moments.length);
    for(const moment of circuit.moments) {
      assert.ok(Number.isInteger(moment.year) && moment.year >= 1900 && moment.year <= 2026, `${circuit.circuit_id}: invalid event year ${moment.year}`);
      assert.ok(moment.title.en && moment.title.uk && moment.text.en && moment.text.uk);
      assert.match(moment.source,/^https:\/\//);
      assert.ok(moment.locator && moment.criterion);
      assert.equal(moment.review_status,'independent_review_pending');
    }
  }
});

test('private review uses existing opt-in transport, shows noindex and names all 19 Monaco numbers', async () => {
  assert.throws(()=>startCircuitReview({port:0}),/acknowledge/);
  const html=renderCircuitReview('uk','/review/test');
  assert.match(html,/НЕОПУБЛІКОВАНА ЧЕРНЕТКА/);
  assert.match(html,/noindex,nofollow,noarchive/);
  assert.match(html,/T19/);
  assert.match(html,/Без окремої назви/);
  assert.doesNotMatch(html,/stroke-width:8!important/);
});


test('seven unapproved historic route studies remain research-only and unpublished', async () => {
  const { readFileSync } = await import('node:fs');
  const research = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  const component = readFileSync(new URL('../apps/web/src/components/editorial/circuit-corner-guide.tsx', import.meta.url), 'utf8');
  const pending = ['ain-diab','clermont-ferrand','dallas','detroit','pescara','porto','sebring'];
  assert.doesNotMatch(component, /historicRoutes/);
  assert.doesNotMatch(component, /const historicRoute = historicRoutes\.circuits\.find/);
  const morocco = research.circuits.find(c => c.circuit_id === 'ain-diab');
  const brooks = morocco.sections.find(section => section.label.en === "When Brooks's Vanwall failed");
  assert.ok(brooks?.description.en.includes('29 completed laps'));
  assert.ok(brooks?.description.en.includes('lap 31'));
  assert.ok(brooks?.description.uk.includes('29 завершених кіл'));
  assert.ok(brooks?.claim_review_note.includes('Verify lap-count convention'));
  assert.equal(brooks.turn_numbers, null);
  assert.ok(brooks.source_urls.some(url => url.includes('formula1.com/en/results/1958')));
  assert.ok(brooks.source_urls.some(url => url.includes('motorsportmagazine.com/articles')));
  for (const [id, count, year] of [['ain-diab', 18, 1958], ['clermont-ferrand', 48, 1972], ['sebring', 17, 1959]]) {
    const record = research.circuits.find(c => c.circuit_id === id);
    const review = record?.layout_evidence_review;
    assert.equal(record.independent_numbering_verified, false);
    assert.equal(review.archive_turn_count, count);
    assert.equal(review.period_layout_year, year);
    assert.match(review.crosswalk_status, /unverified_apex_numbers|not_apex_numbers/);
    assert.ok(review.evidence.length >= 2);
    assert.ok(review.evidence.every(item => /^https:\/\//.test(item.url) && item.supports_apex_numbering === false && item.claim.length > 40));
    assert.ok(record.sections.every(section => section.turn_numbers === null));
    assert.equal(isCircuitEditionApproved(id), false);
  }
  for (const id of ['dallas', 'detroit', 'pescara', 'porto']) {
    const record = research.circuits.find(c => c.circuit_id === id);
    const review = record.layout_evidence_review;
    assert.equal(record.independent_numbering_verified, false);
    assert.ok(review.evidence.length >= 2);
    assert.ok(review.evidence.every(item => item.supports_apex_numbering === false && /^https:\/\//.test(item.url)));
    assert.ok(record.sections.every(item => item.turn_numbers === null));
    assert.match(review.media_rights, /linked only/);
    assert.equal(isCircuitEditionApproved(id), false);
  }
  assert.equal(research.circuits.find(c => c.circuit_id === 'dallas').layout_evidence_review.archive_turn_count, 23);
  assert.equal(research.circuits.find(c => c.circuit_id === 'porto').layout_evidence_review.archive_turn_count, 19);
  assert.ok(research.circuits.find(c => c.circuit_id === 'dallas').layout_evidence_review.evidence.some(item => item.claim.includes('24')));
  assert.ok(research.circuits.find(c => c.circuit_id === 'porto').layout_evidence_review.evidence.some(item => item.claim.includes('14')));
  const ainDiab = research.circuits.find(c => c.circuit_id === 'ain-diab');
  assert.equal(ainDiab.layout_evidence_review.archive_turn_count, 18);
  assert.equal(ainDiab.layout_evidence_review.summary_turn_count, 15);
  assert.ok(ainDiab.layout_evidence_review.count_discrepancy.includes('15'));
  assert.ok(ainDiab.layout_evidence_review.count_discrepancy.includes('18'));
  for (const id of ['detroit', 'pescara', 'sebring']) {
    const review = research.circuits.find(c => c.circuit_id === id).layout_evidence_review;
    assert.ok(review.evidence.some(entry => entry.type.includes('layout') || entry.type.includes('route') || entry.type.includes('chicane')));
    assert.ok(review.evidence.every(entry => entry.supports_apex_numbering === false));
  }
  assert.match(research.circuits.find(c => c.circuit_id === 'detroit').layout_evidence_review.layout_length_discrepancy, /2\\.590 mi/);
  assert.match(research.circuits.find(c => c.circuit_id === 'pescara').layout_evidence_review.layout_version_caveat, /1957/);
  assert.match(research.circuits.find(c => c.circuit_id === 'sebring').layout_evidence_review.layout_version_caveat, /1959/);
  assert.ok(ainDiab.layout_evidence_review.evidence.some(item => item.type === 'independent_historical_corner_count' && item.claim.includes('18 corners') && item.supports_apex_numbering === false));
  assert.match(ainDiab.layout_evidence_review.count_reconciliation, /15/);
  const portoRoute = research.circuits.find(c => c.circuit_id === 'porto').layout_evidence_review;
  assert.equal(portoRoute.route_order_confirmed.length, 6);
  assert.match(portoRoute.route_order_scope, /not FIA corners/);
  assert.ok(portoRoute.evidence.some(item => item.type === 'contemporary_route_order' && item.supports_apex_numbering === false));
  const charade = research.circuits.find(c => c.circuit_id === 'clermont-ferrand');
  assert.ok(charade.layout_evidence_review.evidence.some(item => item.claim.includes('51')));
  assert.ok(charade.layout_evidence_review.evidence.some(item => item.type === 'venue_history' && item.claim.includes('51 bends')));
  assert.ok(charade.layout_evidence_review.discrepancy_resolution.includes('48'));
  assert.ok(charade.layout_evidence_review.discrepancy_resolution.includes('51'));
  assert.equal(charade.layout_evidence_review.photo_index_is_turn_numbering, false);
  assert.ok(charade.layout_evidence_review.evidence.some(item => item.type === 'photo_position_index_not_turn_numbers' && !item.supports_apex_numbering));
  const historicEnriched = { 'ain-diab': 13, 'clermont-ferrand': 8 };
  for (const [id, count] of Object.entries(historicEnriched)) {
    const circuit = research.circuits.find(c => c.circuit_id === id);
    assert.ok(circuit.sections.length >= count, id + ': historic scene floor must not regress');
    assert.deepEqual(circuit.sections.map(section => section.reading_order), Array.from({ length: circuit.sections.length }, (_, i) => i + 1));
    assert.ok(circuit.sections.every(section => section.turn_numbers === null && section.review_status === 'pending'));
    assert.ok(circuit.sections.every(section => section.source_urls.every(url => /^https:\/\//.test(url))));
  }
  const expanded = {dallas:13, detroit:10, pescara:7, porto:7, sebring:10};
  assert.equal(Object.values(expanded).reduce((a,b)=>a+b,0), 47);
  for (const [id, count] of Object.entries(expanded)) {
    const record = research.circuits.find(c => c.circuit_id === id);
    assert.ok(record.sections.length >= count, id + ': original historical sections preserved');
    assert.ok(record.original_research_document?.endsWith('.json'));
    assert.deepEqual(record.sections.map(s => s.reading_order), Array.from({length:record.sections.length}, (_,i)=>i+1));
  }
  for (const id of pending) {
    const circuit = research.circuits.find(c => c.circuit_id === id);
    assert.ok(circuit, id + ': missing historical route');
    assert.ok(!candidateCornerGuides.some(g => g.circuit_id === id), id + ': a numbered guide must not be inferred from unnumbered research');
    assert.equal(circuit.independent_numbering_verified, false);
    assert.ok(circuit.sections.length >= 2);
    for (const section of circuit.sections) {
      assert.ok(section.label.en.trim() && section.label.uk.trim(), id + ': bilingual title');
      assert.ok(section.description.en.trim() && section.description.uk.trim(), id + ': bilingual copy');
      assert.equal(section.turn_numbers, null, id + ': no fabricated turn mapping');
      assert.ok(section.source_urls.length >= 1 && section.source_urls.every(url => /^https:\/\//.test(url)));
    }
    assert.equal(isCircuitEditionApproved(id), false, id + ': no publication approval');
  }
});

test('source-checked AI turn mappings alone can never unlock publication', async () => {
  const { hasPublicationReadyCornerGuide } = await import('../apps/web/src/components/editorial/circuit-release.ts');
  const guide = candidateCornerGuides.find(item => item.circuit_id === 'silverstone');
  assert.ok(guide);
  const originalStatus = guide.review_status;
  const originalSections = guide.sections.map(section => section.confirmation_status);
  try {
    guide.review_status = 'independent_review_approved';
    for (const section of guide.sections) section.confirmation_status = 'source_checked_ai';
    assert.equal(hasPublicationReadyCornerGuide('silverstone'), false, 'AI source checks are not independent turn mapping verification');
    for (const section of guide.sections) section.confirmation_status = 'historical_numbering_unverified';
    assert.equal(hasPublicationReadyCornerGuide('silverstone'), false, 'historical route research must remain unpublished');
  } finally {
    guide.review_status = originalStatus;
    guide.sections.forEach((section, index) => { section.confirmation_status = originalSections[index]; });
  }
});

test('publication gate rejects duplicate section identifiers and non-HTTPS provenance', async () => {
  const { hasPublicationReadyCornerGuide } = await import('../apps/web/src/components/editorial/circuit-release.ts');
  const { candidateCornerSources } = await import('../apps/web/src/components/editorial/circuit-candidates.ts');
  const guide = candidateCornerGuides.find(item => item.circuit_id === 'silverstone');
  assert.ok(guide && guide.sections.length > 1);
  const oldReview = guide.review_status;
  const oldStatuses = guide.sections.map(section => section.confirmation_status);
  const oldId = guide.sections[1].id;
  const sourceKey = guide.sections[0].sources[0];
  const oldSource = candidateCornerSources[sourceKey];
  try {
    guide.review_status = 'independent_review_approved';
    guide.sections.forEach(section => { section.confirmation_status = 'independently_verified'; });
    guide.sections[1].id = guide.sections[0].id;
    assert.equal(hasPublicationReadyCornerGuide('silverstone'), false, 'duplicate section IDs block release');
    guide.sections[1].id = oldId;
    candidateCornerSources[sourceKey] = 'http://example.invalid/provisional-map';
    assert.equal(hasPublicationReadyCornerGuide('silverstone'), false, 'non-HTTPS provenance blocks release');
    candidateCornerSources[sourceKey] = '';
    assert.equal(hasPublicationReadyCornerGuide('silverstone'), false, 'empty evidence link blocks release');
  } finally {
    guide.review_status = oldReview;
    guide.sections.forEach((section, index) => { section.confirmation_status = oldStatuses[index]; });
    guide.sections[1].id = oldId;
    candidateCornerSources[sourceKey] = oldSource;
  }
});

test('duplicate circuit IDs and out-of-range layout years cannot receive publication approval', async () => {
  const { hasPublicationReadyCornerGuide } = await import('../apps/web/src/components/editorial/circuit-release.ts');
  const guide = candidateCornerGuides.find(item => item.circuit_id === 'silverstone');
  assert.ok(guide);
  const year = guide.numbering_year;
  try {
    candidateCornerGuides.push(guide);
    assert.equal(hasPublicationReadyCornerGuide('silverstone'), false, 'duplicate guide IDs must fail closed');
    candidateCornerGuides.pop();
    guide.numbering_year = 1949;
    assert.equal(hasPublicationReadyCornerGuide('silverstone'), false, 'pre-championship year must not be accepted');
    guide.numbering_year = 2101;
    assert.equal(hasPublicationReadyCornerGuide('silverstone'), false, 'future unsupported year must not be accepted');
  } finally {
    if (candidateCornerGuides.at(-1) === guide) candidateCornerGuides.pop();
    guide.numbering_year = year;
  }
});

test('private bilingual preview includes seven historical route studies but no invented corner numbers', () => {
  const en = renderCircuitReview('en', '/review/test');
  const uk = renderCircuitReview('uk', '/review/test');
  for (const id of ['ain-diab','clermont-ferrand','dallas','detroit','pescara','porto','sebring']) {
    assert.ok(en.includes('study-' + id), id + ': EN study missing');
    assert.ok(uk.includes('study-' + id), id + ': UK study missing');
    assert.ok(en.includes('href="#study-' + id + '"'), id + ': navigation missing');
    assert.ok(en.includes('id="study-' + id + '-section-1"'), id + ': first section anchor missing');
  }
  assert.match(en, /These are research route sections, NOT officially numbered turns/);
  assert.match(uk, /Нумерацію апексів не підтверджено/);
  assert.match(en, /Historical source \(not turn-number evidence\)/);
  assert.match(en, /noindex,nofollow,noarchive/);
});

test('private preview never represents unverified historical study positions as FIA maps', () => {
  const en = renderCircuitReview('en', '/review/test');
  const uk = renderCircuitReview('uk', '/review/test');
  assert.match(en, /Provisional study positions \(not an FIA map\)/);
  assert.match(uk, /Попередні дослідницькі позиції \(не схема FIA\)/);
  assert.match(en, /Historical routes — awaiting review/);
});

test('private historical review HTTP transport stays localhost-only, tokenized and noindex', async () => {
  const { once } = await import('node:events');
  const { request } = await import('node:http');
  const server = startCircuitReview({ acknowledged: true, port: 0 });
  try {
    if (!server.listening) await once(server, 'listening');
    const port = server.address().port;
    const fetchLocal = (pathname, host = `127.0.0.1:${port}`) => new Promise((resolve, reject) => {
      const req = request({ hostname: '127.0.0.1', port, method: 'GET', path: pathname, headers: { Host: host } }, res => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      });
      req.on('error', reject);
      req.end();
    });
    const rejected = await fetchLocal('/review/not-a-token/en');
    assert.equal(rejected.status, 404);
    const wrongHost = await fetchLocal('/review/not-a-token/en', 'evil.example');
    assert.equal(wrongHost.status, 404);
    assert.equal(rejected.headers['cache-control'], 'no-store');
    assert.match(rejected.headers['x-robots-tag'], /noindex/);
    assert.match(rejected.headers['content-security-policy'], /default-src 'none'/);
    const html = renderCircuitReview('en', '/review/test');
    assert.match(html, /id="study-sebring-section-10"/);
    assert.match(html, /id="study-dallas-section-13"/);
    assert.match(html, /id="study-ain-diab-section-13"/);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('private historical review serves real EN and UK pages only behind the generated token', async () => {
  const { fork } = await import('node:child_process');
  const { once } = await import('node:events');
  const child = fork(new URL('../scripts/preview-circuit-v3.mjs', import.meta.url), ['--acknowledge-unreviewed-draft', '--port', '0'], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
  try {
    const startup = AbortSignal.timeout(10_000);
    const [message] = await Promise.race([
      once(child, 'message', { signal: startup }),
      once(child, 'exit', { signal: startup }).then(([code]) => { throw new Error('Review server exited before startup: ' + code); })
    ]);
    const enUrl = new URL(message.url);
    assert.equal(enUrl.hostname, '127.0.0.1');
    const en = await fetch(enUrl);
    assert.equal(en.status, 200);
    assert.equal(en.headers.get('cache-control'), 'no-store');
    assert.match(en.headers.get('x-robots-tag'), /noindex/);
    const enHtml = await en.text();
    assert.match(enHtml, /Historical routes — awaiting review/);
    assert.match(enHtml, /id="study-sebring-section-10"/);
    const uk = await fetch(new URL('uk', enUrl));
    assert.equal(uk.status, 200);
    assert.match(await uk.text(), /Нумерацію апексів не підтверджено/);
    const badToken = new URL('/review/invalid/en', enUrl);
    assert.equal((await fetch(badToken)).status, 404);
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit', { signal: AbortSignal.timeout(5_000) });
      child.kill('SIGTERM');
      try { await exited; } catch { child.kill('SIGKILL'); }
    }
  }
});

test('private evidence links are rendered only for HTTPS sources', async () => {
  const { readFileSync } = await import('node:fs');
  const renderer = readFileSync(new URL('../scripts/preview-circuit-v3.mjs', import.meta.url), 'utf8');
  assert.match(renderer, /typeof item\.url === 'string' && item\.url\.startsWith\('https:\/\/'\)/);
  const en = renderCircuitReview('en', '/review/test');
  assert.match(en, /Map review, discrepancies and sources/);
  assert.match(en, /Open source/);
});

test('private historical preview presents source disagreements and map rights to reviewers', () => {
  for (const locale of ['en', 'uk']) {
    const html = renderCircuitReview(locale, '/review/test');
    assert.match(html, /historical_51_vs_f1db_48_unverified_apex_numbers/);
    assert.match(html, /complexes_vs_archive_turn_count_unverified_apex_numbers/);
    assert.match(html, /Route landmark order \(not turn numbers\)|Послідовність маршрутних орієнтирів/);
    assert.match(html, /Do not copy external maps or photographs|Зовнішні карти та фотографії/);
    assert.match(html, /https:\/\/www\.motorsportmagazine\.com/);
    assert.match(html, /count discrepancy/);
  }
});

test('all 68 historical route sections separate race classifications from geographic evidence', async () => {
  const { readFileSync } = await import('node:fs');
  const data = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  const ids = new Set(['ain-diab','clermont-ferrand','dallas','detroit','pescara','porto','sebring']);
  const sections = data.circuits.filter(c => ids.has(c.circuit_id)).flatMap(c => c.sections);
  assert.equal(sections.length, 68);
  for (const section of sections) {
    assert.equal(section.provenance_scope.geometric_anchor_verified, false);
    assert.equal(section.provenance_scope.numbered_apex_verified, false);
    assert.deepEqual(section.provenance_scope.source_roles.map(role => role.url), section.source_urls);
    for (const source of section.provenance_scope.source_roles) {
      if (source.url.includes('formula1.com/en/results/')) {
        assert.equal(source.role, 'race_classification_only');
      }
    }
  }
  assert.match(renderCircuitReview('en','/review/test'), /Race classification — not a map/);
  assert.match(renderCircuitReview('uk','/review/test'), /Класифікація гонки — не карта/);
});
