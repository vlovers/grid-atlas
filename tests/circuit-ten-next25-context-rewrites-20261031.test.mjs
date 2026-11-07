import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const doc=JSON.parse(readFileSync(new URL('../docs/editorial/circuit-experience-v3/next25-research-leads.json',import.meta.url),'utf8'));
const specs=[
  [
    "baku",
    "Rosberg wins Baku's first Grand Prix",
    "skysports.com"
  ],
  [
    "jeddah",
    "A new kind of street-race pressure",
    "motorsportmagazine.com"
  ],
  [
    "lusail",
    "An unusual 18-lap tyre limit",
    "skysports.com"
  ],
  [
    "mexico-city",
    "Mexico City welcomes the championship back",
    "aljazeera.com"
  ],
  [
    "miami",
    "Miami's first Formula 1 winner",
    "motorsportmagazine.com"
  ],
  [
    "las-vegas-strip",
    "A complicated first night race",
    "motorsport.com"
  ],
  [
    "indianapolis",
    "A Formula 1 road course at the Speedway",
    "motorsportmagazine.com"
  ],
  [
    "adelaide",
    "Adelaide's rain-drenched finale",
    "motorsportmagazine.com"
  ],
  [
    "brands-hatch",
    "Brands Hatch hosts a European Grand Prix",
    "motorsportmagazine.com"
  ],
  [
    "watkins-glen",
    "The Glen's last Formula 1 race",
    "motorsportmagazine.com"
  ]
];
test('ten distinct next25 race leads have bilingual event context and independent sources',()=>{
  assert.equal(doc.circuits.length,25);
  assert.equal(doc.status,'research_only');
  assert.equal(doc.publication,'blocked');
  assert.equal(specs.length,10);
  for(const [slug,title,domain] of specs){
    const circuit=doc.circuits.find(c=>c.candidate_slug===slug);
    assert.ok(circuit,slug);
    const story=circuit.story_leads.find(s=>s.title.en===title);
    assert.ok(story,slug+'/'+title);
    for(const lang of ['en','uk']){
      assert.equal(story.narrative[lang].split(/\n\s*\n/).filter(Boolean).length,2,slug+'/'+lang+' paragraphs');
      assert.ok(story.narrative[lang].trim().split(/\s+/).length>=70,slug+'/'+lang+' substantive text');
      assert.ok(story.editorial_direction[lang].length>=65,slug+'/'+lang+' specific review question');
    }
    assert.match(story.narrative.uk,/[А-ЯІЇЄҐа-яіїєґ]/u);
    assert.ok(story.sources.some(url=>new URL(url).hostname.replace(/^www\./,'').endsWith(domain)),slug+' independent report');
    assert.ok(story.sources.some(url=>new URL(url).hostname.endsWith('formula1.com')),slug+' official source');
    assert.notEqual(story.status,'approved');
    assert.equal(circuit.publication,'unpublished');
  }
});
