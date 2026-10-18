import test from 'node:test';
import assert from 'node:assert/strict';
import {GestureController,filterHz} from '../src/gestures.mjs';
function hand({x=.5,y=.55,fist=false,pinch=false,scale=1,point=false,bend=false,pose=null,angle=0}={}){
 const p=Array.from({length:21},()=>({x:.5,y:.5,z:0}));
 p[0]={x:.5,y:.8};p[9]={x:.5,y:.5};
 for(const [base,px] of [[5,.4],[9,.5],[13,.6],[17,.7]]){
   p[base]={x:px,y:.5};p[base+1]={x:px,y:.38};p[base+2]={x:px,y:.25};p[base+3]={x:px,y:fist||(point&&(base!==5||bend))||(pose==='v'&&base>=13)||(pose==='horns'&&(base===9||base===13))?.68:.12};
 }
 p[4]={x:.23,y:.38};if(pinch)p[4]={x:p[8].x+.025,y:p[8].y};
 return p.map(q=>{const dx=q.x-.5,dy=q.y-.8;return {x:(dx*Math.cos(angle)-dy*Math.sin(angle))*scale+x,y:(dx*Math.sin(angle)+dy*Math.cos(angle)+.15)*scale+y,z:0};});
}
function steady(g,opts,start=0,end=400){let result;for(let t=start;t<=end;t+=20)result=g.update(hand(opts),t);return result;}
test('filter stays between 400 Hz and 12 kHz, logarithmic midpoint',()=>{assert.equal(filterHz(-3),400);assert.equal(filterHz(4),12000);assert.ok(Math.abs(filterHz(.5)-Math.sqrt(400*12000))<.001);});
test('fist requires a sustained hold and takes priority over pinch',()=>{const g=new GestureController();assert.equal(g.update(hand({fist:true,pinch:true}),0).breakdown,false);assert.equal(g.update(hand({fist:true,pinch:true}),120).breakdown,false);const r=g.update(hand({fist:true,pinch:true}),180);assert.equal(r.breakdown,true);assert.equal(r.fx,0);assert.equal(r.swipe,false);});
test('brief classification jitter does not enter breakdown',()=>{const g=new GestureController();g.update(hand({fist:true}),0);g.update(hand(),60);assert.equal(g.update(hand(),120).breakdown,false);});
test('pinch amount is normalized against hand size',()=>{for(const scale of [.55,1,1.5]){const g=new GestureController();const r=steady(g,{pinch:true,scale});assert.equal(r.state,'pinch');assert.ok(r.fx>.8&&r.fx<=1);}});
test('release exits fist after debounce; tracking loss clears effects',()=>{const g=new GestureController();steady(g,{fist:true});assert.equal(steady(g,{},420,560).breakdown,false);steady(g,{pinch:true},600,900);assert.equal(g.update(null,1000),null);const r=g.update(null,1300);assert.equal(r.lost,true);assert.equal(r.fx,0);assert.equal(r.breakdown,false);});
test('small motion and vertical travel do not trigger swipe',()=>{const g=new GestureController();for(let t=0;t<1000;t+=20)assert.equal(g.update(hand({x:.5+Math.sin(t)*.025,y:.2+t/2000}),t).swipe,false);});
test('fast horizontal open-palm motion triggers once, cooldown prevents duplicates',()=>{const g=new GestureController();let count=0;for(let t=0;t<=200;t+=20)if(g.update(hand({x:.8-t*.003}),t).swipe)count++;assert.equal(count,1);for(let t=220;t<2000;t+=20)if(g.update(hand({x:.5+Math.sin(t/110)*.3}),t).swipe)count++;assert.equal(count,1);});
test('horizontal motion while fist or pinch candidate cannot trigger swipe',()=>{for(const shape of [{fist:true},{pinch:true}]){const g=new GestureController();for(let t=0;t<=200;t+=20)assert.equal(g.update(hand({...shape,x:.8-t*.003}),t).swipe,false);}});
test('energy moves to extremes after stable dwell',()=>{const g=new GestureController();assert.equal(steady(g,{y:.1},0,800).energy,4);assert.equal(steady(g,{y:.9},820,1800).energy,1);});
test('energy boundary jitter is held by hysteresis',()=>{const g=new GestureController();for(let t=0;t<1200;t+=20){const r=g.update(hand({y:.5+Math.sin(t)*.01}),t);assert.equal(r.energy,2);}});
test('tracking reacquisition cannot bridge an old swipe trajectory',()=>{const g=new GestureController();g.update(hand({x:.8}),0);g.update(null,50);assert.equal(g.update(hand({x:.1}),100).swipe,false);});

test('index click needs a stable pointing pose and a complete short bend-release',()=>{const g=new GestureController();steady(g,{point:true},0,160);for(let t=180;t<=260;t+=20){const r=g.update(hand({point:true,bend:true}),t);assert.equal(r.breakdown,false);assert.equal(r.tap,false);}const r=g.update(hand({point:true}),280);assert.equal(r.tap,true);assert.equal(r.swipe,false);assert.equal(r.breakdown,false);assert.equal(g.update(hand({point:true}),300).tap,false);});
test('long finger closure becomes a fist instead of a click',()=>{const g=new GestureController();steady(g,{point:true},0,160);const r=steady(g,{point:true,bend:true},180,650);assert.equal(r.breakdown,true);assert.equal(g.update(hand({point:true}),680).tap,false);});
test('pointing motion alone cannot trigger click, swipe or slide',()=>{const g=new GestureController();for(let t=0;t<=500;t+=20){const r=g.update(hand({point:true,x:.3+t*.001,y:.2+t*.001}),t);assert.equal(r.tap,false);assert.equal(r.swipe,false);assert.equal(r.slideDirection,0);}});
test('tracking loss cancels an in-progress click',()=>{const g=new GestureController();steady(g,{point:true},0,160);g.update(hand({point:true,bend:true}),180);g.update(null,200);assert.equal(g.update(hand({point:true}),260).tap,false);});
test('up and down palm slides produce distinct directions without horizontal transition',()=>{for(const sign of [-1,1]){const g=new GestureController();let events=[];for(let t=0;t<=200;t+=20){const r=g.update(hand({y:.5+sign*t*.0012}),t);if(r.slideDirection)events.push(r.slideDirection);assert.equal(r.swipe,false);}assert.deepEqual(events,[-sign]);}});
test('pinch, fist and jitter cannot produce palm slide accents',()=>{for(const pose of [{fist:true},{pinch:true},{}]){const g=new GestureController();for(let t=0;t<=500;t+=20){const r=g.update(hand({...pose,y:.5+Math.sin(t/80)*(Object.keys(pose).length?.3:.02)}),t);assert.equal(r.slideDirection,0);}}});
test('palm slide cooldown blocks repeated accents for 750 milliseconds',()=>{const g=new GestureController();let count=0;for(let t=0;t<750;t+=20){const r=g.update(hand({y:.5+Math.sin(t/110)*.25}),t);if(r.slideDirection)count++;}assert.equal(count,1);});

test('V and rock poses produce distinct accents and exclude movement gestures',()=>{for(const [pose,expected] of [['v','roll'],['horns','strum']]){const g=new GestureController();const events=[];for(let t=0;t<2000;t+=20){const r=g.update(hand({pose,x:.5+Math.sin(t/100)*.15}),t);if(r.special)events.push(r.special);assert.equal(r.swipe,false);assert.equal(r.slideDirection,0);assert.equal(r.breakdown,false);}assert.deepEqual(events,[expected]);}});
test('palm tilt uses mirrored screen directions and does not trigger near neutral',()=>{for(const [angle,expected] of [[.7,'orbit-left'],[-.7,'orbit-right'],[.2,null]]){const g=new GestureController();const events=[];for(let t=0;t<1000;t+=20){const r=g.update(hand({angle}),t);if(r.special)events.push(r.special);}assert.deepEqual(events,expected?[expected]:[]);}});
test('pinch and fist suppress tilted-palm accents',()=>{for(const pose of [{fist:true},{pinch:true}]){const g=new GestureController();for(let t=0;t<1000;t+=20)assert.equal(g.update(hand({...pose,angle:.7}),t).special,null);}});

test('six fast index clicks are all detected without a shared cooldown',()=>{
 const g=new GestureController();let count=0;
 for(let cycle=0;cycle<6;cycle++){
  const start=cycle*160;
  steady(g,{point:true},start,start+60);
  steady(g,{point:true,bend:true},start+80,start+100);
  const r=g.update(hand({point:true}),start+120);
  if(r.tap)count++;
  assert.equal(r.breakdown,false);
 }
 assert.equal(count,6);
});
test('index threshold jitter cannot count as a complete click',()=>{
 const g=new GestureController();steady(g,{point:true},0,160);
 for(let t=180;t<900;t+=20){
  const p=hand({point:true});const wrist=p[0],joint=p[6];
  const ratio=t%40?1.1:1.2;
  p[8]={x:wrist.x+(joint.x-wrist.x)*ratio,y:wrist.y+(joint.y-wrist.y)*ratio};
  assert.equal(g.update(p,t).tap,false);
 }
 assert.equal(g.update(hand({point:true}),920).tap,false);
});
test('single-frame bends shorter than 25 ms are ignored',()=>{
 const g=new GestureController();steady(g,{point:true},0,160);
 g.update(hand({point:true,bend:true}),180);
 assert.equal(g.update(hand({point:true}),200).tap,false);
});

test('natural thumb/index touches reach the audio tap event without a pointing pose',()=>{
 const g=new GestureController();let count=0;
 for(let i=0;i<5;i++){
  const t=i*240;
  steady(g,{},t,t+80);
  for(const dt of [100,140,180]){
   const r=g.update(hand({pinch:true}),t+dt);
   if(r.tap)count++;
   assert.equal(r.breakdown,false);
  }
 }
 assert.equal(count,5);
});

test('single raised finger triggers once and re-arms after neutral palm',()=>{
 const g=new GestureController(),events=[];
 for(let t=0;t<800;t+=20){const r=g.update(hand({point:true}),t);if(r.special)events.push(r.special);}
 assert.deepEqual(events,['single']);steady(g,{},800,1100);
 for(let t=1200;t<1600;t+=20){const r=g.update(hand({point:true}),t);if(r.special)events.push(r.special);}
 assert.deepEqual(events,['single','single']);
});
test('thumb up does not enter breakdown or trigger close',()=>{
 const g=new GestureController(),events=[];
 for(let t=0;t<800;t+=20){
  const p=hand({fist:true});p[2]={x:.3,y:.58};p[3]={x:.3,y:.43};p[4]={x:.3,y:.22};
  const r=g.update(p,t);if(r.special)events.push(r.special);
  assert.equal(r.breakdown,false);assert.equal(r.handAction,null);
 }
 assert.deepEqual(events,['thumbs-up']);
});
test('back of either hand is detected after palm calibration, not while edge-on',()=>{
 for(const side of [1,-1]){
  const g=new GestureController(),events=[];
  for(let t=0;t<1400;t+=20){
   const p=hand().map(q=>({...q,x:.5+(q.x-.5)*side*(t<500?1:-1)}));
   const r=g.update(p,t);if(r.special)events.push(r.special);
  }
  assert.deepEqual(events,['backhand']);
 }
});
