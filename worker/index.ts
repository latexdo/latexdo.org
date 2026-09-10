interface WorkerEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const htmlAssetVersion = "2026-08-26-google-tag-manager";

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
