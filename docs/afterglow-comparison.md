# Afterglow → ClawStudio comparison

Reference: [Afterglow main, 7c32302400444f889cb5e5a829313a6567004456](https://github.com/sbrunwas/afterglow/tree/7c32302400444f889cb5e5a829313a6567004456/web/dist). Comparison performed against this repository source and its runnable browser build. The hosted `afterglow-drum-machine.v1deodrome.chatgpt.site` reference returned HTTP 403 from this execution environment, so its deployed version, saved browser state and device output level could not be inspected.

## What differed

| Area | Original Afterglow | Previous ClawStudio integration | Current integration |
| --- | --- | --- | --- |
| Synthesis | C++ WASM: 909 / 808 / Linn PCM / Perkons / samples | Same WASM and adapter | Same original engine; no replacement synthesis or artificial loudness boost |
| Output | Engine straight to destination | Historical master gain .65, drum fader .88, compression, drum sends; newer clean defaults were already neutral, but old projects retained processing | Actual clean studio output nulls against raw engine output; Match Afterglow also removes old compression, ducking and deck attenuation |
| Controls | Master, swing, tempo, draggable knobs, sliders and numeric values | Drum master/swing absent; tuning rounded to whole semitones | Original master/swing, decimal tempo and 0.1-semitone tuning, all original voice/step controls with numeric entry |
| Appearance | Original faceplate with four skins | Different green studio panel | Original Classic 909, Hacker, Midnight and Studio artwork/palettes, scoped to the drum rack |
| Randomization | Voice-specific pitch/decay ranges, structured rhythm generation, engine pool | Different sound/rhythm algorithms; pool checkboxes were not written back to kit state | Original randomizer module and lane algorithm, saved engine pool, targeted Undo that retains subsequent mixer edits |
| Portable kits | `.afterglow-web.json`, embedded stereo samples | Different studio-only kit format | Original codec for saving/loading, with legacy studio kit/project import retained |
| Export | Original WASM WAV render with ringing tail; standard MIDI export | Not exposed in drum rack | Original WAV renderer and MIDI export available in rack, including WAV render before live audio starts |
| Interaction | Updates existing sequencer buttons | Rebuilt entire grid on edits; blur during a length change could swallow the next step click | Updates existing buttons while length is stable; full playhead/LED, velocity and repeats display |

Historical fixed gain was `.88 × .65 = .572`, approximately **−4.85 dB before compression**, with further changes possible from faders and deck blending. This is a verified source difference, not proof of the user's particular browser session settings. Neutral routing had been introduced earlier; this change makes the original controls and kit settings accessible and verifies the complete running graph, rather than only a simplified test path.

## Audio evidence

The bundled WASM and original reference have SHA-256 `b4c06a366ae3801d2278ef40ae984334a517dae3598d30a5ea292ac474992ff9`. The adapter is unchanged, SHA-256 `7a82d901a14d8b4462287e38c6b009261064f5c9e65ff72f0534b60f57b169ae`. The WAV renderer is also unchanged.

Browser tests run the original worklet/reference adapter and the scheduled studio worklet side by side. All four families are sample-identical at 48 kHz with nonzero drive, fractional tuning, pan, swing, chance and repeats. Mixed kits are sample-identical at 44.1 and 96 kHz. Stereo custom samples with reverse, trim and pitch also match exactly. The shared studio transport adds scheduled starts without changing the synthesized samples.

The integration test additionally connects a null meter to the **running studio's raw drum node and actual master output**. With only drums soloed and clean processing, a representative 48,000-frame measurement produced **RMS difference 0 and maximum sample difference 0**, including the real strip, deck bus, master FX worklet and output stage. The original kit's master setting was .91, with reference RMS approximately .0923 and peak .5024. Drums are isolated for this comparison because other synths, their idle signal and effect tails are separate sources in a full studio mix. Match Afterglow is tested again after enabling Glue, kick ducking and an attenuated deck blend.

No listening-session claim is made about the inaccessible hosted deployment. Importing a kit saved there is the way to compare the user's actual sounds, levels, samples and patterns without guessing their settings.

## Studio behavior retained

Startup is blank. Factory Patterns is explicit; it loads only the drum bank. Song storage and whole-studio recording remain in ClawStudio. All 16–64 drum steps remain visible in rows of sixteen, without pages. Keyboard performance stays behind the existing Keyboard Jam toggle, so typing remains safe. Rack mute and cross-instrument sequence copying remain available.

Match Afterglow Sound preserves drum voice parameters, samples, patterns, engine master level and engine drive. It sets the drum strip to unity with neutral EQ/filter, disables its sends and sidechain, bypasses master glitch/heat/compression, and sets a clean A snapshot with unity deck gains. The B snapshot remains available; moving the morph or applying a saved scene can deliberately add processing again. Other channel mute/solo choices are respected.

## Reproduce

Serve the website repository root, then run:

```sh
python3 -m http.server 8001
BASE_URL=http://127.0.0.1:8001 CHROMIUM_BIN=/usr/bin/chromium node tests/afterglow-port.cjs
```

The test includes computed-style comparisons for all four skins, sample-level original/studio worklet comparisons, live output null tests, kit/sample round trips, invalid-kit atomicity, original randomization and Undo, WAV/MIDI downloads, numeric editing, shared transport, and mobile wrapping. `tests/afterglow-parity.html` runs the offline audio comparison separately. Existing song-library, sequence-copy, and Jam/transition end-to-end checks cover surrounding studio behavior.
