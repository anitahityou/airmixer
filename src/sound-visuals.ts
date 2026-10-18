type Ripple={x:number;y:number;at:number;hue:number};
// Transparent wave fronts, with a narrow magnified band of the live camera.
export class SoundVisuals {
 private ripples:Ripple[]=[];
 private index=0;
 trigger(name:string,x:number,y:number,now:number){
  // Background accompaniment does not disturb the idle water surface.
  if(['DJ 扫频回声','DJ 节拍回声','双手泛音','晶莹脉冲','节奏上扬','节奏回落'].includes(name))return;
  this.ripples.push({x,y,at:now,hue:[185,200,220,170][this.index++%4]});
  this.ripples=this.ripples.slice(-6);
 }
 clear(){this.ripples=[];}
 draw(ctx:CanvasRenderingContext2D,w:number,h:number,now:number,reduced:boolean,video?:HTMLVideoElement){
  this.ripples=this.ripples.filter(r=>now-r.at<3200);
  const unit=Math.min(w,h);
  for(const ripple of this.ripples){
   const age=(now-ripple.at)/3200,cx=ripple.x*w,cy=ripple.y*h;
   for(let ring=0;ring<4;ring++){
    const phase=(reduced?.32:age)-ring*.085;if(phase<=0)continue;
    const radius=unit*(.015+phase*.72),band=Math.max(2,unit*.009*(1-age));
    const fade=Math.sin(Math.min(1,phase*8)*Math.PI/2)*(1-age)**2;
    ctx.save();
    if(!reduced&&video&&video.readyState>=2&&video.videoWidth>0){
     // Clip to an annulus; only the wave front bends the image, not the face inside it.
     ctx.beginPath();ctx.ellipse(cx,cy,radius+band,(radius+band)*.83,0,0,Math.PI*2);
     ctx.ellipse(cx,cy,Math.max(1,radius-band),Math.max(1,radius-band)*.83,0,0,Math.PI*2,true);
     ctx.clip('evenodd');ctx.globalAlpha=fade*.65;
     const scale=Math.min(w/video.videoWidth,h/video.videoHeight);
     const vw=video.videoWidth*scale,vh=video.videoHeight*scale;
     const zoom=1+.016*(1-age);
     ctx.translate(cx,cy);ctx.scale(zoom,zoom);ctx.translate(-cx,-cy);
     ctx.translate(w,0);ctx.scale(-1,1);
     ctx.drawImage(video,(w-vw)/2,(h-vh)/2,vw,vh);
    }
    ctx.restore();ctx.save();
    // Paired light/shadow edges give the transparent surface its glass thickness.
    ctx.lineWidth=2.4;ctx.strokeStyle=`rgba(5,25,40,${fade*.28})`;
    ctx.beginPath();ctx.ellipse(cx,cy+2,radius,radius*.83,0,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=1.1;ctx.strokeStyle=`hsla(${ripple.hue},65%,92%,${fade*.7})`;
    ctx.beginPath();ctx.ellipse(cx,cy,radius,radius*.83,0,0,Math.PI*2);ctx.stroke();
    ctx.lineWidth=.6;ctx.strokeStyle=`rgba(255,255,255,${fade*.5})`;
    ctx.beginPath();ctx.ellipse(cx,cy-1,radius+band,(radius+band)*.83,0,Math.PI*1.1,Math.PI*1.85);ctx.stroke();
    ctx.restore();
   }
  }
 }
}
