export class HandEdges {
 constructor(){this.reset();}
 reset(){this.pose=null;this.candidate=null;this.since=0;}
 update(pose,now){
  if(!pose){this.candidate=null;return null;}
  if(pose!==this.candidate){this.candidate=pose;this.since=now;}
  if(now-this.since<80||this.pose===pose)return null;
  const previous=this.pose;this.pose=pose;
  return previous?pose:null;
 }
}
// Relative depth removes whole-hand translation. A new poke needs a withdrawal.
export class FingerPoke {
 constructor(){this.reset();}
 reset(){this.samples=[];this.latched=false;this.origin=0;}
 update(p,blocked,now){
  if(blocked){this.reset();return false;}
  const scale=Math.max(.035,Math.hypot(p[0].x-p[9].x,p[0].y-p[9].y));
  const depth=((p[8].z??0)-(p[5].z??0))/scale;
  if(!Number.isFinite(depth)){this.reset();return false;}
  if(this.latched){
   if(depth>this.origin-.08){this.latched=false;this.samples=[];}
   return false;
  }
  this.samples.push({depth,t:now});this.samples=this.samples.filter(s=>now-s.t<=260);
  const start=this.samples[0],dt=now-start.t;
  if(dt>=45&&start.depth-depth>.17&&(start.depth-depth)/(dt/1000)>.75){
   this.latched=true;this.origin=start.depth;this.samples=[];return true;
  }
  return false;
 }
}
