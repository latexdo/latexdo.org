"use strict";
function query(selector) {
    return document.querySelector(selector);
}
function queryAll(selector) {
    return Array.from(document.querySelectorAll(selector));
}
function formatBytes(bytes) {
    if (!bytes || !Number.isFinite(bytes))
        return "Installer";
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatDate(value) {
    if (!value)
        return "latest build";
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return "latest build";
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}
function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
function initNavigation() {
    const toggle = query("[data-nav-toggle]");
    const links = query("[data-nav-links]");
    if (!toggle || !links)
        return;
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
function initEditorPreviewNotice() {
    queryAll(".nav-editor-link").forEach((link) => {
        link.addEventListener("click", () => {
            window.alert("LatexDo Editor is currently in preview.");
        });
    });
}
function initReveal() {
    const elements = queryAll(".reveal");
    if (!("IntersectionObserver" in window)) {
        elements.forEach((element) => element.classList.add("visible"));
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.18 });
    elements.forEach((element) => observer.observe(element));
}
function renderDownloadFallback(container) {
    container.innerHTML = `
    <article class="download-card">
      <h3>Downloads page</h3>
      <p>Open the direct downloads page for macOS and Windows installers.</p>
      <a class="button primary" href="downloads/">View downloads</a>
    </article>
    <article class="download-card">
      <h3>Update manifest</h3>
      <p>The desktop app checks the public manifest for update information.</p>
      <a class="button secondary" href="downloads/manifest.json">View manifest</a>
    </article>
    <article class="download-card">
      <h3>Checksums</h3>
      <p>Verify installer integrity with SHA-256 checksums from the website.</p>
      <a class="button secondary" href="downloads/SHA256SUMS.txt">View checksums</a>
    </article>`;
}
async function initDownloads() {
    const container = query("#download-grid");
    if (!container)
        return;
    try {
        const response = await fetch("downloads/manifest.json", { cache: "no-store" });
        if (!response.ok)
            throw new Error(`Manifest returned ${response.status}`);
        const manifest = (await response.json());
        const files = Array.isArray(manifest.files) ? manifest.files : [];
        if (!files.length) {
            renderDownloadFallback(container);
            return;
        }
        container.innerHTML = files
            .map((file) => {
            const label = escapeHtml(file.label || file.id);
            const note = escapeHtml(file.note || `${file.platform} ${file.arch}`);
            const meta = escapeHtml(`${file.sizeLabel ?? formatBytes(file.size)} · ${formatDate(manifest.publishedAt)}`);
            const url = escapeHtml(file.url || `downloads/files/${file.filename}`);
            return `<article class="download-card">
          <div>
            <h3>${label}</h3>
            <p>${note}</p>
            <small>${meta}</small>
          </div>
          <a class="button primary" href="${url}">Download</a>
        </article>`;
        })
            .join("");
    }
    catch {
        renderDownloadFallback(container);
    }
}
function initCopyCommands() {
    const buttons = queryAll(".copy-btn");
    buttons.forEach((btn) => {
        btn.addEventListener("click", async () => {
            const command = btn.parentElement?.querySelector("code")?.textContent;
            if (!command)
                return;
            try {
                await navigator.clipboard.writeText(command);
                btn.classList.add("copied");
                btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
                setTimeout(() => {
                    btn.classList.remove("copied");
                    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
                }, 2000);
            }
            catch {
                // Clipboard not available
            }
        });
    });
}
function initTheme() {
    const toggle = document.querySelector("[data-theme-toggle]");
    const html = document.documentElement;
    const saved = localStorage.getItem("theme");
    if (saved === "bw") {
        html.setAttribute("data-theme", "bw");
    }
    toggle?.addEventListener("click", () => {
        const isBw = html.getAttribute("data-theme") === "bw";
        if (isBw) {
            html.removeAttribute("data-theme");
            localStorage.setItem("theme", "");
        }
        else {
            html.setAttribute("data-theme", "bw");
            localStorage.setItem("theme", "bw");
        }
    });
}
function initFooter() {
    const year = new Date().getFullYear();
    const el = document.querySelector("#copyright") ?? document.querySelector("#copyright-year");
    if (el)
        el.textContent = String(year);
}
function init() {
    initNavigation();
    initEditorPreviewNotice();
    initReveal();
    void initDownloads();
    initCopyCommands();
    initTheme();
    initFooter();
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
}
else {
    init();
}
