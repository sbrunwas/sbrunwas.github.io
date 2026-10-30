/* Aggregate site metrics only. No form values, query strings, or hash fragments. */
(function () {
  'use strict';
  // Count the public website, never localhost, test hosts, or the private Sites copy.
  if (window.location.hostname !== 'sbrunwas.github.io' || window.__siteAnalyticsStarted) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  window.__siteAnalyticsStarted = true;

  const source = document.currentScript;
  if (!source) return;
  const configURL = new URL('../analytics.json', source.src);
  const pagePath = window.location.pathname;
  let referrer = '';
  try {
    const url = new URL(document.referrer);
    if (url.protocol === 'https:' || url.protocol === 'http:') referrer = url.origin;
  } catch (_) { /* Direct visit or no usable referrer. */ }

  // Only explicitly labelled homepage links produce events. Never read inputs,
  // link destinations, application state, or text typed by a visitor.
  const events = {
    'home-about': 'Homepage: About',
    'home-posts': 'Homepage: Posts',
    'home-residency-notes': 'Homepage: Pediatric Residency Notes',
    'home-milestones': 'Homepage: Milestones',
    'home-vaccines': 'Homepage: Vaccines',
    'home-fever': 'Homepage: Fever'
  };

  fetch(configURL.href, { credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store' })
    .then(response => response.ok ? response.json() : null)
    .then(config => {
      const code = config && config.goatcounter_code;
      if (typeof code !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(code)) return;

      // Manual pageview prevents the provider's default query/canonical handling
      // and automatic event binding from collecting unintended information.
      window.goatcounter = { no_onload: true, no_events: true };
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://gc.zgo.at/count.js';
      script.setAttribute('data-goatcounter', 'https://' + code + '.goatcounter.com/count');
      script.referrerPolicy = 'no-referrer';
      script.onload = function () {
        if (!window.goatcounter || typeof window.goatcounter.count !== 'function') return;
        // GoatCounter also adds the raw query as a separate `q` field for campaign
        // handling. Remove that field as well as using our query-free page path.
        const getData = window.goatcounter.get_data;
        if (typeof getData !== 'function') return;
        window.goatcounter.get_data = function (vars) {
          const data = getData(vars);
          delete data.q;
          return data;
        };
        const count = data => {
          try { window.goatcounter.count(data); } catch (_) { /* Metrics must never disrupt the site. */ }
        };
        count({ path: pagePath, title: document.title, referrer: referrer });
        document.addEventListener('click', function (event) {
          if (window.location.pathname !== '/') return;
          const link = event.target instanceof Element ? event.target.closest('a[data-site-event]') : null;
          const name = link && link.getAttribute('data-site-event');
          if (!Object.prototype.hasOwnProperty.call(events, name)) return;
          count({ path: name, title: events[name], event: true, referrer: '' });
        });
      };
      document.head.appendChild(script);
    })
    .catch(() => { /* An unavailable config or analytics service does not affect the website. */ });
})();
