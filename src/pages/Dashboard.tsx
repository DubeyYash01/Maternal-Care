import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Bell,
  Brain,
  ClipboardList,
  Cloud,
  Droplets,
  Heart,
  HeartPulse,
  LogOut,
  Radio,
  ShieldCheck,
  Signal,
  Sparkles,
  Thermometer,
  Wind,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line as LineShape,
  LineChart as LineGraph,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AIInsightPanel } from "@/components/AIInsightPanel";
import { AlertTimeline } from "@/components/AlertTimeline";
import { Navigation } from "@/components/Navigation";
import { useRealtimeSensors } from "@/hooks/useRealtimeSensors";

type Status = "healthy" | "warning" | "critical" | "idle";

const statusStyle: Record<Status, { dot: string; chip: string; label: string }> = {
  healthy: {
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    label: "Healthy",
  },
  warning: {
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    label: "Warning",
  },
  critical: {
    dot: "bg-rose-500",
    chip: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    label: "Critical",
  },
  idle: {
    dot: "bg-slate-400",
    chip: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    label: "Awaiting",
  },
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const heartRateStatus = (v: number | null): Status => {
  if (v === null || v === 0) return "idle";
  if (v < 55 || v > 110) return "critical";
  if (v < 60 || v > 100) return "warning";
  return "healthy";
};
const spo2Status = (v: number | null): Status => {
  if (v === null || v === 0) return "idle";
  if (v < 90) return "critical";
  if (v < 95) return "warning";
  return "healthy";
};
const tempStatus = (v: number | null): Status => {
  if (v === null || v === 0) return "idle";
  if (v >= 38.5) return "critical";
  if (v >= 37.5 || v < 35.5) return "warning";
  return "healthy";
};
const respStatus = (v: number | null): Status => {
  if (v === null || v === 0) return "idle";
  if (v < 10 || v > 25) return "critical";
  if (v < 12 || v > 20) return "warning";
  return "healthy";
};

const StatusChip = ({ status }: { status: Status }) => {
  const s = statusStyle[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${s.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status !== "idle" ? "animate-pulse" : ""}`} />
      {s.label}
    </span>
  );
};

const chartConfig: ChartConfig = {
  heartRate: { label: "Heart Rate", color: "hsl(var(--accent-warm))" },
  ecg: { label: "ECG", color: "hsl(var(--secondary))" },
  spo2: { label: "SpO2", color: "hsl(var(--primary))" },
  temperature: { label: "Temperature", color: "hsl(var(--accent-warm))" },
  pressure: { label: "Pressure", color: "hsl(var(--success))" },
  respiration: { label: "Respiration", color: "hsl(var(--secondary))" },
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { sensorData, history, lastUpdated, ecgValue } = useRealtimeSensors();

  const heartRate = sensorData.maxHrBpm ?? 0;
  const spo2 = sensorData.maxSpO2 ?? 0;
  const temperature = sensorData.tempC ?? 0;
  const respiration = sensorData.respBpm ?? 0;
  const pressure = sensorData.fsrAU ?? 0;
  const ecgReading = ecgValue ?? 0;

  const hrStatus = heartRateStatus(sensorData.maxHrBpm);
  const oxStatus = spo2Status(sensorData.maxSpO2);
  const tStatus = tempStatus(sensorData.tempC);
  const rStatus = respStatus(sensorData.respBpm);

  const tempLevel = clamp((temperature - 34) / 6, 0, 1);
  const pressureLevel = clamp(pressure / 100, 0, 1);

  const spo2Data = [{ name: "SpO2", value: spo2 || 0, fill: "hsl(var(--primary))" }];

  const trendData = useMemo(
    () =>
      history.heartRate.map((entry, index) => ({
        time: entry.time,
        heartRate: entry.value,
        temperature: history.temperature[index]?.value ?? null,
        spo2: history.spo2[index]?.value ?? null,
      })),
    [history.heartRate, history.temperature, history.spo2],
  );

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Awaiting data";

  const handleSignOut = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* ===================== HEADER ===================== */}
      <section className="relative overflow-hidden border-b border-white/40">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-sky-50" />
          <div className="absolute -top-32 left-1/3 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 blur-3xl" />
        </div>

        <div className="container mx-auto px-6 pt-12 pb-10 lg:pt-16 lg:pb-14">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <Badge className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
                <Sparkles className="mr-1.5 h-3 w-3" /> Live Premium Dashboard
              </Badge>
              <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Welcome back to <span className="text-gradient">MaternalCare</span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                Realtime maternal &amp; fetal vitals, AI-driven insights, and instant alerts — all in one place.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/80 px-4 py-3 shadow-soft backdrop-blur">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last update</p>
                  <p className="text-sm font-medium">{lastUpdatedLabel}</p>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="rounded-full border-slate-200 bg-white/80 backdrop-blur hover:bg-white"
              >
                <Link to="/questionnaire">
                  <ClipboardList className="mr-2 h-4 w-4" /> Daily Check-in
                </Link>
              </Button>

              <Button
                variant="ghost"
                className="rounded-full text-muted-foreground hover:text-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </motion.div>
          </div>

          {/* Quick chips */}
          <div className="mt-8 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 backdrop-blur">
              <Cloud className="h-3.5 w-3.5 text-primary" /> Firebase Live
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 backdrop-blur">
              <Radio className="h-3.5 w-3.5 text-secondary" /> Smart Sensors
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 backdrop-blur">
              <Bell className="h-3.5 w-3.5 text-rose-500" /> Realtime Alerts
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> HIPAA-ready
            </span>
          </div>
        </div>
      </section>

      {/* ===================== METRICS ===================== */}
      <section className="relative py-14">
        <div className="container mx-auto px-6">
          {/* Top metric row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <HeartPulse className="h-4 w-4 text-rose-500 pulse-heart" /> Heart Rate
                </CardTitle>
                <StatusChip status={hrStatus} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-4xl font-semibold">{heartRate || "--"}</span>
                  <span className="ml-1 text-sm text-muted-foreground">BPM</span>
                </div>
                <div className="-mx-2 h-20">
                  <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                    <LineGraph data={history.heartRate}>
                      <LineShape
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--accent-warm))"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive
                      />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={["auto", "auto"]} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </LineGraph>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Droplets className="h-4 w-4 text-primary" /> SpO₂
                </CardTitle>
                <StatusChip status={oxStatus} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-4xl font-semibold">{spo2 || "--"}</span>
                  <span className="ml-1 text-sm text-muted-foreground">%</span>
                </div>
                <div className="relative h-24">
                  <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                    <RadialBarChart
                      data={spo2Data}
                      startAngle={90}
                      endAngle={-270}
                      innerRadius="72%"
                      outerRadius="100%"
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={10} background fill="hsl(var(--primary))" />
                    </RadialBarChart>
                  </ChartContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-medium text-primary">
                    {spo2 ? `${spo2}%` : "—"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Thermometer className="h-4 w-4 text-secondary" /> Temperature
                </CardTitle>
                <StatusChip status={tStatus} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-4xl font-semibold">{temperature ? temperature.toFixed(1) : "--"}</span>
                  <span className="ml-1 text-sm text-muted-foreground">°C</span>
                </div>
                <div className="flex items-end gap-4">
                  <div className="relative h-20 w-7 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-primary to-secondary"
                      animate={{ height: `${tempLevel * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                    Smart thermometer tracks subtle shifts toward fever.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Wind className="h-4 w-4 text-primary" /> Respiration
                </CardTitle>
                <StatusChip status={rStatus} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-4xl font-semibold">{respiration || "--"}</span>
                  <span className="ml-1 text-sm text-muted-foreground">bpm</span>
                </div>
                <div className="flex items-center gap-4">
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Wind className="h-6 w-6 text-primary" />
                  </motion.div>
                  <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
                    Breath rhythm captured by acoustic sensing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second row */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Activity className="h-4 w-4 text-secondary" /> ECG Live Waveform
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Current value: <span className="font-medium text-foreground">{ecgReading || "—"} mV</span>
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full border-secondary/30 bg-secondary/5 text-secondary">
                  AD8232
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="h-44">
                  <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                    <LineGraph data={history.ecg}>
                      <defs>
                        <linearGradient id="ecgStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(var(--secondary))" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <LineShape
                        type="monotone"
                        dataKey="value"
                        stroke="url(#ecgStroke)"
                        strokeWidth={2.5}
                        dot={false}
                        isAnimationActive
                      />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={["auto", "auto"]} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </LineGraph>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft">
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Signal className="h-4 w-4 text-emerald-500" /> Pressure / Movement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-semibold">{pressure || "--"}</span>
                  <span className="ml-1 text-sm text-muted-foreground">AU</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Calm</span>
                    <span>Active</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400"
                      animate={{ width: `${Math.max(8, pressureLevel * 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
                <div className="h-20">
                  <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                    <BarChart data={history.pressure}>
                      <Bar dataKey="value" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Third row */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Activity className="h-4 w-4 text-primary" /> Multi-Vital Trend
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Heart rate, SpO₂ and temperature aligned in time.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--accent-warm))]" /> Heart
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /> SpO₂
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[hsl(var(--secondary))]" /> Temp
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--accent-warm))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--accent-warm))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="spo2Fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Area
                        type="monotone"
                        dataKey="heartRate"
                        stroke="hsl(var(--accent-warm))"
                        strokeWidth={2}
                        fill="url(#hrFill)"
                      />
                      <Area
                        type="monotone"
                        dataKey="spo2"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#spo2Fill)"
                      />
                      <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke="hsl(var(--secondary))"
                        strokeWidth={2}
                        fill="transparent"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-white/70 bg-gradient-to-br from-primary/10 via-white to-secondary/10 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Heart className="h-4 w-4 text-rose-500" /> Care Snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  All seven vital streams are flowing from your smart belt. The AI panel below interprets the latest
                  signals and the alert timeline tracks any moments worth a closer look.
                </p>
                <div className="rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Updated</p>
                  <p className="text-base font-medium text-foreground">{lastUpdatedLabel}</p>
                </div>
                <Button
                  asChild
                  className="w-full rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-glow"
                >
                  <Link to="/questionnaire">
                    <ClipboardList className="mr-2 h-4 w-4" /> Log today's check-in
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* AI Panel */}
          <div className="relative isolate mt-14 overflow-hidden rounded-[36px] p-0 sm:p-1">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-[36px] grid-3d opacity-60" />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-[32px] holo-border bg-gradient-to-br from-white/90 via-white/95 to-white/90 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(184,162,244,0.35)]"
            >
              <span className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl" />
              <span className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-accent/30 to-secondary/30 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 px-6 pt-6 text-xs font-medium uppercase tracking-wider text-primary">
                  <Brain className="h-4 w-4" /> AI Health Intelligence
                </div>
                <AIInsightPanel
                  vitals={{
                    heartRate: sensorData.maxHrBpm,
                    spo2: sensorData.maxSpO2,
                    temperature: sensorData.tempC,
                    respiration: sensorData.respBpm,
                    movement: sensorData.fsrAU,
                    online: sensorData.onLine,
                    ecgValue: ecgValue,
                    ecgLeadsOff: sensorData.ecgLeadsOff,
                    micLevel: sensorData.micLevel,
                    movementHistory: history.pressure.map((e) => e.value),
                    ecgHistory: history.ecg.map((e) => e.value),
                  }}
                  lastUpdated={lastUpdated}
                />
              </div>
            </motion.div>
          </div>

          {/* Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-10"
          >
            <AlertTimeline />
          </motion.div>

          {/* Back link */}
          <div className="mt-12 flex justify-center">
            <Button
              asChild
              variant="ghost"
              className="rounded-full text-muted-foreground hover:text-primary"
            >
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to homepage
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
