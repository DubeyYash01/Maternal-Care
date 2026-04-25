import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  Brain,
  CheckCircle2,
  Download,
  Droplets,
  FileText,
  Heart,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Signal,
  Sparkles,
  Stethoscope,
  Thermometer,
  TrendingUp,
  Volume2,
  Waves,
  Wifi,
  WifiOff,
  Wind,
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
  ecgValue?: number | null;
  ecgHrBpm?: number | null;
  ecgLeadsOff?: number | null;
  micLevel?: number | null;
  movementHistory?: number[];
  ecgHistory?: number[];
};

type RiskLevel = "Excellent" | "Stable" | "Monitor Closely" | "High Risk" | "Critical";

type RiskFactor = {
  metric: string;
  value: string;
  band: string;
  impact: number;
};

type Reliability = {
  sensorOnline: boolean;
  ecgLeadsOff: boolean;
  missingSignals: string[];
};

type AnalyzeResponse = {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  singleAlerts: string[];
  combinations: string[];
  signalQuality: "good" | "partial" | "offline";
  reliability: Reliability;
  insight: {
    summary: string;
    recommendations: string[];
    report: string;
    severity: string;
    combinedFindings: string[];
    trend: string;
    source: "gemini" | "local";
    reason?: string;
  };
  alert?: {
    tier: "moderate" | "high" | "critical" | null;
    currentTier: "moderate" | "high" | "critical" | null;
    sent: boolean;
    reason: string;
  };
  analyzedAt: string;
};

type AlertHistoryEntry = {
  id: string;
  timestamp: string;
  score: number;
  level: string;
  tier: "moderate" | "high" | "critical";
  emailSent: boolean;
  reason: string;
  recipients: number;
};

const POLL_INTERVAL_MS = 60_000;
const SIGNIFICANT_DELTA = 12;

// 0 is a valid reading for movement/mic/ecg, but a 0 from physiological vitals
// (HR/SpO2/Temp/Resp) means the optical/thermal sensor failed to capture.
const isPresentVital = (v: number | null | undefined) =>
  typeof v === "number" && !Number.isNaN(v) && v !== 0;

const isPresentAny = (v: number | null | undefined) =>
  typeof v === "number" && !Number.isNaN(v);

const levelStyle: Record<
  RiskLevel,
  { ring: string; chip: string; from: string; to: string; icon: typeof CheckCircle2 }
> = {
  Excellent: {
    ring: "stroke-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    from: "from-emerald-400",
    to: "to-emerald-500",
    icon: CheckCircle2,
  },
  Stable: {
    ring: "stroke-teal-500",
    chip: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    from: "from-teal-400",
    to: "to-teal-500",
    icon: ShieldCheck,
  },
  "Monitor Closely": {
    ring: "stroke-amber-500",
    chip: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    from: "from-amber-400",
    to: "to-amber-500",
    icon: Activity,
  },
  "High Risk": {
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

// ---------------- Sub-components ----------------

const RiskGauge = ({ score, level }: { score: number; level: RiskLevel }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const style = levelStyle[level];
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" strokeLinecap="round" />
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
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">/ 100</span>
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

const LiveInputCell = ({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  unit?: string;
}) => (
  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-white px-2.5 py-2">
    <Icon className="h-3.5 w-3.5 text-primary" />
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold">
        {value}
        {unit && <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  </div>
);

const fmt = (v: number | null | undefined, digits = 0, allowZero = false) => {
  const ok = allowZero ? isPresentAny(v) : isPresentVital(v);
  if (!ok) return "—";
  return digits ? (v as number).toFixed(digits) : Math.round(v as number).toString();
};

// ---------------- Main panel ----------------

interface Props {
  vitals: Vitals;
  lastUpdated: Date | null;
}

export const AIInsightPanel = ({ vitals, lastUpdated }: Props) => {
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryEntry[]>([]);
  const [smtpConfigured, setSmtpConfigured] = useState<boolean>(true);
  const [recentlySent, setRecentlySent] = useState<{ tier: string; at: number } | null>(null);
  const inFlight = useRef(false);
  const lastScoreRef = useRef<number | null>(null);
  const lastLevelRef = useRef<RiskLevel | null>(null);
  const lastCallAtRef = useRef<number>(0);

  const fetchAlertHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/alert-history");
      if (!res.ok) return;
      const json = (await res.json()) as {
        history: AlertHistoryEntry[];
        engine: { smtpConfigured: boolean };
      };
      setAlertHistory(json.history);
      setSmtpConfigured(json.engine.smtpConfigured);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAlertHistory();
    const id = setInterval(fetchAlertHistory, 30_000);
    return () => clearInterval(id);
  }, [fetchAlertHistory]);

  const hasAnyVital = useMemo(
    () =>
      isPresentVital(vitals.heartRate) ||
      isPresentVital(vitals.spo2) ||
      isPresentVital(vitals.temperature) ||
      isPresentVital(vitals.respiration) ||
      vitals.online === 0,
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
      if (!res.ok) throw new Error(`Analysis failed (${res.status})`);
      const json = (await res.json()) as AnalyzeResponse;
      setData(json);
      lastScoreRef.current = json.score;
      lastLevelRef.current = json.level;
      if (json.alert?.sent && json.alert.tier) {
        setRecentlySent({ tier: json.alert.tier, at: Date.now() });
        fetchAlertHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [vitals, fetchAlertHistory]);

  useEffect(() => {
    if (!data && !loading && !error && hasAnyVital) runAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnyVital]);

  useEffect(() => {
    if (!hasAnyVital) return;
    const id = setInterval(() => runAnalyze(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasAnyVital, runAnalyze]);

  useEffect(() => {
    if (!data || !hasAnyVital) return;
    const localScore = quickLocalScore(vitals);
    const lastScore = lastScoreRef.current ?? data.score;
    const delta = Math.abs(localScore.score - lastScore);
    const levelChanged = localScore.level !== (lastLevelRef.current ?? data.level);
    const cooled = Date.now() - lastCallAtRef.current > 6_000;
    if (cooled && (delta >= SIGNIFICANT_DELTA || levelChanged)) runAnalyze();
  }, [vitals, data, hasAnyVital, runAnalyze]);

  const level: RiskLevel = data?.level ?? "Excellent";
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

  const factorBars = useMemo(() => {
    if (!data) return [];
    return data.factors
      .slice()
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 6)
      .map((f) => ({ ...f, pct: Math.min(100, (f.impact / 35) * 100) }));
  }, [data]);

  const downloadReport = useCallback(() => {
    if (!data?.insight.report) return;
    const blob = new Blob([data.insight.report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maternal-care-report-${new Date(data.analyzedAt)
      .toISOString()
      .replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  // Sensor reliability flags (derived live, not just from server response)
  const liveReliability: Reliability = {
    sensorOnline: vitals.online === 1,
    ecgLeadsOff: vitals.ecgLeadsOff === 1,
    missingSignals: [
      !isPresentVital(vitals.heartRate) && "Heart Rate",
      !isPresentVital(vitals.spo2) && "SpO₂",
      !isPresentVital(vitals.temperature) && "Temperature",
      !isPresentVital(vitals.respiration) && "Respiration",
    ].filter(Boolean) as string[],
  };

  return (
    <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft">
      <CardHeader className="flex-row items-start justify-between space-y-0 gap-4">
        <div className="space-y-1">
          <Badge variant="outline" className="rounded-full border-secondary/30 bg-secondary/10 text-secondary">
            <Sparkles className="mr-1 h-3 w-3" /> Clinical Decision Support
          </Badge>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-4 w-4 text-secondary" />
            AI Health Intelligence
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Real-time IoT sensor fusion · weighted clinical engine · Gemini reasoning.
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" disabled={loading || !hasAnyVital} onClick={runAnalyze}>
          {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
          Analyze
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Live inputs mini panel */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Live Inputs to Engine</p>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {vitals.online === 1 ? (
                <><Wifi className="h-3 w-3 text-emerald-500" /> Sensor online</>
              ) : vitals.online === 0 ? (
                <><WifiOff className="h-3 w-3 text-rose-500" /> Sensor offline</>
              ) : (
                <><Wifi className="h-3 w-3 text-muted-foreground" /> Awaiting</>
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
            <LiveInputCell icon={Heart} label="HR" value={fmt(vitals.heartRate)} unit="bpm" />
            <LiveInputCell icon={Droplets} label="SpO₂" value={fmt(vitals.spo2)} unit="%" />
            <LiveInputCell icon={Thermometer} label="Temp" value={fmt(vitals.temperature, 1)} unit="°C" />
            <LiveInputCell icon={Wind} label="Resp" value={fmt(vitals.respiration)} unit="bpm" />
            <LiveInputCell icon={Signal} label="Pressure" value={fmt(vitals.movement, 0, true)} unit="AU" />
            <LiveInputCell icon={Waves} label="ECG" value={fmt(vitals.ecgValue, 2, true)} unit="mV" />
            <LiveInputCell icon={Volume2} label="Mic" value={fmt(vitals.micLevel, 0, true)} />
          </div>
        </div>

        {/* Top: Gauge + Summary side-by-side */}
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3">
            <RiskGauge score={score} level={level} />
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${style.chip}`}>
              <Icon className="h-3.5 w-3.5" />
              {level}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Signal: <span className="font-medium text-foreground">{data?.signalQuality ?? (hasAnyVital ? "good" : "awaiting")}</span>
            </p>
          </div>

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
                    <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-white to-muted/30 p-4">
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        <Brain className="h-3.5 w-3.5" /> AI Summary
                      </p>
                      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground">
                        {data.insight.summary}
                      </p>
                    </div>

                    <div className={`rounded-2xl border p-4 ${style.chip}`}>
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider opacity-80">
                        <Stethoscope className="h-3.5 w-3.5" /> AI Recommendations
                      </p>
                      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed">
                        {data.insight.recommendations.map((r, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current opacity-70" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : (
                  <Shimmer />
                )}
              </AnimatePresence>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-600">{error}</div>
            )}
          </div>
        </div>

        {/* Bottom grid: Single Alerts | Combined | Reliability */}
        {data && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Single Parameter Alerts */}
            <div className="rounded-2xl border border-border/60 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> Single-Parameter Alerts
              </p>
              {data.singleAlerts.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-600">All metrics within normal ranges.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {data.singleAlerts.map((a, i) => (
                    <div key={i} className="rounded-lg bg-amber-500/5 px-2.5 py-1.5 text-[12px] text-amber-700">
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Combined Conditions */}
            <div className="rounded-2xl border border-border/60 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Activity className="h-3.5 w-3.5" /> Combined Conditions
              </p>
              {(data.insight.combinedFindings ?? data.combinations).length === 0 ? (
                <p className="mt-2 text-sm text-emerald-600">No combined risk patterns detected.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {(data.insight.combinedFindings ?? data.combinations).map((c, i) => (
                    <div key={i} className="rounded-lg bg-orange-500/5 px-2.5 py-1.5 text-[12px] text-orange-700">
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sensor Reliability */}
            <div className="rounded-2xl border border-border/60 bg-white p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Signal className="h-3.5 w-3.5" /> Sensor Reliability
              </p>
              <div className="mt-2 space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Belt connectivity</span>
                  <span className={liveReliability.sensorOnline ? "font-medium text-emerald-600" : "font-medium text-rose-600"}>
                    {liveReliability.sensorOnline ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ECG leads</span>
                  <span className={liveReliability.ecgLeadsOff ? "font-medium text-rose-600" : "font-medium text-emerald-600"}>
                    {liveReliability.ecgLeadsOff ? "Disconnected" : "Connected"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground">Missing signals</span>
                  <span className="text-right font-medium">
                    {liveReliability.missingSignals.length === 0 ? (
                      <span className="text-emerald-600">None</span>
                    ) : (
                      <span className="text-amber-700">{liveReliability.missingSignals.join(", ")}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reason breakdown + Trend */}
        {data && (
          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-border/60 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Weighted Reason Breakdown</p>
              {factorBars.length === 0 ? (
                <p className="mt-2 text-sm text-emerald-600">No anomalies — all weighted factors at baseline.</p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {factorBars.map((f) => (
                    <div key={f.metric}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-foreground">
                          {f.metric} <span className="text-muted-foreground">({f.value} · {f.band})</span>
                        </span>
                        <span className="font-mono text-muted-foreground">+{f.impact}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${style.from} ${style.to}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${f.pct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-border/60 bg-white p-4">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" /> Trend
                </p>
                <p className="mt-1.5 text-sm capitalize text-foreground">{data.insight.trend}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Score Composition</p>
                <div className="mt-2 grid grid-cols-2 gap-y-1 text-[11px]">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-right font-semibold">{data.score} / 100</span>
                  <span className="text-muted-foreground">Factors</span>
                  <span className="text-right font-semibold">{data.factors.length}</span>
                  <span className="text-muted-foreground">Combos</span>
                  <span className="text-right font-semibold">{data.combinations.length}</span>
                  <span className="text-muted-foreground">Signal</span>
                  <span className="text-right font-semibold capitalize">{data.signalQuality}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Alert Banner — flashes when an email was just sent */}
        <AnimatePresence>
          {recentlySent && Date.now() - recentlySent.at < 8000 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
                recentlySent.tier === "critical"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
                  : recentlySent.tier === "high"
                  ? "border-orange-500/30 bg-orange-500/10 text-orange-700"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700"
              }`}
            >
              <BellRing className="h-4 w-4 animate-pulse" />
              <span>
                {recentlySent.tier === "critical"
                  ? "Critical emergency alert email dispatched to caregivers."
                  : recentlySent.tier === "high"
                  ? "High-risk alert email dispatched to caregivers."
                  : "Moderate-risk alert email dispatched to caregivers."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Alert History */}
        <div className="rounded-2xl border border-border/60 bg-white p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-secondary" />
              <p className="text-sm font-semibold">Smart Alert History</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Mail className="h-3 w-3" />
              {smtpConfigured ? "SMTP active · 4 caregivers" : "SMTP not configured"}
            </span>
          </div>
          {alertHistory.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No alerts yet. The system will email caregivers automatically when score crosses 65 / 75 / 80.
            </p>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-auto pr-1">
              {alertHistory.map((a) => {
                const tone =
                  a.tier === "critical"
                    ? "bg-rose-500/5 border-rose-500/20 text-rose-700"
                    : a.tier === "high"
                    ? "bg-orange-500/5 border-orange-500/20 text-orange-700"
                    : "bg-amber-500/5 border-amber-500/20 text-amber-700";
                const time = new Date(a.timestamp).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[12px] ${tone}`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-[11px] opacity-70">{time}</span>
                      <span className="font-semibold capitalize">{a.tier}</span>
                      <span className="text-muted-foreground">· score {a.score}</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      {a.emailSent ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-700">Sent · {a.recipients}</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3 w-3 text-rose-600" />
                          <span className="text-rose-700">Failed</span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Smart Report */}
        {data && (
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-secondary/5 via-white to-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                <p className="text-sm font-semibold">Smart Wellness Report</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 rounded-full px-3 text-xs" onClick={() => setShowReport((v) => !v)}>
                  {showReport ? "Hide" : "View"}
                </Button>
                <Button variant="outline" size="sm" className="h-7 rounded-full px-3 text-xs" onClick={downloadReport}>
                  <Download className="mr-1 h-3 w-3" /> .txt
                </Button>
              </div>
            </div>
            <AnimatePresence>
              {showReport && (
                <motion.pre
                  key="report"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-white p-3 text-[11px] leading-relaxed text-foreground"
                >
                  {data.insight.report}
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Footer meta */}
        {data && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>Last analysis: <span className="font-medium text-foreground">{analyzedLabel}</span></span>
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${data.insight.source === "gemini" ? "bg-secondary" : "bg-amber-500"}`} />
              {data.insight.source === "gemini" ? "Gemini insight" : "Local failsafe"}
              {data.insight.source === "local" && data.insight.reason ? ` (${data.insight.reason})` : ""}
            </span>
          </div>
        )}

        {lastUpdated && (
          <p className="text-[11px] text-muted-foreground">
            Last sensor update: {lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

// Mirrors backend rules; used only to decide whether to trigger a fresh server analysis.
function quickLocalScore(v: Vitals): { score: number; level: RiskLevel } {
  let score = 0;
  let hrHigh = false, hrLow = false, spo2Low = false, tempFever = false, respHigh = false;

  if (isPresentVital(v.heartRate)) {
    const hr = v.heartRate!;
    if (hr > 130) score += 25;
    else if (hr >= 111) score += 18;
    else if (hr >= 101) score += 8;
    else if (hr < 50) score += 25;
    else if (hr < 60) score += 12;
    if (hr > 100) hrHigh = true;
    if (hr < 60) hrLow = true;
  }
  if (isPresentVital(v.spo2)) {
    const o = v.spo2!;
    if (o < 90) score += 35;
    else if (o <= 92) score += 28;
    else if (o <= 94) score += 18;
    else if (o <= 96) score += 8;
    if (o < 95) spo2Low = true;
  }
  if (isPresentVital(v.temperature)) {
    const t = v.temperature!;
    if (t >= 39) score += 20;
    else if (t >= 38) score += 14;
    else if (t >= 37.3) score += 6;
    else if (t < 35.5) score += 18;
    if (t >= 38) tempFever = true;
  }
  if (isPresentVital(v.respiration)) {
    const r = v.respiration!;
    if (r > 30) score += 15;
    else if (r >= 25) score += 11;
    else if (r >= 21) score += 6;
    else if (r < 10) score += 12;
    if (r > 20) respHigh = true;
  }
  if (v.online === 0) score += 30;
  if (v.ecgLeadsOff === 1) score += 8;

  if (spo2Low && hrHigh) score += 5;
  if (tempFever && hrHigh) score += 5;
  if (spo2Low && respHigh) score += 5;
  if (v.online === 0 && (hrHigh || hrLow || spo2Low || tempFever || respHigh)) score += 10;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: RiskLevel = "Excellent";
  if (score >= 81) level = "Critical";
  else if (score >= 61) level = "High Risk";
  else if (score >= 41) level = "Monitor Closely";
  else if (score >= 21) level = "Stable";
  if (v.online === 0 && (level === "Excellent" || level === "Stable")) level = "Monitor Closely";
  return { score, level };
}
