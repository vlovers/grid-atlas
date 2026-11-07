import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read=(path)=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const stories=read('apps/web/src/components/editorial/circuit-extra-stories.json');
const expected=['interlagos','montreal','hungaroring','zandvoort','melbourne','bahrain','shanghai','sepang','imola','spielberg','catalunya','paul-ricard','mexico-city','hockenheimring','nurburgring','magny-cours','watkins-glen','buenos-aires','kyalami','indianapolis'];

test('all twenty supplementary circuit stories carry two complete EN/UK reading sections and stay unpublished',()=>{
  assert.equal(stories.length,20);
  assert.deepEqual(new Set(stories.map(s=>s.id)),new Set(expected));
  for(const story of stories){
    assert.equal(story.human_approval,false,story.id);
    assert.equal(story.publication_allowed,false,story.id);
    assert.equal(story.historical_review_status,'pending_independent_claim_review',story.id);
    assert.match(story.source,/^https:\/\//,story.id);
    assert.ok(story.historical_sources?.length>0,story.id);
    for(const locale of ['en','uk']){
      const paragraphs=story.description[locale].split(/\n\s*\n/).filter(Boolean);
      assert.equal(paragraphs.length,2,story.id+' '+locale);
      assert.ok(paragraphs[0].length>450,story.id+' '+locale+' historical narrative');
      assert.ok(paragraphs[1].length>240,story.id+' '+locale+' reader context');
      assert.ok(story.title[locale].length>10,story.id+' '+locale+' title');
    }
  }
});
