// One phrase per intentional pose. Rearm only after a steady neutral palm;
// brief misclassification or tracking loss must not retrigger the same pose.
export class PoseAccents {
  constructor(){this.candidate=null;this.since=0;this.neutralSince=null;this.armed=true;this.last=-Infinity;}
  lose(){this.candidate=null;this.neutralSince=null;this.armed=false;}
  update(shape,neutral,now){
    if(neutral){
      if(this.neutralSince===null)this.neutralSince=now;
      if(now-this.neutralSince>=160)this.armed=true;
    }else this.neutralSince=null;
    if(shape!==this.candidate){this.candidate=shape;this.since=now;}
    if(shape&&this.armed&&now-this.since>=220&&now-this.last>=1200){
      this.armed=false;this.last=now;return shape;
    }
    return null;
  }
}
