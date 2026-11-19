(function () {
  'use strict';
  const entries = window.VaccineEvidence;
  const catalog = window.VaccineSchedule.vaccines;
  const picker = document.getElementById('evidence-choice');
  const nav = document.getElementById('evidence-links');
  const article = document.getElementById('evidence-content');
  const ids = Object.keys(catalog).filter(id => entries[id]);
  function el(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function link(text, href) {
    const a = el('a',text);
    a.href = href;
    return a;
  }
  for (const id of ids) {
    const item = catalog[id];
    picker.append(new Option(item.name, id));
    const a = link(item.name, '#' + id);
    a.dataset.id = id;
    nav.append(a);
  }
  function render() {
    const requested = location.hash.slice(1);
    const id = ids.includes(requested) ? requested : 'hepb';
    const data = entries[id];
    const vaccine = catalog[id];
    picker.value = id;
    for (const a of nav.children) {
      if (a.dataset.id === id) a.setAttribute('aria-current','true');
      else a.removeAttribute('aria-current');
    }
    article.replaceChildren();
    const intro = el('header','','evidence-intro');
    intro.style.setProperty('--accent',vaccine.color);
    intro.append(el('p',vaccine.code,'vaccine-code'),el('h2',vaccine.name),el('p',data.why));
    const jump = link('See population impact graphs ↓','#vaccine-impact');
    // The disease trend section has its own selection; keep the current evidence record when scrolling.
    jump.addEventListener('click',event => {
      event.preventDefault();
      const section = document.getElementById('vaccine-impact');
      const topic = {hepb:'Hepatitis B',varicella:'Chickenpox',pcv:'Pneumococcal disease',rv:'Rotavirus',dtap:'Whooping cough',tdap:'Whooping cough'}[id];
      const select = section.querySelector('select');
      const option = select && Array.from(select.options).find(o => o.text === topic);
      if (option) { select.value = option.value; select.dispatchEvent(new Event('change')); }
      section.scrollIntoView();
      section.setAttribute('tabindex','-1');
      section.focus({preventScroll:true});
    });
    intro.append(jump);
    article.append(intro);
    const questions = el('section','','evidence-section');
    questions.append(el('h3','Questions families ask'));
    for (const item of data.faq) {
      const details = el('details');
      details.append(el('summary',item.q),el('p',item.a));
      questions.append(details);
    }
    article.append(questions);
    const studies = el('section','','evidence-section');
    studies.append(el('h3','What the studies found'));
    for (const study of data.studies) {
      const item = el('article','','study');
      item.append(el('h4',study.title),el('p',study.finding,'finding'),el('p',study.context,'study-context'));
      if (study.rates?.length) {
        const chart = el('div','','rates');
        for (const {label,value} of study.rates) {
          const row = el('div','','rate-row');
          const name = el('div','','rate-label');
          name.append(el('span',label),el('strong',value + '%'));
          const track = el('div','','rate-track');
          track.setAttribute('aria-hidden','true');
          const bar = el('span');
          bar.style.width = value + '%';
          track.append(bar);
          row.append(name,track);
          chart.append(row);
        }
        chart.append(el('p','Scale: 0–100% of each group','scale-note'));
        item.append(chart);
      }
      item.append(link(study.citation + ' ↗', study.source));
      studies.append(item);
    }
    article.append(studies);
    const references = el('section','','evidence-section references');
    references.append(el('h3','Guidance and further reading'));
    const ul = el('ul');
    for (const source of data.sources) {
      const li = el('li');
      li.append(link(source.title + ' ↗',source.url));
      ul.append(li);
    }
    references.append(ul);
    article.append(references);
  }
  picker.addEventListener('change',() => { location.hash = picker.value; });
  window.addEventListener('hashchange',render);
  render();
})();
