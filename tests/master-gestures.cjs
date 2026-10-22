// Audio-thread regression tests: real sample order, frozen capture and audible controls.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
function engine(sampleRate=48000){
 const scope={sampleRate,currentTime:0,AudioWorkletProcessor:class{constructor(){this.port={}}},registerProcessor:(_name,P)=>scope.P=P};
 vm.createContext(scope);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../clawstudio/master-fx-parameters.js'),'utf8').replace(/export /g,''),scope);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../clawstudio/master-fx-worklet.js'),'utf8').replace(/^import .*;$/m,''),scope);
 const p=new scope.P();let frame=0;
 const send=data=>p.port.onmessage({data});
 const render=(count,input=()=>[.71,-.63])=>{
  const left=new Float32Array(count),right=new Float32Array(count);
  for(let at=0;at<count;){const size=Math.min(128,count-at),a=new Float32Array(size),b=new Float32Array(size),l=new Float32Array(size),r=new Float32Array(size);
   for(let i=0;i<size;i++){const pair=input(frame+i);a[i]=pair[0];b[i]=pair[1]}
   scope.currentTime=frame/sampleRate;p.process([[a,b]],[[l,r]]);left.set(l,at);right.set(r,at);frame+=size;at+=size;
  }
  scope.currentTime=frame/sampleRate;return {left,right};
 };
 return {p,send,render,get time(){return frame/sampleRate},sampleRate};
}
function configure(e,params={},extra={}){e.send({type:'state',enabled:true,mix:1,amount:1,tempo:120,macro:0,maps:[],params,...extra})}
const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-5,`${message}: ${actual} vs ${expected}`);
for(const mode of ['RETRIG','REVERSE']){
 const e=engine();configure(e,{[mode]:{smooth:0}});
 const source=i=>[.1+.3*(i%24000)/24000,-.2-.2*(i%24000)/24000];
 e.render(48000,source);e.send({type:'gesture',down:true,effect:mode,at:e.time});
 const size=mode==='REVERSE'?24000:3000;
 assert.equal(e.p.manualLength,size);
 // Scheduled OFF and active steps used to reset the manual anchor and duration.
 for(let i=0;i<90;i++)e.send({type:'step',at:e.time+i*.125,effect:i%2?'TAPE':'OFF',duration:.125,amount:1});
 const audio=e.render(e.p.length+size*2);
 for(const frame of [1024,5600,24500,e.p.length+1000]){
  const index=mode==='REVERSE'?size-1-frame%size:frame%size;
  const expected=source(48000-size+index);
  near(audio.left[frame],expected[0],mode+' left sample order and stable held capture');
  near(audio.right[frame],expected[1],mode+' right sample order and stereo preservation');
 }
 e.send({type:'gesture',down:false,at:e.time});e.send({type:'step',at:e.time,effect:'OFF',duration:1});
 const released=e.render(256);near(released.left[200],.71,'release restores live left input');near(released.right[200],-.63,'release restores live right input');
 console.log('PASS '+mode+' correct direction/length, clock independence, frozen hold beyond ring wrap, stereo and release');
}
for(const rate of [44100,96000]){
 const e=engine(rate);configure(e);e.render(rate);e.send({type:'gesture',down:true,effect:'REVERSE'});assert.equal(e.p.manualLength,rate/2);
}
const empty=engine();configure(empty);empty.send({type:'gesture',down:true,effect:'REVERSE'});assert.ok(empty.render(1000,()=>[0,0]).left.every(x=>x===0),'holding before audio exists is safe and silent');
console.log('PASS tempo-based reverse length across sample rates and empty capture safety');
const wrapped=engine();configure(wrapped);wrapped.p.write=wrapped.p.length+20;
for(let i=0;i<24000;i++){const at=(wrapped.p.write-24000+i)&wrapped.p.mask;wrapped.p.histL[at]=i/48000;wrapped.p.histR[at]=-i/48000}
wrapped.send({type:'gesture',down:true,effect:'REVERSE'});
for(const i of [0,23979,23980,23999]){near(wrapped.p.manualL[i],i/48000,'capture spans history wrap');near(wrapped.p.manualR[i],-i/48000,'wrapped stereo capture')}
const partial=engine();configure(partial);partial.render(500,i=>[i/1000,-i/1000]);partial.send({type:'gesture',down:true,effect:'REVERSE'});assert.equal(partial.p.manualLength,500);near(partial.p.manualL[499],.499,'short history captures only available samples');
const dry=engine();configure(dry,{}, {amount:0});const original=dry.render(48000);dry.send({type:'gesture',down:true,effect:'REVERSE'});assert.deepEqual(dry.render(48000).left,original.left,'zero Intensity preserves dry audio for gestures');
console.log('PASS wrapped/partial capture and zero-Intensity gesture bypass');
const variants={
 RETRIG:{beats:.5,smooth:15},REVERSE:{beats:2,smooth:15},TAPE:{beats:2,curve:3},CRUSH:{bits:4,downsample:24},
 GATE:{beats:.5,width:.1},FILTER:{cutoff:200,slope:24},DELAY:{beats:.25,feedback:.8},SHUFFLE:{beats:.5,order:1},
 REVERB:{decay:.3,tone:.95},DRIVE:{gain:12,output:.2},WIDTH:{spread:0,balance:1}
};
const signal=i=>[Math.sin(i*.173)*.17+Math.sin(i*.027)*.1,Math.cos(i*.113)*.13];
function effectAudio(mode,params){
 const e=engine();configure(e,params);e.render(48000,signal);
 if(['REVERB','DRIVE','WIDTH'].includes(mode))configure(e,params,{macro:1,maps:[{target:mode,depth:1}]});
 else if(['RETRIG','REVERSE','TAPE'].includes(mode))e.send({type:'gesture',down:true,effect:mode});
 else e.send({type:'step',at:e.time,effect:mode,duration:3,amount:1});
 return e.render(48000,signal).left;
}
for(const [mode,changes] of Object.entries(variants)){
 const original=effectAudio(mode,{});
 for(const [key,value] of Object.entries(changes)){
  const changed=effectAudio(mode,{[mode]:{[key]:value}});let sum=0;
  for(let i=512;i<changed.length;i++)sum+=(changed[i]-original[i])**2;
  assert.ok(changed.every(Number.isFinite),mode+' '+key+' remains finite');
  assert.ok(Math.sqrt(sum/(changed.length-512))>1e-5,mode+' '+key+' audibly changes its DSP');
 }
 console.log('PASS '+mode+' — every exposed parameter changes rendered audio');
}
const e=engine();configure(e,{DELAY:{beats:999,feedback:Infinity},CRUSH:{bits:-5},REVERB:{decay:99},WIDTH:{balance:NaN}});
assert.equal(e.p.params.DELAY.beats,.75);assert.equal(e.p.params.DELAY.feedback,.3);assert.equal(e.p.params.CRUSH.bits,4);assert.equal(e.p.params.REVERB.decay,6);assert.equal(e.p.params.WIDTH.balance,0);
e.send({type:'stop'});assert.ok(e.p.delayL.every(x=>x===0));assert.equal(e.p.manual,null);
console.log('PASS invalid/legacy parameter normalization and stopped effect cleanup');
