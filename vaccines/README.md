# Well-Child Vaccine Timing

Browser-only conversion of https://github.com/sbrunwas/wccvisits/blob/main/app.py
(source blob 300caee322bbffbe1517190fe4a714ed5ec2141f).

Clinical reference: user-supplied CDPH **Routine Immunization Timing 2025**, IMM-395 (8/25).
The supplied chart is preserved in `cdph-imm-395-2025.png`. Schedule content is deliberately
versioned to this chart, not represented as current-year guidance. The online PDF can change.

## Behavior

- Whole-number age in months or years, plus routine-visit shortcuts.
- Routine chart columns, with age windows, intervals, conditions, and all 15 source notes.
- Whole-year bands: ages 4 through 6, 11 through 12, and 16 (including months within the last year).
- Ongoing COVID-19 and flu references from 6 months, even outside exact routine visits.
- Conditional RSV reference below 8 months; optional HPV start at age 9.
- The separate catch-up planner checks dated doses, minimum and usual dates, live-vaccine spacing, selected products and proposed visits for ages 0–18 using the linked 2026 AAP schedule. It can project a single series or group selected series into visits over one year.
- Missing records, special situations, ambiguous historical doses and seasonal guidance can require clinical review. A clinician should verify the printed source criteria before administering a dose. New dose entry and forecast rules belong in `planner-rules.js`, with corresponding boundary tests.
- The evidence library includes vaccine-specific family questions, study populations, absolute event rates and source links. Every listed immunization has an impact graph. The explorer includes separate outcomes for combination vaccines and labels the study design, population, periods and units. Chart data and source links live in `impact-data.js`. Link to `evidence.html#impact-mmr/mumps` to share a specific outcome.
- The individual planner runs same-origin scripts, blocks network connections and form submissions, and stores the record only in memory. Reload or Clear patient starts a fresh record.
- No API keys, backend, cookies, or stored patient data. Optional aggregate page-view
  analytics on the public GitHub host never read the age controls; the private Sites host is excluded.

## Hosting

GitHub Pages serves this directory at https://sbrunwas.github.io/vaccines/.
Assets use relative paths and have no Jekyll dependency or build step.

Sites identity is persisted in `.openai/hosting.json`. Use that project for subsequent updates.
Stage the identical assets in a separate Sites checkout with:

```sh
node scripts/prepare-vaccines-site.cjs /absolute/path/to/sites-checkout
```

For an existing Site, first open its source using the Sites skill's source helper, then
restage in the returned checkout and run the helper to push/package/publish. Keep Sites
credentials in memory and pass them only on stdin. Sites deployment does not automatically
follow GitHub commits; republish after updating this directory.

## Validation

```sh
node tests/vaccines.cjs
node --test tests/*.test.js
node --check vaccines/app.js
```

Browser QA should cover birth, conditional 4- and 6-month cards, age-unit conversion,
no-match ages, seasonal toggle, source notes, and a narrow viewport.
