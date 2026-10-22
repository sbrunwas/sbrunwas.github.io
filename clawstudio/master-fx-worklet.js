// SPDX-License-Identifier: AGPL-3.0-only
// ClawStudio master performance DSP. Original AudioWorklet processing: no vendor code.
// One audio-thread history ring for rhythmic retrigger/reverse/tape, post FX and macros.
import {normalizeFXParameters} from './master-fx-parameters.js?v=effect-controls-20261022';
const SHUFFLE_ORDERS=[[1,3,0,2],[3,2,1,0],[0,2,1,3]];
class ClawMasterPerformanceProcessor extends AudioWorkletProcessor {
 constructor(){
  super();
  this.length=2**Math.ceil(Math.log2(sampleRate*6+1));this.mask=this.length-1;
  this.histL=new Float32Array(this.length);this.histR=new Float32Array(this.length);
  this.manualL=new Float32Array(this.length);this.manualR=new Float32Array(this.length);this.manualLength=0;this.manualDuration=.5;
  this.delayL=new Float32Array(this.length);this.delayR=new Float32Array(this.length);
  this.params=normalizeFXParameters();this.updateReverb();
  this.write=0;this.queue=[];this.active='OFF';this.start=0;this.startIndex=0;this.duration=.125;this.amount=.76;
  this.manual=null;this.manualStart=0;this.manualEnd=0;
  this.enabled=false;this.mix=.45;this.intensity=.4;this.tempo=126;this.smoothedMix=0;
  this.macro=0;this.macroSmooth=0;this.maps=[{target:'FILTER',depth:.8},{target:'DELAY',depth:.5},{target:'DRIVE',depth:.25},{target:'WIDTH',depth:.35}];
  this.transition=null;
  this.lpL=0;this.lpR=0;this.lpStageL=0;this.lpStageR=0;this.lpThirdL=0;this.lpThirdR=0;this.lpFourthL=0;this.lpFourthR=0;this.lp2L=0;this.lp2R=0;this.lp2StageL=0;this.lp2StageR=0;this.lp2ThirdL=0;this.lp2ThirdR=0;this.lp2FourthL=0;this.lp2FourthR=0;this.holdL=0;this.holdR=0;this.holdCounter=0;
  this.crushL=0;this.crushR=0;this.crushCounter=0;
  const comb=(seconds)=>({buffer:new Float32Array(Math.round(sampleRate*seconds)),at:0,low:0});
  this.combsL=[.0297,.0371,.0411,.0437].map(comb);this.combsR=[.0313,.0389,.0427,.0451].map(comb);
  this.diffuseL=[.005,.0017].map(comb);this.diffuseR=[.0057,.0023].map(comb);this.reverbFrames=0;
  this.port.onmessage=({data})=>{
   if(!data||typeof data!=='object')return;
   switch(data.type){
    case 'state':
     this.enabled=!!data.enabled;this.mix=this.bound(data.mix??.45);this.intensity=this.bound(data.amount??.4);this.tempo=Math.max(40,Math.min(240,Number(data.tempo)||126));
     this.maps=Array.isArray(data.maps)?data.maps.slice(0,4).map(x=>({target:String(x.target),depth:this.boundSigned(x.depth)})):this.maps;
     this.macro=this.bound(data.macro||0);
     this.params=normalizeFXParameters(data.params);this.updateReverb();
     if(!this.enabled){this.active='OFF';this.manual=null;this.queue=[];this.transition=null;this.clearReverb();this.clearDelay()}
     break;
    case 'step': {
     const mode=String(data.effect||'OFF');const event={time:Number(data.at)||0,mode,duration:Math.max(.015,Math.min(4,Number(data.duration)||.125)),amount:this.bound(data.amount??.76)};
     if(this.queue.length>128)this.queue.splice(0,this.queue.length-64);
     this.queue.push(event);this.queue.sort((a,b)=>a.time-b.time);break
    }
    case 'gesture':
     if(data.down){
      this.manual=String(data.effect||'RETRIG');this.manualStart=Math.max(Number(data.at)||currentTime,currentTime);this.manualEnd=0;
      const beats=this.params[this.manual]?.beats??.25;
      this.manualDuration=beats*60/this.tempo;
      this.manualLength=Math.min(this.write,this.length,Math.max(1,Math.round(this.manualDuration*sampleRate)));
      // Freeze the stereo phrase once. Clock events and later ring writes cannot move it.
      const at=(this.write-this.manualLength)&this.mask,first=Math.min(this.manualLength,this.length-at);
      this.manualL.set(this.histL.subarray(at,at+first));this.manualR.set(this.histR.subarray(at,at+first));
      if(first<this.manualLength){this.manualL.set(this.histL.subarray(0,this.manualLength-first),first);this.manualR.set(this.histR.subarray(0,this.manualLength-first),first)}
     }
     else {this.manual=null;this.manualEnd=Number(data.at)||currentTime}
     break;
    case 'macro':this.macro=this.bound(data.value);this.transition=null;break;
    case 'run':this.transition={start:Number(data.start)||currentTime,duration:Math.max(.1,Math.min(30,Number(data.duration)||2)),from:this.bound(data.from??(data.reverse?1:0)),to:this.bound(data.to??(data.reverse?0:1)),returnToDry:data.returnToDry??!data.reverse};break;
    case 'stop':this.manual=null;this.active='OFF';this.queue=[];this.transition=null;this.macro=0;this.clearReverb();this.clearDelay();break;
   }
  };
 }
 updateReverb(){this.reverbFeedbackL=[.0297,.0371,.0411,.0437].map(t=>Math.exp(-6.908*t/this.params.REVERB.decay));this.reverbFeedbackR=[.0313,.0389,.0427,.0451].map(t=>Math.exp(-6.908*t/this.params.REVERB.decay))}
 clearDelay(){this.delayL.fill(0);this.delayR.fill(0)}
 clearReverb(){for(const line of [...this.combsL,...this.combsR,...this.diffuseL,...this.diffuseR]){line.buffer.fill(0);line.low=0;line.at=0}this.reverbFrames=0}
 reverbChannel(input,combs,diffusers,feedback){let sum=0;for(let i=0;i<combs.length;i++){const line=combs[i],delayed=line.buffer[line.at];line.low+=this.params.REVERB.tone*(delayed-line.low);line.buffer[line.at]=input+line.low*feedback[i];line.at=(line.at+1)%line.buffer.length;sum+=delayed*.25}for(const line of diffusers){const delayed=line.buffer[line.at],out=delayed-sum*.5;line.buffer[line.at]=sum+out*.5;line.at=(line.at+1)%line.buffer.length;sum=out}return sum}
 bound(n){return Math.max(0,Math.min(1,Number.isFinite(+n)?+n:0))}
 boundSigned(n){return Math.max(-1,Math.min(1,Number.isFinite(+n)?+n:0))}
 read(buffer,index){return buffer[(Math.floor(index)+this.length)&this.mask]||0}
 applyMode(mode,l,r,time,gesture){
  let outL=l,outR=r;
  const elapsed=Math.max(0,(time-(gesture?this.manualStart:this.start))),frames=elapsed*sampleRate;
  const settings=this.params[mode],beat=60/this.tempo;
  const slice=gesture?this.manualLength:Math.max(1,Math.round(sampleRate*beat*(settings?.beats??.25)));
  const anchor=this.startIndex;
  if(mode==='RETRIG'||mode==='SHUFFLE'||mode==='REVERSE'||mode==='TAPE'){
   let idx;
   const phase=slice?Math.floor(frames)%slice:0;
   let gain=1;
   if(mode==='RETRIG')idx=phase;
   else if(mode==='REVERSE')idx=slice-1-phase;
   else if(mode==='SHUFFLE'){const block=Math.floor(frames/slice),shift=SHUFFLE_ORDERS[settings.order][block%4];idx=shift*slice+phase}
   else {
    const duration=gesture?this.manualDuration:settings.beats*beat,progress=Math.min(1,elapsed/duration);
    idx=sampleRate*duration*(1-(1-progress)**(settings.curve+1))/(settings.curve+1);gain=1-progress;
   }
   if(mode==='RETRIG'||mode==='REVERSE'){
    const fade=Math.min(slice/4,sampleRate*settings.smooth/1000);
    if(fade>0)gain*=Math.min(1,phase/fade,(slice-1-phase)/fade);
   }
   if(gesture){outL=(this.manualL[Math.floor(idx)]||0)*gain;outR=(this.manualR[Math.floor(idx)]||0)*gain}
   else {const origin=anchor-slice*(mode==='SHUFFLE'?4:1);outL=this.read(this.histL,origin+idx)*gain;outR=this.read(this.histR,origin+idx)*gain}
  }else if(mode==='CRUSH'){
   if(this.crushCounter++%Math.round(settings.downsample)===0){this.crushL=l;this.crushR=r}
   const step=2**(Math.round(settings.bits)-1);outL=Math.round(this.crushL*step)/step;outR=Math.round(this.crushR*step)/step;
  }else if(mode==='GATE'){
   const period=Math.max(1,Math.round(sampleRate*beat*settings.beats));
   if(frames%period>=period*settings.width)outL=outR=0;
  }else if(mode==='FILTER'){
   const alpha=1-Math.exp(-6.283*settings.cutoff/sampleRate);
   this.lp2L+=(l-this.lp2L)*alpha;this.lp2R+=(r-this.lp2R)*alpha;
   this.lp2StageL+=(this.lp2L-this.lp2StageL)*alpha;this.lp2StageR+=(this.lp2R-this.lp2StageR)*alpha;
   this.lp2ThirdL+=(this.lp2StageL-this.lp2ThirdL)*alpha;this.lp2ThirdR+=(this.lp2StageR-this.lp2ThirdR)*alpha;
   this.lp2FourthL+=(this.lp2ThirdL-this.lp2FourthL)*alpha;this.lp2FourthR+=(this.lp2ThirdR-this.lp2FourthR)*alpha;
   outL=settings.slope===24?this.lp2FourthL:this.lp2StageL;outR=settings.slope===24?this.lp2FourthR:this.lp2StageR;
  }else if(mode==='DELAY'){
   outL=l*.8+this.echoL*.55;outR=r*.8+this.echoR*.55;
  }else if(mode==='OFF'){this.modeL=l;this.modeR=r;return}
  this.modeL=outL;this.modeR=outR;
 }
 process(inputs,outputs){
  const input=inputs[0]||[],output=outputs[0]||[];if(!output[0])return true;
  const left=input[0],right=input[1]||left;
  const oL=output[0],oR=output[1]||output[0];
  for(let i=0;i<oL.length;i++){
   const t=currentTime+i/sampleRate;
   let l=left?.[i]||0,r=right?.[i]||0;
   this.histL[this.write&this.mask]=l;this.histR[this.write&this.mask]=r;
   const delayOffset=Math.max(1,Math.round(sampleRate*60/this.tempo*this.params.DELAY.beats));
   this.echoL=this.enabled?this.read(this.delayL,this.write-delayOffset):0;this.echoR=this.enabled?this.read(this.delayR,this.write-delayOffset):0;
   this.delayL[this.write&this.mask]=this.enabled?l+this.echoL*this.params.DELAY.feedback:0;
   this.delayR[this.write&this.mask]=this.enabled?r+this.echoR*this.params.DELAY.feedback:0;
   while(this.queue.length&&this.queue[0].time<=t){
    const ev=this.queue.shift();this.active=ev.mode;this.start=ev.time;this.duration=ev.duration;this.amount=ev.amount;this.startIndex=this.write;
   }
   let selected='OFF',manual=false;
   if(this.enabled){
    if(this.manual){selected=this.manual;manual=true}
    else if(t<this.start+this.duration&&t>=this.start)selected=this.active;
   }
   const desired=this.enabled&&selected!=='OFF'?this.mix*(manual?this.intensity:this.amount):0;
   this.smoothedMix+=(desired-this.smoothedMix)*.018;
   if(this.smoothedMix>.00001){
    this.applyMode(selected,l,r,t,manual);
    l=l*(1-this.smoothedMix)+this.modeL*this.smoothedMix;
    r=r*(1-this.smoothedMix)+this.modeR*this.smoothedMix;
   }
   let macro=this.macro;
   if(this.transition&&t>=this.transition.start){
    const fraction=(t-this.transition.start)/this.transition.duration;
    if(fraction>=1){macro=this.transition.returnToDry?0:this.transition.to;this.transition=null;this.macro=macro}
    else macro=this.transition.from+(this.transition.to-this.transition.from)*fraction;
   }
   const targetMacro=this.enabled?macro:0;
   this.macroSmooth+=(targetMacro-this.macroSmooth)*.0007;
   const macroDryL=l,macroDryR=r;
   let filter=0,crush=0,drive=0,gate=0,delay=0,width=0,reverb=0;
   for(let j=0;j<this.maps.length;j++){
    const m=this.maps[j],value=(this.enabled?this.macroSmooth:0)*this.intensity*Math.max(0,m.depth);
    if(m.target==='FILTER')filter=Math.max(filter,value);
    else if(m.target==='CRUSH')crush=Math.max(crush,value);
    else if(m.target==='DRIVE')drive=Math.max(drive,value);
    else if(m.target==='GATE')gate=Math.max(gate,value);
    else if(m.target==='DELAY')delay=Math.max(delay,value);
    else if(m.target==='WIDTH')width=Math.max(width,value);
    else if(m.target==='REVERB')reverb=Math.max(reverb,value);
   }
   if(filter>.001){
    const hz=this.params.FILTER.cutoff+(18500-this.params.FILTER.cutoff)*Math.pow(1-filter,2.2),alpha=1-Math.exp(-6.283*hz/sampleRate);
    this.lpL+=(l-this.lpL)*alpha;this.lpR+=(r-this.lpR)*alpha;
    this.lpStageL+=(this.lpL-this.lpStageL)*alpha;this.lpStageR+=(this.lpR-this.lpStageR)*alpha;
    this.lpThirdL+=(this.lpStageL-this.lpThirdL)*alpha;this.lpThirdR+=(this.lpStageR-this.lpThirdR)*alpha;
    this.lpFourthL+=(this.lpThirdL-this.lpFourthL)*alpha;this.lpFourthR+=(this.lpThirdR-this.lpFourthR)*alpha;
    l=l*(1-filter)+(this.params.FILTER.slope===24?this.lpFourthL:this.lpStageL)*filter;r=r*(1-filter)+(this.params.FILTER.slope===24?this.lpFourthR:this.lpStageR)*filter;
   }else{this.lpL=this.lpStageL=this.lpThirdL=this.lpFourthL=l;this.lpR=this.lpStageR=this.lpThirdR=this.lpFourthR=r}
   if(crush>.001){
    const rate=Math.max(1,Math.round(1+crush*(this.params.CRUSH.downsample-1)));
    if(this.holdCounter++%rate===0){this.holdL=l;this.holdR=r}
    const bits=Math.max(4,Math.round(16-crush*(16-this.params.CRUSH.bits))),scale=2**(bits-1);
    l=Math.round(this.holdL*scale)/scale;r=Math.round(this.holdR*scale)/scale;
   }else this.holdCounter=0;
   if(delay>.001){l=l*(1-delay*.3)+this.echoL*delay*.42;r=r*(1-delay*.3)+this.echoR*delay*.42}
   if(drive>.001){const k=1+drive*(this.params.DRIVE.gain-1),inv=this.params.DRIVE.output/Math.tanh(k);l=l*(1-drive*.5)+Math.tanh(l*k)*inv*drive*.5;r=r*(1-drive*.5)+Math.tanh(r*k)*inv*drive*.5}
   if(gate>.001){
    const period=60/this.tempo*this.params.GATE.beats,open=t%period<period*(1-gate*(1-this.params.GATE.width));
    const floor=1-gate*.90;if(!open){l*=floor;r*=floor}
   }
   if(width>.001){const mid=(l+r)*.5,side=(l-r)*.5*(1+width*(this.params.WIDTH.spread-1)),balance=width*this.params.WIDTH.balance;l=(mid+side)*(1-Math.max(0,balance));r=(mid-side)*(1+Math.min(0,balance))}
   if(this.enabled&&(reverb>.00001||this.reverbFrames>0)){
    const send=reverb*.5;if(send>.00001&&(Math.abs(l)+Math.abs(r))>1e-8)this.reverbFrames=sampleRate*(this.params.REVERB.decay+.5);
    const wetL=this.reverbChannel(l*send,this.combsL,this.diffuseL,this.reverbFeedbackL),wetR=this.reverbChannel(r*send,this.combsR,this.diffuseR,this.reverbFeedbackR);
    l+=wetL*.6;r+=wetR*.6;if(this.reverbFrames>0)this.reverbFrames--;
   }
   const macroMix=this.enabled?this.mix:0;l=macroDryL+(l-macroDryL)*macroMix;r=macroDryR+(r-macroDryR)*macroMix;
   oL[i]=Math.max(-1.5,Math.min(1.5,Number.isFinite(l)?l:0));
   oR[i]=Math.max(-1.5,Math.min(1.5,Number.isFinite(r)?r:0));
   this.write++;
  }
  return true;
 }
}
registerProcessor('claw-master-performance-fx',ClawMasterPerformanceProcessor);
