import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Vitals = {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  respiration: number | null;
  movement: number | null;
  online: number | null;
};

type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

type AnalyzeResponse = {
  score: number;
  level: RiskLevel;
  factors: string[];
  signalQuality: "good" | "partial" | "offline";
  insight: {
    summary: string;
    recommendation: string;
    trend: string;
    source: "gemini" | "local";
    reason?: string;
  };
  analyzedAt: string;
};

const POLL_INTERVAL_MS = 60_000;
const SIGNIFICANT_DELTA = 15;

const isPresent = (v: number | null) => typeof v === "number" && !Number.isNaN(v) && v !== 0;

const levelStyle: Record<RiskLevel, { ring: string; chip: string; from: string; to: string; icon: typeof CheckCircle2 }> = {
  Low: {
    ring: "stroke-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    from: "from-emerald-400",
    to: "to-emerald-500",
    icon: CheckCircle2,
  },
  Moderate: {
    ring: "stroke-amber-500",
    chip: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    from: "from-amber-400",
    to: "to-amber-500",
    icon: ShieldCheck,
  },
  High: {
    ring: "stroke-orange-500",
    chip: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    from: "from-orange-400",
    to: "to-orange-500",
    icon: AlertTriangle,
  },
  Critical: {
    ring: "stroke-rose-500",
    chip: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    from: "from-rose-500",
    to: "to-rose-600",
    icon: AlertTriangle,
  },
};

const RiskGauge = ({ score, level }: { score: number; level: RiskLevel }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const style = levelStyle[level];

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="14"
          strokeLinecap="round"
          className={style.ring}
          initial={false}
          animate={{ strokeDasharray: `${dash} ${circumference}` }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={score}
          className="text-4xl font-semibold tracking-tight"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {score}
        </motion.span>
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
};

const Shimmer = () => (
  <div className="space-y-2">
    <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
    <div className="h-4 w-2/3 animate-pulse rounded-full bg-muted" />
    <div className="h-4 w-1/2 animate-pulse rounded-full bg-muted" />
  </div>
);

interface Props {
  vitals: Vitals;
  lastUpdated: Date | null;
}

export const AIInsightPanel = ({ vitals, lastUpdated }: Props) => {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const lastScoreRef = useRef<number | null>(null);
  const lastLevelRef = useRef<RiskLevel | null>(null);
  const lastCallAtRef = useRef<number>(0);

  const hasAnyVital = useMemo(
    () =>
      isPresent(vitals.heartRate) ||
      isPresent(vitals.spo2) ||
      isPresent(vitals.temperature) ||
      isPresent(vitals.respiration),
    [vitals],
  );

  const runAnalyze = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    lastCallAtRef.current = Date.now();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vitals),
      });
      if (!res.ok) {
        throw new Error(`Analyze failed (${res.status})`);
      }
      const json = (await res.json()) as AnalyzeResponse;
      setData(json);
      lastScoreRef.current = json.score;
      lastLevelRef.current = json.level;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [vitals]);

  // Initial analysis once we have any vital
  useEffect(() => {
    if (!data && !loading && !error && hasAnyVital) {
      runAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnyVital]);

  // Poll every 60 seconds while we have vitals
  useEffect(() => {
    if (!hasAnyVital) return;
    const id = setInterval(() => {
      runAnalyze();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasAnyVital, runAnalyze]);

  // Reactive trigger: significant local change triggers immediate refresh
  useEffect(() => {
    if (!data || !hasAnyVital) return;
    const localScore = quickLocalScore(vitals);
    const lastScore = lastScoreRef.current ?? data.score;
    const delta = Math.abs(localScore.score - lastScore);
    const levelChanged = localScore.level !== (lastLevelRef.current ?? data.level);
    const cooled = Date.now() - lastCallAtRef.current > 6_000; // throttle to avoid spam
    if (cooled && (delta >= SIGNIFICANT_DELTA || levelChanged)) {
      runAnalyze();
    }
  }, [vitals, data, hasAnyVital, runAnalyze]);

  const level = data?.level ?? "Low";
  const score = data?.score ?? 0;
  const style = levelStyle[level];
  const Icon = style.icon;

  const analyzedLabel = data
    ? new Date(data.analyzedAt).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

  return (
    <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft">
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
        <div className="space-y-1">
          <Badge variant="outline" className="rounded-full border-secondary/30 bg-secondary/10 text-secondary">
            <Sparkles className="mr-1 h-3 w-3" /> AI Health Intelligence
          </Badge>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-4 w-4 text-secondary" />
            Live Risk Analysis
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Hybrid clinical engine + Gemini explanations from your real-time belt signals.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={loading || !hasAnyVital}
          onClick={runAnalyze}
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Analyze
        </Button>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[auto_1fr]">
        {/* Gauge + level */}
        <div className="flex flex-col items-center gap-3">
          <RiskGauge score={score} level={level} />
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${style.chip}`}>
            <Icon className="h-3.5 w-3.5" />
            {level} Risk
          </div>
          <p className="text-[11px] text-muted-foreground">
            Signal: <span className="font-medium text-foreground">{data?.signalQuality ?? (hasAnyVital ? "good" : "awaiting")}</span>
          </p>
        </div>

        {/* Insight body */}
        <div className="space-y-4">
          {!hasAnyVital ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Awaiting live sensor signals from the belt. Insights will appear once values stream in.
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {loading && !data ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Shimmer />
                </motion.div>
              ) : data ? (
                <motion.div
                  key={data.analyzedAt}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Summary */}
                  <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-white to-muted/30 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">AI Summary</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{data.insight.summary}</p>
                  </div>

                  {/* Recommendation */}
                  <div className={`rounded-2xl border p-4 ${style.chip}`}>
                    <p className="text-xs font-medium uppercase tracking-wider opacity-80">Recommendation</p>
                    <p className="mt-1.5 text-sm leading-relaxed">{data.insight.recommendation}</p>
                  </div>

                  {/* Trend + factors */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-white p-4">
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" /> Trend
                      </p>
                      <p className="mt-1.5 text-sm text-foreground capitalize">{data.insight.trend}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reasons</p>
                      {data.factors.length === 0 ? (
                        <p className="mt-1.5 text-sm text-emerald-600">No anomalies detected.</p>
                      ) : (
                        <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                          {data.factors.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br ${style.from} ${style.to}`} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Footer meta */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                    <span>
                      Last analysis: <span className="font-medium text-foreground">{analyzedLabel}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${data.insight.source === "gemini" ? "bg-secondary" : "bg-amber-500"}`} />
                      {data.insight.source === "gemini" ? "Gemini insight" : "Local failsafe"}
                      {data.insight.source === "local" && data.insight.reason ? ` (${data.insight.reason})` : ""}
                    </span>
                  </div>
                </motion.div>
              ) : (
                <Shimmer />
              )}
            </AnimatePresence>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-600">
              {error}
            </div>
          )}

          {lastUpdated && (
            <p className="text-[11px] text-muted-foreground">
              Last sensor update:{" "}
              {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Lightweight client-side score (mirrors backend rules) used only to decide
// whether to trigger a fresh server analysis. Server is the source of truth.
function quickLocalScore(v: Vitals): { score: number; level: RiskLevel } {
  let score = 0;
  if (isPresent(v.heartRate)) {
    if (v.heartRate! > 120) score += 25;
    else if (v.heartRate! > 100) score += 15;
    else if (v.heartRate! < 55) score += 25;
  }
  if (isPresent(v.spo2)) {
    if (v.spo2! < 92) score += 50;
    else if (v.spo2! < 95) score += 35;
    else if (v.spo2! < 96) score += 20;
  }
  if (isPresent(v.temperature)) {
    if (v.temperature! >= 38) score += 30;
    else if (v.temperature! > 37.3) score += 15;
  }
  if (isPresent(v.respiration)) {
    if (v.respiration! > 24) score += 25;
    else if (v.respiration! > 20) score += 15;
    else if (v.respiration! < 10) score += 25;
  }
  if (v.online === 0) score += 50;
  score = Math.max(0, Math.min(100, Math.round(score)));
  let level: RiskLevel = "Low";
  if (score >= 70) level = "Critical";
  else if (score >= 45) level = "High";
  else if (score >= 20) level = "Moderate";
  return { score, level };
}
