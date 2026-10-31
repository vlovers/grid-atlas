import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const files = ["../docs/editorial/circuit-experience-v3/EXPANSION_1_AIDA_DALLAS_RESEARCH_DRAFTS.json","../docs/editorial/circuit-experience-v3/EXPANSION_1_REMAINING_SIX_RESEARCH_DRAFTS.json","../docs/editorial/circuit-experience-v3/EXPANSION_2_FIRST_SIX_RESEARCH_DRAFTS.json","../docs/editorial/circuit-experience-v3/EXPANSION_2_REMAINING_FIVE_RESEARCH_DRAFTS.json"];
const anchors = {"aida":[["Ferrari's Nicola Larini was","Нікола Ларіні заміняв травмованого"],["Häkkinen stalled at his","Гаккінен заглух на піт-стопі,"],["Jordan had never previously","Для Jordan це був"],["Schumacher led Coulthard by","Перед останнім піт-стопом Шумахер"],["Schumacher had saved four","Шумахер зберіг чотири нові"]],"ain-diab":[["Moss made contact with","Мосс зачепив Maserati Вольфганга"],["Hawthorn won the drivers'","Готорн виграв чемпіонат із"],["Hill had run off","На третьому колі Гілл"],["Schell continued running close","Шелл продовжував їхати поруч"],["Brooks briefly passed Hawthorn","Брукс ненадовго знову обігнав"]],"clermont-ferrand":[["Stewart had passed Hulme","Стюарт обігнав Галма за"],["Fittipaldi had waited behind","Фіттіпальді не ризикував атакувати"],["Amon lost about 50","Заміна шини забрала в"],["Cevert crashed the new","Север розбив новий Tyrrell"],["The period report describes","Тогочасний репортаж описує каміння,"]],"jacarepagua":[["The 1989 rules replaced","Регламент 1989 року замінив"],["Prost's clutch failed before","Зчеплення Проста відмовило до"],["Gugelmin stopped for fresh","Гугельмін змінив шини на"],["Herbert changed tyres early","Герберт рано змінив шини"],["The damaged McLaren required","Пошкодженому McLaren знадобилася нова"]],"east-london":[["Only the best five","У 1962 році враховували"],["A missing locking washer","Відсутня стопорна шайба дозволила"],["Surtees also fought among","Сертіс також боровся серед"],["Only Hill, the two","Лише Гілл, два пілоти"],["Lederle started tenth and","Ледерле стартував десятим і"]]};
test('25 bilingual short-dossier scenes remain evidence-linked and unpublished', () => {
 let count=0; const found=new Set();
 for(const path of files){
  const doc=JSON.parse(readFileSync(new URL(path, import.meta.url),'utf8'));
  assert.equal(doc.publication,'blocked');
  for(const circuit of doc.circuits){
   const expected=anchors[circuit.circuit_id];if(!expected)continue;
   found.add(circuit.circuit_id);
   assert.deepEqual(circuit.stories.map(s=>s.story_index),[1,2,3,4,5]);
   for(const [i,scene] of circuit.stories.entries()){
    count++;
    assert.ok(scene.narrative.en.includes(expected[i][0]),circuit.circuit_id+'/EN/'+i);
    assert.ok(scene.narrative.uk.includes(expected[i][1]),circuit.circuit_id+'/UK/'+i);
    assert.ok(scene.narrative.en.trim().split(/\s+/).length>=60);
    assert.ok(scene.narrative.uk.trim().split(/\s+/).length>=50);
    assert.equal(scene.independent_approval,false);
    assert.equal(scene.publication,'blocked');
    assert.equal(scene.historical_review_status,'pending_independent_claim_review');
    assert.ok(scene.source_urls.some(url=>url.includes('formula1.com/en/results/')));
    assert.ok(new Set(scene.historical_sources.map(url=>new URL(url).hostname)).size>=2);
   }
  }
 }
 assert.deepEqual([...found].sort(),Object.keys(anchors).sort());
 assert.equal(count,25);
});
