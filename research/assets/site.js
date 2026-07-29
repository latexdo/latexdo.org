function query(selector) {
  return document.querySelector(selector);
}

function queryAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}

const siteIconPaths = {
  Product: `<path d="M4 7h16" /><path d="M7 7v12h10V7" /><path d="M9 7V5h6v2" />`,
  Resources: `<circle cx="12" cy="12" r="8" /><path d="m15 9-2 5-5 2 2-5 5-2Z" />`,
  Research: `<path d="M9 3h6" /><path d="M10 3v5l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3" /><path d="M8.5 14h7" />`,
  Organization: `<path d="M4 20h16" /><path d="M6 20V5h9v15" /><path d="M15 10h3v10" /><path d="M9 9h3" /><path d="M9 13h3" /><path d="M9 17h3" />`,
  Community: `<path d="M16 11a3 3 0 1 0-6 0" /><path d="M7 20a5 5 0 0 1 10 0" /><path d="M6 12a2 2 0 1 0 0-4" /><path d="M18 8a2 2 0 1 0 0 4" /><path d="M3 20a4 4 0 0 1 4-4" /><path d="M17 16a4 4 0 0 1 4 4" />`,
  Download: `<path d="M12 4v10" /><path d="m8 10 4 4 4-4" /><path d="M5 20h14" />`,
  Editor: `<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13 7 4 4" />`,
  CLI: `<rect x="4" y="5" width="16" height="14" rx="2" /><path d="m8 10 3 3-3 3" /><path d="M13 16h3" />`,
  Desktop: `<rect x="4" y="5" width="16" height="11" rx="2" /><path d="M8 20h8" /><path d="M12 16v4" />`,
  About: `<circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" />`,
  Docs: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M8 7h8" /><path d="M8 11h8" />`,
  Downloads: `<path d="M12 4v10" /><path d="m8 10 4 4 4-4" /><path d="M5 20h14" />`,
  Store: `<path d="M5 10h14l-1 10H6L5 10Z" /><path d="M8 10a4 4 0 0 1 8 0" />`,
  Benchmarks: `<path d="M4 19V5" /><path d="M4 19h16" /><rect x="7" y="11" width="3" height="5" rx="1" /><rect x="12" y="8" width="3" height="8" rx="1" /><rect x="17" y="6" width="3" height="10" rx="1" />`,
  Compiler: `<path d="m10 8-4 4 4 4" /><path d="m14 8 4 4-4 4" /><path d="M12 5l-2 14" />`,
  "Knowledge Graph": `<circle cx="6" cy="7" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="12" cy="17" r="2" /><path d="M8 8l3 7" /><path d="M16 8l-3 7" /><path d="M8 7h8" />`,
  AI: `<path d="M12 3v3" /><path d="M12 18v3" /><path d="M3 12h3" /><path d="M18 12h3" /><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M10 14l2-5 2 5" /><path d="M10.8 12.5h2.4" />`,
  Sitemap: `<path d="M12 4v5" /><path d="M6 14v-3h12v3" /><rect x="9" y="2" width="6" height="4" rx="1" /><rect x="3" y="14" width="6" height="6" rx="1" /><rect x="15" y="14" width="6" height="6" rx="1" />`,
  Privacy: `<rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />`,
  Terms: `<path d="M7 3h7l4 4v14H7V3Z" /><path d="M14 3v5h5" /><path d="M10 12h6" /><path d="M10 16h6" />`,
  Contact: `<rect x="4" y="6" width="16" height="12" rx="2" /><path d="m4 8 8 6 8-6" />`,
  Source: `<circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><circle cx="6" cy="18" r="2" /><path d="M6 8v8" /><path d="M8 18h6a4 4 0 0 0 4-4V8" />`,
  Donate: `<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />`,
  LinkedIn: `<rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 11v5" /><path d="M8 8h.01" /><path d="M12 16v-5" /><path d="M16 16v-3a2 2 0 0 0-4 0" />`,
};

function createSiteIcon(className, icon) {
  const iconEl = document.createElement("span");
  iconEl.className = className;
  iconEl.setAttribute("aria-hidden", "true");
  iconEl.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${icon}</svg>`;
  return iconEl;
}

function initNavigation() {
  const toggle = query("[data-nav-toggle]");
  const links = query("[data-nav-links]");
  if (!toggle || !links) return;

  queryAll(".nav-links a").forEach((link) => {
    const label = link.textContent?.trim() ?? "";
    const icon = siteIconPaths[label];
    if (!icon || link.querySelector(".header-link-icon")) return;
    link.prepend(createSiteIcon("header-link-icon", icon));
  });

  toggle.addEventListener("click", () => {
    const open = !links.classList.contains("open");
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initFooter() {
  const year = new Date().getFullYear();
  const yearEl = query("#copyright-year");
  if (yearEl) yearEl.textContent = String(year);

  queryAll(".site-footer h5").forEach((heading) => {
    const label = heading.textContent?.trim() ?? "";
    const icon = siteIconPaths[label];
    if (!icon || heading.querySelector(".footer-heading-icon")) return;
    heading.prepend(createSiteIcon("footer-heading-icon", icon));
  });

  queryAll(".site-footer nav a").forEach((link) => {
    const label = link.textContent?.trim() ?? "";
    const icon = siteIconPaths[label];
    if (!icon || link.querySelector(".footer-link-icon")) return;
    link.prepend(createSiteIcon("footer-link-icon", icon));
  });
}

function initEditorPreviewNotice() {
  queryAll(".nav-editor-link").forEach((link) => {
    link.addEventListener("click", () => {
      window.alert("LatexDo Editor is currently in preview.");
    });
  });
}

function init() {
  initNavigation();
  initFooter();
  initEditorPreviewNotice();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
