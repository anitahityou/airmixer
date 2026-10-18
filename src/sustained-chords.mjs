// One voice per piano key: repeated strikes renew sustain, not voice count.
export class SustainedChords {
 constructor(makeVoice,hold=10.5){this.makeVoice=makeVoice;this.hold=hold;this.voices=new Map();this.until=new Map();}
 strike(notes,time,velocity=.65){
  const active=new Set(notes);
  // Keep the pedal tail, but make room for the new harmony instead of accumulating clashes.
  for(const [note,voice] of this.voices)if(!active.has(note))voice.volume?.rampTo(-39,.24);
  const level=-11-10*Math.log10(Math.max(1,active.size)/4);
  for(const note of active){
   if(!this.voices.has(note))this.voices.set(note,this.makeVoice());
   this.voices.get(note).volume?.rampTo(level,.012);
   this.voices.get(note).triggerAttack(note,time,velocity);
   this.until.set(note,time+this.hold);
  }
 }
 tick(time){for(const [note,end] of this.until)if(time>=end){this.voices.get(note).triggerRelease(time);this.until.delete(note);}}
 stop(time){for(const note of this.until.keys())this.voices.get(note).triggerRelease(time);this.until.clear();}
}
