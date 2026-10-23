# Original Afterglow UI source

Pinned source: [sbrunwas/afterglow, commit 7c32302400444f889cb5e5a829313a6567004456](https://github.com/sbrunwas/afterglow/tree/7c32302400444f889cb5e5a829313a6567004456/web/dist).

`original.html`, `original-style.css`, `original-skins.css`, `original-skins.js` and `randomize.js` are unchanged snapshots of that commit's browser assets (the `original-` names are local reference names). Authored code/artwork is AGPL-3.0-only. The original engine licenses and sample notices remain in the parent directory.

Run `python3 scripts/sync-afterglow-ui.py` from the repository root to generate `clawstudio/afterglow-rack.js` and `clawstudio/afterglow-rack.css`. The adapter maps element IDs, scopes all CSS variables/selectors and skin changes to the drum rack, and retains studio transport, Keyboard Jam, song storage, instrument mute, sequence copying and complete wrapped sequences. CSS layout adjustments accommodate the extra studio controls and narrow screens. The original skin key and four palettes remain unchanged.

No duplicate drum engine runs in this UI. Controls edit the studio's existing Afterglow state and route through its single shared AudioContext. `tests/afterglow-port.cjs` compares rendered styles against the untouched snapshots, checks original-kit round trips, and measures the actual studio audio graph. The reference worklet and unchanged WASM adapter in `tests/fixtures/afterglow/` are from the same commit; only the reference processor registration name changes so both processors can run in one comparison.
