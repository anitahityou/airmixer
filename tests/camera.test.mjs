import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const {code}=await transform(await readFile(new URL('../src/camera.ts',import.meta.url),'utf8'),{loader:'ts',format:'esm'});
const {CameraTracker}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
function setup(t,{permission,modelError=false,protocol='http:'}={}){
 const originals=new Map();const install=(key,value)=>{originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});};
 let stops=0;const track={onended:null,stop(){stops++;}};const stream={getTracks:()=>[track],getVideoTracks:()=>[track]};
 const instances=[];
 class WorkerStub{
   constructor(){this.terminated=false;instances.push(this);}
   postMessage(message){if(message.type==='init')queueMicrotask(()=>this.onmessage?.({data:modelError?{type:'error'}:{type:'ready'}}));}
   terminate(){this.terminated=true;}
 }
 install('window',{isSecureContext:true,setTimeout});install('location',{protocol});install('document',{baseURI:'http://localhost:5173/'});
 install('navigator',{mediaDevices:{getUserMedia:permission??(async()=>stream)}});install('Worker',WorkerStub);
 const video={srcObject:null,play:async()=>{},readyState:0,currentTime:0};
 t.after(()=>{for(const [key,descriptor] of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}});
 return {video,stream,track,instances,stops:()=>stops};
}
test('camera permission denial returns an actionable error',async t=>{const e=new DOMException('Denied','NotAllowedError');const h=setup(t,{permission:async()=>{throw e;}});const camera=new CameraTracker();await assert.rejects(camera.start(h.video,()=>{}),{name:'NotAllowedError'});assert.equal(h.instances.length,0);});
test('camera stop releases every track and terminates inference worker',async t=>{const h=setup(t);const camera=new CameraTracker();const statuses=[];await camera.start(h.video,s=>statuses.push(s));assert.equal(h.video.srcObject,h.stream);assert.ok(statuses.at(-1).includes('已就绪'));camera.stop();assert.equal(h.stops(),1);assert.equal(h.instances[0].terminated,true);});
test('late camera permission after switching to Demo immediately releases the device',async t=>{let grant;const pending=new Promise(resolve=>{grant=resolve;});const h=setup(t,{permission:()=>pending});const camera=new CameraTracker();const start=camera.start(h.video,()=>{});camera.stop();grant(h.stream);await start;assert.equal(h.stops(),1);assert.equal(h.video.srcObject,null);assert.equal(h.instances.length,0);});
test('model load failure releases webcam and leaves retry possible',async t=>{const h=setup(t,{modelError:true});const camera=new CameraTracker();await assert.rejects(camera.start(h.video,()=>{}),/手势模型加载失败/);assert.equal(h.stops(),1);assert.equal(h.instances[0].terminated,true);});
test('camera track ending clears resources and notifies the UI',async t=>{const h=setup(t);const camera=new CameraTracker();let ended=false;camera.onEnded=()=>{ended=true;};await camera.start(h.video,()=>{});h.track.onended();assert.equal(ended,true);assert.equal(h.stops(),1);assert.equal(h.instances[0].terminated,true);});
test('opening files directly preserves Demo but explains localhost for camera',async t=>{const h=setup(t,{protocol:'file:'});const camera=new CameraTracker();await assert.rejects(camera.start(h.video,()=>{}),/localhost 或 HTTPS/);assert.equal(h.instances.length,0);});
