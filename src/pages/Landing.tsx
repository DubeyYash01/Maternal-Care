import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ArrowUp,
  Baby,
  Bell,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Cpu,
  Database,
  Droplets,
  Github,
  Heart,
  HeartPulse,
  Hospital,
  Linkedin,
  Mail,
  Mic,
  Radio,
  ShieldCheck,
  Signal,
  Sparkles,
  Stethoscope,
  Thermometer,
  Twitter,
  Wifi,
  Wind,
  Zap,
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
import { Navigation } from "@/components/Navigation";
import { AIInsightPanel } from "@/components/AIInsightPanel";
import { useRealtimeSensors } from "@/hooks/useRealtimeSensors";

// =============================================================
// Constants
// =============================================================

const SPLASH_DURATION_MS = 1500;

const heroMessages = [
  "Real-Time Maternal & Fetal Monitoring.",
  "Clinical-grade signals. Anywhere, anytime.",
  "Peace of mind, woven into a smart belt.",
];

const trustItems = [
  { icon: Cpu, label: "IoT Powered" },
  { icon: Cloud, label: "Firebase Live" },
  { icon: Radio, label: "Smart Sensors" },
  { icon: Bell, label: "Realtime Alerts" },
];

const features = [
  { icon: HeartPulse, title: "Continuous Heart Rate", text: "Beat-to-beat precision via the MAX30105 optical sensor." },
  { icon: Droplets, title: "SpO₂ Saturation", text: "Track oxygen levels with a soft radial gauge." },
  { icon: Thermometer, title: "Body Temperature", text: "Detect early fever shifts with TMP117 accuracy." },
  { icon: Wind, title: "Respiration Rhythm", text: "Listen to breath patterns with INMP441 acoustics." },
  { icon: Activity, title: "ECG Waveform", text: "Clinical-grade ECG streamed live from AD8232." },
  { icon: Signal, title: "Pressure & Movement", text: "Sense fetal kicks and posture via FSR sensors." },
  { icon: Bell, title: "Smart Alerts", text: "Auto-escalate anomalies to doctors and family." },
  { icon: ShieldCheck, title: "HIPAA-ready Cloud", text: "Encrypted Firebase pipeline with audit trails." },
];

const aiScope = [
  {
    icon: Brain,
    title: "AI Risk Prediction",
    text: "Multimodal models forecast complications weeks ahead through anomaly detection.",
  },
  {
    icon: Stethoscope,
    title: "Doctor Companion",
    text: "Mobile companion app for instant alerts, notes, and secure telemedicine.",
  },
  {
    icon: Hospital,
    title: "Hospital Command Center",
    text: "Multi-patient maternity monitoring for wards and emergency teams.",
  },
];

const team = [
  { name: "Clinical Research", role: "Maternal-Fetal Specialists", initial: "C" },
  { name: "Hardware Engineering", role: "Sensor & Embedded Systems", initial: "H" },
  { name: "AI & Data", role: "Predictive Care Intelligence", initial: "A" },
  { name: "Product & Design", role: "Premium Care Experience", initial: "P" },
];

const stats = [
  { label: "Continuous Sensors", value: 7 },
  { label: "Realtime Streams", value: 12 },
  { label: "Pilot Countries", value: 8 },
  { label: "Signal Accuracy", value: 99.2, suffix: "%" },
];

const chartConfig: ChartConfig = {
  heartRate: { label: "Heart Rate", color: "hsl(var(--accent-warm))" },
  ecg: { label: "ECG", color: "hsl(var(--secondary))" },
  spo2: { label: "SpO2", color: "hsl(var(--primary))" },
  temperature: { label: "Temperature", color: "hsl(var(--accent-warm))" },
  pressure: { label: "Pressure", color: "hsl(var(--success))" },
  respiration: { label: "Respiration", color: "hsl(var(--secondary))" },
};

// =============================================================
// Helpers
// =============================================================

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

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

// =============================================================
// Subcomponents
// =============================================================

const CountUp = ({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) => {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => v.toFixed(decimals));
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const controls = animate(mv, to, { duration: 1.4, ease: "easeOut" });
    const unsub = rounded.on("change", (v) => setDisplay(v));
    return () => {
      controls.stop();
      unsub();
    };
  }, [to, mv, rounded]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
};

const Particles = () => {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 4,
        duration: 8 + Math.random() * 8,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 blur-[2px]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -40, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
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

const SmartBelt = () => (
  <div className="relative mx-auto aspect-square w-full max-w-[460px]">
    {/* halo */}
    <motion.div
      className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 blur-3xl"
      animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />

    {/* expanding rings */}
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="absolute inset-0 rounded-full border border-primary/30"
        animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: i * 1, ease: "easeOut" }}
      />
    ))}

    {/* belt body */}
    <motion.div
      className="absolute inset-8 rounded-[44%] bg-gradient-to-br from-white via-white to-rose-50 shadow-[0_30px_80px_-20px_rgba(184,162,244,0.55)] border border-white/80 backdrop-blur-xl"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* belt strap */}
      <div className="absolute inset-x-4 top-1/2 h-12 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/80 via-white to-secondary/80 shadow-glow" />

      {/* central sensor */}
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 border border-white shadow-2xl flex items-center justify-center">
        <motion.div
          className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Heart className="h-8 w-8 text-white" />
        </motion.div>
      </div>

      {/* floating chips */}
      <motion.div
        className="absolute -left-2 top-10 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-soft border border-white"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Cloud className="h-3.5 w-3.5 text-primary" />
        Live Sync
      </motion.div>
      <motion.div
        className="absolute -right-3 bottom-12 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-soft border border-white"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-3.5 w-3.5 text-secondary" />
        Smart AI
      </motion.div>
      <motion.div
        className="absolute right-4 top-6 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-soft border border-white"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        Secure
      </motion.div>
    </motion.div>
  </div>
);

// =============================================================
// Main
// =============================================================

const Landing = () => {
  const { sensorData, history, lastUpdated, ecgValue } = useRealtimeSensors();

  const [isLoading, setIsLoading] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showTop, setShowTop] = useState(false);

  // splash
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  // typewriter
  useEffect(() => {
    const current = heroMessages[messageIndex];
    const next = deleting ? current.slice(0, typed.length - 1) : current.slice(0, typed.length + 1);
    const speed = deleting ? 35 : 60;
    const t = setTimeout(() => {
      setTyped(next);
      if (!deleting && next === current) setTimeout(() => setDeleting(true), 1400);
      else if (deleting && next.length === 0) {
        setDeleting(false);
        setMessageIndex((i) => (i + 1) % heroMessages.length);
      }
    }, speed);
    return () => clearTimeout(t);
  }, [typed, deleting, messageIndex]);

  // back to top
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // derived metrics
  const heartRate = sensorData.maxHrBpm ?? 0;
  const spo2 = sensorData.maxSpO2 ?? 0;
  const temperature = sensorData.tempC ?? 0;
  const respiration = sensorData.respBpm ?? 0;
  const pressure = sensorData.fsrAU ?? 0;
  const micLevel = sensorData.micLevel ?? 0;
  const onlineStatus = sensorData.onLine ?? 0;
  const ecgReading = ecgValue ?? 0;

  const hrStatus = heartRateStatus(sensorData.maxHrBpm);
  const oxStatus = spo2Status(sensorData.maxSpO2);
  const tStatus = tempStatus(sensorData.tempC);
  const rStatus = respStatus(sensorData.respBpm);

  const tempLevel = clamp((temperature - 34) / 6, 0, 1);
  const pressureLevel = clamp(pressure / 100, 0, 1);
  const micIntensity = clamp(micLevel / 100, 0, 1);

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

  const alerts = useMemo(() => {
    const items: { title: string; description: string; status: Status }[] = [];
    if (oxStatus === "critical")
      items.push({ title: "Low Oxygen", description: `SpO₂ at ${spo2}% — below 90% threshold.`, status: "critical" });
    else if (oxStatus === "warning")
      items.push({ title: "Oxygen Watch", description: `SpO₂ at ${spo2}% — monitor closely.`, status: "warning" });

    if (tStatus === "critical")
      items.push({ title: "High Fever", description: `Temperature ${temperature.toFixed(1)}°C.`, status: "critical" });
    else if (tStatus === "warning")
      items.push({ title: "Temperature Watch", description: `Temperature ${temperature.toFixed(1)}°C.`, status: "warning" });

    if (hrStatus === "critical")
      items.push({ title: "Heart Rate Critical", description: `${heartRate} BPM — outside safe range.`, status: "critical" });
    else if (hrStatus === "warning")
      items.push({ title: "Heart Rate Watch", description: `${heartRate} BPM — borderline.`, status: "warning" });

    if (Number(onlineStatus) === 0 && lastUpdated)
      items.push({ title: "Sensor Offline", description: "Belt is currently offline.", status: "warning" });

    if (items.length === 0)
      items.push({ title: "All Systems Healthy", description: "Vitals within normal range.", status: "healthy" });

    return items;
  }, [hrStatus, oxStatus, tStatus, heartRate, spo2, temperature, onlineStatus, lastUpdated]);

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Awaiting data";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Splash */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-white"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col items-center gap-5">
              <motion.div
                className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-glow"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart className="h-9 w-9 text-white" />
              </motion.div>
              <div className="text-center">
                <p className="text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">Maternal Care</p>
                <p className="mt-2 text-lg font-semibold text-gradient">Initializing Live Systems…</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-sky-50" />
          <div className="absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 blur-3xl" />
          <div className="absolute inset-0 bg-grid-soft opacity-40" />
        </div>
        <Particles />

        <div className="container relative mx-auto px-6 pt-20 pb-28 lg:pt-28 lg:pb-36">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <Badge className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15">
                <Sparkles className="mr-1.5 h-3 w-3" /> Premium Maternal Tech
              </Badge>

              <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                Real-Time Maternal &amp;{" "}
                <span className="text-gradient">Fetal Monitoring</span> woven into a smart belt.
              </h1>

              <p className="max-w-xl text-balance text-lg text-muted-foreground sm:text-xl">
                A clinical-grade wearable that streams seven vital signals to families and care teams in milliseconds.
              </p>

              <div className="flex h-7 items-center text-sm font-medium text-primary">
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span>{typed}</span>
                <span className="ml-1 inline-block h-4 w-[2px] animate-pulse bg-primary" />
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-primary to-secondary px-7 py-6 text-base font-medium text-white shadow-glow transition-all hover:scale-[1.03] hover:shadow-[0_0_60px_hsl(var(--secondary)/0.4)]"
                  asChild
                >
                  <a href="#dashboard">
                    Explore Live Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-slate-200 bg-white/70 px-7 py-6 text-base backdrop-blur hover:bg-white"
                  asChild
                >
                  <Link to="/login">Get Started</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
                {stats.map((s) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="rounded-2xl border border-white/60 bg-white/60 px-4 py-3 backdrop-blur-xl shadow-soft"
                  >
                    <p className="text-2xl font-semibold text-foreground">
                      <CountUp to={s.value} suffix={s.suffix ?? ""} decimals={s.suffix === "%" ? 1 : 0} />
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.1 }}
              className="relative"
            >
              <SmartBelt />
              <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 backdrop-blur">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> FDA-inspired safety
                </span>
                <span className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 backdrop-blur">
                  <Wifi className="h-4 w-4 text-primary" /> 5G &amp; Wi-Fi ready
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== TRUST BAR ===================== */}
      <section className="border-y border-border/60 bg-white">
        <div className="container mx-auto px-6 py-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {trustItems.map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="flex items-center justify-center gap-3 text-muted-foreground"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium uppercase tracking-wider text-foreground/80">{t.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== ABOUT ===================== */}
      <section id="about" className="py-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
          >
            <div className="space-y-6">
              <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                About the Product
              </Badge>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                A premium maternal &amp; fetal monitoring ecosystem designed for{" "}
                <span className="text-gradient">continuous peace of mind.</span>
              </h2>
              <p className="text-balance text-lg leading-relaxed text-muted-foreground">
                Maternal Care pairs an intelligent wearable belt with an ESP32-powered sensor array and Firebase
                cloud streaming. Families and care teams see vital signals in real time, detect anomalies early,
                and respond with confidence.
              </p>

              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                {[
                  { icon: Baby, title: "Fetal Wellbeing", text: "Movement and heartbeat insights." },
                  { icon: Stethoscope, title: "Clinical Ready", text: "Professional-grade signals." },
                  { icon: Database, title: "Firebase Cloud", text: "Secure streaming with audit logs." },
                  { icon: ShieldCheck, title: "Privacy First", text: "Encrypted, HIPAA-aligned." },
                ].map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="flex items-start gap-3 rounded-2xl border border-border/60 bg-white p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-glow"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-muted-foreground">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works visual */}
            <div className="relative">
              <div className="absolute inset-0 -z-10 rounded-[40px] bg-gradient-to-br from-primary/15 via-accent/15 to-secondary/15 blur-2xl" />
              <Card className="overflow-hidden rounded-[32px] border-white/60 bg-white/80 backdrop-blur-xl shadow-soft">
                <CardContent className="p-8">
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">Data Pipeline</p>
                  <div className="mt-6 space-y-3">
                    {[
                      { icon: Heart, label: "Sensor Belt", sub: "Captures 7 live signals" },
                      { icon: Cpu, label: "ESP32 Edge", sub: "Adaptive calibration" },
                      { icon: Cloud, label: "Firebase Realtime", sub: "Encrypted streaming" },
                      { icon: Activity, label: "Live Dashboard", sub: "Family + clinicians" },
                    ].map(({ icon: Icon, label, sub }, i) => (
                      <div key={label} className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 rounded-2xl border border-border/60 bg-white p-3 shadow-soft">
                          <p className="text-sm font-semibold">{label}</p>
                          <p className="text-xs text-muted-foreground">{sub}</p>
                        </div>
                        {i < 3 && <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/40" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="features" className="bg-gradient-to-b from-white to-rose-50/40 py-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-2xl text-center"
          >
            <Badge variant="outline" className="rounded-full border-secondary/30 bg-secondary/10 text-secondary">
              Core Features
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Everything you need for{" "}
              <span className="text-gradient">premium maternal safety.</span>
            </h2>
            <p className="mt-5 text-balance text-lg text-muted-foreground">
              Seven realtime signals, intelligent alerts, and cloud-first reliability — beautifully integrated.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Card className="group h-full rounded-3xl border-white bg-white p-2 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-glow">
                    <CardHeader className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary transition-transform duration-500 group-hover:scale-110">
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg font-semibold">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== LIVE DASHBOARD ===================== */}
      <section id="dashboard" className="relative py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sky-50/40 via-white to-white" />
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
          >
            <div className="space-y-4">
              <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                Live Dashboard
              </Badge>
              <h2 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                Realtime vitals streaming from the belt to your screen.
              </h2>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white px-4 py-3 shadow-soft">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Last update</p>
                <p className="text-sm font-medium">{lastUpdatedLabel}</p>
              </div>
            </div>
          </motion.div>

          {/* Top metric row */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Heart rate */}
            <Card className="overflow-hidden rounded-3xl border-white/70 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-glow">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Heart className="h-4 w-4 text-rose-500 pulse-heart" /> Heart Rate
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

            {/* SpO2 */}
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

            {/* Temperature */}
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

            {/* Respiration */}
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
            {/* ECG wide */}
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

            {/* Pressure / movement */}
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

                {/* Animated bar */}
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
            {/* Trend graph 2-cols */}
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

            {/* Alerts + Sensor status */}
            <div className="space-y-6">
              <Card className="rounded-3xl border-white/70 bg-white shadow-soft">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Bell className="h-4 w-4 text-primary" /> Alerts
                  </CardTitle>
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
                    {alerts.length}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {alerts.map((a, i) => {
                    const s = statusStyle[a.status];
                    return (
                      <motion.div
                        key={`${a.title}-${i}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className={`flex items-start gap-3 rounded-2xl border p-3 ${s.chip}`}
                      >
                        <div className={`mt-1 h-2 w-2 rounded-full ${s.dot}`} />
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs opacity-80">{a.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-white/70 bg-white shadow-soft">
                <CardHeader className="space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mic className="h-4 w-4 text-secondary" /> Sensor Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-primary" /> Belt Online
                    </span>
                    <StatusChip status={Number(onlineStatus) === 1 ? "healthy" : "warning"} />
                  </div>

                  {/* Mic visualizer */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Mic Level</span>
                      <span className="font-medium text-foreground">{Math.round(micLevel)}</span>
                    </div>
                    <div className="flex h-12 items-end gap-1">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const phase = (i + 1) / 24;
                        const base = 0.2 + (i % 3) * 0.05;
                        const target = clamp(base + micIntensity * (0.4 + phase * 0.6), 0.1, 1);
                        return (
                          <motion.div
                            key={i}
                            className="flex-1 rounded-full bg-gradient-to-t from-primary to-secondary"
                            animate={{ height: `${target * 100}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI Health Intelligence */}
          <div className="mt-6">
            <AIInsightPanel
              vitals={{
                heartRate: sensorData.maxHrBpm,
                spo2: sensorData.maxSpO2,
                temperature: sensorData.tempC,
                respiration: sensorData.respBpm,
                movement: sensorData.fsrAU,
                online: sensorData.onLine,
              }}
              lastUpdated={lastUpdated}
            />
          </div>
        </div>
      </section>

      {/* ===================== FUTURE AI ===================== */}
      <section id="future" className="relative overflow-hidden bg-gradient-to-b from-white via-rose-50/40 to-sky-50/40 py-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <Badge variant="outline" className="rounded-full border-secondary/30 bg-secondary/10 text-secondary">
              The Road Ahead
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Tomorrow's care, <span className="text-gradient">predicted today.</span>
            </h2>
            <p className="mt-5 text-balance text-lg text-muted-foreground">
              Predictive intelligence, doctor companions, and full hospital integrations are next.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {aiScope.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className="group relative h-full overflow-hidden rounded-3xl border-white/60 bg-white p-2 shadow-soft transition hover:-translate-y-2 hover:shadow-glow">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent-warm opacity-70" />
                    <CardHeader className="space-y-4 pt-8">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 text-primary transition-transform duration-500 group-hover:rotate-6">
                        <Icon className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-xl">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="leading-relaxed text-muted-foreground">{s.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== TEAM ===================== */}
      <section id="team" className="py-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 text-primary">
              Our Team
            </Badge>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              The minds behind <span className="text-gradient">Maternal Care.</span>
            </h2>
            <p className="mt-5 text-balance text-lg text-muted-foreground">
              A multidisciplinary team blending clinicians, engineers, and designers.
            </p>
          </motion.div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
              >
                <Card className="group relative overflow-hidden rounded-3xl border-white/70 bg-white p-2 shadow-soft transition hover:-translate-y-2 hover:shadow-glow">
                  <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl font-semibold text-white shadow-glow transition-transform duration-500 group-hover:scale-110">
                      {m.initial}
                    </div>
                    <div>
                      <p className="text-base font-semibold">{m.name}</p>
                      <p className="text-sm text-muted-foreground">{m.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA + FOOTER ===================== */}
      <section className="px-6 pb-16">
        <div className="container mx-auto overflow-hidden rounded-[40px] bg-gradient-to-br from-primary via-secondary to-accent-warm p-10 text-white shadow-glow sm:p-16">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div className="space-y-4">
              <Badge className="border-white/30 bg-white/10 text-white">Ready when you are</Badge>
              <h3 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
                Bring premium maternal monitoring to your family or hospital.
              </h3>
              <p className="max-w-xl text-balance text-white/90">
                Get early access to the Maternal Care wearable belt and the live cloud dashboard.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-start gap-3 lg:justify-end">
              <Button
                size="lg"
                className="rounded-full bg-white px-7 py-6 text-base font-medium text-primary shadow-soft hover:bg-white/90"
                asChild
              >
                <Link to="/login">Get Started</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-transparent px-7 py-6 text-base text-white hover:bg-white/10"
                asChild
              >
                <Link to="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-white">
        <div className="container mx-auto grid gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary shadow-soft">
                <Heart className="h-4 w-4 text-white" />
              </span>
              <span className="text-lg font-semibold text-gradient">MaternalCare</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Premium real-time monitoring for moms and babies, everywhere.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Product</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary">Features</a></li>
              <li><a href="#dashboard" className="hover:text-primary">Live Dashboard</a></li>
              <li><a href="#future" className="hover:text-primary">Future</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Company</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#about" className="hover:text-primary">About</a></li>
              <li><a href="#team" className="hover:text-primary">Team</a></li>
              <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Stay in touch</p>
            <div className="mt-4 flex items-center gap-3 text-muted-foreground">
              <a href="#" className="rounded-full border border-border/70 p-2 hover:text-primary"><Twitter className="h-4 w-4" /></a>
              <a href="#" className="rounded-full border border-border/70 p-2 hover:text-primary"><Linkedin className="h-4 w-4" /></a>
              <a href="#" className="rounded-full border border-border/70 p-2 hover:text-primary"><Github className="h-4 w-4" /></a>
              <a href="#" className="rounded-full border border-border/70 p-2 hover:text-primary"><Mail className="h-4 w-4" /></a>
            </div>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
            <p>© {new Date().getFullYear()} Maternal Care. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-rose-500" /> for safer pregnancies.
            </p>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="totop"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-glow transition hover:scale-110"
            aria-label="Back to top"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
