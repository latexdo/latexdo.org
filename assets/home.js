"use strict";
// Homepage behaviour: fills the download section from the release manifest,
// recommends the installer for this visitor's computer, opens the tour video,
// and fades sections in. Without JavaScript every link still works and all
// content is visible.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}
const platformLabels = { macos: "Mac", windows: "Windows", linux: "Linux" };
async function loadManifest() {
    try {
        const response = await fetch("/downloads/manifest.json");
        if (!response.ok)
            return null;
        return (await response.json());
    }
    catch {
        return null;
    }
}
/** Phones and unknown systems get no recommendation; they see all three platforms. */
async function detectDevice() {
    const uaData = navigator.userAgentData;
    const text = `${uaData?.platform ?? ""} ${navigator.platform} ${navigator.userAgent}`;
    if (/android|iphone|ipad|mobile/i.test(text))
        return { platform: null, arch: null };
    const platform = /mac/i.test(text)
        ? "macos"
        : /win/i.test(text)
            ? "windows"
            : /linux|x11/i.test(text)
                ? "linux"
                : null;
    // Browsers do not reliably rise whether a Mac is Apple Silicon or Intel.
    let arch = platform === "macos" ? null : "x64";
    try {
        const values = await uaData?.getHighEntropyValues?.(["architecture"]);
        if (values?.architecture)
            arch = /arm/i.test(values.architecture) ? "arm64" : "x64";
    }
    catch {
        // Keep the conservative default.
    }
    return { platform, arch };
}
function formatDate(value) {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime()))
        return null;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function fileExtension(file) {
    return file.filename?.match(/\.[a-z]+$/i)?.[0] ?? "";
}
function fillDownloadSection(manifest) {
    const files = new Map((manifest.files ?? []).map((file) => [file.id, file]));
    for (const link of all("[data-file]")) {
        const file = files.get(link.dataset.file);
        if (file?.url?.startsWith("https://"))
            link.href = file.url;
    }
    for (const meta of all("[data-meta]")) {
        const parts = (meta.dataset.meta ?? "")
            .split(" ")
            .map((id) => files.get(id))
            .filter((file) => Boolean(file?.sizeLabel));
        if (!parts.length)
            continue;
        const sizes = parts.map((file) => file.sizeLabel).join(" / ");
        meta.textContent = `${fileExtension(parts[0])} · ${sizes}`;
    }
    const released = formatDate(manifest.publishedAt);
    const releaseLine = document.querySelector("[data-release-line]");
    if (releaseLine && manifest.version && released) {
        releaseLine.textContent = `Free for macOS, Windows and Linux. Version ${manifest.version}, built ${released}.`;
    }
}
function recommend(platform, arch, manifest) {
    const card = document.querySelector(`.dl-card[data-platform="${platform}"]`);
    if (card) {
        card.classList.add("is-recommended");
        const heading = card.querySelector("h3");
        if (heading && !heading.querySelector(".dl-badge")) {
            const badge = document.createElement("span");
            badge.className = "dl-badge";
            badge.textContent = "Your system";
            heading.append(badge);
        }
        // The recommended platform reads first on narrow screens.
        card.parentElement?.prepend(card);
    }
    const label = platformLabels[platform];
    const file = arch
        ? manifest?.files?.find((candidate) => candidate.platform === platform && candidate.arch === arch)
        : undefined;
    for (const button of all("[data-smart-download]")) {
        button.textContent = `Download for ${label}`;
        if (file?.url?.startsWith("https://"))
            button.href = file.url;
    }
    const meta = document.querySelector("[data-intro-meta]");
    if (meta) {
        const details = file?.sizeLabel
            ? `${manifest?.version ? `Version ${manifest.version} · ` : ""}${file.sizeLabel} · `
            : "";
        meta.textContent = `Free and open source · ${details}Also for ${Object.keys(platformLabels)
            .filter((other) => other !== platform)
            .map((other) => (other === "macos" ? "macOS" : platformLabels[other]))
            .join(" and ")}`;
    }
}
async function initDownloads() {
    const [manifest, device] = await Promise.all([loadManifest(), detectDevice()]);
    if (manifest)
        fillDownloadSection(manifest);
    if (device.platform)
        recommend(device.platform, device.arch, manifest);
}
function initTour() {
    const dialog = document.querySelector("#tour-dialog");
    const video = dialog?.querySelector("video");
    if (!dialog || !video || typeof dialog.showModal !== "function")
        return;
    for (const opener of all("[data-tour-open]")) {
        opener.addEventListener("click", (event) => {
            event.preventDefault();
            dialog.showModal();
            if (!reducedMotion)
                void video.play().catch(() => undefined);
        });
    }
    dialog.querySelector("[data-tour-close]")?.addEventListener("click", () => dialog.close());
    // A click on the backdrop lands on the dialog element itself.
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog)
            dialog.close();
    });
    dialog.addEventListener("close", () => video.pause());
}
function initReveals() {
    if (reducedMotion || !("IntersectionObserver" in window))
        return;
    const elements = all(".rise");
    // Content already on screen at load is never hidden.
    const below = elements.filter((element) => element.getBoundingClientRect().top > window.innerHeight);
    if (!below.length)
        return;
    document.body.classList.add("js-rise");
    for (const element of elements)
        if (!below.includes(element))
            element.classList.add("is-in");
    const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting)
                continue;
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
        }
    }, { rootMargin: "0px 0px -8% 0px" });
    for (const element of below)
        observer.observe(element);
}
function initHome() {
    void initDownloads();
    initTour();
    initReveals();
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHome, { once: true });
}
else {
    initHome();
}
