import test from 'node:test';
import assert from 'node:assert/strict';
import {StringGestures} from '../src/string-gestures.mjs';
test('all five string gestures are distinct',()=>{
 for(const [amount,y,tilt,expected] of [[.8,.5,0,'strings-wide'],[.2,.5,0,'strings-near'],[.5,.3,0,'strings-up'],[.5,.7,0,'strings-down'],[.5,.5,.3,'strings-tilt']]){
  const g=new StringGestures();assert.equal(g.update(.5,.5,0,0),null);assert.equal(g.update(amount,y,tilt,200),expected);
 }
});
test('holding, jitter and reacquisition are silent; cooldown limits rapid changes',()=>{
 const g=new StringGestures();g.update(.5,.5,0,0);
 assert.equal(g.update(.8,.5,0,100),'strings-wide');assert.equal(g.update(.8,.5,0,500),null);assert.equal(g.update(.2,.5,0,600),null);
 assert.equal(g.update(.2,.5,0,1200),'strings-near');g.reset();assert.equal(g.update(.8,.2,.4,1400),null);
 assert.equal(g.update(.81,.21,.41,1500),null);
});
