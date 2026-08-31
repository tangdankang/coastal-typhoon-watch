import assert from 'node:assert/strict';
import test from 'node:test';
import {storms,regions,levels,CURRENT_INDEX,DEMO_NOTICE,getRegion,getStorm,pointLabel,projectPoint} from '../lib/demo-data.ts';

await test('demo identity and explicit safety notice',()=>{
 assert.match(DEMO_NOTICE,/仅为演示使用/);assert.match(DEMO_NOTICE,/不用于防灾决策/);
 assert.equal(new Set(storms.map(s=>s.id)).size,storms.length);
 for(const storm of storms){assert.match(storm.id,/^DEMO-/);assert.ok(storm.name);}
});
await test('coordinates, units and chronology for both storms',()=>{
 for(const storm of storms){
  assert.equal(storm.points.length,9);
  for(let i=0;i<storm.points.length;i++){
   const p=storm.points[i];const [x,y]=projectPoint(p.lon,p.lat);
   assert.ok(x>=0&&x<=960&&y>=0&&y<=580);
   assert.ok(p.wind>0&&p.pressure>0&&p.level>=1&&p.level<=17);
   assert.equal(p.forecast,i>CURRENT_INDEX);
   if(i)assert.ok(Date.parse('2026-'+p.time.replace(' ','T')+':00+08:00')>Date.parse('2026-'+storm.points[i-1].time.replace(' ','T')+':00+08:00'));
  }
  assert.equal(storm.points[CURRENT_INDEX].time,'08-19 08:00');
 }
});
await test('all colors and missing-region sample are represented',()=>{
 assert.deepEqual(new Set(regions.map(r=>r.level)),new Set([...Object.keys(levels),null]));
 assert.equal(getRegion('shenzhen').level,null);
 assert.equal(getRegion('unknown'),regions[0]);assert.equal(getStorm('unknown'),storms[0]);
});
await test('track labels never imply real forecasts',()=>{
 assert.equal(pointLabel(0),'历史演示点');assert.equal(pointLabel(CURRENT_INDEX),'当前演示点');assert.equal(pointLabel(8),'模拟预报');
 assert.deepEqual(projectPoint(112,35),[0,0]);assert.deepEqual(projectPoint(137,15),[960,580]);
});
