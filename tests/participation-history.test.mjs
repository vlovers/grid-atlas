import test from 'node:test';
import assert from 'node:assert/strict';
import { participationHistory, evidencePath } from '../apps/web/src/components/participation/model.ts';
const row=(year,id,name=id)=>({year,related_id:id,related_name:name,races:2,result_entries:3,winning_races:1,recorded_points:null,points_missing:3,first_race:{id:`${year}01`,year,round:1,name:'First fixture race',date:null,circuit_id:null},last_race:{id:`${year}02`,year,round:2,name:'Last fixture race',date:null,circuit_id:null}});

test('calendar periods retain a gap, a return and simultaneous constructors',()=>{
 const rows=[row(1952,'8'),row(1950,'8'),row(1951,'9'),row(1952,'9')];
 const m=participationHistory(rows,[1950,1951,1952],1952);
 assert.deepEqual(m.calendar,[1950,1951,1952]);
 assert.deepEqual(m.eras.map(e=>[e.id,e.years]),[['8',[1950]],['9',[1951,1952]],['8',[1952]]]);
 assert.deepEqual(m.series.find(s=>s.id==='8').cells.map(c=>c.rows.length),[1,0,1]);
 assert.equal(rows[0].year,1952); // Sorting never mutates the API response.
});

test('changes compare only adjacent nonempty recorded sets, never skipped calendar years',()=>{
 const m=participationHistory([row(1987,'old'),row(1987,'same'),row(1988,'same'),row(1988,'new')],[1987,1988],1988);
 assert.equal(m.changes.state,'available');
 assert.deepEqual(m.changes.added.map(x=>x.id),['new']);
 assert.deepEqual(m.changes.retained.map(x=>x.id),['same']);
 assert.deepEqual(m.changes.absent.map(x=>x.id),['old']);
 const gap=participationHistory([row(1950,'old'),row(1952,'new')],[1950,1952],1952);
 assert.equal(gap.changes.state,'gap');assert.deepEqual(gap.changes.added,[]);
 assert.equal(gap.calendar.find(y=>y===1951),1951);
 assert.equal(gap.series[0].cells[1].recorded,false);
});

test('missing participation, empty identity and first season never imply an entire roster change',()=>{
 assert.equal(participationHistory([row(1951,'new')],[1950,1951],1951).changes.state,'incomplete');
 assert.equal(participationHistory([row(1950,'old')],[1950,1951],1951).changes.state,'incomplete');
 assert.equal(participationHistory([row(1950,'old')],[1950],1950).changes.state,'first');
 const empty=participationHistory([],[],2026);assert.equal(empty.selected,undefined);assert.deepEqual(empty.calendar,[]);assert.deepEqual(empty.eras,[]);
});

test('bounded calendar windows preserve every dense-window identity and source IDs',()=>{
 const id='9007199254740993';const rows=Array.from({length:34},(_,i)=>row(1960,i===0?id:String(i)));
 const years=Array.from({length:77},(_,i)=>1950+i);const m=participationHistory(rows,years,1960);
 assert.equal(m.calendar.length,7);assert.equal(m.series.length,34);
 assert.ok(m.series.some(s=>s.id===id));assert.equal(m.previous,1959);assert.equal(m.next,1961);
 assert.deepEqual(participationHistory([],years,9999).calendar,[2020,2021,2022,2023,2024,2025,2026]);
 assert.equal(participationHistory([],years,1950).calendar[0],1950);
 assert.equal(participationHistory([],years,1988,100).calendar.length,9);
});

test('exact evidence destinations retain identity direction, season and return focus',()=>{
 assert.equal(evidencePath('uk','driver','72','34',1988),'/uk/explorer/evidence/72/34?year=1988&from=driver&selected=34');
 assert.equal(evidencePath('en','constructor','34','72',1988),'/en/explorer/evidence/72/34?year=1988&from=constructor&selected=72');
});
