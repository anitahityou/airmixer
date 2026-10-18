import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['src/audio.ts'],bundle:true,write:false,platform:'node',format:'cjs',external:['tone']});
const module={exports:{}};let clock=10;
vm.runInNewContext(outputFiles[0].text,{module,exports:module.exports,require:()=>({immediate:()=>clock}),performance});
const {MusicEngine}=module.exports;
test('each click gives immediate feedback but its rhythm starts on the beat',()=>{
 const e=new MusicEngine(),notes=[],visuals=[];e.index=5;e.state.playing=true;
 e.piano={strike:(chord,time,velocity)=>notes.push([chord,10.5,time,velocity])};e.notify=(...a)=>visuals.push(a);
 for(let i=0;i<6;i++){clock=10+i*.16;assert.equal(e.gesture('tap'),true);assert.equal(notes[i][2],clock+.005);}
 assert.equal(notes.length,6);assert.equal(visuals.length,6);
 assert.equal(e.composition.parts.get('rhythm').start,8);
 assert.equal(e.composition.parts.size,1);
 e.state.playing=false;assert.equal(e.gesture('tap'),false);assert.equal(notes.length,6);
});
test('chords align to bars and motion melodies align to beats while all gestures acknowledge immediately',()=>{
 const e=new MusicEngine(),heard=[];e.state.playing=true;e.index=5;e.piano={strike:()=>{}};e.notify=name=>heard.push(name);
 for(const type of ['open','close','slide-up','strings-wide'])assert.equal(e.gesture(type),true);
 assert.equal(heard.length,4);assert.equal(e.composition.parts.get('harmony').start,16);assert.equal(e.composition.parts.get('melody').start,8);
});
test('mixed gesture types share a single progression; paused gestures do not advance it',()=>{
 const e=new MusicEngine();e.state.playing=true;e.piano={strike:()=>{}};e.notify=()=>{};
 const chords=[];
 for(const type of ['tap','open','close','slide-up','strings-wide','roll']){e.gesture(type);chords.push(e.currentChord.name);}
 assert.deepEqual(chords,['Gm','Cm','D7','Gm','Cm','D7']);
 e.state.playing=false;e.gesture('tap');e.state.playing=true;e.gesture('tap');assert.equal(e.currentChord.name,'Gm');
});
