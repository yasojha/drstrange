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

## Life-so-far review

`dist/history.js` now scans annual and completed monthly return charts from age five through the present. It selects up to ten past-event hypotheses with dates, age, plain-language details and explicit match criteria. The calculations use the existing Tajika core rules, with a stricter filter: annual and monthly signals must agree, exceed the opposite polarity and meet the minimum weights. Selection allows at most one event per solar year and two per claim type, with a small preference for temporal separation. This is not a complete biography or a claim that those events occurred.

Work, money and adult relationship claims are excluded below eighteen. Childhood claims cover home and learning. If fewer than ten eligible years/signals exist, the app says so and shows fewer events. It never pads a child's report with adult events or includes a date window extending into the future. The current partial solar month is excluded.

Historical residence is unknown, so all past returns use birth coordinates. This assumption can change the interpretation substantially for someone who moved. The event templates add editorial specificity and have not been empirically validated. Similar descriptions can fit many people; matches do not prove that a chart uniquely identifies the person. Repeated trials and memory bias can inflate apparent agreement.

`dist/history-worker.js` runs the full scan in a module Web Worker so the chart and forecast remain usable. Submitting another birth profile terminates the old scan. `dist/history-view.js` renders the interactive, keyboard-accessible timeline and review cards. Matches, misses, uncertainty and unreviewed events are counted separately. Claims are generated before feedback and never adapted to it.

The optional vertical progress display uses only the person's own impact ratings (step forward, no major change, setback). Unrated events sit in a separate band. Lines connect adjacent rated events only, leaving gaps for unreviewed events. Points are slightly staggered within categorical bands to reduce overlap. This is a subjective event-impact display, not a measured life-success curve.

Feedback and notes remain in tab memory. Refreshing or changing birth details clears them. Resubmitting the same birth profile on the same day preserves the review. The local JSON download includes the original claims, calculation evidence, notes, verdicts and review counts. No feedback is sent to a server or used to tune later forecasts.
