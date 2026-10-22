// SPDX-License-Identifier: AGPL-3.0-only
// Shared UI / audio-thread parameter definitions. Beat values use quarter notes.
const rates=[['1/8',.5],['1/16',.25],['1/32',.125],['1/64',.0625],['1/8T',1/3],['1/16T',1/6]];
const phrases=[['1/16',.25],['1/8',.5],['1 BEAT',1],['2 BEATS',2],['4 BEATS',4]];
export const FX_PARAMETERS={
 RETRIG:{title:'Forward stutter',controls:[{key:'beats',label:'REPEAT RATE',value:.125,options:rates},{key:'smooth',label:'EDGE FADE',value:3,min:0,max:15,step:1,unit:'ms'}]},
 REVERSE:{title:'Captured phrase, played backward',controls:[{key:'beats',label:'PHRASE LENGTH',value:1,options:phrases},{key:'smooth',label:'EDGE FADE',value:3,min:0,max:15,step:1,unit:'ms'}]},
 TAPE:{title:'Pitch falls to a stop',controls:[{key:'beats',label:'STOP TIME',value:1,options:phrases},{key:'curve',label:'BRAKE CURVE',value:1.5,min:.5,max:3,step:.1,unit:'×'}]},
 CRUSH:{title:'Bit and sample-rate reduction',controls:[{key:'bits',label:'BIT DEPTH',value:8,min:4,max:16,step:1,unit:'bit'},{key:'downsample',label:'SAMPLE HOLD',value:4,min:1,max:32,step:1,unit:'×'}]},
 GATE:{title:'Rhythmic amplitude cuts',controls:[{key:'beats',label:'CHOP RATE',value:.25,options:rates},{key:'width',label:'OPEN TIME',value:.5,min:.05,max:.95,step:.01,unit:'%'}]},
 FILTER:{title:'Low-pass sweep',controls:[{key:'cutoff',label:'CUTOFF',value:1800,min:80,max:18000,step:10,unit:'Hz',log:true},{key:'slope',label:'SLOPE',value:12,options:[['12 dB',12],['24 dB',24]]}]},
 DELAY:{title:'Tempo-synced echoes',controls:[{key:'beats',label:'ECHO TIME',value:.75,options:[['1/16',.25],['1/8',.5],['1/8 DOTTED',.75],['1/4',1],['1/4 DOTTED',1.5],['1/2',2],['1 BAR',4]]},{key:'feedback',label:'FEEDBACK',value:.3,min:0,max:.85,step:.01,unit:'%'}]},
 SHUFFLE:{title:'Reorder four captured slices',controls:[{key:'beats',label:'SLICE LENGTH',value:.125,options:rates},{key:'order',label:'SLICE ORDER',value:0,options:[['2 · 4 · 1 · 3',0],['4 · 3 · 2 · 1',1],['1 · 3 · 2 · 4',2]]}]},
 REVERB:{title:'Transition space',controls:[{key:'decay',label:'DECAY',value:2.5,min:.2,max:6,step:.1,unit:'s'},{key:'tone',label:'BRIGHTNESS',value:.35,min:.05,max:.95,step:.01,unit:'%'}]},
 DRIVE:{title:'Transition saturation',controls:[{key:'gain',label:'DRIVE',value:4,min:1,max:12,step:.1,unit:'×'},{key:'output',label:'OUTPUT',value:.65,min:.2,max:1,step:.01,unit:'%'}]},
 WIDTH:{title:'Transition stereo image',controls:[{key:'spread',label:'SPREAD',value:1.2,min:0,max:2,step:.01,unit:'×'},{key:'balance',label:'BALANCE',value:0,min:-1,max:1,step:.01,unit:''}]}
};
export function normalizeFXParameters(value){
 const result={};
 for(const [mode,{controls}] of Object.entries(FX_PARAMETERS)){
  result[mode]={};
  for(const c of controls){
   const raw=value?.[mode]?.[c.key],n=typeof raw==='number'&&Number.isFinite(raw)?raw:c.value;
   result[mode][c.key]=c.options?(c.options.some(option=>option[1]===n)?n:c.value):Math.max(c.min,Math.min(c.max,n));
  }
 }
 return result;
}
