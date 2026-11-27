// Scenario assumptions and scoring for an educational model, not diagnostic validation.
import {cases} from './model.mjs';
import {currentGas} from './gas.mjs';
export const challenges = [
 {id:'surfactant-deficiency',diagnosis:'Surfactant-deficient neonatal RDS',context:'A 28-week, 1.1 kg infant requires invasive support soon after birth. Oxygen need has persisted despite a patent airway. Use the pressure needed to deliver volume, the loops, and the gas.',settings:{...cases.rds.settings,mode:'PRVC',rate:35,spontRate:0,effort:0},treatment:'surfactant',targets:{vt:[4,6],co2:[40,65],sat:[90,96],pip:18,auto:2,fio2:60},explanation:'Surfactant deficiency made the modeled lungs stiff. Surfactant increased compliance and reduced shunt; volume-targeted support could then deliver the target volume with less pressure. Fixed PC would require manual pressure reduction. The effect size is an assumption, not a clinical prediction.'},
 {id:'bronchospasm',diagnosis:'Bronchospasm with obstructed expiration',context:'A 22 kg child with recurrent episodes of wheeze is ventilated after a respiratory illness. The tube is patent and there are few secretions. Compare peak pressure, estimated elastic pressure, and expiratory flow.',settings:{...cases.asthma.settings,mode:'AC',type:'VC',vt:7,rate:18,ti:.8,spontRate:0,effort:0,pmax:40},treatment:'bronchodilator',targets:{vt:[6,8],co2:[45,75],sat:[92,98],pip:25,auto:1.5,fio2:50},explanation:'Reversible bronchospasm increased resistance and slowed emptying. In VC the resistive load increased peak pressure. The modeled bronchodilator lowered resistance and intrinsic PEEP. Expiratory time and delivered volume still needed attention. Similar waveforms have other causes; the history and airway assessment supplied the distinction here.'},
 {id:'airway-secretions',diagnosis:'Secretion-related airway obstruction',context:'A 4 kg infant had been stable on these settings. Peak pressure has increased, coarse sounds are reported, and thick material is visible in the tube. Check delivery and emptying before simply raising the pressure limit.',settings:{weight:4,compliance:.8,resistance:260,heterogeneity:2,mode:'AC',type:'VC',vt:6,rate:35,ti:.4,pin:10,peep:5,spontRate:0,effort:0,shunt:12,fio2:35,deadspace:2.2,pmax:30},treatment:'suction',targets:{vt:[5,7],co2:[32,60],sat:[92,98],pip:28,auto:1.5,fio2:45},explanation:'The scenario assumed removable secretions were increasing airway resistance. Airway clearance reduced modeled peak pressure and improved emptying without increasing the volume target or pressure ceiling. Actual suspected tube obstruction requires an airway assessment; this simplified toggle cannot represent all causes or procedures.'},
 {id:'excess-support',diagnosis:'Excessive support after improved compliance',context:'A 1.1 kg preterm infant has improving oxygenation after treatment, but support has not been weaned and the gas is alkalemic. Compare the delivered volume with body weight. Decide whether a drug or a setting change is needed.',settings:{...cases.rds.settings,mode:'AC',rate:35,spontRate:0,effort:0},effects:{surfactant:true},targets:{vt:[4,6],co2:[40,65],sat:[90,96],pip:20,auto:2,fio2:60},explanation:'Compliance improved while fixed inspiratory pressure remained high, producing excessive tidal volume and ventilation. Reducing PC, or selecting an appropriate volume target with adaptive pressure, corrected the model. Lowering rate alone could change CO₂ without correcting excessive volume per breath.'}
];
export const diagnosisOptions=challenges.map(({id,diagnosis})=>({id,label:diagnosis}));
export function chooseChallenge(previousId,random=Math.random){const pool=challenges.filter(c=>c.id!==previousId);return pool[Math.min(pool.length-1,Math.floor(random()*pool.length))];}
export class ChallengeSession {
 constructor(definition){this.definition=definition;this.answer=null;this.state='active';this.stableSince=null;this.stableSeconds=0;this.feedback='Choose a working diagnosis, treat and adjust support, then get a gas. Goals must remain satisfied for 10 simulated seconds.';}
 submit(id){if(this.state!=='active')return;this.answer=id||null;this.stableSince=null;this.stableSeconds=0;this.feedback=id?'Working diagnosis recorded. Use the interventions and ventilator controls, then watch the response.':'Choose a working diagnosis first.';}
 reveal(){if(this.state!=='active')return;this.state='revealed';this.stableSince=null;this.stableSeconds=0;this.feedback='Answer revealed — this attempt was not completed.';}
 evaluate(sim,gas){
 if(this.state!=='active')return [];
 const c=this.definition,t=c.targets,m=sim.metrics,recent=sim.breaths.slice(-3);
 const within=(v,r)=>Number.isFinite(v)&&v>=r[0]&&v<=r[1];
 const allowed=new Set([c.treatment,...Object.keys(c.effects||{})].filter(Boolean));
 const treated=c.treatment?!!sim.effects[c.treatment]:(sim.s.pin<c.settings.pin||['PRVC','V+','AVAPS'].includes(sim.s.mode)||sim.s.type==='VC');
 const action=treated&&Object.entries(c.effects||{}).every(([k,on])=>sim.effects[k]===on)&&!Object.entries(sim.effects).some(([k,on])=>on&&!allowed.has(k));
 const checks=[
 ['Working diagnosis recorded',!!this.answer],
 ['Gas sampled after changes (within 60 s)',currentGas(gas,sim)],
 ['Appropriate intervention / adjustment',action],
 [`Last 3 VT ${t.vt[0]}–${t.vt[1]} mL/kg`,recent.length===3&&recent.every(b=>within(b.vte/sim.s.weight,t.vt))],
 [`Sampled CO₂ ${t.co2[0]}–${t.co2[1]} mmHg`,currentGas(gas,sim)&&m.va>.005&&within(gas.co2,t.co2)&&within(m.co2,t.co2)],
 [`Sampled SaO₂ ${t.sat[0]}–${t.sat[1]}%`,currentGas(gas,sim)&&within(gas.sat,t.sat)&&within(m.sat,t.sat)],
 [`Peak ≤${t.pip}; intrinsic PEEP <${t.auto} cmH₂O`,recent.length===3&&recent.every(b=>b.pip<=t.pip&&b.auto<t.auto)],
 [`FiO₂ ≤${t.fio2}%`,sim.s.fio2<=t.fio2]
 ];
 const ready=checks.every(([,ok])=>ok)&&this.answer===c.id;
 if(ready){if(this.stableSince===null)this.stableSince=sim.t;this.stableSeconds=Math.max(0,sim.t-this.stableSince);if(this.stableSeconds>=10){this.state='solved';this.feedback='Good job — challenge resolved. Model goals stayed satisfied for 10 simulated seconds.';}}
 else{this.stableSince=null;this.stableSeconds=0;if(this.answer&&checks.slice(1).every(([,ok])=>ok))this.feedback='Mechanics and gas goals are satisfied. Reconsider the working diagnosis, then submit it again.';}
 return checks;
 }
}
