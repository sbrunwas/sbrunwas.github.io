const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const browser = {location: {hash: ''}, document: {getElementById: () => null}};
browser.window = browser;
for (const file of ['schedule.js', 'impact-data.js', 'impact.js']) {
  const script = fs.readFileSync(path.join(__dirname, '..', 'vaccines', file), 'utf8');
  vm.runInNewContext(script, browser, {filename: file});
}
const {VaccineSchedule, VaccineImpactData, VaccineImpactSelection} = browser.window;
const {studies, outcomes} = VaccineImpactData;
function resolve(fragment) {
  browser.location.hash = fragment;
  return VaccineImpactSelection();
}

test('each listed immunization links to its own sourced and reachable disease outcomes', () => {
  const reachable = new Set();
  for (const id of Object.keys(VaccineSchedule.vaccines)) {
    const keys = outcomes[id] || [id];
    assert.ok(keys.length, id);
    for (const hash of ['#' + id, '#impact-' + id]) {
      assert.equal(resolve(hash).vaccineId, id);
      assert.equal(resolve(hash).studyId, keys[0]);
    }
    for (const key of keys) {
      assert.ok(studies[key], key);
      assert.equal(resolve('#impact-' + id + '/' + key).studyId, key);
      reachable.add(key);
    }
  }
  assert.deepEqual([...reachable].sort(), Object.keys(studies).sort());
});

test('combination vaccines cover their constituent diseases, while booster evidence remains distinct', () => {
  assert.deepEqual(Array.from(outcomes.mmr), ['mmr', 'mumps', 'rubella']);
  for (const shared of ['dtap', 'tetanus', 'pertussis']) {
    assert.ok(outcomes.dtap.includes(shared));
    assert.ok(outcomes.tdap.includes(shared));
  }
  assert.notEqual(resolve('#impact-tdap').studyId, resolve('#impact-dtap').studyId);
  assert.equal(resolve('#impact-mmr/tetanus').studyId, 'mmr');
  assert.equal(resolve('#vaccine-impact').studyId, 'hepb');
  assert.equal(resolve('#impact-__proto__').studyId, 'hepb');
});

test('all plotted measurements have units, distinct row labels, valid scales and primary source links', () => {
  for (const [id, study] of Object.entries(studies)) {
    for (const field of ['topic','title','design','measure','population','finding','context']) {
      assert.ok(study[field]?.trim(), id + ' ' + field);
    }
    assert.ok(study.rows.length >= 2, id);
    assert.ok(Number.isFinite(study.max) && study.max > 0, id);
    assert.equal(new Set(study.rows.map(([label]) => label)).size, study.rows.length, id);
    for (const [label, value] of study.rows) {
      assert.ok(label.trim() && Number.isFinite(value) && value >= 0 && value <= study.max, id);
    }
    assert.ok(study.sources.length, id);
    for (const [label, url] of study.sources) {
      assert.ok(label.trim(), id);
      assert.equal(new URL(url).protocol, 'https:', id);
    }
  }
});
