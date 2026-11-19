/* Population studies and their published values. No patient data are read by this view. */
(() => {
  'use strict';

  const studies = [
    {
      topic: 'Hepatitis B',
      title: 'Acute hepatitis B in children and teens',
      population: 'United States · ages 0–19 · selected years',
      finding: 'In 2023, health departments reported 2,159 fewer cases of acute hepatitis B in this age group than in 1990, a 99% decline.',
      measure: 'Reported acute cases per year',
      max: 2200,
      rows: [['1990', 2180], ['2010', 48], ['2015', 19], ['2019', 13], ['2020', 20], ['2021', 20], ['2022', 14], ['2023', 21]],
      context: 'Routine infant vaccination began in 1991 alongside prenatal screening and protection for exposed newborns. By 2002, the reported rate had already fallen from 3.03 to 0.34 cases per 100,000 children and teens. Many childhood infections cause few symptoms and escape this count. Infection in infancy can persist and cause liver cancer years later.',
      sources: [
        ['AAP family guide to hepatitis B', 'https://www.healthychildren.org/English/health-issues/vaccine-preventable-diseases/Pages/Hepatitis-B.aspx'],
        ['1990 count · Bixler et al., national surveillance analysis', 'https://doi.org/10.1177/00333549231175548'],
        ['1990–2002 rates · CDC surveillance study', 'https://www.cdc.gov/mmwr/preview/mmwrhtml/mm5343a4.htm'],
        ['2010 count · national viral hepatitis data, Appendix B', 'https://www.hhs.gov/sites/default/files/National%20Viral%20Hepatitis%20Action%20Plan%202017-2020.pdf'],
        ['2015 count · national surveillance, Table 2.2', 'https://archive.cdc.gov/www_cdc_gov/hepatitis/statistics/2019surveillance/Table2.2.htm'],
        ['2019–2023 counts · national surveillance, Table 2.2', 'https://www.cdc.gov/hepatitis-surveillance-2023/hepatitis-b/table-2-2.html']
      ]
    },
    {
      topic: 'Chickenpox',
      title: 'Hospital admissions for chickenpox',
      population: 'United States · ages 0–19',
      finding: 'Before routine vaccination, hospitals admitted an estimated 8,574 children and teens with chickenpox each year. By 2018–2019, that annual average was 285.',
      measure: 'Estimated admissions per year',
      max: 9000,
      rows: [['1993–1995', 8574], ['2005–2006', 1204], ['2018–2019', 285]],
      context: 'Investigators weighted hospital discharge records to estimate national totals. The corresponding annual admission rates were 11.3, 1.5 and 0.3 per 100,000 children and teens. These periods cover the baseline, the established one-dose program and the established two-dose program.',
      sources: [
        ['Marin et al. · national hospital study', 'https://pubmed.ncbi.nlm.nih.gov/36265852/'],
        ['Original counts and rates · Table 1, under age 20', 'https://academic.oup.com/view-large/377587716']
      ]
    },
    {
      topic: 'Pneumococcal disease',
      title: 'Invasive pneumococcal infections in Northern California',
      population: 'Kaiser Permanente Northern California · ages 6 weeks to under 6 years',
      finding: 'After the 13-valent pneumococcal vaccine (PCV13) replaced the 7-valent vaccine (PCV7), the rate of invasive infection fell by 65% in this health system.',
      measure: 'Annual cases per 100,000 members in this age group',
      max: 12,
      rows: [['2008–2010', 11.57], ['2011–2018', 4.09]],
      context: 'Investigators tracked infections in normally sterile sites, such as blood, from all pneumococcal types. They compared May 2008–April 2010 with May 2011–April 2018 and excluded the transition year. The rate ratio was 0.35 (95% confidence interval, 0.25–0.50). This comparison describes local disease rates across the two vaccine eras.',
      sources: [
        ['Northern California surveillance study', 'https://pubmed.ncbi.nlm.nih.gov/32415771/'],
        ['Original incidence rates · Table 2', 'https://academic.oup.com/view-large/233100251']
      ]
    },
    {
      topic: 'Rotavirus',
      title: 'Rotavirus among children hospitalized with gastroenteritis',
      population: 'Cincinnati, Nashville and Rochester · children under age 3',
      finding: 'Before widespread vaccination, about half of children hospitalized with gastroenteritis tested positive for rotavirus. During 2008–2016, about one in ten did.',
      measure: 'Percent of enrolled gastroenteritis admissions positive for rotavirus',
      max: 100,
      suffix: '%',
      rows: [['2006–2007', 49], ['2008–2016', 10]],
      context: 'Researchers tested stool samples from 2,187 hospitalized children across both periods. Each percentage is the share of enrolled gastroenteritis admissions in its period that tested positive for rotavirus.',
      sources: [
        ['Three-site pediatric surveillance study', 'https://pubmed.ncbi.nlm.nih.gov/32060546/'],
        ['AAP Pediatrics · subsequent U.S. effectiveness study', 'https://doi.org/10.1542/peds.2024-066879']
      ]
    },
    {
      topic: 'Whooping cough',
      title: 'Whooping cough in the first eight weeks of life',
      population: 'California · infants born in 2013–2014',
      finding: 'Infants whose mothers received Tdap during pregnancy had fewer cases of whooping cough before eight weeks of age than infants whose mothers received Tdap shortly after delivery.',
      measure: 'Reported cases before age 8 weeks per 10,000 infants',
      max: 6,
      rows: [['After delivery', 5.4], ['During pregnancy', 1.9]],
      context: 'The bars show the unadjusted rates calculated from 17 cases among 31,534 infants after maternal Tdap within 14 days after delivery, and 8 among 42,908 after maternal Tdap at any point in pregnancy. A separate adjusted analysis comparing vaccination at 27–36 weeks of pregnancy with postpartum vaccination estimated an 85% lower risk (95% confidence interval, 33%–98%).',
      sources: [
        ['Winter et al. · California Department of Public Health study, Tables 1 and 5', 'https://doi.org/10.1093/cid/ciw634'],
        ['Original cohort counts · Chapter 2, Table 1', 'https://escholarship.org/uc/item/29b651qt']
      ]
    }
  ];

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
  const field = element('label', 'impact-choice', 'Explore a disease');
  const picker = element('select');
  studies.forEach((study, index) => {
    const option = element('option', '', study.topic);
    option.value = String(index);
    picker.append(option);
  });
  field.append(picker);
  header.append(heading, field);

  const panel = element('article', 'impact-panel');
  const announcement = element('div', 'impact-sr-only');
  announcement.setAttribute('role', 'status');
  root.append(header, panel, announcement);

  function showStudy(study) {
    const region = element('p', 'impact-population', study.population);
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

  picker.addEventListener('change', () => {
    const study = studies[Number(picker.value)];
    showStudy(study);
    announcement.textContent = 'Showing ' + study.title + '.';
  });
  showStudy(studies[0]);
})();
