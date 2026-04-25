import type { IncomingMessage, ServerResponse } from "http";

import { processAlert, tierFromScore } from "./alerts";
import { computeRisk, localSummary, type Vitals } from "./risk";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_TIMEOUT_MS = 9000;
const GEMINI_MAX_ATTEMPTS = 2;
const GEMINI_FALLBACK_MESSAGE = "AI service temporarily unavailable";

export const isGeminiConfigured = (): boolean =>
  typeof process.env.GEMINI_API_KEY === "string" && process.env.GEMINI_API_KEY.trim().length > 0;

export const checkGeminiKeyOnStartup = (): void => {
  if (!isGeminiConfigured()) {
    console.warn("[gemini] Gemini API key missing — set GEMINI_API_KEY in Replit Secrets to enable AI insights.");
  } else {
    console.log("[gemini] Gemini API key detected — AI insights enabled (model: " + GEMINI_MODEL + ").");
  }
};

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
      if (data.length > 32_000) {
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

const numArray = (v: unknown): number[] | undefined => {
  if (!Array.isArray(v)) return undefined;
  const arr = v.map((x) => num(x)).filter((x): x is number => x !== null);
  return arr.length ? arr : undefined;
};

type GeminiInsight = {
  summary?: string;
  recommendations?: string[];
  report?: string;
  severity?: string;
  combinedFindings?: string[];
  trend?: string;
};

const buildPrompt = (vitals: Vitals, risk: ReturnType<typeof computeRisk>) => `
You are a maternal wellness monitoring assistant. A deterministic clinical engine has already computed the risk score and breakdown — do NOT re-score, and do NOT make medical diagnoses. Always use safe wellness wording (monitoring insight, wellness alert, recommend consultation, recheck sensor placement, hydrate and rest, repeat reading in 5 minutes, immediate attention advised if symptoms present).

Live signals:
- Heart rate: ${vitals.heartRate ?? "n/a"} BPM
- SpO2: ${vitals.spo2 ?? "n/a"} %
- Temperature: ${vitals.temperature ?? "n/a"} °C
- Respiration: ${vitals.respiration ?? "n/a"} bpm
- Movement (FSR): ${vitals.movement ?? "n/a"} AU
- ECG (mV): ${vitals.ecgValue ?? "n/a"}
- ECG-derived HR: ${vitals.ecgHrBpm ?? "n/a"} BPM
- Mic / acoustic level: ${vitals.micLevel ?? "n/a"}
- Sensor online: ${vitals.online === 1 ? "yes" : vitals.online === 0 ? "no" : "n/a"}
- ECG leads off: ${vitals.ecgLeadsOff === 1 ? "yes" : "no"}

Engine result:
- Risk score: ${risk.score}/100
- Severity level: ${risk.level}
- Single-parameter alerts: ${risk.singleAlerts.join(" | ") || "none"}
- Multi-parameter combined findings: ${risk.combinations.join(" | ") || "none"}
- Sensor reliability: online=${risk.reliability.sensorOnline}, leadsOff=${risk.reliability.ecgLeadsOff}, missing=${risk.reliability.missingSignals.join(",") || "none"}

Reply with ONLY a strict JSON object (no markdown, no code fences) using exactly these keys:
{
  "summary": "2-3 short professional wellness sentences (under 60 words total) synthesising the current state.",
  "recommendations": ["3-5 short bullet recommendations, each under 14 words, safe wellness wording, no diagnosis"],
  "report": "A 4-6 line mini health report referencing concrete numbers and the severity level. Plain text with line breaks.",
  "severity": "${risk.level}",
  "combinedFindings": ["0-4 short notes describing combined patterns observed (echo or refine the engine's combined findings)"],
  "trend": "Short pattern comment under 12 words (use 'stable' if nothing notable)."
}
`.trim();

const extractJson = (text: string): GeminiInsight | null => {
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

type GeminiResult =
  | { ok: true; parsed: GeminiInsight }
  | { ok: false; reason: string; detail?: string; retryable?: boolean };

const callGeminiOnce = async (
  apiKey: string,
  vitals: Vitals,
  risk: ReturnType<typeof computeRisk>,
): Promise<GeminiResult> => {
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
          maxOutputTokens: 900,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      // 5xx and 429 are transient and worth a retry; 4xx (auth/bad key/model) are not.
      const retryable = response.status >= 500 || response.status === 429;
      return {
        ok: false,
        reason: `gemini_http_${response.status}`,
        detail: txt.slice(0, 240),
        retryable,
      };
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = extractJson(text);
    if (!parsed) return { ok: false, reason: "parse_failed", retryable: true };

    return { ok: true, parsed };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      reason: isTimeout ? "timeout" : "network_error",
      detail: err instanceof Error ? err.message.slice(0, 200) : undefined,
      retryable: true,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const callGemini = async (
  vitals: Vitals,
  risk: ReturnType<typeof computeRisk>,
): Promise<GeminiResult> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    console.warn("[gemini] Gemini API key missing — using local failsafe.");
    return { ok: false, reason: "missing_api_key" };
  }

  let last: GeminiResult = { ok: false, reason: "no_attempt" };
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt += 1) {
    last = await callGeminiOnce(apiKey, vitals, risk);
    if (last.ok) return last;
    if (!last.retryable) {
      console.warn(`[gemini] Request failed (no retry): ${last.reason}${last.detail ? " — " + last.detail : ""}`);
      return last;
    }
    if (attempt < GEMINI_MAX_ATTEMPTS) {
      console.warn(`[gemini] Attempt ${attempt} failed (${last.reason}) — retrying once.`);
      await new Promise((r) => setTimeout(r, 350));
    }
  }
  console.warn(`[gemini] All attempts failed: ${last.reason}${last.detail ? " — " + last.detail : ""}`);
  return last;
};

const cleanStrArray = (v: unknown, max = 6): string[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean)
    .slice(0, max);
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
    ecgValue: num(body.ecgValue),
    ecgHrBpm: num(body.ecgHrBpm),
    ecgLeadsOff: num(body.ecgLeadsOff),
    micLevel: num(body.micLevel),
    movementHistory: numArray(body.movementHistory),
    ecgHistory: numArray(body.ecgHistory),
  };

  const risk = computeRisk(vitals);
  const local = localSummary(vitals, risk);

  const ai = await callGemini(vitals, risk);

  const insight = ai.ok
    ? {
        summary: ai.parsed.summary?.trim() || local.summary,
        recommendations: cleanStrArray(ai.parsed.recommendations, 6).length
          ? cleanStrArray(ai.parsed.recommendations, 6)
          : local.recommendations,
        report: ai.parsed.report?.trim() || local.report,
        severity: ai.parsed.severity?.trim() || risk.level,
        combinedFindings: cleanStrArray(ai.parsed.combinedFindings, 6).length
          ? cleanStrArray(ai.parsed.combinedFindings, 6)
          : risk.combinations,
        trend: ai.parsed.trend?.trim() || local.trend,
        source: "gemini" as const,
      }
    : {
        summary: local.summary,
        recommendations: local.recommendations,
        report: local.report,
        severity: risk.level,
        combinedFindings: risk.combinations,
        trend: local.trend,
        source: "local" as const,
        reason: ai.reason,
        userMessage:
          ai.reason === "missing_api_key"
            ? "AI key not configured — showing local insight."
            : GEMINI_FALLBACK_MESSAGE,
      };

  // Evaluate + (maybe) dispatch tier email alert
  const alert = await processAlert({
    score: risk.score,
    level: risk.level,
    hr: vitals.heartRate,
    spo2: vitals.spo2,
    temp: vitals.temperature,
    resp: vitals.respiration,
    geminiSummary: insight.summary,
  });

  sendJson(res, 200, {
    score: risk.score,
    level: risk.level,
    factors: risk.factors,
    singleAlerts: risk.singleAlerts,
    combinations: risk.combinations,
    signalQuality: risk.signalQuality,
    reliability: risk.reliability,
    insight,
    alert: {
      tier: alert.tier,
      currentTier: tierFromScore(risk.score),
      sent: alert.sent,
      reason: alert.reason,
    },
    analyzedAt: new Date().toISOString(),
  });
};
