import {WaterSurface} from './water-surface';
import {projectPoint,gesturePoint} from './hand-screen.mjs';
import './style.css';
import {TwoHands} from './two-hands.mjs';
import {SoundVisuals} from './sound-visuals';
import {MusicEngine,type Accent} from './audio';
import {CameraTracker} from './camera';
import {GestureController,clamp} from './gestures.mjs';
const icons={play:'<path d="m9 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',camera:'<rect x="3" y="5" width="18" height="14" rx="4"/><circle cx="12" cy="12" r="3"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',hand:'<path d="M8 13V6a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v8-6a2 2 0 0 1 4 0v10c0 5-3 8-7 8-3 0-5-2-7-5l-3-5a2 2 0 0 1 3-2l2 3"/>',wave:'<path d="M3 12h2l2-7 4 14 3-14 3 14 2-7h2"/>'};
const icon=(name:keyof typeof icons)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
document.querySelector('#app')!.innerHTML=`
<header><a class="brand" href="/" aria-label="AirMixer 首页"><span class="brand-symbol">${icon('wave')}</span>airmixer</a><button id="help" class="text-button">操作指南 <span>↗</span></button></header>
<main>
<div class="workspace"><section class="stage-panel panel" aria-label="手势控制台"><div class="stage-top"><div class="mode-switch" role="group" aria-label="控制方式"><button id="cameraMode">${icon('camera')} 摄像头</button></div><span class="tracking-pill" id="tracking"><span class="tiny-dot"></span> CAMERA OFF</span></div>
<div id="stage" class="stage" tabindex="0" role="application" aria-label="摄像头手势演奏区"><video id="video" autoplay muted playsinline></video><canvas id="visual"></canvas><canvas id="hands"></canvas><canvas id="soundVisual" aria-hidden="true"></canvas><div id="intro" class="stage-intro"><div class="hand-icon">${icon('hand')}</div><button id="startMusic" class="start-music">开启摄像头并演奏 ↗</button></div><div id="cursor"><span></span><small id="cursorText">FILTER + ENERGY</small></div><div class="stage-corner tl"></div><div class="stage-corner tr"></div><div class="stage-corner bl"></div><div class="stage-corner br"></div><section class="screen-transport" aria-label="音乐播放器"><button id="play" class="play-button" aria-label="开始音乐">${icon('play')}</button><div class="track-title"><strong>Chill Drift</strong><span id="patternName">乐句 01</span></div><div class="waveform" id="waveform" aria-hidden="true">${Array.from({length:48},(_,i)=>`<i style="--height:${8+Math.abs(Math.sin(i*1.7)*Math.cos(i*.27))*25}px"></i>`).join('')}</div><div class="music-meta"><strong>88 <span>BPM</span></strong><span>Gm → Cm → D7</span></div><div class="beat-display"><div id="beats">${[0,1,2,3].map(()=>'<i></i>').join('')}</div><span id="bar">01 / 08</span></div></section><div class="stage-bottom"><span id="status" role="status" aria-live="polite">点击开始，允许摄像头后用手演奏</span><span id="phrase" class="phrase-feedback" role="status" aria-live="polite"></span></div><div id="effectBadge" class="effect-badge" hidden>BREAKDOWN</div></div>
</section>
</div>


</main>
<dialog id="guide"><button id="closeGuide" aria-label="关闭指南">×</button><h2>手势与音效</h2><p>先将掌心朝向摄像头张开约半秒，再翻转展示手背。新增：手背 / 单根手指 / 竖大拇指 / 比耶，保持约四分之一秒触发线条波纹；回到张掌后可再次触发。快速横向挥动立即演奏，冷却 3 秒。</p><p>所有有效手势共同推进 Gm → Cm → D7 → Gm。采用《bad guy》的主和弦循环；伴奏和回声跟随当前和弦。</p><p>先点播放。摄像头模式请将一只或两只手完整放进画面，保持光线充足。</p><div class="guide-list"><div><b>⟷</b><span><strong>双手拉开 → 空间泛音</strong>两只手都张开，保持片刻后向两侧拉开。双手之间的弦线可演奏：拉开 / 收拢触发约 30 秒和弦，上下移动 / 一高一低触发约 15 秒旋律。</span></div><div><b>⟶⟵</b><span><strong>双手合拢 → 和弦收束</strong>先充分拉开，再保持张掌合拢到靠近，触发一次合奏光波。无需拍手接触。</span></div><div><b>✌</b><span><strong>V 手势 → 下一和弦</strong>食指、中指伸直分开，其余两指收起，保持片刻。</span></div><div><b>♬</b><span><strong>摇滚手势 → 下一和弦</strong>伸出食指和小指，中指、无名指收起。</span></div><div><b>◌</b><span><strong>张掌侧倾 → 回旋音</strong>掌心朝向镜头，五指张开，整只手向左右侧倾约 35°，保持片刻。以上三种动作触发后，回到竖直张掌再触发。</span></div><div><b>·</b><span><strong>食指点按 → 下一和弦</strong>食指朝镜头快速点一下再收回，或食指与拇指轻碰后分开；每次立即弹出长延音和弦，再踩拍加入约 15 秒节奏。触屏设备也可直接点画面。也支持其余三指收起后，食指弯下再伸直。</span></div><div><b>⇅</b><span><strong>上下滑动 → 下一和弦</strong>张开手掌明显向上或向下滑动。触发扫音，再延续约 15 秒旋律与彩色光轨，冷却 0.75 秒。</span></div><div><b>↔</b><span><strong>左右移动 → Filter</strong>改变亮度与拨弦质感，变化连续平滑。</span></div><div><b>↕</b><span><strong>上下移动 → Energy</strong>下一拍增减声部，配轻微上扬或回落气声。</span></div><div><b>◎</b><span><strong>捏合 → FX</strong>捏紧出现踩拍的晶莹音符；松开散成三音回声。</span></div><div><b>↘</b><span><strong>张手 / 合手 → 下一和弦</strong>合手加入约 30 秒低音乐句；张手在小节线上铺开约 30 秒和弦。</span></div><div><b>↗</b><span><strong>快速横挥 → 波纹和弦</strong>快速横向挥动立即触发下一个和弦与线条波纹。冷却 3 秒。</span></div></div><p class="guide-footer">每个动作留下至少 10 秒乐句，并加入 踩拍 DJ 回声与扫频。双手连接线支持拉开、收拢、上下移动与倾斜演奏。摄像头画面仅在本机处理。</p><button id="gotIt" class="primary-button">知道了 ${icon('arrow')}</button></dialog>`;
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const engine=new MusicEngine(), camera=new CameraTracker(), gestures=new GestureController(),twoHands=new TwoHands();
let x=.65,y=.52,energy=2,fx=0,breakdown=false,cameraReady=false,modeEpoch=0,points:any=null,inference=0,lastResult=0;
let playingBusy=false;
const soundVisuals=new SoundVisuals();
const waterCanvas=document.createElement('canvas');waterCanvas.id='waterSurface';waterCanvas.setAttribute('aria-hidden','true');$('stage').appendChild(waterCanvas);
const water=new WaterSurface(waterCanvas);
const pairGestures=[new GestureController(),new GestureController()];
let phraseUntil=0,clickCount=0,stringPulseUntil=0,stringColor=0;
const stringColors=['#ff80d5','#78dcff','#c7a0ff','#ffe6ad','#8cf1cf'];
let trackedHands:any[]=[],pairMode=false,pairActive=false,pairAmount=0;
let handFeedback:{x:number;y:number;name:string;until:number}|null=null;
const trails=new Map<string,{x:number;y:number;at:number}[]>();
engine.onPhrase=(name,eventOrigin)=>{
 if(!engine.state.playing||document.hidden)return;
 const now=performance.now();
 if(name.startsWith('弦线')||name==='双手合奏'){stringPulseUntil=now+2400;stringColor=(stringColor+1)%stringColors.length;}
 if(name!=='晶莹脉冲'&&name!=='双手泛音'){$('phrase').textContent=`${engine.diagnostics().chord} · ${name==='指尖点按'?`点按 ${++clickCount}`:name}`;phraseUntil=now+1000;}
 let origin={x:.08+x*.84,y:.08+y*.84};
 if(points){
  const point=(name.startsWith('双手')||name.startsWith('弦线'))&&trackedHands.length===2?{x:(trackedHands[0][9].x+trackedHands[1][9].x)/2,y:(trackedHands[0][9].y+trackedHands[1][9].y)/2}:name==='指尖点按'?points[8]:points[9];
  const video=$<HTMLVideoElement>('video'),rect=$('stage').getBoundingClientRect();
  const scale=Math.min(rect.width/(video.videoWidth||640),rect.height/(video.videoHeight||480));
  const vw=(video.videoWidth||640)*scale,vh=(video.videoHeight||480)*scale;
  origin={x:((rect.width-vw)/2+(1-point.x)*vw)/rect.width,y:((rect.height-vh)/2+point.y*vh)/rect.height};
 }
 if(eventOrigin){origin=eventOrigin;handFeedback={...origin,name:`${engine.diagnostics().chord} · ${name}`,until:now+850};}
 soundVisuals.trigger(name,origin.x,origin.y,now);water.trigger(name,origin.x,origin.y,now);
};
function status(message:string){$('status').textContent=message;}
function apply(articulate=true){engine.setControls(x,energy,fx,breakdown,articulate);renderControls();}
function renderControls(){
 $('effectBadge').hidden=!breakdown&&!engine.state.pending&&!pairActive;
 $('effectBadge').textContent=pairActive?`双手空间 · ${Math.round(pairAmount*100)}%`:breakdown?'↘ BREAKDOWN':`↗ 转场倒计时 ${8-Math.floor(engine.state.step/16)} 小节`;
 $('cursorText').textContent=breakdown?'BREAKDOWN':fx>.05?'PINCH FX':'FILTER + ENERGY';
 $('cursor').style.display='none';$('cursor').classList.toggle('pinching',fx>.05);
}
function renderPlayback(){
 $('play').innerHTML=icon(engine.state.playing?'pause':'play');
 $('play').setAttribute('aria-label',engine.state.playing?'暂停音乐':'开始音乐');
 document.body.classList.toggle('playing',engine.state.playing);
}
async function play(){
 if(playingBusy)return;playingBusy=true;$<HTMLButtonElement>('play').disabled=true;
 try{
  if(engine.state.playing){engine.pause();soundVisuals.clear();water.clear();status('已暂停');}
  else{
   await engine.start();
   if(!cameraReady)await startCamera();
   if(!cameraReady)engine.pause();
   else{apply();status('食指点按 · 双手弦线 · DJ 回声随节拍融合');}
  }
 }catch(error){engine.pause();status('启动失败，请再次点击开始。');console.error(error);}
 finally{renderPlayback();playingBusy=false;$<HTMLButtonElement>('play').disabled=false;}
}
$('play').onclick=play;
$('startMusic').onpointerdown=e=>e.stopPropagation();$('startMusic').onclick=play;
function transition(direction=1){if(engine.transition(direction)){status('转场已排队 · 当前 8 小节结束后进入下一段');renderControls();}else if(!engine.state.playing)status('先点击播放，再触发转场');}

function accent(type:Accent,hand:any=points){
 if(!engine.state.playing){status('先点击播放');return;}
 const p=hand?projectHand(gesturePoint(type,hand)):null;
 engine.gesture(type,p?{x:p.x/w,y:p.y/h}:undefined);
}

engine.onBeat=()=>{const s=engine.state.step;$('patternName').textContent=`乐句 0${engine.state.variation+1}`;$('beats').querySelectorAll('i').forEach((el,i)=>el.classList.toggle('lit',i===Math.floor(s%16/4)));$('bar').textContent=`${String(Math.floor(s/16)+1).padStart(2,'0')} / 08`;renderControls();};
function clearHolds(){trails.clear();handFeedback=null;pairGestures.forEach(c=>c.reset());twoHands.reset();gestures.reset();pairActive=false;pairMode=false;pairAmount=0;trackedHands=[];engine.setSpread(0);soundVisuals.clear();water.clear();breakdown=false;fx=0;apply(false);}
async function startCamera(){
 const epoch=++modeEpoch;camera.stop();cameraReady=false;points=null;clearHolds();$<HTMLVideoElement>('video').srcObject=null;
 document.body.classList.add('camera-mode');$('tracking').textContent='正在连接摄像头…';
 try{await camera.start($<HTMLVideoElement>('video'),s=>{if(epoch===modeEpoch)status(s);});if(epoch!==modeEpoch)return;cameraReady=true;lastResult=performance.now();$('tracking').textContent='请将手放入画面';}
 catch(error){if(epoch!==modeEpoch)return;const e=error as Error;const messages:Record<string,string>={NotAllowedError:'请在浏览器中允许摄像头，然后点击摄像头重试',NotFoundError:'未找到摄像头，请连接后重试',NotReadableError:'摄像头被占用，请关闭其他使用摄像头的应用后重试'};status(messages[e.name]||e.message);$('tracking').textContent='点击摄像头重试';}
}
$('cameraMode').onclick=()=>startCamera();
camera.onEnded=()=>{cameraReady=false;points=null;clearHolds();status('摄像头连接中断 · 点击摄像头重试');$('tracking').textContent='CAMERA DISCONNECTED';};
camera.onResult=(p,ms,hands)=>{
 points=p;inference=ms;lastResult=performance.now();
 if(hands.length===2){
   if(!pairMode){clearHolds();gestures.reset();pairMode=true;}
   trackedHands=hands;
   [...hands].sort((a,b)=>a[0].x-b[0].x).forEach((hand,i)=>{
    const r=pairGestures[i].update(hand,lastResult);
    if(r?.tap)accent('tap',hand);
    if(r?.handAction)accent(r.handAction as Accent,hand);
    if(r?.slideDirection)accent(r.slideDirection>0?'slide-up':'slide-down',hand);
    if(r?.special)accent(r.special as Accent,hand);
    if(r?.swipe)accent('wave',hand);
   });
   const pair=twoHands.update(hands,lastResult);
   pairActive=pair.active;pairAmount=pair.amount??0;engine.setSpread(pairAmount);
   if(pair.resolve)accent('resolve');
   else if(pair.stringAction)accent(pair.stringAction as Accent);
   $('tracking').textContent=pairActive?'双手演奏':'双手张掌，保持片刻';renderControls();return;
 }
 if(pairMode){clearHolds();gestures.reset();}
 trackedHands=hands;
 const result=gestures.update(p,lastResult);
 if(result){if(!result.lost){x=result.x??x;y=result.y??y;energy=result.energy;}fx=result.fx;breakdown=result.breakdown;if(result.swipe)accent('wave');apply(!result.lost&&!result.handAction);if(result.handAction)accent(result.handAction as Accent);if(result.special)accent(result.special as Accent);if(result.tap)accent('tap');if(result.slideDirection)accent(result.slideDirection>0?'slide-up':'slide-down');}
 $('tracking').innerHTML=`<span class="tiny-dot"></span> ${p?(result?.tap?'点击已捕捉':result?.state==='point'?'食指点按就绪':'食指与拇指轻碰 → 重击'):'LOOKING FOR HAND'}`;
};
const stage=$('stage');
// Real touchscreen taps are input too; this does not restore mouse Demo mode.
stage.addEventListener('pointerdown',e=>{
 if((e.pointerType==='touch'||e.pointerType==='pen')&&e.isPrimary&&!(e.target as HTMLElement).closest('button,.screen-transport'))accent('tap');
});
window.addEventListener('blur',clearHolds);
document.addEventListener('visibilitychange',()=>{if(document.hidden){++modeEpoch;camera.stop();cameraReady=false;points=null;clearHolds();status('摄像头已释放 · 点击摄像头重新连接');$('tracking').textContent='CAMERA OFF';}});
window.addEventListener('pagehide',()=>camera.stop());
$('help').onclick=()=>{clearHolds();$<HTMLDialogElement>('guide').showModal();};$('closeGuide').onclick=$('gotIt').onclick=()=>$<HTMLDialogElement>('guide').close();
const canvas=$<HTMLCanvasElement>('visual'),ctx=canvas.getContext('2d')!,handCanvas=$<HTMLCanvasElement>('hands'),hc=handCanvas.getContext('2d')!,soundCanvas=$<HTMLCanvasElement>('soundVisual'),sc=soundCanvas.getContext('2d')!;
let w=1,h=1,dpr=1;
function projectHand(p:any){const video=$<HTMLVideoElement>('video');return projectPoint(p,w,h,video.videoWidth||640,video.videoHeight||480);}

new ResizeObserver(()=>{const r=stage.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio,2);for(const c of[canvas,handCanvas,soundCanvas]){c.width=w*dpr;c.height=h*dpr;}ctx.setTransform(dpr,0,0,dpr,0,0);hc.setTransform(dpr,0,0,dpr,0,0);sc.setTransform(dpr,0,0,dpr,0,0);}).observe(stage);
const edges=[[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[0,17]];
let lastUI=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
function draw(now:number){
 ctx.clearRect(0,0,w,h);hc.clearRect(0,0,w,h);sc.clearRect(0,0,w,h);water.draw($<HTMLVideoElement>('video'),w,h,now,reduced);if(!water.available||reduced)soundVisuals.draw(sc,w,h,now,reduced,$<HTMLVideoElement>('video'));
 const t=reduced?0:now*.00018,playing=engine.state.playing;
 const levels=engine.spectrum();
 const finger=points&&now-lastResult<250?projectHand(points[8]):null;
 const cx=w/2+(finger&&!reduced?(finger.x-w/2)*.28:0),cy=h*.48+(finger&&!reduced?(finger.y-h*.48)*.28:0),rad=Math.min(w*.36,h*.31);
 const glow=ctx.createRadialGradient(cx,cy,rad*.2,cx,cy,rad*1.6);
 glow.addColorStop(0,'rgba(105,210,196,.07)');glow.addColorStop(.6,'rgba(132,128,225,.04)');glow.addColorStop(1,'rgba(105,210,196,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 for(let ring=0;ring<(cameraReady?0:36);ring++){
  ctx.beginPath();
  for(let j=0;j<=160;j++){
   const a=j/160*Math.PI*2,band=Number(levels[(j+ring)%64]),amp=playing&&!reduced?clamp((band+90)/65):0;
   const r=rad*(.48+ring*.018)+Math.sin(a*3+t*3+ring*.14)*(10+energy*2)+Math.sin(a*7-t*2)*4+amp*11;
   const px=cx+Math.cos(a+t*.2)*r*1.18,py=cy+Math.sin(a+t*.2)*r*.84;
   if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.strokeStyle=`hsla(${breakdown?265:155+ring*1.9},65%,75%,${.08+ring/36*.33})`;
  ctx.lineWidth=.8;ctx.stroke();
 }
 for(const [handIndex,hand] of (now-lastResult<250?(trackedHands.length?trackedHands:points?[points]:[]):[]).entries()){
   // Mirror source coordinates and match the video's object-fit: contain rectangle.
   const pos=projectHand;
   hc.strokeStyle='rgba(210,245,255,.22)';hc.fillStyle='rgba(220,250,255,.3)';hc.lineWidth=1;
   edges.forEach(edge=>{hc.beginPath();edge.forEach((n,i)=>{const p=pos(hand[n]);if(i===0)hc.moveTo(p.x,p.y);else hc.lineTo(p.x,p.y);});hc.stroke();});
   hand.forEach((p:any)=>{const q=pos(p);hc.beginPath();hc.arc(q.x,q.y,3,0,Math.PI*2);hc.fill();});
   for(const tip of [4,8,12,16,20]){
    const q=pos(hand[tip]),key=`${handIndex}:${tip}`;
    let path=(trails.get(key)??[]).filter(p=>now-p.at<220);
    if(!reduced){path.push({...q,at:now});path=path.slice(-18);}else path=[];
    trails.set(key,path);
    hc.save();hc.strokeStyle=tip===8?'#ffe6ad':'#9feeff';hc.lineWidth=tip===8?2:1;
    for(let i=1;i<path.length;i++){
     if(Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y)>100)continue;
     hc.globalAlpha=(1-(now-path[i].at)/220)*.65;hc.beginPath();hc.moveTo(path[i-1].x,path[i-1].y);hc.lineTo(path[i].x,path[i].y);hc.stroke();
    }
    hc.globalAlpha=.8;hc.beginPath();hc.arc(q.x,q.y,tip===8?9:5,0,Math.PI*2);hc.stroke();hc.restore();
   }
   if(fx>.05){const a=pos(hand[4]),b=pos(hand[8]);hc.beginPath();hc.arc((a.x+b.x)/2,(a.y+b.y)/2,14+fx*22,0,Math.PI*2);hc.lineWidth=3;hc.stroke();}
 }
 if(now-lastResult>=250)trails.clear();
 if(handFeedback&&now<handFeedback.until){
  hc.save();hc.globalAlpha=Math.min(1,(handFeedback.until-now)/250);hc.font='12px system-ui';hc.fillStyle='#e6fbff';
  const labelWidth=hc.measureText(handFeedback.name).width;
  hc.fillText(handFeedback.name,Math.max(12,Math.min(w-labelWidth-12,handFeedback.x*w+18)),Math.max(24,handFeedback.y*h-20));hc.restore();
 }
 if(pairActive){
   const a=trackedHands.length===2?projectHand(trackedHands[0][9]):{x:w*(.42-pairAmount*.22),y:h*.45};
   const b=trackedHands.length===2?projectHand(trackedHands[1][9]):{x:w*(.58+pairAmount*.22),y:h*.45};
   hc.save();hc.strokeStyle=stringColors[stringColor];hc.lineWidth=now<stringPulseUntil?2.5:1.3;hc.globalAlpha=.25+pairAmount*.4;
   for(let i=0;i<5;i++){hc.beginPath();hc.moveTo(a.x,a.y);hc.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2+(i-2)*(12+pairAmount*22)+(now<stringPulseUntil&&!reduced?Math.sin(now*.018+i)*14:0),b.x,b.y);hc.stroke();}
   for(const p of [a,b]){hc.beginPath();hc.arc(p.x,p.y,12+pairAmount*14,0,Math.PI*2);hc.stroke();}hc.restore();
 }
 if(now-lastUI>100){lastUI=now;$('waveform').querySelectorAll<HTMLElement>('i').forEach((b,i)=>{b.style.height=playing?`${4+clamp((Number(levels[i])+90)/65)*29}px`:'';});if(now>phraseUntil)$('phrase').textContent='';
 if(cameraReady&&now-lastResult>800){points=null;trackedHands=[];if(pairMode)clearHolds();const r=gestures.update(null,now);if(r){fx=0;breakdown=false;apply(false);}}
 }
 requestAnimationFrame(draw);
}
apply();requestAnimationFrame(draw);
// Read-only diagnostics for repeatable browser QA; no camera images or audio are stored.
Object.defineProperty(window,'airmixerDiagnostics',{value:()=>({audio:engine.diagnostics(),controls:{x,y,energy,fx,breakdown},camera:{mode:'camera',ready:cameraReady,handDetected:!!points,handCount:trackedHands.length,twoHands:pairActive,inferenceMs:inference}})});
