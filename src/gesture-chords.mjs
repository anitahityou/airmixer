// Main harmony of bad guy; gesture order controls this simplified loop.
export const SONG_CHORDS=[
 {name:'Gm',root:'G1',notes:['G3','Bb3','D4']},
 {name:'Cm',root:'C2',notes:['G3','C4','Eb4']},
 {name:'D7',root:'D2',notes:['A3','C4','D4','F#4']}
];
export class GestureHarmony {
 constructor(){this.index=0;}
 next(){const chord=SONG_CHORDS[this.index];this.index=(this.index+1)%SONG_CHORDS.length;return chord;}
}
