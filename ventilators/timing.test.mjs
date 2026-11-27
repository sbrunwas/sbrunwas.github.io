import {test} from 'node:test';
import assert from 'node:assert/strict';
// Run the actual animation callback with a deterministic clock and minimal DOM.
test('animation tracks elapsed seconds independently of refresh rate; reset exits fast-forward',async()=>{
 const elements=new Map();let frame;
 const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
 const element=id=>{if(!elements.has(id))elements.set(id,{value:id==='speed'?'1':id==='sweep'?'6':'',classList:{toggle(){},remove(){}},addEventListener(){},setAttribute(){},getBoundingClientRect:()=>({width:400,height:150}),getContext:()=>ctx});return elements.get(id);};
 globalThis.document={hidden:false,getElementById:element,querySelectorAll:()=>[],querySelector:()=>({open:false}),addEventListener(){}};
 globalThis.window={};globalThis.devicePixelRatio=1;globalThis.performance={now:()=>0};globalThis.requestAnimationFrame=cb=>{frame=cb;};
 await import('./app.mjs');
 for(let i=1;i<=600;i++)frame(i*1000/60);
 assert.ok(Math.abs(window.ventilatorLab.state.time-10)<.003);
 element('reset').onclick();
 for(let i=1;i<=1200;i++)frame(i*1000/120);
 assert.ok(Math.abs(window.ventilatorLab.state.time-10)<.003);
 element('speed').value='5';element('reset').onclick();assert.equal(element('speed').value,'1');
 document.hidden=true;frame(16);assert.equal(window.ventilatorLab.state.time,0);
 document.hidden=false;element('challengeTab').onclick();assert.equal(element('clock').textContent,'00:00');assert.equal(element('patientTab').hidden,true);assert.equal(element('export').disabled,true);
 element('getGas').onclick();assert.match(element('gasSampleTime').textContent,/Sample 0:00/);const held=element('gases').innerHTML;
 for(let i=1;i<=600;i++)frame(i*1000/60);
 assert.equal(element('gases').innerHTML,held);
 element('revealChallenge').onclick();assert.match(element('challengeFeedback').textContent,/not completed/);assert.equal(element('patientTab').hidden,false);
 element('labTab').onclick();assert.equal(element('challengePanel').hidden,true);assert.match(element('gasSampleTime').textContent,/No sample/);
});
