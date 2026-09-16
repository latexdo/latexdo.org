interface WorkerEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const htmlAssetVersion = "2026-09-16-downloads-migration";
const feedJsonPattern = /^\/(?:downloads|updates)\/.+\.json$/;
const feedHeaderValues = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Accept, Content-Type, User-Agent",
  "Cache-Control": "public, max-age=60",
} as const;

function feedHeaders(): Headers {
  return new Headers(feedHeaderValues);
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

    if (
      !isLocalhost &&
      (url.protocol === "http:" ||
        forwardedProto === "http" ||
        cfVisitor.includes('"scheme":"http"'))
    ) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (
      url.pathname === "/cli" ||
      url.pathname.startsWith("/cli/") ||
      url.pathname === "/server" ||
      url.pathname.startsWith("/server/")
    ) {
      return Response.redirect(new URL("/", url.origin).toString(), 301);
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
      url.searchParams.set("__latexdo_asset_version", htmlAssetVersion);
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

      return response;
    }

    return env.ASSETS.fetch(request);
  },
};
