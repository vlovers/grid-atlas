import test from 'node:test';
import assert from 'node:assert/strict';
import { candidateCornerGuides, candidateCircuitNarratives } from '../apps/web/src/components/editorial/circuit-candidates.ts';
import { cornerGuideFor, numberedCorners } from '../apps/web/src/components/editorial/circuit-corner-model.ts';
import { isCircuitEditionApproved, circuitEditionDigest } from '../apps/web/src/components/editorial/circuit-release.ts';
import { renderCircuitReview, renderHistoricalBendQueue, renderDallasPlannedRoute, startCircuitReview } from '../scripts/preview-circuit-v3.mjs';

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
  assert.match(research.circuits.find(c => c.circuit_id === 'detroit').layout_evidence_review.layout_length_discrepancy, /2\.590 mi/);
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

test('all 66 historical bend and name studies are visible in private bilingual review only', async () => {
  const { candidateHistoricalCornerReviewQueue, candidateUnnumberedPeriodBendsInLapOrder } = await import('../apps/web/src/components/editorial/circuit-candidates.ts');
  const ids = ['ain-diab','clermont-ferrand','dallas','detroit','pescara','porto','sebring'];
  assert.equal(candidateHistoricalCornerReviewQueue.length, 66);
  assert.equal(candidateHistoricalCornerReviewQueue.filter(item => item.research_kind === 'named_feature').length, 13);
  assert.equal(candidateHistoricalCornerReviewQueue.filter(item => item.research_kind === 'period_bend').length, 53);
  for (const id of ids) {
    const relevant = candidateHistoricalCornerReviewQueue.filter(item => item.circuit_id === id);
    const en = renderHistoricalBendQueue(id, 'en');
    const uk = renderHistoricalBendQueue(id, 'uk');
    assert.ok(relevant.length > 0, id + ': missing bend research');
    assert.match(en, /not certified turn numbers or an FIA map/);
    assert.match(uk, /не сертифіковані номери поворотів/);
    assert.match(en, /Publication blocked/);
    assert.match(uk, /Публікацію заборонено/);
    assert.equal((en.match(/<article id="bend-review-/g) ?? []).length, relevant.length, id + ': complete EN review');
    assert.equal((uk.match(/<article id="bend-review-/g) ?? []).length, relevant.length, id + ': complete UK review');
    for (const item of relevant) {
      assert.equal(item.official_turn_number, null, id + ': publication numbers remain absent');
      assert.equal(item.publication_allowed, false, id + ': unpublished research');
      assert.ok(en.includes(item.review_id.replaceAll(':', '-')), id + ': entry anchor absent');
    }
  }
  assert.equal(candidateUnnumberedPeriodBendsInLapOrder.every(item => item.numbered_apex_verified === false), true);
  const html = renderCircuitReview('en', '/review/test');
  assert.match(html, /Detailed historical bend and name review/);
  assert.match(html, /bend \/ name studies to review/);
  assert.match(html, /locator gaps/);
  assert.match(html, /bend-review-dallas-period-/);
  assert.match(html, /bend-review-clermont-ferrand-named-/);
  const { readFileSync } = await import('node:fs');
  const publicComponent = readFileSync(new URL('../apps/web/src/components/editorial/circuit-corner-guide.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(publicComponent, /candidateHistoricalCornerReviewQueue|renderHistoricalBendQueue/);
});

test('Dallas 1984 planned landmarks are clearly distinct from the raced turn map', async () => {
  const { readFileSync } = await import('node:fs');
  const research = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  const dallas = research.circuits.find(c => c.circuit_id === 'dallas');
  assert.equal(dallas.period_bend_studies.length, 16);
  assert.equal(dallas.planned_route_waypoints.length, 4);
  assert.equal(dallas.layout_evidence_review.pre_race_vs_raced_length.planned_miles, 2.58);
  assert.equal(dallas.layout_evidence_review.pre_race_vs_raced_length.raced_miles, 2.424);
  assert.ok(dallas.planned_route_waypoints.every(x =>
    x.source_period === 'pre_race_plan_march_1984' &&
    x.raced_layout_correspondence_verified === false &&
    x.official_turn_number === null &&
    x.publication_allowed === false &&
    x.source_url.startsWith('https://')
  ));
  assert.equal(dallas.period_bend_studies.filter(x => !x.source_locator || x.source_locator_gap).length, 15, 'keep unsourced apex claims unresolved');
  assert.equal(dallas.layout_evidence_review.layout_count_conventions.find(x => x.count === 12)?.source, 'RacingCircuits.info 1984');
  assert.equal(dallas.layout_evidence_review.layout_count_conventions.find(x => x.count === 23)?.source, 'F1DB dallas-1');
  for (const locale of ['en', 'uk']) {
    const html = renderDallasPlannedRoute(dallas, locale);
    assert.ok(html.includes('2.58') && html.includes('2.424'));
    assert.equal((html.match(/<li>/g) ?? []).length, 4);
    assert.ok(html.includes('Fair Park Music Hall'));
    assert.ok(html.includes('dmagazine.com'));
    assert.match(html, locale === 'en' ? /Not certified corners/ : /Це не сертифіковані повороти/);
    assert.ok(renderCircuitReview(locale, '/review/test').includes('2.424'));
  }
});

test('period-source evidence keeps Detroit, Porto, Pescara and Sebring historically separated', async () => {
  const { readFileSync } = await import('node:fs');
  const research = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  const byId = id => research.circuits.find(c => c.circuit_id === id);
  const pescara = byId('pescara');
  assert.equal(pescara.layout_evidence_review.chicane_chronology.prior_chicane_evidenced_1934, true);
  assert.equal(pescara.layout_evidence_review.chicane_chronology.separate_1957_modification_certain, false);
  assert.equal(pescara.layout_evidence_review.chicane_chronology.exact_1957_chicane_apex_verified, false);
  assert.equal(pescara.period_bend_studies.find(x => x.reading_order === 4).exact_1957_chicane_geometry_verified, false);
  const porto = byId('porto');
  assert.equal(porto.layout_evidence_review.period_report_year_scope.course_walk_year, 1958);
  assert.equal(porto.layout_evidence_review.period_report_year_scope.opening_bottleneck_narrative_year, 1960);
  assert.equal(porto.period_bend_studies.find(x => x.reading_order === 1).event_evidence_year, 1960);
  assert.equal(porto.period_bend_studies.find(x => x.reading_order === 1).route_configuration_reconciliation_pending, true);
  const detroit = byId('detroit');
  assert.equal(detroit.layout_evidence_review.circuit_walk_attribution.year, 1982);
  assert.equal(detroit.layout_evidence_review.circuit_walk_attribution.route_order.length, 6);
  assert.equal(detroit.layout_evidence_review.circuit_walk_attribution.attests_certified_fia_turn_numbers, false);
  assert.equal(detroit.period_bend_studies.length, 17);
  assert.ok(detroit.period_bend_studies.every(x => x.attested_route_sequence && x.numbered_apex_verified === false));
  const sebring = byId('sebring');
  assert.equal(sebring.layout_evidence_review.period_report_bend_sequence.race_year, 1959);
  assert.equal(sebring.layout_evidence_review.period_report_bend_sequence.individually_described_direction_changes, 8);
  assert.equal(sebring.layout_evidence_review.period_report_bend_sequence.individually_numbered_apexes, 0);
  assert.equal(sebring.period_bend_studies.length, 8);
  assert.ok(sebring.period_bend_studies.every(x => x.period_direction_change_attested && x.numbered_apex_verified === false));
  for (const id of ['detroit','pescara','porto','sebring']) {
    assert.ok(byId(id).layout_evidence_review.evidence.every(source => source.supports_apex_numbering === false));
  }
});

test('four historically scoped EN/UK reader openings remain review-only and visible in private preview', async () => {
  const { readFileSync } = await import('node:fs');
  const research = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  for (const id of ['detroit','pescara','porto','sebring']) {
    const circuit = research.circuits.find(x => x.circuit_id === id);
    const opening = circuit.editorial_reader_preview;
    assert.equal(opening.editorial_status, 'research_only');
    assert.ok(opening.source_url.startsWith('https://'));
    for (const locale of ['en','uk']) {
      assert.ok(opening[locale].length > 300, id + ':' + locale);
      assert.ok(renderCircuitReview(locale, '/review/test').includes(opening[locale].slice(0, 55).replaceAll('&', '&amp;').replaceAll("'", '&#39;')), id + ':' + locale);
    }
  }
  assert.match(renderCircuitReview('en', '/review/test'), /Editorial opening — draft/);
  assert.match(renderCircuitReview('uk', '/review/test'), /Редакторський вступ — чернетка/);
});

test('seven unfinished circuits have readable paired openings with no publication approval', async () => {
  const { readFileSync } = await import('node:fs');
  const research = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  const ids = ['ain-diab','clermont-ferrand','dallas','detroit','pescara','porto','sebring'];
  const en = renderCircuitReview('en', '/review/test');
  const uk = renderCircuitReview('uk', '/review/test');
  for (const id of ids) {
    const circuit = research.circuits.find(entry => entry.circuit_id === id);
    assert.equal(circuit.editorial_reader_preview.editorial_status, 'research_only', id);
    assert.match(circuit.editorial_reader_preview.source_url, /^https:\/\//);
    for (const [locale, html] of [['en', en], ['uk', uk]]) {
      const opening = circuit.editorial_reader_preview[locale];
      assert.ok(opening.length > 300, id + ':' + locale + ' opening too short');
      assert.ok(html.includes(opening.slice(0, 20)), id + ':' + locale + ' opening missing from private preview');
    }
  }
});

test('13 historical name studies preserve origin uncertainty and remain unapproved', async () => {
  const { candidateHistoricalCornerReviewQueue } = await import('../apps/web/src/components/editorial/circuit-candidates.ts');
  const named = candidateHistoricalCornerReviewQueue.filter(entry => entry.research_kind === 'named_feature');
  assert.equal(named.length, 13);
  for (const feature of named) {
    const assessment = feature.name_evidence_assessment;
    assert.ok(assessment, feature.review_id);
    assert.equal(assessment.single_numbered_turn_verified, false);
    assert.equal(assessment.period_specific_original_naming_year_verified, false);
    assert.equal(assessment.needs_independent_human_review, true);
    assert.equal(feature.publication_allowed, false);
  }
  const byName = name => named.find(entry => entry.label.en === name).name_evidence_assessment;
  assert.equal(byName('Ferme').classification, 'venue_explicit_farm_name_origin');
  assert.equal(byName('Rosier').classification, 'venue_explicit_louis_rosier_namesake');
  assert.equal(byName('Jumeaux').classification, 'literal_translation_only_name_origin_unknown');
  assert.equal(byName('Esse di Cappelle').classification, 'local_nickname_ambiguous_bend_location');
  assert.match(renderHistoricalBendQueue('clermont-ferrand', 'en'), /Name origin/);
  assert.match(renderHistoricalBendQueue('pescara', 'uk'), /Походження назви/);
});

test('Detroit 1982 official count and F1DB per-bend count remain distinct from FIA numbering', async () => {
  const { readFileSync } = await import('node:fs');
  const research = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  const detroit = research.circuits.find(c => c.circuit_id === 'detroit');
  const review = detroit.layout_evidence_review;
  assert.equal(review.archive_turn_count, 24);
  assert.equal(review.independent_historical_count_adjudication.organizer_turns, 17);
  assert.equal(review.independent_historical_count_adjudication.f1db_layout_bends, 24);
  assert.equal(review.independent_historical_count_adjudication.certified_fia_turn_number_crosswalk, false);
  assert.ok(review.turn_count_source_comparison.some(source => source.source.includes('promoter') && source.count === 17));
  assert.ok(review.turn_count_source_comparison.some(source => source.source.includes('F1DB') && source.count === 24));
  assert.ok(review.evidence.every(source => source.supports_apex_numbering === false));
});

test('Sebring 1959 date is verified by F1 results and contradictory layout-page prose is flagged', async () => {
  const { readFileSync } = await import('node:fs');
  const research = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  const review = research.circuits.find(c => c.circuit_id === 'sebring').layout_evidence_review;
  assert.equal(review.event_date_authority.date, '1959-12-12');
  assert.equal(review.event_date_authority.winner, 'Bruce McLaren');
  assert.equal(review.event_date_authority.not_numbered_apex_evidence, true);
  assert.equal(review.incorrect_secondary_source_claim.do_not_reproduce_march_date, true);
  assert.match(review.incorrect_secondary_source_claim.issue, /28 March 1959/);
  assert.match(review.incorrect_secondary_source_claim.issue, /12 December 1959/);
  assert.equal(review.period_report_bend_sequence.individually_numbered_apexes, 0);
  assert.ok(review.evidence.every(source => source.supports_apex_numbering === false));
});

test('Detroit and Sebring reader openings cite official races without using results for apex numbering', async () => {
  const { readFileSync } = await import('node:fs');
  const research = JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/REMAINING_17_PERIOD_ROUTES_34_BILINGUAL_SECTIONS_20261102.json', import.meta.url), 'utf8'));
  const find = id => research.circuits.find(circuit => circuit.circuit_id === id);
  const detroit = find('detroit');
  const sebring = find('sebring');
  assert.match(detroit.editorial_reader_preview.en, /John Watson started seventeenth/);
  assert.match(detroit.editorial_reader_preview.uk, /Джон Вотсон стартував сімнадцятим/);
  assert.match(sebring.editorial_reader_preview.en, /12 December 1959/);
  assert.match(sebring.editorial_reader_preview.uk, /12 грудня 1959 року/);
  for (const circuit of [detroit, sebring]) {
    assert.equal(circuit.editorial_reader_preview.editorial_status, 'research_only');
    assert.ok(circuit.editorial_reader_preview.event_sources.length >= 2);
    assert.ok(circuit.editorial_reader_preview.event_sources.every(entry =>
      entry.url.startsWith('https://') && !entry.scope.includes('apex_numbering')
    ));
    assert.equal(circuit.layout_evidence_review.evidence.some(entry => entry.supports_apex_numbering === true), false);
  }
});
