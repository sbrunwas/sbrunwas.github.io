/* Population studies and their published values. No patient data are read by this view. */
(() => {
  'use strict';

  const catalog = window.VaccineSchedule.vaccines;
  const { studies, outcomes } = window.VaccineImpactData;

  function studyIds(vaccineId) {
    return outcomes[vaccineId] || [vaccineId];
  }

  function selectionFromHash() {
    const fragment = location.hash.slice(1);
    const graphLink = fragment.startsWith('impact-');
    const [requestedVaccine, requestedStudy] = (graphLink ? fragment.slice(7) : fragment).split('/');
    const vaccineId = Object.hasOwn(catalog, requestedVaccine) ? requestedVaccine : 'hepb';
    const options = studyIds(vaccineId);
    const studyId = options.includes(requestedStudy) ? requestedStudy : options[0];
    return { vaccineId, studyId, graphLink };
  }

  window.VaccineImpactSelection = selectionFromHash;

  function element(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  const root = document.getElementById('vaccine-impact');
  if (!root) return;

  const header = element('div', 'impact-header');
  const heading = element('h2', 'impact-heading', 'Vaccine impact in numbers');
  const controls = element('div', 'impact-controls');
  const vaccineField = element('label', 'impact-choice', 'Immunization');
  const vaccinePicker = element('select');
  vaccinePicker.id = 'impact-vaccine';
  for (const [id, {code, name}] of Object.entries(catalog)) {
    vaccinePicker.append(new Option(code === name ? name : code + ' · ' + name, id));
  }
  vaccineField.append(vaccinePicker);
  const outcomeField = element('label', 'impact-choice', 'Disease or outcome');
  const outcomePicker = element('select');
  outcomePicker.id = 'impact-outcome';
  outcomeField.append(outcomePicker);
  controls.append(vaccineField, outcomeField);
  header.append(heading, controls);
  root.tabIndex = -1;

  const panel = element('article', 'impact-panel');
  const announcement = element('div', 'impact-sr-only');
  announcement.setAttribute('role', 'status');
  root.append(header, panel, announcement);

  function showStudy(study) {
    const region = element('p', 'impact-population', study.population + ' · ' + study.design);
    const title = element('h3', 'impact-title', study.title);
    const finding = element('p', 'impact-finding', study.finding);

    // A single semantic table doubles as the chart and the exact data display.
    const table = element('table', 'impact-plot');
    table.append(element('caption', '', study.measure));
    const body = element('tbody');
    study.rows.forEach(([label, value]) => {
      const row = element('tr');
      const period = element('th', 'impact-period', label);
      period.scope = 'row';
      const visual = element('td', 'impact-visual');
      visual.setAttribute('aria-hidden', 'true');
      const track = element('div', 'impact-track');
      const fill = element('div', 'impact-bar');
      fill.style.width = (value / study.max * 100) + '%';
      track.append(fill);
      visual.append(track);
      const exact = element('td', 'impact-value', value.toLocaleString('en-US') + (study.suffix || ''));
      row.append(period, visual, exact);
      body.append(row);
    });
    table.append(body);

    const scale = element('p', 'impact-scale', 'Bar scale from 0 to ' + study.max.toLocaleString('en-US') + (study.suffix || ''));
    const context = element('p', 'impact-method', study.context);
    const sources = element('div', 'impact-sources');
    sources.setAttribute('role', 'group');
    sources.setAttribute('aria-label', 'Study sources');
    study.sources.forEach(([label, url]) => {
      const link = element('a', '', label);
      link.href = url;
      sources.append(link);
    });
    panel.replaceChildren(region, title, finding, table, scale, context, sources);
  }

  let currentVaccine;
  let currentStudy;
  function render() {
    const { vaccineId, studyId, graphLink } = selectionFromHash();
    if (currentVaccine !== vaccineId) {
      const options = studyIds(vaccineId);
      vaccinePicker.value = vaccineId;
      outcomePicker.replaceChildren(...options.map(id => new Option(studies[id].topic, id)));
      outcomeField.hidden = options.length === 1;
      currentVaccine = vaccineId;
    }
    outcomePicker.value = studyId;
    if (currentStudy !== studyId) {
      showStudy(studies[studyId]);
      announcement.textContent = 'Showing ' + studies[studyId].title + '.';
      currentStudy = studyId;
    }
    if (graphLink || location.hash === '#vaccine-impact') {
      // Let the matching evidence card finish laying out above the graph first.
      const fragment = location.hash;
      requestAnimationFrame(() => {
        if (location.hash !== fragment) return;
        const inExplorer = root.contains(document.activeElement);
        const top = root.getBoundingClientRect().top;
        if (!inExplorer || top < 0 || top > 64) {
          root.scrollIntoView({behavior: 'instant', block: 'start'});
        }
        if (!inExplorer) root.focus({preventScroll: true});
      });
    }
  }

  vaccinePicker.addEventListener('change', () => { location.hash = 'impact-' + vaccinePicker.value; });
  outcomePicker.addEventListener('change', () => {
    location.hash = 'impact-' + vaccinePicker.value + '/' + outcomePicker.value;
  });
  window.addEventListener('hashchange', render);
  // Deferred scripts can render on separate frames while the page is downloading.
  document.addEventListener('DOMContentLoaded', render, {once: true});
  render();
})();
