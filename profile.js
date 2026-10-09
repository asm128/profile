"use strict";

const profileJSON = `{
  "name": "Factor Nine",
  "email": "rgbvillain@gmail.com",
  "navigation": {
    "Services": "#services",
    "Studies": "#studies"
  },
  "hero": {
    "label": "Independent systems consulting",
    "title": "Make complex software cheaper to change.",
    "introduction": "I make software simpler to build, maintain, and change.",
    "experience": {"value": "20+ years", "description": "Software development"},
    "actions": [
      {"title": "Discuss a system", "url": "mailto:rgbvillain@gmail.com?subject=Systems consulting"}
    ]
  },
  "site": {
    "title": "This website",
    "metrics": {
      "navigation_time": {"value": "Measuring…", "description": "Navigation start → profile DOM ready", "comparison": {"value": "Comparing…", "description": "Indicative vs 2.6 s desktop median DOMContentLoaded (Jul 2025)", "source": "https://httparchive.org/reports/loading-speed"}},
      "render_time": {"value": "Measuring render…", "description": "Profile JSON → rendered DOM", "comparison": {"value": "Comparing…", "description": "Share of this visit’s navigation-to-DOM time"}},
      "source_size": {"value": "Measuring size…", "description": "Homepage source, uncompressed"},
      "size_comparison": {"value": "Comparing size…", "description": "Versus 2,862 KB desktop median (2025)"}
    }
  },
  "services": {
    "id": "services",
    "label": "Services",
    "title": "Problems I can help solve",
    "items": {
      "Architecture assessment": "Map ownership, dependencies, failure paths and development costs, then produce a practical improvement plan.",
      "Incremental refactoring": "Extract portable mechanisms and remove duplication without requiring a wholesale rewrite or framework replacement.",
      "Systems implementation": "Build libraries, graphics and simulation systems, firmware, websites and backend services, plus the diagnostics and configuration tools that support them."
    }
  },
  "evidence": {
    "label": "Recorded evidence",
    "title": "Selected codebases",
    "repositories": {
      "framework": {"label": "High-performance framework", "value": "1,277 commits / 46,911 LoC", "description": "403 source files · 24 projects · 2018–2026", "source": "./evidence/repository-history.md"},
      "persistent_data": {"label": "Persistent data system", "value": "122 commits / 1,859 LoC", "description": "12 source files · 5 projects · 2019–2026", "source": "./evidence/repository-history.md"},
      "firmware": {"label": "Firmware codebase", "value": "693 commits / 8,986 LoC", "description": "2 histories · 81 source files · 5 components · 2022–2024", "source": "./analysis/spaceai-firmware/README.md#measured-scope"}
    }
  },
  "studies": {
    "id": "studies",
    "label": "Technical studies",
    "title": "Architecture, history and evidence",
    "subsections": [
      {
        "title": "Programming practice",
        "articles": {
          "Programming conventions and their reasoning": "./programming-conventions.md",
          "When library diagnostics become a test framework": "./when-library-diagnostics-become-a-test-framework.md",
          "The cost of unnecessary engineering: a homepage case study": "./homepage-case-study.html",
          "Every engineering choice spends or saves a budget": "./every-choice-has-a-cost.md"
        }
      },
      {
        "title": "Architecture and evolution",
        "articles": {
          "Firmware system analysis": "./analysis/spaceai-firmware/README.md",
          "System evolution": "./analysis/spaceai-firmware/system-evolution.md",
          "Final system inventory": "./analysis/spaceai-firmware/final-system-inventory.md",
          "Settings and remote management": "./analysis/spaceai-firmware/settings-and-remote-management.md",
          "NIO packet endpoint": "./analysis/spaceai-firmware/packet-endpoint.md",
          "Development lineage": "./analysis/spaceai-firmware/lineage-from-gpftw-to-firmware.md",
          "Architecture versus established frameworks": "./analysis/spaceai-firmware/architecture-versus-frameworks.md"
        }
      },
      {
        "title": "Development evidence",
        "layout": "evidence-columns",
        "articles": {
          "Manual allocation and ownership audit": "./evidence/manual-allocation-audit.md",
          "Repository history scope and counts": "./evidence/repository-history.md",
          "Homepage loading and rendering measurements": "./evidence/homepage-performance.md",
          "RGB commit evidence": "./evidence/rgb-commit-analysis.md",
          "RGB final code review": "./evidence/rgb-final-code-review.md",
          "RGB tutorial repository": "https://github.com/RGBVillain/rgb_tutorial",
          "RGB library repository": "https://github.com/RGBVillain/rgblib",
          "Graphics 101 transcript notes": "./evidence/T03-graphics-101-02-extracted-notes.md",
          "Native Windows API video notes": "./evidence/T04-windows-api-extracted-notes.md",
          "Computación Gráfica playlist inventory": "./evidence/V17-computacion-grafica-playlist-notes.md",
          "Original firmware history": "./evidence/firmware-main-spaceai-log-review.md",
          "Firmware workspace continuation": "./evidence/firmwareworks-log-review.md"
        }
      }
    ]
  }
}`;

const profile = JSON.parse(profileJSON);
const homepageSourceSnapshot = {bytes: 117007.0, count: 9};

const appendSectionHeading = (section, data) => {
  section.append(element("div", "label", data.label));
  section.append(element("h2", "", data.title));
};

const homepageSourceSize = async () => {
  const normalizeURL = value => {
    const result = new URL(value, document.baseURI);
    result.hash = "";
    return result.href;
  };
  const sourceURLs = new Set([normalizeURL(location.href)]);
  for(const resource of document.querySelectorAll('link[rel~="stylesheet"][href], script[src]'))
    sourceURLs.add(normalizeURL(resource.href || resource.src));
  const measuredSizes = new Map();
  const navigation = performance.getEntriesByType("navigation")[0];
  const resources = performance.getEntriesByType("resource");
  for(const entry of navigation ? [navigation, ...resources] : resources)
    if(entry.decodedBodySize > 0)
      measuredSizes.set(normalizeURL(entry.name), entry.decodedBodySize);
  const missingURLs = [...sourceURLs].filter(url => !measuredSizes.has(url));
  const responses = await Promise.all(missingURLs.map(url => fetch(url, {cache: "force-cache"})));
  if(responses.some(response => !response.ok))
    return;
  const bodies = await Promise.all(responses.map(response => response.arrayBuffer()));
  for(let iBody = 0; iBody < bodies.length; ++iBody)
    measuredSizes.set(missingURLs[iBody], bodies[iBody].byteLength);
  const bytes = [...sourceURLs].reduce((total, url) => total + measuredSizes.get(url), 0);
  return {bytes, count: sourceURLs.size, live: true};
};

const formatSmallerPercentage = value => {
  let decimals = 2;
  while(100 <= Number(value.toFixed(decimals)))
    ++decimals;
  return value.toFixed(decimals);
};

const desktopMedianDOMContentLoadedMs = 2600.0; // HTTP Archive, July 2025 desktop p50.

document.addEventListener("DOMContentLoaded", () => {
  const renderStarted = performance.now();
  const main = document.getElementById("site-main");
  const hero = element("div", "hero");
  const heroCopy = element("div", "hero-copy");
  heroCopy.append(element("div", "eyebrow", profile.hero.label));
  heroCopy.append(element("h1", "", profile.hero.title));
  heroCopy.append(element("p", "intro", profile.hero.introduction));
  const experience = element("p", "hero-experience");
  experience.append(element("strong", "", profile.hero.experience.value), " · " + profile.hero.experience.description);
  heroCopy.append(experience);
  const actions = element("div", "actions");
  for(const action of profile.hero.actions)
    actions.append(link(action.title, action.url, "button" + (action.secondary ? " secondary" : "")));
  heroCopy.append(actions);
  hero.append(heroCopy);

  const cubeFigure = element("figure", "hero-cube");
  const cubeCanvas = element("canvas");
  cubeCanvas.id = "webgl-canvas";
  cubeCanvas.width = 240;
  cubeCanvas.height = 240;
  cubeCanvas.setAttribute("role", "img");
  cubeCanvas.setAttribute("aria-label", "Rotating WebGL cube with an animated circuit texture");
  const cubeStats = element("figcaption", "cube-stats");
  const cubeFps = element("span", "", "FPS —");
  cubeFps.id = "cube-fps";
  const cubeFrameTime = element("span", "", "Frame — ms");
  cubeFrameTime.id = "cube-frame-time";
  const cubeTooltip = element("span", "cube-tooltip", "FPS — · Frame — ms");
  cubeTooltip.id = "cube-tooltip";
  cubeTooltip.setAttribute("aria-hidden", "true");
  cubeStats.append(cubeFps, cubeFrameTime);
  cubeFigure.append(cubeCanvas, cubeStats, cubeTooltip);
  hero.append(cubeFigure);
  main.append(hero);

  const site = element("section", "site-diagnostics");
  site.append(element("h2", "", profile.site.title));
  const metrics = element("div", "metrics");
  const metricValues = {};
  const metricDescriptions = {};
  const metricComparisons = {};
  for(const [id, data] of Object.entries(profile.site.metrics)) {
    const metric = element("div", "metric");
    const metricValue = element("strong", "", data.value);
    const metricDescription = data.source
      ? link(data.description, data.source, "metric-source")
      : element("span", "", data.description);
    metricValues[id] = metricValue;
    metricDescriptions[id] = metricDescription;
    metric.append(metricValue, metricDescription);
    if(data.comparison) {
      const comparison = element("div", "metric-comparison");
      const comparisonValue = element("strong", "", data.comparison.value);
      const comparisonDescription = data.comparison.source
        ? link(data.comparison.description, data.comparison.source, "metric-source")
        : element("span", "", data.comparison.description);
      metricComparisons[id] = comparisonValue;
      comparison.append(comparisonValue, comparisonDescription);
      metric.append(comparison);
    }
    metrics.append(metric);
  }
  site.append(metrics);
  main.append(site);

  const services = element("section");
  services.id = profile.services.id;
  appendSectionHeading(services, profile.services);
  const serviceGrid = element("div", "grid");
  for(const [title, description] of Object.entries(profile.services.items)) {
    const card = element("div", "card");
    card.append(element("h3", "", title));
    card.append(element("p", "", description));
    serviceGrid.append(card);
  }
  services.append(serviceGrid);
  main.append(services);

  const evidence = element("section");
  appendSectionHeading(evidence, profile.evidence);
  const repositoryList = element("ul", "repository-list");
  for(const data of Object.values(profile.evidence.repositories)) {
    const item = element("li", "repository");
    item.append(element("span", "repository-name", data.label));
    item.append(element("strong", "", data.value));
    item.append(link(data.description, data.source, "metric-source"));
    repositoryList.append(item);
  }
  evidence.append(repositoryList);
  main.append(evidence);

  const studies = element("section");
  studies.id = profile.studies.id;
  appendSectionHeading(studies, profile.studies);
  const articleColumns = element("div", "articles");
  for(const subsection of profile.studies.subsections) {
    const group = element("details", `article-group ${subsection.layout || ""}`.trim());
    const summary = element("summary");
    summary.append(element("h3", "", subsection.title));
    summary.append(element("span", "article-count", `${Object.keys(subsection.articles).length} articles`));
    group.append(summary);
    const list = element("ul");
    for(const [title, url] of Object.entries(subsection.articles)) {
      const item = element("li");
      item.append(link(title, url));
      list.append(item);
    }
    group.append(list);
    articleColumns.append(group);
  }
  studies.append(articleColumns);
  main.append(studies);

  const footer = document.getElementById("site-footer");
  const identity = element("div", "footer-identity");
  identity.append(link(profile.name, "./index.html", "name"), " · ", link(profile.email, "mailto:" + profile.email));
  const navigation = element("nav");
  for(const [title, url] of Object.entries(profile.navigation))
    navigation.append(link(title, url));
  footer.append(identity, navigation);

  const renderFinished = performance.now();
  const renderDuration = renderFinished - renderStarted;
  metricValues.navigation_time.textContent = `${renderFinished.toFixed(2)} ms`;
  metricValues.render_time.textContent = `${renderDuration.toFixed(2)} ms`;
  const navigationDifference = (1.0 - renderFinished / desktopMedianDOMContentLoadedMs) * 100.0;
  const navigationPercentage = navigationDifference >= 0
    ? formatSmallerPercentage(navigationDifference)
    : Math.abs(navigationDifference).toFixed(2);
  metricComparisons.navigation_time.textContent = `${navigationPercentage}% ${navigationDifference >= 0 ? "below" : "above"} median`;
  metricComparisons.render_time.textContent = renderFinished > 0
    ? `${(renderDuration / renderFinished * 100.0).toFixed(2)}% of total`
    : "Unavailable";
  window.addEventListener("load", async () => {
    const sizeMetric = metricValues.source_size;
    const comparisonMetric = metricValues.size_comparison;
    let source;
    try {
      source = await homepageSourceSize();
    }
    catch {
    }
    if(!(source?.bytes > 0))
      source = homepageSourceSnapshot;
    const difference = (1.0 - source.bytes / 2862000.0) * 100.0; // 2025 HTTP Archive desktop median, in bytes.
    const percentage = difference >= 0 ? formatSmallerPercentage(difference) : Math.abs(difference).toFixed(2);
    sizeMetric.textContent = `${(source.bytes / 1024.0).toFixed(2)} KiB`;
    metricDescriptions.source_size.textContent = `${source.count} ${source.live ? "same-origin" : "published"} source files, uncompressed`;
    comparisonMetric.textContent = `${percentage}% ${difference >= 0 ? "smaller" : "larger"}`;
  }, {once: true});
  initLogo();
});
