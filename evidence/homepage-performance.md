# Homepage loading and rendering measurements

## What is measured

The profile homepage reports two live durations on every visit:

- **Navigation to profile DOM construction:** elapsed time from the browser's navigation time origin until the JavaScript renderer has constructed the header, services, evidence, studies and footer. This ends before browser layout and paint.
- **Profile DOM construction:** time spent inside the `DOMContentLoaded` handler constructing that content.

Both values come from the browser's monotonic `performance.now()` clock. The first includes the effects of the visitor's connection, GitHub Pages response, HTML parsing and script loading. The second isolates the small client-side rendering mechanism. They are displayed as measurements from the current visit because network, cache, hardware, browser state and background activity can change them.

The implementation adds no timing package or analytics dependency. It reads the browser clock before and after the existing renderer and writes the results into the evidence metrics already being generated.

## Static payload

The homepage currently requires four first-party files:

| Resource | Uncompressed bytes |
| --- | ---: |
| `index.html` | 579 |
| `profile.css` | 2,893 |
| `dom.js` | 529 |
| `profile.js` | 7,381 |
| **Total** | **11,382 bytes / 11.1 KiB** |

There are no homepage image, font, framework or third-party script downloads. HTTP compression can reduce the transferred body further; the table deliberately uses the larger uncompressed source size. Protocol headers and the content of articles opened later are outside this homepage total.

## Comparison with the wider web

The [HTTP Archive 2025 Web Almanac page-weight study](https://almanac.httparchive.org/en/2025/page-weight) reports a median home-page weight of 2,862 KB on desktop and 2,559 KB on mobile. Its median desktop home page includes 697 KB of JavaScript, 82 KB of CSS, 139 KB of fonts and 1,058 KB of images.

Against the desktop median, this homepage's 11,382 uncompressed bytes are:

- About **1/252 of the payload**.
- Approximately **99.6% smaller**.
- Its 7,910 bytes of JavaScript are about **1/88 of the median desktop home page's JavaScript payload**.
- It uses four first-party resource requests in total; the median September 2026 desktop page reported by [HTTP Archive's State of JavaScript](https://httparchive.org/reports/state-of-javascript) makes 23 JavaScript requests alone.

This is a comparison with the measured web median, not a claim that every individual website is heavier. Page weight also does not determine loading time by itself: latency, caching, server response, connection throughput and browser work all contribute. The payload difference establishes that this page gives those factors very little data and code to process.

## Observed GitHub Pages reloads

On 2026-09-29, five browser-observed reloads of the deployed page at `https://asm128.github.io/profile/` took:

```text
425 ms, 90 ms, 88 ms, 87 ms, 115 ms
```

The first sample was slower; the following cached reloads ranged from 87 to 115 ms. These wall-clock observations include browser-automation overhead and the cache state of that browser session, so they are recorded as an illustrative run rather than a durable benchmark. The live values on the homepage are the more useful result because each visitor sees the measurement for the environment actually loading the page.

## Engineering consequence

The performance is a direct consequence of the architecture rather than a later optimization pass. The page has no framework runtime, build-generated bundle, image payload, web-font dependency or duplicated article markup. Structured content is parsed once and rendered by a small shared mechanism. Adding an article changes a data entry while leaving the renderer unchanged.

This spends fewer budgets simultaneously: fewer bytes transferred, fewer requests, less JavaScript to parse and execute, less code to maintain, fewer dependencies to update or trust, and less machinery between a content change and its visible result.
