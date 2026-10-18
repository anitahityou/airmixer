import test from 'node:test';
import assert from 'node:assert/strict';
import {FingerClick} from '../src/click.mjs';
test('six rapid touches each fire once on contact, not on release',()=>{
 const g=new FingerClick();let count=0;
 for(let i=0;i<6;i++){
  const t=i*180;
  for(const dt of [0,30,60])assert.equal(g.update(.9,false,t+dt),false);
  assert.equal(g.update(.2,false,t+90),false);
  if(g.update(.2,false,t+123))count++;
  assert.equal(g.update(.2,false,t+150),false);
 }
 assert.equal(count,6);
});
test('holding contact, first appearing closed, and threshold jitter do not repeat',()=>{
 const g=new FingerClick();
 for(let t=0;t<1000;t+=33)assert.equal(g.update(.2,false,t),false);
 for(let t=1000;t<2000;t+=33)assert.equal(g.update(t%2?.4:.6,false,t),false);
});
test('tracking loss and fists disarm contact',()=>{
 const g=new FingerClick();g.update(.9,false,0);g.update(.9,false,80);g.update(.2,false,100);
 g.reset();assert.equal(g.update(.2,false,150),false);
 g.update(.9,false,200);g.update(.9,false,280);
 assert.equal(g.update(.2,true,320),false);assert.equal(g.update(.2,false,360),false);
});

test('lighter short touches trigger once while tiny threshold jitter stays silent',()=>{
 const g=new FingerClick();g.update(.62,false,0);g.update(.62,false,40);
 assert.equal(g.update(.35,false,60),false);assert.equal(g.update(.35,false,80),true);
 for(let t=100;t<300;t+=20)assert.equal(g.update(.35,false,t),false);
});
