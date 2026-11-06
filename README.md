# Vedik / Dr Strange

A privacy-first, responsive Vedic astrology beta with a North Indian SVG kundali and plain-language, rule-ranked interpretations. No API key, server or package installation needed.

## Run

- `npm run dev` opens a static server on port 3000.
- `npm test` runs calculation and ranking checks with Node 20+.
- Deploy `dist/` to any static host. There is no build step.

## What works

Birth date/time, preset Indian cities, custom coordinates and historical UTC offset input. Actual geocentric planetary calculations, approximate Lahiri adjustment, whole-sign houses, mean Rahu/Ketu, Moon nakshatra/pada. Fixed-house North Indian chart with sign numbers, keyboard-accessible house selection, placement table and SVG download. Category-filtered interpretations ranked by matched rules. No birth details stored or transmitted.

The default chart is a clearly labelled example, not the visitor's chart. Changing inputs requires submitting the form. Indian presets use +05:30, which must be corrected for historical dates where applicable. Custom places require manually verified coordinates and UTC offset.

## Accuracy status: beta, reference validation pending

Astronomy Engine supplies astronomical positions. Our sidereal adjustment and ascendant implementation are approximate and not independently validated against Swiss Ephemeris. Supported dates: 1900–2100. Latitude: ±65°. Do not represent this release as a high-precision chart service or a validated future-event predictor. The seven tests check mechanics, not prediction validity or ephemeris reference agreement.

Readings are a small, transparent set of traditional placement heuristics. Ranking considers house matches, angular houses, own sign and exaltation sign. Scores are internal ordering signals, not confidence percentages. They do not account for aspects, combustion, retrograde strength, divisional confirmation, dashas or transits. No timed-event or medical/financial forecasts are generated. Astrology's predictive accuracy is not scientifically established.

## Architecture

- `dist/engine.js`: pure birth-time conversion, chart calculation and reading rules. Versioned chart data is independent of rendering.
- `dist/app.js`: form orchestration, accessible SVG renderer and reading views.
- `dist/styles.css`: responsive visual system.
- `dist/vendor/astronomy.js`: vendored MIT-licensed Astronomy Engine (copyright and license included). Source: https://github.com/cosinekitty/astronomy/blob/master/source/js/astronomy.browser.min.js
- `tests/engine.test.mjs`: Node test runner, no dependencies.

A future Three.js renderer should consume the same chart model without owning astronomical calculations. Keep it lazy-loaded so the core reading experience remains fast and accessible.

## Next milestones

1. Select a production ephemeris and resolve its commercial licensing. Validate longitude, ascendant, nakshatra, nodes and date boundaries against an independent fixture set. Swiss Ephemeris licensing: https://www.astro.com/swisseph/swephinfo_e.htm
2. Add place search with historical IANA timezone resolution and explicit handling of ambiguous/nonexistent local times. Validate birth uncertainty and show when placements change across that uncertainty window.
3. Implement and validate Vimshottari periods, divisional charts and aspects before adding dated event interpretations.
4. Expand a sourced, versioned rule catalogue. Retain contradictions and evidence internally, while keeping user readings direct and jargon-free. Never fabricate match percentages or guaranteed outcomes.
5. Evaluate predictions prospectively with user consent, fixed event definitions, dates, misses and base-rate comparisons. Report measured results, not marketing accuracy claims.
6. Add an optional 3D sky experience with a 2D fallback.

## Data and assets

The app uses no analytics, local storage, backend or model provider. Font requests go to Google Fonts; system serif/sans fallbacks work offline. Birth fields never enter these requests. Hosting access logs may still exist. All ornamentation is CSS/SVG.
