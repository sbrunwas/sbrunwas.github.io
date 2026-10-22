const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises');
const baseURL=process.env.BASE_URL||'http://127.0.0.1:8001';
(async()=>{const browser=await chromium.launch({...(process.env.CHROMIUM_BIN?{executablePath:process.env.CHROMIUM_BIN}:{}),headless:true,args:['--no-sandbox']});try{
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
 await page.addInitScript(()=>{
  window.__fxMessages=[];window.__fxErrors=[];const Original=window.AudioWorkletNode;
  window.AudioWorkletNode=class extends Original{constructor(ctx,name,options){super(ctx,name,options);if(name==='claw-master-performance-fx'){this.addEventListener('processorerror',()=>window.__fxErrors.push('Audio processor failed'));const post=this.port.postMessage.bind(this.port);this.port.postMessage=data=>{window.__fxMessages.push(structuredClone(data));post(data)}}}};
 });
 await page.goto(baseURL+'/clawstudio/');await page.locator('#c-desktab').click();
 const schema=await page.evaluate(async()=>{const {FX_PARAMETERS}=await import('/clawstudio/master-fx-parameters.js?v=effect-controls-20261022');return FX_PARAMETERS});
 assert.deepEqual(await page.locator('#cmf-effect option').allTextContents(),Object.keys(schema));
 await page.locator('#c-play').click();await page.waitForFunction(()=>window.__fxMessages.some(m=>m.type==='state'));
 const expected={};
 for(const [mode,{controls}] of Object.entries(schema)){
  await page.locator('#cmf-effect').selectOption(mode);assert.equal(await page.locator('[data-fx-param]').count(),controls.length);expected[mode]={};
  for(const c of controls){
   const value=c.options?c.options.find(x=>x[1]!==c.value)[1]:c.max===c.value?c.min:c.max;expected[mode][c.key]=value;
   const el=page.locator('[data-fx-param="'+c.key+'"]');
   if(c.options)await el.selectOption(String(value));else await el.evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}))},c.log?(value===c.max?1:0):value);
   const transmitted=await page.evaluate(({mode,key})=>window.__fxMessages.filter(m=>m.type==='state').at(-1).params[mode][key],{mode,key:c.key});assert.equal(transmitted,value,mode+' '+c.key+' reaches actual worklet');
  }
 }
 console.log('PASS all 22 per-effect controls reach the real audio worklet');
 // Painting chooses the matching editor, and reset only changes that effect.
 await page.locator('[data-master-brush="RETRIG"]').click();assert.equal(await page.locator('#cmf-effect').inputValue(),'RETRIG');await page.locator('#cmf-effect-reset').click();
 expected.RETRIG=Object.fromEntries(schema.RETRIG.controls.map(c=>[c.key,c.value]));
 for(const mode of ['RETRIG','REVERSE']){
  const b=page.locator('[data-master-gesture="'+mode+'"]');await b.scrollIntoViewIfNeeded();const box=await b.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();assert.ok((await b.getAttribute('class')).includes('held'));assert.equal(await page.locator('#cmf-effect').inputValue(),mode);
  assert.equal(await page.evaluate(()=>window.__fxMessages.filter(m=>m.type==='gesture').at(-1).effect),mode);
  await page.mouse.move(box.x+box.width/2,box.y-20);await page.mouse.up();assert.ok(!(await b.getAttribute('class')).includes('held'));assert.equal(await page.evaluate(()=>window.__fxMessages.filter(m=>m.type==='gesture').at(-1).down),false);
 }
 console.log('PASS brush/editor selection, effect-only reset and distinct held gestures with outside-pointer release');
 const exportProject=async()=>{const wait=page.waitForEvent('download');await page.locator('#cs17-save-project').click();return JSON.parse(await fs.readFile(await(await wait).path(),'utf8'))};
 const songStatus=text=>page.waitForFunction(text=>document.querySelector('#c-song-status').textContent.includes(text),text);
 const saved=await exportProject();assert.deepEqual(saved.desk.masterPerformance.params,expected);
 await page.locator('#c-song-name').fill('Edited glitch effects');await page.locator('#c-song-save').click();await songStatus('Saved Edited glitch effects');const choice=await page.locator('#c-song-picker').inputValue();
 await page.locator('#c-song-new').click();await songStatus('Blank patterns');const blank=await exportProject();for(const [mode,{controls}] of Object.entries(schema))for(const c of controls)assert.equal(blank.desk.masterPerformance.params[mode][c.key],c.value);
 await page.locator('#c-song-picker').selectOption(choice);await page.locator('#c-song-load').click();await songStatus('Loaded Edited glitch effects');assert.deepEqual((await exportProject()).desk.masterPerformance.params,expected);
 await page.reload();await page.locator('#c-song-picker').selectOption(choice);await page.locator('#c-song-load').click();await songStatus('Loaded Edited glitch effects');assert.deepEqual((await exportProject()).desk.masterPerformance.params,expected);
 const legacy=structuredClone(saved);delete legacy.desk.masterPerformance.params;await page.locator('#cs17-project-file').setInputFiles({name:'legacy-fx.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});await page.waitForFunction(()=>document.querySelector('#cs17-project-status').textContent.includes('Imported legacy-fx.json'));assert.deepEqual((await exportProject()).desk.masterPerformance.params,blank.desk.masterPerformance.params);
 console.log('PASS parameters persist through song save/load, refresh and project export; blank/legacy projects receive defaults');
 await page.locator('#c-desktab').click();await page.setViewportSize({width:390,height:844});await page.locator('#cmf-effect').selectOption('REVERB');
 assert.ok(await page.locator('#cmf-parameters').evaluate(el=>[...el.querySelectorAll('input,select,output')].every(c=>{const a=c.getBoundingClientRect(),b=el.getBoundingClientRect();return a.left>=b.left-1&&a.right<=b.right+1})), 'controls fit the mobile panel');
 assert.deepEqual(await page.evaluate(()=>window.__fxErrors),[]);assert.deepEqual(errors,[]);console.log('PASS mobile control layout and no browser errors');
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exit(1)});
