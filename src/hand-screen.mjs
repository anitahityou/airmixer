// Shared contain + mirror mapping for skeleton, cursor and event origins.
export function projectPoint(p,w,h,vw=640,vh=480){
 const scale=Math.min(w/vw,h/vh),width=vw*scale,height=vh*scale;
 return {x:(w-width)/2+(1-p.x)*width,y:(h-height)/2+p.y*height};
}
export function gesturePoint(type,hand){
 if(type==='thumbs-up')return hand[4];
 if(type==='tap')return hand[8];
 if(type==='roll')return {x:(hand[8].x+hand[12].x)/2,y:(hand[8].y+hand[12].y)/2};
 if(type==='single'){
  const tips=[8,12,16,20];
  const reach=i=>Math.hypot(hand[i].x-hand[0].x,hand[i].y-hand[0].y)/Math.max(.001,Math.hypot(hand[i-2].x-hand[0].x,hand[i-2].y-hand[0].y));
  return hand[tips.sort((a,b)=>reach(b)-reach(a))[0]];
 }
 return hand[9];
}
