// A thumb/index touch is easier to see than a finger moving toward the lens.
// Require a visible release before each click; lost tracking never clicks.
export class FingerClick {
 constructor(){this.reset();}
 reset(){this.openSince=null;this.closeSince=null;this.armed=false;}
 update(ratio,blocked,now){
  if(blocked){this.reset();return false;}
  if(ratio>.58){
   this.closeSince=null;
   if(this.openSince===null)this.openSince=now;
   if(now-this.openSince>=40)this.armed=true;
  }else if(ratio<.38){
   this.openSince=null;
   if(this.armed){
    if(this.closeSince===null)this.closeSince=now;
    if(now-this.closeSince>=20){this.armed=false;this.closeSince=null;return true;}
   }
  }else{this.openSince=null;this.closeSince=null;}
  return false;
 }
}
