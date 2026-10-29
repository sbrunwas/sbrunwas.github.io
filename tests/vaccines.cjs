// Independent transcription checks against the supplied CDPH IMM-395 (8/25).
const assert = require('node:assert/strict');
const { lookup, toMonths, notes, vaccines } = require('../vaccines/schedule.js');
const columns = [
  [0, ['hepb', 'rsv']],
  [2, ['dtap', 'ipv', 'hepb', 'hib', 'pcv', 'rv']],
  [4, ['dtap', 'ipv', 'hepb', 'hib', 'pcv', 'rv']],
  [6, ['dtap', 'ipv', 'hepb', 'hib', 'pcv', 'rv']],
  [12, ['hepa', 'mmr', 'varicella', 'hib', 'pcv']],
  [15, ['dtap']], [18, ['hepa']],
  [48, ['dtap', 'ipv', 'mmr', 'varicella']],
  [132, ['hpv', 'menacwy', 'tdap']], [192, ['menacwy', 'menb']]
];
for (const [months, expected] of columns) assert.deepEqual(lookup(months).visit.doses.map(d => d.id), expected);
// Whole-year bands include their final year; do not silently drop 6y11m or 12y11m.
for (const [lo, hi, key] of [[48, 83, '4_6_years'], [132, 155, '11_12_years'], [192, 203, '16_years']]) {
  assert.equal(lookup(lo - 1).visit, null);
  assert.equal(lookup(lo).visit.key, key);
  assert.equal(lookup(hi).visit.key, key);
  assert.equal(lookup(hi + 1).visit, null);
}
assert.equal(toMonths(4, 'years'), 48);
assert.equal(toMonths(15, 'months'), 15);
for (const invalid of ['', null, true, -1, 1.5, 'abc', Infinity, Number.MAX_SAFE_INTEGER]) {
  assert.equal(toMonths(invalid, 'years'), null);
}
assert.equal(toMonths(2, 'days'), null);
assert.equal(lookup(null).valid, false);
assert.equal(lookup(5).ongoing.length, 0);
assert.deepEqual(lookup(6).ongoing.map(d => d.id), ['covid19', 'flu']);
assert.equal(lookup(7).visit, null);
assert.equal(lookup(7).ongoing.length, 2, 'Seasonal section remains available outside exact visits');
assert.equal(lookup(6, false).ongoing.length, 0);
assert.equal(lookup(7).extra[0].id, 'rsv');
assert.equal(lookup(8).extra.length, 0, 'Routine first-season RSV note applies below 8 months');
assert.equal(lookup(108).extra[0].id, 'hpv');
assert.equal(lookup(107).extra.length, 0);
assert.equal(lookup(132).extra.length, 0);
assert.match(lookup(4).visit.doses.find(d => d.id === 'hepb').condition, /first dose/);
assert.match(lookup(6).visit.doses.find(d => d.id === 'hib').condition, /PedvaxHIB/);
assert.match(lookup(6).visit.doses.find(d => d.id === 'rv').condition, /unknown/);
assert.ok(lookup(192).visit.doses.find(d => d.id === 'menb').condition);
assert.equal(notes.length, 15);
for (const [months] of columns) for (const dose of lookup(months).visit.doses) {
  assert.ok(vaccines[dose.id]);
  dose.refs.forEach(ref => assert.ok(notes[ref - 1]));
}
console.log('Vaccine chart columns, age bands, conditions, seasonal controls, and input validation passed.');
