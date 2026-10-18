import test from 'node:test';
import assert from 'node:assert/strict';
import {HandEdges,FingerPoke} from '../src/hand-actions.mjs';
const points=(depth,translation=0,scale=1)=>Array.from({length:21},(_,i)=>({x:0,y:i===9?.3*scale:0,z:(i===8?depth*.3*scale:0)+translation}));
test('open/close edges sound once per sustained change and loss resets silently',()=>{
 const e=new HandEdges();assert.equal(e.update('open',0),null);assert.equal(e.update('open',130),null);
 assert.equal(e.update('close',200),null);assert.equal(e.update('close',330),'close');assert.equal(e.update('close',500),null);
 e.update('open',600);assert.equal(e.update('open',730),'open');e.reset();assert.equal(e.update('close',900),null);assert.equal(e.update('close',1100),null);
});
test('forward finger click triggers on the push and needs a withdrawal before repeating',()=>{
 for(const scale of [.5,1,1.5]){
  const p=new FingerPoke();let count=0;
  for(let i=0;i<4;i++){
   const t=i*300;
   p.update(points(0,0,scale),false,t);
   p.update(points(-.12,0,scale),false,t+40);
   if(p.update(points(-.3,0,scale),false,t+80))count++;
   assert.equal(p.update(points(-.3,0,scale),false,t+160),false);
   p.update(points(0,0,scale),false,t+220);
  }
  assert.equal(count,4);
 }
});
test('whole-hand depth movement, jitter, blocked poses and tracking gaps do not click',()=>{
 const p=new FingerPoke();
 for(let t=0;t<500;t+=20)assert.equal(p.update(points(Math.sin(t)*.03,t/100),false,t),false);
 p.reset();p.update(points(0),false,600);assert.equal(p.update(points(-.4),true,700),false);
 p.reset();assert.equal(p.update(points(-.4),false,900),false);
});
