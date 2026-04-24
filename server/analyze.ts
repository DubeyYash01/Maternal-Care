import type { IncomingMessage, ServerResponse } from "http";

import { computeRisk, localSummary, type Vitals } from "./risk";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_TIMEOUT_MS = 8000;

const sendJson = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
};

const readJsonBody = (req: IncomingMessage): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
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

const buildPrompt = (vitals: Vitals, risk: ReturnType<typeof computeRisk>) => `
You are an AI maternal health assistant. The risk score is already computed by a deterministic clinical engine — do NOT re-score.

Live vitals (only consider real values; ignore null):
- Heart rate: ${vitals.heartRate ?? "n/a"} BPM
- SpO2: ${vitals.spo2 ?? "n/a"} %
- Temperature: ${vitals.temperature ?? "n/a"} °C
- Respiration: ${vitals.respiration ?? "n/a"} bpm
- Movement (FSR): ${vitals.movement ?? "n/a"} AU
- Sensor online: ${vitals.online === 1 ? "yes" : vitals.online === 0 ? "no" : "n/a"}

Risk score: ${risk.score}/100 (${risk.level})
Reasons: ${risk.factors.join(" ") || "none"}

Reply ONLY as a strict JSON object (no markdown, no code fences) with these keys:
{
  "summary": "1 short sentence describing current state (under 22 words).",
  "recommendation": "1 short, calm, actionable suggestion (under 18 words). Never give medical diagnosis.",
  "trend": "1 short comment about pattern (under 14 words). Use 'stable' if nothing notable."
}
`.trim();

const extractJson = (text: string): { summary?: string; recommendation?: string; trend?: string } | null => {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
};

const callGemini = async (vitals: Vitals, risk: ReturnType<typeof computeRisk>) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false as const, reason: "missing_api_key" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildPrompt(vitals, risk) }] }],
        generationConfig: {
          temperature: 0.4,
          topP: 0.9,
          maxOutputTokens: 512,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      return { ok: false as const, reason: `gemini_http_${response.status}`, detail: txt.slice(0, 200) };
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = extractJson(text);
    if (!parsed) return { ok: false as const, reason: "parse_failed" };

    return { ok: true as const, parsed };
  } catch (err) {
    return {
      ok: false as const,
      reason: err instanceof Error && err.name === "AbortError" ? "timeout" : "network_error",
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const handleAnalyze = async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const vitals: Vitals = {
    heartRate: num(body.heartRate),
    spo2: num(body.spo2),
    temperature: num(body.temperature),
    respiration: num(body.respiration),
    movement: num(body.movement),
    online: num(body.online),
  };

  const risk = computeRisk(vitals);
  const local = localSummary(vitals, risk);

  const ai = await callGemini(vitals, risk);

  const insight = ai.ok
    ? {
        summary: ai.parsed.summary?.trim() || local.summary,
        recommendation: ai.parsed.recommendation?.trim() || local.recommendation,
        trend: ai.parsed.trend?.trim() || "stable",
        source: "gemini" as const,
      }
    : {
        summary: local.summary,
        recommendation: local.recommendation,
        trend: "n/a",
        source: "local" as const,
        reason: ai.reason,
      };

  sendJson(res, 200, {
    score: risk.score,
    level: risk.level,
    factors: risk.factors,
    signalQuality: risk.signalQuality,
    insight,
    analyzedAt: new Date().toISOString(),
  });
};
