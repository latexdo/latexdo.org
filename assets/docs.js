// Documentation page (/docs/): section search, the active contents link and
// copy buttons. The shared header, footer and donation modal come from site.ts.
const searchInput = document.querySelector("#docs-search");
const navSearch = document.querySelector("[data-nav-search]");
const sections = Array.from(document.querySelectorAll("[data-search]"));
const navLinks = Array.from(document.querySelectorAll(".docs .toc-link"));
const emptyMessage = document.querySelector("[data-docs-empty]");
const normalize = (value) => value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
function linkedSection(link) {
    const href = link.getAttribute("href");
    return href?.startsWith("#") ? document.querySelector(href) : null;
}
function updateActiveNav() {
    const visible = navLinks
        .map(linkedSection)
        .filter((section) => section !== null && !section.classList.contains("is-filtered"));
    // A section is current once its top passes under the sticky topic bar.
    const line = (document.querySelector(".docs-bar")?.getBoundingClientRect().bottom ?? 120) + 140;
    let activeId = visible[0]?.id;
    for (const section of visible) {
        if (section.getBoundingClientRect().top <= line)
            activeId = section.id;
    }
    for (const link of navLinks) {
        const active = activeId !== undefined && link.getAttribute("href") === `#${activeId}`;
        if (active && !link.classList.contains("active")) {
            // Keep the current topic visible in the horizontally scrolling bar.
            const bar = link.parentElement;
            bar?.scrollTo({
                left: link.offsetLeft - bar.clientWidth / 2 + link.offsetWidth / 2,
                behavior: "smooth",
            });
        }
        link.classList.toggle("active", active);
    }
}
function updateSearch() {
    const tokens = normalize(searchInput?.value ?? "").split(" ").filter(Boolean);
    navSearch?.classList.toggle("has-value", tokens.length > 0);
    for (const section of sections) {
        const haystack = normalize(section.textContent ?? "");
        section.classList.toggle("is-filtered", tokens.length > 0 && !tokens.every((token) => haystack.includes(token)));
    }
    for (const link of navLinks) {
        link.hidden = linkedSection(link)?.classList.contains("is-filtered") ?? false;
    }
    if (emptyMessage) {
        emptyMessage.hidden = sections.some((section) => !section.classList.contains("is-filtered"));
    }
    updateActiveNav();
}
searchInput?.addEventListener("input", updateSearch);
searchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Escape")
        return;
    if (searchInput.value) {
        searchInput.value = "";
        updateSearch();
    }
    else {
        searchInput.blur();
    }
});
window.addEventListener("scroll", updateActiveNav, { passive: true });
window.addEventListener("hashchange", updateActiveNav);
updateActiveNav();
for (const button of Array.from(document.querySelectorAll("[data-copy]"))) {
    button.addEventListener("click", async () => {
        const text = document.querySelector(button.dataset.copy ?? "")?.textContent?.trim();
        if (!text || !navigator.clipboard)
            return;
        const label = button.textContent;
        try {
            await navigator.clipboard.writeText(text);
            button.textContent = "Copied";
        }
        catch {
            button.textContent = "Press Cmd+C";
        }
        window.setTimeout(() => {
            button.textContent = label;
        }, 1400);
    });
}
export {};
