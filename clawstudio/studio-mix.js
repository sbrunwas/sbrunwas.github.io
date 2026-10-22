// Neutral defaults preserve Afterglow transients; coloration is an explicit choice.
export function createStudioMaster(ctx,meter){
 const master=ctx.createGain(),drive=ctx.createWaveShaper(),compressor=ctx.createDynamicsCompressor();
 compressor.threshold.value=-9;compressor.ratio.value=3;let color='CLEAN';
 function setColor(value){color=value==='GLUE'?'GLUE':'CLEAN';drive.disconnect();compressor.disconnect();if(color==='GLUE'){drive.connect(compressor);compressor.connect(meter)}else drive.connect(meter);master.gain.setTargetAtTime(color==='GLUE'?.65:1,ctx.currentTime,.025)}
 function setDrive(amount){if(amount<=.0001){drive.curve=null;return}const curve=new Float32Array(1024),k=1+amount*15;for(let i=0;i<curve.length;i++){const x=2*i/1023-1;curve[i]=Math.tanh(x*k)/Math.tanh(k)}drive.curve=curve}
 setColor('CLEAN');return {master,drive,compressor,setColor,setDrive,get color(){return color}};
}
export function createStudioChannel(ctx){
 const input=ctx.createGain(),eq=[];let previous=input;
 for(const [type,frequency] of [['lowshelf',150],['peaking',500],['peaking',2100],['highshelf',8000]]){const band=ctx.createBiquadFilter();band.type=type;band.frequency.value=frequency;band.Q.value=.9;previous.connect(band);previous=band;eq.push(band)}
 const filter=ctx.createBiquadFilter(),gain=ctx.createGain(),dry=ctx.createGain(),filtered=ctx.createGain();filter.type='lowpass';filter.frequency.value=19500;dry.gain.value=1;filtered.gain.value=0;previous.connect(dry);dry.connect(gain);previous.connect(filter);filter.connect(filtered);filtered.connect(gain);
 return {input,eq,filter,gain,dry,filtered};
}
export function setChannelTone(nodes,values,time){
 ['low','lm','hm','hi'].forEach((key,i)=>nodes.eq[i].gain.setTargetAtTime((values[key]-.5)*24,time,.015));
 const open=values.cut>.995&&values.res===0;
 nodes.filter.frequency.setTargetAtTime(values.cut>.995?19500:80*190**values.cut,time,.02);nodes.filter.Q.setTargetAtTime(.5+values.res*12,time,.02);
 nodes.dry.gain.setTargetAtTime(open?1:0,time,.02);nodes.filtered.gain.setTargetAtTime(open?0:1,time,.02);
}
