import {clawPatchbay} from './poly-modular.js?v=jam-studio-20261022';
// SPDX-License-Identifier: AGPL-3.0-only
// Original Buchla-inspired, not a port of vintage hardware firmware.
export const BUCHLA_SOURCES=['MOD OSC','CYCLE','RANDOM','ENVELOPE','MOTION','S&H'];
export const BUCHLA_TARGETS=['TIMBRE','FOLD','LPG','FILTER','FM','PAN','FILTER 2','RESONANCE','RES 2','PITCH','LEVEL'];
export const BUCHLA_DEFAULT_ROUTES=()=>[{source:'CYCLE',target:'FOLD',amount:.44},{source:'S&H',target:'TIMBRE',amount:.25},{source:'ENVELOPE',target:'LPG',amount:.35}];
export const buchlaParamDefaults={buchlaFold:.08,buchlaLpg:.25,buchlaDecay:.5,buchlaRate:.4,buchlaIndex:.3,cycleHz:null};
const clamp=(x,a=-1,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
export const textureCycleRate=p=>Number.isFinite(p.cycleHz)?Math.max(.001,Math.min(18,p.cycleHz)):.08*Math.pow(170,clamp(p.buchlaRate??.4,0,1));
const frac=x=>x-Math.floor(x),hash=x=>frac(Math.sin(x*127.1+78.233)*43758.5453)*2-1;
export function patchModulation(routes=[],p={},voice={},time=0){
 const age=Math.max(0,time-(voice.start||0)),seed=voice.seed||0,rate=textureCycleRate(p),phase=(time-(voice.phaseOrigin||0))*rate,lerp=frac(phase);
 const values={'MOD OSC':Math.sin(2*Math.PI*phase),'CYCLE':1-4*Math.abs(frac(phase*.27)-.5),'RANDOM':hash(Math.floor(phase))*(1-lerp)+hash(Math.floor(phase)+1)*lerp,'ENVELOPE':Math.exp(-age/(.08+2.8*(p.buchlaDecay??.5))),'MOTION':Math.sin(2*Math.PI*phase*.31),'S&H':hash(Math.floor(phase*.72+seed*7))};
 const out=Object.fromEntries(BUCHLA_TARGETS.map(k=>[k,0]));
 for(const r of routes){if(!r||!BUCHLA_SOURCES.includes(r.source)||!BUCHLA_TARGETS.includes(r.target))continue;out[r.target]=clamp(out[r.target]+values[r.source]*clamp(r.amount))}
 return out;
}
export function attachBuchlaPanel(mount,routes,params,onChange=()=>{}){
 const knobs=[['buchlaFold','FOLD'],['buchlaLpg','LPG'],['buchlaDecay','DECAY'],['buchlaIndex','TIMBRE DEPTH']];
 let controls;
 const panel=clawPatchbay.panel(mount.querySelector('.cri'),'texture',{
  getRoutes:()=>routes.map(r=>({source:r.source,dest:r.target,depth:r.amount})),
  setRoutes:next=>{routes.splice(0,routes.length,...next.map(r=>({source:r.source,target:r.dest,amount:r.depth})));onChange()},
  getRates:()=>({}),setRates:()=>{},
  ideas:{'EVOLVING TIMBRE':BUCHLA_DEFAULT_ROUTES().map(r=>({source:r.source,dest:r.target,depth:r.amount})),
   'METAL MOTION':[{source:'MOD OSC',dest:'FM',depth:.55},{source:'MOTION',dest:'PAN',depth:.65},{source:'ENVELOPE',dest:'FILTER',depth:.4}],
   'RANDOM FOLDS':[{source:'S&H',dest:'FOLD',depth:.6},{source:'CYCLE',dest:'LPG',depth:.45}]},
  controls:host=>{controls=host;host.innerHTML=knobs.map(([key,label])=>`<label>${label}<input aria-label="Texture ${label.toLowerCase()}" type="range" min="0" max="1" step=".01" data-texture-param="${key}"></label>`).join('')+`<label>MOD OSC RATE<input aria-label="Texture modulation oscillator rate" type="range" min="0" max="1" step=".001" data-texture-rate><output data-texture-rate-value></output></label>`;
   host.querySelector('[data-texture-rate]').oninput=e=>{params.cycleHz=clawPatchbay.rateFromSlider(e.target.value);e.target.setAttribute('aria-valuetext',clawPatchbay.rateLabel(params.cycleHz));host.querySelector('[data-texture-rate-value]').textContent=clawPatchbay.rateLabel(params.cycleHz);onChange()};
   host.querySelectorAll('[data-texture-param]').forEach(el=>el.oninput=()=>{params[el.dataset.textureParam]=Number(el.value);onChange()})},
  refreshControls:()=>{if(!controls)return;controls.querySelectorAll('[data-texture-param]').forEach(el=>{el.value=params[el.dataset.textureParam]??.5});const rate=textureCycleRate(params),slider=controls.querySelector('[data-texture-rate]');slider.value=clawPatchbay.rateToSlider(rate);slider.setAttribute('aria-valuetext',clawPatchbay.rateLabel(rate));controls.querySelector('[data-texture-rate-value]').textContent=clawPatchbay.rateLabel(rate)}
 });
 return {refresh:panel.refresh,dispose:panel.destroy};
}
