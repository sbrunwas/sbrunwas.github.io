// SPDX-License-Identifier: AGPL-3.0-only
// ClawStudio master performance DSP. Original AudioWorklet processing: no vendor code.
// One audio-thread history ring for rhythmic retrigger/reverse/tape, post FX and macros.
class ClawMasterPerformanceProcessor extends AudioWorkletProcessor {
 constructor(){
  super();
  this.length=131072;this.mask=this.length-1;
  this.histL=new Float32Array(this.length);this.histR=new Float32Array(this.length);
  this.write=0;this.queue=[];this.active='OFF';this.start=0;this.startIndex=0;this.duration=.125;this.amount=.76;
  this.manual=null;this.manualStart=0;this.manualEnd=0;
  this.enabled=false;this.mix=.45;this.intensity=.4;this.tempo=126;this.smoothedMix=0;
  this.macro=0;this.macroSmooth=0;this.maps=[{target:'FILTER',depth:.8},{target:'DELAY',depth:.5},{target:'DRIVE',depth:.25},{target:'WIDTH',depth:.35}];
  this.transition=null;
  this.lpL=0;this.lpR=0;this.lp2L=0;this.lp2R=0;this.holdL=0;this.holdR=0;this.holdCounter=0;
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
     if(!this.enabled){this.active='OFF';this.manual=null;this.queue=[];this.transition=null;this.clearReverb()}
     break;
    case 'step': {
     const mode=String(data.effect||'OFF');const event={time:Number(data.at)||0,mode,duration:Math.max(.015,Math.min(4,Number(data.duration)||.125)),amount:this.bound(data.amount??.76)};
     if(this.queue.length>128)this.queue.splice(0,this.queue.length-64);
     this.queue.push(event);this.queue.sort((a,b)=>a.time-b.time);break
    }
    case 'gesture':
     if(data.down){this.manual=String(data.effect||'RETRIG');this.manualStart=Number(data.at)||currentTime;this.manualEnd=0;this.startIndex=this.write}
     else {this.manual=null;this.manualEnd=Number(data.at)||currentTime}
     break;
    case 'macro':this.macro=this.bound(data.value);this.transition=null;break;
    case 'run':this.transition={start:Number(data.start)||currentTime,duration:Math.max(.1,Math.min(30,Number(data.duration)||2)),from:this.bound(data.from??(data.reverse?1:0)),to:this.bound(data.to??(data.reverse?0:1)),returnToDry:data.returnToDry??!data.reverse};break;
    case 'stop':this.manual=null;this.active='OFF';this.queue=[];this.transition=null;this.macro=0;this.clearReverb();break;
   }
  };
 }
 clearReverb(){for(const line of [...this.combsL,...this.combsR,...this.diffuseL,...this.diffuseR]){line.buffer.fill(0);line.low=0;line.at=0}this.reverbFrames=0}
 reverbChannel(input,combs,diffusers){let sum=0;for(const line of combs){const delayed=line.buffer[line.at];line.low+=.35*(delayed-line.low);line.buffer[line.at]=input+line.low*.76;line.at=(line.at+1)%line.buffer.length;sum+=delayed*.25}for(const line of diffusers){const delayed=line.buffer[line.at],out=delayed-sum*.5;line.buffer[line.at]=sum+out*.5;line.at=(line.at+1)%line.buffer.length;sum=out}return sum}
 bound(n){return Math.max(0,Math.min(1,Number.isFinite(+n)?+n:0))}
 boundSigned(n){return Math.max(-1,Math.min(1,Number.isFinite(+n)?+n:0))}
 read(buffer,index){return buffer[(Math.floor(index)+this.length)&this.mask]||0}
 applyMode(mode,l,r,pos,time,amount,gesture){
  let outL=l,outR=r;
  const elapsed=Math.max(0,(time-(gesture?this.manualStart:this.start))),frames=elapsed*sampleRate;
  const slice=Math.max(96,Math.round(sampleRate*this.duration/(2+Math.round(amount*10))));
  const anchor=this.startIndex;
  if(mode==='RETRIG'||mode==='SHUFFLE'||mode==='REVERSE'||mode==='TAPE'){
   let idx;
   if(mode==='RETRIG')idx=anchor-slice+(frames%slice);
   else if(mode==='REVERSE')idx=anchor-1-(frames%slice);
   else if(mode==='SHUFFLE'){const block=Math.floor(frames/slice),shift=[1,3,0,2][block%4];idx=anchor-slice*4+shift*slice+(frames%slice)}
   else {const fade=Math.max(.04,1-Math.min(1,elapsed/this.duration));idx=anchor-slice+frames*(fade*.72); }
   outL=this.read(this.histL,idx);outR=this.read(this.histR,idx);
  }else if(mode==='CRUSH'){
   const bits=12-Math.round(amount*8),step=2**bits;outL=Math.round(l*step)/step;outR=Math.round(r*step)/step;
  }else if(mode==='GATE'){
   const period=Math.max(1,Math.round(sampleRate*this.duration/(3+Math.round(amount*12))));
   if(frames%period>period*(.67-.5*amount))outL=outR=0;
  }else if(mode==='FILTER'){
   const hz=150+12000*(1-amount)*(1-amount),alpha=Math.min(1,6.283*hz/sampleRate);
   this.lp2L+=(l-this.lp2L)*alpha;this.lp2R+=(r-this.lp2R)*alpha;outL=this.lp2L;outR=this.lp2R;
  }else if(mode==='DELAY'){
   const delay=Math.max(192,Math.round(sampleRate*this.duration/(2+Math.round(amount*4))));
   outL=l*.64+this.read(this.histL,this.write-delay)*.55;outR=r*.64+this.read(this.histR,this.write-delay)*.55;
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
   while(this.queue.length&&this.queue[0].time<=t){
    const ev=this.queue.shift();this.active=ev.mode;this.start=ev.time;this.duration=ev.duration;this.amount=ev.amount;this.startIndex=this.write;
   }
   let selected='OFF',manual=false;
   if(this.enabled){
    if(this.manual){selected=this.manual;manual=true}
    else if(t<this.start+this.duration&&t>=this.start)selected=this.active;
   }
   const desired=this.enabled&&selected!=='OFF'?this.mix:0;
   this.smoothedMix+=(desired-this.smoothedMix)*.018;
   if(this.smoothedMix>.00001){
    this.applyMode(selected,l,r,i,t,manual?this.intensity:this.amount,manual);
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
    const hz=160+18500*Math.pow(1-filter,2.2),alpha=1-Math.exp(-6.283*hz/sampleRate);
    this.lpL+=(l-this.lpL)*alpha;this.lpR+=(r-this.lpR)*alpha;
    l=l*(1-filter)+this.lpL*filter;r=r*(1-filter)+this.lpR*filter;
   }else{this.lpL=l;this.lpR=r}
   if(crush>.001){
    const rate=Math.max(1,Math.round(1+crush*24));
    if(this.holdCounter++%rate===0){this.holdL=l;this.holdR=r}
    const bits=Math.max(4,Math.round(16-crush*10)),scale=2**(bits-1);
    l=Math.round(this.holdL*scale)/scale;r=Math.round(this.holdR*scale)/scale;
   }else this.holdCounter=0;
   if(delay>.001){const offset=Math.round(sampleRate*.75*60/this.tempo),vl=this.read(this.histL,this.write-offset),vr=this.read(this.histR,this.write-offset);l=l*(1-delay*.3)+vl*delay*.42;r=r*(1-delay*.3)+vr*delay*.42}
   if(drive>.001){const k=1+drive*9,inv=1/Math.tanh(k);l=l*(1-drive*.5)+Math.tanh(l*k)*inv*drive*.5;r=r*(1-drive*.5)+Math.tanh(r*k)*inv*drive*.5}
   if(gate>.001){
    const cycle=Math.floor(t*sampleRate/(sampleRate*.125)),open=t%.125<.125*(1-gate*.78);
    const floor=1-gate*.90;if(!open){l*=floor;r*=floor}
   }
   if(width>.001){const mid=(l+r)*.5,side=(l-r)*.5*(1+width*1.2);l=mid+side;r=mid-side}
   if(this.enabled&&(reverb>.00001||this.reverbFrames>0)){
    const send=reverb*.5;if(send>.00001&&(Math.abs(l)+Math.abs(r))>1e-8)this.reverbFrames=sampleRate*3;
    const wetL=this.reverbChannel(l*send,this.combsL,this.diffuseL),wetR=this.reverbChannel(r*send,this.combsR,this.diffuseR);
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
