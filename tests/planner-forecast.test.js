const {test} = require('node:test');
const assert = require('node:assert/strict');
const {project} = require('../vaccines/planner-forecast.js');
const doses = dates => dates.map(visit => [visit.date,visit.doses.map(dose => dose.id)]);
test('future visits group eligible live doses and allow the full interval between separate visits', () => {
  const patient = {dob:'2023-05-10', asOf:'2024-05-24', history:[{vaccine:'mmr',date:'2024-05-10'}]};
  const result = project(patient,['mmr','varicella'],'minimum','2025-05-24');
  assert.deepEqual(doses(result),[['2024-06-07',['mmr','varicella']],['2024-09-07',['varicella']]]);
  assert.equal(patient.history.length,1);
});
test('a simulated live dose can postpone another series beyond its own minimum interval', () => {
  const patient = {dob:'2022-06-01',asOf:'2024-08-15',history:[{vaccine:'varicella',date:'2024-06-01'}]};
  const result = project(patient,['mmr','varicella'],'minimum','2025-08-15');
  assert.deepEqual(doses(result),[['2024-08-15',['mmr']],['2024-09-12',['mmr','varicella']]]);
});
test('an early date and a usual date can differ, and reviewed or aged-out series generate no visits', () => {
  const patient = {dob:'2024-01-01',asOf:'2024-02-11',history:[]};
  assert.equal(project(patient,['rotavirus'],'minimum')[0].date,'2024-02-12');
  assert.equal(project(patient,['rotavirus'],'usual')[0].date,'2024-03-01');
  assert.deepEqual(project({...patient,reviewFlags:['immunocompromise']},['mmr'],'usual'),[]);
  assert.deepEqual(project({...patient,asOf:'2024-12-01'},['rotavirus','flu'],'minimum'),[]);
  assert.deepEqual(project(patient,['mmr'],'minimum','2024-12-31'),[]);
});
