import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowUp,
  Baby,
  Bell,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  Globe2,
  Heart,
  LineChart,
  Mic,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Thermometer,
  Users,
  Wifi,
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
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Navigation } from "@/components/Navigation";
import { useRealtimeSensors } from "@/hooks/useRealtimeSensors";

const heroMessages = [
  "AI-powered pregnancy monitoring.",
  "Realtime maternal safety cloud.",
  "Luxury-grade fetal insights.",
];

const stats = [
  { label: "Continuous Sensors", value: 7 },
  { label: "Realtime Streams", value: 12 },
  { label: "Countries Piloting", value: 8 },
  { label: "Signal Accuracy", value: 99.2, suffix: "%" },
];

const features = [
  { icon: Activity, title: "Realtime Monitoring", text: "Instant vitals sync with millisecond updates." },
  { icon: Heart, title: "ECG + Heart Rate", text: "Clinical-grade ECG and bpm precision." },
  { icon: Thermometer, title: "Temperature", text: "Detect fever spikes early with smart alerts." },
  { icon: Wind, title: "Respiration", text: "Track respiratory rhythm and stress levels." },
  { icon: Bell, title: "Emergency Alerts", text: "Auto-escalation to doctors and caretakers." },
  { icon: Mic, title: "Sound & Movement", text: "Fetal activity mapped through micro acoustics." },
  { icon: ShieldCheck, title: "Secure Cloud", text: "HIPAA-ready Firebase data pipeline." },
  { icon: Wifi, title: "Always Connected", text: "Live status + offline detection safeguard." },
];

const futureScope = [
  {
    title: "AI Risk Prediction",
    text: "Predict complications weeks ahead using multimodal models and anomaly detection.",
  },
  {
    title: "Doctor Companion App",
    text: "Mobile alerts, notes, and instant telemedicine access with secure auth.",
  },
  {
    title: "Hospital Monitoring",
    text: "Multi-patient command center for maternity wards and emergency response.",
  },
];

const team = [
  {
    name: "Clinical Research",
    role: "Maternal-Fetal Specialists",
  },
  {
    name: "Hardware Engineering",
    role: "Sensor & Embedded Systems",
  },
  {
    name: "AI & Data",
    role: "Predictive Care Intelligence",
  },
];

const chartConfig = {
  heartRate: { label: "Heart Rate", color: "hsl(var(--primary))" },
  temperature: { label: "Temperature", color: "hsl(var(--secondary))" },
  spo2: { label: "SpO2", color: "hsl(var(--accent-warm))" },
  ecg: { label: "ECG", color: "hsl(var(--secondary))" },
  pressure: { label: "Pressure", color: "hsl(var(--primary))" },
  mic: { label: "Mic Level", color: "hsl(var(--accent-warm))" },
};

const SPLASH_SCREEN_DURATION_MS = 1300;
const MIC_BAR_COUNT = 8;
const MIC_BAR_BASE_HEIGHT = 20;
const MIC_BAR_MIN_INTENSITY = 0.15;
const MIC_BAR_SCALE = 60;
const MIC_BAR_INDEX_OFFSET = 2;
const MIC_BAR_INDEX_DIVISOR = 10;

// Default demo thresholds; adjust for clinical guidelines or deployments.
const ALERT_THRESHOLDS = {
  spo2Low: 95,
  feverTempC: 37.5,
  heartRateHigh: 120,
  heartRateLow: 55,
  sensorOfflineValue: 0,
};

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Scales mic visualizer bars based on intensity and index weighting.
const calculateMicBarHeight = (index: number, intensity: number) => {
  const clampedIntensity = Math.max(MIC_BAR_MIN_INTENSITY, intensity);
  const barScale = (index + MIC_BAR_INDEX_OFFSET) / MIC_BAR_INDEX_DIVISOR;
  return MIC_BAR_BASE_HEIGHT + clampedIntensity * MIC_BAR_SCALE * barScale;
};

const Landing = () => {
  const { sensorData, history, lastUpdated, ecgValue } = useRealtimeSensors();
  const [messageIndex, setMessageIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), SPLASH_SCREEN_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const current = heroMessages[messageIndex];
    const nextText = isDeleting
      ? current.slice(0, typedText.length - 1)
      : current.slice(0, typedText.length + 1);
    const speed = isDeleting ? 40 : 80;

    const timeout = setTimeout(() => {
      setTypedText(nextText);
      if (!isDeleting && nextText === current) {
        setIsDeleting(true);
      } else if (isDeleting && nextText.length === 0) {
        setIsDeleting(false);
        setMessageIndex((prev) => (prev + 1) % heroMessages.length);
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, messageIndex]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heartRate = sensorData.maxHrBpm ?? 0;
  const spo2 = sensorData.maxSpO2 ?? 0;
  const temperature = sensorData.tempC ?? 0;
  const respiration = sensorData.respBpm ?? 0;
  const pressure = sensorData.fsrAU ?? 0;
  const micLevel = sensorData.micLevel ?? 0;
  const onlineStatus = sensorData.onLine ?? 0;
  const ecgReading = ecgValue ?? 0;

  const alerts = useMemo(() => {
    const items: { title: string; description: string }[] = [];
    if (sensorData.maxSpO2 !== null && sensorData.maxSpO2 < ALERT_THRESHOLDS.spo2Low) {
      items.push({
        title: "Low Oxygen Alert",
        description: `SpO2 below ${ALERT_THRESHOLDS.spo2Low}% threshold.`,
      });
    }
    if (sensorData.tempC !== null && sensorData.tempC > ALERT_THRESHOLDS.feverTempC) {
      items.push({
        title: "Fever Alert",
        description: `Temperature above ${ALERT_THRESHOLDS.feverTempC.toFixed(1)}°C.`,
      });
    }
    if (sensorData.maxHrBpm !== null && sensorData.maxHrBpm > ALERT_THRESHOLDS.heartRateHigh) {
      items.push({
        title: "High Heart Rate",
        description: `Maternal heart rate above ${ALERT_THRESHOLDS.heartRateHigh} BPM.`,
      });
    }
    if (sensorData.maxHrBpm !== null && sensorData.maxHrBpm < ALERT_THRESHOLDS.heartRateLow) {
      items.push({
        title: "Low Heart Rate",
        description: `Maternal heart rate below ${ALERT_THRESHOLDS.heartRateLow} BPM.`,
      });
    }
    if (sensorData.onLine !== null && Number(sensorData.onLine) === ALERT_THRESHOLDS.sensorOfflineValue) {
      items.push({ title: "Sensor Offline", description: "No signal detected from the belt." });
    }
    return items;
  }, [sensorData.maxHrBpm, sensorData.maxSpO2, sensorData.tempC, sensorData.onLine]);

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "Awaiting data";

  const tempLevel = clampValue((temperature - 34) / 6, 0, 1);
  const micIntensity = clampValue(micLevel / 100, 0, 1);
  const pressureLevel = clampValue(pressure / 100, 0, 1);
  const respLevel = clampValue(respiration / 40, 0, 1);

  const spo2Data = [{ name: "SpO2", value: spo2, fill: "var(--color-spo2)" }];

  const multiMetricHistory = useMemo(
    () =>
      history.heartRate.map((entry, index) => ({
        time: entry.time,
        heartRate: entry.value,
        temperature: history.temperature[index]?.value ?? null,
        spo2: history.spo2[index]?.value ?? null,
      })),
    [history.heartRate, history.temperature, history.spo2],
  );

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-white dark:bg-slate-950"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center space-y-4">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse">
                <Heart className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Maternal Care</p>
              <p className="text-lg font-semibold text-gradient">Initializing Live Systems...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 bg-grid-soft opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-secondary/10" />

        <div className="relative container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="flex items-center gap-3 mb-6">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Live Cloud Connected
                </Badge>
              </div>

              <h1 className="text-4xl lg:text-6xl font-semibold leading-tight text-balance">
                Maternal Care
                <span className="block text-gradient">Smart Pregnancy Monitoring Belt</span>
              </h1>

              <p className="mt-4 text-lg text-muted-foreground max-w-xl text-balance">
                {typedText}
                <span className="ml-1 inline-block h-5 w-[2px] bg-primary align-middle animate-pulse" />
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button className="btn-hero" asChild>
                  <a href="#dashboard">View Live Dashboard</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="#about">Explore Product</a>
                </Button>
              </div>

              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <Card key={stat.label} className="glass-panel px-4 py-3 text-center">
                    <p className="text-2xl font-semibold text-foreground">
                      {stat.value}
                      {stat.suffix ?? ""}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </Card>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.1 }}
            >
              <div className="relative mx-auto w-full max-w-md aspect-square">
                <motion.div
                  className="absolute inset-0 rounded-[32%] bg-gradient-to-br from-primary/40 via-white/60 to-secondary/40 blur-2xl"
                  animate={{ opacity: [0.6, 0.9, 0.6] }}
                  transition={{ duration: 6, repeat: Infinity }}
                />
                <motion.div
                  className="relative z-10 h-full w-full rounded-[32%] glass-panel p-8"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                >
                  <div className="absolute inset-x-6 top-1/2 h-16 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/80 via-white to-secondary/80 shadow-glow" />
                  <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/80 shadow-warm" />
                  <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                    <Heart className="h-6 w-6 text-white pulse-heart" />
                  </div>
                  <div className="absolute left-12 top-10 flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-soft">
                    <Cloud className="h-3 w-3 text-primary" />
                    Live Sync
                  </div>
                  <div className="absolute right-12 bottom-12 flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs text-muted-foreground shadow-soft">
                    <Sparkles className="h-3 w-3 text-secondary" />
                    Smart Sensors
                  </div>
                </motion.div>
              </div>
              <div className="mt-8 flex justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  FDA-inspired safety
                </div>
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-primary" />
                  Realtime stream
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-gradient-to-b from-background to-muted/40">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div>
              <Badge className="bg-primary/10 text-primary border-primary/20">About Product</Badge>
              <h2 className="mt-4 text-3xl lg:text-4xl font-semibold text-balance">
                A premium maternal + fetal monitoring ecosystem designed for continuous peace of mind.
              </h2>
              <p className="mt-4 text-muted-foreground text-lg text-balance">
                Maternal Care pairs an intelligent wearable belt with an ESP32-powered sensor array and Firebase
                cloud streaming. Families and care teams can see vital signals in real time, detect anomalies early,
                and respond with confidence.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Card className="glass-panel px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Baby className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Fetal Wellbeing</p>
                      <p className="text-xs text-muted-foreground">Movement + heartbeat insights.</p>
                    </div>
                  </div>
                </Card>
                <Card className="glass-panel px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="font-medium">Clinical Ready</p>
                      <p className="text-xs text-muted-foreground">Professional-grade signals.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
            <div className="space-y-4">
              <Card className="glass-panel p-6">
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Smart Sensor Core</p>
                    <p className="text-xs text-muted-foreground">Adaptive calibration + noise filtering.</p>
                  </div>
                </div>
              </Card>
              <Card className="glass-panel p-6">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="font-medium">Firebase Cloud</p>
                    <p className="text-xs text-muted-foreground">Secure streaming + audit logs.</p>
                  </div>
                </div>
              </Card>
              <Card className="glass-panel p-6">
                <div className="flex items-center gap-3">
                  <Globe2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Global Care Network</p>
                    <p className="text-xs text-muted-foreground">Remote specialists always on standby.</p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Badge className="bg-secondary/10 text-secondary border-secondary/20">Core Features</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-semibold text-balance">
              Everything you need for premium maternal safety.
            </h2>
            <p className="mt-4 text-muted-foreground text-lg text-balance">
              Seven real-time signals, intelligent alerts, and cloud-first reliability.
            </p>
          </motion.div>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card className="glass-panel h-full metric-glow">
                    <CardHeader>
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="mt-4 text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{feature.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20">How It Works</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-semibold text-balance">
              Sensor Belt → ESP32 → Firebase → Live Dashboard
            </h2>
            <p className="mt-4 text-muted-foreground text-lg text-balance">
              A seamless data journey that prioritizes speed, accuracy, and reliability.
            </p>
          </motion.div>
          <div className="mt-10 grid md:grid-cols-4 gap-6 text-center">
            {[
              { title: "Sensor Belt", icon: Heart, text: "Smart textile + biomedical sensors." },
              { title: "ESP32 Core", icon: Cpu, text: "Edge processing & signal cleaning." },
              { title: "Firebase", icon: Database, text: "Realtime data lake + API." },
              { title: "Dashboard", icon: LineChart, text: "Instant insights everywhere." },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="glass-panel h-full">
                    <CardHeader className="items-center">
                      <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-secondary" />
                      </div>
                      <CardTitle className="mt-4 text-base">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{step.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live Dashboard */}
      <section id="dashboard" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Live Dashboard
              </Badge>
              <h2 className="mt-4 text-3xl lg:text-4xl font-semibold text-balance">
                Realtime maternal vitals streaming from Firebase.
              </h2>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${onlineStatus ? "bg-emerald-500" : "bg-rose-500"}`} />
                {onlineStatus ? "Sensor Online" : "Offline"}
              </div>
              <div className="h-4 w-px bg-border" />
              <div>Last updated: {lastUpdatedLabel}</div>
            </div>
          </motion.div>

          {alerts.length > 0 && (
            <div className="mt-6 space-y-3">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel flex items-center gap-3 border-destructive/30 bg-destructive/10 px-4 py-3"
                >
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            <Card className="glass-panel metric-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-rose-500 pulse-heart" />
                  Maternal Heart Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-semibold">{heartRate || "--"} BPM</div>
                <div className="text-xs text-muted-foreground">Live bpm stream from MAX30105.</div>
                <ChartContainer config={chartConfig}>
                  <LineGraph data={history.heartRate}>
                    <LineShape type="monotone" dataKey="value" stroke="var(--color-heartRate)" strokeWidth={2} dot={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </LineGraph>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel metric-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-primary" />
                  SpO2 Saturation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-semibold">{spo2 || "--"}%</div>
                <div className="text-xs text-muted-foreground">Oxygen level with radial gauge.</div>
                <div className="h-36">
                  <ChartContainer config={chartConfig}>
                    <RadialBarChart
                      data={spo2Data}
                      startAngle={90}
                      endAngle={-270}
                      innerRadius="70%"
                      outerRadius="100%"
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={10} background />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </RadialBarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel metric-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Thermometer className="h-4 w-4 text-secondary" />
                  Body Temperature
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-semibold">{temperature ? temperature.toFixed(1) : "--"}°C</div>
                <div className="flex items-end gap-4">
                  <div className="relative h-28 w-10 rounded-full bg-muted overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-full bg-gradient-to-t from-primary to-secondary"
                      style={{ height: `${tempLevel * 100}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Smart thermometer meter tracking subtle shifts.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Wind className="h-4 w-4 text-primary" />
                  Respiration Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-semibold">{respiration || "--"} bpm</div>
                <motion.div
                  className="h-20 w-20 rounded-full bg-primary/15 flex items-center justify-center"
                  animate={{ scale: [1, 1 + respLevel * 0.3, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                >
                  <Wind className="h-6 w-6 text-primary" />
                </motion.div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-secondary" />
                  ECG Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">Live ECG waveform</div>
                <div className="h-28">
                  <ResponsiveContainer>
                    <LineGraph data={history.ecg}>
                      <LineShape type="monotone" dataKey="value" stroke="var(--color-ecg)" strokeWidth={2} dot={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </LineGraph>
                  </ResponsiveContainer>
                </div>
                <div className="text-xs text-muted-foreground">Current ECG: {ecgReading || "--"} mV</div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Pressure / Movement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-semibold">{pressure || "--"} AU</div>
                <div className="h-24">
                  <ChartContainer config={chartConfig}>
                    <BarChart data={history.pressure}>
                      <Bar dataKey="value" fill="var(--color-pressure)" radius={[6, 6, 0, 0]} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    </BarChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid lg:grid-cols-3 gap-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Mic className="h-4 w-4 text-primary" />
                  Mic Level
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-semibold">{micLevel || "--"} dB</div>
                <div className="flex items-end gap-2 h-20">
                  {Array.from({ length: MIC_BAR_COUNT }).map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-full bg-primary/20"
                      style={{
                        height: `${calculateMicBarHeight(index, micIntensity)}%`,
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Wifi className="h-4 w-4 text-emerald-500" />
                  Sensor Online
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-semibold">{onlineStatus ? "Connected" : "Offline"}</div>
                <Badge className={onlineStatus ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}>
                  {onlineStatus ? "All sensors active" : "No signal detected"}
                </Badge>
                <div className="text-xs text-muted-foreground">Auto alert triggers on disconnect.</div>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Cloud className="h-4 w-4 text-secondary" />
                  Last Updated
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-3xl font-semibold">{lastUpdatedLabel}</div>
                <div className="text-xs text-muted-foreground">Realtime Firebase listeners in sync.</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Live values update instantly.
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-10 grid lg:grid-cols-3 gap-6">
            <Card className="glass-panel lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-primary" />
                  Live ECG Waveform
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ChartContainer config={chartConfig}>
                  <LineGraph data={history.ecg}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <LineShape type="monotone" dataKey="value" stroke="var(--color-ecg)" strokeWidth={2} dot={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </LineGraph>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5 text-secondary" />
                  SpO2 Radial
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <ChartContainer config={chartConfig}>
                  <RadialBarChart
                    data={spo2Data}
                    startAngle={90}
                    endAngle={-270}
                    innerRadius="60%"
                    outerRadius="100%"
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar dataKey="value" cornerRadius={10} background />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </RadialBarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid lg:grid-cols-2 gap-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-primary" />
                  Temperature Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ChartContainer config={chartConfig}>
                  <AreaChart data={history.temperature}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-temperature)" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="var(--color-temperature)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="var(--color-temperature)" fill="url(#tempGradient)" />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-secondary" />
                  Multi-Metric Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ChartContainer config={chartConfig}>
                  <LineGraph data={multiMetricHistory}>
                    <LineShape type="monotone" dataKey="heartRate" stroke="var(--color-heartRate)" strokeWidth={2} dot={false} />
                    <LineShape type="monotone" dataKey="temperature" stroke="var(--color-temperature)" strokeWidth={2} dot={false} />
                    <LineShape type="monotone" dataKey="spo2" stroke="var(--color-spo2)" strokeWidth={2} dot={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </LineGraph>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Future Scope */}
      <section id="future" className="py-20 bg-muted/40">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20">Future Scope</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-semibold text-balance">Built for tomorrow's care.</h2>
            <p className="mt-4 text-muted-foreground text-lg text-balance">
              The Maternal Care platform scales from the home to the hospital.
            </p>
          </motion.div>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {futureScope.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="glass-panel h-full">
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Badge className="bg-secondary/10 text-secondary border-secondary/20">Team</Badge>
            <h2 className="mt-4 text-3xl lg:text-4xl font-semibold text-balance">
              Built by clinicians, engineers, and product designers.
            </h2>
          </motion.div>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="glass-panel h-full text-center">
                  <CardHeader>
                    <div className="mx-auto h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="mt-4">{member.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft">
                  <Heart className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-semibold text-gradient">MaternalCare</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                A premium healthcare startup reimagining pregnancy monitoring through realtime biosensing and
                predictive intelligence.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
              <span>hello@maternalcare.health</span>
              <span>+1 (415) 000-2222</span>
              <span>San Francisco • Bangalore</span>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showTop && (
          <motion.button
            className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-white shadow-glow flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;
