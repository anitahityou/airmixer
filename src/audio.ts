import {SustainedChords} from './sustained-chords.mjs';
import {GestureHarmony,SONG_CHORDS} from './gesture-chords.mjs';
import {BPM,BEAT,clubStep,pump} from './club-grid.mjs';
import {PhraseLayers} from './phrase-layers.mjs';
import * as Tone from 'tone';
import {GesturePhrases} from './performance.mjs';
import {filterHz} from './gestures.mjs';
export type Accent = 'backhand'|'single'|'thumbs-up'|'wave'|'strings-wide'|'strings-near'|'strings-up'|'strings-down'|'strings-tilt'| 'open'|'close'|'tap'|'slide-up'|'slide-down'|'roll'|'strum'|'orbit-left'|'orbit-right'|'resolve';
export type AudioState = {playing:boolean; energy:number; requestedEnergy:number; fx:number; breakdown:boolean; filter:number; step:number; variation:number; pending:boolean; transitions:number};
export class MusicEngine {
  state:AudioState={playing:false,energy:2,requestedEnergy:2,fx:0,breakdown:false,filter:filterHz(.65),step:0,variation:0,pending:false,transitions:0};
  private ready=false;
  private loop?:Tone.Loop;
  private filter!:Tone.Filter;
  private reverb!:Tone.Reverb;
  private delay!:Tone.FeedbackDelay;
  private master!:Tone.Gain;
  private musicPump!:Tone.Gain;
  private bassPump!:Tone.Gain;
  private groovePerc!:Tone.NoiseSynth;
  private kick!:Tone.MembraneSynth;
  private clap!:Tone.NoiseSynth;
  private hat!:Tone.NoiseSynth;
  private bass!:Tone.MonoSynth;
  private pad!:Tone.PolySynth;
  private pluck!:Tone.PolySynth;
  private texture!:Tone.NoiseSynth;
  private layers:Tone.Gain[]=[];
  private meter!:Tone.Meter;
  private fft!:Tone.FFT;
  private index=0;
  private lastTransition=-Infinity;
  private lastAccentTime=-Infinity;
  private fillRemaining=0;
  private throwUntil=0;
  private phrases=new GesturePhrases();
  private composition=new PhraseLayers();
  private harmony=new GestureHarmony();
  private currentChord=SONG_CHORDS[0];
  private phraseVoice!:Tone.PolySynth;
  private djEcho!:Tone.PolySynth;
  private djFilter!:Tone.Filter;
  private bell!:Tone.PolySynth;
  private piano!:SustainedChords;
  private backing!:Tone.Gain;
  private sweep!:Tone.NoiseSynth;
  private sweepFilter!:Tone.Filter;
  private thump!:Tone.MembraneSynth;
  private roll!:Tone.NoiseSynth;
  private orbitPan!:Tone.Panner;
  private orbitBell!:Tone.PolySynth;
  private accentPan!:Tone.Panner;
  private shimmer!:Tone.FeedbackDelay;
  private direction=1;
  private spread=0;
  private soundLabel='';
  private soundUntil=0;
  onPhrase:(name:string,origin?:{x:number;y:number})=>void=()=>{};
  onBeat:()=>void=()=>{};
  async start(){
    await Tone.start();
    if(!this.ready){
      Tone.getContext().lookAhead=.06;
      const limiter=new Tone.Limiter(-2).toDestination();
      const compressor=new Tone.Compressor({threshold:-20,ratio:3,attack:.012,release:.22}).connect(limiter);
      this.master=new Tone.Gain(.68).connect(compressor);
      this.musicPump=new Tone.Gain(1).connect(this.master);
      this.bassPump=new Tone.Gain(1).connect(this.master);
      this.meter=new Tone.Meter({smoothing:.85});limiter.connect(this.meter);
      this.fft=new Tone.FFT(64);limiter.connect(this.fft);
      this.filter=new Tone.Filter({frequency:this.state.filter,type:'lowpass',rolloff:-12,Q:.6});
      this.delay=new Tone.FeedbackDelay({delayTime:'8n.',feedback:.26,wet:.12});
      this.reverb=new Tone.Reverb({decay:4.8,preDelay:.04,wet:.25});
      await this.reverb.ready;
      this.backing=new Tone.Gain(.48).connect(this.musicPump);
      this.filter.chain(this.delay,this.reverb,this.backing);
      this.layers=Array.from({length:7},()=>new Tone.Gain(1).connect(this.filter));
      // Keep drums dry and bass mono: hand effects only process tonal layers.
      for(const i of [0,1,2,3]){this.layers[i].disconnect();this.layers[i].connect(i===3?this.bassPump:this.master);}
      this.groovePerc=new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.001,decay:.045,sustain:0,release:.015},volume:-26}).connect(new Tone.Filter(1800,'bandpass').connect(this.master));
      this.kick=new Tone.MembraneSynth({pitchDecay:.025,octaves:3,oscillator:{type:'sine'},envelope:{attack:.002,decay:.32,sustain:0,release:.08},volume:-20}).connect(this.layers[0]);
      this.clap=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.001,decay:.12,sustain:0,release:.08},volume:-27}).connect(new Tone.Filter(1000,'highpass').connect(this.layers[1]));
      this.hat=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.001,decay:.07,sustain:0,release:.025},volume:-26}).connect(new Tone.Filter(7000,'highpass').connect(this.layers[2]));
      this.bass=new Tone.MonoSynth({oscillator:{type:'triangle'},filter:{type:'lowpass',frequency:850,Q:1.2},envelope:{attack:.04,decay:.3,sustain:.45,release:.65},filterEnvelope:{attack:.01,decay:.15,sustain:.1,release:.12,baseFrequency:120,octaves:3},volume:-23}).connect(this.layers[3]);
      this.pad=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'fatsine',count:2,spread:6},envelope:{attack:.8,decay:1.2,sustain:.6,release:2.8},volume:-25}).connect(this.layers[4]);
      this.pluck=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.025,decay:.8,sustain:0,release:1.2},volume:-27}).connect(this.layers[5]);
      this.texture=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.015,decay:.15,sustain:0,release:.08},volume:-30}).connect(new Tone.Filter(1800,'bandpass').connect(this.layers[6]));
      // Rave accents keep their own bright timbre, through the master limiter.
      this.accentPan=new Tone.Panner(0).connect(this.musicPump);
      this.shimmer=new Tone.FeedbackDelay({delayTime:'8n',feedback:.24,wet:.18}).connect(this.accentPan);
      const raveFilter=new Tone.Filter({frequency:4200,type:'lowpass',Q:.8}).connect(this.shimmer);
      this.bell=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.008,decay:.14,sustain:0,release:.12},volume:-20}).connect(raveFilter);
      this.bell.maxPolyphony=8;
      const djDelay=new Tone.FeedbackDelay({delayTime:'8n',feedback:.32,wet:.3}).connect(this.accentPan);
      this.djFilter=new Tone.Filter({type:'lowpass',frequency:2400,Q:1}).connect(djDelay);
      this.djEcho=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.008,decay:.2,sustain:0,release:.35},volume:-24}).connect(this.djFilter);
      this.djEcho.maxPolyphony=12;
      this.phraseVoice=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.012,decay:.2,sustain:.45,release:.28},volume:-23}).connect(new Tone.Filter(180,'highpass').connect(this.shimmer));
      this.phraseVoice.maxPolyphony=24;
      // Dedicated dry voices: clicks never wait behind beat-quantized gestures.
      this.piano=new SustainedChords(()=>new Tone.FMSynth({harmonicity:2,modulationIndex:2.5,oscillator:{type:'sine'},modulation:{type:'sine'},envelope:{attack:.004,decay:2.8,sustain:.42,release:1.6},modulationEnvelope:{attack:.002,decay:.6,sustain:.015,release:.3},volume:-11}).connect(this.master),10.5);
      this.sweepFilter=new Tone.Filter({type:'bandpass',frequency:800,Q:.7}).connect(this.accentPan);
      this.sweep=new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.07,decay:.35,sustain:0,release:.15},volume:-26}).connect(this.sweepFilter);
      this.thump=new Tone.MembraneSynth({pitchDecay:.025,octaves:2,envelope:{attack:.003,decay:.14,sustain:0,release:.1},volume:-23}).connect(this.master);
      this.roll=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.001,decay:.09,sustain:0,release:.035},volume:-19}).connect(new Tone.Filter(2400,'highpass').connect(this.master));
      this.orbitPan=new Tone.Panner(0).connect(this.musicPump);
      this.orbitBell=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'fatsine',count:2,spread:7},envelope:{attack:.003,decay:.18,sustain:0,release:.12},volume:-23}).connect(new Tone.Filter(3800,'lowpass').connect(this.orbitPan));
      this.orbitBell.maxPolyphony=6;
      Tone.getTransport().bpm.value=BPM;
      this.loop=new Tone.Loop(time=>this.tick(time),'16n').start(0);
      this.ready=true;
    }
    this.setSpread(this.spread);this.phrases.reset(this.state);this.state.playing=true;this.master.gain.rampTo(.68,.15);Tone.getTransport().start('+0.08');
  }
  pause(){if(!this.ready)return;this.state.playing=false;this.composition.clear();this.piano.stop(Tone.immediate());this.phraseVoice.releaseAll(Tone.immediate());this.djEcho.releaseAll(Tone.immediate());this.phrases.reset(this.state);this.master.gain.rampTo(0,.12);Tone.getTransport().pause();}
  setControls(x:number,energy:number,fx:number,breakdown:boolean,articulate=true){
    this.phrases.update({fx,breakdown},performance.now(),articulate&&this.state.playing&&breakdown===this.state.breakdown);
    this.state.filter=filterHz(x);this.state.requestedEnergy=energy;this.state.fx=fx;this.state.breakdown=breakdown;
    if(!this.ready)return;
    this.filter.frequency.rampTo(breakdown?Math.min(950,this.state.filter):this.state.filter,breakdown?.15:.4);
    this.filter.Q.rampTo(breakdown?.6:.6+fx*1.2,.15);
    this.pluck.set({envelope:{decay:.15+x*.22}});
    this.shimmer.wet.rampTo(.12+Math.max(fx,this.spread)*.14,.15);
    this.reverb.wet.rampTo(Math.max(.25,fx*.38,this.spread*.38),.22);this.delay.wet.rampTo(Tone.now()<this.throwUntil?.22:.12+fx*.10,.1);
    this.layers[2].gain.rampTo(breakdown?.16:1,.4);this.layers[5].gain.rampTo(breakdown?.12:1,.4);
  }
  setSpread(value:number){
    this.spread=Math.max(0,Math.min(1,value));
    if(!this.ready)return;
    this.reverb.wet.rampTo(Math.max(.25,this.state.fx*.38,this.spread*.38),.22);
    this.shimmer.wet.rampTo(.12+Math.max(this.state.fx,this.spread)*.14,.22);
    this.pad.set({envelope:{release:2.8+this.spread*1.2}});
  }
  private accentTime(){
    // Two hands can fire in one video frame; mono voices need ordered onsets.
    const time=Math.max(Tone.immediate()+.005,this.lastAccentTime+.008);
    this.lastAccentTime=time;return time;
  }
  private selectChord(type:string,time:number){
    const next=this.harmony.next();
    if(next.name!==this.currentChord.name&&this.ready){
      for(const voice of [this.phraseVoice,this.pad,this.pluck,this.bell,this.orbitBell,this.djEcho])voice.releaseAll(time);
    }
    this.currentChord=next;
  }
  gesture(type:Accent,origin?:{x:number;y:number}){
    if(!this.state.playing)return false;
    this.composition.activate(type,this.index);
    const time=this.accentTime();
    this.selectChord(type,time);
    this.piano.strike(this.currentChord.notes,time,.85);
    const names:Record<string,string>={'backhand':'手背波纹','single':'单指波纹','thumbs-up':'拇指波纹','wave':'挥手波纹','tap':'指尖点按','open':'张手爆发','close':'合手重击','slide-up':'上滑琶音','slide-down':'下滑琶音','strings-wide':'弦线展开','strings-near':'弦线收拢','strings-up':'弦线上扬','strings-down':'弦线下行','strings-tilt':'弦线摇曳','roll':'比耶波纹','strum':'和弦扫奏','orbit-left':'左侧回旋','orbit-right':'右侧回旋','resolve':'双手合奏'};
    this.notify(names[type],time,origin);
    return true;
  }
  transition(direction=1){
    const now=performance.now();if(!this.state.playing||this.state.pending||now-this.lastTransition<3000)return false;
    this.lastTransition=now;this.direction=direction<0?-1:1;this.state.pending=true;return true;
  }
  private tick(time:number){
    this.piano.tick(time);
    const step=this.index%128, s=step%16, bar=Math.floor(step/16);
    const grid=clubStep(this.index,this.state.pending);
    if(grid.beat){pump(this.musicPump.gain,time);pump(this.bassPump.gain,time);}
    const previousEnergy=this.state.energy;
    if(s%4===0)this.state.energy=this.state.requestedEnergy;
    if(grid.drop){this.selectChord('transition',time);this.piano.strike(this.currentChord.notes,time,.85);this.composition.activate('transition',this.index);this.state.variation=(this.state.variation+1)%3;this.state.pending=false;this.state.transitions++;this.fillRemaining=4;this.throwUntil=time+.5;this.delay.wet.setValueAtTime(.22,time);this.delay.wet.linearRampToValueAtTime(.12+this.state.fx*.10,time+.5);}
    const e=this.state.energy;
    const phrase=grid.beat?this.phrases.take(performance.now(),true):null;
    if(phrase){this.selectChord(phrase,time);this.piano.strike(this.currentChord.notes,time,.85);this.composition.activate(phrase,this.index);}
    const chord=this.currentChord.notes;
    const root=this.currentChord.root;
    const djEffect=this.composition.takeDj(this.index);
    if(djEffect){
      this.djFilter.frequency.setValueAtTime(djEffect==='sweep'?700:2600,time);
      if(djEffect==='sweep')this.djFilter.frequency.exponentialRampToValueAtTime(4200,time+BEAT*2);
      this.djEcho.triggerAttackRelease(chord,'8n',time,djEffect==='sweep'?.25:.18);
      this.notify(djEffect==='sweep'?'DJ 扫频回声':'DJ 节拍回声',time);
    }
    for(const part of this.composition.take(this.index)){
      if(part.role==='bass'){if(!grid.build||s<8)this.bass.triggerAttackRelease(root,'16n',time,.65);continue;}
      const note=part.role==='harmony'?chord:[chord[part.note%chord.length]];
      this.phraseVoice.triggerAttackRelease(note,part.duration,time,part.velocity*.65);
    }
    if(phrase){
      this.orbitBell.triggerAttackRelease(chord,'4n',time,.25);
      this.notify(phrase==='spark'?'回声散开':'和弦回弹',time);
    }
    if((this.spread>.55||this.state.fx>.55)&&s%8===0&&!phrase){
      this.bell.triggerAttackRelease(chord,'8n',time,.18);
      this.notify(this.spread>.55?'双手泛音':'晶莹脉冲',time);
    }
    const transitionStart=this.fillRemaining===4;
    if(transitionStart || (e!==previousEnergy&&!this.state.breakdown)){
      const rising=transitionStart?this.direction>0:e>previousEnergy;
      this.sweepFilter.frequency.setValueAtTime(rising?500:3200,time);
      this.sweepFilter.frequency.exponentialRampToValueAtTime(rising?2200:500,time+.8);
      this.accentPan.pan.setValueAtTime(transitionStart?-this.direction*.3:0,time);
      this.accentPan.pan.linearRampToValueAtTime(transitionStart?this.direction*.3:0,time+.38);
      this.accentPan.pan.linearRampToValueAtTime(0,time+.7);
      this.orbitBell.triggerAttackRelease(chord,'4n',time,.28);
      this.notify(transitionStart?(rising?'向右转场':'向左转场'):(rising?'节奏上扬':'节奏回落'),time);
    }
    if(grid.kick)this.kick.triggerAttackRelease('C1','8n',time,.8);
    if(e>=2&&grid.clap)this.clap.triggerAttackRelease('16n',time,.7);
    if(e>=2 && ([2,6,14].includes(s) || (e===4&&s===11)))this.hat.triggerAttackRelease('32n',time+grid.offset,s%4===2?.65:.28);
    if(!this.composition.has('bass')&&(!grid.build||s<8)&&[0,10].includes(s))this.bass.triggerAttackRelease(root,'4n',time,s===0?.82:.55);
    if(s===0&&!this.composition.has('harmony'))this.pad.triggerAttackRelease(chord,'2n',time,.5);
    const pattern=[[3,14],[6,13],[2,11]][this.state.variation];
    if(e>=2&&!this.composition.has('melody')&&pattern.includes(s))this.pluck.triggerAttackRelease(chord[(pattern.indexOf(s)+bar)%chord.length],'16n',time,.6);
    if(e===4 && s===14)this.texture.triggerAttackRelease('8n',time,.45);
    if(this.fillRemaining>0){if(!grid.clap&&s%2===0)this.clap.triggerAttackRelease('32n',time,.35);this.fillRemaining--;}
    if(grid.build&&s>=8&&s%2===0&&!grid.clap)this.clap.triggerAttackRelease('32n',time,.3+(s-12)*.06);
    Tone.getDraw().schedule(()=>{this.state.step=step;this.onBeat();},time);
    this.index++;
  }
  private notify(name:string,time:number,origin?:{x:number;y:number}){Tone.getDraw().schedule(()=>{this.soundLabel=name;this.soundUntil=performance.now()+900;this.onPhrase(name,origin);},time);}
  spectrum():Float32Array|number[]{return this.ready?this.fft.getValue():new Float32Array(64).fill(-100);}
  level(){const v=this.ready?this.meter.getValue():-Infinity;return typeof v==='number'?v:v[0];}
  diagnostics(){return {...this.state,chord:this.currentChord.name,style:'chill',context:Tone.getContext().state,levelDb:this.level(),phrase:performance.now()<this.soundUntil?this.soundLabel:'',spread:this.spread,performanceVoices:this.ready?this.bell.activeVoices:0};}
}
