import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulator} from './model.mjs';
import {sampleGas,currentGas} from './gas.mjs';
test('gas results are immutable snapshots; obtaining a new sample refreshes them',()=>{const sim=new Simulator({mode:'PRVC',spontRate:0,effort:0});assert.equal(sampleGas(sim),null);sim.advance(35);const first=sampleGas(sim);assert.ok(first);const original=first.co2;sim.s.rate=15;sim.advance(40);assert.equal(first.co2,original);assert.equal(currentGas(first,sim),false);const next=sampleGas(sim);assert.notEqual(next.co2,original);assert.ok(currentGas(next,sim));assert.ok(Object.isFrozen(first));});
test('samples expire for scoring after 60 simulated seconds and become stale after an intervention',()=>{const sim=new Simulator();sim.advance(30);const first=sampleGas(sim);sim.effects.surfactant=true;assert.equal(currentGas(first,sim),false);sim.effects.surfactant=false;const next=sampleGas(sim);assert.ok(currentGas(next,sim));sim.advance(61);assert.equal(currentGas(next,sim),false);});
