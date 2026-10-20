# ClawStudio v0.20 staging status (2026-10-20)

**NOT DEPLOYED TO LIVE PAGE; DO NOT LINK OR PROMOTE THIS BRANCH YET.**

GitHub Pages uses `sbrunwas/sbrunwas.github.io` branch `master`, folder `clawstudio/`, entrypoint `index.html`. The existing entrypoint is intentionally unchanged.

This QA branch includes `clawstudio-v20-preview.html`, `audio-v20.js`, and `worklet-v20.js`, but the required `clawstudio-capture.worklet.js` transfer was blocked by connector safety checks and `render-worker.js` is absent from the live folder. This preview is incomplete and has not passed native WASM playback or hardware QA.

To complete staging, use the validated local handoff package `ClawStudio_v20_Deployment_Handoff.zip`, its `prepare_pages_v20.py` on a real repository checkout, run Chromium/native WASM acceptance, and only then promote the tested preview to public `index.html`.
