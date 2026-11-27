// Units: mL, seconds, cmH2O. Resistance input is cmH2O/(L/s).
export const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
export const defaults = {mode:'SIMV',type:'PC',fio2:40,peep:6,rate:35,ps:8,pin:14,ti:.35,vt:5,rise:.06,trigger:.7,cycle:25,pmax:30,pmin:5,apnea:3,weight:2.2,compliance: .45,resistance:80,heterogeneity:1.5,spontRate:45,effort:3,neuralTi:.3,deadspace:2.2,shunt:18,recruit:5,hb:14,vco2:6,p50:24};
export const cases = {
 sandbox:{name:'Open physiology lab',tag:'EXPLORE',summary:'A 2.2 kg infant with moderate lung stiffness and spontaneous breathing. Change one setting and watch the next breath.',goal:'Explore how pressure, time, compliance and resistance change delivered volume.',settings:{}},
 rds:{name:'Preterm • surfactant deficiency',tag:'NICU · 1.1 kg',summary:'A 28-week infant has stiff, recruitable lungs and hypoxemia. Surfactant can rapidly change the pressure required to deliver the same volume.',goal:'Teaching targets: VT 4–6 mL/kg, simulated saturation 90–94%, and less unnecessary pressure / oxygen. Compare PC with PRVC after surfactant.',settings:{weight:1.1,compliance:.3,resistance:110,shunt:32,recruit:6,rate:45,pin:19,peep:5,ti:.3,fio2:55,spontRate:50,effort:2,p50:22,deadspace:2.2},targets:{vt:[4,6],sat:[90,94],co2:[40,60]}},
 bpd:{name:'Established BPD • slow emptying',tag:'NICU · 4 kg',summary:'A former preterm infant has heterogeneous, obstructed lungs. Watch the slow compartment and whether expiratory flow reaches zero.',goal:'Teaching targets: reduce intrinsic PEEP below 2 cmH2O; maintain VT 6–9 mL/kg and simulated CO₂ 40–65 mmHg. These are scenario goals, not BPD guidelines.',settings:{weight:4,compliance:1.1,resistance:160,heterogeneity:4,shunt:18,rate:40,pin:16,peep:7,ti:.45,fio2:40,spontRate:28,effort:3,deadspace:3},targets:{vt:[6,9],sat:[92,97],co2:[40,65],auto:2}},
 apnea:{name:'Apnea of prematurity',tag:'NICU · 1.4 kg',summary:'Respiratory effort is absent. Compare A/C, CPAP + PS with apnea backup, and Auto. Caffeine illustrates restoration of respiratory drive.',goal:'Teaching targets: establish ventilation, VT 4–6 mL/kg and simulated CO₂ 40–60 mmHg. Observe the difference between support and timed backup.',settings:{weight:1.4,compliance:.6,resistance:90,spontRate:0,effort:0,rate:30,pin:10,ti:.32,peep:5,shunt:12,fio2:30,p50:22},targets:{vt:[4,6],sat:[90,94],co2:[40,60]}},
 bronchiolitis:{name:'Bronchiolitis • air trapping',tag:'PICU · 5 kg',summary:'A 3-month-old has markedly increased airway resistance, uneven time constants and excessive initial backup frequency.',goal:'Teaching targets: intrinsic PEEP <2 cmH2O, VT 5–8 mL/kg, simulated CO₂ 40–65 mmHg. Look for complete expiration before increasing rate.',settings:{weight:5,compliance:.9,resistance:180,heterogeneity:3.5,rate:42,ti:.5,pin:15,peep:6,spontRate:38,effort:4,shunt:20,fio2:45,deadspace:2.8,p50:26},targets:{vt:[5,8],sat:[92,97],co2:[40,65],auto:2}},
 ards:{name:'Pediatric ARDS • stiff lungs',tag:'PICU · 18 kg',summary:'A child with pneumonia has low compliance and intrapulmonary shunt. Balance recruitment, oxygenation and distending pressure.',goal:'PALICC-2 suggests VT 6–8 mL/kg, lower if needed for pressure limits. Scenario goals: saturation 92–97%, CO₂ 40–65 mmHg, estimated passive plateau ≤28 and driving pressure ≤15 cmH2O.',settings:{weight:18,compliance:.35,resistance:22,heterogeneity:2.5,shunt:38,recruit:9,rate:26,ti:.65,pin:22,peep:6,fio2:65,spontRate:28,effort:3,deadspace:2.5,p50:27},targets:{vt:[6,8],sat:[92,97],co2:[40,65],plat:28,dp:15}},
 asthma:{name:'Severe asthma • obstructed airways',tag:'PICU · 22 kg',summary:'Expiratory resistance is high and exhalation is prolonged. A lower rate can improve emptying even as minute ventilation decreases.',goal:'Scenario goals: intrinsic PEEP <2 cmH2O, VT 5–8 mL/kg and estimated passive plateau ≤28 cmH2O. Try bronchodilator and a longer expiratory interval.',settings:{weight:22,compliance:1,resistance:65,heterogeneity:3,rate:25,ti:.7,peep:5,pin:15,spontRate:30,effort:5,fio2:40,shunt:10,deadspace:3,p50:27},targets:{vt:[5,8],sat:[92,97],co2:[40,70],auto:2,plat:28}}
};
export class Simulator {
 constructor(settings={}) { this.s={...defaults,...settings}; this.reset(); }
 reset(){this.t=0;this.v=[0,0];this.paw=this.s.peep;this.flow=0;this.volume=0;this.insp=false;this.lastStart=-99;this.nextMandatory=0;this.lastEffort=-99;this.nextEffort=.45;this.effortStart=-99;this.lastTriggered=-99;this.autoTriggers=0;this.autoPS=false;this.adaptive=this.s.pin;this.lastAdaptiveTime=0;this.breaths=[];this.loop=[];this.loops=[];this.trace=[];this.lastSample=-1;this.metrics={vt:0,vti:0,pip:0,map:this.s.peep,rr:0,mv:0,auto:0,plat:this.s.peep,dp:0,co2:45,pao2:65,sat:92,ph:7.35,va:0};this.effects={};this.history=[];this.peak=0;this.exhaled=0;this.pending=null;this.kind='Waiting';this.holdRequest=false;this.holding=false;this.held=null;this.lastMode=this.s.mode;}
 mechanics(){const s=this.s,e=this.effects;
 const surf=e.surfactant?1.8:1,bron=e.bronchodilator?.55:1,suction=e.suction?.75:1;
 // Smooth, illustrative recruitment and overdistension; not a fitted PV curve.
 const recruitment=clamp(.7+.3*s.peep/Math.max(1,s.recruit),.5,1.15);
 const over=1/(1+Math.max(0,s.peep-12)*.055+Math.max(0,this.volume/s.weight-10)*.045);
 const c=s.compliance*s.weight*surf*recruitment*over;
 const r=s.resistance/1000*bron*suction;
 const h=s.heterogeneity; return {c:[c*.5,c*.5],r:[r*(1+1/h),r*(1+h)],cTotal:c,rTotal:r,shunt:clamp(s.shunt/100+Math.max(0,s.recruit-s.peep)*.012-Math.max(0,s.peep-s.recruit)*.004-(e.surfactant?.06:0),.02,.65)};
 }
 muscle(){let rate=this.s.spontRate,amp=this.s.effort; if(this.effects.caffeine){rate=Math.max(40,rate);amp=Math.max(3,amp);}if(this.effects.sedation){amp*=.3;rate*=.6;}if(this.effects.paralysis){amp=0;rate=0;}
 if(rate>0&&this.t>=this.nextEffort){this.effortStart=this.t;this.lastEffort=this.t;this.nextEffort=this.t+60/rate;}
 if(!rate)this.nextEffort=this.t+.05;
 const phase=(this.t-this.effortStart)/this.s.neuralTi; return amp*(phase>=0&&phase<=1?Math.sin(Math.PI*phase):0);
 }
 start(kind,triggered=false){const s=this.s;this.finishCycle();this.insp=true;this.holding=false;this.startTime=this.t;this.lastStart=this.t;this.kind=kind;this.triggered=triggered;this.baseV=this.v.reduce((a,b)=>a+b,0);this.baseUnits=[...this.v];this.peak=0;this.peakFlow=0;this.inVolume=0;this.exhaled=0;this.loop=[{t:this.t,p:this.paw,f:this.flow*.06,v:0,mus:0,kind}];
 const m=this.mechanics();this.autoAtStart=(this.v[0]/m.c[0]*m.c[0]+this.v[1]/m.c[1]*m.c[1])/m.cTotal;
 this.breathPressure=['PRVC','V+','AVAPS'].includes(s.mode)?this.adaptive:(kind==='PS'?s.ps:s.pin);
 this.isVC=s.type==='VC'&&kind!=='PS'&&!['PRVC','V+','AVAPS'].includes(s.mode);
 this.nextMandatory=this.t+Math.max(60/s.rate,s.ti+.15);
 if(triggered)this.lastTriggered=this.t;
 }
 endInspiration(){this.expirationStart=this.t;this.expirationPressure=this.paw;this.insp=false;this.holding=false;const m=this.mechanics();const endV=this.v.reduce((a,b)=>a+b,0);const vt=Math.max(0,endV-this.baseV);const plat=this.s.peep+endV/m.cTotal;
 this.pending={t:this.t,vt,vti:this.inVolume,pip:this.peak,auto:this.autoAtStart,plat,dp:Math.max(0,plat-this.s.peep-this.autoAtStart),kind:this.kind};
 if(['PRVC','V+','AVAPS'].includes(this.s.mode)){
 const error=this.s.vt*this.s.weight-vt; const adjustment=error/m.cTotal;
 const limit=this.s.mode==='AVAPS'?2/60*Math.max(0,this.t-this.lastAdaptiveTime):2;
 this.lastAdaptiveTime=this.t;this.adaptive=clamp(this.adaptive+clamp(adjustment*.5,-limit,limit),this.s.pmin,Math.max(this.s.pmin,this.s.pmax-this.s.peep));
 }
 }
 finishCycle(){if(!this.pending)return;const b={...this.pending,vte:this.exhaled};this.breaths.push(b);this.breaths=this.breaths.filter(b=>this.t-b.t<60).slice(-120);this.metrics={...this.metrics,vt:b.vte,vti:b.vti,pip:b.pip,auto:b.auto,plat:b.plat,dp:b.dp};this.loops.push(this.loop);this.loops=this.loops.slice(-4);this.pending=null;}
 step(dt=.002){const s=this.s;this.t+=dt;const m=this.mechanics(),mus=this.muscle();
 if(this.lastMode!==s.mode){this.lastMode=s.mode;this.adaptive=s.pin;this.autoTriggers=0;this.autoPS=false;}
 if(s.mode==='Auto'&&this.t-this.lastTriggered>s.apnea){this.autoPS=false;this.autoTriggers=0;}
 const refractory=this.t-this.lastStart>Math.max(.25,s.ti+.12);
 // Effort trigger must overcome threshold and residual elastic pressure.
 const intrinsic=this.v.reduce((sum,v)=>sum+v,0)/m.cTotal;
 const trigger=mus> s.trigger+intrinsic && this.effortStart>this.lastTriggered+.05;
 if(!this.insp&&refractory){
 if(trigger){let kind='Mandatory';
 if(s.mode==='SIMV')kind=this.t>=this.nextMandatory-Math.min(.2,60/s.rate*.2)?'Mandatory':'PS';
 if(['CPAP','V+','AVAPS'].includes(s.mode)||(s.mode==='Auto'&&this.autoPS))kind='PS';
 if(s.mode==='Auto'){this.autoTriggers++;if(this.autoTriggers>=3)this.autoPS=true;}
 const due=this.nextMandatory;this.start(kind,true);if(s.mode==='SIMV'&&kind==='PS')this.nextMandatory=due;
 }else{const spontaneous=['CPAP','V+'].includes(s.mode)||(s.mode==='Auto'&&this.autoPS);
 const due=spontaneous?this.t-this.lastStart>=s.apnea:this.t>=this.nextMandatory;
 if(due){this.start('Mandatory');if(spontaneous)this.kind='Apnea backup';}
 }}
 const elapsed=this.t-(this.startTime??this.t);let target=s.peep;
 // Finite exhaust response for pressure-targeted breaths (12 ms time constant).
 // VC retains its ideal prescribed-flow switching behavior.
 if(!this.insp&&!this.isVC&&this.expirationStart!==undefined){target=s.peep+Math.max(0,this.expirationPressure-s.peep)*Math.exp(-(this.t-this.expirationStart)/.012);}
 if(this.insp){target=s.peep+this.breathPressure*((u)=>u*u*(3-2*u))(clamp(elapsed/Math.max(.01,s.rise),0,1));}
 const gains=m.c.map((c,i)=>1-Math.exp(-dt/(m.r[i]*c)));
 if(this.holding){const eq=(this.v[0]*gains[0]+this.v[1]*gains[1])/(m.c[0]*gains[0]+m.c[1]*gains[1]);target=s.peep+eq-mus;}
 else if(this.insp&&this.isVC){const desired=s.vt*s.weight/Math.max(.1,s.ti);const gain=m.c[0]*gains[0]+m.c[1]*gains[1];target=s.peep-mus+(desired*dt+this.v[0]*gains[0]+this.v[1]*gains[1])/gain;}
 this.pressureLimited=target>s.pmax;this.paw=clamp(target,0,s.pmax);
 let flow=0;for(let i=0;i<2;i++){const before=this.v[i];const equilibrium=m.c[i]*(this.paw-s.peep+mus);this.v[i]=equilibrium+(before-equilibrium)*Math.exp(-dt/(m.r[i]*m.c[i]));this.v[i]=Math.max(-m.c[i]*s.peep,this.v[i]);flow+=(this.v[i]-before)/dt;}
 this.flow=flow;this.volume=this.v.reduce((a,b)=>a+b,0);
 if(this.insp){this.peak=Math.max(this.peak,this.paw);this.peakFlow=Math.max(this.peakFlow,flow);this.inVolume+=Math.max(0,flow)*dt;
 const support=this.kind==='PS';const cycle=support&&elapsed>Math.max(.12,s.rise+.03)&&flow<=this.peakFlow*s.cycle/100;
 if(!this.holding&&(elapsed>=s.ti||cycle)){if(this.holdRequest){this.holding=true;this.holdRequest=false;this.holdEnd=this.t+.4;}else this.endInspiration();}
 if(this.holding&&this.t>=this.holdEnd){this.held={paw:this.paw,effort:mus,t:this.t};this.endInspiration();}
 }else{this.exhaled+=Math.max(0,-flow)*dt;
 if(this.pending&&flow>0){this.pending.vti+=flow*dt;this.pending.vt=Math.max(this.pending.vt,this.volume-this.baseV);}
 }
 // Ventilation estimate from completed cycles; breath interval includes expiration.
 const recent=this.breaths.filter(b=>this.t-b.t<15);const span=recent.length>1?recent.at(-1).t-recent[0].t:0;
 const rr=span>0?(recent.length-1)*60/span:recent.length?60/Math.max(.5,this.t-this.lastStart):0;
 const avg=recent.length?recent.reduce((sum,b)=>sum+b.vte,0)/recent.length:0;
 const va=recent.length?recent.reduce((sum,b)=>sum+Math.max(0,b.vte-s.deadspace*s.weight),0)/recent.length*rr/1000:0;
 const co2Target=clamp(.863*s.vco2*s.weight/Math.max(.005,va),12,180);
 this.metrics.co2+=(co2Target-this.metrics.co2)*(1-Math.exp(-dt/25));
 const pao=Math.max(1,s.fio2/100*(760-47)-this.metrics.co2/.8);
 const sat=(p)=>Math.pow(Math.max(.1,p),2.7)/(Math.pow(Math.max(.1,p),2.7)+Math.pow(s.p50,2.7));
 const content=(p)=>1.34*s.hb*sat(p)+.0031*p;
 const venous=1.34*s.hb*.65+.0031*35;
 const ca=(1-m.shunt)*content(pao)+m.shunt*venous;
 let lo=.1,hi=713;for(let j=0;j<24;j++){let mid=(lo+hi)/2;if(content(mid)>ca)hi=mid;else lo=mid;}
 const pa=(lo+hi)/2;this.metrics.pao2+=(pa-this.metrics.pao2)*(1-Math.exp(-dt/12));this.metrics.sat=100*sat(this.metrics.pao2);
 this.metrics.ph=6.1+Math.log10(24/(.03*this.metrics.co2));this.metrics.rr=rr;this.metrics.mv=avg*rr/1000;this.metrics.va=va;this.metrics.map+=(this.paw-this.metrics.map)*(1-Math.exp(-dt/4));
 // Loops use every integrated point; time traces retain a lighter 16 ms history.
 const p={t:this.t,p:this.paw,f:flow*.06,v:Math.max(0,this.volume-(this.baseV??0)),mus,kind:this.kind};
 this.loop.push(p);if(this.loop.length>20000)this.loop.shift();
 if(this.t-this.lastSample>=.016){this.trace.push(p);this.trace=this.trace.filter(p=>this.t-p.t<16);this.lastSample=this.t;}

 }
 advance(seconds){const n=Math.ceil(seconds/.002);for(let i=0;i<n;i++)this.step(seconds/n);}
}
