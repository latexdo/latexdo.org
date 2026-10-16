// Documentation page (/docs/): section search, the active contents link and
// copy buttons. The shared header, footer and donation modal come from site.ts.

const searchInput = document.querySelector<HTMLInputElement>("#docs-search");
const navSearch = document.querySelector<HTMLElement>("[data-nav-search]");
const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-search]"));
const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(".docs .toc-link"));

const normalize = (value: string): string => value.toLocaleLowerCase().replace(/\s+/g, " ").trim();

function linkedSection(link: HTMLAnchorElement): HTMLElement | null {
  const href = link.getAttribute("href");
  return href?.startsWith("#") ? document.querySelector<HTMLElement>(href) : null;
}

function updateActiveNav(): void {
  const visible = navLinks
    .map(linkedSection)
    .filter((section): section is HTMLElement => section !== null && !section.classList.contains("is-filtered"));
  let activeId = visible[0]?.id;
  for (const section of visible) {
    if (section.getBoundingClientRect().top <= 120) activeId = section.id;
  }
  for (const link of navLinks) {
    link.classList.toggle("active", activeId !== undefined && link.getAttribute("href") === `#${activeId}`);
  }
}

function updateSearch(): void {
  const tokens = normalize(searchInput?.value ?? "").split(" ").filter(Boolean);
  navSearch?.classList.toggle("has-value", tokens.length > 0);
  for (const section of sections) {
    const haystack = normalize(section.textContent ?? "");
    section.classList.toggle("is-filtered", tokens.length > 0 && !tokens.every((token) => haystack.includes(token)));
  }
  updateActiveNav();
}

searchInput?.addEventListener("input", updateSearch);
searchInput?.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (searchInput.value) {
    searchInput.value = "";
    updateSearch();
  } else {
    searchInput.blur();
  }
});
window.addEventListener("scroll", updateActiveNav, { passive: true });
window.addEventListener("hashchange", updateActiveNav);
updateActiveNav();

for (const button of Array.from(document.querySelectorAll<HTMLButtonElement>("[data-copy]"))) {
  button.addEventListener("click", async () => {
    const text = document.querySelector<HTMLElement>(button.dataset.copy ?? "")?.textContent?.trim();
    if (!text || !navigator.clipboard) return;
    const label = button.textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Press Cmd+C";
    }
    window.setTimeout(() => {
      button.textContent = label;
    }, 1400);
  });
}

export {};
