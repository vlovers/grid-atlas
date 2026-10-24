import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {buildReviewWorklist} from '../scripts/editorial-human-review-worklist.mjs';

function fixture(){
  const claims=[
    {driver_id:'sample',claim_id:'early',publisher_groups:['formula1'],second_publisher_pending:true,narrative_chapters:['opening','career']},
    {driver_id:'sample',claim_id:'later',publisher_groups:['fia','formula1'],second_publisher_pending:false,narrative_chapters:['career']}
  ];
  const worksheet=claims.map(claim=>({
    driver_id:claim.driver_id,claim_id:claim.claim_id,topic:'history',
    en:'Sourced English research text',uk:'Український текст дослідження',
    independent_publisher_links:!claim.second_publisher_pending,
    publisher_groups:claim.second_publisher_pending?['formula1']:['fia','formula1'],
    linked_chapters:claim.narrative_chapters.map(id=>({chapter_id:id,en_heading:id,uk_heading:id,en_body:'English narrative',uk_body:'Український розділ'})),
    evidence:claim.publisher_groups.map(group=>({source_url:group==='fia'?'https://www.fia.com/example':'https://www.formula1.com/example',publisher:group,publisher_group:group,locator:'Specific passage',claimed_support:true,semantic_review:'pending'})),
    publication_status:'unpublished',human_fact_review:'pending',
    en_editorial_review:'pending',uk_editorial_review:'pending'
  }));
  return {
    provenance:{batch_id:'drivers-30-v1',mode:'unpublished_provenance_audit',
      totals:{human_approved:0,published:0},errors:[],claims},
    worksheet:{batch_id:'drivers-30-v1',mode:'research_review_packet',
      totals:{human_approved:0,published:0},claims:worksheet}
  };
}
function run(args=[]){
  return spawnSync(process.execPath,['scripts/editorial-human-review-worklist.mjs',...args],
    {encoding:'utf8',maxBuffer:16*1024*1024});
}
test('missing second publisher and chapter impact are deterministically prioritized',()=>{
  const {provenance,worksheet}=fixture();
  const report=buildReviewWorklist(provenance,worksheet);
  assert.equal(report.totals.claims,2);
  assert.equal(report.totals.awaiting_second_publisher,1);
  assert.equal(report.totals.human_approved,0);
  assert.equal(report.totals.published,0);
  assert.equal(report.items[0].claim_id,'early');
  assert.equal(report.items[0].priority_score,140);
  assert.equal(report.items[1].priority_score,20);
  assert.ok(report.items[0].review_tasks.some(x=>x.kind==='second_publisher'));
  assert.ok(report.items.every(x=>x.review_tasks.every(task=>task.status==='pending')));
});
test('conflicting publisher coverage fails closed',()=>{
  const {provenance,worksheet}=fixture();
  worksheet.claims[0].independent_publisher_links=true;
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/Publisher coverage mismatch/);
});
test('missing, duplicate and inconsistent claim-to-chapter provenance fail closed',()=>{
  const {provenance,worksheet}=fixture();
  worksheet.claims[0].linked_chapters=[];
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/Chapter references mismatch/);
  worksheet.claims[0].linked_chapters=provenance.claims[0].narrative_chapters.map(chapter_id=>({chapter_id,en_heading:chapter_id,uk_heading:chapter_id,en_body:'English narrative',uk_body:'Український розділ'}));
  worksheet.claims.push(structuredClone(worksheet.claims[0]));
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/Duplicate worksheet claim/);
  worksheet.claims.pop();
  provenance.claims.push({...provenance.claims[0],claim_id:'orphan'});
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/claim count mismatch/);
});
test('review status cannot be inferred from research evidence',()=>{
  const {provenance,worksheet}=fixture();
  worksheet.claims[0].human_fact_review='approved';
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/Unexpected review state/);
  worksheet.claims[0].human_fact_review='pending';
  worksheet.claims[0].evidence[0].semantic_review='verified';
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/Unexpected review state/);
});
test('real 30-driver inventory exports 96 unpublished bilingual claim review tasks',()=>{
  const result=run();
  assert.equal(result.status,0,result.stderr);
  const report=JSON.parse(result.stdout);
  assert.equal(report.totals.claims,96);
  assert.equal(report.items.length,96);
  assert.equal(report.totals.human_approved,0);
  assert.equal(report.totals.published,0);
  assert.ok(report.items.every(x=>x.en?.trim()&&x.uk?.trim()&&x.evidence.length>0));
  assert.ok(report.items.every(x=>x.publication_status==='unpublished'));
  assert.ok(report.items.every(x=>x.review_tasks.every(task=>task.status==='pending')));
  assert.ok(report.items.some(x=>x.chapter_count>0));
});
test('filtered markdown output and invalid CLI arguments are safe',()=>{
  const result=run(['--driver=jack-brabham','--format=markdown','--limit=2']);
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/Content Factory V1/);
  assert.match(result.stdout,/jack-brabham/);
  assert.doesNotMatch(result.stdout,/human approved: [1-9]/i);
  const bad=run(['--limit=0']);
  assert.notEqual(bad.status,0);
  assert.match(bad.stderr,/Invalid limit/);
});

test('Markdown review dossier includes both translations, precise locators and chapter context',()=>{
  const result=run(['--driver=jack-brabham','--format=markdown','--limit=1']);
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/\*\*EN:\*\*/);
  assert.match(result.stdout,/\*\*UK:\*\*/);
  assert.match(result.stdout,/Exact locator:/);
  assert.match(result.stdout,/Semantic review: pending/);
  assert.match(result.stdout,/Linked narrative chapters:/);
  assert.match(result.stdout,/EN text:/);
  assert.match(result.stdout,/UK text:/);
  assert.match(result.stdout,/Human review checklist:/);
  assert.match(result.stdout,/- \[ \] source_semantics:/);
  assert.match(result.stdout,/shown: 1/);
  assert.doesNotMatch(result.stdout,/\[x\]/i);
});

test('Markdown review export does not use HTML line-break tags for source links',()=>{
  const result=run(['--format=markdown','--limit=2']);
  assert.equal(result.status,0,result.stderr);
  assert.doesNotMatch(result.stdout,/<br\s*\/?\s*>/i);
  assert.match(result.stdout,/https:\/\//);
});

test('chapter-scoped review export contains only claims linked to that chapter',()=>{
  const all=run(['--driver=jack-brabham']);
  assert.equal(all.status,0,all.stderr);
  const full=JSON.parse(all.stdout);
  const chapter=full.items.flatMap(x=>x.linked_chapters).find(x=>x.chapter_id);
  assert.ok(chapter,'expected linked biography chapter');
  const scoped=run(['--driver=jack-brabham','--chapter='+chapter.chapter_id]);
  assert.equal(scoped.status,0,scoped.stderr);
  const result=JSON.parse(scoped.stdout);
  assert.equal(result.chapter_filter,chapter.chapter_id);
  assert.equal(result.driver_filter,'jack-brabham');
  assert.ok(result.items.length>0);
  assert.ok(result.items.length<=full.items.length);
  assert.ok(result.items.every(x=>x.linked_chapters.some(ch=>ch.chapter_id===chapter.chapter_id)));
  assert.ok(result.items.every(x=>x.publication_status==='unpublished'));
  const markdown=run(['--driver=jack-brabham','--chapter='+chapter.chapter_id,'--format=markdown']);
  assert.equal(markdown.status,0,markdown.stderr);
  assert.match(markdown.stdout,/Human review checklist:/);
});

test('chapter filter fails closed for unknown chapter or absent driver',()=>{
  const withoutDriver=run(['--chapter=opening']);
  assert.notEqual(withoutDriver.status,0);
  assert.match(withoutDriver.stderr,/requires --driver/);
  const unknown=run(['--driver=jack-brabham','--chapter=definitely-not-a-real-chapter']);
  assert.notEqual(unknown.status,0);
  assert.match(unknown.stderr,/Unknown chapter/);
});

test('review worklist rejects chapters without full bilingual narrative bodies',()=>{
  const {provenance,worksheet}=fixture();
  delete worksheet.claims[0].linked_chapters[0].uk_body;
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/Incomplete bilingual narrative context/);
});

test('publisher groups must match provenance and individual evidence rows',()=>{
  const {provenance,worksheet}=fixture();
  worksheet.claims[1].evidence[0].publisher_group='formula1';
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/Publisher evidence groups mismatch/);
  worksheet.claims[1].evidence[0].publisher_group='fia';
  worksheet.claims[1].evidence[0].locator='';
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/Incomplete source locator metadata/);
});

test('chapter prose cannot disagree between claims linking the same chapter',()=>{
  const {provenance,worksheet}=fixture();
  worksheet.claims[1].linked_chapters[0].uk_body='Інший текст тієї самої глави';
  assert.throws(()=>buildReviewWorklist(provenance,worksheet),/Conflicting chapter text across claims/);
});
