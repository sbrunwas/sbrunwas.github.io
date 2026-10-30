const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/site-analytics.js'), 'utf8');

async function load(options = {}) {
  const requests = [], scripts = [], counts = [], wireData = [], handlers = {};
  class Element {
    constructor(eventName) { this.eventName = eventName; }
    closest() { return this; }
    getAttribute() { return this.eventName; }
  }
  const window = {
    location: { hostname: 'sbrunwas.github.io', pathname: '/vaccines/', search: '?patient=secret', hash: '#age=secret', ...options.location },
    ...options.window
  };
  const document = {
    currentScript: { src: 'https://sbrunwas.github.io/assets/js/site-analytics.js' },
    title: 'Vaccine Timing', referrer: 'https://example.org/private/path?patient=secret#secret',
    createElement() { return { attributes: {}, setAttribute(k, v) { this.attributes[k] = v; } }; },
    head: { appendChild(script) { scripts.push(script); } },
    addEventListener(name, handler) { handlers[name] = handler; }
  };
  const fetch = async (url, opts) => {
    requests.push({ url, opts });
    if (options.networkError) throw new Error('Unavailable');
    return { ok: options.ok !== false, json: async () => ({ goatcounter_code: options.code ?? 'test-site' }) };
  };
  const context = vm.createContext({ window, document, navigator: options.navigator || {}, URL, Element, fetch });
  vm.runInContext(source, context);
  await new Promise(setImmediate);
  if (scripts.length) {
    assert.equal(window.goatcounter.no_onload, true);
    assert.equal(window.goatcounter.no_events, true);
    // The actual SDK adds a separate raw-query field, independently of `path`.
    window.goatcounter.get_data = value => ({ ...value, q: window.location.search });
    window.goatcounter.count = value => {
      counts.push(JSON.parse(JSON.stringify(value)));
      wireData.push(window.goatcounter.get_data(value));
    };
    scripts[0].onload();
  }
  return { requests, scripts, counts, wireData, handlers, Element, context };
}

(async () => {
  const active = await load();
  assert.equal(active.requests[0].url, 'https://sbrunwas.github.io/assets/analytics.json');
  assert.equal(active.requests[0].opts.credentials, 'omit');
  assert.equal(active.scripts.length, 1);
  assert.equal(active.scripts[0].attributes['data-goatcounter'], 'https://test-site.goatcounter.com/count');
  assert.equal(active.scripts[0].referrerPolicy, 'no-referrer');
  assert.deepEqual(active.counts, [{ path: '/vaccines/', title: 'Vaccine Timing', referrer: 'https://example.org' }]);
  active.handlers.click({ target: { value: 'secret', age: 12 } });
  active.handlers.click({ target: new active.Element('home-vaccines') });
  assert.equal(active.counts.length, 1, 'No events on the vaccine form');
  vm.runInContext(source, active.context);
  await new Promise(setImmediate);
  assert.equal(active.requests.length, 1, 'Duplicate loader must not double count');

  const home = await load({ location: { pathname: '/' } });
  home.handlers.click({ target: new home.Element('home-vaccines') });
  assert.deepEqual(home.counts[1], { path: 'home-vaccines', title: 'Homepage: Vaccines', event: true, referrer: '' });
  home.handlers.click({ target: new home.Element('patient=secret') });
  assert.equal(home.counts.length, 2, 'Unrecognised events must not transmit arbitrary labels');
  assert.ok(!JSON.stringify([...home.counts, ...active.counts]).includes('secret'));
  assert.ok(!JSON.stringify([...home.wireData, ...active.wireData]).includes('secret'), 'Provider payload must omit its separate raw query field');

  for (const code of ['', '../invalid', 'https://example.com', 'UPPER', 'x'.repeat(64)]) {
    const result = await load({ code });
    assert.equal(result.scripts.length, 0, 'Invalid/unconfigured endpoint must not contact GoatCounter');
  }
  for (const options of [
    { location: { hostname: 'localhost' } },
    { location: { hostname: 'sam-well-child-vaccines.v1deodrome.chatgpt.site' } },
    { navigator: { doNotTrack: '1' } },
    { navigator: { globalPrivacyControl: true } },
    { window: { doNotTrack: '1' } }
  ]) assert.equal((await load(options)).requests.length, 0, 'Excluded visit must make no analytics request');
  assert.equal((await load({ networkError: true })).scripts.length, 0);
  assert.equal((await load({ ok: false })).scripts.length, 0);

  const pages = ['vaccines/index.html', 'ghostnet/index.html', 'clawstudio/index.html', 'clawstudio/devices.html', 'clawstudio/acid303/index.html', 'clawstudio/bass01/index.html', 'clawstudio/poly/index.html', 'clawstudio/texture/index.html'];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    assert.equal((html.match(/src="\/assets\/js\/site-analytics.js"/g) || []).length, 1, page);
  }
  const homepage = fs.readFileSync(path.join(__dirname, '../_layouts/home.html'), 'utf8');
  assert.equal((homepage.match(/data-site-event="home-/g) || []).length, 6);
  console.log('Analytics privacy, pageviews, click events, opt-outs, failure handling, and page coverage passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
