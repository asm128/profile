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
  result.href = url;
  return result;
};
