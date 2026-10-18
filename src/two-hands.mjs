import {StringGestures} from './string-gestures.mjs';
import {clamp} from './gestures.mjs';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const open=p=>p?.length===21&&[8,12,16,20].every(i=>dist(p[i],p[0])>dist(p[i-2],p[0])*1.18)&&dist(p[4],p[8])>dist(p[0],p[9])*.55;
const center=p=>({x:(p[0].x+p[5].x+p[9].x+p[17].x)/4,y:(p[0].y+p[9].y)/2});
export class TwoHands {
 constructor(){this.reset();this.lastResolve=-Infinity;}
 reset(){this.strings=new StringGestures();this.since=null;this.wideSince=null;this.nearSince=null;this.armed=false;this.amount=0;this.lastTime=null;}
 update(hands,now){
  if(hands.length!==2||!hands.every(open)){this.reset();return {active:false,amount:0,resolve:false};}
  if(this.since===null)this.since=now;
  const size=dist(hands[0][0],hands[0][9])+dist(hands[1][0],hands[1][9]);
  const ratio=dist(center(hands[0]),center(hands[1]))/Math.max(.06,size);
  const target=clamp((ratio-.5)/1.8);
  const dt=this.lastTime===null?33:Math.min(100,now-this.lastTime);this.lastTime=now;
  this.amount+=(target-this.amount)*(1-Math.exp(-dt/90));
  const active=now-this.since>=240;
  if(!active)return {active:false,amount:0,resolve:false};
  if(target>.75){if(this.wideSince===null)this.wideSince=now;if(now-this.wideSince>=200)this.armed=true;}else this.wideSince=null;
  let resolve=false;
  if(this.armed&&target<.2){
   if(this.nearSince===null)this.nearSince=now;
   if(now-this.nearSince>=120&&now-this.lastResolve>=1800){resolve=true;this.lastResolve=now;this.armed=false;this.nearSince=null;}
  }else this.nearSince=null;
  const [left,right]=[...hands].sort((a,b)=>center(a).x-center(b).x).map(center);
  const stringAction=this.strings.update(this.amount,(left.y+right.y)/2,right.y-left.y,now);
  return {active:true,amount:this.amount,resolve,stringAction};
 }
}
