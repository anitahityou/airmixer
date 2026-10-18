// Relative two-palm movement plays the connecting strings. No event on acquisition.
export class StringGestures {
 constructor(){this.reset();}
 reset(){this.anchor=null;this.last=-Infinity;}
 update(amount,y,tilt,now){
  if(!this.anchor){this.anchor={amount,y,tilt};return null;}
  if(now-this.last<1000)return null;
  const a=this.anchor;
  const action=amount-a.amount>.18?'strings-wide':a.amount-amount>.18?'strings-near':y-a.y<-.1?'strings-up':y-a.y>.1?'strings-down':Math.abs(tilt-a.tilt)>.18?'strings-tilt':null;
  if(action){this.anchor={amount,y,tilt};this.last=now;}
  return action;
 }
}
