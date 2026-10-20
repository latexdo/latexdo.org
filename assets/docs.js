// Documentation page (/docs/): section search, the active contents link and
// copy buttons. The shared header, footer and donation modal come from site.ts.
import { Spring } from "./motion.js";
const searchInput = document.querySelector("#docs-search");
const navSearch = document.querySelector("[data-nav-search]");
const sections = Array.from(document.querySelectorAll("[data-search]"));
const navLinks = Array.from(document.querySelectorAll(".docs .toc-link"));
const emptyMessage = document.querySelector("[data-docs-empty]");
const bar = document.querySelector(".docs-bar");
const thumb = document.querySelector("[data-topics-thumb]");
// Wide screens show the topics as a sidebar; narrow ones as a scrolling bar.
const sidebarQuery = window.matchMedia("(min-width: 1100px)");
// The selection highlight glides between topics. Position and size run on
// separate springs, so scrolling quickly just re-targets it without jumps.
const thumbStart = new Spring(0, (value) => thumb?.style.setProperty("--start", `${value}px`));
const thumbSize = new Spring(0, (value) => thumb?.style.setProperty("--size", `${value}px`));
let thumbPlaced = false;
function moveThumb(link) {
    if (!thumb)
        return;
    thumb.hidden = !link;
    if (!link) {
        thumbPlaced = false;
        return;
    }
    const vertical = sidebarQuery.matches;
    thumb.dataset.axis = vertical ? "y" : "x";
    const start = vertical ? link.offsetTop : link.offsetLeft;
    const size = vertical ? link.offsetHeight : link.offsetWidth;
    if (!thumbPlaced) {
        thumbStart.set(start);
        thumbSize.set(size);
        thumbPlaced = true;
    }
    else {
        thumbStart.to(start, { damping: 1, response: 0.35 });
        thumbSize.to(size, { damping: 1, response: 0.35 });
    }
}
const normalize = (value) => value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
function linkedSection(link) {
    const href = link.getAttribute("href");
    return href?.startsWith("#") ? document.querySelector(href) : null;
}
function updateActiveNav() {
    const visible = navLinks
        .map(linkedSection)
        .filter((section) => section !== null && !section.classList.contains("is-filtered"));
    // A section is current once its top passes under the sticky header (and,
    // on narrow screens, the sticky topic bar).
    const header = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 66;
    const line = (sidebarQuery.matches ? header : (bar?.getBoundingClientRect().bottom ?? 120)) + 140;
    let activeId = visible[0]?.id;
    for (const section of visible) {
        if (section.getBoundingClientRect().top <= line)
            activeId = section.id;
    }
    for (const link of navLinks) {
        const active = activeId !== undefined && link.getAttribute("href") === `#${activeId}`;
        if (active && !link.classList.contains("active")) {
            // Keep the current topic visible in the scrolling list.
            const list = link.parentElement;
            if (sidebarQuery.matches) {
                list?.scrollTo({ top: link.offsetTop - list.clientHeight / 2 + link.offsetHeight / 2, behavior: "smooth" });
            }
            else {
                list?.scrollTo({ left: link.offsetLeft - list.clientWidth / 2 + link.offsetWidth / 2, behavior: "smooth" });
            }
        }
        link.classList.toggle("active", active);
        if (active)
            link.setAttribute("aria-current", "location");
        else
            link.removeAttribute("aria-current");
    }
    moveThumb(navLinks.find((link) => link.classList.contains("active")));
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
sidebarQuery.addEventListener("change", () => {
    thumbPlaced = false;
    updateActiveNav();
});
window.addEventListener("resize", () => {
    thumbPlaced = false;
    updateActiveNav();
});
bar?.classList.add("is-ready");
updateActiveNav();
// Like the header, the topic bar shows its edge only once it floats over content.
if (bar) {
    const updateEdge = () => {
        const header = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 66;
        bar.classList.toggle("is-stuck", !sidebarQuery.matches && bar.getBoundingClientRect().top <= header + 1);
    };
    window.addEventListener("scroll", () => requestAnimationFrame(updateEdge), { passive: true });
    updateEdge();
}
for (const button of Array.from(document.querySelectorAll("[data-copy]"))) {
    button.addEventListener("click", async () => {
        const text = document.querySelector(button.dataset.copy ?? "")?.textContent?.trim();
        if (!text || !navigator.clipboard)
            return;
        const label = button.textContent;
        try {
            await navigator.clipboard.writeText(text);
            button.textContent = "Copied";
            button.classList.add("is-done");
        }
        catch {
            button.textContent = "Press Cmd+C";
        }
        window.setTimeout(() => {
            button.classList.remove("is-done");
            button.textContent = label;
        }, 1400);
    });
}
