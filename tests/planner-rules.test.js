// Boundary cases from AAP 2026 Table 2 and its notes, plus live-vaccine spacing guidance.
const assert = require("node:assert/strict");
const {test} = require("node:test");
const {evaluate, vaccines, sources} = require("../vaccines/planner-rules.js");
const dose = (vaccine, date, product) => ({vaccine, date, product});
const series = (id, ...dates) => dates.map(date => dose(id, date));
const plan = (id, dob, asOf, history = []) => {
  const answer = evaluate({dob, asOf, history});
  assert.equal(answer.error, undefined);
  return answer.results.find(v => v.id === id);
};
test("dates, scope, duplicate antigen, review flags and unknown input", () => {
  for (const [dob, asOf, history] of [
    ["2025-02-29","2026-03-01",[]], ["2020-01-01","2019-12-31",[]], ["2007-01-01","2026-01-01",[]],
    ["2020-01-01","2026-01-01",series("ipv","2019-12-31")], ["2020-01-01","2026-01-01",series("hepA","2026-01-02")],
    ["2020-01-01","2026-01-01",series("mmr","2021-01-10","2021-01-10")], ["2020-01-01","2026-01-01",series("other","2021-01-10")]
  ]) assert.ok(evaluate({dob, asOf, history}).error);
  const gated = evaluate({dob:"2025-01-01", asOf:"2026-01-01", history:[], reviewFlags:["risk"]});
  assert.equal(gated.results.length, vaccines.filter(v => !v.historyOnly).length);
  assert.ok(gated.results.every(v => v.status === "review" && v.earliest === null && v.sources.every(key => sources[key])));
});
test("first-birthday age, late catch-up, calendar months and leap years", () => {
  assert.equal(plan("mmr","2025-01-01","2025-12-31").earliest,"2026-01-01");
  assert.equal(plan("mmr","2025-01-01","2026-01-01").status,"eligible");
  assert.equal(plan("hepA","2020-02-29","2021-02-28").status,"eligible");
  assert.equal(plan("hepA","2020-01-01","2026-01-02",series("hepA","2025-08-31")).earliest,"2026-02-28");
  assert.equal(plan("mmr","2020-01-01","2026-01-01",series("mmr","2021-01-01")).status,"eligible");
});
test("recent live injected/nasal vaccines permit same-day or 28-day spacing, oral/inactivated vaccines do not block", () => {
  const dob = "2020-01-01";
  for (const id of ["mmr","liveOther"]) {
    const one = series(id,"2026-01-01");
    assert.equal(plan("varicella",dob,"2026-01-01",one).status,"eligible");
    assert.equal(plan("varicella",dob,"2026-01-28",one).status,"wait");
    assert.equal(plan("varicella",dob,"2026-01-28",one).earliest,"2026-01-29");
    assert.equal(plan("varicella",dob,"2026-01-29",one).status,"eligible");
  }
  assert.equal(plan("varicella",dob,"2026-01-02",series("rotavirus","2026-01-01")).status,"eligible");
  assert.equal(plan("varicella",dob,"2026-01-02",series("flu","2026-01-01")).status,"eligible");
  const simultaneous = [dose("mmr","2025-01-01"),dose("varicella","2025-01-01"),dose("flu","2025-01-01"),dose("liveOther","2025-01-01")];
  assert.equal(plan("mmr",dob,"2025-01-28",simultaneous).status,"wait");
  assert.equal(plan("mmr",dob,"2025-01-29",simultaneous).status,"eligible");
  const conflict = [dose("mmr","2025-01-01"),dose("varicella","2025-01-27")];
  assert.match(plan("varicella",dob,"2026-01-01",conflict).reason,/fewer than 28 days/);
  assert.equal(plan("varicella",dob,"2026-01-01",conflict).status,"review");
  // A live dose given before the first birthday can still constrain a later scheduled dose.
  assert.equal(plan("varicella","2025-01-02","2026-01-01",series("liveOther","2026-01-01")).earliest,"2026-01-29");
});
test("varicella prospective vs retrospective intervals, and 13th birthday transition", () => {
  const beforeAge13 = plan("varicella","2014-01-01","2026-02-01",series("varicella","2026-01-01"));
  assert.equal(beforeAge13.earliest,"2026-04-01");
  assert.equal(plan("varicella","2014-01-01","2026-03-01",series("varicella","2026-01-01","2026-01-29")).status,"complete");
  assert.equal(plan("varicella","2013-03-01","2026-03-03",series("varicella","2026-01-10")).earliest,"2026-03-01");
  assert.equal(plan("varicella","2010-01-01","2026-01-20",series("varicella","2026-01-01")).earliest,"2026-01-29");
  assert.equal(plan("mmr","2025-01-01","2026-06-01",series("mmr","2025-08-01")).status,"review");
});
test("HepB final dose meets all three limits, and four-dose combination series", () => {
  const dob="2025-01-01";
  const prior=[dose("hepB",dob),dose("hepB","2025-03-01","pediarix")];
  assert.equal(plan("hepB",dob,"2025-05-10",prior).earliest,"2025-06-18");
  const combo=[...prior,dose("hepB","2025-05-01","vaxelis")];
  assert.equal(plan("hepB",dob,"2025-05-10",combo).status,"wait");
  assert.equal(plan("hepB",dob,"2025-07-01",[...combo,dose("hepB","2025-07-01","vaxelis")]).status,"complete");
  const late=series("hepB","2026-01-01","2026-03-31");
  assert.equal(plan("hepB","2020-01-01","2026-04-01",late).earliest,"2026-05-26");
  assert.equal(plan("hepB","2012-01-01","2026-02-01",series("hepB","2026-01-01")).status,"review");
  assert.equal(plan("hepB","2012-01-01","2026-02-01",[dose("hepB","2026-01-01","pediatric")]).status,"eligible");
});
test("rotavirus first-dose ceiling, final-day ceiling and product-specific count", () => {
  const dob="2025-01-01";
  assert.equal(plan("rotavirus",dob,"2025-04-15").status,"eligible");
  assert.equal(plan("rotavirus",dob,"2025-04-16").status,"outside");
  const first=dose("rotavirus","2025-03-01","Rotarix");
  assert.equal(plan("rotavirus",dob,"2025-09-01",[first]).status,"eligible");
  assert.equal(plan("rotavirus",dob,"2025-09-02",[first]).status,"outside");
  assert.equal(plan("rotavirus",dob,"2025-05-01",[first,dose("rotavirus","2025-05-01","Rotarix")]).status,"complete");
  assert.equal(plan("rotavirus",dob,"2025-05-01",[first,dose("rotavirus","2025-05-01","unknown")]).status,"wait");
});
test("DTaP fourth-dose retrospective exception, four-dose completion and Tdap transition", () => {
  const dob="2020-01-01";
  const basic=series("dtap","2020-03-01","2020-05-01","2020-09-01");
  assert.equal(plan("dtap",dob,"2021-01-01",basic).earliest,"2021-03-01");
  assert.equal(plan("dtap",dob,"2021-01-01",[...basic,dose("dtap","2021-01-01")]).status,"wait");
  const completed=[...basic,dose("dtap","2024-01-01")];
  assert.equal(plan("dtap",dob,"2028-01-01",completed).status,"complete");
  assert.equal(plan("tdap",dob,"2028-01-01",completed).earliest,"2031-01-01");
  assert.equal(plan("tdap",dob,"2028-01-01",basic).status,"eligible");
  const preschoolMissed = [...basic, dose("dtap","2021-03-01")];
  assert.equal(plan("tdap",dob,"2028-01-01",preschoolMissed).status,"eligible");
  assert.equal(plan("tdap",dob,"2028-01-01",[...preschoolMissed,dose("tdap","2028-01-01")]).earliest,"2031-01-01");
  assert.equal(plan("dtap","2019-01-01","2025-12-21",series("dtap","2025-12-20")).status,"outside");
  assert.equal(plan("tdap","2019-01-01","2026-01-01",series("dtap","2025-12-20")).earliest,"2026-01-17");
  assert.equal(plan("tdap",dob,"2028-01-01",series("dtap","2020-01-07")).status,"review");
  const d1 = dose("dtap","2020-03-01"), t1 = dose("tdap","2027-01-01");
  const afterMixed = plan("tdap",dob,"2027-01-29",[d1,t1,dose("td","2027-01-29")]);
  assert.equal(afterMixed.earliest,"2027-07-29");
  assert.equal(afterMixed.doses,3);
  assert.equal(plan("tdap",dob,"2027-01-28",[d1,t1,dose("td","2027-01-28")]).status,"review");
  assert.equal(plan("tdap",dob,"2028-01-01").status,"eligible");
  const primary=[dose("tdap","2027-01-01"),dose("td","2027-01-29"),dose("td","2027-07-29")];
  assert.equal(plan("tdap",dob,"2029-01-01",primary).earliest,"2031-01-01");
  assert.equal(plan("tdap",dob,"2031-01-01",[...primary,dose("tdap","2031-01-01")]).status,"complete");
});
test("IPV distinguishes an early third dose from the final dose", () => {
  const dob="2020-01-01";
  const two=series("ipv","2024-03-01","2024-04-01");
  assert.equal(plan("ipv",dob,"2024-04-01",two).earliest,"2024-10-01");
  assert.equal(plan("ipv",dob,"2024-04-30",[...two,dose("ipv","2024-04-30")]).earliest,"2024-10-30");
  assert.equal(plan("ipv",dob,"2024-10-01",[...two,dose("ipv","2024-10-01")]).status,"complete");
});
test("Hib and PCV completion depend on ages at each dose, not a fixed count", () => {
  const dob="2025-01-01";
  assert.equal(plan("hib",dob,"2026-04-01",series("hib","2026-04-01")).status,"complete");
  assert.equal(plan("pcv",dob,"2027-01-01",series("pcv","2027-01-01")).status,"complete");
  for (const id of ["hib","pcv"]) {
    assert.equal(plan(id,dob,"2030-01-01").status,"outside");
    const infant=series(id,"2025-03-01","2025-05-01","2025-07-01");
    assert.equal(plan(id,dob,"2025-07-01",infant).earliest,"2026-01-01");
    assert.equal(plan(id,dob,"2026-01-01",[...infant,dose(id,"2026-01-01")]).status,"complete");
  }
  const pedvax=[dose("hib","2025-03-01","PedvaxHIB"),dose("hib","2025-05-01","PedvaxHIB")];
  assert.equal(plan("hib",dob,"2025-05-01",pedvax).earliest,"2026-01-01");
  const mixed=[dose("hib","2025-03-01","PedvaxHIB"),dose("hib","2025-05-01","unknown")];
  assert.equal(plan("hib",dob,"2025-05-01",mixed).earliest,"2025-05-29");
  const sevenMonths=series("pcv","2025-03-01","2025-08-01");
  assert.equal(plan("pcv",dob,"2025-08-01",sevenMonths).earliest,"2026-01-01");
});
test("HPV starts at 9; minimum series rules depend on age at first dose", () => {
  const young="2011-01-01", old="2010-01-01", first="2025-12-01";
  assert.equal(plan("hpv",young,"2026-02-01",series("hpv",first)).earliest,"2026-05-01");
  assert.equal(plan("hpv",young,"2026-06-01",series("hpv",first,"2026-05-01")).status,"complete");
  assert.equal(plan("hpv",old,"2026-02-01",series("hpv",first)).earliest,"2025-12-29");
  assert.equal(plan("hpv",old,"2026-04-01",series("hpv",first,"2026-03-31")).earliest,"2026-06-23");
  assert.equal(plan("hpv",young,"2026-05-01",series("hpv",first,"2026-04-30")).status,"review");
});
test("adolescent meningococcal timing and workups that need clinical context", () => {
  const dob="2010-01-01";
  assert.equal(plan("menACWY",dob,"2025-12-12",series("menACWY","2025-12-01")).earliest,"2026-01-26");
  assert.equal(plan("menACWY",dob,"2026-02-01",series("menACWY","2026-01-01")).status,"complete");
  for (const id of ["flu","covid","menB"]) assert.equal(plan(id,dob,"2026-06-01").status,"review");
  assert.equal(plan("rsv",dob,"2026-06-01").status,"outside");
  assert.equal(plan("rsv","2026-01-01","2026-06-01").status,"review");
  assert.equal(plan("covid","2026-01-01","2026-06-01").earliest,"2026-07-01");
});

test("overlapping Td and Tdap records on one day cannot create two valid tetanus doses", () => {
  const result = evaluate({dob:"2012-01-01",asOf:"2026-01-01",history:[
    dose("tdap","2025-09-01"),dose("td","2025-09-01")
  ]});
  assert.match(result.error,/twice/);
});
