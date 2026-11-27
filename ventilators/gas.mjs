export const gasConfiguration=sim=>JSON.stringify({settings:sim.s,effects:sim.effects});
export function sampleGas(sim){if(sim.breaths.length<3||sim.metrics.va<=.005)return null;return Object.freeze({t:sim.t,co2:sim.metrics.co2,sat:sim.metrics.sat,ph:sim.metrics.ph,pao2:sim.metrics.pao2,configuration:gasConfiguration(sim)});}
export const currentGas=(sample,sim)=>!!sample&&sample.configuration===gasConfiguration(sim)&&sim.t>=sample.t&&sim.t-sample.t<=60;
