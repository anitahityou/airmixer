import test from 'node:test';
import assert from 'node:assert/strict';
import {SONG_CHORDS,GestureHarmony} from '../src/gesture-chords.mjs';
test('song harmony has G minor, C minor and dominant D7 with matching roots',()=>{
 assert.deepEqual(SONG_CHORDS.map(c=>c.root),['G1','C2','D2']);
 assert.deepEqual(SONG_CHORDS.map(c=>c.notes),[['G3','Bb3','D4'],['G3','C4','Eb4'],['A3','C4','D4','F#4']]);
});
test('each event advances one chord and wraps without skipping',()=>{
 const h=new GestureHarmony();
 assert.deepEqual(Array.from({length:7},()=>h.next().name),['Gm','Cm','D7','Gm','Cm','D7','Gm']);
});
