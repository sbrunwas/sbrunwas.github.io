# Ventilator Lab

Buildless, browser-only NICU/PICU educational ventilator simulator, styled after the supplied blue bedside ventilator screen. Hosted at `/ventilators/` on the existing Jekyll GitHub Pages site; no dependencies or backend, and no user data is sent by the simulator.

## Run

From the repository root: `python3 -m http.server 8765`, then open `http://localhost:8765/ventilators/`.

Tests: `node --test ventilators/model.test.mjs`.

- `model.mjs`: deterministic two-compartment mechanics, breath scheduling, adaptive pressure and illustrative gas exchange.
- `app.mjs`: controls, live canvas waveforms/loops, scenario feedback and downloadable session JSON.
- `index.html`: interface plus equations, mode definitions, assumptions, limitations and linked clinical evidence.
- `style.css`: responsive ventilator screen and teaching panels.

## What is modeled

Two parallel linear resistance/compliance units, advanced using exponential pressure solutions at 2 ms steps. Patient effort is an imposed sinusoid. Pressure control, pressure support, pressure-limited volume control, simplified SIMV synchronization and A/C triggering, volume-targeted adaptive pressure, illustrative Auto switching, AVAPS-like slow adaptation and apnea backup are implemented. Residual compartment volume causes intrinsic PEEP. Heterogeneity is the ratio of slow to fast time constants. There is no leak, circuit compliance, flow limitation/choke point, valve dynamics, HFOV, NAVA or hemodynamic model.

Recruitment/overdistension and treatment effects are explicit heuristics. Gas exchange uses alveolar ventilation, CO₂ production, an approximate alveolar gas equation, oxygen-content shunt mixing and a Hill curve, with fixed mixed venous saturation and bicarbonate. It cannot predict patient blood gases. No gas readouts are shown before three completed breaths or when alveolar ventilation is near zero. Values use a recent breath window and change over simulated time; allow at least 30–60 simulated seconds after a setting change. VTi/VTe are integrated over each cycle, and volume waveforms are relative to breath-start volume. Estimated plateau and driving pressure are model-derived, not dynamically measured plateau pressures.

The evidence panel separates sourced clinical principles from assumed scenario parameters. PRVC, V+, Auto and AVAPS are educational approximations, not manufacturer algorithms. Scenario objectives and warning thresholds are teaching aids, not universal clinical targets. This is an unvalidated learning model, not a medical device or clinical decision-support tool.

## Verification

Tests compare PC with the analytical exponential and C×ΔP solutions, check VC delivery and pressure limits, air trapping and expiratory time, triggering and backup, adaptive pressure convergence/rate limits, Auto transitions, treatment directionality, holds, and numerical stability across all cases/modes. These are software/mechanics checks, not clinical validation.
