import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const stories=JSON.parse(readFileSync(new URL('../apps/web/src/components/editorial/circuit-final33-stories.json',import.meta.url),'utf8'));
const ids=['aida','reims','rouen','buddh','porto','sirius','lusail','yeongam','mosport','madring','sebring','detroit','mugello','phoenix','montjuic','valencia','portimao','anderstorp','jerez','caesars-palace'];

test('20 EN/UK historically contextualised app stories remain research-only',()=>{
  assert.equal(stories.length,33);
  assert.equal(new Set(stories.map(s=>s.id)).size,33);
  const selected=ids.map(id=>stories.find(s=>s.id===id));
  assert.ok(selected.every(Boolean));
  for(const story of selected){
    assert.equal(story.human_approval,false,story.id);
    assert.equal(story.publication_allowed,false,story.id);
    assert.equal(story.historical_review_status,'pending_independent_claim_review',story.id);
    assert.ok(story.source.startsWith('https://'),story.id);
    assert.ok(story.historical_sources?.length>0,story.id);
    for(const locale of ['en','uk']){
      const paragraphs=story.description[locale].split(/\n\s*\n/).filter(Boolean);
      assert.ok(paragraphs.length>=2,story.id+' '+locale);
      assert.ok(story.description[locale].length>500,story.id+' '+locale);
      assert.ok(paragraphs.every(p=>p.length>100),story.id+' '+locale+' paragraphs');
    }
  }
});
test('Montjuic 1975 safely distinguishes prior guardrail protests from fatal race accident',()=>{
  const story=stories.find(s=>s.id==='montjuic');
  assert.ok(story.historical_sources.some(url=>url.includes('grandprix.com/races/spanish-gp-1975')));
  assert.ok(story.historical_sources.some(url=>url.includes('motorsportmagazine.com/archive/article/june-1975')));
  assert.match(story.description.en,/before the race/);
  assert.match(story.description.en,/rear wing/);
  assert.match(story.description.en,/29 laps/);
  assert.match(story.description.uk,/до старту/);
  assert.match(story.description.uk,/29-му колі/);
  assert.equal(story.publication_allowed,false);
});
