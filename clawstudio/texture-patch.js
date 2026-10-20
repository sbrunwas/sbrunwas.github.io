import {clawPatchbay} from './poly-modular.js?v=edge-patch-20261020-2';
// SPDX-License-Identifier: AGPL-3.0-only
// Original Buchla-inspired, not a port of vintage hardware firmware.
export const BUCHLA_SOURCES=['MOD OSC','CYCLE','RANDOM','ENVELOPE','MOTION','S&H'];
export const BUCHLA_TARGETS=['TIMBRE','FOLD','LPG','FILTER','FM','PAN'];
export const BUCHLA_DEFAULT_ROUTES=()=>[{source:'CYCLE',target:'FOLD',amount:.44},{source:'S&H',target:'TIMBRE',amount:.25},{source:'ENVELOPE',target:'LPG',amount:.35}];
export const buchlaParamDefaults={buchlaFold:.08,buchlaLpg:.25,buchlaDecay:.5,buchlaRate:.4,buchlaIndex:.3};
const clamp=(x,a=-1,b=1)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:0));
const frac=x=>x-Math.floor(x),hash=x=>frac(Math.sin(x*127.1+78.233)*43758.5453)*2-1;
export function patchModulation(routes=[],p={},voice={},time=0){
 const age=Math.max(0,time-(voice.start||0)),seed=voice.seed||0,rate=.08*Math.pow(170,clamp(p.buchlaRate??.4,0,1)),phase=time*rate+seed,lerp=frac(phase);
 const values={'MOD OSC':Math.sin(2*Math.PI*phase),'CYCLE':1-4*Math.abs(frac(phase*.27)-.5),'RANDOM':hash(Math.floor(phase))*(1-lerp)+hash(Math.floor(phase)+1)*lerp,'ENVELOPE':Math.exp(-age/(.08+2.8*(p.buchlaDecay??.5))),'MOTION':Math.sin(2*Math.PI*phase*.31),'S&H':hash(Math.floor(phase*.72+seed*7))};
 const out=Object.fromEntries(BUCHLA_TARGETS.map(k=>[k,0]));
 for(const r of routes){if(!r||!BUCHLA_SOURCES.includes(r.source)||!BUCHLA_TARGETS.includes(r.target))continue;out[r.target]=clamp(out[r.target]+values[r.source]*clamp(r.amount))}
 return out;
}
export function attachBuchlaPanel(mount,routes,params){
 const knobs=[['buchlaFold','FOLD'],['buchlaLpg','LPG'],['buchlaDecay','DECAY'],['buchlaRate','CYCLE RATE'],['buchlaIndex','MOD INDEX']];
 let controls;
 const panel=clawPatchbay.panel(mount.querySelector('.cri'),'texture',{
  getRoutes:()=>routes.map(r=>({source:r.source,dest:r.target,depth:r.amount})),
  setRoutes:next=>routes.splice(0,routes.length,...next.map(r=>({source:r.source,target:r.dest,amount:r.depth}))),
  getRates:()=>({}),setRates:()=>{},
  ideas:{'EVOLVING TIMBRE':BUCHLA_DEFAULT_ROUTES().map(r=>({source:r.source,dest:r.target,depth:r.amount})),
   'METAL MOTION':[{source:'MOD OSC',dest:'FM',depth:.55},{source:'MOTION',dest:'PAN',depth:.65},{source:'ENVELOPE',dest:'FILTER',depth:.4}],
   'RANDOM FOLDS':[{source:'S&H',dest:'FOLD',depth:.6},{source:'CYCLE',dest:'LPG',depth:.45}]},
  controls:host=>{controls=host;host.innerHTML=knobs.map(([key,label])=>`<label>${label}<input aria-label="Texture ${label.toLowerCase()}" type="range" min="0" max="1" step=".01" data-texture-param="${key}"></label>`).join('');
   host.querySelectorAll('input').forEach(el=>el.oninput=()=>{params[el.dataset.textureParam]=Number(el.value)})},
  refreshControls:()=>controls?.querySelectorAll('input').forEach(el=>{el.value=params[el.dataset.textureParam]??.5})
 });
 return {refresh:panel.refresh,dispose:panel.destroy};
}
