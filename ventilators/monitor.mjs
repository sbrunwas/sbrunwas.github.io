// Explicit teaching heuristics, separate from the respiratory mechanics equations.
// Baselines and alarm limits are scenario assumptions, not age-normal reference ranges.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function monitorProfile(settings={}){
 const w=settings.weight??2.2;
 const baseline=w<2?{hr:155,map:34,pulse:22}:w<5?{hr:150,map:43,pulse:28}:w<10?{hr:140,map:50,pulse:32}:{hr:110,map:68,pulse:40};
 return {...baseline,referencePeep:5,referencePaw:9,minMap:Math.round(baseline.map*.75),...settings.monitor};
}
export class BedsideMonitor {
 constructor(settings={}){this.profile=monitorProfile(settings);this.hr=this.profile.hr;this.map=this.profile.map;this.spo2=92;this.rr=0;this.pulse=this.profile.pulse;this.lastTime=null;this.noVentilation=0;this.history=[];this.lastHistory=-1;this.updatePressure();}
 updatePressure(){this.sbp=this.map+2*this.pulse/3;this.dbp=this.map-this.pulse/3;}
 update(sim){
 const now=sim.t;if(this.lastTime===null){this.lastTime=now;return;}
 const dt=now-this.lastTime;if(dt<=0)return;this.lastTime=now;
 const p=this.profile,m=sim.metrics;
 // A pressure-load proxy: no claim of measured venous return or cardiac output.
 const pressureLoad=Math.max(0,sim.s.peep-p.referencePeep)+Math.max(0,m.auto)+.25*Math.max(0,m.map-p.referencePaw);
 const sedation=sim.effects.sedation?.9:1;
 const severeHypoxia=clamp((80-this.spo2)/35,0,.55);
 const mapTarget=p.map*clamp(1-.025*pressureLoad,.45,1)*sedation*(1-.4*severeHypoxia);
 this.noVentilation=clamp(this.noVentilation+(m.va<=.005?dt:-2*dt),0,45);
 const satTarget=clamp(m.sat-Math.max(0,this.noVentilation-5)*.8,30,100);
 this.spo2+=(satTarget-this.spo2)*(1-Math.exp(-dt/4));
 const compensation=clamp((p.map-this.map)*1.2,0,35);
 const hypoxicTachy=clamp(92-this.spo2,0,10)*1.1;
 const hypoxicBrady=Math.max(0,80-this.spo2)*3;
 const co2Stress=clamp((m.co2-55)*.25,0,15);
 const hrTarget=clamp(p.hr+compensation+hypoxicTachy-hypoxicBrady+co2Stress-(sim.effects.sedation?8:0),45,220);
 this.hr+=(hrTarget-this.hr)*(1-Math.exp(-dt/6));
 this.map+=(mapTarget-this.map)*(1-Math.exp(-dt/5));
 const pulseTarget=p.pulse*clamp(this.map/p.map,.5,1.1);
 this.pulse+=(pulseTarget-this.pulse)*(1-Math.exp(-dt/5));this.updatePressure();this.rr=m.rr;
 if(now-this.lastHistory>=1){this.history.push({t:now,hr:this.hr,map:this.map,spo2:this.spo2});this.history=this.history.filter(v=>now-v.t<=60);this.lastHistory=now;}
 }
 get alert(){if(this.spo2<85)return 'Low SpO₂';if(this.map<this.profile.minMap)return 'Low systemic MAP';return '';}
 snapshot(){return {hr:this.hr,sbp:this.sbp,dbp:this.dbp,map:this.map,spo2:this.spo2,rr:this.rr,minMap:this.profile.minMap};}
}
