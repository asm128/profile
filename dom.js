"use strict";

const element = (tagName, className, text) => {
  const result = document.createElement(tagName);
  if(className)
    result.className = className;
  if(undefined !== text)
    result.textContent = text;
  return result;
};

const link = (title, url, className) => {
  const result = element("a", className, title);
  const markdown = /^\.\/(.+\.md)(#.*)?$/.exec(url);
  result.href = markdown
    ? `https://github.com/asm128/profile/blob/master/${markdown[1]}${markdown[2] || ""}`
    : url;
  return result;
};
