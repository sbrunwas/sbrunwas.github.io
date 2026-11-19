// Routine U.S. pediatric scheduling, checked against the AAP September 2026 schedule.
// UTC day numbers keep birth dates, calendar-month intervals and visit dates independent of timezone.
(function (root) {
  "use strict";
  const sources = {
    aap: {label: "AAP 2026 schedule · Tables 1–3 and vaccine notes", url: "https://downloads.aap.org/AAP/PDF/AAP-Immunization-Schedule.pdf"},
    flu: {label: "AAP · 2026–27 influenza recommendations", url: "https://doi.org/10.1542/peds.2026-078778"},
    covid: {label: "AAP · 2026–27 COVID-19 recommendations", url: "https://doi.org/10.1542/peds.2026-079045"},
    rsv: {label: "AAP · infant RSV immunization guidance", url: "https://doi.org/10.1542/peds.2026-079047"},
    cdph: {label: "CDPH · California vaccine recommendations", url: "https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/publichealth4all/AB-144-recommendations.aspx"},
    spacing: {label: "CDC · Timing and spacing of immunobiologics", url: "https://www.cdc.gov/vaccines/hcp/imz-best-practices/timing-spacing-immunobiologics.html"},
    hibAid: {label: "CDC · Hib catch-up by age and prior doses", url: "https://www.cdc.gov/vaccines/hcp/imz-schedules/downloads/job-aids/hib-acthib.pdf"},
    pcvAid: {label: "CDC · Pneumococcal conjugate catch-up", url: "https://www.cdc.gov/vaccines/hcp/imz-schedules/downloads/job-aids/pneumococcal.pdf"}
  };
  const vaccines = [
    {id: "hepB", label: "Hepatitis B"},
    {id: "rotavirus", label: "Rotavirus"},
    {id: "dtap", label: "DTaP"},
    {id: "hib", label: "Hib"},
    {id: "pcv", label: "Pneumococcal conjugate (PCV)"},
    {id: "ipv", label: "Polio (IPV)"},
    {id: "mmr", label: "Measles, mumps & rubella (MMR)"},
    {id: "varicella", label: "Varicella"},
    {id: "hepA", label: "Hepatitis A"},
    {id: "tdap", label: "Tdap / Td catch-up"},
    {id: "hpv", label: "HPV"},
    {id: "menACWY", label: "Meningococcal ACWY"},
    {id: "flu", label: "Influenza"},
    {id: "covid", label: "COVID-19"},
    {id: "menB", label: "Meningococcal B"},
    {id: "rsv", label: "RSV immunization"},
    {id: "liveOther", label: "Other live nasal or injected vaccine", historyOnly: true},
    {id: "td", label: "Td (tetanus and diphtheria only)", historyOnly: true}
  ];
  const ids = new Set(vaccines.map(v => v.id));
  const liveIds = new Set(["mmr", "varicella", "liveOther"]);
  const DAY = 86400000;
  function iso(day) { return new Date(day * DAY).toISOString().slice(0, 10); }
  function parseDay(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const day = Date.parse(value + "T00:00:00Z") / DAY;
    return Number.isFinite(day) && iso(day) === value && Number(value.slice(0, 4)) >= 1900 ? day : null;
  }
  function months(day, count) {
    const d = new Date(day * DAY);
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + count + 1, 0));
    end.setUTCDate(Math.min(d.getUTCDate(), end.getUTCDate()));
    return end.getTime() / DAY;
  }
  function timed(earliest, routine, reason) {
    return {earliest, routine: Math.max(earliest, routine), reason};
  }
  function review(reason) { return {status: "review", reason}; }
  function outside(reason) { return {status: "outside", reason}; }
  function complete(reason = "The recorded doses meet the age and spacing rules for this routine series.") {
    return {status: "complete", reason};
  }

  function hepatitisB(c) {
    const {dob, list, n, first, last} = c;
    if (!n) return timed(dob, dob, "Routine vaccination begins at birth. Use monovalent HepB before six weeks. Confirm birth weight and maternal hepatitis B status for the birth-dose pathway.");
    const alternativeAge = (first >= months(dob, 132) && first < months(dob, 192)) || first >= months(dob, 216);
    if (alternativeAge && !list.every(row => row.product === "pediatric")) {
      return review("Confirm the formulation and ages at vaccination. A two-dose Recombivax HB adult-formulation schedule is possible at ages 11–15, and additional formulations are available at age 18. Check the AAP notes for the appropriate series.");
    }
    if (n === 1) return timed(last + 28, first >= months(dob, 6) ? last + 28 : months(first, 1), "The second dose requires four weeks after dose 1.");
    const finalMin = Math.max(dob + 168, first + 112, list[1].day + 56);
    if (n === 3 && list[2].day < finalMin) {
      return timed(finalMin, months(first, 6), "After a birth dose and a combination vaccine, a fourth HepB dose can finish the series. It must be at age 24 weeks or later, at least 16 weeks after dose 1 and eight weeks after dose 2. Check the intervals for any other components.");
    }
    if (n === 2) return timed(finalMin, first >= months(dob, 6) ? finalMin : months(first, 6), "The final dose must satisfy all three limits: age 24 weeks, 16 weeks after dose 1, and eight weeks after dose 2.");
    return complete();
  }
  function rotavirus(c) {
    const {dob, asOf, n, last, list} = c;
    const allRotarix = n > 0 && list.every(row => row.product === "Rotarix");
    const needed = allRotarix ? 2 : 3;
    if (n >= needed) return complete(allRotarix ? "Both recorded doses were Rotarix." : "Three recorded doses meet the schedule for RotaTeq, mixed or unknown products.");
    const limit = n ? months(dob, 8) : dob + 104;
    const earliest = n ? last + 28 : dob + 42;
    if (asOf > limit || earliest > limit) return outside(n
      ? "The last possible date is " + iso(limit) + " (age eight months, zero days). The selected date or the required interval falls outside that window."
      : "The series must start by " + iso(limit) + " (age 14 weeks, six days).");
    return timed(earliest, Math.min(limit, months(dob, [2, 4, 6][n])), (n ? "Allow four weeks between doses. " : "The first dose may be given from six weeks through 14 weeks, six days. ") +
      "The series ends by age eight months, zero days. Two Rotarix doses complete a series; RotaTeq, mixed or unknown products use three.");
  }
  function dtap(c) {
    const {dob, asOf, n, list, last} = c;
    if (n >= 5 || (n === 4 && last >= months(dob, 48) && last >= months(list[2].day, 6))) return complete();
    if (asOf >= months(dob, 84)) return outside("From age seven, use the Tdap/Td pathway for catch-up and adolescent boosting.");
    const usual = months(dob, [2, 4, 6, 15, 48][n]);
    if (!n) return timed(dob + 42, usual, "DTaP can start at six weeks. The routine series starts at two months.");
    if (n < 3) return timed(last + 28, usual, "Doses 2 and 3 each require four weeks after the previous dose.");
    const earliest = Math.max(months(dob, n === 3 ? 12 : 48), months(last, 6));
    if (earliest >= months(dob, 84)) return outside("The next DTaP interval reaches the seventh birthday. Reassess with the Tdap/Td pathway at age seven.");
    return timed(earliest, usual, n === 3
      ? "For prospective scheduling, dose 4 requires age 12 months and six months after dose 3."
      : "The final preschool dose requires age four years and six months after dose 4.");
  }
  function conjugate(c) {
    const {id, dob, asOf, n, first, last, list} = c;
    const hib = id === "hib";
    const firstBirthday = months(dob, 12);
    const soloAge = months(dob, hib ? 15 : 24);
    const ageLimit = months(dob, 60);
    if (n && (last >= soloAge || (n >= 2 && first >= firstBirthday) || (n >= 3 && last >= firstBirthday))) return complete();
    if (asOf >= ageLimit) return outside("Routine catch-up for healthy children ends at the fifth birthday. Medical risk factors can change the recommendation.");
    if (!n) return timed(dob + 42, months(dob, 2), "The first dose may be given at six weeks. The number of doses depends on age at vaccination.");
    if (n === 1) {
      const gap = first >= firstBirthday ? 56 : 28;
      return timed(last + gap, first >= firstBirthday ? last + gap : months(dob, 4),
        "The next dose requires " + (gap === 56 ? "eight" : "four") + " weeks after the first dose. Age at administration determines whether another dose follows.");
    }
    const twoPedvax = hib && n === 2 && list.every(d => d.product === "PedvaxHIB");
    const infantPrimary = n === 2 && asOf < firstBirthday && !twoPedvax &&
      (hib ? first : last) < months(dob, 7) && last + 28 < firstBirthday;
    if (infantPrimary) return timed(last + 28, months(dob, 6), hib
      ? "With an early start and a mixed, non-PedvaxHIB or unknown series, an infant primary dose can follow after four weeks."
      : "An infant primary dose can follow four weeks after dose 2 when dose 2 was given before seven months.");
    return timed(Math.max(firstBirthday, last + 56), Math.max(firstBirthday, last + 56),
      "The final dose requires age 12 months and at least eight weeks after the preceding dose." +
      (hib ? " Use an appropriate Hib booster product." : ""));
  }
  function polio(c) {
    const {dob, asOf, n, last, list} = c;
    if (n >= 3 && last >= months(dob, 48) && last >= months(list[n - 2].day, 6)) return complete();
    if (!n) return timed(dob + 42, months(dob, 2), "For an IPV series, the minimum starting age is six weeks.");
    if (n === 1 || (n === 2 && asOf < months(dob, 48) && last + 28 < months(dob, 48))) {
      return timed(last + 28, months(dob, n === 1 ? 4 : 6), "Allow at least four weeks between early primary doses. The final dose has a longer interval.");
    }
    const earliest = Math.max(months(dob, 48), months(last, 6));
    return timed(earliest, earliest, "The final IPV dose requires age four years and six calendar months after the preceding dose. Three doses can suffice when dose 3 meets both limits.");
  }
  function mmrOrVaricella(c) {
    const {id, dob, n, last} = c;
    if (n >= 2) return complete();
    if (!n) return timed(months(dob, 12), months(dob, 12), id === "mmr"
      ? "The routine MMR series starts at 12 months. An extra early dose at 6–11 months may be indicated for international travel or an outbreak; confirm with the clinician or public health."
      : "Varicella vaccination begins at age 12 months for children without evidence of immunity.");
    if (id === "mmr") return timed(last + 28, months(dob, 48),
      "Separate MMR doses require four weeks. The usual second dose is at 4–6 years. A second combined MMRV has a three-month minimum interval and is licensed through age 12.");
    const teen = months(dob, 13 * 12);
    const earliest = Math.min(months(last, 3), Math.max(teen, last + 28));
    return timed(earliest, months(dob, 48), "Plan single-antigen varicella doses three months apart before age 13, or at least four weeks apart from age 13. The usual childhood second dose is at 4–6 years.");
  }
  function hepatitisA(c) {
    const {dob, n, last} = c;
    if (n >= 2) return complete();
    return n ? timed(months(last, 6), months(last, 6), "Dose 2 needs six calendar months after dose 1.")
      : timed(months(dob, 12), months(dob, 12), "Routine HepA begins at 12 months. A travel dose given at 6–11 months is outside the routine series.");
  }
  function hpv(c) {
    const {dob, first, last, n, list} = c;
    if (!n) return timed(months(dob, 108), months(dob, 108), "AAP recommends starting HPV vaccination between ages nine and twelve.");
    const earlyStart = first < months(dob, 180);
    const final2 = months(first, 5);
    if (earlyStart && n >= 2 && list[1].day >= final2 || n >= 3) return complete();
    if (n === 1 && earlyStart) return timed(final2, months(first, 6), "Starting before age 15 usually means two doses, ideally 6–12 months apart, with a five-month minimum.");
    if (n === 1) return timed(last + 28, first >= months(dob, 6) ? last + 28 : months(first, 1), "Starting at 15 or older requires three doses. Allow four weeks between the first two.");
    return timed(Math.max(last + 84, final2), months(first, 6), "The third dose requires 12 weeks after dose 2 and five months after dose 1.");
  }
  function menACWY(c) {
    const {dob, first, last, n} = c;
    if (!n) return timed(months(dob, 132), months(dob, 132), "The routine adolescent series starts at 11–12 years. Younger children with specific travel, outbreak or medical risks use a different schedule.");
    if (first >= months(dob, 192) || n >= 2) return complete("The adolescent dose at age 16 or later is documented for this routine-risk schedule.");
    const earliest = Math.max(months(dob, 192), last + 56);
    return timed(earliest, earliest, "An adolescent vaccinated before age 16 needs a booster at 16–18, at least eight weeks after the first dose.");
  }
  function tetanus(c) {
    const {dob, asOf, list, all, childhoodDTaP} = c;
    const age7 = months(dob, 84), age11 = months(dob, 132);
    if (list.some(row => row.day < age7)) return review("A Td or Tdap dose was recorded before age seven. Verify the product and indication.");
    if (asOf < age7) return outside("Before age seven, use the DTaP schedule. Routine adolescent Tdap is given at 11–12 years.");
    if (childhoodDTaP === "review") return review("A childhood DTaP dose needs verification. Reconcile its timing before combining it with the Td/Tdap record.");
    const childSeries = all.filter(row => row.vaccine === "dtap" && row.day <= asOf);
    const hasTdap = list.some(row => row.vaccine === "tdap");
    const adolescentTdap = list.some(row => row.vaccine === "tdap" && row.day >= months(dob, 120));
    const combined = childSeries.concat(list).sort((a,b) => a.day - b.day);
    const count = combined.length;
    const infantStart = count > 0 && combined[0].day < months(dob, 12);
    const target = infantStart ? 4 : 3;
    const last = count ? combined[count - 1].day : null;
    const primaryDone = childhoodDTaP === "complete" ||
      combined.some((row, index) => index >= target - 1 && row.day >= months(combined[index - 1].day, 6));
    if (primaryDone) {
      if (adolescentTdap) return complete("The primary series and an adolescent Tdap dose are recorded. Pregnancy, wound care and adult boosters have separate guidance.");
      if (childhoodDTaP === "complete" || hasTdap) return {...timed(age11, age11,
        "An adolescent Tdap booster is due at 11–12 years. A Tdap at ages 7–9 does not replace that booster."), adolescentBooster:true};
      return timed(age7, age7, "The childhood record does not meet the complete DTaP criteria. Give a catch-up Tdap from age seven. If given at ages 7–9, an adolescent Tdap at 11–12 is still needed.");
    }
    if (!count) return timed(age7, age7, "For a child age seven or older with no prior tetanus-containing doses, start catch-up with Tdap. Follow with Td or Tdap.");
    const short = count === 1 || (count === 2 && infantStart);
    const next = Math.max(age7, short ? last + 28 : months(last, 6));
    const product = hasTdap ? "Td or Tdap" : "Tdap";
    return timed(next, next, "Use " + product + " for this catch-up dose. The combined DTaP/Tdap/Td history requires " +
      (short ? "four weeks" : "six calendar months") + " after the previous dose. " +
      (infantStart ? "The series began before the first birthday." : "The series began at age 12 months or later."));
  }
  function manual(c) {
    const {dob, asOf, id} = c;
    if (id === "flu" || id === "covid") {
      if (asOf < months(dob, 6)) return timed(months(dob, 6), months(dob, 6), "The minimum age is six months. At that age, check the season, formulation and vaccination history.");
      return review(id === "flu" ? "Annual influenza vaccination starts at six months. Children under nine may need two doses at least four weeks apart. Check the seasonal cutoff, past doses and product, including live nasal vaccine."
        : "Check the current seasonal formulation, age, prior product and doses, immune status, and timing of recent infection in the AAP COVID-19 schedule.");
    }
    if (id === "menB") return asOf < months(dob, 192)
      ? outside("For healthy adolescents, shared decision-making usually begins at 16. Medical or outbreak risk can warrant earlier vaccination.")
      : review("At ages 16–18, discuss MenB protection. Prior brand, schedule and time until protection is needed determine the remaining doses.");
    if (asOf >= months(dob, 20)) return outside("Routine infant and second-season RSV antibody pathways end after age 19 months. Pregnancy uses a separate vaccine pathway.");
    if (asOf >= months(dob, 8)) return outside("Second-season RSV antibody is reserved for children ages 8–19 months with qualifying risks. Select the clinical-factor pathway if any may apply.");
    return review("Infant RSV antibody eligibility depends on age at season entry, maternal vaccination and its timing, local season, and risk in a second season. Pregnancy uses a separate RSV vaccine pathway.");
  }
  const rules = {hepB:hepatitisB, rotavirus, dtap, hib:conjugate, pcv:conjugate, ipv:polio, mmr:mmrOrVaricella,
    varicella:mmrOrVaricella, hepA:hepatitisA, hpv, menACWY, tdap:tetanus, flu:manual, covid:manual, menB:manual, rsv:manual};
  const clinicalReviewOnly = new Set(["flu", "covid", "menB", "rsv"]);

  function liveSpacing(c, rule) {
    if (!liveIds.has(c.id) || rule.earliest == null) return rule;
    let earliest = rule.earliest;
    // A same-day opportunity is available only if the target dose itself can be given on that day.
    // Earlier live doses still count as exposures even when validity is under review.
    const other = c.all.filter(row => liveIds.has(row.vaccine) && row.vaccine !== c.id && row.day <= c.asOf);
    let constrained = null;
    for (const row of other) {
      if (row.day === c.asOf && earliest <= c.asOf) continue;
      if (row.day + 28 > earliest) {
        earliest = row.day + 28;
        constrained = row;
      }
    }
    let reason = rule.reason;
    if (constrained) reason += " A different live injected or nasal vaccine was recorded on " + iso(constrained.day) +
      ". If given on separate days, allow 28 full days between live vaccines.";
    else if (other.some(row => row.day === c.asOf)) reason += " The other live vaccine is recorded on this same visit date. If these are given on different days, separate them by 28 days.";
    return timed(earliest, Math.max(earliest, rule.routine), reason);
  }

  function priorIssue(c, row) {
    const {id, dob, n, last} = c;
    // Review any early historical dose unless a specific retrospective rule below accepts it.
    // This avoids using a grace period prospectively or automatically ordering a repeat.
    if (clinicalReviewOnly.has(id)) return null;
    const atDose = {...c, asOf: row.day};
    const rule = liveSpacing(atDose, rules[id](atDose));
    if (id === "tdap") {
      if (row.day < months(dob, 84)) return "A Td or Tdap dose was recorded before age seven. Verify the product, age and indication.";
      // After a primary series, medically indicated Td/Tdap doses can occur before the usual adolescent booster.
      if (rule.adolescentBooster || rule.status === "complete") return null;
    }
    if (id === "hepB" && rule.status === "review") return rule.reason;
    if (rule.status === "complete") return null; // additional documented doses do not undo a completed series
    const conflict = liveIds.has(id) && c.all.some(d => liveIds.has(d.vaccine) && d.vaccine !== id && d.day < row.day && row.day - d.day < 28);
    if (conflict) return "A different live injected or nasal vaccine was recorded fewer than 28 days before the dose on " + iso(row.day) + ". The later dose needs review for repeat timing; the four-day grace period does not apply between different live vaccines.";
    if (id === "rotavirus" && row.day > (n ? months(dob, 8) : dob + 104)) return "A recorded rotavirus dose falls after the upper age limit. Check the prior administration and remaining window.";
    if ((id === "mmr" || id === "hepA") && !n && row.day < months(dob, 12)) return "A dose is recorded before the first birthday. An early travel or outbreak dose may be extra. Review the date and any applicable grace period before counting routine doses.";
    if (id === "dtap" && row.day >= months(dob, 84)) return "DTaP was recorded at age seven or older. Review the age-specific Tdap catch-up and booster rules.";
    if (id === "hepB" && n === 2 && c.first <= dob + 1 && ["pediarix", "vaxelis"].includes(row.product) &&
        row.day >= dob + 42 && row.day >= last + 28 && row.day < rule.earliest - 4) return null;
    if (id === "varicella" && n === 1 && row.day >= last + 28) return null;
    if (id === "dtap" && n === 3 && row.day >= months(dob, 12) && row.day >= months(last, 4)) return null;
    if (id === "hpv" && n === 1 && row.day >= last + 28) {
      if (c.first < months(dob, 180) && row.day < months(last, 5) && row.day >= months(last, 5) - 4)
        return "The second HPV dose falls within four days of the five-month threshold. Review retrospective grace-period validity before scheduling a third dose.";
      return null;
    }
    if (id === "ipv" && n === 2 && row.day >= last + 28) return null;
    if (id === "ipv" && n >= 3 && row.day < months(dob, 48) && row.day >= last + 28) return null;
    if (rule.earliest == null || row.day < rule.earliest) return "The recorded dose on " + iso(row.day) +
      " needs a clinician to check its age, interval or indication" + (rule.earliest == null ? ". " : " (standard threshold " + iso(rule.earliest) + "). ") +
      rule.reason + " Confirm any retrospective exception before counting or repeating it.";
    return null;
  }
  function resultFor(v, dob, asOf, all, flagged, childhoodDTaP) {
    const rows = all.filter(row => row.vaccine === v.id || v.id === "tdap" && row.vaccine === "td");
    const sources = ["aap"];
    if (liveIds.has(v.id)) sources.push("spacing");
    if (["flu","covid","rsv"].includes(v.id)) sources.push(v.id);
    if (v.id === "menB") sources.push("cdph");
    if (v.id === "hib") sources.push("hibAid");
    if (v.id === "pcv") sources.push("pcvAid");
    const recorded = v.id === "tdap" ? rows.length + all.filter(row => row.vaccine === "dtap").length : rows.length;
    const base = {id:v.id, label:v.label, doses:recorded, earliest:null, routine:null, sources, nextSteps:[]};
    const c = {id:v.id, dob, asOf, all, childhoodDTaP, list:[], n:0, first:null, last:null};
    let rule;
    if (flagged) rule = review("The selected clinical or record circumstance can change dose validity, timing or product choice. Check the specific indication in the AAP notes and contraindications table.");
    else {
      for (const row of rows) {
        const issue = priorIssue(c, row);
        if (issue) { rule = review(issue); break; }
        c.list.push(row);
        c.n++;
        c.first = c.list[0].day;
        c.last = row.day;
      }
      if (!rule) rule = liveSpacing(c, rules[v.id](c));
      if (v.id === "dtap" && rule.earliest >= months(dob, 84)) {
        rule = outside("The required DTaP interval reaches the seventh birthday. Reassess with the Tdap/Td catch-up pathway.");
      }
      if ((v.id === "hib" || v.id === "pcv") && rule.earliest >= months(dob, 60)) {
        rule = outside("The next interval extends beyond the routine catch-up window ending at age five. Risk-based indications need clinician review.");
      }
    }
    const status = rule.status || (asOf < rule.earliest ? "wait" : "eligible");
    const titles = {eligible: asOf < rule.routine ? "Minimum met · before routine timing" : "Timing met", wait:"Wait until the minimum date",
      complete:"Routine series complete", outside:"Outside routine pathway", review:"Clinician review"};
    return {...base, status, title:titles[status], reason:rule.reason,
      earliest:rule.earliest == null ? null : iso(rule.earliest), routine:rule.routine == null ? null : iso(rule.routine)};
  }
  function evaluate(input) {
    if (!input || typeof input !== "object") return {error:"Enter a date of birth and a visit date.", results:[]};
    const {history = [], reviewFlags = []} = input;
    const dob = parseDay(input.dob), asOf = parseDay(input.asOf);
    if (dob == null || asOf == null || dob > asOf) return {error:"Use valid calendar dates. The visit must be on or after birth.", results:[]};
    if (asOf >= months(dob, 228)) return {error:"This pediatric planner covers birth through age 18. Use adult guidance from the 19th birthday.", results:[]};
    if (!Array.isArray(history) || !Array.isArray(reviewFlags)) return {error:"Check the dose history and clinical circumstances.", results:[]};
    const seen = new Set(), all = [];
    for (const row of history) {
      const day = parseDay(row?.date);
      if (!row || !ids.has(row.vaccine) || day == null || day < dob || day > asOf) return {error:"Every recorded dose needs a recognized vaccine and a date between birth and the selected visit.", results:[]};
      // DTaP, Tdap and Td share tetanus and diphtheria components.
      const antigen = ["tdap","td","dtap"].includes(row.vaccine) ? "tetanus" : row.vaccine;
      const key = antigen + "/" + row.date;
      if (seen.has(key)) return {error:"A vaccine component appears twice on the same date. Keep one entry per component per date.", results:[]};
      seen.add(key);
      all.push({...row, day});
    }
    all.sort((a,b) => a.day - b.day);
    const results = [];
    let childhoodDTaP;
    for (const v of vaccines.filter(v => !v.historyOnly)) {
      const result = resultFor(v, dob, asOf, all, reviewFlags.length > 0, childhoodDTaP);
      if (v.id === "dtap") childhoodDTaP = result.status;
      results.push(result);
    }
    return {results};
  }
  const api = {vaccines, sources, evaluate};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.VaccinePlannerRules = api;
})(typeof window === "undefined" ? null : window);
