export const BPM=88;
export const BEAT=60/BPM;
export const CHORDS=[['A3','C4','E4','A4'],['F3','A3','C4','F4'],['C3','E3','G3','C4'],['G3','B3','D4','G4']];
export const ROOTS=['A1','A1','F1','F1','C2','C2','G1','G1'];
export function harmonyAt(index){return CHORDS[Math.floor((index%128)/32)];}
export function clubStep(index,pending=false){
 const step=index%16;
 return {step,beat:step%4===0,kick:[0,10].includes(step),clap:step===8,hat:step%4===2,offset:step%2?BEAT*.045:0,build:pending&&index%128>=112,drop:pending&&index%128===0};
}
export function pump(gain,time){
 gain.cancelAndHoldAtTime(time);
 gain.linearRampToValueAtTime(.88,time+.008);
 gain.linearRampToValueAtTime(1,time+BEAT*.82);
}
