// Analytics consent. No Google script is requested, and no analytics cookie is
// set, until the visitor accepts. Refusing is one click, the same as accepting,
// and the choice can be changed at any time from the footer.
const analyticsId = "G-VZK1FHVL4C";
const storageKey = "latexdo-analytics-consent";
// The question is asked again after six months, whichever answer was given.
const choiceLifetime = 1000 * 60 * 60 * 24 * 182;
// Analytics cookies never outlive thirteen months.
const cookieLifetimeSeconds = 60 * 60 * 24 * 395;

type Choice = "granted" | "denied";

interface AnalyticsWindow extends Window {
  dataLayer?: unknown[];
  [key: `ga-disable-${string}`]: boolean | undefined;
}

const analyticsWindow = window as unknown as AnalyticsWindow;
let analyticsLoaded = false;
let banner: HTMLElement | null = null;

function readChoice(): Choice | null {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) ?? "null") as {
      choice?: unknown;
      at?: unknown;
    } | null;
    if (!stored || typeof stored.at !== "number") return null;
    if (Date.now() - stored.at > choiceLifetime) return null;
    return stored.choice === "granted" || stored.choice === "denied" ? stored.choice : null;
  } catch {
    return null;
  }
}

function writeChoice(choice: Choice): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ choice, at: Date.now() }));
  } catch {
    // Without storage the choice lasts for this page only, and nothing loads
    // on the next page until the visitor is asked again.
  }
}

function loadAnalytics(): void {
  analyticsWindow[`ga-disable-${analyticsId}`] = false;
  if (analyticsLoaded) return;
  analyticsLoaded = true;

  const dataLayer = (analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? []);
  // gtag.js expects the raw arguments object, not an array.
  function gtag(..._parameters: unknown[]): void {
    // eslint-disable-next-line prefer-rest-params
    dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", analyticsId, {
    cookie_expires: cookieLifetimeSeconds,
    cookie_flags: "SameSite=Lax;Secure",
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  document.head.append(script);
}

function removeAnalytics(): void {
  analyticsWindow[`ga-disable-${analyticsId}`] = true;
  const hostParts = window.location.hostname.split(".");
  const domains = ["", window.location.hostname];
  if (hostParts.length > 1) domains.push(`.${hostParts.slice(-2).join(".")}`);
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !/^_ga/.test(name)) continue;
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

function closeBanner(): void {
  banner?.remove();
  banner = null;
}

function choose(choice: Choice): void {
  writeChoice(choice);
  if (choice === "granted") loadAnalytics();
  else removeAnalytics();
  closeBanner();
}

const bannerStyles = `
.consent-banner{position:fixed;right:16px;bottom:16px;left:16px;z-index:90;display:grid;gap:14px;max-width:440px;margin-left:auto;padding:20px 22px;border:1px solid rgb(11 12 15 / 10%);border-radius:20px;background:#fff;box-shadow:0 24px 60px -18px rgb(20 30 70 / 35%);color:#0b0c0f;font:15px/1.5 -apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",system-ui,sans-serif}
.consent-banner h2{margin:0;font-size:17px;font-weight:650;letter-spacing:-0.02em;color:#0b0c0f}
.consent-banner p{margin:0;color:#5d6470}
.consent-banner a{color:#1f5fe0}
.consent-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.consent-actions button{min-height:44px;border:0;border-radius:999px;background:#0b0c0f;color:#fff;font:inherit;font-weight:600;cursor:pointer}
.consent-actions button:hover{background:#2a2d35}
.consent-actions button:focus-visible{outline:3px solid #1f5fe0;outline-offset:2px}
`;

function openBanner(): void {
  if (banner) {
    banner.querySelector("button")?.focus();
    return;
  }

  if (!document.querySelector("style[data-consent-styles]")) {
    const style = document.createElement("style");
    style.dataset.consentStyles = "";
    style.textContent = bannerStyles;
    document.head.append(style);
  }

  banner = document.createElement("section");
  banner.className = "consent-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Audience measurement");
  banner.innerHTML = `
    <h2>Can we count your visit?</h2>
    <p>
      With your agreement, we use Google Analytics to see which pages are useful.
      It sets cookies and sends usage data to Google. If you refuse, nothing is
      loaded and the site works exactly the same.
      <a href="/privacy.html#cookies">Privacy policy</a>
    </p>
    <div class="consent-actions">
      <button type="button" data-consent-choice="denied">Refuse</button>
      <button type="button" data-consent-choice="granted">Accept</button>
    </div>`;
  banner.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLElement>("[data-consent-choice]");
    if (button) choose(button.dataset.consentChoice === "granted" ? "granted" : "denied");
  });
  document.body.append(banner);
}

export function initConsent(): void {
  // The footer is loaded after this runs, so its link is handled by delegation.
  document.addEventListener("click", (event) => {
    if (!(event.target as Element).closest?.("[data-consent-open]")) return;
    event.preventDefault();
    openBanner();
  });

  const choice = readChoice();
  if (choice === "granted") {
    loadAnalytics();
    return;
  }
  if (choice === "denied") return;
  // A browser-level "do not sell or share" signal is treated as a refusal.
  if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  openBanner();
}
