import test from 'node:test';
import assert from 'node:assert/strict';
import {BPM,BEAT,clubStep,pump,harmonyAt} from '../src/club-grid.mjs';
test('88 BPM chill rhythm leaves space between drum hits',()=>{
 assert.equal(BPM,88);assert.equal(BEAT,60/88);
 assert.deepEqual(Array.from({length:16},(_,i)=>i).filter(i=>clubStep(i).kick),[0,10]);
 assert.deepEqual(Array.from({length:16},(_,i)=>i).filter(i=>clubStep(i).clap),[8]);
 assert.equal(clubStep(4).offset,0);assert.ok(clubStep(5).offset>0&&clubStep(5).offset<.04);
});
test('transition builds only in final bar and drops on eight-bar boundaries',()=>{
 assert.equal(clubStep(16,true).drop,false);assert.equal(clubStep(111,true).build,false);
 assert.equal(clubStep(112,true).build,true);assert.equal(clubStep(128,true).drop,true);
 assert.equal(clubStep(128,false).drop,false);
});
test('sidechain recovers before next kick and uses the same BPM',()=>{
 const calls=[];pump({cancelAndHoldAtTime:t=>calls.push(['cancel',t]),linearRampToValueAtTime:(v,t)=>calls.push([v,t])},10);
 assert.deepEqual(calls[0],['cancel',10]);assert.equal(calls[1][0],.88);assert.equal(calls[2][0],1);assert.ok(calls[2][1]<10+BEAT);
});
test('all accents share the accompaniment harmony',()=>{
 assert.deepEqual(harmonyAt(0),harmonyAt(31));assert.notDeepEqual(harmonyAt(31),harmonyAt(32));assert.deepEqual(harmonyAt(0),harmonyAt(128));
});

