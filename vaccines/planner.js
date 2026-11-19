(function () {
  'use strict';
  const { vaccines, sources, evaluate } = window.VaccinePlannerRules;
  const {canProject, project} = window.VaccineForecast;
  const get = id => document.getElementById(id);
  const form = get('planner-form');
  const historyRows = get('history-rows');
  const list = get('plan-results');
  const series = get('series-choice');
  const contexts = {
    travel: 'Travel or an outbreak can change the starting age. For example, an infant age 6–11 months traveling internationally may need an early MMR dose and two routine doses after the first birthday. Review the destination and departure date with the clinician.',
    blood: 'Immune globulin and antibody-containing blood products can interfere with the response to MMR and varicella. The interval depends on the exact product, dose, and dates. Check the antibody-product timing table.',
    perinatal: 'For a newborn with positive or unknown maternal hepatitis B status, contact the birth team promptly. Prophylaxis is time-sensitive. Maternal test results and birth weight determine the vaccine, immune globulin, and follow-up pathway.',
    immune: 'Immunocompromise, pregnancy, and some chronic conditions can change which products are appropriate. Live vaccines and some dose counts require an individual assessment.',
    reaction: 'Identify the vaccine, component, and reaction before giving another dose. Prior intussusception changes eligibility for rotavirus vaccine.',
    other: 'Use the vaccine-specific notes to evaluate illness, prior disease or immunity, foreign records, nonstandard products, or other clinical factors.'
  };
  const evidenceIds = { hepA: 'hepa', hepB: 'hepb', rotavirus: 'rv', covid: 'covid19', menACWY: 'menacwy', menB: 'menb' };
  const combinations = {
    mmrv: { label: 'MMRV (ProQuad)', ids: ['mmr', 'varicella'] },
    pediarix: { label: 'Pediarix (DTaP, HepB, IPV)', ids: ['dtap', 'hepB', 'ipv'] },
    pentacel: { label: 'Pentacel (DTaP, IPV, Hib)', ids: ['dtap', 'ipv', 'hib'] },
    vaxelis: { label: 'Vaxelis (DTaP, IPV, Hib, HepB)', ids: ['dtap', 'ipv', 'hib', 'hepB'] },
    quadracel: { label: 'Kinrix or Quadracel (DTaP, IPV)', ids: ['dtap', 'ipv'] },
    laiv: { label: 'FluMist (intranasal live influenza)', ids: ['flu', 'liveOther'] }
  };
  const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  function localToday() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth()+1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }
  const parseDate = day => new Date(day + 'T00:00:00Z');
  const pretty = day => dateFormat.format(parseDate(day));
  function ageAtVisit(dob, visit) {
    const birth = parseDate(dob), date = parseDate(visit);
    const days = (date - birth) / 86400000;
    if (days < 42) return days + (days === 1 ? ' day old' : ' days old');
    if (days < 112) return Math.floor(days / 7) + ' weeks, ' + days % 7 + ' days old';
    let months = (date.getUTCFullYear() - birth.getUTCFullYear()) * 12 + date.getUTCMonth() - birth.getUTCMonth();
    const last = new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth() + 1,0)).getUTCDate();
    if (date.getUTCDate() < Math.min(birth.getUTCDate(),last)) months--;
    if (months < 24) return months + ' months old';
    const rest = months % 12;
    return Math.floor(months / 12) + ' years' + (rest ? ', ' + rest + (rest === 1 ? ' month' : ' months') : '') + ' old';
  }
  function el(tag, text, cls) {
    const item = document.createElement(tag);
    if (text) item.textContent = text;
    if (cls) item.className = cls;
    return item;
  }
  function addOptions(select, options) {
    for (const [value, label] of options) select.append(new Option(label, value));
  }
  function sourceLink(text, url) {
    const a = el('a', text);
    a.href = url;
    return a;
  }
  function field(title, control) {
    const label = el('label', '', 'field');
    label.append(el('span', title), control);
    return label;
  }
  let current = null;
  function invalidate() {
    if (current) {
      current = null;
      list.hidden = true;
      get('timing-overview').replaceChildren();
      get('plan-advisories').replaceChildren();
      get('plan-subtitle').textContent = '';
      get('visit-timeline').replaceChildren();
      get('visit-options').replaceChildren();
      get('series-detail').replaceChildren();
    }
    get('planner-error').textContent = '';
  }
  function addRow(id = '', date = '') {
    const row = el('div', '', 'history-row');
    const select = el('select');
    select.className = 'vaccine-entry';
    select.required = true;
    select.append(new Option('Select immunization', ''));
    const singles = el('optgroup');
    singles.label = 'Single immunizations';
    addOptions(singles, vaccines.map(v => [v.id, v.id === 'tdap' ? 'Tdap (includes pertussis)' : v.id === 'flu' ? 'Influenza (injected)' : v.id === 'liveOther' ? 'Other injectable or nasal live vaccine' : v.label]));
    const combos = el('optgroup');
    combos.label = 'Documented combination products and nasal flu';
    addOptions(combos, Object.entries(combinations).map(([key, value]) => [key, value.label]));
    select.append(singles, combos);
    select.value = id;
    const given = el('input');
    given.type = 'date';
    given.required = true;
    given.className = 'dose-date';
    given.max = localToday();
    given.value = date;
    const product = el('select');
    product.className = 'product-entry';
    const productField = field('Product on record', product);
    function setProducts() {
      product.replaceChildren();
      productField.hidden = !['hib','rotavirus','hepB'].includes(select.value);
      if (!productField.hidden) {
        addOptions(product, select.value === 'hepB' ? [['unknown','Unknown or another formulation'],['pediatric','Standard pediatric formulation']] : select.value === 'hib' ? [['unknown', 'Other or unknown Hib'], ['PedvaxHIB', 'PedvaxHIB']] :
          [['unknown','Unknown rotavirus product'], ['Rotarix','Rotarix (RV1)'], ['RotaTeq','RotaTeq (RV5)']]);
      }
    }
    setProducts();
    select.addEventListener('change', setProducts);
    const remove = el('button', 'Remove', 'quiet');
    remove.type = 'button';
    remove.setAttribute('aria-label', 'Remove this recorded dose');
    remove.addEventListener('click', () => { row.remove(); invalidate(); get('add-row').focus(); });
    row.append(field('Immunization', select), field('Date given', given), productField, remove);
    historyRows.append(row);
    return select;
  }
  function setAgeMode() {
    const days = get('age-mode').value === 'days';
    get('dob-field').hidden = days;
    get('days-field').hidden = !days;
    get('dob').disabled = days;
    get('age-days').disabled = !days;
    get('age-days').required = days;
  }
  function showEditor() {
    const show = get('record-type').value === 'known';
    get('history-editor').hidden = !show;
    if (show && !historyRows.children.length) addRow();
    for (const item of historyRows.querySelectorAll('input,select')) item.disabled = !show;
  }
  function reset() {
    form.reset();
    invalidate();
    historyRows.replaceChildren();
    get('visit-date').value = localToday();
    get('dob').max = localToday();
    get('clinical-factors').hidden = true;
    setAgeMode();
    showEditor();
  }
  function readPatient() {
    const asOf = get('visit-date').value;
    let dob = get('dob').value;
    if (get('age-mode').value === 'days') {
      const days = get('age-days').valueAsNumber;
      if (!Number.isInteger(days) || days < 0 || days > 6940) throw Error('Enter a whole number of days for a child under 19.');
      dob = new Date(parseDate(asOf).getTime() - days * 86400000).toISOString().slice(0, 10);
    }
    if (dob > localToday()) throw Error('Enter a birth date on or before today.');
    const history = [];
    const reviewFlags = [];
    if (get('clinical-status').value !== 'routine') {
      reviewFlags.push('Special clinical circumstances or uncertain eligibility');
      for (const box of get('clinical-factors').querySelectorAll('input:checked')) reviewFlags.push(box.value);
    }
    if (get('record-type').value === 'unknown') reviewFlags.push('Missing or uncertain records');
    if (get('record-type').value === 'known') {
      if (!historyRows.children.length) throw Error('Add at least one dated dose, or choose “Confirmed, no prior doses.”');
      for (const row of historyRows.children) {
        const id = row.querySelector('.vaccine-entry').value;
        const date = row.querySelector('.dose-date').value;
        const product = row.querySelector('.product-entry').value;
        if (!id || !date) throw Error('Choose an immunization and date for each record.');
        if (date > localToday()) throw Error('Recorded doses must already have been given. Check a future appointment using the visit date.');
        for (const vaccine of (combinations[id]?.ids || [id])) {
          history.push({ vaccine, date, product: combinations[id] ? id : (product || 'unknown') });
        }
        if (id === 'mmrv') {
          const d = parseDate(dob);
          d.setUTCFullYear(d.getUTCFullYear() + 13);
          if (parseDate(date) >= d) reviewFlags.push('MMRV outside licensed age');
        }
      }
    }
    return { dob, asOf, history, reviewFlags };
  }
  const groups = [
    ['ready','Routine or catch-up timing met'],
    ['early','Minimum met before usual timing'],
    ['wait','Too early on this date'],
    ['review','Clinician review'],
    ['complete','Series complete'],
    ['outside','Outside routine age or indication']
  ];
  function groupOf(item, asOf) {
    if (item.status === 'eligible') return item.routine && asOf < item.routine ? 'early' : 'ready';
    return item.status;
  }
  function showOverview() {
    const wrap = get('timing-overview');
    wrap.replaceChildren();
    for (const [key,title] of groups) {
      const items = current.results.filter(v => groupOf(v, current.patient.asOf) === key);
      if (!items.length) continue;
      const group = el('section','', 'status-group state-' + key);
      group.append(el('h3', title + ' (' + items.length + ')'));
      const links = el('div','','status-items');
      for (const item of items) {
        const button = el('button',item.label);
        button.type = 'button';
        if (key === 'wait' && item.earliest) button.append(el('span', pretty(item.earliest)));
        button.addEventListener('click', () => {
          series.value = item.id;
          showDetail();
          series.focus({preventScroll:true});
          series.scrollIntoView({block:'center'});
        });
        links.append(button);
      }
      group.append(links);
      wrap.append(group);
    }
  }
  function visitTimeline() {
    const out = get('visit-timeline');
    out.replaceChildren();
    const selected = new Set([...get('visit-options').querySelectorAll('input:checked')].map(box => box.value));
    if (!selected.size) {
      out.append(el('p','Choose at least one series to see possible visit dates.','field-help'));
      return;
    }
    const patient = current.patient;
    const strategy = get('visit-strategy').value;
    const lastDate = parseDate(patient.asOf);
    lastDate.setUTCFullYear(lastDate.getUTCFullYear() + 1);
    const visits = project(patient,selected,strategy,lastDate.toISOString().slice(0,10));
    const ol = el('ol','','visit-dates');
    for (const visit of visits) {
      const li = el('li');
      li.append(el('strong',pretty(visit.date)),el('span',visit.doses.map(v => v.label + ' (dose ' + v.number + ')').join(' · ')));
      ol.append(li);
    }
    if (ol.children.length) out.append(ol);
    else out.append(el('p','No projectable dose for the selected series falls within this one-year window. See the individual series for its reason or next date.','field-help'));
  }
  function setUpVisitBuilder() {
    const options = get('visit-options');
    const builder = get('visit-builder');
    options.replaceChildren();
    const supported = current.results.filter(canProject);
    builder.hidden = !supported.length;
    builder.open = false;
    get('visit-strategy').value = 'usual';
    for (const item of supported) {
      const label = el('label');
      const box = el('input');
      box.type = 'checkbox';
      box.value = item.id;
      box.checked = groupOf(item,current.patient.asOf) === 'ready';
      label.append(box,document.createTextNode(item.label));
      options.append(label);
    }
    if (supported.length) visitTimeline();
  }
  function showTimeline(item, strategy, wrap) {
    const rows = project(current.patient,[item.id],strategy);
    wrap.replaceChildren();
    if (!rows.length) {
      wrap.append(el('p','No additional dates can be projected for this series with the information entered.','field-help'));
      return;
    }
    const ol = el('ol','','timeline');
    for (const row of rows) {
      const entry = el('li');
      entry.append(el('strong', pretty(row.date)), el('span', 'Dose ' + row.doses[0].number));
      ol.append(entry);
    }
    wrap.append(ol,el('p','Each date assumes the preceding dose is given as shown. This projection considers one series at a time. Recheck after another live vaccine, a product change, or a missed visit.','field-help'));
    if (item.id === 'hepB') wrap.append(el('p','Projected doses assume the standard three-dose pediatric HepB formulation. Check the actual product before scheduling.','field-help'));
    if (item.id === 'rotavirus' || item.id === 'hib') wrap.append(el('p','Future products are treated as unknown. A documented product can change how many doses are needed.','field-help'));
    if (['mmr','varicella'].includes(item.id)) wrap.append(el('p','The dates assume separate MMR and varicella products. Check the combination MMRV product’s own age and spacing rules.','field-help'));
  }
  function showDetail() {
    const item = current.results.find(v => v.id === series.value);
    const box = get('series-detail');
    box.replaceChildren();
    if (!item) return;
    box.append(el('h3',item.title,'detail-title'),el('p',item.reason));
    const dates = el('dl','','date-pair');
    for (const [label,value] of [['Minimum date',item.earliest],['Usual timing starts',item.routine]]) {
      if (value) {
        const pair = el('div');
        pair.append(el('dt',label),el('dd',pretty(value)));
        dates.append(pair);
      }
    }
    if (dates.children.length) box.append(dates);
    for (const text of item.nextSteps || []) box.append(el('p',text,'field-help'));
    if (canProject(item)) {
      const proj = el('section','','forecast');
      proj.append(el('h4','Possible dates for this series'));
      const select = el('select');
      addOptions(select, [['usual','Usual timing or catch-up if behind'],['minimum','Earliest permitted timing']]);
      proj.append(field('Timing to illustrate',select));
      const timeline = el('div');
      select.addEventListener('change', () => showTimeline(item,select.value,timeline));
      showTimeline(item,select.value,timeline);
      proj.append(timeline);
      box.append(proj);
    }
    const links = el('div','','source-links');
    for (const key of item.sources || []) if (sources[key]) links.append(sourceLink(sources[key].label + ' ↗',sources[key].url));
    links.append(sourceLink('Benefits, side effects & studies →','evidence.html#' + (evidenceIds[item.id] || item.id)));
    box.append(links);
  }
  function calculate(event) {
    if (event) event.preventDefault();
    invalidate();
    if (!form.reportValidity()) return;
    try {
      const patient = readPatient();
      const {error, results} = evaluate(patient);
      if (error || !results?.length) throw Error(error || 'Check the dates and vaccine record.');
      current = { patient, results };
      series.replaceChildren();
      addOptions(series,results.map(v => [v.id,v.label]));
      series.value = results.find(v => v.status === 'eligible')?.id || results[0].id;
      const advisories = get('plan-advisories');
      advisories.replaceChildren();
      if (patient.reviewFlags.length) {
        const box = el('aside','','message');
        box.append(el('h3','What needs to be checked'));
        if (get('record-type').value === 'unknown') box.append(el('p','Ask for the written record or check the immunization registry. If records cannot be located, use the AAP age-appropriate catch-up pathway with the clinician. A long gap between valid doses usually does not require restarting a series.'));
        for (const key of patient.reviewFlags) if (contexts[key]) box.append(el('p',contexts[key]));
        if (box.children.length === 1) box.append(el('p','Review the clinical circumstances and source record against the AAP notes before choosing dates.'));
        box.append(sourceLink('AAP schedule and clinical notes ↗','https://downloads.aap.org/AAP/PDF/AAP-Immunization-Schedule.pdf'));
        if (patient.reviewFlags.includes('blood')) box.append(el('br'),sourceLink('Antibody product intervals, Table 3-6 ↗',sources.spacing.url));
        advisories.append(box);
      }
      get('plan-subtitle').textContent = pretty(patient.asOf) + ' · ' + ageAtVisit(patient.dob,patient.asOf) + ' · ' + (get('record-type').value === 'unknown' ? 'Incomplete record' : patient.history.length + ' recorded antigen ' + (patient.history.length === 1 ? 'dose' : 'doses'));
      list.hidden = false;
      showOverview();
      setUpVisitBuilder();
      showDetail();
      get('plan-title').focus();
    } catch (err) {
      invalidate();
      get('planner-error').textContent = err.message;
    }
  }
  get('add-row').addEventListener('click', () => { invalidate(); addRow().focus(); });
  get('record-type').addEventListener('change',showEditor);
  get('clinical-status').addEventListener('change',() => { get('clinical-factors').hidden = get('clinical-status').value !== 'special'; });
  get('age-mode').addEventListener('change',setAgeMode);
  get('visit-options').addEventListener('change',visitTimeline);
  get('visit-strategy').addEventListener('change',visitTimeline);
  series.addEventListener('change',showDetail);
  form.addEventListener('input',invalidate);
  form.addEventListener('change',invalidate);
  form.addEventListener('submit',calculate);
  get('start-over').addEventListener('click',() => { reset(); get('age-mode').focus(); });
  get('load-example').addEventListener('click',() => {
    reset();
    get('dob').value = '2023-05-10';
    get('visit-date').value = '2024-05-24';
    get('clinical-status').value = 'routine';
    get('record-type').value = 'known';
    get('history-editor').hidden = false;
    addRow('mmr','2024-05-10');
    calculate();
    if (current) { series.value='varicella'; showDetail(); }
  });
  window.addEventListener('pageshow', e => { if (e.persisted) reset(); });
  reset();
})();
