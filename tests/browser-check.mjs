// Optional: install playwright and Chromium, run against npm run dev.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.AIRMIXER_URL||'http://127.0.0.1:5173');
 assert.equal(await page.locator('#demoMode').count(),0);
 await page.click('#startMusic');
 await page.waitForFunction(()=>window.airmixerDiagnostics().camera.ready,null,{timeout:60000});
 await page.waitForFunction(()=>window.airmixerDiagnostics().audio.playing&&window.airmixerDiagnostics().audio.levelDb>-80);
 await page.waitForFunction(()=>window.airmixerDiagnostics().camera.inferenceMs>0);
 await page.click('#play');assert.equal(await page.evaluate(()=>window.airmixerDiagnostics().audio.playing),false);
 await page.click('#play');await page.waitForFunction(()=>window.airmixerDiagnostics().audio.playing);
 await page.click('#help');assert.equal(await page.locator('#guide').evaluate(d=>d.open),true);await page.click('#gotIt');
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 const denied=await browser.newPage();await denied.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('denied','NotAllowedError');};});
 await denied.goto(process.env.AIRMIXER_URL||'http://127.0.0.1:5173');await denied.click('#startMusic');
 await denied.waitForFunction(()=>document.querySelector('#status').textContent.includes('允许摄像头'));
 await denied.waitForFunction(()=>!window.airmixerDiagnostics().audio.playing);
 assert.equal(await denied.locator('#startMusic').isVisible(),true);
 assert.deepEqual(errors,[]);
 console.log('PASS camera-only UI, fake camera inference, audio meter, pause/resume, guide, mobile layout and permission denial. Real hand/audio validation remains manual.');
}finally{await browser.close();}
