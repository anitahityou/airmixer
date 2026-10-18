import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['src/audio.ts'],bundle:true,write:false,platform:'node',format:'cjs',external:['tone']});
const param=()=>({rampTo(){},setValueAtTime(){},linearRampToValueAtTime(){},cancelAndHoldAtTime(){}});
class Node{
 constructor(){this.outputs=[];this.ready=Promise.resolve();this.gain=param();this.wet=param();this.frequency=param();this.Q=param();this.pan=param();}
 connect(n){this.outputs.push(n);return this;}disconnect(){this.outputs=[];}toDestination(){return this;}
 chain(...nodes){let n=this;for(const next of nodes){n.connect(next);n=next;}return this;}
 set(){}start(){return this;}releaseAll(){}
}
const transport={bpm:{value:0},start(){},pause(){}};
const tone={start:async()=>{},getTransport:()=>transport,getContext:()=>({state:'running'}),immediate:()=>0};
for(const n of ['Limiter','Compressor','Gain','Meter','FFT','Filter','FeedbackDelay','Reverb','MembraneSynth','NoiseSynth','MonoSynth','PolySynth','Synth','FMSynth','Panner','Loop'])tone[n]=Node;
const module={exports:{}};vm.runInNewContext(outputFiles[0].text,{module,exports:module.exports,require:()=>tone,performance});
test('drums stay dry, bass is separate, and tonal buses share sidechain pumping',async()=>{
 const engine=new module.exports.MusicEngine();await engine.start();
 assert.equal(transport.bpm.value,88);
 for(const i of [0,1,2])assert.equal(engine.layers[i].outputs[0],engine.master);
 assert.equal(engine.layers[3].outputs[0],engine.bassPump);
 assert.equal(engine.layers[4].outputs[0],engine.filter);
 assert.equal(engine.backing.outputs[0],engine.musicPump);
 assert.equal(engine.accentPan.outputs[0],engine.musicPump);
 assert.equal(engine.orbitPan.outputs[0],engine.musicPump);
 engine.pause();assert.equal(engine.state.playing,false);
});
