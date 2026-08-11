interface WorkerEnv {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

const htmlAssetVersion = "2026-08-11-legal-labels-icons";

export default {
  fetch(request: Request, env: WorkerEnv): Promise<Response> | Response {
    const url = new URL(request.url);
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const cfVisitor = request.headers.get("cf-visitor") ?? "";

    if (
      url.protocol === "http:" ||
      forwardedProto === "http" ||
      cfVisitor.includes('"scheme":"http"')
    ) {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (
      (request.method === "GET" || request.method === "HEAD") &&
      (url.pathname === "/" ||
        url.pathname.endsWith("/") ||
        url.pathname.endsWith(".html"))
    ) {
      url.searchParams.set("__latexdo_asset_version", htmlAssetVersion);
      return env.ASSETS.fetch(new Request(url, request));
    }

    return env.ASSETS.fetch(request);
  },
};
