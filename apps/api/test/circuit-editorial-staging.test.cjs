const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {mkdtempSync,writeFileSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const {assertResearchDraft}=require('../scripts/stage-circuit-editorial.cjs');

const fixture=()=>({
  schema_version:1,release_kind:'circuit_research_draft',
  publication_status:'unreviewed',circuit_external_id:'fixture-circuit',
  locale:'en',slug:'fixture-circuit',title:'Research draft',author:'Fixture author',
  body_markdown:'## Research\n\nSynthetic claim.',
  claims:[{statement:'Synthetic claim.',evidence:[{
    source_url:'https://example.org/fixture',title:'Synthetic source',
    publisher:'Synthetic publisher',accessed_on:'2026-10-29',locator:'section 1'
  }]}]
});
const altered=fn=>{const b=fixture();fn(b);return b;};

test('draft staging validates a complete candidate without granting approval',()=>{
  assert.equal(assertResearchDraft(fixture()).publication_status,'unreviewed');
});
test('no review, publication or arbitrary fields can be smuggled into a draft',()=>{
  for(const field of ['status','reviewer','reviewed_at','published_at',
    'review_revision_sha256','approval','approved','media']) {
    assert.throws(()=>assertResearchDraft(altered(b=>{b[field]='published';})),
      /invalid or potentially approved/);
  }
  assert.throws(()=>assertResearchDraft(altered(b=>{b.claims[0].status='verified';})),
    /duplicate\/empty|unexpected|invalid|claim/i);
  assert.throws(()=>assertResearchDraft(altered(b=>{b.claims[0].evidence[0].supports=true;})),
    /incomplete|unexpected|invalid|evidence/i);
});
test('candidate evidence must be HTTPS, source-located and structurally complete',()=>{
  for(const url of ['http://example.org','https://user:pass@example.org',
    'javascript:alert(1)','not-a-url']) {
    assert.throws(()=>assertResearchDraft(altered(b=>{
      b.claims[0].evidence[0].source_url=url;
    })),/HTTPS|URL/);
  }
  assert.throws(()=>assertResearchDraft(altered(b=>{
    b.claims[0].evidence[0].accessed_on='2026-02-30';
  })),/incomplete/);
  assert.throws(()=>assertResearchDraft(altered(b=>{
    b.claims[0].evidence[0].locator='';
  })),/incomplete/);
  assert.throws(()=>assertResearchDraft(altered(b=>{
    b.claims[0].evidence.push({...b.claims[0].evidence[0]});
  })),/duplicate evidence/);
});
test('claim coverage must be exact; duplicate and unrelated prose rejected',()=>{
  assert.throws(()=>assertResearchDraft(altered(b=>{
    b.body_markdown='## Research\n\nUnreviewed prose.';
  })),/not covered/);
  assert.throws(()=>assertResearchDraft(altered(b=>{
    b.claims.push({...b.claims[0]});
  })),/duplicate/);
  assert.throws(()=>assertResearchDraft(altered(b=>{
    b.body_markdown+='\\n\\nSynthetic claim.';
  })),/not covered/);
});
test('CLI dry run is DB-free and staging requires an explicit operator guard',()=>{
  const dir=mkdtempSync(join(tmpdir(),'circuit-stage-'));
  try {
    const file=join(dir,'draft.json');
    writeFileSync(file,JSON.stringify(fixture()));
    const script=join(__dirname,'../scripts/stage-circuit-editorial.cjs');
    const env={...process.env};
    delete env.DATABASE_URL;
    delete env.CIRCUIT_DRAFT_STAGE_CONFIRM;
    const dry=spawnSync(process.execPath,[script,file],{encoding:'utf8',env});
    assert.equal(dry.status,0,dry.stderr);
    assert.deepEqual(JSON.parse(dry.stdout),{
      valid:true,staged:false,published:false,
      circuit_external_id:'fixture-circuit',locale:'en',claims:1
    });
    const blocked=spawnSync(process.execPath,[script,file,'--stage'],{encoding:'utf8',env});
    assert.notEqual(blocked.status,0);
    assert.match(blocked.stderr,/confirmation and DATABASE_URL required/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
