// Test instrument: compare raw Afterglow stereo with the studio's actual master output.
class NullMeter extends AudioWorkletProcessor {
 constructor(){super();this.frames=0;this.sum=0;this.error=0;this.peak=0;this.errorPeak=0;this.target=sampleRate;this.port.onmessage=({data})=>{if(data.type==='measure'){this.frames=0;this.sum=0;this.error=0;this.peak=0;this.errorPeak=0;this.target=Math.round(data.seconds*sampleRate);this.active=true}}}
 process(inputs,outputs){
  for(const channel of outputs[0]||[])channel.fill(0);
  if(!this.active)return true;
  const count=outputs[0]?.[0]?.length||128;
  for(let i=0;i<count&&this.frames<this.target;i++,this.frames++)for(let c=0;c<2;c++){
   const ref=inputs[0]?.[c]?.[i]||0,actual=inputs[1]?.[c]?.[i]||0,error=actual-ref;
   this.sum+=ref*ref;this.error+=error*error;this.peak=Math.max(this.peak,Math.abs(ref));this.errorPeak=Math.max(this.errorPeak,Math.abs(error));
  }
  if(this.frames===this.target){this.active=false;this.port.postMessage({rms:Math.sqrt(this.sum/(this.frames*2)),difference:Math.sqrt(this.error/(this.frames*2)),peak:this.peak,errorPeak:this.errorPeak,frames:this.frames})}
  return true;
 }
}
registerProcessor('afterglow-null-meter',NullMeter);
