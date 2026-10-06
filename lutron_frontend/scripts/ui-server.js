/**
 * SPA on port 3000, plus the uploaded logo / background / help files.
 * Those files are stored by the API. This process only reads them so the
 * browser can load them from the same origin as the page.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const handler = require("serve-handler");

const PORT = 3000;
const API_HOST = "127.0.0.1";
const API_PORT = 8000;
const BUILD = path.join(__dirname, "..", "build");
const MEDIA_PREFIXES = ["/background_image/", "/logo_image/", "/help_files/"];

function loadHeaders() {
  try {
    const raw = fs.readFileSync(path.join(BUILD, "serve.json"), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.headers) ? parsed.headers : [];
  } catch {
    return [];
  }
}

const headers = loadHeaders();

function mediaPath(urlPath) {
  if (!urlPath.startsWith("/") || urlPath.includes("..") || urlPath.includes("\\")) {
    return null;
  }
  const hit = MEDIA_PREFIXES.some(
    (prefix) => urlPath === prefix.slice(0, -1) || urlPath.startsWith(prefix)
  );
  return hit ? urlPath : null;
}

function proxySavedFile(req, res, urlPath) {
  const upstream = http.request(
    {
      hostname: API_HOST,
      port: API_PORT,
      path: urlPath,
      method: "GET",
      timeout: 15000,
    },
    (up) => {
      const type = up.headers["content-type"] || "application/octet-stream";
      if (String(type).includes("text/html")) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        up.resume();
        return;
      }
      res.writeHead(up.statusCode || 502, {
        "Content-Type": type,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
        "Cross-Origin-Resource-Policy": "same-origin",
      });
      up.pipe(res);
    }
  );
  upstream.on("timeout", () => upstream.destroy());
  upstream.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    }
    res.end("Upload is not available");
  });
  upstream.end();
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || "/").split("?")[0];
  const saved = mediaPath(urlPath);
  if (saved && req.method === "GET") {
    proxySavedFile(req, res, saved);
    return;
  }
  handler(req, res, {
    public: BUILD,
    rewrites: [{ source: "**", destination: "/index.html" }],
    headers,
  });
});

server.listen(PORT, "0.0.0.0", () => {
  process.stdout.write(`UI listening on ${PORT}\n`);
});
