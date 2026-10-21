Serve the repository root with `python3 -m http.server 8001`, then open a test page in a browser with Web Audio support. Each page renders audio offline and prints PASS or FAIL; no audio device or external test dependencies are needed.

- `/tests/patchbay-audio.html`: audible LFO modulation, changing cutoff on an already-playing voice while patched, unplugging back to the unmodulated base, shared free-running LFOs, and audible effects from the expanded inputs.
- `/tests/coarse-and-rates.html`: logarithmic slow LFO ranges, preservation of legacy Texture rates, rendered ±12-semitone pitch changes on Mono/Poly/Texture/Acid, live tuning of sustained notes, and independent oscillator tuning without losing fine-detune offsets.

- `/tests/step-sequencer.html`: shared 16–64-step editing, exact 1/2/3/4-hit scheduling, chord voicings and inversions, notes and rests at loop boundaries, audible retriggers and accent dynamics in all four engines.

Offline control-rate values are initialized explicitly so wall-clock timer scheduling does not affect comparisons.

The song library also has an end-to-end test using Node.js and Playwright (`npm install --no-save playwright`, then `npx playwright install chromium`). With the repository-root server running, use:

```sh
node tests/song-library.cjs
```

Set `BASE_URL` for another server port, or `CHROMIUM_BIN` to use an existing Chromium executable. The test uses isolated browser storage and checks blank startup, explicit demo loading, named song save/load across refreshes, overwrite/rename behavior, unsaved-change cancellation, and preservation of older scene maps and browser backups.
