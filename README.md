# Vedik / Dr Strange

North Indian kundali plus a Tajika-based 12-month forecast: five ranked headlines first, then one good development and one caution for each month. Direct English, without astrological terminology in prediction cards.

## Run

`npm run dev` serves `dist/` on port 3000. `npm test` runs the Node test suite. Node 20+ is sufficient, with no dependencies or API keys. Deploy `dist/` to any static host; no build step is required.

## Forecast calculations

- Sidereal annual solar return: solve the Sun's longitude equal to its natal longitude. Bisection reaches 100 ms numerical tolerance. That tolerance is not a claim about the astronomical accuracy of this implementation.
- Masa Pravesha: solve natal solar longitude + 30 degrees per solar month. These are real root-solved return instants, not twelve equal-duration divisions of a year.
- Muntha: natal ascendant longitude plus 30 degrees per completed solar year. This version uses annual Muntha only, not a monthly progressed Muntha.
- Return charts: use the selected residence coordinates, fixed across the forecast. Birth coordinates remain separate. Whole-sign houses, approximate Lahiri adjustment and mean lunar nodes are retained from the first release.
- Geometric Tajika aspects: same-sign conjunction and sign-supported sextile, square, trine or opposition, with average planetary orbs. Sun 15, Moon 12, Mars 8, Mercury/Venus 7, Jupiter/Saturn 9 degrees. No Rahu/Ketu aspects are scored.
- Annual/monthly interpretation: a theme must have a matching positive or negative signal in both charts. Selected planet-house rules and annual Muntha are scored separately for support and pressure. Moon is counted only when waxing and not in the same sign as Sun, Mars or Saturn. Friendly Jupiter/Venus contacts add support; hard Mars/Saturn contacts add pressure.
- Calendar coverage: twelve consecutive month-length windows from the selected start date, using UTC midnight boundaries. Month-end anchors clamp to the final calendar day without drifting subsequent anchors. Every intersecting solar-month and annual chart contributes, weighted by its share of the window. Birthdays do not leave gaps or reuse the previous annual chart.
- Output: five distinct domains ranked by their strongest supported monthly score. Headlines show that window, not a specific event day. Each month selects the strongest positive and negative domain. Opposing readings in one domain are explicitly marked mixed. Missing signals produce a clear no-signal message, not invented events.

All numerical weights, domain groupings, calendar aggregation and modern English phrasing are **editorial heuristics**, not a classical strength calculation or calibrated probabilities. Positive and negative evidence is retained in downloadable calculation JSON.

## Scope and accuracy

This is a **core Tajika subset**, not a full classical Varshaphala implementation. It does not elect the year/month lord, calculate Panchavargiya Bala, sahams, dashas, divisional confirmation or the full sixteen yogas. Geometric aspects are not tested for application, separation, prohibition or eventual perfection. The forecast is therefore incomplete by classical standards.

Astronomy Engine supplies astronomical positions, but the custom sidereal adjustment and ascendant have not been independently benchmarked against an ephemeris fixture set. Dates supported for birth: 1900–2100. Forecast must begin after birth and finish by 2100. Latitude is restricted to ±65°. Historical UTC offsets must be supplied manually. Indian city presets use +05:30, which is not correct for every historical date.

Astrological predictions are interpretations, not established future facts or scientifically validated forecasts. We do not generate death, disease, pregnancy, investment-return or other high-stakes event predictions. Direct wording must not be confused with measured certainty.

## Source references

Balabhadra, *Hayanaratna*, Martin Gansten's Sanskrit-English critical edition (Brill, 2020), accessible translation:

- Solar return, chapter 1.6: https://www.wisdomlib.org/hinduism/book/hayanaratna-the-jewel-of-annual-astrology/d/doc1500887.html
- Monthly 30-degree steps, chapter 8.2: https://www.wisdomlib.org/hinduism/book/hayanaratna-the-jewel-of-annual-astrology/d/doc1500994.html
- Planetary orbs, chapter 3.1: https://www.wisdomlib.org/hinduism/book/hayanaratna-the-jewel-of-annual-astrology/d/doc1500903.html
- Muntha, chapters 5.1 and 5.3: https://www.wisdomlib.org/hinduism/book/hayanaratna-the-jewel-of-annual-astrology/d/doc1500929.html and https://www.wisdomlib.org/hinduism/book/hayanaratna-the-jewel-of-annual-astrology/d/doc1500931.html
- Annual/monthly house judgements and conjunction of indications, chapter 8.6: https://www.wisdomlib.org/hinduism/book/hayanaratna-the-jewel-of-annual-astrology/d/doc1500998.html

Modern, nonliteral wording deliberately omits the source's severe deterministic claims. It should not be presented as a verbatim classical prediction.

## Code map

- `dist/engine.js`: birth chart, exported instant-based `chartAt` calculation and legacy natal reading API.
- `dist/forecast.js`: pure annual/monthly return solver, Tajika aspects, Muntha, evidence and report assembly.
- `dist/app.js`: form, SVG chart, forecast view and local downloads.
- `dist/styles.css`: responsive presentation.
- `dist/vendor/astronomy.js`: Astronomy Engine, MIT license retained. Source: https://github.com/cosinekitty/astronomy/blob/master/source/js/astronomy.browser.min.js
- `tests/`: UTC conversion, validation, ascendant geometry, house wrap, return residual, annual/monthly coverage, leap dates, Muntha, orbs, residence changes, evidence, ranking and mixed-signal tests.

Charts remain data-first, so a future optional 3D renderer can share the same model.

## Privacy and validation

No birth details are stored or sent to a backend. Computation happens in browser memory. A clearly labelled example loads first. The calculation download contains dates and chart coordinates, so users should treat it as personal data. Google Fonts is optional with system fallbacks; hosting may retain normal access logs.

Tests establish internal mathematical and behavioral consistency, not predictive accuracy. Next work: independent reference fixtures, historical timezone lookup, complete classical strength/year-lord/yoga implementations, expert rule review, and prospective evaluation that records both hits and misses.

## Major past turning points (v4)

The calendar scans completed solar-month windows from age twelve. It ranks up to ten distinct, non-routine event hypotheses and never reads a person's known life events. A graduation candidate means a completed major qualification, not school attendance. The rule catalogue also covers formal partnership, first substantial role, first child, major career and income changes, financial shocks, a serious home disruption and a sustained relationship rupture. Every claim must be checked against the actual event, consequence and window.

Stronger matches require two relevant domains in both annual and monthly return charts, distinct evidence from two named planets per chart and a net score of at least eight. Exploratory matches have a broader two-domain threshold and require partial stellar-period support. They are labeled separately; the extra entries have weaker evidential support. Selection allows up to two distinct claims per solar year, one of each one-time milestone, and at most four of a repeatable type separated by two years. Ten is a ceiling, not an accuracy claim.

Historical residences are unknown, so past returns use the birthplace. The calendar shows month-long windows rather than exact event days. A private local check against five user-supplied milestone windows matched **0/5** before this change; rerun the same check after changes. Benchmark dates remain outside the repository. The calculation is not independently validated as predictive.

`dist/history-worker.js` runs the scan in a module Web Worker. The calendar and review cards support match/miss/unsure feedback, optional notes and a JSON export, all kept in tab memory until refresh. Feedback never changes calculated claims.

## Partial KP timing check

`dist/kp.js` calculates nakshatra star/sub lords and Vimshottari major/sub periods from the natal Moon. Its event-house support currently uses the app’s approximate Lahiri longitudes and whole-sign natal houses. It does **not** calculate KP ayanamsa, Placidus cusps, cuspal sub-lord promises, node agency or ruling planets. It is a partial KP-inspired timing check, not an independent validation. The annual and monthly forecast cards show its support, mixed signal or lack of support. The past calendar ranks stronger Tajika matches first; lower-threshold exploratory matches need at least partial KP timing support and are identified as such. Ten is a maximum for profiles with enough candidates, never proof of ten actual events.

## Unified calendar interface

The past and next-year readings share one calendar section. It starts with the first calculated past candidate rather than birth or age twelve, and ends with the last forecast month. Past cards and future month details remain hidden until their calendar item is clicked; the five annual headlines stay above the calendar. Past review counts are in a disclosure below the detail panel.

On screens up to 760 px wide, selecting a calendar item opens its past review or future month in an animated bottom drawer. The drawer closes with its close button, backdrop, or Escape, and restores the calendar scroll position. Desktop keeps the inline detail panel. Review notes and verdicts use the same in-memory state in both views.
