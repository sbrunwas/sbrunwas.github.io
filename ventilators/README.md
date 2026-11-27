# Ventilator Lab

Buildless, browser-only NICU/PICU educational ventilator simulator, styled after the supplied blue bedside ventilator screen. Hosted at `/ventilators/` on the existing Jekyll GitHub Pages site; no dependencies or backend, and no user data is sent by the simulator.

## Run

From the repository root: `python3 -m http.server 8765`, then open `http://localhost:8765/ventilators/`.

Tests: `node --test ventilators/model.test.mjs ventilators/timing.test.mjs`.

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

Playback starts and resets at 1× real time. Accelerated playback is explicitly labeled. The selectable 6/12-second waveform window controls horizontal scale independently of playback speed. Hidden tabs do not advance or catch up. The animation test verifies equal elapsed simulation time at 60 Hz and 120 Hz and reset/hidden-tab behavior.

The compact desktop layout (1100 px wide and above, 650 px tall and above) places estimated gases above the monitor and shows all controls in the selected Ventilator, Patient or Interventions tab. Case descriptions and patient model notes expand on demand. Smaller screens retain a scrollable layout for readability.

## Challenge Yourself and sampled gases

Clinical Examples retains the named scenarios. Challenge Yourself randomly selects one of four concealed problems (surfactant deficiency, bronchospasm, secretion-related obstruction, excessive support after improved compliance). History, settings and waveforms remain available; editable patient mechanics, the scenario identity in diagnostic state, and session export are hidden until completion or answer reveal. This is classroom concealment in a client-side app, not secure exam software. Baseline mechanics/gases are equilibrated for 60 simulated seconds before the challenge clock starts at zero.

The learner records a working diagnosis, applies an intervention and/or adjusts support, and requests a gas. Completion requires the right working diagnosis, appropriate intervention without unrelated treatment toggles, three consecutive breath volumes in range, pressure/emptying goals, oxygen limits, a post-change gas sample no older than 60 seconds, and 10 continuous simulated seconds meeting the goals. Success reveals the explanation; manual answer reveal is labeled incomplete. Challenges are deliberately modeled patterns, not validation that ventilator waveforms can uniquely diagnose a disease.

The Get a gas button stores an immutable snapshot with sample time. Values do not update automatically, including while settings or treatments change. A new case clears the sample. The baseline comparison uses sampled gas values rather than streaming hidden gas estimates.

Run all checks with `node --test ventilators/*.test.mjs`.
