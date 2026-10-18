import {build,context} from 'esbuild';
import {cp,mkdir,readFile,writeFile,access,rm} from 'node:fs/promises';
const mode=process.argv[2]||'build';
if(!['build','dev','preview'].includes(mode))throw new Error('Use build, dev, or preview.');
for(const asset of ['public/models/hand_landmarker.task','public/wasm/vision_wasm_internal.wasm']){
 try{await access(asset);}catch{throw new Error('Missing local hand-tracking assets. Run npm run assets first.');}
}
await rm('dist',{recursive:true,force:true});
await mkdir('dist/assets',{recursive:true});
await cp('public','dist',{recursive:true,filter:source=>!source.endsWith('hand-worker.js')});
const html=(await readFile('index.html','utf8')).replace('href="/favicon.svg"','href="./favicon.svg"').replace('</head>','<link rel="stylesheet" href="./assets/app.css"></head>').replace('type="module" src="/src/main.ts"','defer src="./assets/app.js"');
await writeFile('dist/index.html',html);
const shared={bundle:true,platform:'browser',target:'es2022',minify:mode!=='dev',sourcemap:mode==='dev',logLevel:'info'};
const appOptions={...shared,entryPoints:['src/main.ts'],format:'iife',outfile:'dist/assets/app.js'};
// MediaPipe loads WASM using importScripts: use a classic bundled worker.
const workerOptions={...shared,entryPoints:['src/hand.worker.ts'],format:'iife',outfile:'dist/hand-worker.js'};
if(mode==='build'){
 await build(workerOptions);await build(appOptions);console.log('AirMixer built in dist/ (includes local camera model and WASM).');
}else{
 const worker=await context(workerOptions);const app=await context(appOptions);
 await worker.watch();await app.watch();
 const port=Number(process.env.PORT)||(mode==='preview'?4173:5173);
 try{
   const server=await app.serve({servedir:'dist',host:'127.0.0.1',port});
   console.log(`AirMixer: http://127.0.0.1:${server.port} — source edits rebuild automatically; refresh your browser.`);
 }catch(error){await app.dispose();await worker.dispose();throw error;}
 const shutdown=async()=>{await app.dispose();await worker.dispose();process.exit(0);};
 process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
}
