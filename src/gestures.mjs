import {PalmSurface,thumbUp} from './extra-poses.mjs';
import {HandEdges,FingerPoke} from './hand-actions.mjs';
import {FingerClick} from './click.mjs';
import {PoseAccents} from './pose-accents.mjs';
export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const filterHz = x => 400 * Math.pow(30, clamp(x));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export class GestureController {
  constructor(){ this.reset(); }
  reset(){ this.surface=new PalmSurface(); this.handEdges=new HandEdges(); this.poke=new FingerPoke(); this.lastClick=-Infinity; this.fingerClick=new FingerClick(); this.poseAccents=new PoseAccents(); this.state='palm'; this.candidate='palm'; this.since=0; this.energy=2; this.nextEnergy=2; this.energySince=0; this.history=[]; this.lastSwipe=-Infinity; this.lastSeen=0; this.x=.65; this.y=.5; this.pointSince=null; this.tapPress=null; this.lastSlide=-Infinity; }
  update(points, now){
    if(!points){
      this.surface=new PalmSurface();this.poseAccents.lose();this.fingerClick.reset();this.poke.reset();this.handEdges.reset();
      this.history=[];this.pointSince=null;this.tapPress=null;
      if(now-this.lastSeen>350){ this.state='palm'; this.candidate='palm'; this.since=now; return {lost:true,x:this.x,y:this.y,energy:this.energy,fx:0,breakdown:false,swipe:false,state:'lost'}; }
      return null;
    }
    this.lastSeen=now;
    const scale=Math.max(.035,distance(points[0],points[9]));
    const curled=[8,12,16,20].map(tip=>distance(points[tip],points[0]) < distance(points[tip-2],points[0])*1.12);
    const thumbs=thumbUp(points,curled,scale);
    const fist=curled.every(Boolean)&&!thumbs;
    const pinch=distance(points[4],points[8])/scale;
    const pinching=pinch<(this.state==='pinch'?.60:.42);
    const indexReach=distance(points[8],points[0])/Math.max(.01,distance(points[6],points[0]));
    const pointShape=curled.slice(1).every(Boolean)&&!pinching;
    const pointing=pointShape&&indexReach>=1.25;
    const open=curled.every(c=>!c)&&!pinching;
    const victory=!curled[0]&&!curled[1]&&curled[2]&&curled[3]&&distance(points[8],points[12])/scale>.25;
    const horns=!curled[0]&&curled[1]&&curled[2]&&!curled[3];
    const tilt=Math.atan2(points[0].x-points[9].x,points[0].y-points[9].y);
    const back=this.surface.update(points,open,now);
    const single=curled.filter(c=>!c).length===1&&!thumbs;
    const pose=thumbs?'thumbs-up':!pinching&&!fist?(back?'backhand':single?'single':victory?'roll':horns?'strum':open&&Math.abs(tilt)>.55&&Math.abs(tilt)<1.25?(tilt>0?'orbit-right':'orbit-left'):null):null;
    let special=this.poseAccents.update(pose,open&&!back&&Math.abs(tilt)<.25,now);
    let tap=false;
    if(!pointShape){this.pointSince=null;this.tapPress=null;}
    else if(pointing){
      if(this.tapPress!==null){
        const duration=now-this.tapPress;
        tap=duration>=25&&duration<=300;
        this.tapPress=null;this.pointSince=now;
      }else if(this.pointSince===null)this.pointSince=now;
    }else if(indexReach<=1.08&&this.pointSince!==null&&now-this.pointSince>=40){
      if(this.tapPress===null)this.tapPress=now;
    }
    if(this.tapPress!==null&&now-this.tapPress>=300){this.pointSince=null;this.tapPress=null;}
    const touch=this.fingerClick.update(pinch,fist,now);
    const poke=this.poke.update(points,pinching||(!pointing&&!open&&this.tapPress===null),now);
    tap=touch||poke||tap;
    // Merge detectors for the same physical click; allow deliberate fast repeats.
    if(tap&&now-this.lastClick<100)tap=false;
    if(tap){this.lastClick=now;special=null;}
    const handAction=this.handEdges.update(open&&!back?'open':fist&&this.tapPress===null?'close':null,now);
    // A brief index bend after a stable pointing pose is a click, not a fist.
    const tapping=this.tapPress!==null;
    const candidate=thumbs?'pose':tapping||pointing?'point':fist?'fist':pinching?'pinch':pose?'pose':'palm';
    if(candidate!==this.candidate){this.candidate=candidate;this.since=now;}
    if(now-this.since >= (candidate==='fist'?130:65)) this.state=candidate;
    const center={x:(points[0].x+points[9].x+points[5].x+points[17].x)/4,y:(points[0].y+points[9].y)/2};
    const x=clamp((1-center.x-.12)/.76), y=clamp((center.y-.12)/.76);
    this.x+=(x-this.x)*.3;this.y+=(y-this.y)*.3;
    const rawEnergy=clamp(Math.floor((1-this.y)*4)+1,1,4);
    const boundary=rawEnergy>this.energy ? 1-this.energy/4-.035 : 1-(this.energy-1)/4+.035;
    const crossed=rawEnergy>this.energy?this.y<boundary:this.y>boundary;
    if(rawEnergy!==this.energy && crossed && this.state==='palm'){
      if(rawEnergy!==this.nextEnergy){this.nextEnergy=rawEnergy;this.energySince=now;}
      if(now-this.energySince>180) this.energy=rawEnergy;
    }else{this.nextEnergy=this.energy;this.energySince=now;}
    let swipe=false,swipeDirection=0,slideDirection=0;
    if(this.state==='palm' && candidate==='palm'&&open){
      this.history.push({x,y,t:now});this.history=this.history.filter(p=>now-p.t<=240);
      const start=this.history[0];const dt=(now-start.t)/1000;
      if(dt>=.08 && dt<=.26 && Math.abs(x-start.x)>.28 && Math.abs(y-start.y)<.18 && Math.abs(x-start.x)/dt>1.35 && now-this.lastSwipe>3000){swipe=true;swipeDirection=Math.sign(x-start.x);this.lastSwipe=now;this.history=[];}
      else if(dt>=.12&&Math.abs(y-start.y)>.17&&Math.abs(x-start.x)<.12&&Math.abs(y-start.y)/dt>.65&&now-this.lastSlide>750){slideDirection=y<start.y?1:-1;this.lastSlide=now;this.history=[];}
    }else this.history=[];
    return {lost:false,x:this.x,y:this.y,energy:this.energy,fx:this.state==='pinch'?clamp((.60-pinch)/.5):0,breakdown:this.state==='fist',swipe,swipeDirection,tap,handAction,slideDirection,special,state:this.state};
  }
}
