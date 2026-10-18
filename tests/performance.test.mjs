import test from 'node:test';
import assert from 'node:assert/strict';
import {GesturePhrases} from '../src/performance.mjs';
const state=(fx=0,breakdown=false)=>({fx,breakdown});
test('a sustained pinch release creates one spark, not one per frame',()=>{const p=new GesturePhrases();p.update(state(1),0);p.update(state(),200);assert.equal(p.take(200,false),'spark');for(let t=220;t<900;t+=20){p.update(state(),t);assert.equal(p.take(t,true),null);}});
test('a fleeting pinch cannot produce a release flourish',()=>{const p=new GesturePhrases();p.update(state(1),0);p.update(state(),80);assert.equal(p.take(80,true),null);});
test('pinch threshold hysteresis prevents noisy release notes',()=>{const p=new GesturePhrases();p.update(state(1),0);for(let t=20;t<500;t+=20){p.update(state(t%40?.6:.3),t);assert.equal(p.take(t,true),null);}});
test('fist takes priority over pinch and release bloom waits for a beat',()=>{const p=new GesturePhrases();p.update(state(1),0);p.update(state(0,true),200);assert.equal(p.take(200,false),'tuck');p.update(state(),800);assert.equal(p.take(800,false),null);assert.equal(p.take(810,true),'bloom');});
test('loss of tracking or UI cleanup cancels phrases silently',()=>{const p=new GesturePhrases();p.update(state(1),0);p.update(state(),300,false);assert.equal(p.take(400,true),null);p.update(state(0,true),500);p.update(state(),600,false);assert.equal(p.take(1200,true),null);});
test('brief reacquisition does not sound like an intentional pinch release',()=>{const p=new GesturePhrases();p.reset(state(1));p.update(state(),1000);assert.equal(p.take(1000,true),null);});
test('transient rate is capped and only the newest pending phrase survives',()=>{const p=new GesturePhrases();p.update(state(0,true),0);assert.equal(p.take(0,true),'tuck');p.update(state(),100);assert.equal(p.take(100,true),null);p.update(state(0,true),200);assert.equal(p.take(200,true),null);assert.equal(p.take(500,true),'tuck');assert.equal(p.take(1100,true),null);});
test('stale phrases expire instead of firing after a long interruption',()=>{const p=new GesturePhrases();p.update(state(0,true),0);assert.equal(p.take(1000,true),null);});

test('extra accents are queued once and respect fist/pinch priority',()=>{const p=new GesturePhrases();assert.equal(p.gesture('tap',0),true);assert.equal(p.gesture('slide-up',20),false);assert.equal(p.take(60,false),'tap');assert.equal(p.gesture('tap',200),false);p.update(state(1),700);assert.equal(p.gesture('slide-down',720),false);p.reset(state(0,true));assert.equal(p.gesture('tap',1200),false);});
test('new slide gestures expire when playback is interrupted',()=>{const p=new GesturePhrases();assert.equal(p.gesture('slide-down',0),true);assert.equal(p.take(1100,true),null);});
