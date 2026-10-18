import test from 'node:test';
import assert from 'node:assert/strict';
import {projectPoint,gesturePoint} from '../src/hand-screen.mjs';
test('hand projection mirrors and respects video letterboxing in wide and tall stages',()=>{
 assert.deepEqual(projectPoint({x:0,y:0},1000,480),{x:820,y:0});
 assert.deepEqual(projectPoint({x:1,y:1},1000,480),{x:180,y:480});
 assert.deepEqual(projectPoint({x:.5,y:.5},640,1000),{x:320,y:500});
});
test('each hand supplies its own finger anchor; thumb and V use their actual tips',()=>{
 const left=Array.from({length:21},(_,i)=>({x:.2+i*.001,y:.3}));
 const right=left.map(p=>({...p,x:p.x+.5}));
 assert.equal(gesturePoint('tap',left),left[8]);assert.equal(gesturePoint('tap',right),right[8]);
 assert.equal(gesturePoint('thumbs-up',right),right[4]);
 assert.deepEqual(gesturePoint('roll',left),{x:(left[8].x+left[12].x)/2,y:.3});
});
