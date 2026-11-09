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

## Major past turning points (v3)

The retrospective catalogue excludes schooling, college, exams, ordinary learning, routine raises, normal purchases and bills, minor disagreements, project starts without consequences, and everyday workload. Age is an exclusion filter only, never evidence for an event. There is no target of ten: zero to ten candidates is valid, with no generic fallback.

`dist/history.js` scans completed monthly return periods from age twelve to today. Each editorial event rule requires two relevant domains in both annual and monthly charts, a net score of at least one in every required domain/chart, at least two distinct supporting reasons and two named planets per chart, and combined net score of at least eight. Duplicating a single aspect across two domains cannot pass the independent-evidence gate. Weak, mixed and one-domain signals fail. These weights are unvalidated editorial filters, not classical strength measurements or probability estimates.

Six major-event hypotheses are available: a joint career/income leap, a serious work/income reversal, an independent venture becoming meaningful income, a substantial financial shock, an unplanned loss of a settled living arrangement, and a sustained relationship rupture affecting home life. Dates, actual consequences and strict routine-event exclusions must all fit for a user-marked match. More specific language does not prove that chart factors uniquely identify these events. The catalogue contains no death, illness or other dramatic high-stakes fabrication.

Selection permits at most one event per solar year and two per type, separated by at least three solar years. Stronger qualifying candidates rank first, with a small temporal-separation preference. Adult events are excluded below eighteen; only a major home disruption is eligible for childhood. A narrow catalogue and strict thresholds may legitimately return no candidates.

The calculation still has all earlier Tajika-core limitations. Historical residence is unknown, so past returns use birth coordinates. That assumption can materially change chart houses for people who moved. Do not label retrospective matches as evidence of unique or validated predictive accuracy.

`dist/history-worker.js` runs in a module Web Worker. A new birth profile terminates the old scan. `dist/history-view.js` renders a keyboard-accessible timeline, detailed cards, separate match/miss/unsure counts and notes. User feedback never reranks or changes a claim. The graph uses only self-reported impact ratings, with unrated points in a separate band. It is not a life-success score.

All answers stay in tab memory. Refresh or changed birth data clears them. Same-profile resubmission on the same day preserves the review. The local JSON export includes original hypotheses, evidence, criteria and feedback, without server transmission.

The calendar displays solar-month windows rather than invented exact dates. Candidate types now include a marriage or formal partnership, a completed major qualification, the first substantial paid role and a first child alongside major career and financial changes. No known biography is loaded into the engine. A private local check against five user-supplied milestone windows matched **0/5**. The benchmark dates are deliberately excluded from the repository. This is a failed validation case, not evidence of predictive accuracy; the exact day cannot be inferred from this calculation.
