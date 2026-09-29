"use strict";

function renderArticle(data) {
  document.title = data.title;
  const header = document.getElementById("article-header");
  for(const [title, url] of Object.entries(data.navigation))
    header.append(link(title, url));
  const main = document.getElementById("article-main");
  main.append(element("h1", "", data.title));
  main.append(element("p", "label", data.subtitle));
  for(const section of data.sections) {
    const container = element("section");
    container.append(element("h2", "", section.title));
    for(const block of section.blocks) {
      if(block.type === "paragraph")
        container.append(element("p", "", block.text));
      else if(block.type === "list") {
        const list = element(block.ordered ? "ol" : "ul");
        for(const item of block.items) {
          const entry = element("li");
          appendTextParts(entry, item);
          list.append(entry);
        }
        container.append(list);
      }
      else if(block.type === "positions") {
        for(const position of block.items) {
          const entry = element("div", "cv-position");
          entry.append(element("h3", "", position.title));
          if(position.role)
            entry.append(element("p", "role", position.role));
          const list = element("ul");
          for(const item of position.details) {
            const detail = element("li");
            appendTextParts(detail, item);
            list.append(detail);
          }
          entry.append(list);
          container.append(entry);
        }
      }
      else if(block.type === "table") {
        const table = element("table", "article-table");
        const head = element("thead");
        const headings = element("tr");
        for(const title of block.columns) {
          const cell = element("th", "", title);
          cell.scope = "col";
          headings.append(cell);
        }
        head.append(headings);
        table.append(head);
        const body = element("tbody");
        for(const row of block.rows) {
          const cells = element("tr");
          for(const value of row)
            cells.append(element("td", "", value));
          body.append(cells);
        }
        table.append(body);
        container.append(table);
      }
      else if(block.type === "links") {
        const list = element("ul");
        for(const [title, url] of Object.entries(block.items)) {
          const item = element("li");
          item.append(link(title, url));
          list.append(item);
        }
        container.append(list);
      }
    }
    main.append(container);
  }
}

function appendTextParts(target, value) {
  if(typeof value === "string") {
    target.textContent = value;
    return;
  }
  for(const part of value.parts) {
    if(part.url)
      target.append(link(part.text, part.url));
    else if(part.code)
      target.append(element("code", "", part.code));
    else
      target.append(part.text);
  }
}

document.addEventListener("DOMContentLoaded", () => renderArticle(JSON.parse(articleJSON)));
