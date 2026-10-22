// Copy musical steps between rack instruments without copying their sound patches.
import {normalizeStep,chordNotes,isSequenceLength} from './step-sequencer.js?v=sequence-copy-20261022';
const clone=value=>structuredClone(value);
export function buildSequenceCopy(source,destination){
 if(!source||!destination||!isSequenceLength(source.length)||!Array.isArray(source.cells))throw Error('Choose an instrument with a valid sequence.');
 const cells=Array.from({length:64},(_,index)=>{
  const original=source.cells[index]||{};
  if(destination.kind==='drum')return {on:!!original.on,velocity:source.kind==='drum'?original.velocity:(original.accent?1:.72),probability:source.kind==='drum'?(original.probability??1):1,ratchets:source.kind==='drum'?(original.ratchets??1):(original.repeats??1)};
  if(source.kind==='drum')return normalizeStep({on:original.on,note:0,accent:original.velocity>=.9,gate:.7,repeats:original.ratchets,slide:false,chord:[0],inversion:0});
  const step=normalizeStep(clone(original));
  const pitched=source.poly?chordNotes(step,source.root,true):chordNotes(step,source.root,false);
  // Keep the destination root control in place while preserving absolute pitches.
  const pitch=source.poly&&!destination.poly?(pitched[0]??source.root+step.note):source.root+step.note;
  step.note=pitch-destination.root;if(step.on&&!pitched.length)step.on=false;
  if(!source.poly||!destination.poly){step.chord=[0];step.inversion=0}
  return normalizeStep(step);
 });
 return {...clone(destination),length:source.length,cells,arpEnabled:false};
}
export function rackSequenceSource(id,label,module,type){
 return {id,label:()=>label+' · P'+String(module.state.pattern+1).padStart(2,'0')+(module.state.polyArp?.enabled?' · STEP PATTERN':''),
  snapshot(){const state=module.state;return {kind:'notes',poly:type==='poly',root:state.root,pattern:state.pattern,length:state.steps,cells:clone(state.patterns[state.pattern]),arpEnabled:!!state.polyArp?.enabled}},
  apply(sequence){const state=module.state;state.pattern=sequence.pattern;state.steps=sequence.length;state.root=sequence.root;state.patterns[sequence.pattern]=clone(sequence.cells);if(state.polyArp)state.polyArp.enabled=sequence.arpEnabled;module.refreshUI()}
 };
}
export function mountSequenceCopy(host,destination,getSources){
 if(!document.querySelector('link[data-sequence-copy-style]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./sequence-copy.css?v=sequence-copy-20261022',import.meta.url).href;link.dataset.sequenceCopyStyle='';document.head.append(link)}
 const root=document.createElement('section');root.className='sequence-copy';root.setAttribute('aria-label','Copy sequence from another instrument');
 root.innerHTML='<label>COPY SEQUENCE FROM<select data-copy-source aria-label="Source instrument"><option value="">CHOOSE INSTRUMENT</option></select></label><button type="button" data-copy-sequence disabled>COPY SEQUENCE</button><button type="button" data-undo-sequence-copy disabled>UNDO COPY</button><small data-copy-status role="status"></small>';
 host.append(root);const select=root.querySelector('[data-copy-source]'),copy=root.querySelector('[data-copy-sequence]'),undo=root.querySelector('[data-undo-sequence-copy]'),status=root.querySelector('[data-copy-status]');let backup=null;
 function sources(){return getSources().filter(source=>source.id!==destination.id)}
 function refresh(){const current=select.value;select.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=sources().length?'CHOOSE INSTRUMENT':'NO OTHER INSTRUMENTS';select.append(placeholder);for(const source of sources()){const option=document.createElement('option');option.value=source.id;option.textContent=source.label();select.append(option)}select.value=sources().some(source=>source.id===current)?current:'';copy.disabled=!select.value}
 select.addEventListener('focus',refresh);select.addEventListener('pointerdown',refresh);select.onchange=()=>copy.disabled=!select.value;
 copy.onclick=()=>{try{const source=sources().find(source=>source.id===select.value);if(!source)throw Error('Choose an instrument first.');const from=source.snapshot(),before=destination.snapshot(),next=buildSequenceCopy(from,before);destination.apply(next);backup=before;undo.disabled=false;
  let message='Copied '+source.label()+' → '+destination.label()+' · '+from.length+' steps.';
  if(from.kind==='drum'&&next.kind!=='drum')message+=' Drum hits play this instrument’s root note.';
  if(from.poly&&!next.poly&&next.kind!=='drum'&&from.cells.some(step=>step.on&&step.chord?.length>1))message+=' Chords use their lowest voiced note.';
  if(next.kind==='drum')message+=' Rhythm, accents and repeats copied into this drum lane.';
  if(from.arpEnabled)message+=' Uses Poly’s step pattern, not its arpeggiator.';
  status.textContent=message;
 }catch(error){status.textContent='Copy: '+error.message}};
 undo.onclick=()=>{if(!backup)return;destination.apply(backup);backup=null;undo.disabled=true;status.textContent='Restored '+destination.label()+' from before the copy.'};
 function hint(){return destination.snapshot().kind==='drum'?'Copies rhythm into the selected drum lane and sets this pattern’s length. Undo Copy restores it.':'Copies the source’s selected step pattern, length and timing. Undo Copy restores this pattern.'}
 status.textContent=hint();
 refresh();return {refresh,reset(){backup=null;undo.disabled=true;status.textContent=hint();refresh()},destroy(){root.remove()}};
}
