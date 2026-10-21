// Run against a repository-root server; uses fresh, isolated browser storage.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8001';

function assertBlank(project) {
  assert.equal(drumHits(project), 0);
  for (const key of ['mono', 'poly', 'texture', 'acid']) {
    assert.equal(project.rack[key].patterns.flat().filter(s => s.on).length, 0);
    assert.equal(project.rack[key].steps, 16);
  }
  assert.equal(project.rack.poly.polyArp.enabled, false);
  assert.equal(project.rack.poly.polyArp.cells.filter(s => s.on).length, 0);
  assert.equal(project.conductor.auto, false);
  assert.equal(project.conductor.scenes.filter(s => s.data).length, 0);
  assert.equal(project.conductor.lanes.flatMap(l => l.steps).filter(s => s.on).length, 0);
  assert.equal(project.sampler.slots.filter(s => s.pcm).length, 0);
}
function drumHits(project) {
  return project.drum.state.bank.patterns.flatMap(p => p.steps.flat()).filter(s => s.on).length;
}

(async () => {
  const browser = await chromium.launch({
    ...(process.env.CHROMIUM_BIN ? {executablePath: process.env.CHROMIUM_BIN} : {}),
    headless: true, args: ['--no-sandbox']
  });
  try {
    const context = await browser.newContext(), page = await context.newPage(), errors = [];
    let confirmations = 0, acceptChanges = true;
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', async dialog => {
      confirmations++;
      await (acceptChanges ? dialog.accept() : dialog.dismiss());
    });
    const status = text => page.waitForFunction(
      expected => document.querySelector('#c-song-status').textContent.includes(expected), text
    );
    const exportProject = async () => {
      const download = page.waitForEvent('download');
      await page.locator('#cs17-save-project').click();
      return JSON.parse(await fs.readFile(await (await download).path(), 'utf8'));
    };
    const load = async (choice, title) => {
      await page.locator('#c-song-picker').selectOption(choice);
      await page.locator('#c-song-load').click();
      await status('Loaded ' + title);
    };
    const save = async name => {
      await page.locator('#c-song-name').fill(name);
      await page.locator('#c-song-save').click();
      await status('Saved ' + name);
      return page.locator('#c-song-picker').inputValue();
    };
    const reload = async () => {
      await page.reload();
      await page.waitForFunction(() => document.querySelector('#c-song-picker option[value=""]'));
      assertBlank(await exportProject());
      assert.equal(await page.locator('#c-song-picker').inputValue(), 'blank');
    };

    await page.goto(baseURL + '/clawstudio/');
    await reload();
    assert.equal(await page.locator('#c-grid .step.on').count(), 0);
    console.log('PASS cold startup is empty across every pattern, synth, sampler, scene and performance lane');

    // Old scene maps remain untouched and never load automatically.
    const legacy = {
      version: 1, auto: true, sceneIndex: 2,
      scenes: Array.from({length: 8}, (_, i) => ({
        name: 'MY OLD ' + i, bars: 4, data: {starterId: 'blue-hour-v1'}
      })),
      lanes: Array.from({length: 4}, () => ({
        enabled: false,
        steps: Array.from({length: 16}, () => ({on: false, note: 60, gate: .7, velocity: 100}))
      }))
    };
    await page.evaluate(data => localStorage.setItem('clawstudio-scene-conductor-v10', JSON.stringify(data)), legacy);
    await reload();
    const legacyJSON = () => page.evaluate(() => localStorage.getItem('clawstudio-scene-conductor-v10'));
    assert.equal(await legacyJSON(), JSON.stringify(legacy));
    await page.locator('#c-song-picker option[value="legacy-v10"]').waitFor({state: 'attached'});

    await load('factory', 'BLUE HOUR');
    const demo = await exportProject();
    assert.ok(drumHits(demo) > 0);
    assert.equal(demo.conductor.auto, true);
    assert.equal(demo.rack.poly.polyArp.enabled, true);
    assert.equal(confirmations, 0);
    console.log('PASS Blue Hour loads only on request with complete patterns and arrangement');

    const first = await save('My first song');
    assert.ok(first.startsWith('saved:'));
    await page.locator('#cs17-backup').click();
    await page.waitForFunction(() => document.querySelector('#cs17-project-status').textContent.includes('backed up'));
    await page.locator('#c-song-new').click();
    await status('Blank patterns');
    assertBlank(await exportProject());
    await page.locator('#c-grid .step').first().click();
    const second = await save('My second song');
    assert.notEqual(first, second);

    await reload();
    await page.locator('#c-song-picker option').filter({hasText: 'My second song'}).waitFor({state: 'attached'});
    const savedOptions = page.locator('#c-song-picker optgroup[label="SAVED IN THIS BROWSER"] option');
    assert.equal(await savedOptions.count(), 2);
    await load(first, 'My first song');
    const restored = await exportProject();
    assert.equal(restored.title, 'My first song');
    assert.deepEqual(restored.drum.state, demo.drum.state);
    assert.deepEqual(restored.rack.poly.patterns, demo.rack.poly.patterns);
    assert.deepEqual(restored.conductor, demo.conductor);
    await load(second, 'My second song');
    assert.equal(drumHits(await exportProject()), 1);
    console.log('PASS multiple named songs survive refresh; selecting restores their data while startup stays empty');

    await page.locator('#cs17-restore').click();
    await page.waitForFunction(() => document.querySelector('#cs17-project-status').textContent.includes('Recovered local project'));
    assert.deepEqual((await exportProject()).drum.state, demo.drum.state);
    assert.equal(await legacyJSON(), JSON.stringify(legacy));
    console.log('PASS legacy maps and existing browser recovery are preserved');

    // Re-saving keeps the ID; renaming keeps the original as a separate song.
    await load(second, 'My second song');
    assert.equal(await save('My second song'), second);
    assert.notEqual(await save('A new variation'), second);
    assert.equal(await savedOptions.count(), 3);

    // A title edit is unsaved work too; canceling New preserves the song.
    acceptChanges = false;
    const before = confirmations;
    await page.locator('#c-song-name').fill('Unsaved title');
    await page.locator('#c-song-new').click();
    await page.waitForFunction(() => !document.querySelector('#c-song-new').disabled);
    assert.equal(confirmations, before + 1);
    assert.equal(await page.locator('#c-song-name').inputValue(), 'Unsaved title');
    assert.equal(drumHits(await exportProject()), 1);
    console.log('PASS saving updates a song, renaming preserves the original, and canceling keeps edits');
    // New Poly synthesis settings belong to songs and portable projects too.
    acceptChanges = true;
    await page.locator('#c-poly-select').click();
    const poly = page.locator('#c-poly-mount');
    await poly.locator('[data-opt="osc2"]').selectOption('FORMANT');
    const newKnobs = ['osc2Gain','fmAmount','fmRatio','detune2','mix2','shape2','tune2'];
    for (const key of newKnobs) await poly.locator(`[data-knob="${key}"]`).press('ArrowUp');
    const envelope = {filterAttack: .13, filterDecay: .34, filterSustain: .56, filterRelease: .78};
    for (const [key, value] of Object.entries(envelope)) await poly.locator(`[data-fader="${key}"]`).fill(String(value));
    const designed = await save('Poly sound design');
    const designProject = await exportProject();
    await page.locator('#c-song-new').click();
    await status('Blank patterns');
    await load(designed, 'Poly sound design');
    assert.deepEqual((await exportProject()).rack.poly.p, designProject.rack.poly.p);

    // Opening an old project after using the new controls must reset missing settings.
    const legacyProject = structuredClone(designProject), oldPoly = legacyProject.rack.poly.p;
    for (const key of [...newKnobs, ...Object.keys(envelope)]) delete oldPoly[key];
    Object.assign(oldPoly, {osc2: 'TRI', shape: .7, decay: .6});
    await page.locator('#cs17-project-file').setInputFiles({
      name: 'legacy-poly.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(legacyProject))
    });
    await page.waitForFunction(() => document.querySelector('#cs17-project-status').textContent.includes('Imported legacy-poly.json'));
    const migrated = (await exportProject()).rack.poly.p;
    assert.equal(migrated.osc2, 'TRI');
    assert.equal(migrated.fmAmount, 0);
    assert.equal(migrated.osc2Gain, .22);
    assert.equal(migrated.tune2, .7);
    assert.equal(migrated.filterSustain, 0);
    assert.ok(Math.abs(migrated.filterDecay - Math.sqrt((.9 - .025) / 2)) < 1e-9);

    // Standalone patch import follows the same migration path.
    await poly.locator('[data-knob="fmAmount"]').press('ArrowUp');
    await poly.locator('#cri-loadfile').setInputFiles({
      name: 'legacy-patch.json', mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({format: 'clawstudio-rack-device', version: 1, type: 'poly', state: legacyProject.rack.poly}))
    });
    await page.waitForFunction(() => document.querySelector('#c-poly-mount #cri-status').textContent === 'Patch loaded');
    assert.equal((await exportProject()).rack.poly.p.fmAmount, 0);
    console.log('PASS new Poly controls persist in songs/projects, and old projects/patches reset missing controls safely');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
