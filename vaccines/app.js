(function () {
  'use strict';
  const { vaccines, visits, notes, toMonths, lookup, vis } = window.VaccineSchedule;
  const age = document.getElementById('age');
  const unit = document.getElementById('unit');
  const ongoing = document.getElementById('ongoing');
  const results = document.getElementById('results');
  const buttons = document.getElementById('quick-ages');
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function card(dose) {
    const vaccine = vaccines[dose.id];
    const node = el('article', 'card');
    node.style.setProperty('--accent', vaccine.color);
    const top = el('div', 'card-top');
    top.append(el('span', 'vaccine-code', vaccine.code));
    if (dose.condition) top.append(el('span', 'badge', 'Conditional'));
    node.append(top, el('h3', '', vaccine.name));
    if (dose.timing) node.append(el('p', 'timing', dose.timing));
    if (dose.condition) node.append(el('p', 'card-note', dose.condition + '.'));
    dose.refs.forEach(ref => node.append(el('p', 'card-note', notes[ref - 1])));
    const label = dose.id === 'rsv' ? 'Read CDC information sheet ↗' : dose.id === 'flu' ? 'Read inactivated flu VIS ↗' : 'Read CDC VIS ↗';
    const link = el('a', '', label);
    link.href = vis + vaccine.page + '.html';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Read CDC information sheet: ' + vaccine.name);
    node.append(link);
    return node;
  }
  function group(title, doses) {
    const section = el('section', 'seasonal');
    section.append(el('h2', '', title));
    const cards = el('div', 'cards');
    doses.forEach(d => cards.append(card(d)));
    section.append(cards);
    return section;
  }
  function render() {
    const months = toMonths(age.value, unit.value);
    const model = lookup(months, ongoing.checked);
    results.replaceChildren();
    age.setAttribute('aria-invalid', String(!model.valid));
    [...buttons.children].forEach((button, i) => button.setAttribute('aria-pressed', String(model.valid && model.visit?.key === visits[i].key)));
    if (!model.valid) {
      const error = el('div', 'message');
      const heading = el('h2', '', 'Enter a valid age');
      heading.id = 'results-heading';
      error.append(heading, el('p', '', 'Use a whole number of months or years, starting at 0.'));
      results.append(error);
      return;
    }
    const title = el('div', 'result-title');
    const heading = el('div');
    const label = model.visit?.label ?? (months === 1 ? '1 month' : months + ' months');
    const h2 = el('h2', '', label);
    h2.id = 'results-heading';
    heading.append(h2, el('p', '', 'Routine timing reference · not a catch-up schedule'));
    title.append(heading);
    if (model.visit) title.append(el('span', 'count', model.visit.doses.length + ' listed immunizations'));
    results.append(title);
    if (model.visit) {
      const cards = el('div', 'cards');
      model.visit.doses.forEach(d => cards.append(card(d)));
      results.append(cards);
    } else {
      const message = el('div', 'message');
      message.append(el('p', '', 'No exact routine-visit column is listed for this age in the supplied chart. This does not mean no vaccines are due. Check the chart’s age windows, prior doses, and catch-up guidance, or choose a routine visit above.'));
      results.append(message);
    }
    if (model.extra.length) results.append(group('Other age-related considerations', model.extra));
    if (model.ongoing.length) results.append(group('Ongoing / seasonal', model.ongoing));
  }
  visits.forEach(visit => {
    const button = el('button', '', visit.short);
    button.type = 'button';
    button.setAttribute('aria-label', 'Select ' + visit.label);
    button.addEventListener('click', () => {
      const useYears = visit.months >= 48;
      unit.value = useYears ? 'years' : 'months';
      age.value = useYears ? visit.months / 12 : visit.months;
      render();
    });
    buttons.append(button);
  });
  notes.forEach(note => document.getElementById('source-notes').append(el('li', '', note)));
  age.addEventListener('input', render);
  unit.addEventListener('change', render);
  ongoing.addEventListener('change', render);
  render();
})();
