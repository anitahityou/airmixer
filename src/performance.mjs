// Turns deliberate control edges into short musical phrases. Tracking loss and
// UI cleanup reset this state silently, so they cannot sound like a release.
export class GesturePhrases {
  constructor(){this.reset();this.lastPlayed=-Infinity;}
  reset(input={fx:0,breakdown:false}){this.pinch=input.fx>=.65;this.breakdown=input.breakdown;this.pinchSince=null;this.pending=null;}
  update(input,now,articulate=true){
    if(!articulate){this.reset(input);return;}
    const pinch=input.fx>=(this.pinch?.15:.65);
    let event=null;
    if(input.breakdown!==this.breakdown){event=input.breakdown?'tuck':'bloom';this.pinchSince=null;}
    else if(!input.breakdown){
      if(pinch&&!this.pinch)this.pinchSince=now;
      if(!pinch&&this.pinch&&this.pinchSince!==null&&now-this.pinchSince>=120)event='spark';
    }
    this.pinch=pinch;this.breakdown=input.breakdown;
    if(event){this.pending={type:event,expires:now+900};}
  }
  gesture(type,now){
    if(this.breakdown||this.pinch||!['tap','slide-up','slide-down','roll','strum','orbit-left','orbit-right','resolve'].includes(type))return false;
    if(now-this.lastPlayed<400)return false;
    // Existing fist/release phrases take priority over extra accents.
    if(this.pending&&this.pending.expires>=now)return false;
    this.pending={type,expires:now+1000};return true;
  }
  take(now,onBeat){
    if(!this.pending)return null;
    if(now>this.pending.expires){this.pending=null;return null;}
    if(now-this.lastPlayed<400)return null;
    if(this.pending.type==='bloom'&&!onBeat)return null;
    const event=this.pending.type;this.pending=null;this.lastPlayed=now;return event;
  }
}
