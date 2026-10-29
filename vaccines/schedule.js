/* CDPH IMM-395 (8/25), transcribed from the user-supplied 2025 chart.
 * This is a visit reference, not a dose-history or catch-up calculator. */
(function (root) {
  'use strict';
  const vis = 'https://www.cdc.gov/vaccines/hcp/current-vis/';
  const vaccines = {
    hepb: { code: 'HepB', name: 'Hepatitis B', page: 'hepatitis-b', color: '#b6d4b9' },
    rsv: { code: 'RSV', name: 'Respiratory syncytial virus', page: 'rsv-iis', color: '#e4bb89' },
    dtap: { code: 'DTaP', name: 'Diphtheria, tetanus & pertussis', page: 'dtap', color: '#79aeca' },
    ipv: { code: 'IPV', name: 'Polio', page: 'polio', color: '#d795b1' },
    hib: { code: 'Hib', name: 'Haemophilus influenzae type b', page: 'hib', color: '#dc9483' },
    pcv: { code: 'PCV', name: 'Pneumococcal disease', page: 'pneumococcal-conjugate', color: '#72b7ab' },
    rv: { code: 'RV', name: 'Rotavirus', page: 'rotavirus', color: '#9dbed5' },
    hepa: { code: 'HepA', name: 'Hepatitis A', page: 'hepatitis-a', color: '#ccb482' },
    mmr: { code: 'MMR', name: 'Measles, mumps & rubella', page: 'mmr', color: '#9d96bf' },
    varicella: { code: 'VAR', name: 'Chickenpox (varicella)', page: 'varicella', color: '#b0a6c5' },
    hpv: { code: 'HPV', name: 'Human papillomavirus', page: 'hpv', color: '#9ebd88' },
    menacwy: { code: 'MenACWY', name: 'Meningococcal ACWY', page: 'meningococcal-acwy', color: '#9ebd88' },
    tdap: { code: 'Tdap', name: 'Tetanus, diphtheria & pertussis', page: 'tdap', color: '#9ebd88' },
    menb: { code: 'MenB', name: 'Meningococcal B', page: 'meningococcal-b', color: '#9ebd88' },
    covid19: { code: 'COVID-19', name: 'COVID-19', page: 'covid-19', color: '#a1c6c9' },
    flu: { code: 'Flu', name: 'Influenza', page: 'influenza-inactivated', color: '#b6d4b9' }
  };
  const notes = [
    'HepB: give monovalent vaccine within 24 hours of birth for stable infants weighing at least 2 kg. See the full schedule for other infants.',
    'RSV: seasonal recommendation is October 1–March 31. Infants born in season should receive immunization promptly, ideally during the birth hospitalization, when prenatal RSV vaccination was less than 14 days before birth, absent, or unknown. Infants younger than 8 months born before the season should receive immunization before it begins. High-risk children age 8–19 months should receive nirsevimab before their second RSV season.',
    'HepB: a 4-month dose is unnecessary when birth and 2-month doses were given, but may be included in a combination vaccine. Give the final (third or fourth) dose after age 24 weeks and at least 16 weeks after the first dose.',
    'Hib: Vaxelis and PedvaxHIB are preferentially recommended for American Indian and Alaska Native infants.',
    'Rotavirus: first dose at 6–14 weeks, with a maximum first-dose age of 14 weeks 6 days. The final dose must be given by 8 months 0 days. If any RotaTeq (RV5) was given, or the product is unknown, three doses are needed.',
    'Hib: the 6-month dose is not indicated if PedvaxHIB alone was used at both 2 and 4 months.',
    'COVID-19: consult the detailed recommendations for dose counts and intervals in healthy or immunocompromised children (bit.ly/COVIDrecs).',
    'Influenza: children age 6 months through 8 years receiving flu vaccine for the first time need two doses at least 4 weeks apart.',
    'International travel: consult CDC guidance for measles vaccination at age 6–11 months. Children age 12 months and older should receive two doses before international travel.',
    'MMR: the minimum interval between the first and second doses is 4 weeks. Two MMR doses should still be given on or after age 12 months.',
    'Varicella: minimum interval is 3 months at age 1–12 years, and 4 weeks at age 13 years and older. MMRV may be used when both MMR and varicella are indicated. For the first dose at age 12–47 months, typically give separate MMR and varicella unless the parent or caregiver prefers MMRV.',
    'PCV: give the final dose of the series at age 12 months or later.',
    'DTaP: the fourth dose may be given as early as 12 months if at least 6 months have elapsed since the third dose.',
    'HPV: for age 9–14 years, use a two-dose schedule at 0 and 6–12 months (minimum interval 5 months). If immunocompromised, or starting at age 15 years or older, use three doses at 0, 1–2, and 6 months.',
    'MenB: shared clinical decision-making is recommended for healthy people age 16–23 years. Pentavalent MenABCWY may be used when both MenACWY and MenB are indicated at the same visit. MenB component brands are not interchangeable.'
  ];
  const dose = (id, timing = '', refs = [], condition = '') => ({ id, timing, refs, condition });
  const visits = [
    { key: 'birth', short: 'Birth', label: 'Birth', months: 0, doses: [
      dose('hepb', 'Within 24 hours of birth', [1]),
      dose('rsv', 'Seasonal; infants younger than 8 months', [2], 'Depends on season and prenatal vaccination')
    ] },
    { key: '2_months', short: '2 mo', label: '2 months', months: 2, doses: [
      dose('dtap'), dose('ipv'), dose('hepb', 'Age 1–2 months; 1–2 months after birth dose', [3]),
      dose('hib', '', [4]), dose('pcv'), dose('rv', 'Check first-dose and final-dose age limits', [5])
    ] },
    { key: '4_months', short: '4 mo', label: '4 months', months: 4, doses: [
      dose('dtap', '1–2 months after previous dose'), dose('ipv', '1–2 months after previous dose'),
      dose('hepb', '1–2 months after previous dose', [3], 'If first dose was at 2 months; may be in a combination vaccine'),
      dose('hib', '1–2 months after previous dose'), dose('pcv', '1–2 months after previous dose'),
      dose('rv', '4–10 weeks after previous dose', [5])
    ] },
    { key: '6_months', short: '6 mo', label: '6 months', months: 6, doses: [
      dose('dtap', '1–2 months after previous dose'), dose('ipv', 'Age 6–18 months; 1–14 months after previous dose'),
      dose('hepb', 'Age 6–18 months; 2–12 months after previous dose and ≥4 months after first dose', [3]),
      dose('hib', '1–2 months after previous dose', [6], 'Not needed if only PedvaxHIB was used at 2 and 4 months'),
      dose('pcv', '1–2 months after previous dose'),
      dose('rv', '4–10 weeks after previous dose', [5], 'Three-dose series if any RotaTeq was given or product is unknown')
    ] },
    { key: '12_months', short: '12 mo', label: '12 months', months: 12, doses: [
      dose('hepa', 'Age 12–23 months', [9]), dose('mmr', 'Age 12–15 months', [9, 10, 11]),
      dose('varicella', 'Age 12–15 months', [11]), dose('hib', 'Age 12–15 months; 2–8 months after previous dose'),
      dose('pcv', 'Age 12–15 months; 8 weeks after previous dose', [12])
    ] },
    { key: '15_months', short: '15 mo', label: '15 months', months: 15, doses: [
      dose('dtap', 'Age 15–18 months; 6–12 months after previous dose', [13])
    ] },
    { key: '18_months', short: '18 mo', label: '18 months', months: 18, doses: [
      dose('hepa', '6–18 months after previous dose')
    ] },
    { key: '4_6_years', short: '4–6 yr', label: '4–6 years', months: 48, end: 83, doses: [
      dose('dtap'), dose('ipv'), dose('mmr', '', [10, 11]), dose('varicella', '', [11])
    ] },
    { key: '11_12_years', short: '11–12 yr', label: '11–12 years', months: 132, end: 155, doses: [
      dose('hpv', 'Two doses; can start at age 9', [14]), dose('menacwy'), dose('tdap')
    ] },
    { key: '16_years', short: '16 yr', label: '16 years', months: 192, end: 203, doses: [
      dose('menacwy'), dose('menb', 'Shared clinical decision-making at age 16–23 years', [15], 'Discuss individual benefits and preferences')
    ] }
  ];
  function toMonths(value, unit) {
    if (value === '' || value === null || typeof value === 'boolean' || !['years', 'months'].includes(unit)) return null;
    const age = Number(value);
    const months = age * (unit === 'years' ? 12 : 1);
    return Number.isSafeInteger(age) && age >= 0 && Number.isSafeInteger(months) ? months : null;
  }
  function lookup(months, includeOngoing = true) {
    if (!Number.isSafeInteger(months) || months < 0) return { valid: false, visit: null, ongoing: [], extra: [] };
    const visit = visits.find(v => months >= v.months && months <= (v.end ?? v.months)) ?? null;
    const ongoing = includeOngoing && months >= 6 ? [dose('covid19', 'From 6 months; see detailed dose guidance', [7]), dose('flu', 'From 6 months; every fall', [8])] : [];
    const extra = [];
    if (months > 0 && months < 8) extra.push(dose('rsv', 'Seasonal; infants younger than 8 months', [2], 'Depends on season and prenatal vaccination'));
    if (months >= 108 && months < 132) extra.push(dose('hpv', 'May start at age 9', [14], 'Optional earlier start before the 11–12-year visit'));
    return { valid: true, visit, ongoing, extra };
  }
  const api = { vaccines, visits, notes, toMonths, lookup, vis };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VaccineSchedule = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
