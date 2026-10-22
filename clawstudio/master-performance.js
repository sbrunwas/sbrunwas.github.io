// SPDX-License-Identifier: AGPL-3.0-only
// ClawStudio MASTER FX — original performance UI + WebAudio FX worklet transport.
import {FX_PARAMETERS,normalizeFXParameters} from './master-fx-parameters.js?v=effect-controls-20261022';
export const FX_MODES=['OFF','RETRIG','REVERSE','TAPE','CRUSH','GATE','FILTER','DELAY','SHUFFLE'];
export const FX_TARGETS=['FILTER','DELAY','REVERB','CRUSH','DRIVE','WIDTH','GATE'];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(+x)?+x:a));
export const TRANSITION_RECIPES=[
 {name:'SMOOTH BUILD',maps:[['FILTER',.48],['DELAY',.25],['REVERB',.5],['WIDTH',.12]]},
 {name:'DUB LIFT',maps:[['FILTER',.3],['DELAY',.55],['REVERB',.38],['WIDTH',.08]]},
 {name:'AMBIENT WASH',maps:[['FILTER',.2],['REVERB',.8],['DELAY',.25],['WIDTH',.2]]},
 {name:'STUTTER DROP',maps:[['GATE',.6],['CRUSH',.3],['DRIVE',.15],['DELAY',.25]]}
];
export const transitionSeconds=(beats,bpm)=>beats*60/Math.max(40,Math.min(240,bpm));
const defaults=()=>({
 enabled:false,seqEnabled:false,mix:.45,amount:.4,params:normalizeFXParameters(),
 pattern:Array(16).fill('OFF'),brush:'RETRIG',macro:0,beats:8,recipe:'SMOOTH BUILD',
 maps:TRANSITION_RECIPES[0].maps.map(([target,depth])=>({target,depth}))
});
export function createMasterPerformanceFX(host,{getTempo=()=>126,getNextBarTime=()=>null,status=()=>{}}={}){
 const state=defaults(),$=sel=>host.querySelector(sel),all=sel=>[...host.querySelectorAll(sel)];
 let ctx=null,node=null,drySource=null,destination=null,loading=null,gesture=null,run=null,editor='RETRIG';
 const cstr=x=>String(x).replace(/[<>&"']/g,'');
 const pretty={OFF:'·',RETRIG:'RT',REVERSE:'RV',TAPE:'TP',CRUSH:'CR',GATE:'GT',FILTER:'FL',DELAY:'DL',SHUFFLE:'SH'};
 const brushes=FX_MODES.map(x=>'<button type="button" data-master-brush="'+x+'">'+x+'</button>').join('');
 host.innerHTML='<section class="cmf"><div class="cmf-head"><div><strong>MASTER FX / GLITCH MACHINE</strong><small>RHYTHMIC CHOPS · BUFFER GESTURES · ONE-KNOB TRANSITIONS</small></div><button id="cmf-power" type="button" aria-pressed="false">FX BYPASSED</button></div>'+
 '<div class="cmf-row"><label>WET MIX <input type="range" id="cmf-mix" min="0" max="1" step=".01"></label><label>INTENSITY <input type="range" id="cmf-amount" min="0" max="1" step=".01"></label><button id="cmf-seq" type="button">○ SEQUENCER OFF</button><button id="cmf-random" type="button">⚄ VARY STEPS</button><button id="cmf-clear" type="button">CLEAR</button></div>'+
 '<div class="cmf-label">CHOOSE FX BRUSH · TAP STEP TO PAINT · SHIFT-TAP TO ERASE</div><div class="cmf-brushes" id="cmf-brushes">'+brushes+'</div>'+
 '<div class="cmf-grid" id="cmf-grid"></div>'+
 '<div class="cmf-subhead"><b>EFFECT EDITOR</b><small>Parameters for steps, holds and transition routes</small></div>'+
 '<div class="cmf-editor-head"><label>EDIT FX <select id="cmf-effect">'+Object.keys(FX_PARAMETERS).map(mode=>'<option>'+mode+'</option>').join('')+'</select></label><span id="cmf-effect-description"></span><button type="button" id="cmf-effect-reset">RESET THIS FX</button></div>'+
 '<div class="cmf-parameters" id="cmf-parameters"></div>'+
 '<div class="cmf-help">Retrig, Reverse and Tape freeze audio until release. Change the phrase length, then press again to capture new audio. Timing follows the song tempo.</div>'+
 '<div class="cmf-subhead"><b>GESTURES / HOLD TO PERFORM</b><small>Play live stutters over the step pattern</small></div>'+
 '<div class="cmf-gestures">'+['RETRIG','REVERSE','TAPE','GATE'].map(x=>'<button type="button" data-master-gesture="'+x+'">⏵ HOLD '+x+'</button>').join('')+'</div>'+
 '<div class="cmf-subhead"><b>TRANSITION DESIGNER</b><small id="cmf-recipe-name">SMOOTH BUILD</small></div>'+
 '<div class="cmf-transition"><label class="cmf-big">TRANSITION <input id="cmf-macro" type="range" min="0" max="1" step=".005" value="0"><output id="cmf-macro-value">0%</output></label>'+
 '<div class="cmf-maps" id="cmf-maps"></div></div>'+
 '<div class="cmf-row"><label>TRANSITION <select id="cmf-beats"><option value="4">4 BEATS</option><option value="8">8 BEATS</option><option value="16">16 BEATS</option></select></label><button id="cmf-run" type="button">↗ AUTO BUILD / NEXT BAR</button><button id="cmf-drop" type="button">↘ RELEASE FX</button><button id="cmf-preset" type="button">⚡ NEXT FX RECIPE</button></div>'+
 '<div class="cmf-status" id="cmf-status">Bypassed · original master audio is unchanged. Engage FX to process the mix.</div></section>';
 function message(s){$('#cmf-status').textContent=s;status('Master FX: '+s)}
 function send(msg){if(node)node.port.postMessage(msg)}
 function sync(){send({type:'state',enabled:state.enabled,mix:state.mix,amount:state.amount,tempo:getTempo(),macro:state.macro,maps:state.maps,params:state.params})}
 function parameterText(c,value){return c.unit==='%'?Math.round(value*100)+'%':c.key==='balance'?(value===0?'CENTER':Math.round(Math.abs(value)*100)+'% '+(value<0?'L':'R')):Number(value.toFixed(2))+' '+c.unit}
 function renderEditor(){
  $('#cmf-effect').value=editor;$('#cmf-effect-description').textContent=FX_PARAMETERS[editor].title;
  $('#cmf-parameters').innerHTML=FX_PARAMETERS[editor].controls.map(c=>{
   const value=state.params[editor][c.key],id='cmf-param-'+editor.toLowerCase()+'-'+c.key;
   return '<label for="'+id+'"><span>'+c.label+'</span>'+(c.options?'<select id="'+id+'" data-fx-param="'+c.key+'">'+c.options.map(([label,n])=>'<option value="'+n+'" '+(value===n?'selected':'')+'>'+label+'</option>').join('')+'</select>':'<input id="'+id+'" data-fx-param="'+c.key+'" type="range" min="'+(c.log?0:c.min)+'" max="'+(c.log?1:c.max)+'" step="'+(c.log?.001:c.step)+'" value="'+(c.log?Math.log(value/c.min)/Math.log(c.max/c.min):value)+'"><output for="'+id+'">'+parameterText(c,value)+'</output>')+'</label>';
  }).join('');
 }
 function updateParameter(el){
  const c=FX_PARAMETERS[editor].controls.find(c=>c.key===el.dataset.fxParam);if(!c)return;
  const value=c.log?Math.round(c.min*(c.max/c.min)**Number(el.value)/c.step)*c.step:Number(el.value);
  state.params[editor][c.key]=value;state.params=normalizeFXParameters(state.params);
  const output=el.parentElement.querySelector('output');if(output)output.textContent=parameterText(c,state.params[editor][c.key]);sync();
 }
 $('#cmf-effect').onchange=e=>{editor=e.target.value;renderEditor()};
 $('#cmf-effect-reset').onclick=()=>{state.params[editor]=normalizeFXParameters()[editor];sync();renderEditor()};
 $('#cmf-parameters').addEventListener('input',e=>{if(e.target.matches('input[data-fx-param]'))updateParameter(e.target)});
 $('#cmf-parameters').addEventListener('change',e=>{if(e.target.matches('select[data-fx-param]'))updateParameter(e.target)});
 function render(){
  $('#cmf-power').textContent=state.enabled?'● MASTER FX ON':'○ FX BYPASSED';
  $('#cmf-power').classList.toggle('on',state.enabled);$('#cmf-power').setAttribute('aria-pressed',String(state.enabled));
  $('#cmf-seq').textContent=state.seqEnabled?'● SEQUENCER ARMED':'○ SEQUENCER OFF';$('#cmf-seq').classList.toggle('on',state.seqEnabled);
  $('#cmf-mix').value=state.mix;$('#cmf-amount').value=state.amount;$('#cmf-macro').value=state.macro;$('#cmf-beats').value=state.beats;$('#cmf-recipe-name').textContent=state.recipe;
  $('#cmf-macro-value').textContent=Math.round(state.macro*100)+'%';
  all('[data-master-brush]').forEach(b=>b.classList.toggle('selected',b.dataset.masterBrush===state.brush));
  $('#cmf-grid').innerHTML=state.pattern.map((fx,i)=>'<button type="button" data-master-step="'+i+'" title="Step '+(i+1)+': '+fx+'" class="cmf-step '+(fx==='OFF'?'empty':'hasfx')+' '+(i===lastStep?'playing':'')+'"><small>'+String(i+1).padStart(2,'0')+'</small><b>'+pretty[fx]+'</b><em>'+fx+'</em></button>').join('');
  $('#cmf-maps').innerHTML=state.maps.map((m,i)=>'<label>ROUTE '+(i+1)+' <select data-map-target="'+i+'">'+FX_TARGETS.map(t=>'<option '+(m.target===t?'selected':'')+'>'+t+'</option>').join('')+'</select><input type="range" data-map-depth="'+i+'" min="0" max="1" step=".01" value="'+m.depth+'"><span>'+Math.round(m.depth*100)+'%</span></label>').join('');
  renderEditor();
 }
 let lastStep=-1;
 function updateMap(i,changes){Object.assign(state.maps[i],changes);state.recipe='CUSTOM';sync();render()}
 host.addEventListener('change',e=>{const el=e.target;if(el.matches('[data-map-target]'))updateMap(+el.dataset.mapTarget,{target:el.value})});
 host.addEventListener('input',e=>{const el=e.target;if(el.matches('[data-map-depth]')){const i=+el.dataset.mapDepth;state.maps[i].depth=clamp(+el.value);state.recipe='CUSTOM';$('#cmf-recipe-name').textContent='CUSTOM';el.parentElement.querySelector('span').textContent=Math.round(state.maps[i].depth*100)+'%';sync()}});
 $('#cmf-grid').onclick=e=>{const el=e.target.closest('[data-master-step]');if(!el)return;const i=+el.dataset.masterStep;state.pattern[i]=e.shiftKey?'OFF':state.brush;render()};
 all('[data-master-brush]').forEach(b=>b.onclick=()=>{state.brush=b.dataset.masterBrush;if(state.brush!=='OFF')editor=state.brush;render()});
 $('#cmf-power').onclick=()=>{state.enabled=!state.enabled;if(!state.enabled){run=null;state.macro=0}sync();render();message(state.enabled?'Processing active':'Dry master bypassed')};
 $('#cmf-seq').onclick=()=>{state.seqEnabled=!state.seqEnabled;if(state.seqEnabled)state.enabled=true;sync();render();message(state.seqEnabled?'16-step FX sequence armed':'FX sequencer stopped')};
 $('#cmf-random').onclick=()=>{state.pattern=state.pattern.map((x,i)=>i%4===0?'OFF':Math.random()<.53?FX_MODES[1+Math.floor(Math.random()*(FX_MODES.length-1))]:'OFF');render()};
 $('#cmf-clear').onclick=()=>{state.pattern.fill('OFF');render()};
 $('#cmf-mix').oninput=e=>{state.mix=clamp(+e.target.value);sync()};
 $('#cmf-amount').oninput=e=>{state.amount=clamp(+e.target.value);sync()};
 $('#cmf-macro').oninput=e=>{state.macro=clamp(+e.target.value);run=null;send({type:'macro',value:state.macro});$('#cmf-macro-value').textContent=Math.round(state.macro*100)+'%'};
 $('#cmf-beats').onchange=e=>{state.beats=+e.target.value};
 $('#cmf-preset').onclick=()=>{const index=TRANSITION_RECIPES.findIndex(recipe=>recipe.name===state.recipe),recipe=TRANSITION_RECIPES[(index+1)%TRANSITION_RECIPES.length];state.recipe=recipe.name;state.maps=recipe.maps.map(([target,depth])=>({target,depth}));render();sync();message('Transition recipe: '+recipe.name)};
 for(const b of all('[data-master-gesture]')){
  const release=()=>{if(gesture!==b.dataset.masterGesture)return;gesture=null;b.classList.remove('held');send({type:'gesture',down:false,at:ctx?.currentTime||0})};
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);all('[data-master-gesture]').forEach(button=>button.classList.remove('held'));gesture=b.dataset.masterGesture;editor=gesture;state.enabled=true;sync();b.classList.add('held');send({type:'gesture',down:true,effect:gesture,at:ctx?.currentTime||0});render()});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,release);
 }
 function runTransition(reverse=false){
  if(!ctx||!node){message('Press JAM to initialize the master FX audio engine');return}
  state.enabled=true;const from=state.macro,to=reverse?0:1;sync();
  const now=ctx.currentTime;
  const start=Number(getNextBarTime())||now;
  const at=Math.max(now+.03,start);
  const duration=transitionSeconds(state.beats,getTempo());
  run={start:at,duration,from,to};send({type:'run',start:at,duration,from,to,returnToDry:!reverse});
  render();message('Transition queued · '+state.beats+' beats '+(reverse?'release':'build'));
 }
 $('#cmf-run').onclick=()=>runTransition(false);
 $('#cmf-drop').onclick=()=>runTransition(true);
 function animate(){if(!host.isConnected)return;if(run&&ctx){let t=(ctx.currentTime-run.start)/run.duration;if(t>=1){run=null;state.macro=0}else if(t>=0)state.macro=run.from+(run.to-run.from)*t;$('#cmf-macro').value=state.macro;$('#cmf-macro-value').textContent=Math.round(state.macro*100)+'%'}requestAnimationFrame(animate)}
 requestAnimationFrame(animate);
 function onStep(step,time,duration){
  lastStep=step%16;
  if(lastStep%2===0&&host.isConnected){const old=host.querySelector('.cmf-step.playing');old?.classList.remove('playing');host.querySelector('[data-master-step="'+lastStep+'"]')?.classList.add('playing')}
  if(!state.enabled||!node)return;
  const mode=state.seqEnabled?state.pattern[lastStep]:'OFF';
  send({type:'step',at:time,effect:mode,duration,amount:state.amount});
 }
 async function init(context,source,dest){
  if(ctx)return loading;ctx=context;drySource=source;destination=dest;
  // A direct route is always established first. AudioWorklet failure never breaks JAM.
  source.connect(dest);
  if(!context.audioWorklet?.addModule){message('AudioWorklet unavailable; master stays dry');return false}
  loading=(async()=>{try{
   await context.audioWorklet.addModule(new URL('./master-fx-worklet.js?v=effect-controls-20261022',import.meta.url).href);
   node=new AudioWorkletNode(context,'claw-master-performance-fx',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2]});
   source.connect(node);node.connect(dest);sync();
   source.disconnect(dest);
   message('Master FX ready · '+(state.enabled?'armed':'dry bypass'));
   return true;
  }catch(error){try{node?.disconnect()}catch{}node=null;message('Master FX unavailable; safe dry routing: '+error.message);return false}})();
  return loading;
 }
 function exportState(){return {enabled:state.enabled,seqEnabled:state.seqEnabled,mix:state.mix,amount:state.amount,params:normalizeFXParameters(state.params),pattern:[...state.pattern],macro:state.macro,beats:state.beats,bars:state.beats/4,recipe:state.recipe,maps:state.maps.map(x=>({...x}))}}
 function restoreState(v){
  if(!v||typeof v!=='object')return;
  state.enabled=!!v.enabled;state.seqEnabled=!!v.seqEnabled;state.mix=clamp(v.mix??.45);state.amount=clamp(v.amount??.4);
  state.params=normalizeFXParameters(v.params);
  if(Array.isArray(v.pattern)&&v.pattern.length===16)state.pattern=v.pattern.map(x=>FX_MODES.includes(x)?x:'OFF');
  state.macro=clamp(v.macro??0);state.beats=[4,8,16].includes(v.beats)?v.beats:[1,2,4].includes(v.bars)?v.bars*4:8;state.recipe=TRANSITION_RECIPES.some(recipe=>recipe.name===v.recipe)?v.recipe:'CUSTOM';
  if(Array.isArray(v.maps)&&v.maps.length===4)state.maps=v.maps.map((x,i)=>({target:FX_TARGETS.includes(x?.target)?x.target:defaults().maps[i].target,depth:clamp(x?.depth??0)}));
  run=null;gesture=null;sync();render()
 }
 function stop(){all('[data-master-gesture]').forEach(button=>button.classList.remove('held'));send({type:'stop'});run=null;gesture=null;state.macro=0;sync();render()}
 render();
 return {state,onStep,init,stop,bypass(){state.enabled=false;stop()},exportState,restoreState};
}
