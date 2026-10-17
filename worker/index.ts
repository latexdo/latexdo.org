interface WorkerEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  // Set with `wrangler secret put TURNSTILE_SECRET_KEY`.
  TURNSTILE_SECRET_KEY?: string;
}

// Feeds LatexDo fetches from its own origin: updates, downloads and the store catalog.
const feedJsonPattern = /^\/(?:downloads|updates|store)\/.+\.json$/;
// Installers are GitHub release assets of latexdo/latexdo-desktop. Downloads and
// update feeds link them through this site, which installed apps trust for
// updates; every installer is checked against the SHA-256 in the signed feed.
const installerPattern =
  /^\/downloads\/(v\d+\.\d+\.\d+[A-Za-z0-9.-]*)\/(LatexDo-(?:macos-arm64\.dmg|macos-x64\.dmg|windows-x64\.exe|linux-x64\.AppImage))$/;
const installerReleaseBase = "https://github.com/latexdo/latexdo-desktop/releases/download";
// Release pages are replaced by each new build, so links to retired ones go to
// the current downloads page instead of a 404.
const releasePagePattern = /^\/downloads\/v\d+\.\d+\.\d+[A-Za-z0-9.-]*\/(?:index\.html)?$/;
// Feeds, checksums and source files are for the app and readers, not search results.
const dataFilePattern = /\.(?:json|txt|md|pem|ts|tsx|mjs|csv)$/;
const canonicalHost = "latexdo.org";
// Email addresses are never in the pages. A visitor who passes a Cloudflare
// Turnstile check gets them from this endpoint, so scrapers cannot collect them.
const emailPath = "/api/email";
const mailboxes = ["hello", "sponsors", "security"] as const;
const turnstileVerifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const htmlHeaderValues = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000",
  // Pages may only be framed by this site, which blocks clickjacking.
  "Content-Security-Policy": "frame-ancestors 'self'",
} as const;
const feedHeaderValues = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type, User-Agent",
  "Cache-Control": "public, max-age=60",
  "X-Robots-Tag": "noindex",
} as const;

function feedHeaders(): Headers {
  return new Headers(feedHeaderValues);
}

function withHtmlHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(htmlHeaderValues)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

async function revealEmails(request: Request, env: WorkerEnv): Promise<Response> {
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);
  if (!env.TURNSTILE_SECRET_KEY) return jsonResponse({ error: "Email reveal is not configured" }, 503);

  let token: unknown;
  try {
    ({ token } = (await request.json()) as { token?: unknown });
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400);
  }
  if (typeof token !== "string" || !token || token.length > 2048) {
    return jsonResponse({ error: "Missing verification" }, 400);
  }

  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);
  const verification = await fetch(turnstileVerifyUrl, { method: "POST", body: form });
  const outcome = (await verification.json().catch(() => null)) as { success?: boolean } | null;
  if (!outcome?.success) return jsonResponse({ error: "Verification failed" }, 403);

  return jsonResponse(
    { addresses: Object.fromEntries(mailboxes.map((mailbox) => [mailbox, `${mailbox}@${canonicalHost}`])) },
    200,
  );
}

function withFeedHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(feedHeaderValues)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const cfVisitor = request.headers.get("cf-visitor") ?? "";

    const isLocalhost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";

    if (url.hostname === `www.${canonicalHost}`) {
      url.hostname = canonicalHost;
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (
      !isLocalhost &&
      (url.protocol === "http:" ||
        forwardedProto === "http" ||
        cfVisitor.includes('"scheme":"http"'))
    ) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === emailPath) return revealEmails(request, env);

    const installer = url.pathname.match(installerPattern);
    if (installer && (request.method === "GET" || request.method === "HEAD")) {
      const [, release, filename] = installer;
      return Response.redirect(`${installerReleaseBase}/${release}/${filename}`, 302);
    }

    if (feedJsonPattern.test(url.pathname)) {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: feedHeaders() });
      }

      if (request.method === "GET" || request.method === "HEAD") {
        return withFeedHeaders(await env.ASSETS.fetch(request));
      }
    }

    if (
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === "/" ||
        url.pathname.endsWith("/") ||
        url.pathname.endsWith(".html"))
    ) {
      url.searchParams.set("__latexdo_asset_version", Date.now().toString());
      const response = await env.ASSETS.fetch(new Request(url, request));

      const status = response.status;
      if (
        (status === 301 ||
          status === 302 ||
          status === 303 ||
          status === 307 ||
          status === 308) &&
        response.headers.get("location")
      ) {
        const location = new URL(response.headers.get("location")!, request.url);
        location.searchParams.delete("__latexdo_asset_version");
        const headers = new Headers(response.headers);
        headers.set("location", location.toString());
        return new Response(null, { status, headers });
      }

      if (status === 404 && releasePagePattern.test(url.pathname)) {
        return Response.redirect(new URL("/downloads/", request.url).toString(), 301);
      }

      return withHtmlHeaders(response);
    }

    const response = await env.ASSETS.fetch(request);
    if (dataFilePattern.test(url.pathname)) {
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex");
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return response;
  },
};
