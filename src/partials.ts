// Loaded as a plain script in <head>, before the body is parsed. It swaps the
// header and footer placeholders for this session's cached copies (saved by
// site.ts) the moment the parser creates them, so the very first frame of a
// page, and the view transition into it, already shows them. Without this
// they would appear only after site.ts has fetched them, a visible pop on
// every page change. On a first visit there is no cache yet and site.ts
// fetches them as before.
(() => {
  const prefix = "latexdo:partial:";
  const attributes = ["data-header-src", "data-footer-src"];
  let cache: Storage;
  try {
    cache = window.sessionStorage;
  } catch {
    return;
  }

  const swap = (placeholder: Element): void => {
    for (const attribute of attributes) {
      const source = placeholder.getAttribute(attribute);
      if (source === null) continue;
      const html = cache.getItem(prefix + source);
      if (html && placeholder.isConnected) placeholder.outerHTML = html;
      return;
    }
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) {
        if (node instanceof Element && attributes.some((attribute) => node.hasAttribute(attribute))) {
          swap(node);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", () => observer.disconnect(), { once: true });
})();
