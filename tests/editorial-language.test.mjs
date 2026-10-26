import test from 'node:test';
import assert from 'node:assert/strict';
import { ukrainianNoun, recordedPeriod, raceNameWithYear } from '../apps/web/src/content/editorial-language.ts';
import { driverArchiveOverview } from '../apps/web/src/components/driver/showcase-model.ts';

test('Ukrainian counts and periods remain natural for sparse and multi-year records',()=>{
  for(const [count,expected]of [[1,'гонку'],[2,'гонки'],[5,'гонок'],[11,'гонок'],[21,'гонку'],[0,'гонок']])assert.equal(ukrainianNoun(count,'гонку','гонки','гонок'),expected);
  assert.equal(recordedPeriod(1953,1953,'uk'),'у 1953 році');
  assert.equal(recordedPeriod(1984,1994,'en'),'from 1984 to 1994');
  assert.equal(recordedPeriod(null,null,'en'),'');
});
test('single-race synopsis preserves source names without duplicate years or false verification',()=>{
  const race={id:'1',year:1953,name:'Synthetic Grand Prix 1953',round:1};
  const career={summary:{races:1,first_season:1953,last_season:1953,winning_races:0,podium_result_entries:0},participation:[],milestones:{first_appearance:{race},last_appearance:{race}}};
  const driver={name:'Synthetic driver',id:'3'};
  const uk=driverArchiveOverview(driver,career,'uk').paragraphs.join(' ');
  const en=driverArchiveOverview(driver,career,'en').paragraphs.join(' ');
  assert.match(uk,/1 гонку.*у 1953 році/);assert.doesNotMatch(uk,/1 гонок|1953 роки|перевіреному архіві/);
  assert.match(en,/1 distinct race .*in 1953/);assert.doesNotMatch(en,/1 distinct races|1953 Synthetic Grand Prix 1953/);
  assert.equal(raceNameWithYear(race),race.name);
  assert.equal(raceNameWithYear({...race,name:'Synthetic Grand Prix'}),'Synthetic Grand Prix · 1953');
});
