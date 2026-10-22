// Computer keyboard performance is opt-in and never writes to a pattern.
export const JAM_TARGETS=['drum','bass','poly','texture','acid','sampler'];
const names={drum:'DRUM MACHINE',bass:'MONO',poly:'POLY',texture:'TEXTURE',acid:'ACID',sampler:'SAMPLER'};
const piano=[['KeyA','A',0],['KeyW','W',1],['KeyS','S',2],['KeyE','E',3],['KeyD','D',4],['KeyF','F',5],['KeyT','T',6],['KeyG','G',7],['KeyY','Y',8],['KeyH','H',9],['KeyU','U',10],['KeyJ','J',11],['KeyK','K',12],['KeyO','O',13],['KeyL','L',14],['KeyP','P',15],['Semicolon',';',16],['Quote',"'",17]];
const pads=[['KeyA','A','KICK'],['KeyS','S','SNARE'],['KeyD','D','LOW TOM'],['KeyF','F','MID TOM'],['KeyG','G','HIGH TOM'],['KeyH','H','RIM'],['KeyJ','J','CLAP'],['KeyK','K','CLOSED HAT'],['KeyL','L','OPEN HAT'],['Semicolon',';','CRASH'],['Quote',"'",'RIDE']];
const noteName=n=>['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][n%12]+(Math.floor(n/12)-1);
export function mountKeyboardJam(host,{onNote,onTransport,onMute,onSelect,getRoot=()=>60,prepare=()=>{},onError=()=>{}}){
 let enabled=false,target='drum',octave=0,serial=0;const held=new Map();
 host.className='keyboard-jam';host.innerHTML=`<div class="kj-toolbar"><div class="kj-modes" role="group" aria-label="Keyboard mode"><button type="button" data-kj-edit aria-pressed="true">✎ EDIT</button><button type="button" data-kj-jam aria-pressed="false">⌨ KEYBOARD JAM</button></div><label>PLAY <select aria-label="Keyboard instrument" data-kj-target>${JAM_TARGETS.map((id,i)=>`<option value="${id}">${i+1} · ${names[id]}</option>`).join('')}</select></label><div class="kj-octave"><button type="button" data-kj-oct="-1" aria-label="Lower keyboard octave">− OCT</button><output data-kj-range></output><button type="button" data-kj-oct="1" aria-label="Raise keyboard octave">+ OCT</button></div><span data-kj-status role="status">Editing · keyboard shortcuts are off</span><details><summary>KEY MAP</summary><p>A/W/S/E… play notes · Z/X shift octave · 1–6 select instrument · Space play/pause · M mute · Shift accent · Esc returns to Edit. Browser Ctrl/⌘ shortcuts stay available.</p><div class="kj-keys" aria-label="Playable computer keys"></div></details></div>`;
 const $=q=>host.querySelector(q),error=e=>{onError(e);$('[data-kj-status]').textContent='Keyboard: '+e.message};
 function mapping(){return target==='drum'?pads.map(([code,key,label],index)=>({code,key,label,index})):target==='sampler'?pads.slice(0,4).map(([code,key],index)=>({code,key,label:'REEL '+(index+1),index})):piano.map(([code,key,offset])=>({code,key,note:Math.max(0,Math.min(127,getRoot(target)+octave*12+offset)),label:noteName(Math.max(0,Math.min(127,getRoot(target)+octave*12+offset))),black:[1,3,6,8,10].includes(offset%12)}))}
 function paintKeys(){for(const key of host.querySelectorAll('[data-kj-key]')){const down=held.has(key.dataset.kjKey);key.classList.toggle('is-held',down);key.setAttribute('aria-pressed',String(down))}}
 function render(){host.classList.toggle('is-jamming',enabled);$('[data-kj-edit]').setAttribute('aria-pressed',String(!enabled));$('[data-kj-jam]').setAttribute('aria-pressed',String(enabled));$('[data-kj-target]').value=target;
  const pitched=!['drum','sampler'].includes(target);host.querySelector('.kj-octave').hidden=!pitched;$('[data-kj-range]').textContent=pitched?noteName(Math.max(0,Math.min(127,getRoot(target)+octave*12))):'';
  $('[data-kj-status]').textContent=enabled?names[target]+' · JAM KEYS ON · Esc or Edit to type':'Editing · keyboard shortcuts are off';
  const keys=$('.kj-keys');keys.replaceChildren();for(const item of mapping()){const button=document.createElement('button');button.type='button';button.dataset.kjKey=item.code;button.className=item.black?'is-black':'';button.disabled=!enabled;button.setAttribute('aria-label',item.label+', key '+item.key);const name=document.createElement('b'),label=document.createElement('small');name.textContent=item.key;label.textContent=item.label;button.append(name,label);keys.append(button)}paintKeys();
 }
 function release(entry){entry.active=false;const off=entry.off;entry.off=null;try{off?.()}catch(e){error(e)}}
 function releaseAll(){serial++;for(const entry of held.values())release(entry);held.clear();paintKeys()}
 function setEnabled(value){const next=!!value;if(next===enabled)return;if(!next)releaseAll();enabled=next;if(enabled){document.activeElement?.blur?.();Promise.resolve().then(()=>prepare(target)).catch(e=>{if(enabled){setEnabled(false);error(e)}})}render()}
 function setTarget(value){if(!JAM_TARGETS.includes(value)||value===target)return;releaseAll();target=value;render()}
 function shiftOctave(delta){releaseAll();octave=Math.max(-2,Math.min(2,octave+delta));render()}
 async function sound(entry){const ticket=++serial;entry.ticket=ticket;
  try{const off=await onNote({...entry.item,target:entry.target,velocity:entry.velocity,isHeld:()=>entry.active&&held.get(entry.item.code)===entry&&entry.ticket===ticket});if(!entry.active||held.get(entry.item.code)!==entry||entry.ticket!==ticket)off?.();else entry.off=off}
  catch(e){if(entry.active)error(e)}
 }
 function press(code,accent=false){if(!enabled||held.has(code))return;const item=mapping().find(item=>item.code===code);if(!item)return;
  const mono=target==='bass'||target==='acid';if(mono)for(const entry of held.values())if(entry.target===target){entry.ticket=++serial;entry.off?.();entry.off=null}
  const entry={item,target,velocity:accent?1:.8,active:true,off:null};held.set(code,entry);paintKeys();sound(entry);
 }
 function lift(code){const entry=held.get(code);if(!entry)return;const wasCurrent=(entry.target==='bass'||entry.target==='acid')&&[...held.values()].filter(e=>e.target===entry.target).at(-1)===entry;held.delete(code);release(entry);if(wasCurrent){const prior=[...held.values()].filter(e=>e.target===entry.target).at(-1);if(prior)sound(prior)}paintKeys()}
 function capture(event){event.preventDefault();event.stopImmediatePropagation()}
 function keydown(event){if(!enabled||event.ctrlKey||event.metaKey||event.altKey||event.isComposing)return;
  const code=event.code;if(code==='Escape'){capture(event);setEnabled(false);return}
  const action=mapping().some(item=>item.code===code)||['Space','KeyZ','KeyX','KeyM'].includes(code)||/^Digit[1-6]$/.test(code);
  if(action){capture(event);if(event.repeat)return;
   if(code==='Space')Promise.resolve().then(onTransport).catch(error);
   else if(code==='KeyM')onMute(target);
   else if(code==='KeyZ'||code==='KeyX')shiftOctave(code==='KeyZ'?-1:1);
   else if(/^Digit[1-6]$/.test(code)){const next=JAM_TARGETS[Number(code.at(-1))-1];setTarget(next);onSelect(next)}
   else press(code,event.shiftKey);return;
  }
  // Typing stays paused in Jam mode, even if a text field still has focus.
  if(event.key.length===1||(['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)&&event.target.closest?.('input,textarea,[contenteditable="true"]')))capture(event);
 }
 function keyup(event){if(held.has(event.code)){capture(event);lift(event.code)}}
 const blur=()=>setEnabled(false),visibility=()=>{if(document.hidden)setEnabled(false)};
 window.addEventListener('keydown',keydown,true);window.addEventListener('keyup',keyup,true);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
 $('[data-kj-edit]').onclick=()=>setEnabled(false);$('[data-kj-jam]').onclick=()=>setEnabled(!enabled);
 $('[data-kj-target]').onchange=e=>{setTarget(e.target.value);onSelect(target)};host.querySelectorAll('[data-kj-oct]').forEach(button=>button.onclick=()=>shiftOctave(+button.dataset.kjOct));
 $('.kj-keys').addEventListener('pointerdown',event=>{const key=event.target.closest('[data-kj-key]');if(!key||!enabled)return;event.preventDefault();key.setPointerCapture(event.pointerId);press(key.dataset.kjKey,event.shiftKey)});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])$('.kj-keys').addEventListener(name,event=>{const key=event.target.closest('[data-kj-key]');if(key)lift(key.dataset.kjKey)});
 render();return {setEnabled,setTarget,releaseAll,refresh:render,isHeld:instrument=>[...held.values()].some(e=>e.target===instrument),get enabled(){return enabled},get target(){return target},destroy(){setEnabled(false);window.removeEventListener('keydown',keydown,true);window.removeEventListener('keyup',keyup,true);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);host.replaceChildren()}};
}
