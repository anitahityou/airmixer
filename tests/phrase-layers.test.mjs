import test from 'node:test';
import assert from 'node:assert/strict';
import {PhraseLayers} from '../src/phrase-layers.mjs';
test('gestures create complementary parts aligned to a beat',()=>{
 const p=new PhraseLayers();for(const type of ['tap','open','close','slide-up'])p.activate(type,5);
 assert.equal(p.take(7).length,0);
 assert.deepEqual(p.take(8).map(n=>n.role),['rhythm','melody']);
 assert.ok(p.take(10).some(n=>n.role==='bass'));
});
test('rhythm lasts eight bars, harmony sixteen; all parts expire',()=>{
 const p=new PhraseLayers();p.activate('tap',0);p.activate('open',0);
 assert.ok(p.take(124).some(n=>n.role==='rhythm'));
 assert.deepEqual(p.take(128).map(n=>n.role),['harmony']);
 assert.ok(p.take(240).length);assert.deepEqual(p.take(256),[]);assert.equal(p.parts.size,0);
});
test('rapid repeated gestures renew a part without accumulating loops',()=>{
 const p=new PhraseLayers();for(let i=0;i<100;i++)p.activate('tap',i);
 assert.equal(p.parts.size,1);assert.equal(p.take(100).length,1);
 p.clear();assert.deepEqual(p.take(104),[]);
});
test('up/down melodies reverse note order while retaining the same harmony indices',()=>{
 const up=new PhraseLayers(),down=new PhraseLayers();up.activate('slide-up',0);down.activate('slide-down',0);
 assert.deepEqual([0,4,8,12].map(t=>up.take(t)[0].note),[0,2,1,2]);
 assert.deepEqual([0,4,8,12].map(t=>down.take(t)[0].note),[3,1,2,1]);
});

test('renewal extends the part without resetting its musical position',()=>{
 const p=new PhraseLayers();p.activate('slide-up',0);p.take(20);p.activate('slide-up',21);
 assert.equal(p.parts.get('melody').start,0);assert.equal(p.parts.get('melody').end,152);
 assert.equal(p.take(24)[0].note,1);
});
test('parts fade over two bars and retain a coherent melodic motif',()=>{
 const p=new PhraseLayers();p.activate('slide-up',0);
 assert.equal(p.take(0)[0].note,0);assert.equal(p.take(32)[0].note,0);
 assert.ok(p.take(124)[0].velocity<p.take(96)[0].velocity);
});

test('every gesture keeps its part and DJ echo sequence alive for at least ten seconds',()=>{
 for(const type of ['tap','roll','close','open','strum','resolve','bloom','slide-up','slide-down','orbit-left','orbit-right','spark','transition','strings-wide','strings-near','strings-up','strings-down','strings-tilt']){
  const p=new PhraseLayers();p.activate(type,0);
  const part=[...p.parts.values()][0];assert.ok((part.end-part.start)*60/128/4>=10,type);
  assert.ok(p.fxEnd*60/128/4>=10,type);
 }
});
test('DJ sweep repeats every four bars, renew without restart, and clear on pause',()=>{
 const p=new PhraseLayers();p.activate('tap',0);
 assert.deepEqual([0,64].map(t=>p.takeDj(t)),['sweep','sweep']);
 assert.equal(p.takeDj(1),null);assert.equal(p.takeDj(16),'echo');p.activate('open',17);assert.equal(p.takeDj(64),'sweep');
 assert.equal(p.takeDj(p.fxEnd),null);p.clear();assert.equal(p.takeDj(24),null);
});
