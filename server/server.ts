import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { readFile, stat } from "fs/promises";
import { extname, join, normalize, resolve, sep } from "path";
import { fileURLToPath } from "url";

import { getAlertEngineState, getAlertHistory, processAlert } from "./alerts";
import { handleAnalyze, isGeminiConfigured, checkGeminiKeyOnStartup } from "./analyze";

const PORT = Number(process.env.PORT) || 5000;
const HOST = "0.0.0.0";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST_DIR = resolve(__dirname, "..", "dist");
const INDEX_HTML = join(DIST_DIR, "index.html");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

const readJsonBody = (req: IncomingMessage): Promise<Record<string, unknown>> =>
  new Promise((resolveBody, rejectBody) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 32_000) {
        rejectBody(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) return resolveBody({});
      try {
        resolveBody(JSON.parse(data));
      } catch (err) {
        rejectBody(err);
      }
    });
    req.on("error", rejectBody);
  });

const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

const safeJoin = (root: string, urlPath: string): string | null => {
  const decoded = (() => {
    try {
      return decodeURIComponent(urlPath);
    } catch {
      return urlPath;
    }
  })();
  const cleaned = decoded.split("?")[0].split("#")[0];
  const target = normalize(join(root, cleaned));
  if (!target.startsWith(root + sep) && target !== root) return null;
  return target;
};

const serveFile = async (res: ServerResponse, filePath: string, statusCode = 200) => {
  try {
    const content = await readFile(filePath);
    res.statusCode = statusCode;
    res.setHeader("Content-Type", MIME[extname(filePath).toLowerCase()] || "application/octet-stream");
    if (filePath === INDEX_HTML) {
      res.setHeader("Cache-Control", "no-cache");
    } else if (/\/assets\//.test(filePath)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "public, max-age=300");
    }
    res.end(content);
  } catch {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not Found");
  }
};

const serveStaticOrIndex = async (req: IncomingMessage, res: ServerResponse) => {
  const urlPath = req.url || "/";
  const target = safeJoin(DIST_DIR, urlPath === "/" ? "/index.html" : urlPath);
  if (!target) {
    return serveFile(res, INDEX_HTML);
  }
  try {
    const s = await stat(target);
    if (s.isFile()) return serveFile(res, target);
  } catch {
    // fall through to index.html (SPA fallback)
  }
  return serveFile(res, INDEX_HTML);
};

const handleApi = async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
  const urlPath = (req.url || "").split("?")[0];

  if (urlPath === "/api/ai-status" && req.method === "GET") {
    sendJson(res, 200, {
      status: "ok",
      gemini: isGeminiConfigured(),
      model: "gemini-2.5-flash",
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (urlPath === "/api/analyze") {
    try {
      await handleAnalyze(req, res);
    } catch (err) {
      sendJson(res, 500, {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : "unknown",
      });
    }
    return true;
  }

  if (urlPath === "/api/alert-history" && req.method === "GET") {
    sendJson(res, 200, {
      history: getAlertHistory(),
      engine: getAlertEngineState(),
    });
    return true;
  }

  if (urlPath === "/api/send-alert" && req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      const score = num(body.score);
      if (score === null) {
        sendJson(res, 400, { error: "score required" });
        return true;
      }
      const result = await processAlert({
        score,
        level: typeof body.level === "string" ? body.level : "Manual",
        hr: num(body.hr ?? body.heartRate),
        spo2: num(body.spo2),
        temp: num(body.temp ?? body.temperature),
        resp: num(body.resp ?? body.respiration),
        geminiSummary: typeof body.geminiSummary === "string" ? body.geminiSummary : undefined,
      });
      sendJson(res, 200, result);
    } catch (err) {
      sendJson(res, 500, {
        error: "Internal server error",
        detail: err instanceof Error ? err.message : "unknown",
      });
    }
    return true;
  }

  return false;
};

const server = createServer(async (req, res) => {
  try {
    const handled = await handleApi(req, res);
    if (handled) return;
    await serveStaticOrIndex(req, res);
  } catch (err) {
    console.error("[server] Unhandled error:", err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("Internal Server Error");
    }
  }
});

checkGeminiKeyOnStartup();

server.listen(PORT, HOST, () => {
  console.log(`[server] MaternalCare production server listening on http://${HOST}:${PORT}`);
  console.log(`[server] Static root: ${DIST_DIR}`);
});
