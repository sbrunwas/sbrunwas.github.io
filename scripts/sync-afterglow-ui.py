#!/usr/bin/env python3
"""Regenerate scoped Afterglow CSS and markup from the pinned original assets."""
from pathlib import Path
import re,json
repo=Path(__file__).resolve().parents[1]; src=repo/'clawstudio/afterglow-ui'
ids={'app':'c-afterglow','skin-select':'c-drum-skin','play':'c-ag-play','stop':'c-ag-stop','audio-status':'c-ag-audio-status','global-controls':'c-drum-global','save':'c-kit-save','load':'c-kit-load','midi-export':'c-drum-midi','wav-export':'c-drum-wav','render-bars':'c-render-bars','midi-connect':'c-drum-midi-connect','patterns':'c-pattern-buttons','length':'c-length','copy':'c-copy','paste':'c-paste','clear':'c-clear','randomize':'c-vary-voice','randomize-pattern':'c-random','randomize-all-drums':'c-randomall','undo-random':'c-undorandom','engine-pool':'c-engine-pool','engine-pool-hint':'c-pool-hint','sequencer':'c-grid','pages':'c-pages','voice-panel':'c-voice-panel','voice-name':'c-voice-title','voice-number':'c-voice-number','model':'c-model','audition':'c-hit','randomize-sound':'c-soundrand','mute':'c-voicemute','solo':'c-voicesolo','reverse':'c-reverse','sample-load':'c-sampleload','sample-clear':'c-sampleclear','voice-controls':'c-voiceknobs','step-label':'c-step-title','step-controls':'c-stepknobs','sample-zone':'c-sample-zone','sample-name':'c-sample-info','sample-detail':'c-sample-detail','chain-mode':'c-chainmode','chain':'c-chain','chain-apply':'c-chainapply','factory':'c-drum-factory','status':'c-drum-status','sample-file':'c-sample-file','preset-file':'c-kit-file','run-led':'c-ag-led','position':'c-ag-position','peak':'c-ag-peak',**{'engine-pool-'+str(n):'c-pool'+str(n) for n in [0,1,3,4]}}
def remap(text):
 for a,b in sorted(ids.items(),key=lambda t:-len(t[0])):
  text=re.sub(r'(?<=#)'+re.escape(a)+r'(?![\w-])',b,text)
 return text
# Scope the original artwork to the drum faceplate. Keep rule order and all palettes.
def css(text):
 text=re.sub(r'@import[^\n]+', '', text)
 text=re.sub(r'/\*.*?\*/', '', text, flags=re.S)
 def selectors(m):
  raw=m.group(1); leading=raw[:len(raw)-len(raw.lstrip())]; selector=raw.strip()
  if selector.startswith('@'):return raw+'{'
  out=[]
  for part in selector.split(','):
   part=remap(part.strip())
   # Body-only page margins/backgrounds belong to the studio shell, not the rack.
   if part=='body' or part.endswith(' body'):part='#c-afterglow .afterglow-unused-page'
   part=part.replace(':root','#c-afterglow')
   part=part.replace(' #c-afterglow','') if part.startswith('#c-afterglow') else part
   if not part.startswith('#c-afterglow'):part='#c-afterglow '+part
   out.append(part)
  return leading+','.join(out)+'{'
 return re.sub(r'([^{}]+)\{',selectors,text)
styles=css((src/'original-style.css').read_text())+'\n'+css((src/'original-skins.css').read_text())
styles='/* Original Afterglow artwork/palettes, scoped for the ClawStudio rack. AGPL-3.0-only. */\n'+styles
styles+='''\n#c-afterglow{width:100%;font-family:'IBM Plex Mono',monospace;margin:8px 0 16px}#c-afterglow button:active{filter:none}#c-afterglow .rrow{display:contents}#c-afterglow .rrow+.rrow .section-label{margin-top:14px}#c-afterglow .sequence-copy{margin:10px 24px}#c-afterglow .pattern-actions{flex-wrap:wrap}#c-afterglow .afterglow-extras{display:flex;gap:7px;flex-wrap:wrap;margin:0 24px 16px}#c-afterglow .inspectline{display:flex;gap:8px;align-items:center;font-size:9px;margin:10px 0}#c-afterglow #c-step-on{font-size:8px;min-height:25px;padding:4px 6px}#c-afterglow .step.now{box-shadow:inset 0 0 0 2px var(--amber),0 3px 0 #292f23}#c-afterglow .voice-select.name{width:100%}#c-afterglow [hidden]{display:none!important}#c-afterglow .step-number{font-weight:400}#c-afterglow #c-pattern-buttons{flex-wrap:wrap}#c-afterglow .voice-row .voice-select{white-space:normal;line-height:1.25}#c-afterglow .voice-row{min-width:0}#c-afterglow .control input[type=number]{font-family:inherit}#c-afterglow .global-controls input[type=number]{width:65px}#c-afterglow .sequencer{grid-template-columns:190px repeat(16,minmax(28px,1fr));min-width:850px}#c-afterglow #c-grid .step{min-width:0;width:auto}#c-afterglow .knob-display{touch-action:none;cursor:ns-resize;pointer-events:auto}#c-afterglow .pattern-toolbar{color:var(--ink)}#c-afterglow .global-controls{align-items:center}#c-afterglow .skin-control{font-weight:500}@media(max-width:780px){#c-afterglow .sequencer{grid-template-columns:160px repeat(16,32px);min-width:752px}#c-afterglow .step-inspector{flex-wrap:wrap}#c-afterglow .step-inspector .inspectline{width:100%;margin:0}#c-afterglow #c-stepknobs{width:100%}#c-afterglow .pattern-actions{margin-left:0}#c-afterglow .pattern-toolbar>.section-label{color:inherit}}@media(max-width:480px){#c-afterglow .masthead{flex-wrap:wrap;gap:12px}#c-afterglow .header-right{max-width:none;width:100%;flex-direction:row;align-items:center;gap:8px;flex-wrap:wrap}#c-afterglow .skin-control{margin:0}#c-afterglow .model-number{font-size:24px;letter-spacing:1px}#c-afterglow .transport-indicator{margin-left:auto}}\n'''
(repo/'clawstudio/afterglow-rack.css').write_text(styles)
s=(src/'original.html').read_text(); main=s[s.index('<main'):s.index('</main>')+7]
files=s[s.index('<input hidden'):s.index('<script type="module"')]
html=main+files
for a,b in ids.items():
 html=html.replace('id="'+a+'"','id="'+b+'"').replace('for="'+a+'"','for="'+b+'"').replace('aria-describedby="'+a+'"','aria-describedby="'+b+'"')
html=html.replace('<main id="c-afterglow">','<main id="c-afterglow" data-skin="classic">')
html=html.replace('<div id="c-pattern-buttons"', '<select id="c-pat" aria-label="Selected drum pattern" hidden></select><div id="c-pattern-buttons"')
html=html.replace('<div id="c-grid" class="sequencer">','<div id="c-grid" class="sequencer">')
html=html.replace('<div id="c-pages" class="page-buttons"></div>','<span id="c-pages" class="section-label">Full sequence · rows of 16</span>')
html=html.replace('Four pages hold up to 64 steps per pattern.', 'All 64 steps remain visible in rows of sixteen.')
html=html.replace('<div id="c-stepknobs"', '<div class="inspectline"><button id="c-step-on">STEP OFF</button><span id="c-step-target"></span></div><div id="c-stepknobs"')
html=html.replace('<footer>', '<div class="afterglow-extras"><button id="c-clean-drums" title="Restore the original Afterglow output level and neutral processing">MATCH AFTERGLOW SOUND</button><button id="c-mixnow">MIX AT DESK →</button></div><footer>')
html=html.replace("SPACE: PLAY / PAUSE <span>·</span> A S D F G H J K L ; ': VOICES", 'Use Keyboard Jam above for live keys')
html=html.replace('href="./ENGINE-NOTES.md"','href="./ENGINE-NOTES.md"').replace('href="./Schwung-GPL-LICENSE.txt"','href="./Schwung-GPL-LICENSE.txt"')
js='''// SPDX-License-Identifier: AGPL-3.0-only
// Original Afterglow faceplate markup; studio IDs and shared transport are the adapter.
import {SKINS,SKIN_STORAGE_KEY} from './afterglow-ui/original-skins.js';
const template='''+json.dumps(html)+''';
export function mountAfterglowFaceplate(host){
 host.innerHTML=template;
 const panel=host.querySelector('#c-afterglow'),select=host.querySelector('#c-drum-skin');
 function apply(value){const skin=Object.hasOwn(SKINS,value)?value:'classic';panel.dataset.skin=skin;select.value=skin;return skin}
 try{apply(localStorage.getItem(SKIN_STORAGE_KEY))}catch{apply('classic')}
 select.addEventListener('change',()=>{const skin=apply(select.value);try{localStorage.setItem(SKIN_STORAGE_KEY,skin)}catch{}});
 return {panel};
}
'''
(repo/'clawstudio/afterglow-rack.js').write_text(js)
