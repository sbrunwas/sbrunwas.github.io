import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulator} from './model.mjs';
import {BedsideMonitor} from './monitor.mjs';
function setup(settings={}){const sim=new Simulator({mode:'PRVC',weight:1.1,rate:35,vt:5,peep:5,spontRate:0,effort:0,...settings}),monitor=new BedsideMonitor(sim.s);return{sim,monitor};}
function run(sim,monitor,seconds){for(let i=0;i<seconds*10;i++){sim.advance(.1);monitor.update(sim);}}
test('systemic BP satisfies the declared MAP relationship and remains finite',()=>{const {sim,monitor}=setup();run(sim,monitor,50);const m=monitor.snapshot();assert.ok(Math.abs((m.sbp+2*m.dbp)/3-m.map)<1e-9);for(const v of Object.values(m))assert.ok(Number.isFinite(v));assert.ok(m.sbp>m.map&&m.map>m.dbp);});
test('high distending pressure depresses modeled systemic MAP and recovers after pressure reduction',()=>{const {sim,monitor}=setup();run(sim,monitor,40);const before=monitor.map;sim.s.peep=18;run(sim,monitor,40);assert.ok(monitor.map<before*.8);const low=monitor.map;sim.s.peep=5;run(sim,monitor,40);assert.ok(monitor.map>low*1.2);});
test('SpO2 follows oxygenation with delay and bedside values do not advance when simulation is paused',()=>{const {sim,monitor}=setup({fio2:21,shunt:40});run(sim,monitor,40);const before=monitor.spo2;sim.s.fio2=80;run(sim,monitor,1);const early=monitor.spo2;run(sim,monitor,35);assert.ok(monitor.spo2>before);assert.ok(monitor.spo2>=early);const snapshot=monitor.snapshot();monitor.update(sim);assert.deepEqual(monitor.snapshot(),snapshot);});
test('prolonged absent ventilation produces a bounded illustrative desaturation and bradycardia',()=>{const {sim,monitor}=setup();sim.advance=dt=>{sim.t+=dt;sim.metrics.va=0;sim.metrics.sat=75;sim.metrics.map=5;};run(sim,monitor,100);assert.ok(monitor.spo2<75&&monitor.spo2>=30);assert.ok(monitor.hr<monitor.profile.hr);});
