import test from 'node:test';
import assert from 'node:assert/strict';
import {TwoHands} from '../src/two-hands.mjs';
function hand(x,scale=.5,fist=false){
 const p=Array.from({length:21},()=>({x:.5,y:.5}));p[0]={x:.5,y:.8};
 for(const [base,px] of [[5,.4],[9,.5],[13,.6],[17,.7]]){p[base]={x:px,y:.5};p[base+1]={x:px,y:.38};p[base+2]={x:px,y:.25};p[base+3]={x:px,y:fist?.68:.12};}
 p[4]={x:.23,y:.38};return p.map(q=>({x:(q.x-.5)*scale+x,y:(q.y-.5)*scale+.5}));
}
const wide=()=>[hand(.17),hand(.83)],near=()=>[hand(.46),hand(.54)];
function frames(g,hands,start,end){const out=[];for(let t=start;t<=end;t+=20)out.push(g.update(hands,t));return out;}
test('two hands require open palms and a stable acquisition',()=>{const g=new TwoHands();assert.equal(g.update(wide(),0).active,false);assert.equal(g.update(wide(),200).active,false);assert.equal(g.update(wide(),260).active,true);assert.equal(g.update([hand(.17,.5,true),hand(.83)],280).active,false);});
test('spreading then deliberately closing triggers one resolve',()=>{const g=new TwoHands();const opening=frames(g,wide(),0,800);assert.ok(opening.at(-1).amount>.85);const closing=frames(g,near(),820,1800);assert.equal(closing.filter(r=>r.resolve).length,1);assert.ok(closing.at(-1).amount<.02);});
test('simply appearing with close hands does not resolve',()=>{const g=new TwoHands();assert.equal(frames(g,near(),0,1500).some(r=>r.resolve),false);});
test('loss of one hand is silent and disarms the closing gesture',()=>{const g=new TwoHands();frames(g,wide(),0,800);const lost=g.update([hand(.17)],820);assert.equal(lost.resolve,false);assert.equal(lost.amount,0);assert.equal(frames(g,near(),840,1600).some(r=>r.resolve),false);});
test('detector hand ordering cannot change spread amount',()=>{const a=new TwoHands(),b=new TwoHands();for(let t=0;t<=1000;t+=20){const hands=wide();const ra=a.update(hands,t),rb=b.update(t%40?hands.reverse():hands,t);assert.equal(ra.amount,rb.amount);assert.equal(ra.resolve,rb.resolve);}});
test('brief crossings cannot produce a resolve',()=>{const g=new TwoHands();frames(g,wide(),0,800);assert.equal(g.update(near(),820).resolve,false);assert.equal(g.update(near(),880).resolve,false);assert.equal(g.update(wide(),900).resolve,false);});
test('spread normalization is stable across hand sizes',()=>{for(const scale of [.35,.5,.65]){const g=new TwoHands();const r=frames(g,[hand(.5-.66*scale,scale),hand(.5+.66*scale,scale)],0,1000).at(-1);assert.ok(r.amount>.9&&r.amount<1);}});
