// Coarse tuning stays separate from oscillator fine detune and incoming pitch CV.
export const coarseValue=value=>Math.round(Math.max(-24,Math.min(24,Number.isFinite(value)?value:0)));
export const coarseCents=value=>coarseValue(value)*100;
export function attachCoarsePitch(mount,params,controls,onChange){
 if(!document.querySelector('link[data-coarse-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./coarse-pitch.css?v=slow-coarse-20261020',import.meta.url).href;link.dataset.coarseStyle='';document.head.append(link)}
 const field=document.createElement('fieldset');field.className='synth-coarse';const legend=document.createElement('legend');legend.textContent='COARSE PITCH · SEMITONES';field.append(legend);
 for(const control of controls){const label=document.createElement('label'),text=document.createElement('span'),input=document.createElement('input');input.type='number';input.min='-24';input.max='24';input.step='1';input.dataset.coarse=control.key;
  const name=()=>typeof control.label==='function'?control.label(params):control.label;
  input.setAttribute('aria-label',name()+' coarse pitch in semitones');input.title='−24 to +24 semitones; double-click to reset';
  input.oninput=()=>{if(input.value==='')return;params[control.key]=coarseValue(Number(input.value));input.value=String(params[control.key]);onChange()};input.onchange=()=>{if(input.value===''){params[control.key]=0;input.value='0';onChange()}};input.ondblclick=()=>{params[control.key]=0;input.value='0';onChange()};label.append(text,input);field.append(label);
 }
 mount.append(field);
 function refresh(){controls.forEach((control,i)=>{const label=field.querySelectorAll('label')[i],input=label.querySelector('input'),name=typeof control.label==='function'?control.label(params):control.label;label.querySelector('span').textContent=name;input.setAttribute('aria-label',name+' coarse pitch in semitones');input.value=String(coarseValue(params[control.key]));input.disabled=control.enabled?!control.enabled(params):false;label.classList.toggle('is-inactive',input.disabled)})}
 refresh();return {refresh};
}
