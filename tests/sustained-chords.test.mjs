import test from 'node:test';
import assert from 'node:assert/strict';
import {SustainedChords} from '../src/sustained-chords.mjs';
function setup(){const events=[];let count=0;return {events,get count(){return count;},p:new SustainedChords(()=>{count++;return {triggerAttack:(n,t)=>events.push(['on',n,t]),triggerRelease:t=>events.push(['off',t])};})};}
test('each piano chord sustains over ten seconds before releasing',()=>{const {p,events}=setup();p.strike(['C3','E3','G3','B3'],0);p.tick(10);assert.equal(events.length,4);p.tick(10.5);assert.equal(events.filter(e=>e[0]==='off').length,4);});
test('repeated strikes renew shared keys without growing the voice pool',()=>{const s=setup();for(let i=0;i<60;i++)s.p.strike(['C3','E3','G3'],i*.1);assert.equal(s.count,3);s.p.tick(11);assert.equal(s.events.filter(e=>e[0]==='off').length,0);s.p.tick(17);assert.equal(s.events.filter(e=>e[0]==='off').length,3);});
test('new chords do not cut held notes; pause clears all sustained keys',()=>{const {p,events}=setup();p.strike(['C3','E3'],0);p.strike(['F3','Ab3'],1);assert.equal(events.length,4);p.stop(2);assert.equal(p.until.size,0);assert.equal(events.filter(e=>e[0]==='off').length,4);});

test('old non-chord notes recede while common tones stay foreground and held',()=>{
 const voices=new Map();let current;
 const p=new SustainedChords(()=>{const v={volume:{rampTo:n=>v.level=n},triggerAttack:n=>voices.set(n,v),triggerRelease:()=>{}};return v;});
 p.strike(['C3','E3','G3','B3'],0);p.strike(['F3','A3','C3','E3'],1);
 assert.equal(voices.get('G3').level,-39);assert.equal(voices.get('B3').level,-39);
 assert.equal(voices.get('C3').level,-11);assert.equal(p.until.get('G3'),10.5);
});
