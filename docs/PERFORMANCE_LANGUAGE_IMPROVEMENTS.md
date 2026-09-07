# Elite Cars — Performance & Language Improvements

Applied without changing the visual design, page structure, business features, or existing content flow.

## Performance
- Converted route pages to React lazy loading so the initial bundle does not load every page at startup.
- Added Suspense around routes without changing the visible page design.
- Added native lazy loading + async image decoding to non-critical images.
- Marked the hero background image as high priority while keeping the secondary hero image lazy.
- Removed the extra Admin Dashboard `/cars` request: car statistics are now calculated from the same cars response.
- Changed route-change scrolling from smooth animation to instant scrolling to avoid unnecessary animation work.

## Language
- Kept Arabic as the default language.
- English now switches the document language and direction (`en`/`ltr`) and updates page metadata/title.
- Improved the existing runtime translation system so dynamic React content is translated without rescanning the entire document after every DOM mutation.
- Added translations for missing UI labels, automotive values, statuses, brands, buttons, messages, and common dynamic content.
- English number/date formatting is used in the profile, car details, car cards, and statistics.
- Known Arabic automotive data values such as fuel type, body type, transmission, colors, and brands are translated when English is selected.
- Accessibility attributes such as `title`, `aria-label`, `placeholder`, and `alt` are translated as well.

## Important
The source project does not contain a chart library/chart component. The statistics section is made from counters/cards and is covered by the language changes.

Arbitrary user-entered/database prose (for example a custom car description written in Arabic) is not machine-translated because doing so would require an external translation service and could alter actual business data.

## Verification
- Source changes were reviewed for import/path consistency.
- Frontend dependency installation/build could not be completed in this environment because npm dependency retrieval timed out / required a package that was not cached.
- Run `npm install` then `npm run build` locally to generate a fresh production bundle.
