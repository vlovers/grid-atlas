import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const base = new URL('../docs/editorial/circuit-experience-v3/', import.meta.url);
const source = readFileSync(new URL('EIGHT_UNDERREPRESENTED_CIRCUIT_EVENTS_20261028.md',base),'utf8');
const index = JSON.parse(readFileSync(new URL('CIRCUIT_33_CANONICAL_STORY_INDEX.json',base),'utf8'));
const events = [['aintree',1955],['aintree',1959],['caesars-palace',1981],['east-london',1965],['jacarepagua',1989],['pedralbes',1954],['rouen',1962],['rouen',1964]];
test('eight new circuit-year stories are unique, bilingual, source-linked, and unapproved', () => {
 const chapters = source.split(/^## \d+\. /m).slice(1);
 assert.equal(chapters.length,events.length);
 for (let i=0;i<events.length;i++) {
  const [id,year]=events[i],chapter=chapters[i];
  assert.ok(chapter.startsWith(id+' ('+year+')'));
  assert.match(chapter,/^### EN — /m);
  assert.match(chapter,/^### UK — /m);
  assert.match(chapter,/\*\*Source:\*\* https:\/\/www\.formula1\.com\/en\/results\//);
  assert.match(chapter,/no independent editorial approval/);
  assert.equal(index.entries.filter(x=>x.circuit_id===id && x.event_year===year).length,1);
 }
});
