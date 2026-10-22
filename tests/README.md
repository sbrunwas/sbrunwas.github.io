Serve the repository root with `python3 -m http.server 8001`, then open a test page in a browser with Web Audio support. Each page renders audio offline and prints PASS or FAIL; no audio device or external test dependencies are needed.

- `/tests/patchbay-audio.html`: audible LFO modulation, changing cutoff on an already-playing voice while patched, unplugging back to the unmodulated base, shared free-running LFOs, and audible effects from the expanded inputs.
- `/tests/coarse-and-rates.html`: logarithmic slow LFO ranges, preservation of legacy Texture rates, rendered ±12-semitone pitch changes on Mono/Poly/Texture/Acid, live tuning of sustained notes, and independent oscillator tuning without losing fine-detune offsets.

- `/tests/step-sequencer.html`: shared 16–64-step editing, exact 1/2/3/4-hit scheduling, chord voicings and inversions, notes and rests at loop boundaries, audible retriggers and accent dynamics in all four engines.

- `/tests/poly-voice.html`: matching oscillator waveforms, independent OSC 2 gain, real OSC 2 → OSC 1 FM with ratio and live controls, FM patching, separate filter ADSR timing, short gates, and migration of old patches.

Offline control-rate values are initialized explicitly so wall-clock timer scheduling does not affect comparisons.

The song library also has an end-to-end test using Node.js and Playwright (`npm install --no-save playwright`, then `npx playwright install chromium`). With the repository-root server running, use:

```sh
node tests/song-library.cjs
```

Set `BASE_URL` for another server port, or `CHROMIUM_BIN` to use an existing Chromium executable. The test uses isolated browser storage and checks blank startup, explicit demo loading, named song save/load across refreshes, overwrite/rename behavior, unsaved-change cancellation, preservation of older scene maps and browser backups, persistence of Poly synthesis settings, and import of legacy projects and patches.

- `/tests/keyboard-jam.html`: opt-in key mapping and typing protection, chord releases, Mono note priority, startup races, focus cleanup, sustained notes on all synths, and source cleanup on all Texture engines.
- `/tests/drum-transparency.html`: renders the bundled Afterglow engine through the actual studio mixer components; the neutral path must null against its direct output for 909, 808, Linn and Perkons. Also checks the optional Glue, Heat and channel filter.

Run `node tests/master-transitions.cjs` for sample-clock transition timing, stereo reverb decay, zero-mix/intensity bypass and release continuity (no browser dependencies). With Playwright installed and the repository-root server running, `node tests/jam-and-transitions.cjs` checks real keyboard audio, typing modes, sampler gates, shortcuts, transition controls, legacy project migration and clean drum settings. `BASE_URL` and `CHROMIUM_BIN` work as above.

Run `node tests/master-gestures.cjs` for forward/reverse sample order, tempo/sample-rate timing, frozen stereo holds independent of sequencer events and ring wrap, release/bypass, and audible DSP changes from every effect parameter. `node tests/master-effects.cjs` uses Playwright to check all 22 controls against the real worklet, held/released pointer gestures, effect reset, song/project persistence and legacy defaults, and mobile control layout. `BASE_URL` and `CHROMIUM_BIN` work as above.

- `/tests/sequence-copy.html`: cross-instrument pitch/chord and timing conversion, deep copies, selected-pattern isolation, drum rhythm conversion, nonstandard lengths, Undo Copy and history reset.

`node tests/sequence-copy.cjs` uses Playwright and the repository-root server to verify real copy controls, preservation of sound parameters and other patterns/lanes, full 64-step visibility, custom lengths through song/patch save/load, and live loop continuity beyond master step 64. Use `BASE_URL` and `CHROMIUM_BIN` as above.
