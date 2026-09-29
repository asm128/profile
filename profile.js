"use strict";

const profileJSON = `{
  "name": "Pablo Zorrilla",
  "email": "pabloaz@gmail.com",
  "navigation": {
    "Services": "#services",
    "Studies": "#studies",
    "CV": "./cv.html"
  },
  "hero": {
    "label": "Independent systems consulting",
    "title": "Make complex software cheaper to change.",
    "introduction": "I help teams improve C and C++ architecture, recover ownership of their data, reduce unnecessary dependencies, and turn repeated work into reusable mechanisms.",
    "actions": [
      {"title": "Discuss a system", "url": "mailto:pabloaz@gmail.com?subject=Systems consulting"},
      {"title": "Read my CV", "url": "./cv.html", "secondary": true}
    ]
  },
  "services": {
    "id": "services",
    "label": "Services",
    "title": "Problems I can help solve",
    "items": {
      "Architecture assessment": "Map ownership, dependencies, failure paths and development costs, then produce a practical improvement plan.",
      "Incremental refactoring": "Extract portable mechanisms and remove duplication without requiring a wholesale rewrite or framework replacement.",
      "Systems implementation": "Build C++ libraries, graphics and simulation systems, firmware, diagnostics, configuration and supporting tools."
    }
  },
  "evidence": {
    "label": "Recorded evidence",
    "title": "Work that can be inspected",
    "metrics": {
      "20+ years": "Software development",
      "693 commits": "Reviewed firmware history",
      "8,986 lines": "Final firmware ecosystem reviewed",
      "92 commits": "CED graphics prototype, Jan 8–31 2020",
      "Measuring…": "This visit: navigation to profile DOM construction",
      "Measuring render…": "This visit: profile DOM construction",
      "11.1 KiB": "Uncompressed homepage source",
      "99.6% smaller": "Than the 2025 median desktop home page"
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
          "The cost of unnecessary engineering: a homepage case study": "./homepage-case-study.html",
          "Every engineering choice spends or saves a budget": "./every-choice-has-a-cost.md"
        }
      },
      {
        "title": "Architecture and evolution",
        "articles": {
          "SpaceAI firmware system analysis": "./analysis/spaceai-firmware/README.md",
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
        "articles": {
          "Manual allocation and ownership audit": "./evidence/manual-allocation-audit.md",
          "Homepage loading and rendering measurements": "./evidence/homepage-performance.md",
          "RGB commit evidence": "./evidence/rgb-commit-analysis.md",
          "RGB final code review": "./evidence/rgb-final-code-review.md",
          "Graphics 101 transcript notes": "./evidence/T03-graphics-101-02-extracted-notes.md",
          "Native Windows API video notes": "./evidence/T04-windows-api-extracted-notes.md",
          "Computación Gráfica playlist inventory": "./evidence/V17-computacion-grafica-playlist-notes.md",
          "Firmware Main SpaceAI history": "./evidence/firmware-main-spaceai-log-review.md",
          "FirmwareWorks continuation": "./evidence/firmwareworks-log-review.md"
        }
      }
    ]
  }
}`;

const profile = JSON.parse(profileJSON);

const appendSectionHeading = (section, data) => {
  section.append(element("div", "label", data.label));
  section.append(element("h2", "", data.title));
};

document.addEventListener("DOMContentLoaded", () => {
  const renderStarted = performance.now();
  const header = document.getElementById("site-header");
  header.append(link(profile.name, "./index.html", "name"));
  const navigation = element("nav");
  for(const [title, url] of Object.entries(profile.navigation))
    navigation.append(link(title, url));
  header.append(navigation);

  const main = document.getElementById("site-main");
  const hero = element("div", "hero");
  hero.append(element("div", "eyebrow", profile.hero.label));
  hero.append(element("h1", "", profile.hero.title));
  hero.append(element("p", "intro", profile.hero.introduction));
  const actions = element("div", "actions");
  for(const action of profile.hero.actions)
    actions.append(link(action.title, action.url, "button" + (action.secondary ? " secondary" : "")));
  hero.append(actions);
  main.append(hero);

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
  const metrics = element("div", "metrics");
  const metricValues = {};
  for(const [value, description] of Object.entries(profile.evidence.metrics)) {
    const metric = element("div", "metric");
    const metricValue = element("strong", "", value);
    metricValues[description] = metricValue;
    metric.append(metricValue);
    metric.append(element("span", "", description));
    metrics.append(metric);
  }
  evidence.append(metrics);
  main.append(evidence);

  const studies = element("section");
  studies.id = profile.studies.id;
  appendSectionHeading(studies, profile.studies);
  const articleColumns = element("div", "articles");
  for(const subsection of profile.studies.subsections) {
    const group = element("div", "article-group");
    group.append(element("h3", "", subsection.title));
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
  footer.append(profile.name + " · ");
  footer.append(link(profile.email, "mailto:" + profile.email));
  footer.append(" · ");
  footer.append(link("Curriculum vitae", "./cv.html"));

  const renderFinished = performance.now();
  metricValues["This visit: navigation to profile DOM construction"].textContent = `${renderFinished.toFixed(1)} ms`;
  metricValues["This visit: profile DOM construction"].textContent = `${(renderFinished - renderStarted).toFixed(1)} ms`;
});
