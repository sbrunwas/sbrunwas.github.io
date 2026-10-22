const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const scope={sampleRate:48000,currentTime:0,AudioWorkletProcessor:class{constructor(){this.port={}}},registerProcessor:(_name,Processor)=>scope.Processor=Processor};
vm.createContext(scope);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../clawstudio/master-fx-parameters.js'),'utf8').replace(/export /g,''),scope);
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../clawstudio/master-fx-worklet.js'),'utf8').replace(/^import .*;$/m,''),scope);
const send=(processor,data)=>processor.port.onmessage({data});
function render({state={},run=null,input=t=>[Math.sin(t*2*Math.PI*220)*.15,Math.sin(t*2*Math.PI*330)*.12],seconds=2,inspect=()=>{}}={}){
 scope.currentTime=0;const p=new scope.Processor();send(p,{type:'state',enabled:true,mix:.45,amount:.4,tempo:120,macro:1,maps:[],...state});if(run)send(p,{type:'run',...run});
 const left=[],right=[],dry=[];
 for(let frame=0;frame<seconds*48000;frame+=128){scope.currentTime=frame/48000;const a=new Float32Array(128),b=new Float32Array(128),oL=new Float32Array(128),oR=new Float32Array(128);for(let i=0;i<128;i++){const pair=input((frame+i)/48000,frame+i);a[i]=pair[0];b[i]=pair[1]}p.process([[a,b]],[[oL,oR]]);left.push(...oL);right.push(...oR);dry.push(...a);inspect(p,scope.currentTime)}return {p,left,right,dry};
}
const rms=(a,start=0,end=a.length/48000)=>{let sum=0;const from=Math.floor(start*48000),to=Math.min(a.length,Math.floor(end*48000));for(let i=from;i<to;i++)sum+=a[i]**2;return Math.sqrt(sum/(to-from))};
const maps=['FILTER','DELAY','REVERB','DRIVE'].map(target=>({target,depth:1}));
for(const state of [{enabled:false},{mix:0},{amount:0}]){const audio=render({state:{maps,...state}});assert.deepEqual(audio.left,audio.dry)}
console.log('PASS bypass, zero Wet Mix and zero Intensity preserve the original signal exactly');
const impulse=(_t,frame)=>frame===2400?[.5,.5]:[0,0];
const reverb=render({state:{maps:[{target:'REVERB',depth:1}],mix:1,amount:1},input:impulse,seconds:4});
assert.ok(rms(reverb.left,.1,.6)>1e-5,'reverb has an audible tail');assert.ok(rms(reverb.left,3,4)<rms(reverb.left,.1,.6)*.001,'tail decays');assert.notDeepEqual(reverb.left,reverb.right,'reverb is stereo');assert.ok(reverb.left.every(Number.isFinite));
console.log('PASS stereo reverb produces a stable, decaying tail');
for(const beats of [4,8,16]){const duration=beats*60/120;let middle=null,before=0;const audio=render({seconds:duration+.6,state:{macro:0,maps},run:{start:.2,duration,from:0,to:1,returnToDry:true},inspect:(p,t)=>{if(t<.19)before=Math.max(before,p.macroSmooth);if(Math.abs(t-(.2+duration/2))<.002)middle=p.macroSmooth}});assert.equal(before,0);assert.ok(Math.abs(middle-.5)<.03,'correct midpoint for '+beats+' beats');assert.equal(audio.p.transition,null);assert.equal(audio.p.macro,0);assert.ok(audio.p.macroSmooth<.001)}
console.log('PASS 4-, 8- and 16-beat transitions wait for their start, ramp for the exact beat duration and return dry');
const release=render({state:{macro:0,maps},run:{start:.1,duration:2,from:0,to:0,returnToDry:false}});assert.deepEqual(release.left,release.dry,'Release from dry never jumps to full effects');
const gentle=render({state:{maps:[{target:'DRIVE',depth:.2}]}});assert.ok(rms(gentle.left,.5,1.5)/rms(gentle.dry,.5,1.5)<1.15,'gentle drive avoids volume jumps');
console.log('PASS Release avoids an intensity jump and moderate drive keeps level changes small');
