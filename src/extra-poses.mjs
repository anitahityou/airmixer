// A stable initial open palm calibrates camera orientation for either hand.
// Edge-on palms are ignored: their winding sign is too noisy to classify.
export class PalmSurface {
 constructor(){this.reference=0;this.candidate=0;this.since=0;}
 update(p,open,now){
  const ax=p[5].x-p[0].x,ay=p[5].y-p[0].y;
  const bx=p[17].x-p[0].x,by=p[17].y-p[0].y;
  const scale=Math.max(.001,Math.hypot(p[9].x-p[0].x,p[9].y-p[0].y));
  const area=(ax*by-ay*bx)/(scale*scale);
  if(!open||Math.abs(area)<.22){this.candidate=0;return false;}
  const sign=Math.sign(area);
  if(!this.reference){
   if(sign!==this.candidate){this.candidate=sign;this.since=now;}
   if(now-this.since>=280)this.reference=sign;
   return false;
  }
  return sign!==this.reference;
 }
}
export function thumbUp(p,curled,scale){
 return Math.hypot(p[3].x-p[2].x,p[3].y-p[2].y)>scale*.12&&curled.every(Boolean)&&p[4].y<p[3].y-scale*.12&&p[4].y<p[2].y-scale*.35&&Math.abs(p[4].x-p[2].x)<scale*.55;
}
