import test from 'node:test';
import assert from 'node:assert/strict';
import { recordedCareer, suggestedComparisons, careerPartners, comparisonHref } from '../apps/web/src/lib/recorded-career.ts';
import { glossary, metricDefinitions } from '../apps/web/src/content/glossary.ts';
import { readFileSync, readdirSync } from 'node:fs';
const rows = [{ id: '9007199254740993', entity_type: 'driver', name: 'Boundary example', participation: [
  { year:1984, related_id:'1', related_name:'First', result_entries:2 },
  { year:1986, related_id:'1', related_name:'First', result_entries:3 },
  { year:1987, related_id:'2', related_name:'Second', result_entries:1 },
  { year:1987, related_id:'3', related_name:'Third', result_entries:1 },
  { year:1988, related_id:'3', related_name:'Third', result_entries:4 },
] }];
test('comparison suggestions preserve gaps and prefer observed partner changes, retaining canonical BIGINT identity', () => {
  const career = recordedCareer(rows,'driver',rows[0].id);
  assert.deepEqual(career.years,[1984,1986,1987,1988]);
  const pairs = suggestedComparisons(career);
  assert.deepEqual(pairs.map(p=>[p.from,p.to,p.changed]),[[1987,1988,true],[1986,1987,true],[1984,1986,false]]);
  assert.equal(comparisonHref('uk',career,1986,1987),'/uk/time-machine?kind=driver&id=9007199254740993&from=1986&to=1987');
  assert.ok(!pairs.some(p=>p.from===1985 || p.to===1985));
  assert.deepEqual(careerPartners(career).map(p=>[p.id,p.seasons.map(s=>s.year)]),[['1',[1984,1986]],['2',[1987]],['3',[1987,1988]]]);
});
test('one-season and missing careers produce no invented comparisons; malformed associations fail visibly', () => {
  for (const participation of [[],rows[0].participation.slice(0,1)]) assert.deepEqual(suggestedComparisons(recordedCareer([{...rows[0],participation}],'driver',rows[0].id)),[]);
  for (const changes of [{year:1985.5},{related_id:1},{result_entries:-1},{related_name:''}]) assert.throws(()=>recordedCareer([{...rows[0],participation:[{...rows[0].participation[0],...changes}]}],'driver',rows[0].id));
  assert.throws(()=>recordedCareer([{...rows[0],participation:[rows[0].participation[0],rows[0].participation[0]]}],'driver',rows[0].id));
});
test('glossary parity and honest distinctions between winning races and podium rows', () => {
  assert.deepEqual(Object.keys(glossary.en).sort(),Object.keys(glossary.uk).sort());
  assert.match(metricDefinitions.wins,/DISTINCT/); assert.doesNotMatch(metricDefinitions.podiumEntries,/DISTINCT/);
  assert.notEqual(glossary.uk.podiumEntries,'Подіуми');
});
test('public copy avoids retired internal vocabulary across route and component strings', () => {
  function files(dir) { return readdirSync(dir,{withFileTypes:true}).flatMap(f=>f.isDirectory()?files(`${dir}/${f.name}`):/\.(tsx?|json)$/.test(f.name)?[`${dir}/${f.name}`]:[]); }
  const retired = ['Переможні гонки','Подіумні записи результатів','подіумних записів результатів','Зв’язки у результатах гонок','Seasonal associations','Find identities','Знайти ідентичності','зріз API','переможні записи результатів','переможних записів результатів','Виміри конкретних етапів','у перевіреному архіві'];
  for (const file of [...files('apps/web/src/app'),...files('apps/web/src/components'),...files('apps/web/messages')]) for (const phrase of retired) assert.ok(!readFileSync(file,'utf8').normalize('NFKC').toLocaleLowerCase('uk').includes(phrase.normalize('NFKC').toLocaleLowerCase('uk')),`${file}: ${phrase}`);
});

test('neighboring comparison windows use only recorded seasons and preserve gaps', async () => {
  const { neighboringComparisons } = await import('../apps/web/src/lib/recorded-career.ts');
  const career = recordedCareer(rows, 'driver', rows[0].id);
  assert.deepEqual(neighboringComparisons(career,1986,1987),[
    {from:1984,to:1986,direction:-1},{from:1987,to:1988,direction:1},
  ]);
  assert.deepEqual(neighboringComparisons(career,2025,2026),[]);
  assert.deepEqual(neighboringComparisons(career,1987,1987),[]);
});
