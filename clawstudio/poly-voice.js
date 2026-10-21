// Shared Poly oscillator engine: both oscillators expose the same synthesis modes.
export const POLY_WAVEFORMS=Object.freeze(['SUPER SAW','SAW','PWM','FEEDBACK','SYNC','SHAPE','FM','FORMANT','PULSE','TRI']);
export const POLY_VOICE_DEFAULTS=Object.freeze({detune2:.4,mix2:0,shape2:.3,tune2:.5,osc2Gain:.22,fmAmount:0,fmRatio:.4,filterAttack:0,filterDecay:.515,filterSustain:0,filterRelease:.37});
const cap=n=>Math.max(0,Math.min(1,n));
export const polyFmRatio=value=>.25*2**(cap(value)*5);
// Old patches used OSC 1 shape to tune OSC 2 and amp decay for the filter contour.
// Migrate those values once, then let the new controls work independently.
export function normalizePolyVoice(params={}){
 const values={...POLY_VOICE_DEFAULTS,...params};
 if(!Number.isFinite(params.tune2))values.tune2=Number.isFinite(params.shape)?params.shape:POLY_VOICE_DEFAULTS.tune2;
 if(!Number.isFinite(params.filterDecay)&&Number.isFinite(params.decay))values.filterDecay=cap(Math.sqrt(Math.max(0,(Math.max(.02,params.decay*.5)*3-.025)/2)));
 return values;
}
export function createPolyOscillator(ctx,{start,end,frequency,coarse,kind,detune,mix,shape},helpers){
 const {superSawDetune,superSawMix,offsets,wave}=helpers;
 const output=ctx.createGain(),oscillators=[],layers=[],shapers=[];
 const internalFM=ctx.createOscillator(),fmDepth=ctx.createGain();
 internalFM.connect(fmDepth);internalFM.start(start);internalFM.stop(end);
 // A fixed bank lets waveform changes take effect on held notes, including Super Saw.
 for(let i=0;i<7;i++){
  const osc=ctx.createOscillator(),level=ctx.createGain(),shaper=ctx.createWaveShaper();
  osc.connect(level);level.connect(shaper);shaper.connect(output);fmDepth.connect(osc.frequency);
  oscillators.push(osc);layers.push(level);shapers.push(shaper);
 }
 let lastKind=null,lastShape=null;
 function update(settings,time=ctx.currentTime,initial=false){
  const {frequency,coarse,kind,detune,mix,shape}=settings;
  const set=(param,value)=>initial?param.setValueAtTime(value,time):param.setTargetAtTime(value,time,.025);
  const sawDetune=superSawDetune(detune),sawMix=superSawMix(mix),count=kind==='SUPER SAW'?7:kind==='SHAPE'||kind==='FORMANT'?3:2;
  let curve=null;
  if(kind==='FEEDBACK'&&(kind!==lastKind||shape!==lastShape)){
   curve=new Float32Array(256);for(let i=0;i<curve.length;i++)curve[i]=Math.tanh((i/127.5-1)*(1+shape*24));
  }
  oscillators.forEach((osc,i)=>{
   if(kind!==lastKind||shape!==lastShape){
    if(kind==='SHAPE'||kind==='FORMANT')osc.setPeriodicWave(wave(ctx,kind==='SHAPE'?'ORGANIC':'VOCAL',shape));
    else osc.type=kind==='PWM'||kind==='PULSE'?'square':kind==='TRI'?'triangle':kind==='FM'?'sine':'sawtooth';
    if(curve||kind!==lastKind)shapers[i].curve=curve;
   }
   const pitch=kind==='SUPER SAW'?frequency*(1+offsets[i]*sawDetune):kind==='SYNC'?frequency*(1+shape*1.2):frequency;
   set(osc.frequency,pitch);
   set(osc.detune,coarse+(kind==='SUPER SAW'||i===0?0:(i%2?-1:1)*Math.ceil(i/2)*3.7*detune*3.4));
   const gain=kind==='SUPER SAW'?(i===3?sawMix.center:sawMix.side)*1.04:i>=count?0:i===0?1:mix/(count-1)*1.25;
   set(layers[i].gain,gain);
  });
  set(internalFM.frequency,frequency*2*2**(coarse/1200));
  set(fmDepth.gain,kind==='FM'?frequency*shape*2:0);
  lastKind=kind;lastShape=shape;
 }
 update({frequency,coarse,kind,detune,mix,shape},start,true);
 for(const osc of oscillators){
  // Decorrelate the saw phases without restarting a held note when changing modes.
  const headroom=1/Math.max(1,osc.frequency.value);
  osc.start(Math.max(ctx.currentTime,start-Math.random()*headroom));osc.stop(end);
 }
 return {output,oscillators,layers,update,dispose(time=ctx.currentTime){
  for(const node of [...oscillators,internalFM]){try{node.stop(time)}catch{}}
  // Allow the caller's short voice-stealing fade to finish before disconnection.
  if(time<=ctx.currentTime){output.disconnect();fmDepth.disconnect();for(const node of [...oscillators,...layers,...shapers])node.disconnect()}
 }};
}
