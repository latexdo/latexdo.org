interface DownloadFile {
  id: string;
  label: string;
  platform: string;
  arch: string;
  filename: string;
  note?: string;
  size?: number;
  sizeLabel?: string;
  sha256?: string;
  url: string;
}

interface DownloadManifest {
  version: string | null;
  publishedAt: string | null;
  downloadsPage: string;
  files: DownloadFile[];
}

interface DownloadRelease extends DownloadManifest {
  tag: string;
  commit?: string;
  repository?: string;
  manifestUrl?: string;
  checksumsUrl?: string;
  githubReleaseUrl?: string;
}

interface ReleasesIndex {
  releases: DownloadRelease[];
}

interface PlatformMeta {
  className: string;
  eyebrow: string;
  title: string;
  icon: string;
}

type ClientPlatform = "macos" | "windows" | "linux";
type ClientArch = "arm64" | "x64";

interface ClientDeviceHint {
  platform: ClientPlatform | null;
  arch: ClientArch | null;
}

interface NavigatorUADataLike {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{
    architecture?: string;
    bitness?: string;
    platform?: string;
  }>;
}

interface ExpenseRow {
  category: string;
  item: string;
  monthlyUsd: number;
  why: string;
}

function query<T extends Element>(selector: string): T | null {
  return document.querySelector<T>(selector);
}

function queryAll<T extends Element>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector));
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes || !Number.isFinite(bytes)) return "Installer";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null): string {
  if (!value) return "latest build";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "latest build";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const platformIcons = {
  macos: `<svg class="platform-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.64 12.08c-.03-2.32 1.9-3.45 1.99-3.5-1.09-1.6-2.79-1.82-3.37-1.84-1.42-.15-2.8.85-3.52.85-.74 0-1.86-.83-3.06-.8-1.56.02-3.02.93-3.82 2.35-1.65 2.86-.42 7.06 1.16 9.37.79 1.13 1.71 2.39 2.92 2.35 1.18-.05 1.62-.75 3.04-.75 1.41 0 1.82.75 3.06.72 1.27-.02 2.06-1.14 2.82-2.28.91-1.3 1.27-2.58 1.29-2.65-.03-.01-2.49-.96-2.52-3.82ZM14.34 5.24c.64-.79 1.07-1.86.95-2.94-.92.04-2.07.63-2.74 1.39-.59.67-1.12 1.78-.98 2.81 1.04.08 2.1-.52 2.77-1.26Z" />
    </svg>`,
  windows: `<svg class="platform-logo" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 5.15 10.8 4v7.38H3V5.15Z" />
      <path d="M12.15 3.82 21 2.5v8.88h-8.85V3.82Z" />
      <path d="M3 12.62h7.8V20L3 18.85v-6.23Z" />
      <path d="M12.15 12.62H21v8.88l-8.85-1.32v-7.56Z" />
    </svg>`,
  linux: `<img class="platform-logo linux-logo" src="../assets/linux-tux.png" alt="" width="36" height="43" />`,
};

const platformMeta: Record<string, PlatformMeta> = {
  macos: {
    className: "macos",
    eyebrow: "macOS",
    title: "Apple Mac",
    icon: platformIcons.macos,
  },
  windows: {
    className: "windows",
    eyebrow: "Windows",
    title: "Windows PC",
    icon: platformIcons.windows,
  },
  linux: {
    className: "linux",
    eyebrow: "Linux",
    title: "Linux desktop",
    icon: platformIcons.linux,
  },
};

const platformOrder = ["macos", "windows", "linux"];
let clientDeviceHintPromise: Promise<ClientDeviceHint> | null = null;

function initNavigation(): void {
  const toggle = query<HTMLButtonElement>("[data-nav-toggle]");
  const links = query<HTMLElement>("[data-nav-links]");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const open = !links.classList.contains("open");
    links.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  links.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("a")) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initEditorPreviewNotice(): void {
  queryAll<HTMLAnchorElement>(".nav-editor-link").forEach((link) => {
    link.addEventListener("click", () => {
      window.alert("LatexDo Editor is currently in preview.");
    });
  });
}

function initReveal(): void {
  const elements = queryAll<HTMLElement>(".reveal");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 },
  );

  elements.forEach((element) => observer.observe(element));
}

function renderDownloadFallback(container: HTMLElement): void {
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

async function initDownloads(): Promise<void> {
  const container = query<HTMLElement>("#download-grid");
  if (!container) return;

  try {
    const response = await fetch("downloads/manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Manifest returned ${response.status}`);
    const manifest = (await response.json()) as DownloadManifest;
    const files = Array.isArray(manifest.files) ? manifest.files : [];
    if (!files.length) {
      renderDownloadFallback(container);
      return;
    }

    container.innerHTML = files
      .map((file) => {
        const label = escapeHtml(file.label || file.id);
        const note = escapeHtml(file.note || `${file.platform} ${file.arch}`);
        const meta = escapeHtml(
          `${file.sizeLabel ?? formatBytes(file.size)} · ${formatDate(manifest.publishedAt)}`,
        );
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
  } catch {
    renderDownloadFallback(container);
  }
}

function getPlatformMeta(platform: string): PlatformMeta {
  const normalized = platform.toLowerCase();
  if (platformMeta[normalized]) return platformMeta[normalized];

  const label = normalized ? normalized[0].toUpperCase() + normalized.slice(1) : "Other";
  return {
    className: normalized,
    eyebrow: label,
    title: `${label} build`,
    icon: platformIcons.linux,
  };
}

function normalizeClientPlatform(value: string): ClientPlatform | null {
  const normalized = value.toLowerCase();
  if (/(mac|macos)/.test(normalized)) return "macos";
  if (/(win|windows)/.test(normalized)) return "windows";
  if (/(linux|x11)/.test(normalized) && !/android/.test(normalized)) return "linux";
  return null;
}

function normalizeClientArch(value: string, bitness = ""): ClientArch | null {
  const normalized = `${value} ${bitness}`.toLowerCase();
  if (/(arm|aarch64)/.test(normalized)) return "arm64";
  if (/(x86|x64|amd64|wow64|win64|64)/.test(normalized)) return "x64";
  return null;
}

function getNavigatorUAData(): NavigatorUADataLike | null {
  return (navigator as Navigator & { userAgentData?: NavigatorUADataLike }).userAgentData ?? null;
}

function detectClientDeviceFromBrowser(): ClientDeviceHint {
  const uaData = getNavigatorUAData();
  const platformText = [
    uaData?.platform,
    navigator.platform,
    navigator.userAgent,
  ]
    .filter(Boolean)
    .join(" ");

  const platform = normalizeClientPlatform(platformText);

  return {
    platform,
    arch: platform === "macos" ? null : normalizeClientArch(platformText),
  };
}

async function detectClientDevice(): Promise<ClientDeviceHint> {
  const basic = detectClientDeviceFromBrowser();
  const uaData = getNavigatorUAData();
  if (!uaData?.getHighEntropyValues) return basic;

  try {
    const values = await uaData.getHighEntropyValues([
      "architecture",
      "bitness",
      "platform",
    ]);

    return {
      platform: normalizeClientPlatform(values.platform ?? "") ?? basic.platform,
      arch:
        normalizeClientArch(values.architecture ?? "", values.bitness ?? "") ??
        basic.arch,
    };
  } catch {
    return basic;
  }
}

function getClientDeviceHint(): Promise<ClientDeviceHint> {
  clientDeviceHintPromise ??= detectClientDevice();
  return clientDeviceHintPromise;
}

function getPlatformCardPlatform(card: HTMLElement): string | null {
  if (card.dataset.platform) return card.dataset.platform;
  return (
    platformOrder.find((platform) => {
      const className = getPlatformMeta(platform).className;
      return card.classList.contains(className);
    }) ?? null
  );
}

function setDownloadOptionDisabled(option: HTMLAnchorElement, disabled: boolean): void {
  if (disabled) {
    option.removeAttribute("href");
    option.removeAttribute("download");
    option.setAttribute("aria-disabled", "true");
    option.setAttribute("tabindex", "-1");
    option.classList.add("is-disabled");
    return;
  }

  option.removeAttribute("aria-disabled");
  option.removeAttribute("tabindex");
  option.classList.remove("is-disabled");
}

function applyDevicePlatformLimit(
  container: HTMLElement,
  deviceHint: ClientDeviceHint | null,
): void {
  const detectedPlatform = deviceHint?.platform ?? null;
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>(".platform-download-card"),
  );
  const shouldLimit = Boolean(
    detectedPlatform &&
      cards.some((card) => getPlatformCardPlatform(card) === detectedPlatform),
  );

  container.classList.toggle("is-device-limited", shouldLimit);

  cards.forEach((card) => {
    const disabled = shouldLimit && getPlatformCardPlatform(card) !== detectedPlatform;
    card.classList.toggle("is-device-disabled", disabled);
    if (disabled) {
      card.setAttribute("aria-disabled", "true");
    } else {
      card.removeAttribute("aria-disabled");
    }

    card.querySelectorAll<HTMLAnchorElement>(".download-option").forEach((option) => {
      setDownloadOptionDisabled(option, disabled);
    });
    card.querySelectorAll<HTMLInputElement>(".mac-machine-input").forEach((input) => {
      input.disabled = disabled;
    });
  });
}

async function initDownloadPlatformLimits(): Promise<void> {
  const containers = queryAll<HTMLElement>(".download-platform-grid");
  if (!containers.length) return;

  const deviceHint = await getClientDeviceHint();
  containers.forEach((container) => applyDevicePlatformLimit(container, deviceHint));
}

function getDownloadOptionLabel(file: DownloadFile): string {
  if (file.platform === "macos" && file.arch === "arm64") return "Apple Silicon";
  if (file.platform === "macos" && file.arch === "x64") return "Intel";
  if (file.arch) return `${file.label || file.platform} ${file.arch.toUpperCase()}`;
  return file.label || file.id;
}

function getInstallerType(file: DownloadFile): string {
  const extension = file.filename.split(".").pop();
  if (!extension) return "Installer";
  return `${extension.toUpperCase()} installer`;
}

function getReleasePath(release: DownloadRelease): string {
  return release.downloadsPage || `${release.tag}/`;
}

function getReleaseManifestPath(release: DownloadRelease): string {
  return release.manifestUrl || `${release.tag}/manifest.json`;
}

function getReleaseChecksumsPath(release: DownloadRelease): string {
  return release.checksumsUrl || `${release.tag}/SHA256SUMS.txt`;
}

function getReleaseGithubPath(release: DownloadRelease): string {
  return release.githubReleaseUrl || `https://github.com/latexdo/latexdo/releases/tag/${release.tag}`;
}

function getShortCommit(release: DownloadRelease): string {
  return (release.commit || "").slice(0, 12) || "Unknown";
}

function renderDownloadOption(file: DownloadFile, extraClass = "", disabled = false): string {
  const label = escapeHtml(getDownloadOptionLabel(file));
  const type = escapeHtml(getInstallerType(file));
  const size = escapeHtml(file.sizeLabel ?? formatBytes(file.size));
  const sha = file.sha256 ? `<span class="downloads-dev-link"> - SHA-256</span>` : "";
  const url = escapeHtml(file.url || file.filename);
  const className = ["download-option", extraClass, disabled ? "is-disabled" : ""]
    .filter(Boolean)
    .join(" ");
  const attributes = disabled ? `aria-disabled="true" tabindex="-1"` : `href="${url}" download`;
  return `<a class="${escapeHtml(className)}" ${attributes}>
              <strong>${label}</strong>
              <span>${type}</span>
              <em>${size}${sha}</em>
            </a>`;
}

function renderMacMachinePicker(
  files: DownloadFile[],
  deviceHint: ClientDeviceHint | null,
  disabled = false,
): string {
  const appleSilicon = files.find((file) => file.arch === "arm64");
  const intel = files.find((file) => file.arch === "x64");
  if (!appleSilicon || !intel) {
    return `<div class="download-variant-row" aria-label="macOS build choices">
${files.map((file) => renderDownloadOption(file, "", disabled)).join("\n")}
            </div>`;
  }

  const preferIntel = deviceHint?.platform === "macos" && deviceHint.arch === "x64";
  const disabledAttribute = disabled ? " disabled" : "";

  return `<div class="mac-machine-picker" aria-label="macOS build choices">
              <input class="mac-machine-input" type="radio" name="mac-machine" id="mac-machine-apple-silicon"${preferIntel ? "" : " checked"}${disabledAttribute} />
              <input class="mac-machine-input" type="radio" name="mac-machine" id="mac-machine-intel"${preferIntel ? " checked" : ""}${disabledAttribute} />
              <div class="mac-machine-tabs" aria-label="Mac chip">
                <label for="mac-machine-apple-silicon">Apple Silicon</label>
                <label for="mac-machine-intel">Intel</label>
              </div>
              <div class="mac-machine-downloads">
${renderDownloadOption(appleSilicon, "mac-machine-option arm64", disabled)}
${renderDownloadOption(intel, "mac-machine-option x64", disabled)}
              </div>
            </div>`;
}

function renderPlatformDownloadChoices(
  platform: string,
  options: DownloadFile[],
  deviceHint: ClientDeviceHint | null,
  disabled = false,
): string {
  if (platform === "macos") return renderMacMachinePicker(options, deviceHint, disabled);

  const meta = getPlatformMeta(platform);
  return `<div class="download-variant-row" aria-label="${escapeHtml(meta.eyebrow)} build choices">
${options.map((file) => renderDownloadOption(file, "", disabled)).join("\n")}
            </div>`;
}

function renderReleaseDownloads(
  container: HTMLElement,
  release: DownloadRelease,
  deviceHint: ClientDeviceHint | null = null,
): void {
  const files = Array.isArray(release.files) ? release.files : [];
  if (!files.length) {
    container.classList.remove("is-device-limited");
    container.innerHTML = `<article class="downloads-empty">
      <h2>No installers listed</h2>
      <p>This release tag does not include downloadable desktop installers.</p>
    </article>`;
    return;
  }

  const grouped = new Map<string, DownloadFile[]>();
  files.forEach((file) => {
    const platform = file.platform || "other";
    const group = grouped.get(platform) ?? [];
    group.push(file);
    grouped.set(platform, group);
  });

  const platforms = Array.from(grouped.keys()).sort((a, b) => {
    const aIndex = platformOrder.indexOf(a);
    const bIndex = platformOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const detectedPlatform = deviceHint?.platform ?? null;
  const shouldLimit = Boolean(detectedPlatform && grouped.has(detectedPlatform));
  container.classList.toggle("is-device-limited", shouldLimit);

  container.innerHTML = platforms
    .map((platform) => {
      const meta = getPlatformMeta(platform);
      const options = grouped.get(platform) ?? [];
      const disabled = shouldLimit && detectedPlatform !== platform;
      const disabledClass = disabled ? " is-device-disabled" : "";
      const disabledAttribute = disabled ? ` aria-disabled="true"` : "";
      return `<article class="platform-download-card ${escapeHtml(meta.className)}${disabledClass}" data-platform="${escapeHtml(platform)}"${disabledAttribute}>
            <div class="platform-card-top">
              <span class="platform-logo-shell">${meta.icon}</span>
              <div>
                <p class="eyebrow">${escapeHtml(meta.eyebrow)}</p>
                <h2>${escapeHtml(meta.title)}</h2>
              </div>
            </div>
            ${renderPlatformDownloadChoices(platform, options, deviceHint, disabled)}
          </article>`;
    })
    .join("");
}

function renderReleaseMeta(container: HTMLElement, release: DownloadRelease): void {
  const version = escapeHtml(release.version || release.tag);
  const tag = escapeHtml(release.tag);
  const publishedAt = escapeHtml(release.publishedAt || "Unknown");
  const commit = escapeHtml(getShortCommit(release));
  const releasePath = escapeHtml(getReleasePath(release));
  const manifestPath = escapeHtml(getReleaseManifestPath(release));
  const checksumsPath = escapeHtml(getReleaseChecksumsPath(release));
  const githubPath = escapeHtml(getReleaseGithubPath(release));

  container.innerHTML = `<h2>Selected build information</h2>
        <dl>
          <div>
            <dt>Version</dt>
            <dd>${version}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>${publishedAt}</dd>
          </div>
          <div>
            <dt>Commit</dt>
            <dd>${commit}</dd>
          </div>
        </dl>
        <p>
          Selected tag: <a href="${releasePath}">${tag}</a>.
          For automated checks, use <a href="${manifestPath}">manifest.json</a>,
          <a href="${checksumsPath}">SHA256SUMS.txt</a>, and
          <a href="${githubPath}">GitHub release</a>.
        </p>`;
}

function getReleaseGroupLabel(release: DownloadRelease): string {
  const version = release.version || release.tag.replace(/-build\..*$/, "");
  return version.startsWith("v") ? version : `v${version}`;
}

function groupReleasesByVersion(
  releases: DownloadRelease[],
): Array<{ label: string; items: Array<{ release: DownloadRelease; index: number }> }> {
  const groups = new Map<string, Array<{ release: DownloadRelease; index: number }>>();

  releases.forEach((release, index) => {
    const label = getReleaseGroupLabel(release);
    const items = groups.get(label) ?? [];
    items.push({ release, index });
    groups.set(label, items);
  });

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function renderReleaseBuildItem(release: DownloadRelease, index: number): string {
  const latest = index === 0 ? " - latest" : "";
  const tag = escapeHtml(release.tag);
  const publishedAt = escapeHtml(formatDate(release.publishedAt));
  const commit = escapeHtml(getShortCommit(release));
  const releasePath = escapeHtml(getReleasePath(release));
  const manifestPath = escapeHtml(getReleaseManifestPath(release));
  const checksumsPath = escapeHtml(getReleaseChecksumsPath(release));
  const githubPath = escapeHtml(getReleaseGithubPath(release));

  return `<article class="release-item">
              <button class="release-build-button" type="button" data-release-index="${index}">
                <strong>${tag}</strong>
                <span>${publishedAt}${latest} - ${commit}</span>
              </button>
              <nav aria-label="${tag} release links">
                <a href="${releasePath}">Downloads</a>
                <a href="${manifestPath}">Manifest</a>
                <a href="${checksumsPath}">Checksums</a>
                <a href="${githubPath}">GitHub</a>
              </nav>
            </article>`;
}

function renderReleaseGroups(releases: DownloadRelease[]): string {
  return groupReleasesByVersion(releases)
    .map((group, groupIndex) => {
      const buildCount = group.items.length;
      const latest = groupIndex === 0 ? " - latest series" : "";
      return `<details class="release-group">
              <summary>
                <span class="release-group-arrow" aria-hidden="true"></span>
                <span class="release-group-title">
                  <strong>${escapeHtml(group.label)}</strong>
                  <small>${buildCount} build${buildCount === 1 ? "" : "s"}${latest}</small>
                </span>
              </summary>
              <div class="release-list">
                ${group.items.map((item) => renderReleaseBuildItem(item.release, item.index)).join("")}
              </div>
            </details>`;
    })
    .join("");
}

function readReleaseHash(): string | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
}

async function initReleaseSwitcher(): Promise<void> {
  const switcher = query<HTMLElement>("[data-release-switcher]");
  const groups = query<HTMLElement>("[data-release-groups]");
  const downloads = query<HTMLElement>("[data-release-downloads]");
  const meta = query<HTMLElement>("[data-release-meta]");
  if (!switcher || !groups || !downloads || !meta) return;

  const source = switcher.dataset.releasesSrc || "downloads/releases.json";
  const downloadsContainer = downloads;
  const metaContainer = meta;
  const deviceHint = await getClientDeviceHint();

  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error(`Releases returned ${response.status}`);

    const index = (await response.json()) as ReleasesIndex;
    const releases = Array.isArray(index.releases) ? index.releases : [];
    if (!releases.length) throw new Error("No releases");

    groups.innerHTML = renderReleaseGroups(releases);
    const buttons = queryAll<HTMLButtonElement>(".release-build-button");

    function selectRelease(index: number, updateHash = true, openGroup = true): void {
      const release = releases[index];
      const button = buttons.find(
        (candidate) => Number(candidate.dataset.releaseIndex) === index,
      );
      if (!release || !button) return;

      buttons.forEach((buildButton) => {
        const selected = Number(buildButton.dataset.releaseIndex) === index;
        buildButton.setAttribute("aria-current", String(selected));
        buildButton.closest(".release-item")?.classList.toggle("is-selected", selected);
      });

      renderReleaseDownloads(downloadsContainer, release, deviceHint);
      renderReleaseMeta(metaContainer, release);

      if (openGroup) {
        button.closest("details")?.setAttribute("open", "");
        button.scrollIntoView({ block: "nearest" });
      }

      if (updateHash) {
        const url = new URL(window.location.href);
        url.hash = encodeURIComponent(release.tag);
        window.history.replaceState(null, "", url);
      }
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const releaseIndex = Number(button.dataset.releaseIndex);
        if (Number.isInteger(releaseIndex)) selectRelease(releaseIndex);
      });
    });

    groups.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      const selectedIndex = buttons.findIndex(
        (button) => button.getAttribute("aria-current") === "true",
      );
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex = Math.min(Math.max(selectedIndex + delta, 0), releases.length - 1);
      if (nextIndex !== selectedIndex) {
        event.preventDefault();
        selectRelease(nextIndex);
        buttons
          .find((button) => Number(button.dataset.releaseIndex) === nextIndex)
          ?.focus();
      }
    });

    const requestedTag = readReleaseHash();
    const initialIndex = requestedTag
      ? releases.findIndex((release) => release.tag === requestedTag)
      : 0;
    selectRelease(initialIndex >= 0 ? initialIndex : 0, false, requestedTag !== null);
  } catch {
    groups.innerHTML = `<p class="release-loading">Release builds could not load. Use releases.json directly.</p>`;
  }
}

function initDevMode(): void {
  const toggle = query<HTMLInputElement>("#dev-mode-toggle");
  if (!toggle) return;

  const sync = () => {
    document.body.classList.toggle("dev-mode-on", toggle.checked);
  };

  sync();
  toggle.addEventListener("change", sync);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseExpenseRows(text: string): ExpenseRow[] {
  const rows = parseCsv(text);
  const headers = rows.shift()?.map((header) => header.toLowerCase()) ?? [];

  const categoryIndex = headers.indexOf("category");
  const itemIndex = headers.indexOf("line item");
  const monthlyIndex = headers.indexOf("monthly usd");
  const whyIndex = headers.indexOf("why");

  return rows
    .map((row) => ({
      category: row[categoryIndex] || "Other",
      item: row[itemIndex] || "Expense",
      monthlyUsd: Number(row[monthlyIndex] || 0),
      why: row[whyIndex] || "",
    }))
    .filter((row) => Number.isFinite(row.monthlyUsd));
}

function renderExpensesTable(container: HTMLElement, rows: ExpenseRow[]): void {
  const total = rows.reduce((sum, row) => sum + row.monthlyUsd, 0);
  container.innerHTML = `<table class="expenses-table">
      <thead>
        <tr>
          <th>Category</th>
          <th>Line item</th>
          <th>Monthly USD</th>
          <th>Why</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `<tr>
              <td>${escapeHtml(row.category)}</td>
              <td>${escapeHtml(row.item)}</td>
              <td>${escapeHtml(formatUsd(row.monthlyUsd))}</td>
              <td>${escapeHtml(row.why)}</td>
            </tr>`,
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <th colspan="2">Estimated monthly total</th>
          <td>${escapeHtml(formatUsd(total))}</td>
          <td aria-hidden="true"></td>
        </tr>
      </tfoot>
    </table>`;
}

async function initExpensesTable(): Promise<void> {
  const container = query<HTMLElement>("[data-expenses-table]");
  if (!container) return;

  const source = container.dataset.expensesSrc || "expenses.csv";
  try {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error(`Expenses returned ${response.status}`);

    const rows = parseExpenseRows(await response.text());
    if (!rows.length) throw new Error("No expenses");
    renderExpensesTable(container, rows);
  } catch {
    container.innerHTML = `<p class="expenses-loading">
      Expenses could not load. Open <a href="${escapeHtml(source)}">expenses.csv</a> directly.
    </p>`;
  }
}

function initCopyCommands(): void {
  const buttons = queryAll<HTMLButtonElement>(".copy-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const command = btn.parentElement?.querySelector("code")?.textContent;
      if (!command) return;
      try {
        await navigator.clipboard.writeText(command);
        btn.classList.add("copied");
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
        }, 2000);
      } catch {
        // Clipboard not available
      }
    });
  });
}

function initTheme(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-theme-toggle]");
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
    } else {
      html.setAttribute("data-theme", "bw");
      localStorage.setItem("theme", "bw");
    }
  });
}

function initFooter(): void {
  const year = new Date().getFullYear();
  const el = document.querySelector("#copyright") ?? document.querySelector("#copyright-year");
  if (el) el.textContent = String(year);
}

function init(): void {
  initNavigation();
  initEditorPreviewNotice();
  initReveal();
  initDevMode();
  void initDownloads();
  void initDownloadPlatformLimits();
  void initReleaseSwitcher();
  void initExpensesTable();
  initCopyCommands();
  initTheme();
  initFooter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
