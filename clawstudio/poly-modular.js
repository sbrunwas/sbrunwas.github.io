export const clawPatchbay=(()=>{
  const SOURCE_IDS=['LFO A','LFO B','ENV','VELOCITY','S&H','VOICE OSC','VOICE ENV'];
  const SOURCE_BY_TYPE={mono:SOURCE_IDS.slice(0,5),poly:SOURCE_IDS,texture:['MOD OSC','CYCLE','RANDOM','ENVELOPE','MOTION','S&H']};
  const DEST_IDS={mono:['LP FREQ','HP FREQ','PITCH','RESONANCE','FM INDEX','LEVEL'],poly:['LP FREQ','PITCH','OSC2 PITCH','RESONANCE','LEVEL','DETUNE','OSC MIX','OSC2 LEVEL','FILTER ENV','PAN'],texture:['TIMBRE','FOLD','LPG','FILTER','FM','PAN','FILTER 2','RESONANCE','RES 2','PITCH','LEVEL']};
  const COLOR={'MOD OSC':'#5cd7ea','CYCLE':'#b59df5','RANDOM':'#ff7c9a','ENVELOPE':'#ffc969','MOTION':'#88e9ac','LFO A':'#5cd7ea','LFO B':'#b59df5','ENV':'#ffc969','VELOCITY':'#ff7c9a','S&H':'#f99e52','VOICE OSC':'#88e9ac','VOICE ENV':'#ff94cd'};
  const RATE_DEFAULTS={a:1.4,b:.29,hold:3.5};
  function routesSafe(list,type){
    if(!Array.isArray(list))return [];
    const seen=new Set(),out=[];
    for(const x of list){
      if(!x||typeof x!=='object'||!SOURCE_BY_TYPE[type]?.includes(x.source)||!DEST_IDS[type]?.includes(x.dest))continue;
      const key=x.source+'→'+x.dest;
      if(seen.has(key)||typeof x.depth!=='number'||!Number.isFinite(x.depth))continue;
      seen.add(key);out.push({source:x.source,dest:x.dest,depth:Math.max(-1,Math.min(1,x.depth))});
      if(out.length>=8)break;
    }
    return out;
  }
  function ratesSafe(r){return {a:Number.isFinite(r?.a)?Math.min(18,Math.max(.03,r.a)):RATE_DEFAULTS.a,b:Number.isFinite(r?.b)?Math.min(18,Math.max(.03,r.b)):RATE_DEFAULTS.b,hold:Number.isFinite(r?.hold)?Math.min(16,Math.max(.25,r.hold)):RATE_DEFAULTS.hold};}
  function makeAudio(ctx,type,targets,{routes=[],rates}={},options={}){
    if(!DEST_IDS[type])throw Error('Unsupported patchbay instrument');
    const at=Number.isFinite(options.startAt)?Math.max(ctx.currentTime,options.startAt):ctx.currentTime;
    const ratesNow=ratesSafe(rates),sources={},edges=[];
    const starts=[];
    const texture=type==='texture',shared=options.sharedSources||{};
    const lfos=texture?[['MOD OSC','sine',ratesNow.a],['CYCLE','triangle',ratesNow.b],['MOTION','sine',ratesNow.a*.31]]:[['LFO A','sine',ratesNow.a],['LFO B','triangle',ratesNow.b]];
    for(const [key,wave,rate] of lfos){
      if(shared[key]){sources[key]=shared[key];continue}
      const o=ctx.createOscillator();o.type=wave;o.frequency.setValueAtTime(rate,at);o.start(at);sources[key]=o;starts.push(o);
    }
    for(const key of texture?['ENVELOPE']:['ENV','VELOCITY']){
      const c=ctx.createConstantSource();c.offset.value=0;c.start(at);sources[key]=c;starts.push(c);
    }
    const rand=shared['S&H']||ctx.createConstantSource();sources['S&H']=rand;if(!shared['S&H']){rand.offset.value=0;rand.start(at);starts.push(rand)}
    if(texture){const random=shared.RANDOM||ctx.createConstantSource();sources.RANDOM=random;if(!shared.RANDOM){random.offset.value=0;random.start(at);starts.push(random)}}
    sources['VOICE OSC']=type==='poly'?(options.previousVoice?.oscillator||null):null;
    sources['VOICE ENV']=type==='poly'?(options.previousVoice?.envelope||null):null;
    let seed=((Number(options.seed)||0)^0x6d2b79f5)>>>0, noiseAt=at, noiseRate=ratesNow.hold;
    function nextVoltage(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return ((seed>>>0)/4294967295)*2-1;}
    function scheduleNoise(until){if(noiseAt<ctx.currentTime)noiseAt=ctx.currentTime;const max=Number.isFinite(options.stopAt)?Math.min(until,options.stopAt):Math.min(until,ctx.currentTime+3);
      let count=0;while(noiseAt<=max && count++<1024){rand.offset.setValueAtTime(nextVoltage(),noiseAt);if(sources.RANDOM&&!shared.RANDOM)sources.RANDOM.offset.linearRampToValueAtTime(nextVoltage(),noiseAt+1/noiseRate);noiseAt+=1/noiseRate;}}
    let currentRoutes=[];
    function setRoutes(next){
      const clean=routesSafe(next,type);
      const retained=new Set();
      for(const r of clean){
        const params=targets[r.dest];if(!params||!sources[r.source])continue;
        const destArray=Array.isArray(params)?params:[params];
        const scale=({'LP FREQ':1600,'HP FREQ':700,'PITCH':500,'OSC2 PITCH':950,'RESONANCE':11,'FM INDEX':260,'LEVEL':.20,...options.scales})[r.dest]??1;
        for(const target of destArray){const param=target.param||target;
          const existing=edges.find(e=>e.source===sources[r.source]&&e.param===param&&e.dest===r.dest);
          if(existing){existing.gain.gain.setTargetAtTime(r.depth*(target.scale??scale),Math.max(at,ctx.currentTime),.015);retained.add(existing);continue}
          const gain=ctx.createGain();gain.gain.value=r.depth*(target.scale??scale);sources[r.source].connect(gain);
          try{gain.connect(param);const edge={gain,source:sources[r.source],dest:r.dest,param};edges.push(edge);retained.add(edge)}
          catch(err){sources[r.source].disconnect(gain);gain.disconnect();throw err}
        }
      }
      for(let i=edges.length-1;i>=0;i--){const e=edges[i];if(retained.has(e))continue;try{e.source.disconnect(e.gain)}catch{}e.gain.disconnect();edges.splice(i,1)}
      currentRoutes=clean;
      if(!shared['S&H']&&(options.sharedClock||clean.some(r=>r.source==='S&H'||r.source==='RANDOM')))scheduleNoise(Number.isFinite(options.stopAt)?options.stopAt:ctx.currentTime+3);
    }
    function setRates(next){const v=ratesSafe(next),now=Math.max(at,ctx.currentTime);
      sources[texture?'MOD OSC':'LFO A'].frequency.setTargetAtTime(v.a,now,.02);sources[texture?'CYCLE':'LFO B'].frequency.setTargetAtTime(v.b,now,.02);if(texture)sources.MOTION.frequency.setTargetAtTime(v.a*.31,now,.02);
      if(v.hold!==noiseRate&&!shared['S&H']){noiseRate=v.hold;rand.offset.cancelScheduledValues(now);noiseAt=now; if(!shared['S&H']&&(options.sharedClock||currentRoutes.some(r=>r.source==='S&H'||r.source==='RANDOM')))scheduleNoise(Number.isFinite(options.stopAt)?options.stopAt:now+3);}
    }
    function noteOn(time,duration,{attack=.02,decay=.2,sustain=.6,release=.2,velocity=1}={}){
      const t=Math.max(at,time,ctx.currentTime+.001),gate=Math.max(.01,duration),a=Math.max(.002,attack),d=Math.max(.01,decay),s=Math.max(0,Math.min(1,sustain)),rel=Math.max(.01,release);
      const env=sources[texture?'ENVELOPE':'ENV'].offset,vel=sources.VELOCITY?.offset;
      env.cancelScheduledValues(t);env.setValueAtTime(0,t);env.linearRampToValueAtTime(1,t+a);
      env.setTargetAtTime(s,t+a,d/3);
      // Continuity at release: exponential ADSR decay approaches sustain.
      const atRelease=t+Math.max(a,gate),before=s+(1-s)*Math.exp(-(Math.max(0,gate-a))/(d/3));
      env.setValueAtTime(before,atRelease);env.setTargetAtTime(0,atRelease,rel/3);
      vel?.setValueAtTime(Math.max(0,Math.min(1,velocity)),t);
      if(!shared['S&H']&&(options.sharedClock||currentRoutes.some(r=>r.source==='S&H'||r.source==='RANDOM')))scheduleNoise(t+gate+rel+.4);
    }
    function noteOff(time=ctx.currentTime){const env=sources[texture?'ENVELOPE':'ENV'].offset,now=Math.max(at,time,ctx.currentTime);env.cancelScheduledValues(now);env.setTargetAtTime(0,now,.055)}
    const tick=(type==='mono'||options.sharedClock)&&typeof setInterval==='function'?setInterval(()=>{if(!shared['S&H']&&(options.sharedClock||currentRoutes.some(r=>r.source==='S&H'||r.source==='RANDOM')))scheduleNoise(ctx.currentTime+3)},250):null;
    function dispose(){if(tick!==null&&typeof clearInterval==='function')clearInterval(tick);for(const e of edges.splice(0)){try{e.source.disconnect(e.gain)}catch{}try{e.gain.disconnect()}catch{}}for(const node of starts){try{node.stop()}catch{}try{node.disconnect()}catch{}}}
    setRoutes(routes);
    if(Number.isFinite(options.stopAt))for(const node of starts)node.stop(Math.max(at+.01,options.stopAt));
    return {setRoutes,setRates,noteOn,noteOff,dispose,getSource:key=>sources[key]||null,getSources:()=>({...sources}),get routes(){return currentRoutes.slice()}};
  }
  const IDEAS={
    mono:{'WOBBLE':[{source:'LFO A',dest:'LP FREQ',depth:.7},{source:'ENV',dest:'RESONANCE',depth:.36}],
      'WEIRD FM':[{source:'LFO B',dest:'FM INDEX',depth:.75},{source:'VELOCITY',dest:'LP FREQ',depth:.46}],
      'BROKEN TAPE':[{source:'LFO A',dest:'PITCH',depth:.11},{source:'LFO B',dest:'LP FREQ',depth:-.43},{source:'ENV',dest:'HP FREQ',depth:.57}],
      'RANDOM ACID':[{source:'S&H',dest:'LP FREQ',depth:.62},{source:'ENV',dest:'RESONANCE',depth:.28}]},
    poly:{'BREATHING PAD':[{source:'LFO A',dest:'LP FREQ',depth:.62},{source:'ENV',dest:'LEVEL',depth:.18}],
      'DRIFT':[{source:'LFO A',dest:'PITCH',depth:.08},{source:'LFO B',dest:'OSC2 PITCH',depth:-.25}],
      'RAVE ACCIDENT':[{source:'LFO A',dest:'RESONANCE',depth:.55},{source:'ENV',dest:'OSC2 PITCH',depth:.62},{source:'LFO B',dest:'LP FREQ',depth:.69}],
      'CROSS-FM':[{source:'VOICE OSC',dest:'OSC2 PITCH',depth:.68},{source:'VOICE ENV',dest:'LP FREQ',depth:.48}],
      'GENERATIVE':[{source:'S&H',dest:'LP FREQ',depth:.55},{source:'VOICE OSC',dest:'PITCH',depth:.18},{source:'LFO B',dest:'RESONANCE',depth:.22}]}
  };
  function panel(mount,type,config){
    const root=document.createElement('section');root.className='claw-patch claw-patch-'+type;root.setAttribute('aria-label',`${type} semi-modular patchbay`);
    const jack=(id,source)=>`<button type="button" class="claw-jack" data-${source?'source':'dest'}="${id}" aria-label="${source?'Output':'Input'} ${id}" title="${source?'Drag a cable from':'Patch a modulation output into'} ${id}"><span>${id}</span><i style="--jack:${source?COLOR[id]:'#cbd0cc'}"></i></button>`;
    root.innerHTML=`<header class="claw-patch-head"><div><small>CLAWSTUDIO · ${type.toUpperCase()} EXPANSION</small><b>SEMI-MODULAR PATCH BAY</b></div><div class="claw-patch-actions"><button type="button" data-action="idea">RANDOM PATCH</button><button type="button" data-action="clear">UNPLUG ALL</button></div></header>
      <div class="claw-patch-scroll"><div class="claw-patch-workspace" style="--port-count:${Math.max(SOURCE_BY_TYPE[type].length,DEST_IDS[type].length)}"><div class="claw-patch-jacks" data-kind="source"><span class="claw-row-label">OUT</span>${SOURCE_BY_TYPE[type].map(s=>jack(s,true)).join('')}</div><div class="claw-patch-jacks" data-kind="dest"><span class="claw-row-label">IN</span>${DEST_IDS[type].map(d=>jack(d,false)).join('')}</div><svg class="claw-patch-cables" aria-hidden="true"></svg></div></div>
      <div class="claw-patch-foot"><span class="claw-patch-tip" role="status">Knobs set the base; cables add modulation. Drag OUT → IN to patch. Grab an input plug to move it; drop on empty space to unplug. Tap two ports also works.</span><div class="claw-patch-rates"><label>LFO A RATE<input aria-label="LFO A rate in hertz" data-rate="a" type="range" min=".03" max="18" step=".01"></label><label>LFO B RATE<input aria-label="LFO B rate in hertz" data-rate="b" type="range" min=".03" max="18" step=".01"></label><label>S&H CLOCK<input aria-label="Sample and hold rate in hertz" data-rate="hold" type="range" min=".25" max="16" step=".25"></label></div></div><details class="claw-cable-details"><summary>CABLE DEPTH & POLARITY <span class="claw-cable-count"></span></summary><div class="claw-patch-list" aria-label="Cable depth controls"></div></details>`;
    mount.insertAdjacentElement('afterend',root);
    if(config.controls){root.querySelector('.claw-patch-rates').replaceChildren();config.controls(root.querySelector('.claw-patch-rates'))}
    const svg=root.querySelector('svg'),workspace=root.querySelector('.claw-patch-workspace'),tip=root.querySelector('.claw-patch-tip'),list=root.querySelector('.claw-patch-list');
    let selected=null,drag=null,suppressClick=false,frame=0;
    const routes=()=>routesSafe(config.getRoutes(),type);
    const ports=()=>[...root.querySelectorAll('[data-source],[data-dest]')];
    const port=(kind,id)=>ports().find(el=>el.dataset[kind]===id);
    const point=el=>{const r=el.querySelector('i').getBoundingClientRect(),w=workspace.getBoundingClientRect();return [r.left+r.width/2-w.left,r.top+r.height/2-w.top]};
    function element(tag,attrs,parent=svg){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el}
    function cable(a,b,color,key,loose=false){
      const dx=b[0]-a[0],sag=Math.min(110,45+Math.abs(dx)*.15),d=`M ${a[0]} ${a[1]} C ${a[0]+dx*.16} ${a[1]+sag}, ${b[0]-dx*.16} ${b[1]+sag}, ${b[0]} ${b[1]}`;
      const g=element('g',{'class':'claw-cable'+(loose?' is-dragging':''),'data-cable':key});
      element('path',{d,fill:'none',stroke:'#09070ca6','stroke-width':10,'stroke-linecap':'round',transform:'translate(0 4)'},g);
      element('path',{d,fill:'none',stroke:'#16101b','stroke-width':8,'stroke-linecap':'round'},g);
      element('path',{d,fill:'none',stroke:color,'stroke-width':5.5,'stroke-linecap':'round','class':'claw-cable-body'},g);
      element('path',{d,fill:'none',stroke:'#ffffff55','stroke-width':1.3,'stroke-linecap':'round',transform:'translate(0 -1.4)'},g);
      for(const [x,y] of [a,b]){element('circle',{cx:x,cy:y,r:11,fill:'#151018',stroke:'#08060a','stroke-width':2},g);element('circle',{cx:x,cy:y,r:8,fill:color,stroke:'#ffffff66','stroke-width':1.5},g);element('circle',{cx:x,cy:y,r:3.2,fill:'#312436'},g)}
    }
    function redraw(){frame=0;if(!root.isConnected)return;const bounds=workspace.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${Math.max(1,bounds.width)} ${Math.max(1,bounds.height)}`);svg.replaceChildren();
      routes().forEach((r,i)=>{if(drag?.moved&&drag.existing?.source===r.source&&drag.existing?.dest===r.dest)return;const a=port('source',r.source),b=port('dest',r.dest);if(a&&b)cable(point(a),point(b),COLOR[r.source],i)});
      if(drag?.moved){const w=workspace.getBoundingClientRect(),target=drag.hover?point(drag.hover):[drag.x-w.left,drag.y-w.top];const fixed=port(drag.source?'source':'dest',drag.source||drag.dest);if(fixed)cable(point(fixed),target,drag.source?COLOR[drag.source]:'#f4c778','drag',true)}
    }
    function drawSoon(){if(!frame)frame=requestAnimationFrame(redraw)}
    function update(next){config.setRoutes(routesSafe(next,type));render()}
    function render(){const rs=routes();
      for(const btn of ports()){btn.classList.toggle('armed',selected?.el===btn);btn.classList.toggle('connected',rs.some(r=>r.source===btn.dataset.source||r.dest===btn.dataset.dest));btn.setAttribute('aria-pressed',String(selected?.el===btn))}
      root.querySelector('.claw-cable-count').textContent=`${rs.length} / 8`;
      list.replaceChildren();for(const r of rs){const line=document.createElement('div');line.className='claw-patch-line';const info=document.createElement('span');info.textContent=`${r.source} → ${r.dest}`;info.style.color=COLOR[r.source];
        const input=document.createElement('input');input.type='range';input.min='-1';input.max='1';input.step='.01';input.value=String(r.depth);input.setAttribute('aria-label',`Depth ${r.source} to ${r.dest}`);
        const pct=document.createElement('small');pct.textContent=`${Math.round(r.depth*100)}%`;input.oninput=()=>{pct.textContent=Math.round(Number(input.value)*100)+'%';config.setRoutes(routes().map(x=>x.source===r.source&&x.dest===r.dest?{...x,depth:Number(input.value)}:x))};
        const remove=document.createElement('button');remove.type='button';remove.textContent='UNPLUG';remove.setAttribute('aria-label',`Disconnect ${r.source} from ${r.dest}`);remove.onclick=()=>update(routes().filter(x=>!(x.source===r.source&&x.dest===r.dest)));line.append(info,input,pct,remove);list.append(line)}
      if(!rs.length)list.textContent='No cables connected. The instrument’s internal signal path still plays.';
      root.querySelectorAll('[data-rate]').forEach(el=>el.value=String(ratesSafe(config.getRates())[el.dataset.rate]));config.refreshControls?.();drawSoon();
    }
    function attach(source,dest,existing=null){let rs=routes();if(rs.some(r=>r.source===source&&r.dest===dest&&r!==existing&&!(existing?.source===r.source&&existing?.dest===r.dest))){tip.textContent='These ports are already connected.';return false}
      if(existing)rs=rs.filter(r=>!(r.source===existing.source&&r.dest===existing.dest));if(rs.length>=8){tip.textContent='Eight cables maximum. Unplug a cable first.';return false}
      update([...rs,{source,dest,depth:existing?.depth??.45}]);tip.textContent=`Patched ${source} → ${dest}.`;return true;
    }
    function clearDrag(){for(const p of ports())p.classList.remove('compatible','drop-target');root.classList.remove('is-patching');drag=null;drawSoon()}
    root.addEventListener('pointerdown',ev=>{const jack=ev.target.closest('[data-source],[data-dest]');if(!jack||ev.button!==0)return;
      const existing=jack.dataset.dest?routes().filter(r=>r.dest===jack.dataset.dest).at(-1):null;
      drag={el:jack,id:ev.pointerId,source:jack.dataset.source||existing?.source,dest:existing?null:jack.dataset.dest,existing,startX:ev.clientX,startY:ev.clientY,x:ev.clientX,y:ev.clientY,moved:false,hover:null};
      try{jack.setPointerCapture(ev.pointerId)}catch{}
    });
    root.addEventListener('pointermove',ev=>{if(!drag||ev.pointerId!==drag.id)return;drag.x=ev.clientX;drag.y=ev.clientY;
      if(Math.hypot(ev.clientX-drag.startX,ev.clientY-drag.startY)>4)drag.moved=true;if(!drag.moved)return;ev.preventDefault();root.classList.add('is-patching');
      const candidate=document.elementFromPoint(ev.clientX,ev.clientY)?.closest(drag.source?'[data-dest]':'[data-source]');drag.hover=candidate&&root.contains(candidate)?candidate:null;
      for(const p of ports()){p.classList.toggle('compatible',Boolean(drag.source?p.dataset.dest:p.dataset.source));p.classList.toggle('drop-target',p===drag.hover)}
      tip.textContent=drag.hover?`Release to patch ${drag.source||drag.hover.dataset.source} → ${drag.dest||drag.hover.dataset.dest}`:drag.existing?'Move this plug to another input, or drop in empty space to unplug.':'Drag the loose plug to a highlighted port.';drawSoon();
    });
    root.addEventListener('pointerup',ev=>{if(!drag||ev.pointerId!==drag.id)return;const d=drag;if(!d.moved){clearDrag();return}
      suppressClick=true;setTimeout(()=>suppressClick=false,80);const candidate=document.elementFromPoint(ev.clientX,ev.clientY)?.closest(d.source?'[data-dest]':'[data-source]');clearDrag();selected=null;
      if(candidate&&root.contains(candidate))attach(d.source||candidate.dataset.source,d.dest||candidate.dataset.dest,d.existing);
      else if(d.existing){update(routes().filter(r=>!(r.source===d.existing.source&&r.dest===d.existing.dest)));tip.textContent='Cable unplugged.'}else tip.textContent='Cable released without connecting.';render();
    });
    root.addEventListener('pointercancel',clearDrag);root.addEventListener('lostpointercapture',()=>{if(drag)clearDrag()});
    function escape(ev){if(ev.key==='Escape'){clearDrag();selected=null;render();tip.textContent='Patching cancelled.'}}
    root.addEventListener('keydown',escape);
    root.addEventListener('click',ev=>{if(suppressClick)return;const jack=ev.target.closest('[data-source],[data-dest]');if(jack){const source=jack.dataset.source,dest=jack.dataset.dest;
      if(selected&&((selected.source&&dest)||(selected.dest&&source))){attach(selected.source||source,selected.dest||dest);selected=null}
      else{selected={el:jack,source,dest};tip.textContent=`${source||dest} selected. Choose a ${source?'parameter input':'modulation output'}.`}render();return}
      const action=ev.target.closest('[data-action]')?.dataset.action;if(action==='clear'){selected=null;update([]);tip.textContent='All cables unplugged.'}
      if(action==='idea'){const ideas=config.ideas||IDEAS[type],names=Object.keys(ideas),name=names[Math.floor(Math.random()*names.length)];selected=null;update(ideas[name]);tip.textContent=`${name} — grab a plug and experiment.`}
    });
    root.querySelectorAll('[data-rate]').forEach(el=>el.oninput=()=>config.setRates({...config.getRates(),[el.dataset.rate]:Number(el.value)}));
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(drawSoon):null;observer?.observe(workspace);root.querySelector('.claw-patch-scroll').addEventListener('scroll',drawSoon);
    render();return {refresh:render,destroy(){observer?.disconnect();cancelAnimationFrame(frame);root.remove()}};
  }
  return {SOURCE_IDS,SOURCE_BY_TYPE,DEST_IDS,routesSafe,ratesSafe,makeAudio,panel};
})()