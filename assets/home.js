"use strict";
// Homepage motion: scroll reveals, the self-typing hero window, and the small
// product scenes. Everything degrades to a static page with reduced motion.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function all(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}
function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
function whenVisible(element, callback, threshold = 0.25) {
    if (!("IntersectionObserver" in window)) {
        callback();
        return;
    }
    const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            callback();
        }
    }, { threshold });
    observer.observe(element);
}
function initReveals() {
    for (const element of all(".h-reveal")) {
        const siblings = element.parentElement
            ? all(":scope > .h-reveal", element.parentElement)
            : [element];
        const index = siblings.indexOf(element);
        if (index > 0)
            element.style.setProperty("--h-delay", `${Math.min(index, 5) * 90}ms`);
        whenVisible(element, () => element.classList.add("is-in"), 0.18);
    }
}
/** Wraps every visible character of the code sample so it can be typed out. */
function prepareTyping(code) {
    const characters = [];
    const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode())
        textNodes.push(walker.currentNode);
    for (const node of textNodes) {
        // Skip line numbers and the layout whitespace between line elements.
        if (node.parentElement === code || node.parentElement?.classList.contains("n"))
            continue;
        const fragment = document.createDocumentFragment();
        for (const character of node.data) {
            if (character === "\n") {
                fragment.append(character);
                continue;
            }
            const span = document.createElement("span");
            span.className = "h-char";
            span.textContent = character;
            fragment.append(span);
            characters.push(span);
        }
        node.replaceWith(fragment);
    }
    return characters;
}
async function runHeroWindow(windowElement) {
    const code = windowElement.querySelector("[data-typed]");
    const paper = windowElement.querySelector("[data-paper]");
    if (!code || !paper)
        return;
    if (reducedMotion) {
        paper.classList.add("s1", "s2", "s3", "s4");
        windowElement.classList.add("is-done");
        return;
    }
    const characters = prepareTyping(code);
    const caret = document.createElement("span");
    caret.className = "h-caret";
    const lineOf = (character) => character.closest(".l");
    let currentLine = null;
    for (;;) {
        for (let index = 0; index < characters.length; index += 1) {
            const character = characters[index];
            const line = lineOf(character);
            if (line !== currentLine) {
                currentLine?.classList.remove("cur");
                line?.classList.add("cur");
                currentLine = line;
            }
            character.classList.add("on");
            character.after(caret);
            // A line marked with a stage compiles once its last character is typed.
            const stage = line?.dataset.compileStage;
            const lineEnds = index + 1 === characters.length || lineOf(characters[index + 1]) !== line;
            if (stage && lineEnds) {
                windowElement.classList.add("is-compiling");
                await wait(520);
                paper.classList.add(stage);
                windowElement.classList.remove("is-compiling");
                await wait(160);
            }
            await wait(character.textContent === " " ? 6 : 9 + Math.random() * 14);
        }
        windowElement.classList.add("is-done");
        await wait(5200);
        caret.remove();
        currentLine?.classList.remove("cur");
        currentLine = null;
        windowElement.classList.remove("is-done");
        paper.classList.remove("s1", "s2", "s3", "s4");
        for (const character of characters)
            character.classList.remove("on");
        await wait(700);
    }
}
/**
 * Product shots are laid out at a fixed width, like a screenshot, and scaled
 * down to whatever room the page gives them.
 */
function initShotFit() {
    const fits = all(".lx-fit[data-fit]");
    const fit = (wrapper) => {
        const shot = wrapper.firstElementChild;
        const designWidth = Number(wrapper.dataset.fit);
        if (!shot || !designWidth || !wrapper.clientWidth)
            return;
        wrapper.style.maxWidth = `${designWidth}px`;
        wrapper.style.setProperty("--lx-w", `${designWidth}px`);
        wrapper.style.setProperty("--lx-scale", String(Math.min(1, wrapper.clientWidth / designWidth)));
        wrapper.style.setProperty("--lx-h", `${shot.offsetHeight}px`);
        wrapper.classList.add("is-fitted");
    };
    if (!("ResizeObserver" in window)) {
        for (const wrapper of fits)
            fit(wrapper);
        return;
    }
    const observer = new ResizeObserver((entries) => {
        for (const entry of entries)
            fit(entry.target);
    });
    for (const wrapper of fits)
        observer.observe(wrapper);
}
/** Light and Dark show the hero window in both appearances the app supports. */
function initAppearanceSwitch() {
    const shot = document.querySelector("[data-hero-shot]");
    const buttons = all("[data-appearance]");
    for (const button of buttons) {
        button.addEventListener("click", () => {
            const dark = button.dataset.appearance === "dark";
            shot?.classList.toggle("lx-dark", dark);
            for (const other of buttons) {
                const on = other === button;
                other.classList.toggle("on", on);
                other.setAttribute("aria-pressed", String(on));
            }
        });
    }
}
/** The window starts tilted back and settles flat as it scrolls into view. */
function initStageTilt(stage) {
    if (reducedMotion) {
        stage.style.setProperty("--h-tilt", "0");
        return;
    }
    let frame = 0;
    const update = () => {
        frame = 0;
        const rect = stage.getBoundingClientRect();
        const start = window.innerHeight * 0.92;
        const end = window.innerHeight * 0.3;
        const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
        stage.style.setProperty("--h-tilt", (1 - progress).toFixed(3));
    };
    const schedule = () => {
        if (!frame)
            frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
}
/** Cycles which source line and PDF region are linked in the sync scene. */
function initCycles() {
    for (const scene of all("[data-cycle]")) {
        const count = Number(scene.dataset.cycle) || 1;
        let step = 0;
        const show = () => {
            for (const element of all("[data-step]", scene)) {
                element.classList.toggle("is-active", element.dataset.step === String(step));
            }
            step = (step + 1) % count;
        };
        show();
        if (!reducedMotion)
            whenVisible(scene, () => window.setInterval(show, 2200));
    }
}
async function runAiScene(scene) {
    if (reducedMotion) {
        scene.classList.add("is-proposed");
        return;
    }
    for (;;) {
        await wait(1600);
        scene.classList.add("is-proposed");
        await wait(2600);
        scene.classList.add("is-approved");
        await wait(3200);
        scene.classList.remove("is-proposed", "is-approved");
    }
}
function initCounters() {
    for (const element of all("[data-count]")) {
        const target = Number(element.dataset.count);
        const suffix = element.dataset.suffix ?? "";
        if (!Number.isFinite(target) || reducedMotion)
            continue;
        whenVisible(element, () => {
            const startedAt = performance.now();
            const duration = 1400;
            const tick = (now) => {
                const progress = Math.min(1, (now - startedAt) / duration);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = `${Math.round(target * eased).toLocaleString("en-US")}${suffix}`;
                if (progress < 1)
                    window.requestAnimationFrame(tick);
            };
            window.requestAnimationFrame(tick);
        });
    }
}
/**
 * Points the download buttons at the installer for this visitor's computer.
 * Anything uncertain (phones, an unknown Mac chip, a failed request) keeps the
 * plain link to the downloads page.
 */
async function initSmartDownload() {
    const buttons = all("[data-smart-download]");
    if (!buttons.length)
        return;
    const uaData = navigator.userAgentData;
    const text = `${uaData?.platform ?? ""} ${navigator.platform} ${navigator.userAgent}`;
    if (/android|iphone|ipad|mobile/i.test(text))
        return;
    const platform = /mac/i.test(text)
        ? "macos"
        : /win/i.test(text)
            ? "windows"
            : /linux|x11/i.test(text)
                ? "linux"
                : null;
    if (!platform)
        return;
    const label = { macos: "Mac", windows: "Windows", linux: "Linux" }[platform];
    for (const button of buttons)
        button.textContent = `Download for ${label}`;
    let arch = platform === "macos" ? null : "x64";
    try {
        const values = await uaData?.getHighEntropyValues?.(["architecture"]);
        if (values?.architecture)
            arch = /arm/i.test(values.architecture) ? "arm64" : "x64";
    }
    catch {
        // Keep the conservative default.
    }
    // Browsers do not reliably reveal whether a Mac is Apple Silicon or Intel.
    if (!arch)
        return;
    try {
        const response = await fetch("/downloads/manifest.json");
        if (!response.ok)
            return;
        const manifest = (await response.json());
        const file = manifest.files?.find((candidate) => candidate.platform === platform && candidate.arch === arch);
        if (!file?.url?.startsWith("https://"))
            return;
        for (const button of buttons)
            button.href = file.url;
    }
    catch {
        // The downloads page link still works.
    }
}
/** Shows the current version and its release date under the final call. */
async function initLatestRelease() {
    const element = document.querySelector("[data-latest-release]");
    if (!element)
        return;
    try {
        const response = await fetch("/downloads/manifest.json");
        if (!response.ok)
            return;
        const manifest = (await response.json());
        const published = new Date(String(manifest.publishedAt));
        if (typeof manifest.version !== "string" || Number.isNaN(published.getTime()))
            return;
        const link = document.createElement("a");
        link.href = "/downloads/";
        link.textContent = `Version ${manifest.version}, released ${published.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        })}`;
        element.replaceChildren(link);
        element.hidden = false;
    }
    catch {
        // The line simply stays hidden.
    }
}
function initHome() {
    void initSmartDownload();
    void initLatestRelease();
    initReveals();
    initCycles();
    initCounters();
    initShotFit();
    initAppearanceSwitch();
    const stage = document.querySelector("[data-stage]");
    if (stage)
        initStageTilt(stage);
    const heroWindow = document.querySelector(".h-window");
    if (heroWindow)
        void runHeroWindow(heroWindow);
    const aiScene = document.querySelector(".h-ai");
    if (aiScene)
        whenVisible(aiScene, () => void runAiScene(aiScene), 0.4);
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHome, { once: true });
}
else {
    initHome();
}
