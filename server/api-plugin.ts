import type { Plugin } from "vite";

import { getAlertEngineState, getAlertHistory, processAlert } from "./alerts";
import { handleAnalyze } from "./analyze";

const sendJson = (res: any, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

const readJsonBody = (req: any): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer | string) => {
      data += chunk;
      if (data.length > 16_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });

const num = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export const apiPlugin = (): Plugin => {
  const middleware = async (req: any, res: any, next: any) => {
    const path = req.url ? req.url.split("?")[0] : "";

    if (path === "/api/analyze") {
      try {
        await handleAnalyze(req, res);
      } catch (err) {
        sendJson(res, 500, {
          error: "Internal server error",
          detail: err instanceof Error ? err.message : "unknown",
        });
      }
      return;
    }

    if (path === "/api/alert-history" && req.method === "GET") {
      sendJson(res, 200, {
        history: getAlertHistory(),
        engine: getAlertEngineState(),
      });
      return;
    }

    if (path === "/api/send-alert" && req.method === "POST") {
      try {
        const body = await readJsonBody(req);
        const score = num(body.score);
        if (score === null) {
          sendJson(res, 400, { error: "score required" });
          return;
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
      return;
    }

    next();
  };

  return {
    name: "maternal-care-api-plugin",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
};
