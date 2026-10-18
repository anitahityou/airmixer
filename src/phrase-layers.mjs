// Bounded musical parts, advanced by the existing transport (16th notes).
// Repeating a gesture renews its part instead of stacking unlimited loops.
export class PhraseLayers {
 constructor(){this.clear();}
 clear(){this.parts=new Map();this.fxStart=0;this.fxEnd=0;}
 activate(type,index){
  const role=type==='tap'||type==='roll'?'rhythm':type==='close'?'bass':['open','strum','resolve','bloom','strings-wide','strings-near'].includes(type)?'harmony':['slide-up','slide-down','orbit-left','orbit-right','strings-up','strings-down','strings-tilt'].includes(type)?'melody':'texture';
  const quantum=role==='harmony'?16:4;
  const start=Math.ceil(index/quantum)*quantum;
  if(index>=this.fxEnd)this.fxStart=start;
  this.fxEnd=start+128;
  const previous=this.parts.get(role);
  // Renew the lifetime without restarting the musical phrase mid-song.
  const continuing=previous&&previous.end>index;
  this.parts.set(role,{type,start:continuing?previous.start:start,end:start+(role==='harmony'||role==='bass'?256:128)});
 }
 has(role){return this.parts.has(role);}
 takeDj(index){
  if(index<this.fxStart||index>=this.fxEnd||(index-this.fxStart)%16!==0)return null;
  return (index-this.fxStart)%64===0?'sweep':'echo';
 }
 take(index){
  const notes=[];
  for(const [role,p] of this.parts){
   if(index>=p.end){this.parts.delete(role);continue;}
   if(index<p.start)continue;
   const step=index-p.start,fade=Math.min(1,(p.end-index)/32);
   const section=Math.floor(step/32)%4;
   if(role==='harmony'&&step%16===0)notes.push({role,note:0,duration:1.5,velocity:.2*fade});
   if(role==='bass'&&step%4===2)notes.push({role,note:0,duration:.24,velocity:.5*fade});
   if(role==='rhythm'&&step%(p.type==='roll'?2:4)===0)notes.push({role,note:(section%2?[0,1,2,3]:[0,2,1,2])[Math.floor(step/4)%4],duration:.15,velocity:.3*fade});
   if(role==='melody'&&step%4===0){const n=[0,2,1,2][Math.floor(step/4)%4];notes.push({role,note:p.type==='slide-down'||p.type==='orbit-left'||p.type==='strings-down'?3-n:n,duration:.25,velocity:(section===3?.22:.28)*fade});}
   if(role==='texture'&&step%8===0)notes.push({role,note:(step/8)%4,duration:.7,velocity:.25*fade});
  }
  return notes;
 }
}
