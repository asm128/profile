# Homepage loading and rendering measurements

## What is measured

The profile homepage reports two live durations on every visit:

- **Navigation to profile DOM construction:** elapsed time from the browser's navigation time origin until the JavaScript renderer has constructed the header, services, evidence, studies and footer. This ends before browser layout and paint.
- **Profile DOM construction:** time spent inside the `DOMContentLoaded` handler constructing that content.

Both values come from the browser's monotonic `performance.now()` clock. The first includes the effects of the visitor's connection, GitHub Pages response, HTML parsing and script loading. The second isolates the small client-side DOM construction mechanism. Both stop before the WebGL cube is initialized. They are displayed as measurements from the current visit because network, cache, hardware, browser state and background activity can change them.

The implementation adds no timing package or analytics dependency. It reads the browser clock before and after the existing renderer and writes the results into the evidence metrics already being generated.

The two timing comparisons are calculated on each visit from those same durations:

- Navigation time is shown as a percentage below or above the [HTTP Archive's July 2025 median desktop DOMContentLoaded time of 2.6 seconds](https://httparchive.org/reports/loading-speed): `(1 - visit milliseconds / 2600) × 100`. This is indicative. HTTP Archive measures the browser's DOMContentLoaded event under its own test conditions, while this page's timer ends after the handler builds the profile DOM.
- DOM construction is shown as a share of this visit's navigation-to-DOM duration: `render milliseconds / navigation milliseconds × 100`. This compares two intervals from the same clock and visit, rather than claiming an industry benchmark for this renderer.

The reference median is fixed and cited; the displayed elapsed times, percentages and below/above wording are computed from the visitor's measurements. Neither timing comparison measures layout, paint or the cube's ongoing animation.

## Static payload

The homepage source at the 2026-10-09 repository revision requires nine same-origin files:

| Resource | Uncompressed bytes |
| --- | ---: |
| `index.html` | 822 |
| `profile.css` | 6,397 |
| `gl-matrix-min.js` | 52,466 |
| `gpk_engine.js` | 20,096 |
| `galaxy_explosion.js` | 6,852 |
| `galaxy_game.js` | 1,497 |
| `cube.js` | 14,170 |
| `dom.js` | 529 |
| `profile.js` | 14,178 |
| **Total** | **117,007 bytes / 114.26 KiB** |

The byte table uses the UTF-8, LF-normalized repository representation. The WebGL scene uses generated graphics rather than image payloads. Its matrix, engine, explosion, game and cube scripts contribute 95,081 bytes; all JavaScript together contributes 109,788 bytes. All resources are served locally: there are no image, web-font, framework or remote third-party requests. HTTP compression can reduce the transferred body further; the table deliberately uses the larger uncompressed source size. Protocol headers and the content of articles opened later are outside this homepage total.

The live metric discovers the set from the current document, stylesheet link and script elements. It uses decoded sizes already reported by Resource Timing and fetches only missing bodies through the browser cache. Local-file previews can expose neither complete Resource Timing bodies nor fetch access; in that environment the page uses the repository snapshot recorded in `profile.js` rather than publishing a partial total or an unavailable value. The table is a dated source snapshot; the live metric is measured independently on each visit and can differ until this revision is published.

## Comparison with the wider web

The [HTTP Archive 2025 Web Almanac page-weight study](https://almanac.httparchive.org/en/2025/page-weight) reports a median home-page weight of 2,862 KB on desktop and 2,559 KB on mobile. Its median desktop home page includes 697 KB of JavaScript, 82 KB of CSS, 139 KB of fonts and 1,058 KB of images.

Against the desktop median, this repository revision's 117,007 uncompressed bytes are:

- About **1/24.5 of the payload**.
- **95.91% smaller** at two-decimal display precision.
- Its 109,788 bytes of JavaScript are about **1/6.3 of the median desktop home page's JavaScript payload**.
- It uses nine same-origin source requests in total; the median September 2026 desktop page reported by [HTTP Archive's State of JavaScript](https://httparchive.org/reports/state-of-javascript) makes 23 JavaScript requests alone.

All calculations retain JavaScript's full floating-point precision until the display boundary. The smaller-than-median percentage normally uses two decimal places. If ordinary two-decimal rounding would produce the false claim `100.00% smaller`, the formatter adds decimal places until the displayed value is truthfully below 100%.

This is a comparison with the measured web median, not a claim that every individual website is heavier. Page weight also does not determine loading time by itself: latency, caching, server response, connection throughput and browser work all contribute. The payload difference establishes that this page gives those factors very little data and code to process.

## Observed GitHub Pages reloads

On 2026-09-29, five browser-observed reloads of the deployed page at `https://asm128.github.io/profile/` took:

```text
425 ms, 90 ms, 88 ms, 87 ms, 115 ms
```

The first sample was slower; the following cached reloads ranged from 87 to 115 ms. These wall-clock observations include browser-automation overhead and the cache state of that browser session, so they are recorded as an illustrative run rather than a durable benchmark. The live values on the homepage are the more useful result because each visitor sees the measurement for the environment actually loading the page.

The source-size comparison does not measure the cube's steady-state rendering cost. Once initialized, the cube requests animation frames continuously and refreshes its procedural texture at up to 30 frames per second. That ongoing CPU/GPU work is a deliberate demonstration cost rather than part of the DOM-construction timings above.

## Engineering consequence

The performance is a direct consequence of the architecture rather than a later optimization pass. The page has no framework runtime, build-generated bundle, image payload, web-font dependency, remote third-party request or duplicated article markup. The matrix library and cube renderer produce an inspectable WebGL artifact with an animated texture generated at runtime. Structured content is parsed once and rendered by a small shared mechanism. Adding an article changes a data entry while leaving the renderer unchanged.

This spends fewer budgets simultaneously: fewer bytes transferred, fewer requests, less JavaScript to parse and execute, less code to maintain, fewer dependencies to update or trust, and less machinery between a content change and its visible result.
