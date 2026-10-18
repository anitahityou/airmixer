import {cp, mkdir, writeFile, stat} from 'node:fs/promises';
await mkdir('public/wasm', {recursive:true});
await cp('node_modules/@mediapipe/tasks-vision/wasm', 'public/wasm', {recursive:true});
await mkdir('public/models', {recursive:true});
const file='public/models/hand_landmarker.task';
if (!(await stat(file).catch(()=>null))?.size) {
  const response=await fetch('https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task');
  if(!response.ok) throw new Error(`Model download: HTTP ${response.status}`);
  await writeFile(file, new Uint8Array(await response.arrayBuffer()));
}
console.log('MediaPipe WASM and model are ready locally.');
